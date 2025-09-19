import { utils, write } from 'xlsx';
import { saveAs } from 'file-saver';



export function exportarYearExcel(year: number, byYearData: Record<string, number>) {
  const rows = Object.entries(byYearData).map(([mes, total]) => ({
    Mes: mes.charAt(0).toUpperCase() + mes.slice(1),
    Total: total
  }));

  const ws = utils.json_to_sheet(rows);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, `Totales ${year}`);

  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, `totales_${year}.xlsx`);
}


export function exportarMesExcel(year: number, month: number, byMonthData: {Detalle:any[], Total:number}) {
  //Las filas son el "Detalle"
  const rows = byMonthData.Detalle.map(d => ({
    Concepto: d.concepto,
    FechaPago: new Date(d.fechaPago).toLocaleString('es-AR'),
    DNIAlumno: d.DNIAlumno,
    Monto: d.montoPagado
  }));

  const ws = utils.json_to_sheet(rows);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, `Detalle ${year}-${String(month).padStart(2,'0')}`);

  //Y una fila final con total
  const totRowIndex = rows.length + 2;
  utils.sheet_add_aoa(ws, [['', 'Total', byMonthData.Total]], { origin: `A${totRowIndex}` });

  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, `detalle_${year}_${String(month).padStart(2,'0')}.xlsx`);
}


