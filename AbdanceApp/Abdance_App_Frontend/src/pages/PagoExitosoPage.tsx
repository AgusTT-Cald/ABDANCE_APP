import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function PagoExitosoPage() {
  const [mensaje, setMensaje] = useState("Procesando tu compra...");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const eventoId = searchParams.get("eventoId");
    const datos = localStorage.getItem("datosFormEntradas");

    if (!eventoId || !datos) {
      setMensaje("Faltan datos para registrar las entradas.");
      return;
    }

    const formularios = JSON.parse(datos);

    fetch("http://localhost:5000/api/registrar_entradas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evento_id: eventoId,
        formularios,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setMensaje("¡Entradas registradas! Te enviamos un correo con los QR.");
          localStorage.removeItem("datosFormEntradas");
        } else {
          setMensaje("Ocurrió un error: " + data.error);
        }
      })
      .catch(() => setMensaje("Error en la comunicación con el servidor."));
  }, []);

  return (
    <div className="text-white text-center mt-20">
      <h1 className="text-2xl font-bold">{mensaje}</h1>
      <button onClick={() => navigate("/")} className="mt-8 px-4 py-2 bg-purple-600 rounded">Volver al inicio</button>
    </div>
  );
}
