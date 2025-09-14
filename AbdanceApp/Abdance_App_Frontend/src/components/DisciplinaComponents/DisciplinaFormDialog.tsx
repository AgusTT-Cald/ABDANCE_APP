import { useState } from "react";

type Precios = {
    matriculaAnual: number;
    montoBase: number;
    montoNuevo15: number;
    montoRecargo: number;
};

type Disciplina = {
    disciplina_id: string;
    nombre: string;
    edadMinima: number;
    edadMaxima: number;
    precios: Precios;
};

type Props = {
    open: boolean;
    disciplina: Disciplina;
    onClose: () => void;
    onDisciplinaUpdated: () => void;
};

export function DisciplinaFormDialog({ open, disciplina, onClose, onDisciplinaUpdated }: Props) {
    const [formData, setFormData] = useState(disciplina);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (name.startsWith("precios.")) {
            const priceField = name.split(".")[1];
            setFormData({
                ...formData,
                precios: {
                    ...formData.precios,
                    [priceField]: parseFloat(value) || 0
                }
            });
        } else {
            setFormData({ 
                ...formData, 
                [name]: name.includes("edad") ? parseInt(value) || 0 : value 
            });
        }
    };

    const handleSave = async () => {
        const token = localStorage.getItem("token");
        const endpointUrl = import.meta.env.VITE_API_URL_DEV; //modo dev
        
        try {
            // Preparamos los datos en el formato que espera el backend
            const requestData = {
                id: formData.disciplina_id, // El backend espera 'id' no 'disciplina_id'
                nombre: formData.nombre,
                edadMinima: Number(formData.edadMinima),
                edadMaxima: Number(formData.edadMaxima),
                precios: {
                    matriculaAnual: Number(formData.precios.matriculaAnual),
                    montoBase: Number(formData.precios.montoBase),
                    montoNuevo15: Number(formData.precios.montoNuevo15),
                    montoRecargo: Number(formData.precios.montoRecargo)
                }
            };
            const res = await fetch(`${endpointUrl}/disciplinas`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });
            const responseData = await res.json();
            if (!res.ok) {
                throw new Error(responseData.error || "Error al actualizar la disciplina");
            } else {
                alert("Disciplina actualizada");
                onDisciplinaUpdated();
                onClose();
            }
        } catch (error) {
            alert("Error al conectar con el servidor");
        }
    };

    const handleDelete = async () => {
        const token = localStorage.getItem("token");
        const endpointUrl = import.meta.env.VITE_API_URL_DEV;
        const confirm = window.confirm(`¿Eliminar la disciplina "${disciplina.nombre}" y todos sus datos asociados?`);
        
        if (!confirm) return;

        try {
            const res = await fetch(`${endpointUrl}/disciplinas`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ id: disciplina.disciplina_id }),
            });

            if (!res.ok) {
                alert("Error al eliminar la disciplina");
            } else {
                alert("Disciplina eliminada exitosamente");
                onDisciplinaUpdated();
                onClose();
            }
        } catch (error) {
            alert("Error al conectar con el servidor");
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0  z-50 flex justify-center items-center bg-[#00000060] bg-opacity-40 ">
            <div className="bg-white p-6 rounded shadow-md w-96 max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Editar Disciplina</h2>
                
                <label className="block mb-2">Nombre</label>
                <input 
                    name="nombre" 
                    value={formData.nombre} 
                    onChange={handleChange} 
                    className="border w-full mb-3 p-2" 
                />
                
                <label className="block mb-2">Edad Mínima</label>
                <input 
                    type="number"
                    name="edadMinima" 
                    value={formData.edadMinima} 
                    onChange={handleChange} 
                    className="border w-full mb-3 p-2" 
                />
                
                <label className="block mb-2">Edad Máxima</label>
                <input 
                    type="number"
                    name="edadMaxima" 
                    value={formData.edadMaxima} 
                    onChange={handleChange} 
                    className="border w-full mb-3 p-2" 
                />
                
                <h3 className="font-bold mt-4 mb-2">Precios</h3>
                
                <label className="block mb-2">Matrícula Anual</label>
                <input 
                    type="number"
                    step="0.01"
                    name="precios.matriculaAnual" 
                    value={formData.precios.matriculaAnual} 
                    onChange={handleChange} 
                    className="border w-full mb-3 p-2" 
                />
                
                <label className="block mb-2">Monto Base</label>
                <input 
                    type="number"
                    step="0.01"
                    name="precios.montoBase" 
                    value={formData.precios.montoBase} 
                    onChange={handleChange} 
                    className="border w-full mb-3 p-2" 
                />
                
                <label className="block mb-2">Monto Nuevo (15 días)</label>
                <input 
                    type="number"
                    step="0.01"
                    name="precios.montoNuevo15" 
                    value={formData.precios.montoNuevo15} 
                    onChange={handleChange} 
                    className="border w-full mb-3 p-2" 
                />
                
                <label className="block mb-2">Recargo</label>
                <input 
                    type="number"
                    step="0.01"
                    name="precios.montoRecargo" 
                    value={formData.precios.montoRecargo} 
                    onChange={handleChange} 
                    className="border w-full mb-3 p-2" 
                />

                <div className="flex justify-between mt-4">
                    <button onClick={handleSave} className="bg-green-500 text-white px-3 py-1 rounded">
                        Guardar
                    </button>
                    <button onClick={handleDelete} className="bg-red-500 text-white px-3 py-1 rounded">
                        Eliminar
                    </button>
                    <button onClick={onClose} className="bg-gray-300 px-3 py-1 rounded text-[#fff]">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}