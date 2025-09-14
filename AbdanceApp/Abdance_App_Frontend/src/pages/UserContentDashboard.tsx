import { ReactNode, useEffect, useState } from 'react';
import {UserTable} from '../components'
import { CreateUserForm } from '../components/UserComponents/CreateUserForm';
import { useAuth } from '../hooks/useAuth';
import { Component_403 } from './Page_403';
import { useNavigate } from 'react-router-dom';



interface Props{
    children?: ReactNode;
}

export const UserContentDashboard = ({ children }: Props) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [reloadFlag, setReloadFlag] = useState(0);
    const [openCreate, setOpenCreate] = useState(false);

    useEffect(() => {
        // Solo pasamos de loading cuando user deja de ser undefined
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

    if (!user || (user.rol !== "admin" && user.rol !== "profesor")) {
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

    // Aquí el resto de la UI para usuarios admin o profesor

    const handleUserCreated = () => {
        handleUserUpdated();
        setOpenCreate(false);
    };

    const handleUserUpdated = () => {
        setReloadFlag((prev) => prev + 1);
    };

    return (
        <>
        <h1 className="text-2xl font-bold mb-4 text-white">USUARIOS</h1>
        
        <UserTable reloadFlag={reloadFlag} onUserUpdated={handleUserUpdated} onCreateUserClick={() => setOpenCreate(true)}/>


        {openCreate && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-[#00000060] bg-opacity-50">
            <div className="flex justify-center items-start min-h-screen pt-10 pb-10">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
                <button
                    onClick={() => setOpenCreate(false)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>
                <CreateUserForm onUserCreated={handleUserCreated} />
                </div>
            </div>
            </div>
        )}
        </>
    );
};
export default UserContentDashboard;

