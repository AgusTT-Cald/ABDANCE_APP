import { zodResolver } from "@hookform/resolvers/zod";
import {z} from "zod";
import InputForm from "./CustomInput";
import { SubmitHandler, useForm } from "react-hook-form";
import { getRole, useLogin, getDNI } from "../hooks/useLogin";
import { useNavigate } from "react-router-dom";


const schema = z.object({
    email: z.string().email("Correo invalido").min(1, "El correo es obligatorio"),
    password: z.string().min(6, "La contraseña debe de tener al menos 6 caracteres"),
})


type FormValues = z.infer<typeof schema>;

const LoginForm = () => {
    const navigate = useNavigate();

    const { login, loading, error } = useLogin();

    const {control, handleSubmit, formState: {errors}, setError} = useForm<FormValues>({
        resolver: zodResolver(schema)
    });

    const onSubmit: SubmitHandler<FormValues> = async (data) =>{
        console.log(data);
        const resultado = await login(data.email, data.password);
        if (!resultado) {
            // Si login() devuelve false, mostramos el error en el campo "email"
            setError("root", {
            type: "manual",
            message: "error de logueo", // o usar el error de useLogin si querés más precisión
            });
            return error;
        }
        if (resultado) {
            const rol = await getRole(resultado.usuario.uid)
            const dni = await getDNI(resultado.usuario.uid)
            
            if (!rol) {
            // Manejo si no tiene rol
                console.error("No se encontró el rol del usuario");
                return error;
            }
            localStorage.setItem("usuario", JSON.stringify({
                email: resultado.usuario.email,
                uid: resultado.usuario.uid,
                rol,
                dni,
            }));
            navigate("/dashboard");
            //window.location.href = "https://www.youtube.com";
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="z-30">
            <InputForm name='email'control={control} label="Email" type="email" error={errors.email}  />
            <InputForm name='password'control={control} label="Password" type="password" error={errors.password} />

            <button type="submit" className="m-2" disabled={loading}>{loading ? "Cargando": "Iniciar Sesión"}</button>
            {error && <p className="text-red-500 bg-amber-100">{error}</p>} 
        </form>
    )
}

export default LoginForm