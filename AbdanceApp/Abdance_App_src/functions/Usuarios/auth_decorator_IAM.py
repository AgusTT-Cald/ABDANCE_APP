from google.oauth2 import id_token as oauth2_id_token
from google.auth.transport import requests as google_requests
from functools import wraps
from firebase_admin import auth
from functions.Usuarios.auth_decorator import get_user_role_from_firestore

def require_auth_schedule(audience=None, required_roles=None):
    def decorator(f):
        @wraps(f)
        def wrapper(request, *args, **kwargs):
            auth_header = request.headers.get('Authorization', '')

            if not auth_header.startswith("Bearer "):
                return {'error': 'Token faltante o formato incorrecto'}, 401

            token = auth_header.split(" ")[1]

            #Primero intenta con el Firebase ID Token (tal como en el require_auth comun)
            try:
                decoded = auth.verify_id_token(token)
                uid = decoded['uid']
                user_role = get_user_role_from_firestore(uid)
            except Exception as firebase_err:
                #Si no tiene un token de firebase, intenta el OIDC de Cloud Scheduler
                try:
                    #Verifica el token de IAM
                    aud = audience      #"https://southamerica-east1-snappy-striker-455715-q2.cloudfunctions.net/main/(RESTO DE LA URL)"
                    decoded_oidc = oauth2_id_token.verify_oauth2_token(
                        token,
                        google_requests.Request(),
                        aud
                    )
                    #Se comprueba que venga del service account correcto
                    if decoded_oidc.get("email") != "schedule-invoker@snappy-striker-455715-q2.iam.gserviceaccount.com":
                        raise ValueError("Service account no autorizado para esta tarea.")

                    #Se comprueba el rol de "scheduler"
                    uid = decoded_oidc["sub"]
                    user_role = "scheduler"
                except Exception as oidc_err:
                    return {'error': f'Autenticación fallida: {oidc_err}'}, 401

            if required_roles and user_role not in required_roles:
                return {'error': 'Acceso no autorizado a esta tarea.'}, 403

            kwargs['uid'] = uid
            kwargs['role'] = user_role
            return f(request, *args, **kwargs)
        return wrapper
    return decorator
