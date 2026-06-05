import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import EditUserForm from "@/components/form/EditUserForm";
import { UserFormData } from "@/schemas/userSchema";
import { useRouter } from 'next/navigation';

// Mock de dependencias externas
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Casteo de tipos para los mocks para tener autocompletado y seguridad de tipos
const mockedUseQuery = useQuery as jest.Mock;
const mockedUseMutation = useMutation as jest.Mock;
const mockedToast = toast as { success: jest.Mock; error: jest.Mock };
const mockedUseRouter = useRouter as jest.Mock;

const mockUser = {
  id: "1",
  name: "John Doe",
  username: "john.doe", // Added username
  email: "john.doe@example.com",
  role: "USER",
};

// Wrapper para proveer el QueryClient, necesario para los hooks de react-query
const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("EditUserForm", () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test para evitar interferencias
    jest.clearAllMocks();
    mockedUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    });
  });

  test("muestra el estado de carga mientras se obtienen los datos", () => {
    mockedUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    render(<EditUserForm id="1" />, { wrapper });

    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  test("obtiene los datos del usuario y los muestra en el formulario", async () => {
    mockedUseQuery.mockReturnValue({
      data: mockUser,
      isLoading: false,
      isError: false,
    });

    render(<EditUserForm id="1" />, { wrapper });

    // Se usan findBy* para esperar a que el formulario se llene de forma asíncrona con useEffect
    expect(await screen.findByDisplayValue(mockUser.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
    expect(await screen.findByDisplayValue("User")).toBeInTheDocument(); // "User" es el texto visible del option seleccionado
  });

  test("renderiza el formulario vacío si la carga inicial de datos falla", () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Failed to fetch"),
    });

    render(<EditUserForm id="1" />, { wrapper });

    expect(mockedToast.error).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Name')).toHaveValue("");
    expect(screen.getByLabelText(/email/i)).toHaveValue("");
    const errorRegex = /error|failed to fetch/i;
    expect(screen.queryByText(errorRegex)).not.toBeInTheDocument();
  });

  test("maneja el envío exitoso del formulario, muestra toast y redirige", async () => {
    const routerPush = jest.fn();
    mockedUseRouter.mockReturnValue({ push: routerPush });
    const mutateSpy = jest.fn();

    mockedUseMutation.mockImplementation(({ onSuccess }: { onSuccess: (data: unknown, variables: unknown) => void }) => ({
      mutate: (variables: UserFormData) => {
        mutateSpy(variables);
        onSuccess(mockUser, variables); // Ejecuta onSuccess inmediatamente
      },
      isPending: false,
    }));

    mockedUseQuery.mockReturnValue({
      data: mockUser,
      isLoading: false,
      isError: false,
    });

    render(<EditUserForm id="1" />, { wrapper });
    const user = userEvent.setup();

    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, "Jane Doe");

    await user.click(screen.getByRole("button", { name: /update user/i }));

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith(expect.objectContaining({ name: "Jane Doe" }));
    });

    await waitFor(() => {
      expect(mockedToast.success).toHaveBeenCalledWith("User updated successfully!");
    });

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/users");
    }, { timeout: 4000 });
  });

  test("muestra un mensaje de error si la actualización (mutación) falla", async () => {
    const errorMessage = "Update failed horribly";
    const mutateSpy = jest.fn();

    mockedUseMutation.mockImplementation(({ onError }: { onError: (error: Error, variables: unknown) => void }) => ({
      mutate: (variables: UserFormData) => {
        mutateSpy(variables);
        onError(new Error(errorMessage), variables); // Ejecuta onError inmediatamente
      },
      isPending: false,
    }));

    mockedUseQuery.mockReturnValue({
      data: mockUser,
      isLoading: false,
      isError: false,
    });

    render(<EditUserForm id="1" />, { wrapper });
    const user = userEvent.setup();

    // Populate fields to pass validation
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), mockUser.name);
    await user.clear(screen.getByLabelText('Email'));
    await user.type(screen.getByLabelText('Email'), mockUser.email);
    // Assuming username is also required and has a label 'Username'
    await user.type(screen.getByLabelText('Username'), mockUser.username);

    await user.click(screen.getByRole("button", { name: /update user/i }));

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith('Error al actualizar el usuario.');
    });
  });
});