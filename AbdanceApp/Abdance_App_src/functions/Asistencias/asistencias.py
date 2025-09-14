


from collections import OrderedDict
from firebase_admin import credentials, firestore, auth
from firebase_init import db  # Firebase con base de datos inicializada




import functions_framework
import firebase_admin
from firebase_admin import firestore
from datetime import datetime
from functions.Usuarios.auth_decorator import require_auth



@require_auth(required_roles=['alumno', 'profesor', 'admin']) 
def inasistencias(request, uid=None, role=None):
    data = request.get_json(silent=True) or {}
    if request.method == 'GET':
        #mostrar todas las asistencias de un alumno 
        #se debe pedir id  del usuario
        
        ##inasistencia_user_dni = data.get("dni_usuario")
        inasistencia_user_dni = request.args.get("dni")
        if not inasistencia_user_dni: 
            return {'error':'Ingrese un dni de usuario para ver sus inasistencias'}, 400
        
        
        #se busca en la base de datos el usuario al que corresponde la inasistencia y se agrega
        user_ref = db.collection('usuarios').document(inasistencia_user_dni)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return {'error':'No se encontro el usuario especificado.'}, 404

        
        inasistencias_totales = [doc.to_dict() for doc in user_ref.collection('inasistencias').stream()]
        
        if len(inasistencias_totales) <= 0 : 
            return {'message':'El usuario no tiene inasistencias.'}, 200
        return inasistencias_totales, 200


@require_auth(required_roles=['admin', 'profesor']) 
def registrar_inasistencia(request,  uid=None, role=None):
    data = request.get_json(silent=True) or {} #para registrar la inasistencia se requiere el dni del usuario al que se le va a registrar dicha inasistencia
    

    if request.method == 'POST':
        #add inasistencia alumno
        #la inasistencia registra la fecha y la hora en la que falto, tambien puede establecer la disciplina en la que fue la falta
        #se guarda como una subcoleccion de usuario con rol alumno
        #se debe crear una nueva inasistencia
        inasistencia_user_dni = data.get("dni_usuario")
        inasistencia_fecha =  datetime.now()##data.get("fecha") #debe ser la fecha de HOY 
        inasistencia_justificacion = data.get("justificada")
        
        if not inasistencia_justificacion or not inasistencia_fecha or not inasistencia_user_dni:
            return {'error':'Faltan datos. Revise la justificacion, fecha, usuario'}, 400
        
        #se busca en la base de datos el usuario al que corresponde la inasistencia y se agrega
        user_ref = db.collection('usuarios').document(inasistencia_user_dni)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return {'error':'No se encontro el usuario especificado.'}, 404
        
        inasistencia_ref = user_ref.collection('inasistencias').document()
        
        #se genera el id 
        inasistencia_id = inasistencia_ref.id
        data['id'] = inasistencia_id
        
        # Creamos el objeto limpio para guardar
        inasistencia_data = {
            'id': inasistencia_id,
            'fecha': inasistencia_fecha,
            'justificada': inasistencia_justificacion,
            'dni_usuario': inasistencia_user_dni
        }
        
        #se guarda el documento con el id generado
        inasistencia_ref.set(inasistencia_data)
        return {'message': 'Inasistencia registrada exitosamente'}, 201
        
        print('Se debe registrar una inasistencia antes de este Print')
    elif request.method == 'DELETE':
        #delete inasistencia alumno por errores de usuario o anticipacion a falta
        if not data or 'id_inasistencia' not in data or 'dni_usuario' not in data :
            return {'error': ' Ingrese el id del usuario o la inasistencia correspondiente'}, 400 #######
        
        user_ref = db.collection('usuarios').document(data['dni_usuario'])
        inasistencia_ref = user_ref.collection('inasistencias').document(data['id_inasistencia'])
        inasistencia_doc = inasistencia_ref.get()
        
        if not inasistencia_doc.exists:
            return {'error': 'No se encontro la inasistencia especificada'}, 404
        
        #se elimina la inasistencia de la firestore
        inasistencia_ref.delete()
        return {'message':'Inasistencia eliminada correctamente'}, 200
        
    return

@require_auth(required_roles=['admin', 'profesor'])
def eliminar_inasistencias_usuario(request, uid=None, role=None):
    data = request.get_json(silent=True) or {}
    dni_usuario = data.get("dni_usuario")

    if not dni_usuario:
        return {'error': 'DNI del usuario requerido'}, 400

    user_ref = db.collection('usuarios').document(dni_usuario)
    if not user_ref.get().exists:
        return {'error': 'Usuario no encontrado'}, 404

    inasistencias_ref = user_ref.collection('inasistencias')

    import time
    while True:
        docs = list(inasistencias_ref.limit(500).stream())
        if not docs:
            break
        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
        batch.commit()
        time.sleep(0.05)  # para evitar errores de cuota

    return {'message': f'Todas las inasistencias del usuario {dni_usuario} fueron eliminadas'}, 200