import { ReactNode, useState } from 'react';
import {UserTable} from '../components'
import { CreateUserForm } from '../components/UserComponents/CreateUserForm';
import { DisciplineStudentsTable } from '../components/InasistenciaComponents/DisciplineStudentsTable';
import { StudentsInasistenciasTable } from '../components/InasistenciaComponents/StudentsInasistenciasTable';
import { useAuth } from '../hooks/useAuth';
import { InasistenciasTable } from '../components/InasistenciaComponents/InasistenciaTable';



interface Props{
    children?: ReactNode;
}

export const InasistenciaContentDashboard = ({children}: Props) =>{
    // const [reloadFlag, setReloadFlag] = useState(0); // Para actualizar studentTable
    // // const [openCreate] = useState(false); // Controla modal creación

    // // const handleUserCreated = () => {
    // //     // Fuerza reload en UserTable
    // //     handleUserUpdated();
    // //     setOpenCreate(false); // Cierra modal
    // // };

    // const handleUserUpdated = () => {
    //     setReloadFlag((prev) => prev + 1); // Fuerza recarga
    // };

    // return (
    //     <>
    //     <h1 className="text-2xl font-bold mb-4">USUARIOS</h1>

    //     {/* Pasamos reloadFlag a UserTable como prop */}
    //     <DisciplineStudentsTable reloadFlag={reloadFlag} onUserUpdated={handleUserUpdated} disciplinaId='AXNhrGdDDZ7vFbDaSKiT' />

    //     </>
    // );
    const { user } = useAuth(); // <-- este hook debe retornar el usuario logueado con su rol
    const [reloadFlag, setReloadFlag] = useState(0);
    const [mostrarTomaAsistencia, setMostrarTomaAsistencia] = useState(false);

    const handleUserUpdated = () => {
        setReloadFlag((prev) => prev + 1);
    };
      console.log("usuario en inasistencia table:", user);  // <--- aquí, dentro de la función
    if (!user) return <p>Cargando usuario...</p>;

    // Para alumnos, mostrar solo su tabla de inasistencias
    if (user.rol === "alumno") {
        return (
        <>
            <h1 className="text-2xl font-bold mb-4">MIS FALTAS</h1>
            <InasistenciasTable
            dni={user.dni}
            nombre={user.nombre}
            apellido={user.apellido}
            rol = {user.rol}
            onClose={() => {}}
            />
        </>
        );
    }

    // Para admin o profesor, mostrar listado de alumnos y opción de tomar asistencia
    return (
        <>
        <h1 className="text-2xl font-bold mb-4">ALUMNOS</h1>

        {!mostrarTomaAsistencia ? (
            <>
            <div className="mt-4 text-center mb-4">
                <button
                onClick={() => setMostrarTomaAsistencia(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                TOMAR ASISTENCIA
                </button>
            </div>
            <StudentsInasistenciasTable reloadFlag={reloadFlag} />
            
            </>
        ) : (
            <>
            <h2 className="text-xl font-semibold mb-2">Tomar asistencia</h2>
            <DisciplineStudentsTable
                reloadFlag={reloadFlag}
                onUserUpdated={handleUserUpdated}
                disciplinaId="AXNhrGdDDZ7vFbDaSKiT"
            />
            <div className="mt-4 text-right">
                <button
                onClick={() => setMostrarTomaAsistencia(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
                >
                Volver a alumnos
                </button>
            </div>
            </>
        )}
        </>
    );
};

export default InasistenciaContentDashboard;

