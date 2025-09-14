import { useState } from "react";

type Props = {
    open: boolean;
    user: {
        dni: string;
        nombre: string;
        apellido: string;
        email: string;
        rol: string;
    };
    onClose: () => void;
    onUserUpdated: () => void; 
};

export function UserFormDialog({ open, user, onClose, onUserUpdated }: Props) {
const [formData, setFormData] = useState(user);
const selectedRolDefault = "alumno";
const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
};

const handleSave = async () => {
    const token = localStorage.getItem("token");
    const endpointUrl =  import.meta.env.VITE_API_URL
    const res = await fetch(`${endpointUrl}/usuarios`, {
    method: "PUT",
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
    });

    if (!res.ok) {
    alert("Error al actualizar el usuario");
    } else {
    alert("Usuario actualizado");
    onUserUpdated();
    onClose();
    }
};

const handleDelete = async () => {
    const token = localStorage.getItem("token");
    const endpointUrl =  import.meta.env.VITE_API_URL_DEV
    const confirm = window.confirm(`¿Eliminar al usuario con DNI ${user.dni} y todas sus inscripciones?`);
    if (!confirm) return;

    try {
        const res = await fetch(`${endpointUrl}/usuarios/eliminar`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ dni : user.dni }),
        });

        const result = await res.json();
        alert(result.message || "Usuario eliminado exitosamente.");
        onUserUpdated(); // o la función que recargue la 
        onClose();//cierra el dialog
    } catch (error) {
        alert("Error al eliminar el usuario.");
    }
};


if (!open) return null;

return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-[#00000060] bg-opacity-40">
    <div className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-xl font-bold mb-4">Editar Usuario</h2>
        <label className="block mb-2">DNI</label>
        <label className="border w-full mb-4 p-2" >{formData.dni}</label>
        <label className="block mb-2 mt-2">Nombre</label>
        <input name="nombre" value={formData.nombre} onChange={handleChange} className="border w-full mb-3 p-2" />
        <label className="block mb-2">Apellido</label>
        <input name="apellido" value={formData.apellido} onChange={handleChange} className="border w-full mb-3 p-2" />
        <label className="block mb-2">Email</label>
        <input name="email" value={formData.email} onChange={handleChange} className="border w-full mb-3 p-2" />
        <label className="block mb-2">Rol</label>
        <select name="rol" value={formData.rol} onChange={handleChange} className="border w-full mb-3 p-2">
            <option value="alumno">alumno</option>
            <option value="admin">admin</option>
            <option value="profesor">profesor</option>
        </select>
        <p className="text-red-500 font-extralight mt-1.5">Si se quiere modificar el DNI del usuario se tiene que eliminar este mismo y crearlo nuevamente</p>

        <div className="flex justify-between mt-4">
            <button onClick={handleSave} className="bg-green-500 text-white px-3 py-1 rounded">Guardar</button>
            <button onClick={handleDelete} className="bg-red-500 text-white px-3 py-1 rounded">Eliminar</button>
            <button onClick={onClose} className="bg-gray-300 px-3 py-1 rounded text-[#fff]">Cancelar</button>
        </div>
        </div>
    </div>
);
}