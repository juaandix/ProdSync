/**
 * ApiServiceError
 *
 * Error personalizado lanzado por los servicios cuando el backend devuelve
 * una respuesta HTTP no exitosa (4xx / 5xx). Incluye el código de estado HTTP
 * para que los componentes puedan reaccionar de forma diferente según el error
 * (p.ej. redirigir al login en caso de 401).
 */
export class ApiServiceError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiServiceError';
  }
}
