import { useState } from "react";
import { useAuthFetch } from "../../hooks/useAuthFetch";
import { DisciplinaFormDialog } from "./DisciplinaFormDialog";
import { Loader } from '..';

type Disciplina = {
    disciplina_id: string;
    nombre: string;
    edadMinima: number;
    edadMaxima: number;
    alumnos_inscriptos: any[];
    precios: {
        matriculaAnual: number;
        montoBase: number;
        montoNuevo15: number;
        montoRecargo: number;
    };
};

export function DisciplinaTableMain({ reloadFlag, onDisciplinaUpdated, onSelectDisciplina, onCreateDisciplinaClick }: { reloadFlag: number; onDisciplinaUpdated: () => void ; onSelectDisciplina?: (disciplinaId: string) => void; onCreateDisciplinaClick: () => void;}) {
    const endpointUrl = import.meta.env.VITE_API_URL;
    const { data: disciplinas, loading, error } = useAuthFetch<Disciplina[]>(`${endpointUrl}/disciplinas?reload=${reloadFlag}`);
    const [selectedDisciplina, setSelectedDisciplina] = useState<Disciplina | null>(null);
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const handleEdit = (disciplina: Disciplina) => {
        setSelectedDisciplina(disciplina);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedDisciplina(null);
    };
    
    const lower = searchTerm.toLowerCase();
    const filteredDisciplinas = disciplinas?.filter((disc) => {
        //const inscriptos = disc.alumnos_inscriptos?.length.toString();
        return (
            disc.nombre.toLowerCase().includes(lower) ||
            disc.edadMinima.toString().includes(lower) ||
            disc.edadMaxima.toString().includes(lower) ||
            disc.alumnos_inscriptos?.length.toString().includes(lower)
    );
});

    // Modificar la columna de acciones para incluir botón de gestionar alumnos
    const renderActions = (disciplina: Disciplina) => (
        <div className="flex flex-row">
            <button id="action-button"
                onClick={() => handleEdit(disciplina)}
                className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 mr-2"
            >
                Editar
            </button>
            {onSelectDisciplina && (
                <button id="action-button"
                    onClick={() => onSelectDisciplina(disciplina.disciplina_id)}
                    className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                >
                    Alumnos
                </button>
            )}
        </div>
    )



    if (loading) return <div className="flex justify-center align-middle items-center w-full h-full"><Loader /></div>;
    if (error) return <p>Error: {error}</p>;
    if (!disciplinas || disciplinas.length === 0) return <p>No hay disciplinas registradas.</p>;

    const tableHeaderStyle = "bg-[#fff0] text-[#fff] justify-center";
    const tableDatacellStyle = "text-blue-500 bg-white rounded-xl m-0.5 p-1";

    return (
        <>
                    <div className="flex flex-col md:flex-col  md:items-center md:justify-between gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, rango de edad o cantidad de alumnos inscriptos"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                        id="create-disciplina-button"
                        onClick={onCreateDisciplinaClick}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Crear Disciplina
                    </button>
                </div>
            <div className="w-full overflow-x-auto scrollable-table">
    
                <div className="min-w-[640px] mx-auto">
                    <table className="table-fixed min-w-[99%] rounded-xl border-none md:border m-1 bg-transparent md:bg-[#1a0049] border-separate border-spacing-x-1 border-spacing-y-1 w-auto z-10">
                        <thead>
                            <tr className="bg-transparent">
                                <th className={tableHeaderStyle}>Nombre</th>
                                <th className={tableHeaderStyle}>Edad Mín</th>
                                <th className={tableHeaderStyle}>Edad Máx</th>
                                <th className={tableHeaderStyle}>Inscriptos</th>
                                <th className={tableHeaderStyle}>Matrícula</th>
                                <th className={tableHeaderStyle}>Monto Base</th>
                                <th className={tableHeaderStyle}>Monto Nuevo</th>
                                <th className={tableHeaderStyle}>Recargo</th>
                                <th className="bg-[#fff0] text-[#fff] w-[80px]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="">
                            {filteredDisciplinas?.map((disc) => (
                                <tr key={disc.disciplina_id}>
                                    <td className={`${tableDatacellStyle} truncate`}>{disc.nombre}</td>
                                    <td className={tableDatacellStyle}>{disc.edadMinima}</td>
                                    <td className={tableDatacellStyle}>{disc.edadMaxima}</td>
                                    <td className={tableDatacellStyle}>{disc.alumnos_inscriptos.length}</td>
                                    <td className={tableDatacellStyle}>${disc.precios.matriculaAnual}</td>
                                    <td className={tableDatacellStyle}>${disc.precios.montoBase}</td>
                                    <td className={tableDatacellStyle}>${disc.precios.montoNuevo15}</td>
                                    <td className={tableDatacellStyle}>${disc.precios.montoRecargo}</td>
                                    <td className="">
                                        {/* <button id="action-button" onClick={() => handleEdit(disc)}>
                                            Ver
                                        </button> */}
                                        {renderActions(disc)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedDisciplina && (
                <DisciplinaFormDialog 
                    open={open} 
                    disciplina={selectedDisciplina} 
                    onClose={handleClose} 
                    onDisciplinaUpdated={onDisciplinaUpdated} 
                />
            )}
        </>
    );
}