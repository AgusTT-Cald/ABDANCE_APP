
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import NeonButton from '../components/NeonButton';
import { useNavigate } from "react-router-dom";

interface Entrada {
  tipo: string;
  precio: number;
  cantidad: number;
}

export default function EventoDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [evento, setEvento] = useState<any>(null);
  const [cantidades, setCantidades] = useState<number[]>([]);
  const hayEntradasSeleccionadas = cantidades.some((cantidad) => cantidad > 0);


  useEffect(() => {
    if (!id) return;

    const fetchEvento = async () => {
      const docRef = doc(db, "eventos", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEvento(data);

        if (data.conEntrada && Array.isArray(data.entradas)) {
          setCantidades(Array(data.entradas.length).fill(0));
        }
      }
    };

    fetchEvento();
  }, [id]);

  

  const actualizarCantidad = (index: number, valor: number) => {
    const nuevasCantidades = [...cantidades];
    nuevasCantidades[index] = valor;
    setCantidades(nuevasCantidades);
  };

  const calcularTotal = () => {
    if (!evento || !evento.entradas) return 0;
    return evento.entradas.reduce((total: number, entrada: Entrada, i: number) => {
      return total + entrada.precio * cantidades[i];
    }, 0);
  };

  if (!evento) return <div className="fondo-gradiente">Cargando evento...</div>;

  return (
    
    <div className="min-h-screen  px-10 py-6 flex flex-col items-center">
      <div className="w-full max-w-5xl p-8">
        <h1 className="text-3xl font-bold mb-4 text-center">{evento.nombre}</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Imagen */}
          <div className="flex-1 flex justify-center">
            <img
              src={evento.urlImg}
              alt={evento.nombre}
              className="rounded-xl shadow-xl w-full max-w-md object-cover"
            />
          </div>

          {/* Detalles */}
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Horario y Ubicación:</h3>
              <p className="text-lg">{new Date(evento.fecha.seconds * 1000).toLocaleString()}</p>
              <p className="text-lg">{evento.lugar}</p>
            </div>

            {evento.conEntrada ? (
              <div>
                <h4 className="text-xl font-semibold mt-6 mb-2">Tipo de Entradas</h4>
                <div className="space-y-3">
                  {evento.entradas.map((entrada: Entrada, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-4 border-b pb-2"
                    >
                      <span className="text-lg">{entrada.tipo}</span>
                      <span className="text-lg">${entrada.precio}</span>
                      <select
                        value={cantidades[index]}
                        onChange={(e) => actualizarCantidad(index, parseInt(e.target.value))}
                        className="bg-[#1D094E] text-white text-lg font-semibold py-2 pl-2 pr-4 rounded-full focus:outline-none"
                      >
                        {[...Array(11).keys()].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="text-right text-xl font-bold mt-6">
                  TOTAL: ${calcularTotal().toLocaleString("es-AR")}
                </div>
              </div>
            ) : (
              <p className="text-lg mt-4">{evento.descripcion}</p>
            )}
          </div>
        </div>

      {hayEntradasSeleccionadas && (
        <div className="flex justify-center mt-8">
          <NeonButton
            onClick={() => {
              const entradasSeleccionadas = evento.entradas
                .map((entrada: Entrada, index: number) => ({
                  tipo: entrada.tipo,
                  cantidad: cantidades[index],
                }))
                .filter((e: { tipo: string; cantidad: number }) => e.cantidad > 0);

              navigate("/formulario-entradas", {
                state: {
                  entradasSeleccionadas,
                  eventoId: evento.codigo,
                  evento: {
                    nombre: evento.nombre,
                    lugar: evento.lugar,
                    fecha: evento.fecha,
                    urlImg: evento.urlImg,
                    entradas: evento.entradas
                  }
                },
              });
            }}
          >
            Siguiente
          </NeonButton>
        </div>
      )}
      </div>
    </div>
  );
}
