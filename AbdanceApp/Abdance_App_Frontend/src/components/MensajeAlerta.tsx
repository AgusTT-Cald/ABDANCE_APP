import React from 'react';

interface Props {
  tipo: 'error' | 'exito' | 'advertencia';
  mensaje: string;
}

const estilos = {
  error: {
    borde: 'border-red-600',
    icono: 'error',
    colorIcono: 'text-red-600',
  },
  exito: {
    borde: 'border-green-600',
    icono: 'check_circle',
    colorIcono: 'text-green-600',
  },
  advertencia: {
    borde: 'border-yellow-400',
    icono: 'warning',
    colorIcono: 'text-yellow-400',
  },
};

const MensajeAlerta: React.FC<Props> = ({ tipo, mensaje }) => {
  const estilo = estilos[tipo];

  return (
    <div className={`border-4 ${estilo.borde} rounded-3xl bg-white text-center px-1 py-2 w-full max-w-md mx-auto`}>
      <div className="flex flex-col items-center justify-center">
        <span
          className={`material-symbols-outlined ${estilo.colorIcono}`}
          style={{ fontSize: '72px', lineHeight: '1' }}
        >
          {estilo.icono}
        </span>
        <p className="text-black text-base font-medium mt-4 leading-relaxed">
          {mensaje}
        </p>
      </div>
    </div>
  );
};

export default MensajeAlerta;
