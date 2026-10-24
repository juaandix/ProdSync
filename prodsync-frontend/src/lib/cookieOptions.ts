import type Cookies from 'js-cookie';

/**
 * Opciones de las cookies de sesión.
 * `secure` solo con HTTPS: Safari descarta las cookies seguras en
 * http://localhost (Chrome hace una excepción), y sin ellas el middleware
 * devuelve siempre al login en desarrollo.
 */
export const sessionCookieOptions = (): Cookies.CookieAttributes => ({
  path: '/',
  sameSite: 'Strict',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
});
