import EstadisticasTable from './EstadisticasTable';
import '../../../public/dance.ico'


export function EstadisticasContentDashboard() {
  return (
    <>
    <h1 className="tracking-wide text-4xl font-black text-gray-300 md:dark:text-gray-900 mb-4 text-center">
        ESTADISTICAS
    </h1>
        <EstadisticasTable></EstadisticasTable>
    </>
  );
}
export default EstadisticasContentDashboard;