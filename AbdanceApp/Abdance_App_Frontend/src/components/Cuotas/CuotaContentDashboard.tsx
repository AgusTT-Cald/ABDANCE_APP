import { CuotaAdminTable } from './CuotaTable';
import { CuotaAlumnoTable } from './CuotaAlumnoTable';
import '../../../public/dance.ico'


export function CuotaContentDashboard() {
  const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}');
  
  return (
    <>
      <h1 className="tracking-wide text-4xl font-black text-gray-300 md:dark:text-gray-900 mb-4 text-center">CUOTAS</h1>
      {usuario.rol === 'alumno' ? <CuotaAlumnoTable /> : <CuotaAdminTable />}
    </>
  );
}
export default CuotaContentDashboard;