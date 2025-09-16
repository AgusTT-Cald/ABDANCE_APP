import jsPDF from "jspdf";
import { autoTable } from 'jspdf-autotable'
import logo from "./../../../public/Logo.png";



const MONTH_ORDER = [
  "enero", "febrero", "marzo", "abril",
  "mayo", "junio", "julio", "agosto",
  "septiembre", "octubre", "noviembre", "diciembre"
];


export function exportarYearPDF(year: number, byYearData: Record<string, number>) {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const title = `Ingresos por mes - ${year}`;
    const marginLeft = 40;
    let y = 40;
    jsPDF.length

    //Título
    doc.setFontSize(18);
    doc.text(title, marginLeft, y);
    y += 20;

    //Encabezado pequeño
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, marginLeft, y);
    y += 12;

    //rows
    const rows = MONTH_ORDER.map(monthName => [monthName.charAt(0).toUpperCase() + monthName.slice(1), byYearData[monthName].toFixed(2)]);

    autoTable(doc, {
        startY: y + 8,
        head: [["Mes", "Total ($ARS)"]],
        body: rows,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [21, 101, 192], textColor: 255, halign: "center" },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: {
            1: { halign: "right" }
        },
        margin: { left: marginLeft, right: 40 }
    });

    doc.save(`totales_${year}.pdf`);
}

export function exportarMesPDF(year: number, month: number, 
    byMonthData: { Detalle: { fechaPago: string; montoPagado: number; concepto: string, DNIAlumno: number }[];
    Total: number }) {

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const title = `Detalle de pagos - ${month}/${year}`;
    const marginLeft = 28;
    let y = 26;

    //Header
    doc.addImage(logo, "PNG", 14, y, 200, 80);
    y += 120;
    doc.setFontSize(16);
    doc.text(title, marginLeft, y);
    y += 16;
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, marginLeft, y);
    y += 12;

    //rows
    const rows = byMonthData.Detalle.map(d => [
    d.concepto ?? "-",
    new Date(d.fechaPago).toLocaleString("es-AR"),
    d.DNIAlumno ?? "-",
    Number(d.montoPagado).toFixed(2)
    ]);

    autoTable(doc, {
    startY: y + 8,
    head: [["Concepto", "Fecha Pago", "DNI", "Monto ($ARS)"]],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    columnStyles: {
        3: { halign: "right" }
    },
    margin: { left: marginLeft, right: 28 },
    didDrawPage: (data: any) => {
        //Un pie de página simple con un número de página
        const page = doc.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(`Página ${page}`, data.settings.margin.left, doc.internal.pageSize.height - 20);
    }
    });

    //Añadir el total debajo
    const lastY = (doc as any).lastAutoTable?.finalY ?? (y + 20);
    doc.setFontSize(12);
    doc.text(`Total: $${byMonthData.Total.toFixed(2)}`, marginLeft, lastY + 24);

    doc.save(`detalle_${year}_${String(month).padStart(2, "0")}.pdf`);
}
