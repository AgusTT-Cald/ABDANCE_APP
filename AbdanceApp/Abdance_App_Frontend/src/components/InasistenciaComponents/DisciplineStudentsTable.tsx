import { useEffect, useState } from "react";
import { useAuthFetch } from "../../hooks/useAuthFetch";
import { Loader } from "..";
import { useDisciplinaList } from "../../hooks/useDisciplinaList";
import { useDisciplinaStudents } from "../../hooks/useDisciplinaStudents";



export function DisciplineStudentsTable({
    // disciplinaId,
    reloadFlag,
    onUserUpdated,
}: {
    disciplinaId: string;
    reloadFlag: number;
    onUserUpdated: () => void;
}) {
    const endpointUrl = import.meta.env.VITE_API_URL;
    
     //  // Cargar lista de disciplinas
    const { disciplinas, loading: loadingDisciplinas } = useDisciplinaList(endpointUrl);

    const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string>("");

    //lista de estudiantes escritos en esa disciplina
    const { students, nombreDisciplina, loading: loadingStudents } = useDisciplinaStudents(
    endpointUrl,
    selectedDisciplinaId,
    reloadFlag
  );
    // const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    // const [nombreDisciplina, setNombreDisciplina] = useState("");

    

    // Seleccionar la primera disciplina cuando estén cargadas
    useEffect(() => {
        if (disciplinas.length > 0 && !selectedDisciplinaId) {
        setSelectedDisciplinaId(disciplinas[0].disciplina_id);
        }
    }, [disciplinas, selectedDisciplinaId]);

    console.log("disciplina seleccionada + "+ selectedDisciplinaId);


    const registrarInasistencia = async (dni: string) => {
        const confirm = window.confirm(`¿Registrar inasistencia para DNI ${dni}?`);
        if (!confirm) return;

        try {
        const res = await fetch(`${endpointUrl}/asistencias/registrar`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
            dni_usuario: dni,
            justificada: "NO", // o true si querés marcarla justificada
            }),
        });

        const result = await res.json();
        alert(result.message || "Inasistencia registrada");
        onUserUpdated();
        } catch (error) {
        alert("Error registrando la inasistencia");
        }
    };

    if (loadingDisciplinas || loadingStudents)
        return (
        <div className="flex justify-center items-center w-full h-full">
            <Loader />
        </div>
        );

    const tableHeaderStyle = "bg-[#fff0] text-white";
    const tableCellStyle = "bg-white text-blue-600 rounded-xl m-0.5 p-1";

    return (
        
        <div className="w-full overflow-x-auto scrollable-table">
                <div className="mb-4 flex flex-col items-center">
                <label className="text-white mb-1" htmlFor="disciplina-select">
                    Seleccionar Disciplina:
                </label>
                <select
                    id="disciplina-select"
                    value={selectedDisciplinaId}
                    onChange={(e) => setSelectedDisciplinaId(e.target.value)}
                    className="p-2 rounded bg-white text-blue-800 shadow"
                >
                    {disciplinas.map((disc) => (
                        <option key={disc.disciplina_id} value={disc.disciplina_id}>
                            {disc.nombre}
                        </option>
                    ))}
                </select>
                <h1 className="text-white mt-2">Disciplina: {nombreDisciplina}</h1>
            </div>
        <div className="min-w-[640px] mx-auto">
            <table className="table-fixed min-w-[99%] border-spacing-2 border-separate border bg-[#1a0049] rounded-xl">
            <thead>
                <tr>
                <th className={tableHeaderStyle}>DNI</th>
                <th className={tableHeaderStyle}>Nombre</th>
                <th className={tableHeaderStyle}>Apellido</th>
                <th className={tableHeaderStyle}>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {students?.map((student) => (
                <tr key={student.dni}>
                    <td className={tableCellStyle}>{student.dni}</td>
                    <td className={tableCellStyle}>{student.nombre}</td>
                    <td className={tableCellStyle}>{student.apellido}</td>
                    <td className="text-center">
                    <button
                        className="bg-red-500 text-white rounded px-2 py-1 hover:bg-red-700"
                        onClick={() => registrarInasistencia(student.dni)}
                    >
                        Marcar Falta
                    </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </div>
    );
}
