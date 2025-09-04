from typing import OrderedDict
from firebase_init import db, firestore
from datetime import datetime
from functions.Usuarios.auth_decorator import require_auth
from functions.Otros.utilidades_datetime import MESES_REVRSD
from zoneinfo import ZoneInfo
import pandas as pd



def fetch_pagadas():
    """Recupera todas las cuotas con estado "pagada" y devuelve una lista de dicts.

    Args:
        None

    Returns:
        Dict: Un diccionario con el formato: 
        - fechaPago: datetime
        - montoPagado: float
    """
    cuotas_pagadas = db.collection('cuotas').where('estado', '==', 'pagada').stream()
    dict_to_return = []

    for cuota in cuotas_pagadas:
        cuota_dict = cuota.to_dict()
        fecha_pago = cuota_dict.get('fechaPago')

        # Se normaliza a datetime
        if isinstance(fecha_pago, str):
            dt = datetime.fromisoformat(fecha_pago)
        else:
            dt = fecha_pago  # El Firestore Timestamp ya se normaliza a datetime

        monto = cuota_dict.get('montoPagado') or 0
        dict_to_return.append({'fechaPago': dt, 'montoPagado': monto, 'concepto': cuota.get('concepto'), 'DNIAlumno': cuota.get('dniAlumno')})

    return dict_to_return


#@require_auth(required_roles=['admin'])
def total_pagado_mes(request, uid=None, role=None):
    try:
        data = request.get_json(silent=True) or {}

        if not data or ('year' and 'month') not in data:
            return {'error': "Se debe especificar un mes (month) y año (year)."}, 400
        
        anio_filtro = data.get('year')
        mes_filtro = data.get('month')

        if mes_filtro not in range(1, 12):
            return {'error': "Se debe especificar un numero de mes válido: 1-Enero, 2-Febrero, ... , 12-Diciembre"}, 400
        if anio_filtro > datetime.now().year or anio_filtro < 1:
            return {'error': "Se debe especificar un numero de año válido a partir del año actual."}, 400

        doc_id = f"{anio_filtro}-{mes_filtro:02d}"
        doc_ref = db.collection('estadisticas').document(doc_id)

        cached = doc_ref.get()
        if cached.exists:
            cached_data = cached.to_dict()
            total_detalle = {
                "Detalle": cached_data.get("Detalle", {}),
                "Total": cached_data.get("Total", {})
            }
            return total_detalle, 200

        payload = recomputar_almacenar_mes(anio_filtro, mes_filtro)
        return payload, 200

    except Exception as e:
        return {'error': str(e)}, 500


#@require_auth(required_roles=['admin'])
def totales_por_mes_anio(request, uid=None, role=None):
    try:
        data = request.get_json(silent=True) or {}

        if not data or 'year' not in data:
            return {'error': "Se debe especificar un año."}, 400
        
        anio_filtro = data.get('year')

        if anio_filtro > datetime.now().year or anio_filtro < 1:
            return {'error': "Se debe especificar un numero de año válido a partir del año actual."}, 400
        
        doc_ref = db.collection('estadisticas').document(str(anio_filtro))
        cached = doc_ref.get()
        if cached.exists:
            cached_data = cached.to_dict()
            return cached_data.get('month_totals', {}), 200

        result = recomputar_almacenar_anio(anio_filtro)
        return result, 200
    
    except Exception as e:
        return {'error': str(e)}, 500


#CACHE RECOMPUTATIONS:
def recomputar_almacenar_anio(year: int):
    """
    Recalcula los totales por mes para `year` a partir de las cuotas pagadas,
    guarda el resultado en la colección 'estadisticas' con id == str(year)
    y devuelve el dict nombre_mes -> total (float).
    """
    #Inicialización de contadores
    totals = {m: 0.0 for m in range(1, 13)}
    latest_pago_dt = None

    #Query de todas las cuotas pagadas
    cuotas_pagadas = db.collection('cuotas').where('estado', '==', 'pagada').stream()

    for doc in cuotas_pagadas:
        data = doc.to_dict()
        fecha_pago = data.get('fechaPago')
        monto = data.get('montoPagado') or 0.0

        # Normalizar fecha a datetime (manejar strings y Timestamp)
        if isinstance(fecha_pago, str):
            try:
                fecha_dt = datetime.fromisoformat(fecha_pago)
            except Exception:
                #Ignora los formatos inválidos
                continue
        else:
            fecha_dt = fecha_pago

        if not fecha_dt:
            continue

        #Sólo sumar si el año coincide
        if fecha_dt.year == year:
            totals[fecha_dt.month] += float(monto)
            if (latest_pago_dt is None) or (fecha_dt > latest_pago_dt):
                latest_pago_dt = fecha_dt

    #Mapear a nombres de mes
    result = OrderedDict()
    for m in range(1, 13):
        result[MESES_REVRSD[m]] = float(totals.get(m, 0.0))

    #Guardar en Firestore
    doc_ref = db.collection('estadisticas').document(str(year))
    payload = {
        'month_totals': result,
        'generated_at': datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")),
        'source_latest_pago': latest_pago_dt
    }

    #set(merge=True) para no sobreescribir por si se quiere mantener otros campos
    doc_ref.set(payload, merge=True)

    return result


def recomputar_almacenar_mes(year: int, month: int):
    """
    Recalcula si es necesario las cuotas por mes para "year" "month" y, a partir de las cuotas pagadas,
    guarda el resultado en la colección "estadisticas" con id == "{year}-{month:02d}"
    y devuelve el dict nombre_mes -> total (float).
    """
    #Rango de: [start, end)
    start = datetime(year, month, 1, 0, 0, 0, tzinfo=ZoneInfo("America/Argentina/Buenos_Aires"))
    if month == 12:
        end = datetime(year + 1, 1, 1, 0, 0, 0, tzinfo=ZoneInfo("America/Argentina/Buenos_Aires"))
    else:
        end = datetime(year, month + 1, 1, 0, 0, 0, tzinfo=ZoneInfo("America/Argentina/Buenos_Aires"))

    # Query: cuota pagada y fechaPago dentro del mes
    try:
        cuotas_query = db.collection('cuotas') \
            .where('estado', '==', 'pagada') \
            .where('fechaPago', '>=', start) \
            .where('fechaPago', '<', end)
        docs = list(cuotas_query.stream())
    except Exception:
        #Fallback por si algún motivo la query de arriba falla
        docs = []
        for d in db.collection('cuotas').where('estado', '==', 'pagada').stream():
            docs.append(d)

    total = 0.0
    detalle = []
    latest_pago = None

    for doc in docs:
        data = doc.to_dict()
        fecha_pago = data.get('fechaPago')

        #Normalizar a datetime
        if isinstance(fecha_pago, str):
            try:
                dt = datetime.fromisoformat(fecha_pago)
            except Exception:
                continue
        else:
            dt = fecha_pago 

        #Asegurar que cae en el mes (más que nada por el fallback)
        if not (dt.year == year and dt.month == month):
            continue

        monto = float(data.get('montoPagado') or 0.0)
        total += monto

        detalle.append({
            'fechaPago': dt.isoformat(),
            'montoPagado': monto,
            'concepto': data.get('concepto'),
            'DNIAlumno': data.get('dniAlumno'),
            'idCuota': doc.id
        })

        if (latest_pago is None) or (dt > latest_pago):
            latest_pago = dt

    payload = {
        'Total': float(total),
        'Detalle': detalle,
        'generated_at': datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")),
        'source_latest_pago': latest_pago
    }

    doc_id = f"{year}-{month:02d}"
    db.collection('estadisticas').document(doc_id).set(payload)

    return {"Total": payload['Total'], "Detalle": payload['Detalle']}


def incrementar_estadistica_anio(fechaPago: datetime, monto: float):
    year = fechaPago.year
    month = fechaPago.month
    month_name = MESES_REVRSD[month]
    doc_ref = db.collection('estadisticas').document(str(year))

    #Se usa Increment para hacer una suma atómica
    #set() crea el documento si es que no existe a diferencia de update que no lo hace
    doc_ref.set({
        f'month_totals.{month_name}': firestore.firestore.Increment(monto),
        'source_latest_pago': fechaPago,
        'generated_at': datetime.now(ZoneInfo("America/Argentina/Buenos_Aires"))
    }, merge=True)


def incrementar_estadistica_mes(fechaPago: datetime, monto: float, cuota_doc_id: str):
    year = fechaPago.year
    month = fechaPago.month
    doc_id = f"{year}-{month:02d}"
    doc_ref = db.collection('estadisticas').document(doc_id)

    cuota_ref = db.collection('cuotas').document(cuota_doc_id) 
    cuota_data = cuota_ref.get().to_dict()

    #payload para incrementar el total y agregar al detalle
    detalle_obj = {
        'fechaPago': fechaPago,
        'montoPagado': float(monto),
        'idCuota': cuota_doc_id,
        'concepto': cuota_data.get('concepto'),
        'DNIAlumno': cuota_data.get('dniAlumno')
    }

    #El ArrayUnion sirve para hacer un append de valores al final de una lista, o array en este caso
    doc_ref.set({
        'Total': firestore.firestore.Increment(float(monto)),
        'Detalle': firestore.firestore.ArrayUnion([detalle_obj]),
        'generated_at': datetime.now(ZoneInfo("America/Argentina/Buenos_Aires")),
        'source_latest_pago': fechaPago
    }, merge=True)