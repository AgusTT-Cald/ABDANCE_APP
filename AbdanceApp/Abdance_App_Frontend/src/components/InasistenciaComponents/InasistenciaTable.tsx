// src/components/Alumnos/InasistenciasTable.tsx
import { useAuth } from "../../hooks/useAuth";
import { useDeleteInasistencias } from "../../hooks/useDeleteInasistencias";
import { useFetchInasistencias } from "../../hooks/useFetchInasistencias";

    type Props = {
    dni: string;
    nombre: string;
    apellido: string;
    rol?:string;
    onClose: () => void;
    };
    

    export function InasistenciasTable({ dni, nombre, apellido, rol, onClose }: Props) { //NO SE PASA EL ROL DEL USUARIO POR LO QUE SE OBTIENE AQUI CON UseAuth()
    const { inasistencias, loading, error } = useFetchInasistencias(dni);
    const { user } = useAuth();  // <-- obtener usuario con rol desde el hook
    const resolvedRol = rol || user?.rol; // 👈 si no se pasa `rol` como prop, usa el del usuario autenticado
    const esAlumno = resolvedRol === "alumno";


    //const esAlumno = user?.rol === "alumno";
    console.log("Es alumno? : " + esAlumno);
    
    const { deleteAllInasistencias, loading: deleting, error: deleteError } = useDeleteInasistencias();
    
    console.log("ROL desde prop o hook:", user?.rol);
    
        return (
            <div className="p-4 bg-white rounded-lg shadow-lg scrollable-table">
            {!esAlumno && (
            <>
            <button onClick={onClose} className="mb-4 text-red-500 hover:underline">
                        ← Volver
            </button>
            <button onClick={async () => {
                    const confirm = window.confirm("¿Estás seguro que deseas eliminar TODAS las inasistencias?");
                    if (!confirm) return;
    
                    const ok = await deleteAllInasistencias(dni);
                            if (ok) {
                                alert("Todas las inasistencias han sido eliminadas.");
                                window.location.reload(); // O llamá a fetchData si tenés una forma de refrescar manualmente
                            }
                        } }
                        className="text-red-600 hover:underline"
                        disabled={deleting}
                    >
                            {deleting ? "Eliminando..." : "🗑️ Borrar todas"}
                        </button></>
            )}
            {/* <button onClick={onClose} className="mb-4 text-red-500 hover:underline">← Volver</button> */}
            <h2 className="text-xl font-semibold mb-2">Inasistencias de {nombre} {apellido}</h2>
            <p className="mb-2 text-sm text-gray-600">DNI: {dni}</p>
    
            {loading && <p>Cargando...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {deleteError && <p className="text-red-500">{deleteError}</p> }
            {inasistencias && inasistencias.length === 0 && <p>No tiene inasistencias registradas.</p>}
    
            {inasistencias && inasistencias.length > 0 && (
                <table className="w-full border mt-4 text-sm">
                <thead>
                    <tr className="bg-gray-100">
                    <th className="border px-4 py-2">Fecha</th>
                    <th className="border px-4 py-2">Justificada</th>
                    </tr>
                </thead>
                <tbody>
                    {inasistencias.map((ina) => (
                    <tr key={ina.id}>
                        <td className="border px-4 py-2">{new Date(ina.fecha).toLocaleDateString()}</td>
                        <td className="border px-4 py-2">{ina.justificada}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            )}
            </div>
        );
        }