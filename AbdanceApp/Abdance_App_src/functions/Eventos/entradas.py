import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import firestore
from firebase_init import db
from datetime import datetime
import qrcode
import base64
from io import BytesIO
from email.message import EmailMessage
import smtplib

# Cargar variables de entorno
load_dotenv()

def entradas(request, uid=None, role=None):
    if request.method == 'GET':
        return getEntradas(request)

    elif request.method == 'POST':
        try:
            data = request.get_json()
            if 'formularios' in data:
                return postEntradasMultiples(request)
            else:
                return postEntrada(request)
        except Exception as e:
            return {'error': str(e)}, 500

    elif request.method == 'PUT':
        return putEntrada(request)

    elif request.method == 'DELETE':
        return {"Este metodo no esta disponible"}  # deleteEntrada(request)

    else:
        return {'error': 'Método no permitido'}, 405


# GET
def getEntradas(request):
    evento_id = request.args.get('evento_id')
    entrada_id = request.args.get('entrada_id')

    if not evento_id:
        return {'error': 'Se requiere evento_id'}, 400

    ref = db.collection('eventos').document(evento_id).collection('entradas')

    if entrada_id:
        doc = ref.document(entrada_id).get()
        if doc.exists:
            return doc.to_dict(), 200
        else:
            return {'error': 'Entrada no encontrada'}, 404
    else:
        docs = ref.stream()
        entradas = [doc.to_dict() for doc in docs]
        return entradas, 200


# POST simple
def postEntrada(request):
    data = request.get_json()
    evento_id = data.get('evento_id')

    if not evento_id:
        return {'error': 'Se requiere evento_id'}, 400

    entrada_data = {
        'nombre': data.get('nombre'),
        'apellido': data.get('apellido'),
        'dni': data.get('dni'),
        'email': data.get('email'),
        'telefono': data.get('telefono'),
        'tipo_entrada': data.get('tipo_entrada'),
        'precio': data.get('precio'),
        'estado': 'activa',
        'created_at': datetime.now().isoformat()
    }

    ref = db.collection('eventos').document(evento_id).collection('entradas').document()
    entrada_data['id'] = ref.id

    qr = qrcode.make(ref.id)
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    entrada_data['qr_code'] = qr_base64

    ref.set(entrada_data)

    return {'mensaje': 'Entrada creada correctamente', 'entrada': entrada_data}, 201


# PUT para cambiar estado
def putEntrada(request):
    data = request.get_json()
    evento_id = data.get('evento_id')
    entrada_id = data.get('entrada_id')
    nuevo_estado = data.get('estado')

    if not evento_id or not entrada_id or not nuevo_estado:
        return {'error': 'Faltan datos'}, 400

    ref = db.collection('eventos').document(evento_id).collection('entradas').document(entrada_id)
    ref.update({'estado': nuevo_estado})
    return {'mensaje': 'Estado de entrada actualizado'}, 200


# POST múltiple con envío de mail usando variables de entorno
def postEntradasMultiples(request):
    data = request.get_json()
    evento_id = data.get("evento_id")
    formularios = data.get("formularios")

    if not evento_id or not formularios:
        return {'error': 'Faltan datos'}, 400

    entradas_creadas = []

    MAIL_USER = os.getenv("MAIL_USER")
    MAIL_PASS = os.getenv("MAIL_PASS")
    MAIL_FROM = os.getenv("MAIL_FROM")

    if not MAIL_USER or not MAIL_PASS or not MAIL_FROM:
        return {'error': 'Configuración de correo no definida en variables de entorno'}, 500

    for f in formularios:
        ref = db.collection('eventos').document(evento_id).collection('entradas').document()

        entrada_data = {
            'id': ref.id,
            'nombre': f.get('nombre'),
            'apellido': f.get('apellido'),
            'dni': f.get('dni'),
            'email': f.get('email'),
            'telefono': f.get('telefono'),
            'tipo_entrada': f.get('tipo'),
            'estado': 'activa',
            'created_at': datetime.now().isoformat()
        }

        qr = qrcode.make(ref.id)
        buffer = BytesIO()
        qr.save(buffer, format="PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        entrada_data['qr_code'] = qr_base64

        ref.set(entrada_data)
        entradas_creadas.append(entrada_data)

        # Envío de email
        try:
            msg = EmailMessage()
            msg['Subject'] = f"Entrada para el evento"
            msg['From'] = MAIL_FROM
            msg['To'] = entrada_data['email']
            msg.set_content(f"""
Hola {entrada_data['nombre']} {entrada_data['apellido']},

Gracias por tu compra. Esta es tu entrada al evento.

DNI: {entrada_data['dni']}
Tipo de Entrada: {entrada_data['tipo_entrada']}
ID de Entrada: {entrada_data['id']}
""")
            img_data = base64.b64decode(qr_base64)
            msg.add_attachment(img_data, maintype='image', subtype='png', filename="entrada_qr.png")

            with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
                smtp.login(MAIL_USER, MAIL_PASS)
                smtp.send_message(msg)
        except Exception as e:
            print(f"Error al enviar correo: {e}")

    return {'mensaje': 'Entradas registradas y correos enviados', 'entradas': entradas_creadas}, 201
