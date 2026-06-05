/**
 * errorUtils.ts
 *
 * Utilidad para convertir errores técnicos de la API en mensajes amigables en español.
 *
 * Uso:
 *   import { getErrorMessage } from '@/lib/errorUtils';
 *   toast.error(getErrorMessage(error));
 *
 * Lógica:
 *  - Si el error es una instancia de ApiServiceError, se mapea el código HTTP a un mensaje legible.
 *  - Si es un Error estándar o cualquier otro valor, se devuelve el fallback genérico.
 */

import { ApiServiceError } from '@/services/errors';

/**
 * Devuelve un mensaje de error amigable en español según el tipo y código HTTP del error.
 *
 * @param error   - El error capturado (puede ser ApiServiceError, Error, o unknown).
 * @param fallback - Mensaje alternativo si no se puede determinar uno específico.
 * @returns Cadena de texto lista para mostrar al usuario.
 */
export function getErrorMessage(error: unknown, fallback = 'Ha ocurrido un error inesperado.'): string {
  if (error instanceof ApiServiceError) {
    switch (error.status) {
      case 400:
        return 'Los datos enviados no son válidos. Revisa los campos del formulario.';
      case 401:
        return 'No tienes autorización para realizar esta acción. Por favor, inicia sesión.';
      case 403:
        return 'No tienes permiso para realizar esta operación.';
      case 404:
        return 'El recurso solicitado no se encontró.';
      case 409:
        return 'Ya existe un registro con estos datos. Comprueba los campos únicos (email, nombre, etc.).';
      case 422:
        return 'Los datos proporcionados no superaron la validación del servidor.';
      case 500:
        return 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.';
      case 502:
      case 503:
      case 504:
        return 'El servidor no está disponible en este momento. Inténtalo más tarde.';
      default:
        return `Error del servidor (código ${error.status}). Inténtalo de nuevo.`;
    }
  }

  return fallback;
}
