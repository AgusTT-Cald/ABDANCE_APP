import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const disciplinaSchema = z.object({
    nombre: z.string().min(1, "El nombre es requerido"),
    edadMinima: z.number().min(0, "La edad mínima no puede ser negativa"),
    edadMaxima: z.number().min(0, "La edad máxima no puede ser negativa"),
    precios: z.object({
        matriculaAnual: z.number().min(0, "El valor no puede ser negativo"),
        montoBase: z.number().min(0, "El valor no puede ser negativo"),
        montoNuevo15: z.number().min(0, "El valor no puede ser negativo"),
        montoRecargo: z.number().min(0, "El valor no puede ser negativo"),
    })
}).superRefine((data, ctx) => {
    if (data.edadMinima >= data.edadMaxima) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La edad máxima debe ser mayor que la edad mínima",
            path: ["edadMaxima"],
        });
    }
});

type DisciplinaFormData = z.infer<typeof disciplinaSchema>;

interface CreateDisciplinaFormProps {
    onDisciplinaCreated: () => void;
}

export function CreateDisciplinaForm({ onDisciplinaCreated }: CreateDisciplinaFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<DisciplinaFormData>({
        resolver: zodResolver(disciplinaSchema),
    });

    const onSubmit = async (data: DisciplinaFormData) => {
        const token = localStorage.getItem("token");
        const endpointUrl = import.meta.env.VITE_API_URL;

        try {
            const res = await fetch(`${endpointUrl}/disciplinas`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                alert("Error al crear disciplina");
            } else {
                alert("Disciplina creada exitosamente");
                reset();
                onDisciplinaCreated();
            }
        } catch (error) {
            alert("Error al conectar con el servidor");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto p-6 bg-white rounded shadow-md z-50">
            <h2 className="text-xl font-bold mb-4">Crear nueva disciplina</h2>

            <div className="mb-4">
                <label className="block mb-1 font-medium">Nombre</label>
                <input
                    type="text"
                    {...register("nombre")}
                    className="border p-2 w-full"
                />
                {errors.nombre && (
                    <p className="text-red-500 text-sm">{errors.nombre.message}</p>
                )}
            </div>

            <div className="mb-4">
                <label className="block mb-1 font-medium">Edad Mínima</label>
                <input
                    type="number"
                    {...register("edadMinima", { valueAsNumber: true })}
                    className="border p-2 w-full"
                />
                {errors.edadMinima && (
                    <p className="text-red-500 text-sm">{errors.edadMinima.message}</p>
                )}
            </div>

            <div className="mb-4">
                <label className="block mb-1 font-medium">Edad Máxima</label>
                <input
                    type="number"
                    {...register("edadMaxima", { valueAsNumber: true })}
                    className="border p-2 w-full"
                />
                {errors.edadMaxima && (
                    <p className="text-red-500 text-sm">{errors.edadMaxima.message}</p>
                )}
            </div>

            <h3 className="font-bold mt-4 mb-2">Precios</h3>

            <div className="mb-4">
                <label className="block mb-1 font-medium">Matrícula Anual</label>
                <input
                    type="number"
                    step="0.01"
                    {...register("precios.matriculaAnual", { valueAsNumber: true })}
                    className="border p-2 w-full"
                />
                {errors.precios?.matriculaAnual && (
                    <p className="text-red-500 text-sm">{errors.precios.matriculaAnual.message}</p>
                )}
            </div>

            <div className="mb-4">
                <label className="block mb-1 font-medium">Monto Base</label>
                <input
                    type="number"
                    step="0.01"
                    {...register("precios.montoBase", { valueAsNumber: true })}
                    className="border p-2 w-full"
                />
                {errors.precios?.montoBase && (
                    <p className="text-red-500 text-sm">{errors.precios.montoBase.message}</p>
                )}
            </div>

            <div className="mb-4">
                <label className="block mb-1 font-medium">Monto Nuevo (15 días)</label>
                <input
                    type="number"
                    step="0.01"
                    {...register("precios.montoNuevo15", { valueAsNumber: true })}
                    className="border p-2 w-full"
                />
                {errors.precios?.montoNuevo15 && (
                    <p className="text-red-500 text-sm">{errors.precios.montoNuevo15.message}</p>
                )}
            </div>

            <div className="mb-4">
                <label className="block mb-1 font-medium">Recargo</label>
                <input
                    type="number"
                    step="0.01"
                    {...register("precios.montoRecargo", { valueAsNumber: true })}
                    className="border p-2 w-full"
                />
                {errors.precios?.montoRecargo && (
                    <p className="text-red-500 text-sm">{errors.precios.montoRecargo.message}</p>
                )}
            </div>

            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                Crear Disciplina
            </button>
        </form>
    );
}