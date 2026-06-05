import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserDropdown from '../UserDropdown';
import { useRouter } from 'next/navigation';
import * as AuthContext from '@/context/AuthContext';

// Simular next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Simular el hook useAuth
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

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

// Simular Dropdown y DropdownItem
jest.mock('@/components/ui/dropdown/Dropdown', () => ({
  Dropdown: ({ children, isOpen, onClose, className }: { children: React.ReactNode; isOpen: boolean; onClose: () => void; className?: string; }) => {
    if (!isOpen) return null;
    return <div data-testid="mock-dropdown" className={className} onClick={onClose}>{children}</div>;
  },
}));

jest.mock('@/components/ui/dropdown/DropdownItem', () => ({
  DropdownItem: ({ children, tag, href, onClick, onItemClick, className }: { children: React.ReactNode; tag?: "a" | "button"; href?: string; onClick?: () => void; onItemClick?: () => void; className?: string; }) => {
    const handleClick = (e: React.MouseEvent) => {
      if (tag === 'button') e.preventDefault();
      if (onClick) onClick();
      if (onItemClick) onItemClick();
    };
    if (tag === 'a' && href) {
      return <a href={href} className={className} onClick={handleClick}>{children}</a>;
    }
    return <button type="button" className={className} onClick={handleClick}>{children}</button>;
  },
}));

const mockUseRouter = useRouter as jest.Mock;
const mockUseAuth = AuthContext.useAuth as jest.Mock;

describe('UserDropdown', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
    });
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Musharof Chowdhury', email: 'randomuser@pimjo.com' },
      logout: jest.fn(),
      isLoading: false,
    });
  });

  // Prueba de snapshot
  test('se renderiza correctamente cuando está cerrado', () => {
    const { asFragment } = render(<UserDropdown />);
    expect(asFragment()).toMatchSnapshot();
  });

  // Probar la funcionalidad de abrir/cerrar el menú desplegable
  test('abre y cierra el menú desplegable al hacer clic en el botón', () => {
    render(<UserDropdown />);

    // El menú desplegable debe estar cerrado inicialmente
    expect(screen.queryByText(/randomuser@pimjo.com/i)).not.toBeInTheDocument();

    // Hacer clic en el botón para abrir
    const toggleButton = screen.getByRole('button', { name: /musharof/i });
    fireEvent.click(toggleButton);

    // El menú desplegable debe estar abierto
    expect(screen.getByText(/randomuser@pimjo.com/i)).toBeInTheDocument();

    // Hacer clic de nuevo para cerrar
    fireEvent.click(toggleButton);

    // El menú desplegable debe estar cerrado de nuevo
    expect(screen.queryByText(/randomuser@pimjo.com/i)).not.toBeInTheDocument();
  });

  // Probar los enlaces de navegación dentro del menú desplegable
  test('navega al perfil cuando se hace clic en "Configuración de la cuenta"', () => {
    const pushMock = jest.fn();
    mockUseRouter.mockReturnValue({ push: pushMock });

    render(<UserDropdown />);

    // Abrir el menú desplegable
    const toggleButton = screen.getByRole('button', { name: /musharof/i });
    fireEvent.click(toggleButton);

    // Hacer clic en "Configuración de la cuenta"
    const accountSettingsLink = screen.getByRole('link', { name: /Account settings/i });
    fireEvent.click(accountSettingsLink);

    // Esperar que la navegación sea a /profile
    expect(accountSettingsLink).toHaveAttribute('href', '/profile');
  });

  test('navega a signin cuando se hace clic en "Cerrar sesión"', () => {
    const pushMock = jest.fn();
    mockUseRouter.mockReturnValue({ push: pushMock });

    render(<UserDropdown />);

    // Abrir el menú desplegable
    const toggleButton = screen.getByRole('button', { name: /musharof/i });
    fireEvent.click(toggleButton);

    // Hacer clic en "Cerrar sesión"
    const signOutButton = screen.getByRole('button', { name: /Sign out/i });
    fireEvent.click(signOutButton);

    // Esperar que la función de logout haya sido llamada
    expect(mockUseAuth().logout).toHaveBeenCalled();
  });


});
