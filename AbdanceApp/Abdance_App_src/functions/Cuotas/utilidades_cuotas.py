""" Un archivo que contiene utilidades para los archivos de la carpeta de Cuotas
(existe mas que nada para evitar un error de dependencia circular) """
from collections import OrderedDict
from firebase_init import db  # Firebase con base de datos inicializada
from datetime import datetime
from zoneinfo import ZoneInfo
from google.cloud.firestore_v1.base_query import FieldFilter
from google.cloud import firestore
from functions.Otros.utilidades_datetime import (
    TIME_ZONE,
    MESES
)

METODOS_PAGO = {
    "account_money": "Dinero de cuenta",
    "ticket": "Ticket",
    "bank_transfer": "Transferencia",
    "credit_card": "Tarjet. Credito",
    "debit_card": "Tarjet. Debito",
    "prepaid_card": "Tarjet. Prepaga"
}

def ordenar_datos_cuotas(data_cuota, precio_cuota, cuota_id, disciplina_id=None):   
    """Ordena los datos de las cuotas en un formato especifico.

    Args:
        data_cuota (Dict): Diccionario de datos.
        precio_cuota (Number): Precio de la cuota.
        cuota_id (String): ID de la cuota a ordenar.

    Returns:
        OrderedDict: Datos de la cuota ordenados en formato de Diccionario.
    """
    cuota_data = OrderedDict()
    cuota_data["id"] = cuota_id
    cuota_data["concepto"] = data_cuota.get("concepto")
    cuota_data["dniAlumno"] = data_cuota.get("dniAlumno")
    cuota_data["estado"] = data_cuota.get("estado")
    cuota_data["fechaPago"] = data_cuota.get("fechaPago")
    cuota_data["idDisciplina"] = data_cuota.get("idDisciplina")
    cuota_data["metodoPago"] = data_cuota.get("metodoPago")
    cuota_data["precio_cuota"] = precio_cuota
    
    id_disciplina = disciplina_id if disciplina_id is not None else data_cuota.get("idDisciplina")
    disciplina = db.collection('disciplinas').document(id_disciplina).get().to_dict()
    cuota_data["nombreDisciplina"] = disciplina.get("nombre")
        
    return cuota_data


def get_monto_cuota(cuota_id, recargo_day):
    """Obtiene el precio de una cuota especifica, usando un dia de recargo especifico.

    Args:
        cuota_id (String): ID de la cuota.
        recargo_day (Integer): Numero entero del dia de recargo.

    Returns:
        Number: Retorna el monto de la cuota o lanza un error si algo va mal.
    """
    cuota_ref = db.collection('cuotas').document(cuota_id)
    cuota_doc = cuota_ref.get()
    if not cuota_doc.exists:
        return {'error':'Una de las cuotas no fue encontrada.'}, 404
    
    #Retorno temprano si la cuota ya se pagó.
    cuota_data = cuota_doc.to_dict()
    if cuota_doc.get("estado").lower() == "pagada" or cuota_doc.get("montoPagado") != 0:
        return cuota_doc.get("montoPagado")

    disciplina_id = cuota_data.get("idDisciplina")
    if not disciplina_id:
        return {'error':'Una de las cuotas no tiene disciplina asignada.'}, 400
    
    disciplina_ref = db.collection("disciplinas").document(disciplina_id)
    disciplina_doc = disciplina_ref.get()
    if not disciplina_doc.exists:
        return {'error':'Una de las disciplinas no fue encontrada o no existe.'}, 400
    
    precios = disciplina_doc.to_dict().get("precios", {})

    return determinar_monto(precios, cuota_data, int(recargo_day))


def determinar_monto(precios, cuota_data, recargo_day):
    concepto_cuota = cuota_data.get("concepto")
    estado_cuota = cuota_data.get("estado", "").lower()
    fecha_pago_cuota = cuota_data.get("fechaPago")

    #Retorno de matricula
    if concepto_cuota == "matricula":
        return precios.get("matriculaAnual")
    
    #Calculo y Retorno de montoRecargo
    today = datetime.now(ZoneInfo(TIME_ZONE))

    def en_recargo(dt: datetime):
        # dt aquí ya será tz-aware si viene de Firestore, o naive si no,
        # así que iguala ambos usando .astimezone(...) o ignorando tzinfo
        local = dt
        if dt.tzinfo:
            local = dt.astimezone(ZoneInfo(TIME_ZONE))
        return local.day >= recargo_day

    pago_dt = None
    if fecha_pago_cuota:
        if isinstance(fecha_pago_cuota, str):
            pago_dt = datetime.fromisoformat(fecha_pago_cuota)
        else:
            pago_dt = fecha_pago_cuota

    if (estado_cuota != "pagada" and en_recargo(today)) or (pago_dt and en_recargo(pago_dt)):
        return precios.get("montoRecargo")
    
    #Retorno de monto de alumno ingresado el 15 o despues.
    dni_alumno = cuota_data.get("dniAlumno")
    if es_monto_nuevo_15(concepto_cuota, dni_alumno):
        return precios.get("montoNuevo15")  
    
    #Retorno de montoBase
    return precios.get("montoBase")


def es_monto_nuevo_15(concepto_cuota, dni_alumno):
    try:
        mes_str, anio_str = concepto_cuota.split("/")
        mes = MESES[mes_str.strip().lower()]
        anio = int(anio_str.strip())                    
    except Exception:
        mes = anio = None
        raise ValueError
    

    usuario_ref = db.collection('usuarios').document(dni_alumno)
    usuario_doc = usuario_ref.get()
    if not usuario_doc.exists:
        return {'error':'La cuota no tiene un alumno designado.'}, 500
    
    fecha_ingreso = usuario_doc.to_dict().get("fechaInscripcion").astimezone(ZoneInfo(TIME_ZONE))
    if not fecha_ingreso:
        return {'error':'El alumno no tiene una fecha de ingreso.'}, 500
    
    if isinstance(fecha_ingreso, str):
        fecha_formateada = datetime.fromisoformat(fecha_ingreso)
    else:
        fecha_formateada = fecha_ingreso  # Timestamp → datetime
    fecha_formateada = fecha_formateada.astimezone(ZoneInfo(TIME_ZONE)) 

    if fecha_formateada \
       and fecha_formateada.year == anio \
       and fecha_formateada.month == mes \
       and fecha_formateada.day >= 15:
        return True
    else:
        return False


def marcar_cuotas_eliminacion_usuario(dni_alumno):
    try:
        #Se buscan todas las cuotas del alumno
        cuotas_query = db.collection('cuotas').where(filter=FieldFilter("dniAlumno", "==", dni_alumno))
        docs = list(cuotas_query.stream())

        #Tamaño de cada batch (500 es el limite del batch de FireStore)
        batch_size = 400

        #Se itera por cada batch
        for i in range(0, len(docs), batch_size):
            batch = db.batch()
            chunk = docs[i : i + batch_size]

            #Se los pone en un batch a cada cuota
            for doc in chunk:
                ref = db.collection('cuotas').document(doc.id)
                batch.update(ref, {"dniAlumno": "Alum. Eliminado"})

            #Se actualiza el batch actual
            batch.commit()

    except Exception as e:
        raise RuntimeError(e.with_traceback())
    

def marcar_cuotas_eliminacion_disciplina(id_disciplina):
    try:
        #Cliente y el Bulk Writer
        client = firestore.Client()
        bulk = client.bulk_writer()

        #Se buscan todas las cuotas que corresponden a la disciplina
        cuotas_query = db.collection('cuotas').where(filter=FieldFilter("idDisciplina", "==", id_disciplina))

        for doc in cuotas_query.stream():
            ref = client.collection('cuotas').document(doc.id)
            bulk.update(ref, {"idDisciplina": "Disc. Eliminada"})
        
        bulk.close()

    except Exception as e:
        raise RuntimeError(e.with_traceback())
