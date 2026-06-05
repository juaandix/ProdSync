import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppSidebar from '../AppSidebar';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext'; // Updated import
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Simular next/link

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; }) => {
    return React.createElement('a', { href, 'data-testid': 'link', ...props }, children);
  },
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string; }) => {
    return React.createElement('a', { href, 'data-testid': 'link', ...props }, children);
  },
}));



jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, ...props }: { src: string; alt: string; width?: number | string; height?: number | string; }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} width={width} height={height} {...props} />;
  },
}));



// Simular next/navigation

jest.mock('next/navigation', () => ({

  usePathname: jest.fn(),

  useRouter: () => ({

    push: jest.fn(),

    replace: jest.fn(),

    // Añadir otros métodos del router si se usan en AppSidebar

  }),

}));

// Simular AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: '1', name: 'Test User', role: 'ADMIN' },
    token: 'mock-token',
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
  })),
}));

const mockUseAuth = useAuth as jest.Mock;

// Simular SidebarContext para controlar su estado en las pruebas
jest.mock('@/context/SidebarContext', () => ({
  useSidebar: jest.fn(),
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Simular componentes de iconos
jest.mock('@/icons/index', () => ({
  BoxCubeIcon: () => <svg data-testid="box-cube-icon" />,
  CalenderIcon: () => <svg data-testid="calendar-icon" />,
  ChevronDownIcon: () => <svg data-testid="chevron-down-icon" />,
  DollarLineIcon: () => <svg data-testid="dollar-line-icon" />,
  FolderIcon: () => <svg data-testid="folder-icon" />,
  GridIcon: () => <svg data-testid="grid-icon" />,
  GroupIcon: () => <svg data-testid="group-icon" />,
  HorizontaLDots: () => <svg data-testid="horizontal-dots-icon" />,
  ListIcon: () => <svg data-testid="list-icon" />,
  PieChartIcon: () => <svg data-testid="pie-chart-icon" />,
  PlugInIcon: () => <svg data-testid="plugin-icon" />,
  TimeIcon: () => <svg data-testid="time-icon" />,
  UserCircleIcon: () => <svg data-testid="user-circle-icon" />,
}));

// Add this mock for SidebarWidget
jest.mock('../SidebarWidget', () => {
  return {
    __esModule: true,
    default: ({ children, ...props }: { children?: React.ReactNode; }) => <div data-testid="mock-sidebar-widget" {...props}>{children}</div>,
  };
});


const mockUsePathname = usePathname as jest.Mock;
const mockUseSidebar = useSidebar as jest.Mock; // Updated to use ES module import



describe('AppSidebar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
    mockUseSidebar.mockReturnValue({
      isExpanded: true,
      isMobileOpen: false,
      isHovered: false,
      setIsHovered: jest.fn(),
      toggleSidebar: jest.fn(),
      toggleMobileSidebar: jest.fn(),
        });
      });
    
      // Prueba de snapshot
  test('se renderiza correctamente', () => {
    const { asFragment } = render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  // Probar enlaces de navegación directos
  test('navega a los enlaces directos correctamente', () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    );

    // Encontrar el enlace "Projects" y hacer clic en él
    const projectsLink = screen.getByRole('link', { name: /Projects/i }); // Find link by accessible name
    fireEvent.click(projectsLink);
    expect(projectsLink).toHaveAttribute('href', '/projects');
    expect(projectsLink).toHaveAttribute('data-testid', 'link'); // Also assert data-testid
  });

  // Probar elementos padre y el despliegue de submenús


  // Probar la lógica de expansión/colapso de la barra lateral (usando el mock de SidebarContext)
  test('la barra lateral se expande y colapsa según el contexto', () => {
    mockUseSidebar.mockReturnValue({
      isExpanded: false, // Empezar colapsado
      isMobileOpen: false,
      isHovered: false,
      setIsHovered: jest.fn(),
      toggleSidebar: jest.fn(),
      toggleMobileSidebar: jest.fn(),
    });

    const { rerender } = render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    );

    // Comprobar el estado colapsado inicial (por ejemplo, "Menu" no es visible, HorizontaLDots sí)
    expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    expect(screen.queryAllByTestId('horizontal-dots-icon').length).toBeGreaterThan(0);

    // Simular expansión
    mockUseSidebar.mockReturnValue({
      isExpanded: true, // Ahora expandido
      isMobileOpen: false,
      isHovered: false,
      setIsHovered: jest.fn(),
      toggleSidebar: jest.fn(),
      toggleMobileSidebar: jest.fn(),
    });
    rerender(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    );

    // Comprobar el estado expandido (por ejemplo, "Menu" es visible, HorizontaLDots no)
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.queryByTestId('horizontal-dots-icon')).not.toBeInTheDocument();
  });
});

// ── Role-based nav visibility ──────────────────────────────────────────────

describe('AppSidebar — role-based visibility', () => {
  const renderSidebar = () =>
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    );

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseSidebar.mockReturnValue({
      isExpanded: true,
      isMobileOpen: false,
      isHovered: false,
      setIsHovered: jest.fn(),
    });
  });

  it('ADMIN sees Clients link', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1', name: 'Admin', role: 'ADMIN' } });
    renderSidebar();
    expect(screen.getByRole('link', { name: /Clients/i })).toBeInTheDocument();
  });

  it('ADMIN sees Users link', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1', name: 'Admin', role: 'ADMIN' } });
    renderSidebar();
    expect(screen.getByRole('link', { name: /Users/i })).toBeInTheDocument();
  });

  it('OPERATOR sees Clients link', () => {
    mockUseAuth.mockReturnValue({ user: { id: '2', name: 'Operator', role: 'OPERATOR' } });
    renderSidebar();
    expect(screen.getByRole('link', { name: /Clients/i })).toBeInTheDocument();
  });

  it('OPERATOR does NOT see Users link', () => {
    mockUseAuth.mockReturnValue({ user: { id: '2', name: 'Operator', role: 'OPERATOR' } });
    renderSidebar();
    expect(screen.queryByRole('link', { name: /Users/i })).not.toBeInTheDocument();
  });

  it('USER does NOT see Clients link', () => {
    mockUseAuth.mockReturnValue({ user: { id: '3', name: 'Regular', role: 'USER' } });
    renderSidebar();
    expect(screen.queryByRole('link', { name: /Clients/i })).not.toBeInTheDocument();
  });

  it('USER does NOT see Users link', () => {
    mockUseAuth.mockReturnValue({ user: { id: '3', name: 'Regular', role: 'USER' } });
    renderSidebar();
    expect(screen.queryByRole('link', { name: /Users/i })).not.toBeInTheDocument();
  });
});
