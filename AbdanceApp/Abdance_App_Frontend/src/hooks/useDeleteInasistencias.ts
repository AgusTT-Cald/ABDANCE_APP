    // src/hooks/useDeleteInasistencias.ts
import { useState } from "react";

export function useDeleteInasistencias() {
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [successMessage, setSuccessMessage] = useState<string | null>(null);

const deleteAllInasistencias = async (dni_usuario: string) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const endpointUrl = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    try {
    const res = await fetch(`${endpointUrl}/inasistencias/eliminar`, {
        method: "POST",
        headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        },
        body: JSON.stringify({ dni_usuario }),
    });

    const result = await res.json();
    if (!res.ok) {
        throw new Error(result.error || "Error al eliminar inasistencias.");
    }

    setSuccessMessage(result.message || "Inasistencias eliminadas.");
    return true;
    } catch (err: any) {
    setError(err.message || "Error inesperado.");
    return false;
    } finally {
    setLoading(false);
    }
};

return { deleteAllInasistencias, loading, error, successMessage };
}