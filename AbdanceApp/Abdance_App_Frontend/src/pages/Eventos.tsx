import { useEffect, useState } from "react";
import { db } from "../firebase-config";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";



interface Evento {
  codigo: string;
  nombre: string;
  lugar: string;
  fecha: any; 
  urlImg: string;
}

const Eventos = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const navigate = useNavigate(); 
  
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "eventos"));
        const eventosData: Evento[] = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          codigo: doc.data().codigo || doc.id,
        })) as Evento[];
        setEventos(eventosData);
      } catch (error) {
        console.error("Error al cargar eventos:", error);
      }
    };

    fetchEventos();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Eventos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {eventos.map((evento) => (
           <div key={evento.codigo}onClick={() => navigate(`/evento/${evento.codigo}`)}className="cursor-pointer hover:scale-105 transition">
            <img src={evento.urlImg} alt={evento.nombre} className="w-full h-48 object-cover mb-4" />
            <h2 className="text-xl font-semibold">{evento.nombre}</h2>
            <p className="text-sm text-White-600">{evento.lugar}</p>
            <p className="text-sm text-White-600">{new Date(evento.fecha.seconds * 1000).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Eventos;
