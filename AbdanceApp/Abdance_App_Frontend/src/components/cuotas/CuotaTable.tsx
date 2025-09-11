import Loader from "../Loader";
import generalDateParsing from "../../utils/generalDateParsing";
import BotonCreacionCuotas from "./BotonCreacionCuotas";
import MensajeAlerta from "../MensajeAlerta";
import { useEffect, useState } from "react";
import { Dialog, DialogTitle } from "@headlessui/react";
import { Cuota } from "./Cuota";



//Ventana de tipo modal para pagar las cuotas seleccionadas.
export function PagoManualModal({
  open,
  onClose,
  selectedCuotas,
  onSuccess,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  selectedCuotas: Cuota[];
  onSuccess: () => void;
}>) {
  const [loading, setLoading] = useState(false);
  const [montos, setMontos] = useState<Record<string, string>>({});

  const token = localStorage.getItem("token");
  const endpointUrl = import.meta.env.VITE_API_URL;


  useEffect(() => {
    if (open) {
      const iniciales: Record<string, string> = {};
      selectedCuotas.forEach((c) => {
        iniciales[c.id] = c.precio_cuota;
      });
      setMontos(iniciales);
    }
  }, [open, selectedCuotas]);

  const handleMontoChange = (id: string, value: string) => {
    setMontos((prev) => ({ ...prev, [id]: value }));
  };

  const handleConfirm = async () => {
    setLoading(true);

    for (const [id, montoStr] of Object.entries(montos)) {
      const num = parseFloat(montoStr);
      if (isNaN(num) || num <= 0) {
        alert(`Monto inválido para la cuota con ID: ${id}`);
        setLoading(false);
        return;
      }
    }

    //Armar el formato de la lista
    const listaCuotas = Object.entries(montos).map(([id, montoStr]) => ({
      [id]: parseFloat(montoStr),
    }));

    try {
      const res = await fetch(`${endpointUrl}/pagar_cuota/manual`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lista_cuotas: listaCuotas }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-gradient-to-t from-indigo-200 via-indigo-400 to-indigo-600 p-6 rounded-lg shadow-lg max-w-md w-full text-black max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-xl font-extrabold mb-4 text-center">
          Confirmar Pago Manual
        </DialogTitle>

        <div className="space-y-4 max-h-100 overflow-auto mb-8">
          {selectedCuotas.map(c => (
            <div
              key={c.id}
              className="bg-white rounded-lg shadow-md p-4 flex flex-col space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">ID de Cuota</span>
                <span className="text-sm text-gray-600">{c.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">DNI Alumno</span>
                <span className="text-sm text-gray-600">{c.dniAlumno}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Concepto</span>
                <span className="text-sm text-gray-600">{c.concepto}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Tipo de Monto</span>
                <span className="text-sm text-gray-600">{c.tipoMonto}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Monto a pagar</span>
                <input
                  type="number"
                  className="w-24 p-1 border-b border-gray-300 py-1 focus:border-b-2 focus:border-blue-700 transition-colors focus:outline-none peer bg-inherit"
                  value={montos[c.id] ?? ''}
                  onChange={e => handleMontoChange(c.id, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-black text-center italic mb-3">
          Las fechas de pago quedarán con la fecha y hora actual
        </p>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-white rounded hover:bg-gray-300"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={loading}
          >
            {loading ? "Procesando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}


export function CuotaAdminTable() {
  const endpointUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token")!;

  //Filtros
  const [dniFilter, setDniFilter] = useState("");
  const [disciplinaFilter, setDisciplinaFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");

  const [disciplinas, setDisciplinas] = useState<{ id:string; nombre:string }[]>([]);
  const estados = ["Pagado", "Pendiente"];

  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  //Para el modal de pago
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);


  //Carga de lista de disciplinas
  useEffect(() => {
    fetch(`${endpointUrl}/cuotas/datos-disciplina`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setDisciplinas)
      .catch(console.error);
  }, []);


  //Fetch de las cuotas
  const handleBuscar = async () => {
    setLoading(true);
    setError(null);
    setSelectedIds(new Set());
    try {
      const params = new URLSearchParams({
        dia_recargo: "11",
        limite:      "100"
      });
      if (dniFilter) params.append("dniAlumno", dniFilter);
      if (disciplinaFilter) params.append("idDisciplina", disciplinaFilter);

      //El estado se filtrará después de la llamada
      const url = `${endpointUrl}/cuotas?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const body = await res.json();
        if (Array.isArray(body.error)) {
          setError(body.error["0"].msg as string);
        } else {
          setError(body.error as string);
        }
        return;
      }
      const data: Cuota[] = await res.json();

      setCuotas(estadoFilter ? data.filter(c => c.estado === estadoFilter) : data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };


  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const openModal = () => selectedIds.size && setOpen(true);
  const closeModal = () => setOpen(false);
  const handleSuccess = () => handleBuscar(); //Recarga las mismas cuotas


  const tableHeaderStyle = "bg-[#fff0] text-[#fff] justify-center";
  const tableDatacellStyle = "text-blue-500 bg-white rounded-xl m-0.5 p-1";

  let contenidoResultados;
  if (loading) {
    contenidoResultados = (
      <div className="flex flex-row w-full h-30 justify-center mt-40">
        <Loader />
      </div>
    ) 
  } else if (error) {
    contenidoResultados = (
      <div className="w-full overflow-auto">
        <MensajeAlerta
          tipo="error"
          mensaje={`Error: ${error}`}
        />
      </div>
    );
  } else {
    contenidoResultados = (
      <>
        <div className={cuotas.length == 0 ? "hidden": "w-full overflow-auto"}>
          <table className="table-fixed min-w-[99%] rounded-xl border-none md:border bg-transparent md:bg-[#1a0049] border-separate border-spacing-x-1 border-spacing-y-1 w-auto">
            <thead>
              <tr className="bg-transparent">
                <th className="min-w-[30px] max-w-[35px] w-15"></th>
                <th className={tableHeaderStyle + " w-[40px]"}>Concepto</th>
                <th className={tableHeaderStyle + " w-[40px]"}>DNI</th>
                <th className={tableHeaderStyle + " w-[75px]"}>Estado</th>
                <th className={tableHeaderStyle + " w-[200px]"}>Fecha</th>
                <th className={tableHeaderStyle + " w-[50px]"}>Disciplina</th>
                <th className={tableHeaderStyle + " w-[60px]"}>Método</th>
                <th className={tableHeaderStyle + " w-[50px]"}>Monto</th>
                <th className={tableHeaderStyle + " w-[50px]"}>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {cuotas.map(c => (
                <tr key={c.id}> 
                  <td className={selectedIds.has(c.id) ? 'bg-purple-200 rounded-lg md:bg-transparent truncate max-w-[20px] p-1.5 min-w-5 w-8' : 'truncate max-w-[20px] p-1.5 min-w-5 w-8'}>
                    <input
                      className="h-5 w-5 flex rounded-md border border-[#a2a1a833] light:bg-[#e8e8e8] dark:bg-[#212121] peer-checked:bg-[#7152f3] transition cursor-pointer"
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={()=>toggleSelect(c.id)}
                    />
                  </td>
                  <td className={`${tableDatacellStyle} truncate capitalize`}>{c.concepto}</td>
                  <td className={`${tableDatacellStyle} truncate`}>{c.dniAlumno}</td>
                  <td className={`${tableDatacellStyle} truncate capitalize`}>{c.estado}</td>
                  <td className={`${tableDatacellStyle} truncate`}>{c.fechaPago?.trim() == "" ? "-" : new Date(c.fechaPago).toLocaleString("es-AR")}</td>
                  <td className={`${tableDatacellStyle} truncate capitalize`}>{c.nombreDisciplina}</td>
                  <td className={`${tableDatacellStyle} truncate capitalize`}>{c.metodoPago?.trim() == "" ? "-" : c.metodoPago}</td>
                  <td className={`${tableDatacellStyle} truncate`}>${c.precio_cuota}</td>
                  <td className={`${tableDatacellStyle} truncate capitalize`}>{c.tipoMonto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col space-y-2">
          <button
            onClick={openModal}
            disabled={!selectedIds.size}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 w-fit"
          >
            Pagar Seleccionadas
          </button>
          <div className="w-fit">
            <BotonCreacionCuotas />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="p-4">
      {/* ——— Filtros ——— */}
      <div className="flex flex-row gap-10 mb-4 mr-4">
        <div>
          <p className="block text-lg font-medium text-gray-200 md:text-gray-800">
            DNI Alumno
          </p>
          <input
              type="text"
              value={dniFilter}
              onChange={e => setDniFilter(e.target.value)}
              className="text-gray-900 mt-1 block w-full rounded border-gray-300 bg-pink-300 p-2 min-w-[150px] max-w-[150px] h-[34px]"
              placeholder="Ej: 43210987"
            />
        </div>
        <div>
          <p className="block text-lg font-medium text-gray-200 md:text-gray-800">
            Disciplina
          </p>
          <select
            value={disciplinaFilter}
            onChange={e => setDisciplinaFilter(e.target.value)}
            className="text-gray-900 mt-1 block w-fit rounded border-gray-300 bg-pink-300 p-2 cursor-pointer capitalize"
          >
            <option value="">Todas</option>
            {disciplinas.map(d => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="block text-lg font-medium text-gray-200 md:text-gray-800">
            Estado
          </p>
          <select
              value={estadoFilter}
              onChange={e => setEstadoFilter(e.target.value)}
              className="text-gray-900 mt-1 block w-full rounded border-gray-300 bg-pink-300 p-2 cursor-pointer"
            >
              <option value="">Todos</option>
              {estados.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
        </div>
        <div className="ml-auto my-auto place-self-center">
          <button
            onClick={handleBuscar}
            className="self-end px-4 py-2 text-white rounded"
          >
            Buscar
          </button>
        </div>
      </div>
      
      {/* ——— Resultados ——— */}
      {contenidoResultados}

      <PagoManualModal
        open={open}
        onClose={closeModal}
        selectedCuotas={cuotas.filter(c => selectedIds.has(c.id))}
        onSuccess={handleSuccess}
      />
    </div>
  );
}