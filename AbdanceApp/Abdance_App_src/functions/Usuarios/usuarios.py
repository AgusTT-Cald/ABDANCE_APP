
import functions_framework
from firebase_admin import credentials, firestore, auth
from functions.Cuotas.utilidades_cuotas import marcar_cuotas_eliminacion_usuario
from firebase_init import db  # Firebase con base de datos inicializada
from datetime import datetime
from .auth_decorator import require_auth
from util.cors import apply_cors
#TODOS ESTOS METODOS DEBEN SER PROTEGIDOS MEDIANTE EL USO DE VERIFICACION DE TOKENS QUE SE ASIGNEN DESDE EL FRONTEND
#
#De otra manera cualquiera puede acceder a estos datos
#
#Verificar que se cumpla la autenticacion del token y el rol determinado
#


@functions_framework.http
def usuarios(request, uid=None, role=None):
    if request.method == 'OPTIONS':
        return apply_cors(({'message': 'CORS preflight'}, 204))
    
    if request.method == 'GET':
        return apply_cors(getUsuarios(request))
    
    elif request.method == 'POST':
        return apply_cors(postUsuarios(request))
    
    elif request.method == 'PUT':
        return apply_cors(putUsuarios(request))
    
    elif request.method == 'DELETE':
        return apply_cors(deleteUsuarios(request))
    else:
        return {'error':'Método no permitido'}, 405   

def parsearFecha(value_date):
    try:
        final_value = datetime.fromisoformat(value_date) if value_date else None
        return final_value
    except ValueError:
            return {'error': 'Formato de fecha inválido'}, 400 # formato de la fecha = YYYY-mm-ddThh:mm:ss.499588

#@require_auth(required_roles=['admin', 'profesor']) 
def getUsuarios(request, uid=None, role=None):
    # Si se pide un dni de esta manera: usuarios?dni= <dni de alguien> se devuelve solo un usuario
        params = request.args
        dni = params.get('dni')
        rol = params.get('rol')
        
        # Validar si dni o rol vienen vacíos en la URL
        if dni == "":
            return {'error': 'El DNI no puede estar vacío'}, 400
        if rol == "":
            return {'error': 'El rol no puede estar vacío'}, 400
        
        
        if dni:
            usuario_dni = request.args.get('dni')
            usuario_ref = db.collection('usuarios').document(usuario_dni)
            usuario_doc = usuario_ref.get()
            if usuario_doc.exists:
                return usuario_doc.to_dict(), 200
            else:
                return {'error':'Usuario no encontrado'}, 400
        elif rol:
            usuario_rol = rol
            usuario_ref = db.collection('usuarios').where('rol', '==', usuario_rol).stream() 
            usuarios = [doc.to_dict() for doc in usuario_ref]
            if usuarios:
                return usuarios, 200
            else: 
                return {'error':'No hay usuarios encontrados con ese rol'}, 400
        else:
            usuarios = [doc.to_dict() for doc in db.collection('usuarios').stream()]
            return usuarios, 200
    
@require_auth(required_roles=['admin', 'profesor']) 
def postUsuarios(request, uid=None, role=None):
    
        #Se piden los datos del usuario, para poder registrarlo al igual que con estudiante
        data = request.get_json(silent=True) or {} 
        
        #se asignan los datos a las variables correspondientes 
        user_dni = data.get("dni")
        user_apellido = data.get("apellido")
        user_name = data.get("nombre")
        user_email = data.get("email")
        user_birthdate = data.get("fechaNacimiento") #firestore timeStamp
        user_registrationDate = data.get("fechaInscripcion")#firestore timeStamp
        user_username = data.get("nombreAcceso")
        user_rol = data.get('rol')
        
        #se verifica que no falte nada
        if not user_dni or not user_apellido or not user_name or not user_email or not user_rol:
            return {'Error':'Faltan datos, revise dni, nombre, apellido, correo electronico, rol'}, 400
        
        # --- Verificar si el DNI ya existe ---
        dni_doc = db.collection("usuarios").document(str(user_dni)).get()
        if dni_doc.exists:
            return {'Error': 'El DNI ya está registrado'}, 400

        # --- Verificar si el email ya existe ---
        email_query = db.collection("usuarios").where("email", "==", user_email).limit(1).get()
        if len(email_query) > 0:
            return {'Error': 'El email ya está registrado'}, 400
        # Intenta parsear las fechas si vienen como string
        try:
            birthdate = datetime.fromisoformat(user_birthdate) if user_birthdate else None
            registration_date = datetime.fromisoformat(user_registrationDate) if user_registrationDate else None
        except ValueError:
            return {'error': 'Formato de fecha inválido'}, 400 # formato de la fecha = YYYY-mm-ddThh:mm:ss.499588
        
        # Validaciones de fecha
        if birthdate and registration_date:
            if birthdate == registration_date:
                return {'error': 'La fecha de nacimiento no puede ser igual a la fecha de inscripción'}, 400
            if birthdate > registration_date:
                return {'error': 'La fecha de nacimiento no puede ser posterior a la fecha de inscripción'}, 400
        
        
        try:
            #se crea el usuario usando su email como email de ingreso y su dni como su contraseña
            usuario = auth.create_user(email=user_email, password=str(user_dni))
            
            db.collection("usuarios").document(str(user_dni)).set(
                {
                    'dni':user_dni,
                    'apellido':user_apellido,
                    'nombre': user_name,
                    'email':user_email,
                    'fechaNacimiento':birthdate,
                    'fechaInscripcion':registration_date,
                    'nombreAcceso':user_username,
                    'rol':user_rol,
                    'user_uid': usuario.uid 
                }
            )
            
            
            
            return {'message': 'Usuario registrado exitosamente', 'user_id': usuario.uid}, 201
        except Exception as e:
            return {'error': str(e) }, 400
            return

@require_auth(required_roles=['admin', 'profesor']) 
def putUsuarios(request, uid=None, role=None):
    #se tiene que actualizar un usuario segun los nuevos datos que se ingresen
    data = request.get_json(silent=True) or {}
    
    if not data or 'dni' not in data:
        return {'error': ' Ingrese el dni del usuario correspondiente'}, 400 #######
    
    
    user_ref = db.collection('usuarios').document(data['dni'])
    user_doc = user_ref.get()
    user_data = user_doc.to_dict()
    
    #control de errores 
    if not user_doc.exists:
        return {'error': 'No se encontro el usuario especificado'}, 404
    
    if user_data.get('rol') == 'admin':
        return {'error': 'No se puede modificar un usuario administrador'}, 403
    
    user_ref.update(data)
    return {"message":"usuario Actualizado",
                    "id": user_data.get('user_uid'), 
                    "nombre usuario modificado" :user_data.get('nombre')}, 200

@require_auth(required_roles=['admin', 'profesor']) 
def deleteUsuarios(request, uid=None, role=None):
    import time
    data = request.get_json(silent=True) or {}
    
    if not data or 'dni' not in data:
        return {'error': ' Ingrese el dni del usuario correspondiente'}, 400 #######
    
    
    user_ref = db.collection('usuarios').document(data['dni'])
    user_doc = user_ref.get()
    
    
    #control de errores 
    if not user_doc.exists:
        return {'error': 'No se encontro el usuario especificado'}, 404
    
    if user_doc.to_dict().get('rol') == 'admin':
        return {'error': 'No se puede eliminar un usuario administrador'}, 403
    
    #si todo coincide : 
    
    
    #eliminacion de authentication firebase
    user_data = user_doc.to_dict() #se extraen los datos en forma de diccionario 
    user_uid = user_data.get('user_uid') #se obtiene el uid unico
    if user_uid:
        try:
            auth.delete_user(user_uid)
        except Exception as e:
            return {'error':f'No se pudo eliminar usuario:({str(e)})'}, 500
    
    #Se actualizan las cuotas en la BD
    marcar_cuotas_eliminacion_usuario(data['dni'])
    
    #eliminacion de BD firestore
    user_ref.delete()
    return {'message':'Usuario eliminado correctamente'}, 200

@require_auth(required_roles=['admin'])
def eliminar_usuario_con_inscripciones(request, uid=None, role=None):
    data = request.get_json(silent=True) or {}
    dni_usuario = data.get('dni')

    if not dni_usuario:
        return {'error': 'DNI requerido'}, 400

    # Paso 1: Eliminar el usuario
    user_ref = db.collection('usuarios').document(dni_usuario)
    user_doc = user_ref.get()
    
    if not user_ref.get().exists:
        return {'error': 'Usuario no encontrado'}, 404
    
    user_data = user_doc.to_dict()
    user_uid = user_data.get('user_uid')  # Aquí obtienes el UID para Auth
    
    
    
    #se eliminan todas las subcollections
    def delete_all_subcollections(doc_ref):
        for subcol in doc_ref.collections():
            for doc in subcol.stream():
                doc.reference.delete()
            print(f"[OK] Subcolección {subcol.id} eliminada.")
    
    # Eliminar subcolecciones conocidas 
    import time
    subcolecciones = ['inasistencias']
    for col_name in subcolecciones:
        subcol_ref = user_ref.collection(col_name)
        while True:
            docs = list(subcol_ref.limit(500).stream())
            if not docs:
                break
            batch = db.batch()
            for doc in docs:
                batch.delete(doc.reference)
            batch.commit()
            time.sleep(0.05)
        
    # eliminar dinámicamente todas las subcolecciones para asegurar eliminacion total
    delete_all_subcollections(user_ref)
    
    
    
    #eliminacion de usuario
    user_ref.delete()

    # Paso 2: Buscar todas las disciplinas y eliminar al usuario de cada una
    disciplinas = db.collection('disciplinas').stream()

    for disciplina in disciplinas:
        alumnos_ref = disciplina.reference.collection('alumnos').document(dni_usuario)
        if alumnos_ref.get().exists:
            alumnos_ref.delete()
    
    
    #Eliminar usuario de Firebase Authentication
    if user_uid:
        try:
            auth.delete_user(user_uid)
        except auth.AuthError as e:
            return {'error': f'Error al eliminar usuario de autenticación: {str(e)}'}, 500

    return {'message': f'Usuario {dni_usuario} y sus inscripciones fueron eliminados'}, 200