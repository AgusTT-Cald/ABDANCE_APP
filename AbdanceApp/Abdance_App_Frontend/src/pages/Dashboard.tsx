
import { ReactNode } from 'react';
import {Background, MainContentDashboard, SideBar} from '../components'
import { Outlet } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFavicon } from '../hooks/useFavicon';
import LogoutButton from '../components/LogoutButton';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '@iconify/react/dist/iconify.js';


interface Props{
    children?: ReactNode;
}

export const Dashboard = ({children}: Props) =>{
    
    useDocumentTitle("ABDANCE Dashboard");
    useFavicon("/dance.ico")
    const { user } = useAuth(); 
    return (
        <>
        
            <Background />
            <div className='h-22 w-full flex justify-between px-2 py-4 md:px-4'>
                <img src="/Logo.png" className="h-8 md:h-16 max-w-[160px] object-cover" alt="logo" />
                <div className='flex flex-row self-center'>
                    <h1 className="text-white text-2xl p-2 align-middle whitespace-nowrap overflow-hidden text-ellipsis">{user?.nombre} {user?.apellido}</h1>
                    <Icon icon="qlementine-icons:user-16" width="46" height="46" className='align-middle shrink-0 text-white' /></div>
                <LogoutButton />
            </div>
            <div className='flex flex-row md:gap-5'>
            <SideBar />
            <MainContentDashboard>
                <Outlet />
            </MainContentDashboard>
            
            
            </div>
            {/* Navbar rolUsuario{"Alumno"} */}
            {/* Main Content */}
            
        </>
    )
}
export default Dashboard;
