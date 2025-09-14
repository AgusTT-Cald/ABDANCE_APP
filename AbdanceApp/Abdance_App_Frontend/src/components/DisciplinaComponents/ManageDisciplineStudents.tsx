import { useEffect, useState } from "react";
import { Loader } from "..";
import { useDisciplinaStudents } from "../../hooks/useDisciplinaStudents";
import { useDisciplinaList } from "../../hooks/useDisciplinaList";


type Student = {
    dni: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
};

export function ManageDisciplineStudents({
    disciplinaId,
    reloadFlag,
    onStudentsUpdated,
}: {
    disciplinaId: string;
    reloadFlag: number;
    onStudentsUpdated: () => void;
}) {
    const endpointUrl = import.meta.env.VITE_API_URL_DEV;
    // const { user } = useAuth();
    
    // // Cargar lista de disciplinas
    const {  loading: loadingDisciplinas } = useDisciplinaList(endpointUrl);
    
    // Estado para alumnos disponibles (no inscritos)
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<string>("");
    
    // Cargar alumnos inscritos en la disciplina
    const { students, nombreDisciplina, loading: loadingStudents } = useDisciplinaStudents(
        endpointUrl,
        disciplinaId,
        reloadFlag
    );

    // Cargar todos los alumnos disponibles
    useEffect(() => {
        const fetchAllStudents = async () => {
            try {
                const res = await fetch(`${endpointUrl}/usuarios?rol=alumno`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                const data = await res.json();
                
                // Filtrar alumnos que no están ya inscritos
                const enrolledDnis = students.map(s => s.dni);
                setAvailableStudents(data.filter((student: Student) => 
                    !enrolledDnis.includes(student.dni)
                ));
            } catch (err) {
                console.error("Error al cargar alumnos:", err);
            }
        };

        if (disciplinaId) {
            fetchAllStudents();
        }
    }, [endpointUrl, disciplinaId, students]);

    const inscribirAlumno = async () => {
        if (!selectedStudent || !disciplinaId) return;

        const confirm = window.confirm(`¿Inscribir al alumno con DNI ${selectedStudent}?`);
        if (!confirm) return;

        try {
            const res = await fetch(`${endpointUrl}/disciplinas/gestionar-alumnos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    disciplina_id: disciplinaId,
                    dni: selectedStudent
                }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Error al inscribir alumno");

            alert(result.message || "Alumno inscrito correctamente");
            onStudentsUpdated();
            setSelectedStudent("");
        } catch (error) {
            alert(error instanceof Error ? error.message : "Error al inscribir alumno");
        }
    };

    const eliminarAlumno = async (dni: string) => {
        const confirm = window.confirm(`¿Eliminar al alumno con DNI ${dni} de esta disciplina?`);
        if (!confirm) return;

        try {
            const res = await fetch(`${endpointUrl}/disciplinas/gestionar-alumnos`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    disciplina_id: disciplinaId,
                    dni: dni
                }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Error al eliminar alumno");

            alert(result.message || "Alumno eliminado correctamente");
            onStudentsUpdated();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Error al eliminar alumno");
        }
    };

    if (loadingDisciplinas || loadingStudents) {
        return (
            <div className="flex justify-center items-center w-full h-full">
                <Loader />
            </div>
        );
    }

    const tableHeaderStyle = "bg-[#fff0] text-white";
    const tableCellStyle = "bg-white text-blue-600 rounded-xl m-0.5 p-1";

    return (
        <div className="w-full overflow-x-auto p-4 ">
            <h2 className="text-xl font-bold text-white mb-4">
                Gestión de Alumnos - {nombreDisciplina}
            </h2>

            {/* Sección para inscribir nuevos alumnos */}
            <div className="mb-6 p-4 bg-blue-900 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Inscribir Nuevo Alumno</h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <select
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        className="p-2 rounded bg-white text-blue-800 shadow flex-grow"
                    >
                        <option value="">Seleccionar alumno</option>
                        {availableStudents.map((student) => (
                            <option key={student.dni} value={student.dni}>
                                {student.apellido}, {student.nombre} (DNI: {student.dni})
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={inscribirAlumno}
                        disabled={!selectedStudent}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                    >
                        Inscribir Alumno
                    </button>
                </div>
            </div>

            {/* Tabla de alumnos inscritos */}
            <div className="min-w-[640px] mx-auto">
                <table className="table-fixed min-w-[99%] border-spacing-2 border-separate border bg-[#1a0049] rounded-xl">
                    <thead>
                        <tr>
                            <th className={tableHeaderStyle}>DNI</th>
                            <th className={tableHeaderStyle}>Nombre</th>
                            <th className={tableHeaderStyle}>Apellido</th>
                            <th className={tableHeaderStyle}>Email</th>
                            <th className={tableHeaderStyle}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.length > 0 ? (
                            students.map((student) => (
                                <tr key={student.dni}>
                                    <td className={tableCellStyle}>{student.dni}</td>
                                    <td className={tableCellStyle}>{student.nombre}</td>
                                    <td className={tableCellStyle}>{student.apellido}</td>
                                    <td className={tableCellStyle}>{student.email}</td>
                                    <td className="text-center">
                                        <button
                                            className="bg-red-500 text-white rounded px-2 py-1 hover:bg-red-700"
                                            onClick={() => eliminarAlumno(student.dni)}
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center text-white py-4">
                                    No hay alumnos inscritos en esta disciplina
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}