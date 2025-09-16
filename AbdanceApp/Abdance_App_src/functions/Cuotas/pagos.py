import mercadopago
import os
import hashlib
import hmac
from numbers import Number
from datetime import datetime
from pydantic import ValidationError
from functions.Otros.utilidades_datetime import TIME_ZONE
from firebase_init import db  # Firebase con base de datos inicializada
from functions.Usuarios.auth_decorator import require_auth
from functions.Cuotas.utilidades_cuotas import get_monto_cuota, ordenar_datos_cuotas, METODOS_PAGO, enviar_email_pago_cuota
from functions.Cuotas.query_cuotas_classes import CuotasQuery
from functions.Estadisticas.estadisticas import incrementar_estadistica_anio, incrementar_estadistica_mes
from dotenv import load_dotenv
from zoneinfo import ZoneInfo
from google.cloud.firestore_v1.base_query import FieldFilter


@require_auth(required_roles=['alumno', 'admin'])
def crear_preferencia_cuota(request, uid=None, role=None):
    try:
        data = request.get_json(silent=True) or {}
        cuota_id = data.get('cuota_id')

        #Verifica que no falten datos.
        if not data or 'cuota_id' not in data:
            return {'error': 'El id de la cuota (cuota_id) es requerido obligatoriamente.'}, 400  

        load_dotenv()
        # DIA_RECARGO = os.getenv("DIA_RECARGO")
        dia_recargo = 11  #int(DIA_RECARGO)

        #Valida los datos de entrada
        try: 
            validation_args = {
                'dia_recargo': dia_recargo,
                'dniAlumno': None,
                'idDisciplina': None,
                'cuota_id': cuota_id,
                'limite_query': 1,
            }
            CuotasQuery.model_validate(validation_args)
        except ValidationError as e:
            return {'error': e.errors(include_url=False, include_context=False)}, 400


        cuota_ref = db.collection('cuotas').document(cuota_id)
        cuota_doc = cuota_ref.get()
        cuota_data = None

        if cuota_doc.exists: 
            cuota_data = cuota_doc.to_dict()
            data_tuple = get_monto_cuota(cuota_id, dia_recargo)
            precio_cuota = data_tuple[0]
            tipo_monto = data_tuple[1]

            cuota_data = ordenar_datos_cuotas(cuota_data, precio_cuota, cuota_doc.id, tipo_recargo=tipo_monto)
        else:
            return {'error': "Cuota no encontrada."}, 404
        
        disciplina_doc = db.collection("disciplinas").document(cuota_data["idDisciplina"]).get()
        if not disciplina_doc.exists:
            return {'error': "Esta cuota no pertenece a ninguna disciplina."}, 500
        
        #Conversión de del precio a entero si es que hace falta.
        try: 
            precio_unitario = int(cuota_data['precio_cuota'])
        except ValueError as e:
            return {'error': "¡El precio de la cuota no es un entero válido!."}, 500

        disciplina_data = disciplina_doc.to_dict()

        #Luego, si todo fue bien, obtiene los datos del .env
        PROD_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN_TEST")

        mercado_pago_sdk = mercadopago.SDK(str(PROD_ACCESS_TOKEN))

        #Creacion de la preferencia
        preference_data = {
            "items": [
                {
                    "title": f"Cuota {cuota_data['concepto']}",
                    "quantity": 1,
                    "unit_price": precio_unitario,
                    "currency_id": "ARS",
                    "description": f"Cuota del mes de {cuota_data['concepto']}, para alumno con DNI: {cuota_data['dniAlumno']}, de la disciplina: {disciplina_data['nombre']}.",
                }
            ],
            "back_urls": {
                "success": "https://abdance-app-frontend-f6awegxqw-camilos-projects-fd28538a.vercel.app/dashboard/cuotas",
                "failure": "https://abdance-app-frontend-f6awegxqw-camilos-projects-fd28538a.vercel.app/dashboard/cuotas",
                "pending": "https://abdance-app-frontend-f6awegxqw-camilos-projects-fd28538a.vercel.app/dashboard/cuotas",
            },
            "payment_methods": {
                "excluded_payment_methods": [
                {
                    "id": ""
                }
                ],
                "excluded_payment_types": [
                {
                    "id": "ticket"
                }
                ]
            },
            "external_reference": f"{cuota_data['id']}",
            "metadata": {
                "tipo_objeto_a_pagar": "cuota"
            }
        }
        preference_response = mercado_pago_sdk.preference().create(preference_data)
        preference = preference_response["response"]

        return preference, 200 
    
    except Exception as e:
        return {'error': str(e)}, 500


def establecer_pago(data_payment):
    PROD_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN_TEST")
    mercado_pago_sdk = mercadopago.SDK(str(PROD_ACCESS_TOKEN))

    #Obtiene información del pago
    informacion_pago = mercado_pago_sdk.payment().get(data_payment)
    pago = informacion_pago["response"]
    id_objeto = pago.get("external_reference")
    tipo_objeto = pago.get("metadata", {}).get("tipo_objeto_a_pagar").lower()
    status_pago = pago.get("status")
    cantidad_transaccion = pago.get("transaction_amount")

    if status_pago == "approved" and id_objeto and tipo_objeto == "cuota":
        cuota_ref = db.collection('cuotas').document(id_objeto)

        if cuota_ref.get().to_dict().get("estado", "").lower() == "pagada":
            raise LookupError("La cuota buscada ya está pagada.")
        
        enviar_email_pago_cuota(id_objeto, cantidad_transaccion)
        
        raw_date = pago.get("date_approved")
        dt = datetime.fromisoformat(raw_date)                  
        dt_local = dt.astimezone(ZoneInfo(TIME_ZONE))
        incrementar_estadistica_anio(dt_local, cantidad_transaccion)
        incrementar_estadistica_mes(dt_local, cantidad_transaccion, id_objeto)

        #Traducción y formateo del Metodo de Pago (para que se pueda entender)
        metodo_pago: str = pago.get('payment_type_id')
        metodo_pago_traducido = METODOS_PAGO.get(metodo_pago) if metodo_pago in METODOS_PAGO else metodo_pago
        
        cuota_ref.update({
            'estado': 'pagada',
            'fechaPago': dt_local,
            'metodoPago': metodo_pago_traducido,
            'montoPagado': cantidad_transaccion
        })


def pagar_cuota(request):
    try:
        #Obtiene el ID de la request y la firma de la notificación.
        request_id = request.headers.get("X-Request-Id")
        signature = request.headers.get("X-Signature")

        #Obtiene los datos del body y la query de la notificacion.
        data = request.get_json(silent=True) or {}
        parametros_query = request.args
        data_id = parametros_query.get("data.id")

        #Parte la firma en sus dos partes correspondientes y crea las variables donde se pondrán.
        partes_signature = signature.split(",")
        timestamp = None
        hash_v1 = None

        #Itera sobre cada una para asignar sus valores a cada parte.
        for parte in partes_signature:
            key_value = parte.split("=", 1)
            if len(key_value) == 2:
                key = key_value[0].strip() 
                value = key_value[1].strip() 

                if key == "ts":
                    timestamp = value
                elif key == "v1":
                    hash_v1 = value

        load_dotenv()
        WEBHOOK_KEY = os.getenv("MP_WEBHOOK_KEY")
        
        #Creación del manifiesto y codificación de la firma
        manifiesto = f"id:{data_id};request-id:{request_id};ts:{timestamp};"
        firma_hmac = hmac.new(WEBHOOK_KEY.encode(), msg=manifiesto.encode(), digestmod=hashlib.sha256)
        resultado_sha = firma_hmac.hexdigest()

        if resultado_sha == hash_v1:
            topic = parametros_query.get("type")

            if topic == "payment":
                establecer_pago(data["data"]["id"])

            return {"received": "true"}, 200
        else:
            return '', 200
    
    except Exception as e:
        return {'error': str(e)}, 500


@require_auth(required_roles=['admin'])
def pagar_cuotas_manualmente(request_cuotas_id, uid=None, role=None):
    try:
        data = request_cuotas_id.get_json(silent=True) or {}
        lista_cuotas_id = data.get("lista_cuotas", [])

        if not isinstance(lista_cuotas_id, list) or not lista_cuotas_id:
            return {'error': "El campo de \"lista_cuotas\" no es una lista o no está definido."}, 400
        if len(lista_cuotas_id) > 100:
            return {'error': "¡Se están intentando pagar muchas cuotas a la vez!."}, 400

        for dict_cuota in lista_cuotas_id:
            for id_cuota, valor_pagar in dict_cuota.items():
                cuota_ref = db.collection('cuotas').document(id_cuota)
                cuota_doc = cuota_ref.get()
        
                cuota_dict = cuota_doc.to_dict()
                if cuota_dict.get('estado').lower() == 'pagada':
                    return {'error': 'Una o varias cuotas ya están pagadas.'}, 400
                
                monto_pagado = valor_pagar
                if not isinstance(monto_pagado, Number):
                    return {'error': '¡Uno de los valores no es un numero!.'}, 400

                #SE ASUME QUE EL PAGO SE HACE EN EFECTIVO
                if cuota_doc.exists: 
                    cuota_ref.update({
                    'estado': 'pagada',
                    'fechaPago': datetime.now(ZoneInfo(TIME_ZONE)),
                    'metodoPago': "En site",
                    'montoPagado': monto_pagado
                })
                else:
                    return {'error':'Una cuota no fue encontrada.'}, 404
        
        return "Cuotas pagadas manualmente con éxito.", 200

    except Exception as e:
        return {'error': str(e)}, 500