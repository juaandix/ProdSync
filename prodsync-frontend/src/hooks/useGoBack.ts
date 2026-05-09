/**
 * useGoBack
 *
 * Hook que devuelve una función para navegar hacia atrás en el historial del navegador.
 *
 * Comportamiento:
 *  - Si existe historial de navegación (window.history.length > 1), llama a router.back()
 *    para volver a la página anterior (equivalente al botón "Atrás" del navegador).
 *  - Si no hay historial (p.ej. el usuario llegó directamente a la página desde un enlace
 *    externo o abrió la pestaña nueva), redirige a "/" como fallback seguro.
 *
 * Uso:
 *  const goBack = useGoBack();
 *  <button onClick={goBack}>Volver</button>
 */
import { useRouter } from "next/navigation";

const useGoBack = () => {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return goBack;
};

export default useGoBack;
