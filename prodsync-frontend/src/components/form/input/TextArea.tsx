import React from "react";

interface TextareaProps {
  placeholder?: string; // Texto de marcador de posición
  rows?: number; // Número de filas
  value?: string; // Valor actual
  onChange?: (value: string) => void; // Manejador de cambios
  className?: string; // Clases CSS adicionales
  disabled?: boolean; // Estado deshabilitado
  error?: boolean; // Estado de error
  hint?: string; // Texto de sugerencia a mostrar
}

const TextArea: React.FC<TextareaProps> = ({
  placeholder = "Enter your message", // Marcador de posición predeterminado
  rows = 3, // Número de filas predeterminado
  value = "", // Valor predeterminado
  onChange, // Callback para cambios
  className = "", // Estilos personalizados adicionales
  disabled = false, // Estado deshabilitado
  error = false, // Estado de error
  hint = "", // Texto de sugerencia predeterminado
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  let textareaClasses = `w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden ${className}`;

  if (disabled) {
    textareaClasses += ` bg-gray-100 opacity-50 text-gray-500 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    textareaClasses += ` bg-transparent text-gray-400 border-gray-300 focus:border-error-300 focus:ring-3 focus:ring-error-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-error-800`;
  } else {
    textareaClasses += ` bg-transparent text-gray-400 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      <textarea
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={textareaClasses}
      />
      {hint && (
        <p
          className={`mt-2 text-sm ${
            error ? "text-error-500" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default TextArea;
