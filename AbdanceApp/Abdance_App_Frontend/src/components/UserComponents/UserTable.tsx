import { useState } from "react";
import { useAuthFetch } from "../../hooks/useAuthFetch";
import { UserFormDialog } from "./UserFormDialog";
import {Loader} from '..'

type User = {
    id:string;
    dni: string;
    nombre: string;
    apellido: string
    email: string;
    rol: string;
};

export function UserTable({ reloadFlag, onUserUpdated, onCreateUserClick}: { reloadFlag: number; onUserUpdated: () => void;  onCreateUserClick: () => void;}, ) {
    const endpointUrl =  import.meta.env.VITE_API_URL
    // const [reloadFlag, setReloadFlag] = useState(0); //controla los cambios de la tabla

    const { data: users, loading, error } = useAuthFetch<User[]>(`${endpointUrl}/usuarios?reload=${reloadFlag}`);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedUser(null);
    };
    

    if (loading) return   <div className="flex justify-center align-middle items-center w-full h-full"><Loader /></div>;
    if (error) return <p>Error: {error}</p>;
    
    const tableHeaderStyle = "bg-[#fff0] text-[#fff] justify-center";
    const tableDatacellStyle = "text-blue-500 bg-white rounded-xl m-0.5 p-1";

    // 🔍 Filtro eficiente (insensible a mayúsculas)
    const filteredUsers = users?.filter((user) => {
        const lower = searchTerm.toLowerCase();
        return (
            user.dni.toLowerCase().includes(lower) ||
            user.nombre.toLowerCase().includes(lower) ||
            user.apellido.toLowerCase().includes(lower) ||
            user.email.toLowerCase().includes(lower) ||
            user.rol.toLowerCase().includes(lower)
        );
    });

    return (
        <><div className="flex flex-col md:flex-col  md:items-center md:justify-between gap-4 mb-4">
             {/* 🔍 Campo de búsqueda */}
                    <input
                        type="text"
                        placeholder="Buscar por DNI, nombre, apellido, email o rol"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 mb-4 border text-white border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                        id="create-user-button"
                        onClick={onCreateUserClick}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Crear Usuario
                    </button>
            </div>
        <div className="w-full overflow-x-auto scrollable-table">
        <div className="min-w-[640px] mx-auto">
            
        <table className=" table-fixed min-w-[99%] rounded-xl border-none md:border m-1 bg-transparent md:bg-[#1a0049] border-separate border-spacing-x-1 border-spacing-y-1 w-auto">
            <thead>
            <tr className="bg-transparent ">
                <th className={tableHeaderStyle + " w-[100px]"}>DNI</th>
                <th className={tableHeaderStyle + " w-[120px]"}>Nombre</th>
                <th className={tableHeaderStyle + " w-[120px]"}>Apellido</th>
                <th className={tableHeaderStyle + " w-[200px]"}>Email</th>
                <th className={tableHeaderStyle + " w-[100px]"}>Rol</th>
                <th className="bg-[#fff0] text-[#fff] w-[80px]">Acciones</th>
            </tr>
            </thead>
            <tbody className="">
            {filteredUsers?.map((user) => (
                <tr key={user.dni}>
                <td className={`${tableDatacellStyle} truncate max-w-[100px]`}>{user.dni}</td>
                <td className={`${tableDatacellStyle} truncate max-w-[120px]`}>{user.nombre}</td>
                <td className={`${tableDatacellStyle} truncate max-w-[120px]`}>{user.apellido}</td>
                <td className={`${tableDatacellStyle} truncate max-w-[200px]`}>{user.email}</td>
                <td className="text-blue-500 bg-white rounded-xl m-0.5 p-1">{user.rol}</td>
                <td className="w-[80px]">
                    <button id="action-button"
                    
                    onClick={() => handleEdit(user)}
                    >
                    Ver
                    </button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
        </div>
        {selectedUser && (
            //se pasan eventos de cerrado, al actualizar usuario, y  el usuario seleccionado 
            <UserFormDialog open={open} user={selectedUser} onClose={handleClose} onUserUpdated={onUserUpdated} /> 
        )}
        </>
    );
}
