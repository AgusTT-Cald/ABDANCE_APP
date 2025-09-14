import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
//import { userSchema } from "../schemas/userSchema";
import { z } from "zod";

const userSchema = z.object({
    dni: z.string().min(7, "DNI debe tener al menos 7 dígitos"),
    nombre: z.string().min(1, "El Nombre es requerido"),
    apellido: z.string().min(1, "El Apellido es requerido"),
    email: z.string().email("Email inválido"),
    fechaInscripcion: z.string().nonempty("Fecha de inscripción requerida"),
    fechaNacimiento: z.string().nonempty("Fecha de nacimiento requerida"),
    nombreAcceso: z.string().min(3, "Nombre de acceso es requerido"),
    rol: z.enum(["admin", "profesor", "alumno"])
}).superRefine((data, ctx) => {
    const birthdate = new Date(data.fechaNacimiento);
    const registrationDate = new Date(data.fechaInscripcion);
    if (birthdate >= registrationDate || birthdate.getTime() === registrationDate.getTime()) {
        ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de nacimiento debe ser anterior y distinta a la fecha de inscripción",
        path: ["fechaNacimiento"],
        });
    }
});

type UserFormData = z.infer<typeof userSchema>;

interface CreateUserFormProps {
    onUserCreated: () => void;
}

export function CreateUserForm({ onUserCreated }: CreateUserFormProps) {
const {
    register,
    handleSubmit,
    formState: { errors },
    reset
} = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
});

const onSubmit = async (data: UserFormData) => {
    const token = localStorage.getItem("token");
    const endpointUrl = import.meta.env.VITE_API_URL;


    try {
        const res = await fetch(`${endpointUrl}/usuarios`, {
            method: "POST",
            headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({})); // Si no hay JSON, usa objeto vacío
            const errorMessage = errorData.Error || errorData.error || res.statusText;
            alert(`Error al crear usuario: ${errorMessage}`); // Muestra el mensaje específico
        } else {
            alert("Usuario creado");
            reset();
            onUserCreated(); // <-- Notifica al padre que se creó un usuario
        }
    }catch (error : any){
        alert("Error de conexión: " + error.message); 
    }
};

return (
    
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto p-6 bg-white rounded shadow-md z-50">
    <h2 className="text-xl font-bold mb-4">Crear nuevo usuario</h2>

    {[
        { label: "DNI", name: "dni" },
        { label: "Nombre", name: "nombre" },
        { label: "Apellido", name: "apellido" },
        { label: "Email", name: "email", type: "email" },
        { label: "Nombre de Acceso", name: "nombreAcceso" },
    ].map(({ label, name, type = "text" }) => (
        <div key={name} className="mb-4">
        <label className="block mb-1 font-medium">{label}</label>
        <input
            type={type}
            {...register(name as keyof UserFormData)}
            className="border p-2 w-full"
        />
        {errors[name as keyof UserFormData] && (
            <p className="text-red-500 text-sm">
            {errors[name as keyof UserFormData]?.message?.toString()}
            </p>
        )}
        </div>
    ))}

    {/* Fecha Nacimiento */}
    <div className="mb-4">
        <label className="block mb-1 font-medium">Fecha de Nacimiento</label>
        <input type="datetime-local" {...register("fechaNacimiento")} className="border p-2 w-full" />
        {errors.fechaNacimiento && <p className="text-red-500 text-sm">{errors.fechaNacimiento.message}</p>}
    </div>

    {/* Fecha Inscripción */}
    <div className="mb-4">
        <label className="block mb-1 font-medium">Fecha de Inscripción</label>
        <input type="datetime-local" {...register("fechaInscripcion")} className="border p-2 w-full" />
        {errors.fechaInscripcion && <p className="text-red-500 text-sm">{errors.fechaInscripcion.message}</p>}
    </div>

    {/* Rol */}
    <div className="mb-4">
        <label className="block mb-1 font-medium">Rol</label>
        <select {...register("rol")}  className="border p-2 w-full">
        
        <option value="alumno">Alumno</option>
        <option value="admin">Admin</option>
        <option value="profesor">Profesor</option>
        </select>
        {errors.rol && <p className="text-red-500 text-sm">{errors.rol.message}</p>}
    </div>

    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Crear Usuario
    </button>
    </form>
);
}