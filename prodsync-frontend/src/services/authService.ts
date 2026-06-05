/**
 * authService
 *
 * Servicio de autenticación. Gestiona login, registro y logout contra
 * el endpoint /auth del backend (Spring Boot).
 *
 * Flujo del token JWT:
 *  - login()   → llama a POST /auth/login, guarda el token en la cookie
 *                'authToken' (1 día de validez, secure, SameSite Strict).
 *  - signup()  → llama a POST /auth/register. NO guarda el token porque
 *                el usuario debe iniciar sesión explícitamente tras registrarse.
 *  - logout()  → elimina la cookie 'authToken'. El contexto AuthContext
 *                también elimina 'userRole' por su cuenta.
 */
import { LoginRequest, SignUpRequest } from '@/types/dtos';
import { AuthResponse } from '@/types/models';
import Cookies from 'js-cookie';
import axios from 'axios';

const API_URL = '/backend-api';

export const authService = {
  /** Inicia sesión y persiste el token JWT en una cookie segura. */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const { data: authResponse } = await axios.post<AuthResponse>(`${API_URL}/auth/login`, data);
    if (typeof authResponse.token === 'string' && authResponse.token.length > 0) {
      // expires: 1 → la cookie caduca en 1 día, igual que el TTL del JWT del backend
      Cookies.set('authToken', authResponse.token, { expires: 1, path: '/', secure: true, sameSite: 'Strict' });
    }
    return authResponse;
  },

  /**
   * Registra un nuevo usuario con rol USER por defecto.
   * El backend ignora el campo `role` en /auth/register por seguridad;
   * para asignar roles ADMIN u OPERATOR se debe usar PUT /usuarios/{id}
   * con un token de administrador (ver scripts/seed-users.mjs).
   */
  async signup(data: SignUpRequest): Promise<AuthResponse> {
    const { data: authResponse } = await axios.post<AuthResponse>(`${API_URL}/auth/register`, data);
    return authResponse;
  },

  /** Elimina la cookie del token, forzando al usuario a volver a iniciar sesión. */
  logout() {
    Cookies.remove('authToken', { path: '/' });
  },
};
