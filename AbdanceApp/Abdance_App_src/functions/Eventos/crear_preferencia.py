import os
from dotenv import load_dotenv
import mercadopago
from flask import jsonify

# Cargar variables de entorno
load_dotenv()

# Leer el token de Mercado Pago
ACCESS_TOKEN = os.getenv("MERCADOPAGO_ACCESS_TOKEN")

if not ACCESS_TOKEN:
    raise ValueError("Falta el token MERCADOPAGO_ACCESS_TOKEN.")

# Inicializar el SDK de Mercado Pago
sdk = mercadopago.SDK(ACCESS_TOKEN)

def crear_preferencia(request):
    try:
        data = request.get_json()
        print("📦 Datos recibidos del frontend:")
        print(data)

        evento_id = data.get("evento_id")
        entradas = data.get("entradas")
        nombre_evento = data.get("nombreEvento")
        lugar = data.get("lugar")
        fecha = data.get("fecha")
        imagen = data.get("imagen")

        if not evento_id or not entradas:
            return jsonify({"error": "Faltan datos requeridos"}), 400

        print("🟢 Entradas recibidas:", entradas)
        print(f"📍 Evento ID: {evento_id}")
        print(f"📅 Evento: {nombre_evento} | Lugar: {lugar} | Fecha: {fecha} | Imagen: {imagen}")

        # Crear ítems para MercadoPago
        items = []
        for entrada in entradas:
            tipo = entrada.get("tipo")
            cantidad = entrada.get("cantidad")
            precio = entrada.get("precio")

            if not tipo or not cantidad or not precio:
                return jsonify({"error": "Faltan campos en una entrada"}), 400

            item = {
                "title": f"Entrada {tipo} - Evento {evento_id}",
                "quantity": int(cantidad),
                "unit_price": float(precio),
                "currency_id": "ARS"
            }
            items.append(item)

        print("🧾 Ítems para MercadoPago:")
        for item in items:
            print(item)

        # Crear preferencia
        preference_data = {
            "items": items,
            "external_reference": evento_id,
            "back_urls": {
                "success": "https://www.geeksforgeeks.org/python/ternary-operator-in-python/",  #f"http://localhost:5173/pago-exitoso?eventoId={evento_id}",
                "failure": "https://www.youtube.com/",
                "pending": "https://www.instagram.com/?hl=es-la"
            },
            #"auto_return": "approved"
        }

        print("📤 Enviando a MercadoPago:")
        print(preference_data)

        preference_response = sdk.preference().create(preference_data)
        print("🟡 RESPONSE COMPLETO:", preference_response)  # DEBUG EN CONSOLA

        if "response" not in preference_response:
            return jsonify({
                "error": "Respuesta inválida de MercadoPago",
                "detalle": preference_response
            }), 500

        init_point = preference_response["response"].get("init_point")
        if not init_point:
            return jsonify({
                "error": "No se pudo generar el init_point",
                "detalle": preference_response["response"]
            }), 500

        print("✅ init_point generado:", init_point)

        return jsonify({"init_point": init_point}), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
