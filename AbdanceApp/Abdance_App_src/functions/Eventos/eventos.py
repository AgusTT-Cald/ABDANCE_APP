import firebase_admin
from firebase_admin import firestore
from firebase_init import db
from datetime import datetime
from functions.Usuarios.auth_decorator import require_auth
import random


    #todo
    #get eventos y get evento por id
    #crea evento
    #modifica datos de un evento existente
""" 
    #eliminar evento:
    #   eliminar todas las entradas asociadas al evento
"""

def eventos(request, uid=None, role=None):
    if request.method == 'GET':
        return getEventos(request)
    
    elif request.method == 'POST':
        return postEventos(request)
    
    elif request.method == 'PUT':
        return putEventos(request)
    
    elif request.method == 'DELETE':
        return deleteEventos(request)
    else:
        return {'error': 'Método no permitido'}, 405


# GET
#@require_auth(required_roles=['admin', 'profesor'])
def getEventos(request, uid=None, role=None):
    codigo = request.args.get('codigo')

    if codigo:
        doc = db.collection('eventos').document(codigo).get()
        if doc.exists: 
            return doc.to_dict(), 200
        else:
            return {'error': 'Evento no encontrado'}, 404
    else:
        eventos = [doc.to_dict() for doc in db.collection('eventos').stream()]
        return eventos, 200



# POST: crear evento
#@require_auth(required_roles=['admin'])
def postEventos(request, uid=None, role=None):

    data = request.get_json(silent=True) or {}

    nombre = data.get('nombre')
    lugar = data.get('lugar')
    fecha = data.get('fecha')  # YYYY-mm-ddThh:mm:ss.499588
    url_img = data.get('urlImg')
    con_entrada = data.get('conEntrada')

    if not nombre or not lugar or not fecha or not url_img or con_entrada is None:
        return {'error': 'Faltan datos obligatorios'}, 400

    try:
        fecha = datetime.fromisoformat(fecha)
    except ValueError:
        return {'error': 'Formato de fecha inválido'}, 400

    codigo = str(random.randint(10000, 99999))
    clave = str(random.randint(10000, 99999))

    if con_entrada:
        entradas = data.get('entradas')
        if not entradas:
            return {'error': 'Se requieren entradas para este evento'}, 400
        evento_data = {
            'codigo': codigo,
            'clave': clave,
            'nombre': nombre,
            'lugar': lugar,
            'fecha': fecha,
            'urlImg': url_img,
            'conEntrada': True,
            'entradas': entradas  # lista de dicts: [{tipo, precio, cantidad}]
        }
    else:
        descripcion = data.get('descripcion')
        if not descripcion:
            return {'error': 'Se requiere descripción si no hay entradas'}, 400
        evento_data = {
            'codigo': codigo,
            'clave': clave,
            'nombre': nombre,
            'lugar': lugar,
            'fecha': fecha,
            'urlImg': url_img,
            'conEntrada': False,
            'descripcion': descripcion
        }

    db.collection('eventos').document(codigo).set(evento_data)
    return {'message': 'Evento creado correctamente', 'codigo': codigo}, 201


# PUT
#@require_auth(required_roles=['admin'])
def putEventos(request, uid=None, role=None):
    data = request.get_json(silent=True) or {}
    codigo = data.get('codigo')

    if not codigo:
        return {'error': 'Debe incluir el código del evento'}, 400

    evento_ref = db.collection('eventos').document(codigo)
    evento_doc = evento_ref.get()

    if not evento_doc.exists:
        return {'error': 'Evento no encontrado'}, 404

    # Validar fecha si se va a actualizar
    if 'fecha' in data:
        try:
            data['fecha'] = datetime.fromisoformat(data['fecha'])
        except ValueError:
            return {'error': 'Formato de fecha inválido'}, 400

    evento_ref.update(data)
    return {'message': 'Evento actualizado correctamente'}, 200


# DELETE: eliminar evento y sus entradas
#@require_auth(required_roles=['admin', 'profesor'])
def deleteEventos(request, uid=None, role=None):
    data = request.get_json(silent=True) or {}
    codigo = data.get('codigo')

    if not codigo:
        return {'error': 'Debe proporcionar el código del evento'}, 400

    evento_ref = db.collection('eventos').document(codigo)
    evento_doc = evento_ref.get()

    if not evento_doc.exists:
        return {'error': 'Evento no encontrado'}, 404

    # 🔥 Eliminar documentos de la subcolección 'entradas'
    entradas_ref = evento_ref.collection('entradas')
    entradas_docs = entradas_ref.stream()

    for doc in entradas_docs:
        doc.reference.delete()

    # ❌ Finalmente eliminar el documento del evento
    evento_ref.delete()

    return {'message': 'Evento y sus entradas eliminados correctamente'}, 200





