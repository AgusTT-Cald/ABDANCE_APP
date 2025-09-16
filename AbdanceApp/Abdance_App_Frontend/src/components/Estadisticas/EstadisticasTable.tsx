import { useState } from 'react';
import { exportarYearExcel, exportarMesExcel } from './EstadisticasExportersExcel';
import { exportarMesPDF, exportarYearPDF } from './EstadisticasExportersPDF';
import MensajeAlerta from '../MensajeAlerta';
import Loader from '../Loader';
import { Icon } from '@iconify/react/dist/iconify.js';



const monthNames = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];


export function EstadisticasTable() {
  const baseUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  //0 = ninguno, 1 = totales por año, 2 = total del mes
  const [mode, setMode] = useState<0|1|2>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  //Inputs
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth()+1);

  //Respuestas de los endpoints
  const [byYearData, setByYearData] = useState<Record<string, number>|null>(null);
  const [byMonthData, setByMonthData] = useState<{
    Detalle: { fechaPago: string; montoPagado: number; concepto: string, DNIAlumno: number }[];
    Total: number;
  }|null>(null);


  const reset = () => {
    setError(null);
    setByYearData(null);
    setByMonthData(null);
  };


  const handleFetchByYear = async () => {
    reset();
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/estadisticas/totales-por-anio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify({ year })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      setByYearData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };


  const handleFetchByMonth = async () => {
    reset();
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/estadisticas/total-del-mes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify({ year, month })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
      setByMonthData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-4 space-y-4">
      <div className="space-x-2">
        <button
          className={`mx-1 mb-3 text-white px-4 py-2 rounded ${mode===1?'bg-blue-600 text-white':'bg-gray-200'}`}
          onClick={() => { reset(); setMode(1); }}
        >
          Ingresos Totales del año
        </button>
        <button
          className={`text-white px-4 py-2 rounded ${mode===2?'bg-blue-600 text-white':'bg-gray-200'}`}
          onClick={() => { reset(); setMode(2); }}
        >
          Ingresos Totales del mes
        </button>
      </div>

      {/* Formularios */}
      {mode !== 0 && (
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div>
            <p className="block text-lg font-medium text-gray-200 md:text-gray-800">Año</p>
            <input
              type="number"
              className="text-gray-900 mt-1 block w-24 rounded border-gray-300 bg-pink-300 p-2"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
            />
          </div>
          {mode === 2 && (
            <div>
              <p className="block text-lg font-medium text-gray-200 md:text-gray-800">Mes</p>
              <select
                className="text-gray-900 mt-1 block w-28 h-10 rounded border-gray-300 bg-pink-300 p-2"
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
              >
                {monthNames.map((m,n) =>
                  <option key={n+1} value={n+1}>{m}</option>
                )}
              </select>
            </div>
          )}
          <button
            className="px-4 py-2 bg-green-500 text-white rounded self-end"
            onClick={mode===1? handleFetchByYear : handleFetchByMonth}
          >
            Consultar
          </button>
        </div>
      )}

      {loading && 
      <div>
        <p className="block text-lg font-medium text-gray-200 md:text-gray-800">Calculando datos...</p>
        <div className="flex flex-row w-full h-30 justify-center mt-10">
          <Loader />
        </div>
      </div>
      }
      {error && <div className="w-full overflow-auto">
        <MensajeAlerta
          tipo="error"
          mensaje={`Error: ${error}`}
        />
      </div>}

      {byYearData && (
         <div className="space-y-5 flex flex-col mt-20 items-center">
          <p className="block text-xl font-medium text-gray-200 md:text-gray-800 mb-10">Ya puedes descargar lo calculado en PDF y Excel.</p>
          <button onClick={() => exportarYearPDF(year, byYearData!)} className="relative bg-[#4b48ff] text-white font-medium text-[17px] px-4 py-[0.35em] pl-5 h-[4.0em] w-60 rounded-[0.9em] flex items-center overflow-hidden cursor-pointer shadow-[inset_0_0_1.6em_-0.6em_#f90404] group">
            <span className="mr-5 text-xl">Descargar en PDF</span>
            <div className="absolute right-[0.3em] bg-white h-[3.0em] w-[2.2em] rounded-[0.7em] flex items-center justify-center transition-all duration-500 group-hover:w-[calc(100%-0.6em)] shadow-[0.1em_0.1em_0.6em_0.2em_#f90404] active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width={36} height={36} className="w-[2.0em] transition-transform duration-100 text-[#f90404]">
                <Icon icon="material-symbols:picture-as-pdf-rounded" width="36" height="36" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width={36} height={36} className="w-[2.0em] transition-transform duration-100 text-[#f90404]">  
                <Icon icon="material-symbols:sim-card-download" width="36" height="36" />
              </svg>
            </div>
          </button>
          <button onClick={() => exportarYearExcel(year, byYearData!)} className="relative bg-[#04870a] text-white font-medium text-[17px] px-4 py-[0.35em] pl-5 h-[4.0em] w-60 rounded-[0.9em] flex items-center overflow-hidden cursor-pointer shadow-[inset_0_0_1.6em_-0.6em_#714da6] group">
            <span className="mr-5 text-xl">Descargar en Excel</span>
            <div className="absolute right-[0.3em] bg-white h-[3.0em] w-[2.2em] rounded-[0.7em] flex items-center justify-center transition-all duration-500 group-hover:w-[calc(100%-0.6em)] shadow-[0.1em_0.1em_0.6em_0.2em_#04870a] active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width={36} height={36} className="w-[2.0em] transition-transform duration-100 text-[#04870a]">  
                <Icon icon="material-symbols:csv-rounded" width="36" height="36" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width={36} height={36} className="w-[2.0em] transition-transform duration-100 text-[#04870a]">  
                <Icon icon="material-symbols:sim-card-download" width="36" height="36" />
              </svg>
            </div>
          </button>
        </div>
      )}

      {byMonthData && (
        <div className="space-y-2 flex flex-col mt-20 items-center">
          <p className="block text-xl font-medium text-gray-200 md:text-gray-800 mb-10">Ya puedes descargar lo calculado en PDF y Excel.</p>
          <button onClick={() => exportarMesPDF(year, month, byMonthData!)} className="relative bg-[#4b48ff] text-white font-medium text-[17px] px-4 py-[0.35em] pl-5 h-[4.0em] w-60 rounded-[0.9em] flex items-center overflow-hidden cursor-pointer shadow-[inset_0_0_1.6em_-0.6em_#f90404] group">
            <span className="mr-5 text-xl">Descargar en PDF</span>
            <div className="absolute right-[0.3em] bg-white h-[3.0em] w-[2.2em] rounded-[0.7em] flex items-center justify-center transition-all duration-500 group-hover:w-[calc(100%-0.6em)] shadow-[0.1em_0.1em_0.6em_0.2em_#f90404] active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width={36} height={36} className="w-[2.0em] transition-transform duration-100 text-[#f90404]">
                <Icon icon="material-symbols:picture-as-pdf-rounded" width="36" height="36" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width={36} height={36} className="w-[2.0em] transition-transform duration-100 text-[#f90404]">  
                <Icon icon="material-symbols:sim-card-download" width="36" height="36" />
              </svg>
            </div>
          </button>
          <button onClick={() => exportarMesExcel(year, month, byMonthData!)} className="relative bg-[#04870a] text-white font-medium text-[17px] px-4 py-[0.35em] pl-5 h-[4.0em] w-60 rounded-[0.9em] flex items-center overflow-hidden cursor-pointer shadow-[inset_0_0_1.6em_-0.6em_#714da6] group">
            <span className="mr-5 text-xl">Descargar en Excel</span>
            <div className="absolute right-[0.3em] bg-white h-[3.0em] w-[2.2em] rounded-[0.7em] flex items-center justify-center transition-all duration-500 group-hover:w-[calc(100%-0.6em)] shadow-[0.1em_0.1em_0.6em_0.2em_#04870a] active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width={36} height={36} className="w-[2.0em] transition-transform duration-100 text-[#04870a]">  
                <Icon icon="material-symbols:csv-rounded" width="36" height="36" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width={36} height={36} className="w-[2.0em] transition-transform duration-100 text-[#04870a]">  
                <Icon icon="material-symbols:sim-card-download" width="36" height="36" />
              </svg>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default EstadisticasTable