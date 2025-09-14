

import { useAuth } from "../hooks/useAuth"; 
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { NavLink } from 'react-router-dom';


type NavLink = {
    name: string;
    icon: string; // tipado estático según los imports
    path: string;
};

const links: NavLink[] = [
    { name: 'Inicio', icon: "mdi:home" , path: "/dashboard"},
    { name: 'Cuotas', icon: "mdi:credit-card", path: "/dashboard/cuotas" },
    { name: 'Asistencias', icon: "mdi:clock-outline", path: "/dashboard/asistencias" },
    { name: 'Eventos', icon: "mdi:calendar", path: "/dashboard/eventos" },
    { name: 'Entradas', icon: "mdi:ticket-confirmation-outline", path: "/dashboard/entradas" },
    { name: 'Usuarios', icon: "mdi:account-multiple-plus-outline", path: "/dashboard/usuarios" },
    { name: 'Estadísticas', icon: "mdi:chart-bar", path: "/dashboard/estadisticas" },
    {name: 'Disciplinas', icon:"mdi:dance-ballroom", path: "/dashboard/disciplinas"}
];

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}');

    const { user } = useAuth(); // obtiene el rol del usuario logueado
const rol = user?.rol?.toLowerCase(); // puede ser 'admin', 'profesor' o 'alumno'

const visibleLinks = links.filter((link) => {
    if (rol === "admin") return true;
    if (rol === "profesor") {
        return ["Inicio", "Cuotas", "Asistencias", "Usuarios", "Disciplinas"].includes(link.name);
    }
    if (rol === "alumno") {
        return ["Inicio", "Cuotas", "Asistencias"].includes(link.name);
    }
    return false; // por defecto no se muestra nada si no hay rol
    });

    return (
        <div className="flex">
        {/* Botón hamburguesa mobile */}
        <div className={`md:hidden absolute top-4 z-50  transition-all duration-300  ${isOpen ? 'left-54' : 'left-4'}`}>
            <button id="burguer-button" onClick={() => setIsOpen(!isOpen)}>
            <Icon icon={isOpen ? "mdi:close" : "mdi:menu"} className=" text-white text-3xl" />
            </button>
        </div>

        {/* Sidebar */}
        <aside
            className={`fixed rounded-3xl w-[200px] z-40 top-0 left-0 h-screen transition-transform duration-300 ease-in-out flex justify-center 
            ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
            md:translate-x-0 md:static md:flex md:w-20 md:bg-[#ebdaff] bg-[#200045]  overflow-y-auto`} //estilos del contenedor
        >
            <nav className="flex flex-col items-center justify-start gap-6 py-8 md:py-16 w-20 flex-1">
            {visibleLinks.map((link, i) => (
                // <Link to={link.path} className="no-underline text-white hover:text-purple-300 focus:outline-none">
            <NavLink 
                to={link.path} 
                key={i} 
                end //verifica que la ruta sea exactamente igual.
            >
                {({ isActive }) => ( //si el boton esta activo en su ruta correspondiente se muestra en celeste
                <div
                    className={`flex flex-row justify-center items-center cursor-pointer md:flex-col 
                    ${isActive ? 'text-cyan-400' : 'text-[#ebdaff] md:text-[#200045]'}
                    ${(usuario.rol === 'alumno' && link.name === 'Estadísticas') ? 'hidden' : ''}
                    hover:text-cyan-300 transition-colors duration-200`}
                >
                
                <Icon  icon={link.icon} className=" text-[275%] md:text-[215%] " />
                <span className="text-xs mt-1  md:block text-center">{link.name}</span>
                </div>)}
                </NavLink>
            
            ))}
            </nav>
        </aside>

        {/* Overlay al hacer click afuera en mobile */}
        {isOpen && (
            <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-[#00000074] z-30 md:hidden"
            ></div>
        )}
        </div>
    );
}
