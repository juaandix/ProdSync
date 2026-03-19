/**
 * Convierte una cadena de tiempo (ej. "1h 30m", "1:30", "1.5") a un número decimal de horas.
 * @param timeString La cadena de tiempo a convertir.
 * @returns El número de horas en formato decimal.
 */
export const parseTime = (timeString: string): number => {
  if (!timeString) {
    return 0;
  }

  // Si ya es un número (en formato string), conviértelo directamente.
  if (!isNaN(Number(timeString))) {
    return parseFloat(timeString);
  }

  let totalHours = 0;

  // Expresión regular para "1h 30m" o "1h30m"
  const hourMinuteMatch = timeString.match(/(\d+)\s*h\s*(\d*)\s*m?/);
  if (hourMinuteMatch) {
    const hours = parseInt(hourMinuteMatch[1], 10) || 0;
    const minutes = parseInt(hourMinuteMatch[2], 10) || 0;
    totalHours = hours + minutes / 60;
    return totalHours;
  }

  // Expresión regular para "1:30"
  const colonSeparatedMatch = timeString.match(/(\d+):(\d+)/);
  if (colonSeparatedMatch) {
    const hours = parseInt(colonSeparatedMatch[1], 10) || 0;
    const minutes = parseInt(colonSeparatedMatch[2], 10) || 0;
    totalHours = hours + minutes / 60;
    return totalHours;
  }

  // Si no coincide con ningún formato, intenta convertirlo como un número.
  // Esto puede devolver NaN si el formato es inválido, lo que puede ser manejado por el llamador.
  return parseFloat(timeString);
};

/**
 * Convierte un número decimal de horas a un formato de cadena "Xh Ym".
 * @param hours El número de horas en formato decimal.
 * @returns Una cadena que representa el tiempo, ej. "1h 30m".
 */
export const formatTime = (hours: number): string => {
  if (isNaN(hours) || hours < 0) {
    return "0h 0m";
  }

  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  if (m === 60) {
    // Redondeo puede llevar a 60 minutos
    return `${h + 1}h 0m`;
  }

  return `${h}h ${m}m`;
};

/**
 * Convierte un número decimal de horas a un formato de cadena "X.Yh".
 * @param hours El número de horas en formato decimal.
 * @returns Una cadena que representa el tiempo en formato decimal, ej. "1.5h".
 */
export const formatTimeToDecimal = (hours: number): string => {
  if (isNaN(hours) || hours < 0) {
    return "0.0h";
  }

  // Redondea a 2 decimales y añade la "h"
  return `${hours.toFixed(2)}h`;
};