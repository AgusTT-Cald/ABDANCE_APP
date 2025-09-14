import functions_framework 
##from flask import Flask, jsonify, request
from util.cors import apply_cors


import functions_framework
import firebase_admin
from firebase_admin import credentials, firestore, auth


from functions.Asistencias.asistencias import (
    inasistencias, 
    registrar_inasistencia
)
from functions.Cuotas.cuotas import (
    cuotas, 
    getCuotasDNIAlumno,
    crear_cuotas_mes,
    eliminar_cuotas_forma_automatica
)
from functions.Estadisticas.estadisticas import (
    total_pagado_mes,
    totales_por_mes_anio
)
from functions.Cuotas.pagos import(
    pagar_cuota,
    pagar_cuotas_manualmente
)
from functions.Cuotas.pagos import crear_preferencia_cuota
from functions.Usuarios.auth_users import register_student
from functions.Usuarios.usuarios import usuarios
from functions.Eventos.eventos import eventos
from functions.Disciplinas.disciplinas import disciplinas, gestionarAlumnosDisciplina, datos_necesarios_disciplinas
from functions.Eventos.entradas import entradas
from functions.Eventos.crear_preferencia import crear_preferencia


# #funciones 
# from functions.Asistencias.asistencias import inasistencias
# from functions.Cuotas.pagos import cuotas
# from functions.Usuarios.auth_users import register_student
# from functions.Asistencias.asistencias import registrar_inasistencia
# from functions.Usuarios.usuarios import usuarios
# from functions.Eventos.eventos import eventos
# from functions.Disciplinas.disciplinas import disciplinas



#si no existe una app firebase la crea con las credenciales automaticas de Google Cloud
if not firebase_admin._apps:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)



@functions_framework.http
def main(request):
    # Configuración básica de CORS para peticiones OPTIONS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': 'http://localhost:5173',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
        return ('', 204, headers)
    #url y metodo de la request
    path = request.path
    method = request.method
    
    
    # Router de endpoints
    if path == '/' and method == 'GET':
        return 'Hola Main View', 200 
    elif path == '/cuotas':
        return apply_cors(cuotas(request))
    elif path == '/cuotas/alumno':
        return apply_cors(getCuotasDNIAlumno(request))
    elif path == '/cuotas/datos-disciplina':
        return apply_cors(datos_necesarios_disciplinas(request))
    elif path == "/crear_preferencia_cuota":
        return apply_cors(crear_preferencia_cuota(request) )
    elif path == "/pagar_cuota":
        return apply_cors(pagar_cuota(request))
    elif path == "/pagar_cuota/manual":
        return apply_cors(pagar_cuotas_manualmente(request))
    elif path == "/crear-cuotas-mes":
        return apply_cors(crear_cuotas_mes(request))
    elif path == "/eliminar-cuotas-forma-automatica":
        return apply_cors(eliminar_cuotas_forma_automatica(request))
    elif path == "/estadisticas/total-del-mes":
        return apply_cors(total_pagado_mes(request))
    elif path == "/estadisticas/totales-por-anio":
        return apply_cors(totales_por_mes_anio(request))
    elif path == '/eventos':
        return eventos(request)
    elif path == '/entradas':
        return entradas(request)
    elif path == '/crear_preferencia':
        return crear_preferencia(request)
    elif path == '/usuarios/register-student':
        return register_student(request) 
    elif path == '/usuarios':
        return usuarios(request)
    elif path == '/inasistencias':
        return apply_cors(inasistencias(request)) 
    elif path == '/asistencias/registrar':
        return apply_cors(registrar_inasistencia(request))
    elif path == '/disciplinas':
        return disciplinas(request)
    elif path == '/disciplinas/alumno':
        return gestionarAlumnosDisciplina(request)
        return ('Endpoint en construcción', 501)#se debe agregar, modificar, eliminar,y ver datos de un alumno de una disciplina segun su dni
    elif path == '/disciplinas/horario':
        return ('Endpoint en construcción', 501)#se debe agregar, modificar, eliminar,y ver datos de un horarios de una disciplina segun su id
    elif path == '/disciplinas/profesor':
        return ('Endpoint en construcción', 501) #se debe agregar, modificar, eliminar,y ver datos de un alumno de un profesor segun su dni
    else:
        return 'Method not allowed', 405
    

""" if __name__ == '__main__':
    from flask import Flask, request
    from werkzeug.serving import run_simple
    from flask_cors import CORS

    import logging
    logging.basicConfig(level=logging.DEBUG)

    flask_app = Flask(__name__)
    CORS(flask_app) 
    
    @flask_app.route('/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    @flask_app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    def catch_all(path):
        try:
            return main(request)
        except Exception as e:
            # Esto imprime el error en la consola
            flask_app.logger.error(f"Error interno: {e}", exc_info=True)
            return "Error interno en el servidor", 500

    run_simple('127.0.0.1', 5000, flask_app, use_debugger=True, use_reloader=True) """

