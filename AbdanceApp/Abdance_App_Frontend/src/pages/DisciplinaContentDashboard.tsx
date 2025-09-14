import { ReactNode, useEffect, useState } from 'react';
import { DisciplinaTableMain } from '../components/DisciplinaComponents/DisciplinaTableMain';
import { CreateDisciplinaForm } from '../components/DisciplinaComponents/CreateDisciplinaForm';
import { ManageDisciplineStudents } from '../components/DisciplinaComponents/ManageDisciplineStudents'; // Importar el nuevo componente
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Component_403 } from './Page_403';

interface Props {
    children?: ReactNode;
}

export const DisciplinaContentDashboard = ({ children }: Props) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [reloadFlag, setReloadFlag] = useState(0);
    const [openCreate, setOpenCreate] = useState(false);
    const [mostrarGestionAlumnos, setMostrarGestionAlumnos] = useState(false);
    const [selectedDisciplinaId, setSelectedDisciplinaId] = useState('');

    useEffect(() => {
        if (user !== undefined) {
            setIsLoadingUser(false);
        }
    }, [user]);

    if (isLoadingUser) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500 text-lg">Verificando permisos...</p>
            </div>
        );
    }

    if (!user || user.rol !== "admin") {
        return (
            <>
                <Component_403 />
                <button
                    onClick={() => navigate("/dashboard")}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Volver
                </button>
            </>
        );
    }

    const handleDisciplinaCreated = () => {
        handleDisciplinaUpdated();
        setOpenCreate(false);
    };

    const handleDisciplinaUpdated = () => {
        setReloadFlag((prev) => prev + 1);
    };

    const handleStudentsUpdated = () => {
        setReloadFlag((prev) => prev + 1);
    };

    const handleSelectDisciplina = (disciplinaId: string) => {
        setSelectedDisciplinaId(disciplinaId);
        setMostrarGestionAlumnos(true);
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4 text-white">DISCIPLINAS</h1>

            {!mostrarGestionAlumnos ? (
                <>
                    <DisciplinaTableMain 
                        reloadFlag={reloadFlag} 
                        onDisciplinaUpdated={handleDisciplinaUpdated}
                        onSelectDisciplina={handleSelectDisciplina} 
                        onCreateDisciplinaClick={() => setOpenCreate(true)}
                    />

                    {openCreate && (
                        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#00000060] bg-opacity-50">
                            <div className="flex justify-center items-start min-h-screen pt-10 pb-10">
                                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative max-h-[90vh] overflow-y-auto">
                                    <button
                                        onClick={() => setOpenCreate(false)}
                                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                    <CreateDisciplinaForm onDisciplinaCreated={handleDisciplinaCreated} />
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <button
                        onClick={() => setMostrarGestionAlumnos(false)}
                        className="mb-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        ← Volver a disciplinas
                    </button>

                    <ManageDisciplineStudents
                        disciplinaId={selectedDisciplinaId}
                        reloadFlag={reloadFlag}
                        onStudentsUpdated={handleStudentsUpdated}
                    />
                </>
            )}
        </div>
    );
};

export default DisciplinaContentDashboard