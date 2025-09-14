import { ReactNode } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useFavicon } from "../hooks/useFavicon";
import { Background } from "../components";

interface Props{
    children ?: ReactNode;
}




export const Page_403 = ({children}: Props) =>{
    
    useDocumentTitle("ABDANCE 403");
    useFavicon("/dance.ico")
    return (
        <>
            <Background />
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-4xl font-bold text-red-600">403 - Acceso prohibido</h1>
                <p className="text-lg mt-4">No tenés permisos para ver esta página.</p>
            </div>
            {children}
        </>
        )
}
export const Component_403 = () =>{
    return(
    <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold text-red-600">403 - Acceso prohibido</h1>
            <p className="text-lg mt-4">No tenés permisos para ver esta página.</p>
    </div>)
}