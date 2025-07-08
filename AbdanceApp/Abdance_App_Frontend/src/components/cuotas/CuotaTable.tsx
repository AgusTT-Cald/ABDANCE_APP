import Loader from "../Loader";
import generalDateParsing from "../../utils/generalDateParsing";
import { useEffect, useState } from "react";
import { useAuthFetch } from "../../hooks/useAuthFetch";
import { Dialog, DialogTitle } from "@headlessui/react";



type Cuota = {
    concepto: string;
    dniAlumno: string;
    estado: string;
    fechaPago: string;
    id: string;
    idDisciplina: string;
    metodoPago: string;
    precio_cuota: string;
    nombreDisciplina: string;
};

//Ventada de tipo modal para pagar las cuotas seleccionadas.
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

  // Inicializar montos con los valores actuales cuando se abre el modal
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

    // Validar montos: que sean números positivos válidos
    for (const [id, montoStr] of Object.entries(montos)) {
      const num = parseFloat(montoStr);
      if (isNaN(num) || num <= 0) {
        alert(`Monto inválido para la cuota con ID: ${id}`);
        setLoading(false);
        return;
      }
    }

    // Armar el nuevo formato de lista_cuotas: [{id: monto}, ...]
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

      if (!res.ok) throw new Error("Error en el pago manual");

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al procesar el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-indigo-200 p-6 rounded-lg shadow-lg max-w-md w-full text-black max-h-[90vh] overflow-y-auto">
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


// Tabla de cuotas para Admin
export function CuotaAdminTable() {
  const endpointUrl = import.meta.env.VITE_API_URL;
  const [reloadFlag, setReloadFlag] = useState(0);
  const endpoint = `${endpointUrl}/cuotas?dia_recargo=11&reload=${reloadFlag}`;
  const { data: cuotas, loading, error } = useAuthFetch<Cuota[]>(endpoint);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  // --- FILTROS ---
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [disciplinaFilter, setDisciplinaFilter] = useState<string>('');
  const [dniFilter, setDniFilter] = useState<string>('');

  // Extraer valores únicos para selects
  const estados = Array.from(new Set(cuotas?.map(c => c.estado))).sort((a, b) => a.localeCompare(b));
  const disciplinas = Array.from(new Set(cuotas?.map(c => c.nombreDisciplina))).sort((a, b) => a.localeCompare(b));

  // Filtrar datos
  const filteredCuotas = cuotas?.filter(c => {
    return (
      (!estadoFilter || c.estado === estadoFilter) &&
      (!disciplinaFilter || c.nombreDisciplina === disciplinaFilter) &&
      (!dniFilter || c.dniAlumno.includes(dniFilter))
    );
  });

  const selectedCuotas = cuotas?.filter(c => selectedIds.has(c.id)) || [];
  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const openModal = () => {
    if (selectedIds.size === 0) return;
    setOpen(true);
  };

  const handleClose = () => setOpen(false);
  const handleSuccess = () => setReloadFlag(f => f + 1);

  const tableHeaderStyle = "bg-[#fff0] text-[#fff] justify-center";
  const tableDatacellStyle = "text-blue-500 bg-white rounded-xl m-0.5 p-1";

  if (loading) return  <div className="flex justify-center align-middle items-center w-full h-full"><Loader /></div>;
  if (error) return <p>Error: {error}</p>;

  return (
    <>
      <>
      <div className="flex flex-wrap gap-4 gap-x-6 mb-4 mx-4 justify-center md:justify-around">
        <div>
          <p className="block text-lg font-medium text-gray-200 md:text-gray-800">Estado:</p>
          <select
            className="text-gray-900 mt-1 block w-full rounded border-gray-300 bg-pink-300 p-2 cursor-pointer"
            value={estadoFilter}
            onChange={e => setEstadoFilter(e.target.value)}
          >
            <option value="">Todos</option>
            {estados.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <p className="block text-lg font-medium text-gray-200 md:text-gray-800">Disciplina:</p>
          <select
            className="text-gray-900 mt-1 block w-full rounded border-gray-300 bg-pink-300 p-2 cursor-pointer"
            value={disciplinaFilter}
            onChange={e => setDisciplinaFilter(e.target.value)}
          >
            <option value="">Todas</option>
            {disciplinas.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex flex-col items-center">
          <p className="block text-lg font-medium text-gray-200 md:text-gray-800">DNI Alumno:</p>
          <input
            type="text"
            className="text-gray-900 mt-1 block w-full rounded border-gray-300 bg-pink-300 p-2 min-w-[150px] max-w-[150px]"
            placeholder="Buscar DNI..."
            value={dniFilter}
            onChange={e => setDniFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="w-full overflow-x-auto">
      <div className="min-w-[640px] mx-auto">
        <table className="table-fixed min-w-[99%] rounded-xl border-none md:border m-1 bg-transparent md:bg-[#1a0049] border-separate border-spacing-x-1 border-spacing-y-1 w-auto">
          <thead>
            <tr className="bg-transparent">
              <th></th>
              <th className={tableHeaderStyle + " w-[40px]"}>Concepto</th>
              <th className={tableHeaderStyle + " w-[40px]"}>DNI Alumno</th>
              <th className={tableHeaderStyle + " w-[75px]"}>Estado</th>
              <th className={tableHeaderStyle + " w-[200px]"}>Fecha de Pago</th>
              <th className={tableHeaderStyle + " w-[50px]"}>Disciplina</th>
              <th className={tableHeaderStyle + " w-[60px]"}>Metodo de Pago</th>
              <th className={tableHeaderStyle + " w-[50px]"}>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {filteredCuotas?.map(c => (
              <tr key={c.id} >
                <td className={selectedIds.has(c.id) ? 'bg-purple-200 rounded-lg md:bg-transparent p-2 min-w-5 w-8' : 'p-2 min-w-5 w-8'}>
                  <input
                    className="h-5 w-5 flex rounded-md border border-[#a2a1a833] light:bg-[#e8e8e8] dark:bg-[#212121] peer-checked:bg-[#7152f3] transition cursor-pointer"
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                  />
                </td>
                <td className={`${tableDatacellStyle} truncate max-w-[150px] capitalize`}>{c.concepto}</td>
                <td className={`${tableDatacellStyle} truncate max-w-[100px]`}>{c.dniAlumno}</td>
                <td className={`${tableDatacellStyle} truncate max-w-[110px] capitalize`}>{c.estado}</td>
                <td className={`${tableDatacellStyle} truncate max-w-[200px]`}>{c.fechaPago?.trim() == "" ? "-" : generalDateParsing(c.fechaPago)}</td>
                <td className={`${tableDatacellStyle} truncate max-w-[200px] capitalize`}>{c.nombreDisciplina}</td>
                <td className={`${tableDatacellStyle} truncate max-w-[200px] capitalize`}>{c.metodoPago?.trim() == "" ? "-" : c.metodoPago}</td>
                <td className={`${tableDatacellStyle} truncate max-w-[50px]`}>${c.precio_cuota}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        </div>

        <button
          onClick={openModal}
          disabled={selectedIds.size === 0}
          className="mt-4 mb-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Pagar Seleccionadas
        </button>

        <PagoManualModal
          open={open}
          onClose={handleClose}
          selectedCuotas={selectedCuotas}
          onSuccess={handleSuccess}
        />
      </>
    </>
  );
}

