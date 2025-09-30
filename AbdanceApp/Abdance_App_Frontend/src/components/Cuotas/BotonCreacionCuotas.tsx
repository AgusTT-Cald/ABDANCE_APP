import { useState } from 'react';
import { Dialog, DialogTitle } from '@headlessui/react';
import { ShieldExclamationIcon, CalendarIcon } from "@heroicons/react/16/solid";


const MONTHS = [
  "Enero","Febrero","Marzo","Abril",
  "Mayo","Junio","Julio","Agosto",
  "Septiembre","Octubre","Noviembre","Diciembre"
];

export default function BotonCreacionCuotas() {
  const endpointUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  const [open, setOpen] = useState(false);
  const [esMatricula, setEsMatricula] = useState(false);
  const [mes, setMes] = useState<number>(new Date().getMonth()+1);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEsMatricula(false);
    setMes(new Date().getMonth()+1);
    setError(null);
    setSuccess(null);
  };

  const handleOpen = () => {
    resetForm();
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!esMatricula && (mes < 1 || mes > 12)) {
      setError('El mes debe estar entre 1 y 12.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${endpointUrl}/crear-cuotas-mes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify({ es_matricula: esMatricula, mes })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Error ${res.status}`);
      }
      setSuccess(json.mensaje);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Crear Cuotas Mes
      </button>

      <Dialog
        open={open}
        onClose={handleClose}
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto "
      >
        <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />

        <div className="bg-gradient-to-t from-indigo-200 via-indigo-400 to-indigo-600 text-black rounded-lg shadow-lg p-6 z-10 max-w-sm w-full max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-xl font-bold mb-4 text-gray-900 text-center">Crear Cuotas del Mes</DialogTitle>

          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={esMatricula}
                onChange={e => setEsMatricula(e.target.checked)}
                className="h-4 w-4"
              />
              <span className='font-medium'>¿Es matrícula? <i className='ml-1 italic text-right text-xs'>(Ignorará el numero de mes)</i> </span>
            </label>

            {!esMatricula && (
              <div className='flex flex-row'>
                <p className="block text-lg font-medium">
                Mes:
                </p>
                <select
                value={mes}
                onChange={e => setMes(Number(e.target.value))}
                className="ml-3 block w-28 rounded border-gray-300 bg-indigo-200 bg-opacity-30 p-1 pt-1.25 text-base rounded-lg focus:ring-violet-500 focus:border-violet-500"
                >
                {MONTHS.map((nombre, idx) => (
                    <option key={idx} value={idx + 1}>
                    {nombre}
                    </option>
                ))}
                </select>
                <CalendarIcon className='size-6 ml-4'></CalendarIcon>
              </div>
            )}
            <div className='flex flex-row flex-wrap justify-center mt-5'>
                <ShieldExclamationIcon className='size-7 text-yellow-500 mr-2'></ShieldExclamationIcon>
                <p><strong className='order-1 text-yellow-500 text-xl'>ADVERTENCIA</strong></p>
                <ShieldExclamationIcon className='size-7 text-yellow-500 ml-2'></ShieldExclamationIcon>
                <p className='order-2 mt-1'><strong className='italic'>¡Esto creará todas las cuotas para todos los usuarios, verifique bien los valores antes de confirmar!</strong></p>
            </div>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}
          </div>

          <div className="mt-6 flex justify-end space-x-2 text-white">
            <button
              onClick={handleClose}
                                        
              disabled={loading}
            >
              Volver
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

