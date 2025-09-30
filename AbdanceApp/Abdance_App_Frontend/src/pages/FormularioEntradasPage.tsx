import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import FormularioEntrada, { DatosFormulario } from "../components/FormularioEntrada";
import NeonButton from "../components/NeonButton";
import SimpleButton from "../components/SimpleButton";
import MensajeAlerta from "../components/MensajeAlerta";

const STORAGE_KEY = "datosFormEntradas";

export default function FormularioEntradasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { entradasSeleccionadas, eventoId, evento } = location.state || {};


  const entradas: { tipo: string; cantidad: number }[] = entradasSeleccionadas || [];

  const formularios: { tipo: string }[] = entradas.flatMap((entrada) =>
    Array(entrada.cantidad).fill({ tipo: entrada.tipo })
  );

  const [formIndex, setFormIndex] = useState(0);
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);
  const [errores, setErrores] = useState<{ [campo: string]: boolean }>({});


  // Cargar desde localStorage o iniciar en blanco
  const [datos, setDatos] = useState<DatosFormulario[]>(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) return JSON.parse(guardado);

    return formularios.map(() => ({
      nombre: "",
      apellido: "",
      dni: "",
      email: "",
      telefono: "",
    }));
  });

  // Guardar datos en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
  }, [datos]);

  const actualizarDato = (index: number, campo: keyof DatosFormulario, valor: string) => {
    const nuevosDatos = [...datos];
    nuevosDatos[index][campo] = valor;
    setDatos(nuevosDatos);
  };

  const validarFormulario = (): boolean => {
    const datosActuales = datos[formIndex];
    const nuevosErrores: { [campo: string]: boolean } = {};

    nuevosErrores.nombre = !datosActuales.nombre.trim();
    nuevosErrores.apellido = !datosActuales.apellido.trim();
    nuevosErrores.dni = !/^\d{8}$/.test(datosActuales.dni);
    nuevosErrores.email = !/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(datosActuales.email);
    nuevosErrores.telefono = !/^\d{10,15}$/.test(datosActuales.telefono);

    setErrores(nuevosErrores);

    const hayErrores = Object.values(nuevosErrores).some((error) => error === true);

    return !hayErrores;
  };

  const avanzar = async () => {
    if (!validarFormulario()) return;


    if (formIndex < formularios.length - 1) {
      setFormIndex(formIndex + 1);
    } else {
      if (!mostrarAdvertencia) {
        setMostrarAdvertencia(true); 
      } else {
        localStorage.removeItem(STORAGE_KEY); 
        await crearPreferenciaPago(); 
      }
    }
  };

  const retroceder = () => {
    if (formIndex > 0) {
      setFormIndex(formIndex - 1);
    } else {
      localStorage.removeItem(STORAGE_KEY); 
      navigate(`/evento/${eventoId}`);
    }
  };

  if (!datos[formIndex]) {
    return <div className="text-white text-center mt-20">Cargando formulario...</div>;
  }

  const crearPreferenciaPago = async () => {
    try {
      // 1. Obtener el evento completo por código
      if (!evento || !evento.entradas) {
        throw new Error("No se encontraron precios para este evento.");
      }

      const precios = evento.entradas.reduce((acc: any, entrada: any) => {
        acc[entrada.tipo] = entrada.precio;
        return acc;
      }, {});


      // 2. Crear lista de entradas con precios reales
      const entradasConPrecio = entradas.map((entrada) => ({
        tipo: entrada.tipo,
        cantidad: entrada.cantidad,
        precio: precios[entrada.tipo] || 0, // fallback si no hay precio
      }));

      // 3. Enviar a crear la preferencia
      const response = await fetch("http://localhost:5000/crear_preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evento_id: eventoId,
          nombreEvento: evento?.nombre || "",
          lugar: evento?.lugar || "",
          fecha: evento?.fecha || "",
          imagen: evento?.imagen || "",
          entradas: entradasConPrecio,
        }),
      });


      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert("Error al generar preferencia de pago.");
      }
    } catch (error) {
      console.error("Error creando preferencia:", error);
      alert("Ocurrió un error al procesar el pago.");
    }
  };


  return (
    <div className="min-h-screen text-white p-6 flex flex-col items-center justify-center">
      <h1 className="text-2xl text-center font-bold mb-4">Detalles Comprador</h1>



      <FormularioEntrada
        index={formIndex}
        tipoEntrada={formularios[formIndex]?.tipo}
        datos={datos[formIndex]}
        onChange={actualizarDato}
        errores={errores}
      />

      
      {mostrarAdvertencia && (
        <MensajeAlerta
          tipo="advertencia"
          mensaje="Una vez que hagas clic para Confirmar, se te redireccionará a MercadoPago. Asegurate que los datos estén bien."
        />
      )}

      <div className="flex justify-between w-full max-w-sm mt-8">
        <SimpleButton onClick={retroceder}>Volver</SimpleButton>
        <NeonButton onClick={avanzar}>
          {formIndex < formularios.length - 1
            ? "Siguiente"
            : mostrarAdvertencia
              ? "Confirmar"
              : "Siguiente"}
        </NeonButton>
      </div>
    </div>
  );
}
