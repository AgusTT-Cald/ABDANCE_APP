import mercadopago
import os
from datetime import datetime
from pydantic import ValidationError
from firebase_init import db  # Firebase con base de datos inicializada
from functions.Usuarios.auth_decorator import require_auth
from functions.Cuotas.utilidades_cuotas import get_monto_cuota, ordenar_datos_cuotas, METODOS_PAGO, enviar_email_pago_cuota
from functions.Cuotas.query_cuotas_classes import CuotasQuery
from dotenv import load_dotenv
from zoneinfo import ZoneInfo


@require_auth(required_roles=['alumno', 'admin'])
def crear_preferencia_cuota(request, uid=None, role=None):
    try:
        data = request.get_json(silent=True) or {}
        cuota_id = data.get('cuota_id')
        dia_recargo = data.get('dia_recargo')

        #Verifica que no falten datos.
        if not data or 'cuota_id' not in data or 'dia_recargo' not in data:
            return {'error': 'El dia de recargo (dia_recargo) y el id de la cuota (cuota_id) son requeridos obligatoriamente.'}, 400  

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
        dt = datetime.fromisoformat(raw_date)                  # crea datetime con tzinfo
        dt_local = dt.astimezone(ZoneInfo("America/Argentina/Buenos_Aires"))

        #Traducción y formateo del Metodo de Pago (para que se pueda entender)
        metodo_pago: str = pago.get('payment_type_id')
        metodo_pago_traducido = METODOS_PAGO.get(metodo_pago) if metodo_pago in METODOS_PAGO else metodo_pago
        
        cuota_ref.update({
            'estado': 'pagada',
            'fechaPago': dt_local,
            'metodoPago': metodo_pago_traducido,
            'montoPagado': cantidad_transaccion
        })
