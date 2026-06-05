"use client";
import { ApiServiceError } from './errors';
import Cookies from 'js-cookie';

/**
 * handleResponse
 *
 * Utilidad genérica para procesar respuestas de la Fetch API.
 *
 * - Si la respuesta no es OK (res.ok === false), intenta parsear el cuerpo como JSON
 *   para obtener el mensaje de error del backend y lanza un ApiServiceError.
 * - Si `expectNoContent` es true (p.ej. respuestas 204 DELETE), resuelve sin parsear.
 * - En caso contrario, parsea el cuerpo como JSON y lo devuelve tipado como T.
 */
export async function handleResponse<T>(
  res: Response,
  options: { expectNoContent?: boolean } = {}
): Promise<T | void> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiServiceError(errorData.message || 'An unknown error occurred', res.status);
  }

  if (options.expectNoContent) {
    return Promise.resolve();
  }

  return res.json() as Promise<T>;
}

/**
 * getAuthHeader
 *
 * Construye el header `Authorization: Bearer <token>` leyendo el token JWT
 * almacenado en la cookie `authToken`.
 *
 * - Devuelve un objeto vacío si no hay token o si la cookie contiene la cadena
 *   literal "undefined" (artefacto que puede quedar de sesiones corruptas).
 * - El parámetro `_url` está reservado para futuras implementaciones que
 *   necesiten headers distintos según el endpoint.
 */
export function getAuthHeader(_url?: string): { [key: string]: string } {
  const token = Cookies.get('authToken') || null;
  if (token && token !== 'undefined') {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}
