import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import EditClientForm from "@/components/form/EditClientForm";
import { ClientFormData } from "@/schemas/clientSchema";
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

const mockClient = {
  id: "1",
  name: "Client One",
  email: "client.one@example.com",
  identification: "ID-CLIENT-001",
  contactPerson: "Contact Person One",
  location: "Location One",
  province: "Province One",
};

// Wrapper para proveer el QueryClient, necesario para los hooks de react-query
const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("EditClientForm", () => {
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

    render(<EditClientForm id="1" />, { wrapper });

    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  test("obtiene los datos del cliente y los muestra en el formulario", async () => {
    mockedUseQuery.mockReturnValue({
      data: mockClient,
      isLoading: false,
      isError: false,
    });

    render(<EditClientForm id="1" />, { wrapper });

    expect(await screen.findByDisplayValue(mockClient.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockClient.email)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockClient.identification)).toBeInTheDocument();
  });

  test("renderiza el formulario vacío si la carga inicial de datos falla", () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Failed to fetch"),
    });

    render(<EditClientForm id="1" />, { wrapper });

    expect(mockedToast.error).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/name/i)).toHaveValue("");
    expect(screen.getByLabelText(/email/i)).toHaveValue("");
    const errorRegex = /error|failed to fetch/i;
    expect(screen.queryByText(errorRegex)).not.toBeInTheDocument();
  });

  test("maneja el envío exitoso del formulario, muestra toast y redirige", async () => {
    const routerPush = jest.fn();
    mockedUseRouter.mockReturnValue({ push: routerPush });
    const mutateSpy = jest.fn();

    mockedUseMutation.mockImplementation(({ onSuccess }: { onSuccess: (data: unknown, variables: unknown) => void }) => ({
      mutate: (variables: ClientFormData) => {
        mutateSpy(variables);
        onSuccess(mockClient, variables);
      },
      isPending: false,
    }));

    mockedUseQuery.mockReturnValue({
      data: mockClient,
      isLoading: false,
      isError: false,
    });

    render(<EditClientForm id="1" />, { wrapper });
    const user = userEvent.setup();

    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Client Updated");

    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, "updated@example.com");

    const identificationInput = screen.getByLabelText(/identification/i);
    await user.clear(identificationInput);
    await user.type(identificationInput, "ID-UPDATED");

    const contactPersonInput = screen.getByLabelText(/contact person/i);
    await user.clear(contactPersonInput);
    await user.type(contactPersonInput, "987654321");

    await user.click(screen.getByRole("button", { name: /update client/i }));

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith(expect.objectContaining({
        name: "Client Updated",
        email: "updated@example.com",
        identification: "ID-UPDATED",
        contactPerson: "987654321",
      }));
    });

    await waitFor(() => {
      expect(mockedToast.success).toHaveBeenCalledWith("Client updated successfully!");
    });

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/clients");
    }, { timeout: 4000 });
  });

  test("muestra un mensaje de error si la actualización (mutación) falla", async () => {
    const errorMessage = "Update failed horribly";
    const mutateSpy = jest.fn();

    mockedUseMutation.mockImplementation(({ onError }: { onError: (error: Error, variables: unknown) => void }) => ({
      mutate: (variables: ClientFormData) => {
        mutateSpy(variables);
        onError(new Error(errorMessage), variables);
      },
      isPending: false,
    }));

    mockedUseQuery.mockReturnValue({
      data: mockClient,
      isLoading: false,
      isError: false,
    });

    render(<EditClientForm id="1" />, { wrapper });
    const user = userEvent.setup();

    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, mockClient.name);

    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, mockClient.email);

    const identificationInput = screen.getByLabelText(/identification/i);
    await user.clear(identificationInput);
    await user.type(identificationInput, mockClient.identification);

    const contactPersonInput = screen.getByLabelText(/contact person/i);
    await user.clear(contactPersonInput);
    await user.type(contactPersonInput, "123456789");

    await user.click(screen.getByRole("button", { name: /update client/i }));

    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith('Error al actualizar el cliente.');
    });
  });
});
