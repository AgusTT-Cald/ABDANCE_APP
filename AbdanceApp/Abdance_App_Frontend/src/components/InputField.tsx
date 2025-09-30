interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  className?: string;
}

export default function InputField({
  label,
  value,
  onChange,
  type = "text",
  className = "", 
}: InputFieldProps) {
  return (
    <div className="flex flex-col mb-4 w-full">
      <label className="text-[#1D094E] font-semibold mb-0 text-left px-3">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-[#1D094E] text-white rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-white transition duration-150 ${className}`} // ✅ Aplica clase personalizada
      />
    </div>
  );
}
