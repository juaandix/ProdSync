"use client";
/**
 * AppSidebar
 *
 * Barra de navegación lateral principal de la aplicación.
 *
 * Control de visibilidad por rol:
 *  - "Users"        → solo ADMIN
 *  - "Presupuestos" → solo ADMIN
 *  - "Clients"      → ADMIN y OPERATOR
 *  - El resto de ítems → visible para todos los roles autenticados
 *
 * Comportamiento responsive:
 *  - Desktop: sidebar expandido/colapsado según `isExpanded` del SidebarContext.
 *    En modo colapsado, solo se ven los iconos; al hacer hover se expande temporalmente.
 *  - Mobile: el sidebar se oculta y se muestra como overlay al activar `isMobileOpen`.
 *
 * Submenús:
 *  Los ítems con `subItems` muestran un menú desplegable con altura animada.
 *  La altura se calcula dinámicamente usando `scrollHeight` del ref del contenedor.
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useRole } from "../hooks/useRole";
import { useAuth } from "../context/AuthContext";
import {
  CalenderIcon,
  ChevronDownIcon,
  DollarLineIcon,
  FolderIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  TimeIcon,
  UserCircleIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: <FolderIcon />,
    name: "Projects",
    path: "/projects",
  },
  {
    icon: <GroupIcon />,
    name: "Clients",
    path: "/clients",
  },
  {
    icon: <UserCircleIcon />,
    name: "Users",
    path: "/users",
  },
  {
    icon: <TimeIcon />,
    name: "Time Entries",
    path: "/time-entries",
  },
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    path: "/calendar",
  },
  {
    icon: <DollarLineIcon />,
    name: "Presupuestos",
    path: "/budgets",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { isAdmin, hasPermission } = useRole();
  const { user } = useAuth();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  /**
   * Filtra los ítems de navegación según el rol del usuario autenticado.
   * Solo se muestran los ítems para los que el usuario tiene permiso.
   */
  const visibleNavItems = navItems.filter((item) => {
    if (item.path === "/users") return isAdmin;                              // Solo ADMIN
    if (item.path === "/clients") return hasPermission(["ADMIN", "OPERATOR"]); // ADMIN y OPERATOR
    if (item.path === "/budgets") return isAdmin;                            // Solo ADMIN
    return true; // El resto de rutas son accesibles para todos los roles
  });

  useEffect(() => {
    let submenuMatched = false;
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: "main", index });
            submenuMatched = true;
          }
        });
      }
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === menuType && prev.index === index) return null;
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered ? "lg:justify-center lg:px-0 lg:gap-0" : "lg:justify-start"
              }`}
            >
              <span
                className={`${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "text-[#A7ABB4] dark:text-[#A7ABB4]"
                    : "text-white group-hover:text-[#A7ABB4] dark:text-white dark:group-hover:text-[#A7ABB4]"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <>
                  <span
                    className={`menu-item-text ${
                      openSubmenu?.type === menuType && openSubmenu?.index === index
                        ? "text-[#A7ABB4]"
                        : "text-white group-hover:text-[#A7ABB4]"
                    }`}
                  >
                    {nav.name}
                  </span>
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                      openSubmenu?.type === menuType && openSubmenu?.index === index
                        ? "rotate-180 text-[#A7ABB4]"
                        : ""
                    }`}
                  />
                </>
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                } ${
                  !isExpanded && !isHovered ? "lg:justify-center lg:px-0 lg:gap-0" : "lg:justify-start"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "text-[#A7ABB4] dark:text-[#A7ABB4]"
                      : "text-white group-hover:text-[#A7ABB4] dark:text-white dark:group-hover:text-[#A7ABB4]"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span
                    className={`menu-item-text ${
                      isActive(nav.path)
                        ? "text-[#A7ABB4]"
                        : "text-white group-hover:text-[#A7ABB4]"
                    }`}
                  >
                    {nav.name}
                  </span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-4 left-0 bg-[#1E1E26] dark:bg-[#1E1E26] dark:border-gray-800 text-white h-screen transition-all duration-300 ease-in-out z-50 border-r border-[#1E1E26] text-sm
        ${isExpanded || isMobileOpen ? "w-[185px]" : isHovered ? "w-[185px]" : "w-[68px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className="py-[22px] flex justify-center"
      >
        <Link href="/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <Image
              src="/images/prodsync-sidebar-logo.png"
              alt="ProdSync Logo"
              width={110}
              height={37}
            />
          ) : (
            <Image src="/images/prodsync-sidebar-logo.png" alt="ProdSync Logo" width={42} height={14} />
          )}
        </Link>
      </div>

      {/* Nav */}
      <div className="flex flex-1 flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <h2
            className={`mb-4 text-xs uppercase flex leading-[20px] text-white ${
              !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
            }`}
          >
            {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
          </h2>
          {renderMenuItems(visibleNavItems, "main")}
        </nav>
      </div>


    </aside>
  );
};

export default AppSidebar;
