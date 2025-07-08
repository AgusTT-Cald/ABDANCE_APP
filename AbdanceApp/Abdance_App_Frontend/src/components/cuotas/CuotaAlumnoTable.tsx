import Loader from "../Loader";
import generalDateParsing from "../../utils/generalDateParsing";
import axios from "axios";
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { useEffect, useState } from "react";
import { useAuthFetch } from "../../hooks/useAuthFetch";
import { Dialog, DialogTitle } from "@headlessui/react";
import icon from '../../../public/dance.ico'
import MensajeAlerta from "../MensajeAlerta";


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


// Tabla de cuotas para Alumno
export function CuotaAlumnoTable() {
  const endpointUrl = import.meta.env.VITE_API_URL;
  const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}');
  const dniAlumno = usuario.dni ?? ""
  const [reload, setReload] = useState(0);
  const [selectedCuota, setSelectedCuota] = useState<Cuota | null>(null);
  const [openModal, setOpenModal] = useState(false);
  
  const endpoint = dniAlumno
    ? `${endpointUrl}/cuotas/alumno?dia_recargo=11&dniAlumno=${dniAlumno}&reload=${reload}`
    : null;
  const { data: cuotas, loading, error } = useAuthFetch<Cuota[]>(endpoint ?? '');

  const [disciplinaFilter, setDisciplinaFilter] = useState<string>('');
  const disciplinas = Array.from(new Set(cuotas?.map(c => c.nombreDisciplina))).sort((a, b) => a.localeCompare(b));

  const filteredCuotas = cuotas?.filter(c => {
    return (
      (!disciplinaFilter || c.nombreDisciplina === disciplinaFilter)
    );
  });

  const tableHeaderStyle = "bg-[#fff0] text-[#fff] justify-center";
  const tableDatacellStyle = "text-blue-500 bg-white rounded-xl m-0.5 p-1";

  const handleRowClick = (c: Cuota) => {
    if (c.estado.toLowerCase() === 'pagada') return; // no seleccionable
    setSelectedCuota(c);
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setSelectedCuota(null);
  };

  if (loading) return  <div className="flex justify-center align-middle items-center w-full h-full"><Loader /></div>;
  if (error) return <MensajeAlerta tipo="error" mensaje={`Error: ${error}`}></MensajeAlerta>;

  return (
    <>
      <>
      <div className="flex flex-wrap gap-4 gap-x-6 mb-4 mx-4 justify-center md:justify-around"></div>
        <div className="flex flex-col justify-center mb-3">
          <p className="block text-lg font-medium text-gray-200 md:text-gray-800">Disciplina:</p>
          <select
            className="text-gray-900 mt-1 block w-50 rounded border-gray-300 bg-pink-300 p-2 cursor-pointer self-center"
            value={disciplinaFilter}
            onChange={e => setDisciplinaFilter(e.target.value)}
          >
            <option value="">Todas</option>
            {disciplinas.map(d => <option className="capitalize" key={d} value={d}>{d}</option>)}
          </select>
        </div>
      <div className="w-full overflow-x-auto hidden md:block">
        <p className={`${cuotas?.length=== 0 ? 'bg-[#fff0] text-grey-700 text-2xl justify-center' : 'hidden'}`}>
          ¡Usted aún no tiene ninguna cuota registrada!
        </p>
        <div className={`${cuotas?.length=== 0 ? 'hidden' : ''} min-w-[640px] mx-auto`}>
          <table className="table-fixed min-w-[99%] rounded-xl border-none md:border m-1 bg-transparent md:bg-[#1a0049] border-separate border-spacing-x-1 border-spacing-y-1 w-auto">
            <thead>
              <tr className="bg-transparent">
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
                <tr
                  key={c.id}
                  onClick={() => handleRowClick(c)}
                  className={`${c.estado.toLowerCase()==='pagada'? 'opacity-70 cursor-not-allowed':'cursor-pointer hover:scale-[1.01] transform-gpu hover:bg-gray-100 transition-all duration-500'}`}
                >
                  <td className={`${tableDatacellStyle} truncate max-w-[100px] capitalize`}>{c.concepto}</td>
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

        <div className="block md:hidden flex flex-wrap mt-10 justify-between mb-4 mx-2">
            {cuotas?.map(c => (
                <div key={c.id} className="relative flex w-50 flex-col rounded-xl bg-white bg-clip-border text-gray-700 shadow-md mt-3 mx-1">
                    <div className="p-6">
                        <h5 className="mb-2 block font-sans text-xl font-semibold leading-snug tracking-normal text-blue-gray-900 antialiased">
                        {c.concepto}
                        </h5>
                        <h6 className="mb-2 block font-sans text-base font-semibold leading-snug tracking-normal text-blue-gray-900 antialiased capitalize">
                        {c.nombreDisciplina}
                        </h6>
                        <p className="block font-sans text-base leading-relaxed text-inherit antialiased">
                        <b>A pagar:</b> ${c.precio_cuota}
                        </p>
                        <p className="capitalize block font-sans text-base leading-relaxed text-inherit antialiased">
                        <b>Estado:</b> {c.estado}
                        </p>
                        <p className="capitalize block font-sans text-base leading-relaxed text-inherit antialiased">
                        <b>Fecha de Pago:</b> {c.fechaPago?.trim() == "" ? "-" : generalDateParsing(c.fechaPago)}
                        </p>
                    </div>
                    <div className="p-6 pt-0">
                        <button onClick={() => handleRowClick(c)} data-ripple-light="true" type="button" disabled={c.estado.toLowerCase()==='pagada'}
                        className='rounded-lg bg-violet-500 text-center align-middle text-xs font-bold uppercase text-white shadow-md shadow-violet-500/20 transition-all hover:shadow-lg hover:shadow-violet-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none'>
                        Pagar cuota
                        </button>
                    </div>
                </div>
            ))}
        </div>
        <p className="md:block hidden italic text-lg font-medium text-gray-200 md:text-gray-800">Presione en una cuota sin pagar para pagarla.</p>

        {/* Modal de confirmación e integración de MercadoPago */}
        {selectedCuota && (
          <Dialog open={openModal} onClose={closeModal} className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-indigo-200 p-6 rounded-lg shadow-lg max-w-md w-full text-black max-h-[90vh] overflow-y-auto">
              <DialogTitle className="text-xl font-extrabold mb-4 text-center">Confirmar Pago de Cuota</DialogTitle>
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto mb-5">
                    <div className="relative">
                        <img className="w-16 h-16 mx-auto text-indigo-600" alt="dance icon" src={icon}></img>
                    </div>
                    <div className="mt-4 text-center">
                        <div className="text-2xl font-semibold text-gray-900 font-mono">
                          {selectedCuota.concepto}
                        </div>
                        <div className="mt-2 text-gray-600 mb-5">
                          <p><strong>DNI Alumno: </strong>{selectedCuota.dniAlumno}</p>
                          <p><strong>Precio: </strong>${selectedCuota.precio_cuota}</p>
                        </div>
                        <p className="mt-2 text-sm text-gray-500 italic my-5">Se guardará la fecha de pago como el dia y hora actuales.</p>
                        <div className="flex space-x-2 mb-4 justify-center">
                          <button onClick={closeModal} className="text-center text-4xl px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 w-full">Cancelar</button>
                        </div>
                        <CrearPreferencia cuotaId={selectedCuota.id} onCompleted={() => { closeModal(); setReload(r=>r+1); }} />
                        <h2
                          className="text-base font-medium tracking-tighter text-gray-600 lg:text-3xl mt-5"
                        >
                          Pagarás mediante Mercado Pago, podrás usar tarjetas de debito y credito además de tu dinero de cuenta.
                        </h2>
                    </div>
                </div>
            </div>
          </Dialog>
        )}
      </>
    </>
  );
}


//Creacion de la preferencia de pago de Mercado Pago, recibe ID de la cuota a pagar
//y un callback
interface CrearPreferenciaProps { cuotaId: string; onCompleted: () => void; }
export function CrearPreferencia({ cuotaId }: Readonly<CrearPreferenciaProps>) {
  //const publicKey = import.meta.env.MERCADO_PAGO_KEY;
  const publicKey = "APP_USR-5f823e37-e3e9-4c4c-9d9d-ff696f47ba7d"
  initMercadoPago(publicKey, { locale: 'es-AR' });
  const [idPreferencia, setIdPreferencia] = useState<string | null>(null);
  const token = localStorage.getItem('token');
  const endpointUrl = import.meta.env.VITE_API_URL;


  const crearPreferencia = async () => {
    try {
      const res = await axios.post(
        `${endpointUrl}/crear_preferencia_cuota`,
        { cuota_id: cuotaId, dia_recargo: 11 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIdPreferencia(res.data.id);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!idPreferencia) {
      crearPreferencia();
    }
  }, [cuotaId, idPreferencia]);

  if (!idPreferencia) return <p>Por favor espere...</p>;
  return (
    <div>
      {idPreferencia && <Wallet customization={{
        theme: 'dark',
        valueProp: "security_details"
    }} initialization={{ preferenceId: idPreferencia, redirectMode: "blank" }} />}
    </div>);
}