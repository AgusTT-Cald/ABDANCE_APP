    import { useState } from "react";
    import { useAuthFetch } from "../../hooks/useAuthFetch";
    import { Loader } from "..";
    import { InasistenciasTable } from "./InasistenciaTable"; // Asegúrate de tener este componente

    type User = {
    id: string;
    dni: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    };

    export function StudentsInasistenciasTable({ reloadFlag }: { reloadFlag: number }) {
    const endpointUrl = import.meta.env.VITE_API_URL;


    const { data: users, loading, error } = useAuthFetch<User[]>(
        `${endpointUrl}/usuarios?reload=${reloadFlag}`
    );

    const [alumnoParaFaltas, setAlumnoParaFaltas] = useState<User | null>(null);

    // Solo mostrar alumnos
    
    const [searchTerm, setSearchTerm] = useState("");
    const alumnos = users?.filter((user) => user.rol === "alumno") || [];

    const alumnosFiltrados = alumnos.filter((alumno) =>
        `${alumno.nombre} ${alumno.apellido} ${alumno.dni}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    const tableHeaderStyle = "bg-[#fff0] text-[#fff] justify-center";
    const tableDatacellStyle = "text-blue-500 bg-white rounded-xl m-0.5 p-1";

    if (loading)
        return (
        <div className="flex justify-center align-middle items-center w-full h-full">
            <Loader />
        </div>
        );

    if (error) return <p>Error: {error}</p>;

    if (alumnoParaFaltas) {
        return (
        <InasistenciasTable
            dni={alumnoParaFaltas.dni}
            nombre={alumnoParaFaltas.nombre}
            apellido={alumnoParaFaltas.apellido}
            onClose={() => setAlumnoParaFaltas(null)}
        />
        );
    }

    return (<>
        {/* Input de búsqueda */}
        <div className=" flex flex-col md:flex-col  md:items-center md:justify-between gap-4 mb-4">
            <input
            type="text"
            placeholder="Buscar por nombre, apellido o DNI"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
        </div>
        <div className="w-full overflow-x-auto">
            
        <div className="min-w-[640px] mx-auto scrollable-table">
            <table className="table-fixed min-w-[99%] rounded-xl border-none md:border m-1 bg-transparent md:bg-[#1a0049] border-separate border-spacing-x-1 border-spacing-y-1 w-auto">
            <thead>
                <tr className="bg-transparent">
                <th className={tableHeaderStyle + " w-[100px]"}>DNI</th>
                <th className={tableHeaderStyle + " w-[120px]"}>Nombre</th>
                <th className={tableHeaderStyle + " w-[120px]"}>Apellido</th>
                <th className="bg-[#fff0] text-[#fff] w-[80px]">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {alumnosFiltrados?.map((user) => (
                <tr key={user.dni}>
                    <td className={`${tableDatacellStyle} truncate max-w-[100px]`}>
                    {user.dni}
                    </td>
                    <td className={`${tableDatacellStyle} truncate max-w-[120px]`}>
                    {user.nombre}
                    </td>
                    <td className={`${tableDatacellStyle} truncate max-w-[120px]`}>
                    {user.apellido}
                    </td>
                    <td className="w-[80px]">
                    <button
                        onClick={() => setAlumnoParaFaltas(user)}
                        className="text-red-500 cursor-pointer"
                    >
                        Ver faltas
                    </button>
                    </td>
                </tr>
                ))}{alumnosFiltrados.length === 0 && (
                    <tr>
                        <td colSpan={4} className="text-center text-white py-4">
                            No se encontraron alumnos.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
        </div>
    </>);
    }