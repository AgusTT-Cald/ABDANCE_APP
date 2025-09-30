import { ReactNode } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useFavicon } from "../hooks/useFavicon";
import { Background } from "../components";
import { useLocation, useNavigate } from "react-router-dom";

interface Props{
    children ?: ReactNode;
}




export const Page_404 = ({children}: Props) =>{
    
    useDocumentTitle("ABDANCE 404");
    useFavicon("/dance.ico");

    const navigate = useNavigate();
    const location = useLocation();

  // Ruta previa si viene redirigido desde una ruta protegida
    const rutaPrev = location.state?.from?.pathname ?? "/dashboard";

    const volver = () => {
        navigate(rutaPrev);
    };


    return (
        <>
            <Background />
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-4xl font-bold text-red-600">404 - Pagina no encontrada</h1>
                <p className="text-lg mt-4">No se encontro la pagina especificada.</p>
                
                <button
                    onClick={volver}
                    className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all"
                >Volver</button>
            </div>
            {children}
        </>
        )
}