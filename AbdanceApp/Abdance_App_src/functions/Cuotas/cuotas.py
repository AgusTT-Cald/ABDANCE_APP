import os
from zoneinfo import ZoneInfo
from pydantic import ValidationError
from functions.Usuarios.auth_decorator import require_auth
from functions.Usuarios.auth_decorator_IAM import require_auth_schedule
from functions.Cuotas.utilidades_cuotas import get_monto_cuota, ordenar_datos_cuotas
from functions.Disciplinas.disciplinas import getAlumnosPorDisciplina, ordenar_datos_disciplina
from functions.Cuotas.query_cuotas_classes import CuotasQuery
from functions.Otros.utilidades_datetime import MESES_REVRSD, TIME_ZONE
from firebase_init import db  # Firebase con base de datos inicializada
from dotenv import load_dotenv
from datetime import datetime
from google.cloud.firestore_v1.base_query import FieldFilter


DIA_RECARGO_ERR_MSG = "El dia de recargo (dia_recargo) es requerido obligatoriamente para evitar errores."


def cuotas(request):
    if request.method == "GET":
        return getCuotas(request)
    
    elif request.method == 'POST':
        return postCuotas(request)
    
    elif request.method == 'PUT':
        return putCuotas(request)
    
    elif request.method == 'DELETE':
        return deleteCuotas(request)
    
    else:
        return 'hola cuotas', 200


#@require_auth(required_roles=['alumno', 'profesor', 'admin'])
def getCuotas(request, uid=None, role=None):
    try:
        data = request.args
        cuota_id = data.get('cuota_id')

        #ID de la disciplina asi se pide cuotas especificas de una disciplina
        id_disciplina = data.get('idDisciplina') 
        #DNI del alumno para pedir las cuotas de este solamente
        dni_alumno = data.get('dniAlumno')
        
        #El dia de recargo, asi solo se debe pasar por el front
        #EL DIA DE RECARGO ES REQUERIDO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        if 'dia_recargo' not in data:
            return {'error': DIA_RECARGO_ERR_MSG}, 400
        if 'limite' not in data:
            return {'error': "No se ha puesto un limite a la cantidad de cuotas a traer."}, 400
        
        try:
            recargo_day = int(data.get('dia_recargo'))
            #Limite de cuotas a retirar (MAX DE 500)
            limite = int(data.get('limite'))
        except ValueError as e:
            return {'error': "El dia de recargo y/o el limite no son numeros enteros."}, 400

        # load_dotenv()
        # DIA_RECARGO = os.getenv("DIA_RECARGO")
        recargo_day = 11  #int(DIA_RECARGO)
                
        try: 
            validation_args = {
                'dia_recargo': recargo_day,
                'dniAlumno': dni_alumno,
                'idDisciplina': id_disciplina,
                'cuota_id': cuota_id,
                'limite_query': limite
            }
            CuotasQuery.model_validate(validation_args)
        except ValidationError as e:
            return {'error': e.errors(include_url=False, include_context=False)}, 400

        if 'cuota_id' not in data:
            cuotas = []
            cuotas_ref = db.collection('cuotas')

            #Filtros para traer por disciplina y/o alumno
            if id_disciplina is not None:
                cuotas_ref = cuotas_ref.where(filter=FieldFilter("idDisciplina", "==", id_disciplina))

            if dni_alumno is not None:
                cuotas_ref = cuotas_ref.where(filter=FieldFilter("dniAlumno", "==", dni_alumno))

            cuotas_ref = cuotas_ref.limit(limite)

            for doc in cuotas_ref.stream():
                cuota_data = doc.to_dict()
            
                data_tuple = get_monto_cuota(doc.id, recargo_day)
                precio_cuota = data_tuple[0]
                tipo_monto = data_tuple[1]
                cuota_data = ordenar_datos_cuotas(cuota_data, precio_cuota, doc.id, disciplina_id=id_disciplina, tipo_recargo=tipo_monto)

                cuotas.append(cuota_data)

            return cuotas, 200

        cuota_ref = db.collection('cuotas').document(cuota_id)
        cuota_doc = cuota_ref.get()

        if cuota_doc.exists: 
            cuota_data = cuota_doc.to_dict()

            data_tuple = get_monto_cuota(cuota_id, recargo_day)
            precio_cuota = data_tuple[0]
            tipo_monto = data_tuple[1]

            cuota_data = ordenar_datos_cuotas(cuota_data, precio_cuota, cuota_doc.id, tipo_recargo=tipo_monto)

            return cuota_data, 200
        else:
            return {'error':'cuota no encontrada'}, 404
        
    except Exception as e:
        return {'error': str(e)}, 500


@require_auth(required_roles=['admin'])
def postCuotas(request, uid=None, role=None):
    try:
        data_cuota = request.get_json(silent=True) or {}
        #se debe crear una nueva cuota
        cuota_concepto = data_cuota.get("concepto")
        cuota_alumno = data_cuota.get("dniAlumno")
        cuota_disciplina = data_cuota.get("idDisciplina")
        
        if not cuota_concepto or not cuota_alumno or not cuota_disciplina:
            return {'error': 'Faltan datos para generar la cuota. Revise concepto, DNI del alumno, ID de disciplina.'}, 400

        #si todos los datos existen se añaden a la base de datos
        cuota_ref = db.collection("cuotas").document()
        
        #generar el id aleatorio
        cuota_id = cuota_ref.id
        data_cuota['id'] = cuota_id

        #Generar datos pre_establecidos
        data_cuota['estado'] = "pendiente"
        data_cuota['fechaPago'] = ""
        data_cuota['metodoPago'] = ""
        data_cuota['montoPagado'] = 0
        
        #guardar documento con el id
        cuota_ref.set(data_cuota)
        
        return {'message': 'Cuota registrada exitosamente'}, 201

    except Exception as e:
        return {'error': str(e)}, 500


@require_auth(required_roles=['admin'])
def putCuotas(request, uid=None, role=None):
    try:
        data = request.get_json(silent=True) or {} 
    
        if not data or 'cuota_id' not in data:
            return {'error': ' Ingrese un id (cuota_id) para poder actualizar la cuota.'}, 400
        
        #Verificacion de existencia de disciplina y alumno
        disciplina_id = data.get("idDisciplina")
        disciplina_ref = db.collection("disciplinas").document(disciplina_id)
        disciplina_doc = disciplina_ref.get()
        if not disciplina_doc.exists and disciplina_id:
            return {'error':'La disciplina proporcionada no fue encontrada o no existe.'}, 400
        
        alumno_dni = data.get("dniAlumno")
        alumno_ref = db.collection("usuarios").document(alumno_dni)
        alumno_doc = alumno_ref.get()
        if not alumno_doc.exists and alumno_dni:
            return {'error':'El alumno proporcionado no fue encontrado o no existe.'}, 400
        
        #Se realiza una comprobación de los campos, para no ingresar campos incorrectos
        #o que no corresponden.
        campos_permitidos = {
            'cuota_id',
            'concepto',       
            'estado',    
            'fechaPago',  
            'idDisciplina', 
            'dniAlumno',
            'metodoPago',
            'montoPagado',
        }

        campos_data = set(data.keys())
        campos_extra = campos_data - campos_permitidos
        if campos_extra:
            return {
                'error': 'Campos no permitidos en la petición.',
                'invalid_fields': list(campos_extra)
            }, 400
        
        cuota_ref = db.collection('cuotas').document(data['cuota_id'])
        cuota_doc = cuota_ref.get()
        cuota_data = cuota_doc.to_dict()
        
        #control de errores 
        if not cuota_doc.exists:
            return {'error': 'No se encontro la cuota especificada.'}, 404
        
        data.pop("cuota_id")
        cuota_ref.update(data)
        return {"message": "Cuota Actualizada", "id": cuota_data.get('id')}, 200

    except Exception as e:
        return {'error': str(e)}, 500


@require_auth(required_roles=['admin'])
def deleteCuotas(request, uid=None, role=None):
    try:
        data = request.get_json(silent=True) or {} 
    
        if not data or 'cuota_id' not in data:
            return {'error': 'Debe ingresar el id de la cuota (cuota_id) para poder eliminarla.'}, 400 
        
        cuota_ref = db.collection('cuotas').document(data['cuota_id'])
        cuota_doc = cuota_ref.get()
        
        #control de errores 
        if not cuota_doc.exists:
            return {'error': 'No se encontró la cuota especificada.'}, 404
        
        #eliminacion de BD firestore
        cuota_ref.delete()
        return {'message': 'Cuota eliminada correctamente.'}, 200

    except Exception as e:
        return {'error': str(e)}, 500



#@require_auth(required_roles=['alumno', 'admin'])
def getCuotasDNIAlumno(request, uid=None, role=None):
    try:
        #axiox no permite GETs con datos en JSON, por lo que es necesario usar los args.
        data = request.args

        #El dia de recargo, asi solo se debe pasar por el front
        #EL DIA DE RECARGO ES REQUERIDO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        if 'dia_recargo' not in data:
            return {'error': DIA_RECARGO_ERR_MSG}, 400
        if 'dniAlumno' not in data:
            return {'error': 'El DNI del alumno es requerido.'}, 400
        if 'limite' not in data:
            return {'error': "No se ha puesto un limite a la cantidad de cuotas a traer."}, 400
        
        try:
            recargo_day = int(data.get('dia_recargo'))
            limite = int(data.get('limite'))
        except ValueError as e:
            return {'error': "El dia de recargo no es un numero entero."}, 400
        
        cuota_id = data.get('cuota_id')
        #DNI del alumno para pedir las cuotas de este solamente
        dni_alumno = data.get('dniAlumno')
        # load_dotenv()
        # DIA_RECARGO = os.getenv("DIA_RECARGO")
        recargo_day = 11  #int(DIA_RECARGO)

        try: 
            validation_args = {
                'dia_recargo': recargo_day,
                'dniAlumno': dni_alumno,
                'idDisciplina': None,
                'cuota_id': cuota_id,
                'limite_query': limite
            }
            CuotasQuery.model_validate(validation_args)
        except ValidationError as e:
            return {'error': e.errors(include_url=False, include_context=False)}, 400
        
        usuario_ref = db.collection('usuarios').document(dni_alumno)
        usuario_doc = usuario_ref.get()

        if not usuario_doc.exists:
            return {'error': 'Alumno no encontrado o el alumno ya no existe.'}, 400
        if usuario_doc.to_dict().get('user_uid') != uid:
            return {'error': 'No puede acceder a esta información.'}, 401
        

        if not data or 'cuota_id' not in data:
            cuotas = []
            cuotas_ref = db.collection('cuotas')
            cuotas_ref = cuotas_ref.where(filter=FieldFilter("dniAlumno", "==", dni_alumno))
            cuotas_ref = cuotas_ref.limit(limite)

            for doc in cuotas_ref.stream():
                cuota_data = doc.to_dict()
            
                data_tuple = get_monto_cuota(doc.id, recargo_day)
                precio_cuota = data_tuple[0]
                tipo_monto = data_tuple[1]

                cuota_data = ordenar_datos_cuotas(cuota_data, precio_cuota, doc.id, tipo_recargo=tipo_monto)

                cuotas.append(cuota_data)

            return cuotas, 200

        cuota_ref = db.collection('cuotas').document(cuota_id)
        cuota_doc = cuota_ref.get()

        if cuota_doc.exists: 
            cuota_data = cuota_doc.to_dict()
            
            data_tuple = get_monto_cuota(cuota_id, recargo_day)
            precio_cuota = data_tuple[0]
            tipo_monto = data_tuple[1]

            cuota_data = ordenar_datos_cuotas(cuota_data, precio_cuota, cuota_doc.id, tipo_recargo=tipo_monto)

            return cuota_data, 200
        else:
            return {'error':'Cuota no encontrada'}, 404
        
    except Exception as e:
        return {'error': str(e)}, 500


@require_auth(required_roles=['admin'])
def crear_cuotas_mes(request, uid=None, role=None):
    """Funcion que crea las cuotas para todos los alumnos de cada una de las disciplinas en las
    que estén agregados.

    Args:
        request: Datos de la HTTP Request.
        "es_matricula": 1 (true) || 0 (false) 
        "mes": 1 .. 12

    Returns:
        HTTPResponse: Responde apropiadamente con error o un 201 dependiendo de si todo salió bien.
    """
    try:
        data = request.get_json(silent=True) or {}

        if 'es_matricula' not in data:
            return {'error': 'Se requiere especificar si es matricula o no.'}, 400
        if 'mes' not in data:
            return {'error': 'Se requiere especificar el mes.'}, 400
        
        disciplinas_data = []
        disciplinas_ref = db.collection('disciplinas')
        
        for doc in disciplinas_ref.stream():
            data_disciplina = doc.to_dict()
            doc_disciplina_id = doc.id
            
            alumnos_inscriptos_id = getAlumnosPorDisciplina(doc_disciplina_id)
            disciplina_data = ordenar_datos_disciplina(data_disciplina, alumnos_inscriptos_id)
            
            disciplinas_data.append(disciplina_data)
        
        disciplinas_list = disciplinas_data
        es_matricula = True if data["es_matricula"] == 1 else False

        mes_num = int(data["mes"])
        mes = mes_num if mes_num in range(1, 12) else datetime.now(ZoneInfo(TIME_ZONE)).month
        current_year = datetime.now(ZoneInfo(TIME_ZONE)).year

        bulk = db.bulk_writer()

        cant_creada = 0

        for disciplina in disciplinas_list:
            alumnos_inscriptos = disciplina.get("alumnos_inscriptos")
            #Evita que se cree mas de una cuota para un unico DNI
            cuotas_creadas_dnis = []

            for alumno in alumnos_inscriptos:
                #Solo se saltea la creacion
                dni_alumno = alumno.get("dni")
                if dni_alumno in cuotas_creadas_dnis:
                    continue

                data_cuota = {}

                cuota_ref = db.collection("cuotas").document()
                cuota_id = cuota_ref.id

                
                #Generar datos pre_establecidos
                data_cuota['id'] = cuota_id
                data_cuota['dniAlumno'] = dni_alumno
                data_cuota['idDisciplina'] = disciplina.get("disciplina_id")
                data_cuota['estado'] = "pendiente"
                data_cuota['fechaPago'] = ""
                data_cuota['metodoPago'] = ""
                data_cuota['montoPagado'] = 0

                if es_matricula:
                    #Siguen el formato: Matricula/(Año_Actual)
                    data_cuota["concepto"] = f"Matricula/{current_year}"
                else:
                    #Siguen el formato: (Nombre_Mes)/(Año_Actual)
                    data_cuota["concepto"] = f"{MESES_REVRSD[mes].capitalize()}/{current_year}"
                    
                #guardar documento con el id
                #cuota_ref.set(data_cuota)
                bulk.set(cuota_ref, data_cuota)

                cant_creada += 1
                cuotas_creadas_dnis.append(dni_alumno)

        bulk.close()
        return {"mensaje": f"Se crearon un total de: {cant_creada} cuotas."}, 201

    except Exception as e:
        return {'error': str(e)}, 500


@require_auth_schedule(required_roles=['scheduler'], audience="https://southamerica-east1-snappy-striker-455715-q2.cloudfunctions.net/main/eliminar-cuotas-forma-automatica")
def eliminar_cuotas_forma_automatica(request, uid=None, role=None):
    try:
        data = request.get_json(silent=True) or {}

        if 'anios_a_restar' not in data:
            return {'error': 'Se requiere especificar el numero a restar al numero del año actual. \nPor ejemplo: un valor de 2 borraría todas las cuotas del año 2023 si el año actual es 2025.'}, 400

        #Bulk Writer
        bulk = db.bulk_writer()

        #Se traen solo las cuotas necesarias (las del mismo mes del año actual que el del
        #año resultante de la resta entre el actual y la variable "anios_a_restar").
        anio_borrado = datetime.now(ZoneInfo(TIME_ZONE)).year - int(data.get("anios_a_restar"))
        cant_borrada = 0
        
        for month_number in range(1, 12):
            current_month_str = MESES_REVRSD[month_number].capitalize()
            str_filtro = f"{current_month_str}/{anio_borrado}"
        
            cuotas_ref = db.collection('cuotas').where(filter=FieldFilter("concepto", "==", str_filtro))

            for doc in cuotas_ref.stream():
                ref = db.collection('cuotas').document(doc.id)
                bulk.delete(ref)
                cant_borrada += 1
        
        bulk.close()

        return f"Se borraron correctamente {cant_borrada} cuotas.", 200

    except Exception as e:
        return {'error': str(e)}, 500