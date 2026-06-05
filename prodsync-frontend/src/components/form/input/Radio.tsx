import React from "react";

interface RadioProps {
  id: string; // ID único para el botón de radio
  name: string; // Nombre del grupo de radio
  value: string; // Valor del botón de radio
  checked: boolean; // Si el botón de radio está marcado
  label: string; // Etiqueta para el botón de radio
  onChange: (value: string) => void; // Manejador para el cambio de valor
  className?: string; // Clases adicionales opcionales
  disabled?: boolean; // Estado deshabilitado opcional para el botón de radio
}

const Radio: React.FC<RadioProps> = ({
  id,
  name,
  value,
  checked,
  label,
  onChange,
  className = "",
  disabled = false,
}) => {
  return (
    <label
      htmlFor={id}
      className={`relative flex cursor-pointer  select-none items-center gap-3 text-sm font-medium ${
        disabled
          ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
          : "text-gray-700 dark:text-gray-400"
      } ${className}`}
    >
      <input
        id={id}
        name={name}
        type="radio"
        value={value}
        checked={checked}
        onChange={() => !disabled && onChange(value)} // Prevenir onChange cuando está deshabilitado
        className="sr-only"
        disabled={disabled} // Deshabilitar entrada
      />
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border-[1.25px] ${
          checked
            ? "border-brand-500 bg-brand-500"
            : "bg-transparent border-gray-300 dark:border-gray-700"
        } ${
          disabled
            ? "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-700"
            : ""
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full bg-white ${
            checked ? "block" : "hidden"
          }`}
        ></span>
      </span>
      {label}
    </label>
  );
};

export default Radio;
