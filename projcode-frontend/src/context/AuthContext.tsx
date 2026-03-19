"use client";
/**
 * AuthContext
 *
 * Contexto global de autenticación. Gestiona el estado del usuario autenticado,
 * el token JWT y las funciones de login/logout.
 *
 * Flujo de autenticación:
 *  1. Al cargar la app, `checkAuth` lee la cookie `authToken`.
 *     Si existe, llama a GET /auth/me para validar el token y cargar el perfil.
 *     Si el token es inválido o ha expirado, se eliminan ambas cookies y se limpia el estado.
 *  2. `login()` llama a authService.login(), que guarda el token en la cookie `authToken`.
 *     Luego carga el perfil y guarda el rol en la cookie `userRole` (usada por middleware
 *     y por RoleGuard para control de acceso sin necesidad de re-fetch).
 *  3. `logout()` elimina las cookies `authToken` y `userRole`, limpia el estado
 *     y redirige a /signin.
 *
 * Cookies usadas:
 *  - authToken  → JWT de acceso (1 día de expiración, secure, SameSite Strict)
 *  - userRole   → rol del usuario ('ADMIN' | 'OPERATOR' | 'USER'), leído por el middleware
 */
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';
import { User } from '@/types/models';
import { LoginRequest } from '@/types/dtos';

/** Forma del contexto expuesto a los componentes consumidores. */
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Proveedor que envuelve la aplicación y provee el estado de autenticación. */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /**
   * checkAuth
   * Se ejecuta una sola vez al montar el proveedor.
   * Valida la sesión existente leyendo la cookie `authToken` y verificando
   * que el token siga siendo válido contra el endpoint /auth/me.
   */
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const storedToken = Cookies.get('authToken') || null;
      if (storedToken) {
        setToken(storedToken);
        try {
          const currentUser = await userService.getMe();
          if (currentUser) {
            setUser(currentUser);
            // Sincroniza el rol en cookie para que el middleware pueda leerlo
            // sin necesidad de hacer una petición al backend en cada request
            Cookies.set('userRole', currentUser.role, { path: '/', secure: true, sameSite: 'Strict' });
          } else {
            // Token presente pero /auth/me devuelve vacío: sesión inválida
            Cookies.remove('authToken', { path: '/' });
            Cookies.remove('userRole', { path: '/' });
            setToken(null);
            setUser(null);
          }
        } catch {
          // Token expirado o inválido: limpia el estado para forzar re-login
          Cookies.remove('authToken', { path: '/' });
          Cookies.remove('userRole', { path: '/' });
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  /**
   * login
   * Autentica al usuario y carga su perfil.
   * authService.login() ya guarda el token en la cookie `authToken`.
   */
  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    const { token } = response;
    setToken(token);

    try {
      const currentUser = await userService.getMe();
      if (currentUser) {
        setUser(currentUser);
        // Guarda el rol en cookie para acceso rápido sin re-fetch en cada página
        Cookies.set('userRole', currentUser.role, { path: '/', secure: true, sameSite: 'Strict' });
      }
      router.push('/dashboard');
    } catch {
      // Error al cargar el perfil tras login — el token puede ser inválido
    }
  };

  /**
   * logout
   * Elimina el token y el rol de las cookies, limpia el estado en memoria
   * y redirige al usuario a la página de login.
   */
  const logout = () => {
    authService.logout(); // Elimina la cookie 'authToken'
    Cookies.remove('userRole', { path: '/' });
    setToken(null);
    setUser(null);
    router.push('/signin');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth
 * Hook para acceder al contexto de autenticación desde cualquier componente.
 * Lanza error si se usa fuera del AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
