import InputField from "./InputField";

interface Props {
  index: number;
  tipoEntrada: string;
  datos: DatosFormulario;
  errores?: { [campo: string]: boolean }; // ✅ nuevo prop opcional
  onChange: (index: number, field: keyof DatosFormulario, value: string) => void;
}

export interface DatosFormulario {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
}

export default function FormularioEntrada({ index, tipoEntrada, datos, errores = {}, onChange }: Props) {
  return (
    <div className="bg-white bg-opacity-80 p-6 rounded-xl text-[#1D094E] max-w-sm mb-6">
      <h2 className="text-xl font-bold mb-4">Entrada {index + 1} ({tipoEntrada})</h2>

      <div className="mb-4">
        <InputField
          label="Nombre"
          value={datos.nombre}
          onChange={(v) => onChange(index, "nombre", v)}
          type="text"
          className={errores.nombre ? "border border-red-500" : ""}
        />
        {errores.nombre && <p className="text-red-600 text-sm mt-1 px-2">El nombre es obligatorio.</p>}
      </div>

      <div className="mb-4">
        <InputField
          label="Apellido"
          value={datos.apellido}
          onChange={(v) => onChange(index, "apellido", v)}
          type="text"
          className={errores.apellido ? "border border-red-500" : ""}
        />
        {errores.apellido && <p className="text-red-600 text-sm mt-1 px-2">El apellido es obligatorio.</p>}
      </div>

      <div className="mb-4">
        <InputField
          label="DNI"
          value={datos.dni}
          onChange={(v) => onChange(index, "dni", v)}
          type="text"
          className={errores.dni ? "border border-red-500" : ""}
        />
        {errores.dni && <p className="text-red-600 text-sm mt-1 px-2">Debe tener 8 números.</p>}
      </div>

      <p className="text-sm text-[#1D094E] italic mb-4 px-3">
        Los datos solicitados garantizan la seguridad de tu entrada y evitan su uso por terceros.
        Asegurate de ingresar los datos de quien la va a utilizar.
      </p>

      <div className="mb-4">
        <InputField
          label="Email"
          value={datos.email}
          onChange={(v) => onChange(index, "email", v)}
          type="email"
          className={errores.email ? "border border-red-500" : ""}
        />
        {errores.email && <p className="text-red-600 text-sm mt-1 px-2">Ingresá un email válido.</p>}
      </div>

      <div className="mb-4">
        <InputField
          label="Teléfono"
          value={datos.telefono}
          onChange={(v) => onChange(index, "telefono", v)}
          type="tel"
          className={errores.telefono ? "border border-red-500" : ""}
        />
        {errores.telefono && <p className="text-red-600 text-sm mt-1 px-2">Debe tener entre 10 y 15 números.</p>}
      </div>

      <p className="text-sm text-[#1D094E] italic mt-1 px-3">
        Los datos ingresados se utilizarán para enviar la entrada.
        Verificá que la información sea correcta y corresponda al destinatario final.
      </p>
    </div>
  );
}
