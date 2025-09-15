import { useState } from 'react';
import { exportarYearExcel, exportarMesExcel } from './EstadisticasExportersExcel';
import { exportarMesPDF, exportarYearPDF } from './EstadisticasExportersPDF';
import MensajeAlerta from '../MensajeAlerta';
import Loader from '../Loader';

const monthNames = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const MONTH_ORDER = [
  "enero", "febrero", "marzo", "abril",
  "mayo", "junio", "julio", "agosto",
  "septiembre", "octubre", "noviembre", "diciembre"
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
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
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
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      setByMonthData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };


  const tableHeaderStyle = "bg-[#fff0] text-[#fff] justify-center text-lg";
  const tableDatacellStyle = "text-blue-500 bg-white rounded-xl m-0.5 p-1";


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
      <div className="flex flex-row w-full h-30 justify-center mt-40">
        <Loader />
      </div>}
      {error && <div className="w-full overflow-auto">
        <MensajeAlerta
          tipo="error"
          mensaje={`Error: ${error}`}
        />
      </div>}

      {byYearData && (
         <div>
          <button className='dark:text-white' onClick={() => exportarYearExcel(year, byYearData!)}>Exportar a Excel</button>
          <button className='dark:text-white' onClick={() => exportarYearPDF(year, byYearData!)}>Exportar a PDF</button>
          <table className="table-fixed min-w-[60%] max-w-[80%] rounded-xl border-none md:border m-1 bg-transparent md:bg-[#1a0049] border-separate border-spacing-x-1 border-spacing-y-1 mx-auto">
            <thead>
            <tr className="bg-transparent">
                <th className={tableHeaderStyle}>Mes</th>
                <th className={tableHeaderStyle}>Total</th>
            </tr>
            </thead>
            <tbody>
            {MONTH_ORDER.map(monthName => (
                <tr key={monthName} className="border-t">
                <td className={`${tableDatacellStyle} capitalize`}>{monthName}</td>
                <td className={`${tableDatacellStyle}`}>
                    ${byYearData[monthName] ?? 0}
                </td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>
      )}

      {byMonthData && (
        <div className="space-y-2">
          <button className='dark:text-white' onClick={() => exportarMesExcel(year, month, byMonthData!)}>Exportar a Excel</button>
          <button className='dark:text-white' onClick={() => exportarMesPDF(year, month, byMonthData!)}>Exportar a PDF</button>
          <table className="mx-auto table-fixed min-w-[90%] rounded-xl border-none md:border m-1 bg-transparent md:bg-[#1a0049] border-separate border-spacing-x-1 border-spacing-y-1">
            <thead><tr className="bg-transparent">
              <th className={tableHeaderStyle + "w-[30px]"}>Concepto</th>
              <th className={tableHeaderStyle + "w-[100px]"}>Fecha Pago</th>
              <th className={tableHeaderStyle + "w-[40px]"}>DNI de Alumno</th>
              <th className={tableHeaderStyle + "w-[40px]"}>Monto</th>
            </tr></thead>
            <tbody>
              {byMonthData.Detalle.map((d,i) => (
                <tr key={i} className="border-t">
                  <td className={`${tableDatacellStyle} truncate max-w-[150px] capitalize`}>{d.concepto}</td>
                  <td className={`${tableDatacellStyle} truncate max-w-[200px] capitalize`}>{new Date(d.fechaPago).toLocaleString("es-AR")}</td>
                  <td className={`${tableDatacellStyle} truncate max-w-[100px] capitalize`}>{d.DNIAlumno}</td>
                  <td className={`${tableDatacellStyle} truncate max-w-[100px] capitalize`}>${d.montoPagado}</td>
                </tr>
              ))}
              <tr className="bg-transparent">
                <td className={tableHeaderStyle + "w-[40px] text-lg font-medium p-2 text-center"}>Total</td>
                <td></td>
                <td></td>
                <td className={tableHeaderStyle + "w-[40px] text-md font-medium"}>${byMonthData.Total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EstadisticasTable