"use client";
/**
 * SidebarContext
 *
 * Contexto global para gestionar el estado del sidebar de navegación.
 *
 * Estados gestionados:
 *  - isExpanded    → sidebar expandido (desktop). Se puede colapsar manualmente.
 *  - isMobileOpen  → sidebar abierto en modo móvil (overlay).
 *  - isMobile      → si la ventana tiene ancho < 768px (breakpoint md de Tailwind).
 *                    En móvil, `isExpanded` siempre se expone como `false` al contexto
 *                    para que el layout use el modo overlay en lugar del sidebar lateral.
 *  - isHovered     → el cursor está sobre el sidebar (para efecto hover en modo colapsado).
 *  - activeItem    → ítem actualmente activo (no lo usa AppSidebar directamente;
 *                    reservado para subcomponentes que lo necesiten).
 *  - openSubmenu   → ítem de submenú actualmente abierto (toggle: click para abrir/cerrar).
 *
 * El listener de `resize` actualiza `isMobile` en tiempo real y cierra el overlay
 * móvil cuando se pasa a pantalla grande, evitando que quede el sidebar abierto
 * al redimensionar la ventana.
 */
import React, { createContext, useContext, useState, useEffect } from "react";

type SidebarContextType = {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  activeItem: string | null;
  openSubmenu: string | null;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setIsHovered: (isHovered: boolean) => void;
  setActiveItem: (item: string | null) => void;
  toggleSubmenu: (item: string) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

/**
 * useSidebar
 * Hook para acceder al contexto del sidebar. Lanza error si se usa fuera del provider.
 */
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);   // Interno; no expuesto directamente
  const [isHovered, setIsHovered] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  /**
   * Detecta si la ventana es móvil (< 768px) y cierra el overlay si se pasa
   * a pantalla grande. Se ejecuta al montar y en cada cambio de tamaño.
   */
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        // Al pasar de móvil a desktop, cierra el overlay para evitar que quede visible
        setIsMobileOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /** Alterna entre sidebar expandido y colapsado (solo desktop). */
  const toggleSidebar = () => {
    setIsExpanded((prev) => !prev);
  };

  /** Abre/cierra el overlay del sidebar en móvil. */
  const toggleMobileSidebar = () => {
    setIsMobileOpen((prev) => !prev);
  };

  /**
   * Alterna el submenú de un ítem de navegación.
   * Si el mismo ítem ya está abierto, lo cierra (toggle).
   */
  const toggleSubmenu = (item: string) => {
    setOpenSubmenu((prev) => (prev === item ? null : item));
  };

  return (
    <SidebarContext.Provider
      value={{
        // En móvil siempre se expone `false` para que el layout use el overlay en lugar del sidebar lateral
        isExpanded: isMobile ? false : isExpanded,
        isMobileOpen,
        isHovered,
        activeItem,
        openSubmenu,
        toggleSidebar,
        toggleMobileSidebar,
        setIsHovered,
        setActiveItem,
        toggleSubmenu,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
