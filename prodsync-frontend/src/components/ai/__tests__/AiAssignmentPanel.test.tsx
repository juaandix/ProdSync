import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithClient } from 'test-utils/QueryWrapper';
import '@testing-library/jest-dom';
import { AiAssignmentPanel } from '@/components/ai/AiAssignmentPanel';
import { useMutation } from '@tanstack/react-query';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useMutation: jest.fn(),
}));

const mockMutate = jest.fn();

const defaultMutation = {
  mutate:    mockMutate,
  isPending: false,
  isError:   false,
  isSuccess: false,
  data:      undefined,
  reset:     jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (useMutation as jest.Mock).mockReturnValue(defaultMutation);
});

describe('AiAssignmentPanel', () => {
  it('renders the suggest button and tipo selector', () => {
    renderWithClient(<AiAssignmentPanel descripcion="Test task" />);

    expect(screen.getByRole('button', { name: /Sugerir asignación IA/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('disables the button when descripcion is empty', () => {
    renderWithClient(<AiAssignmentPanel descripcion="" />);

    expect(screen.getByRole('button', { name: /Sugerir asignación IA/i })).toBeDisabled();
  });

  it('enables the button when descripcion has content', () => {
    renderWithClient(<AiAssignmentPanel descripcion="Implement login" />);

    expect(screen.getByRole('button', { name: /Sugerir asignación IA/i })).not.toBeDisabled();
  });

  it('calls mutate with correct payload when button is clicked', () => {
    renderWithClient(
      <AiAssignmentPanel descripcion="Implementar OAuth" estimacion={8} storyPoints={5} />
    );

    fireEvent.click(screen.getByRole('button', { name: /Sugerir asignación IA/i }));

    expect(mockMutate).toHaveBeenCalledWith({
      descripcion:  'Implementar OAuth',
      tipo:         'DESARROLLO',
      estimacion:   8,
      storyPoints:  5,
    });
  });

  it('shows loading state while waiting for AI response', () => {
    (useMutation as jest.Mock).mockReturnValue({
      ...defaultMutation,
      isPending: true,
    });

    renderWithClient(<AiAssignmentPanel descripcion="Some task" />);

    expect(screen.getByRole('button', { name: /Consultando IA/i })).toBeDisabled();
  });

  it('shows error message when API call fails', () => {
    (useMutation as jest.Mock).mockReturnValue({
      ...defaultMutation,
      isError: true,
    });

    renderWithClient(<AiAssignmentPanel descripcion="Some task" />);

    expect(screen.getByText(/ANTHROPIC_API_KEY/i)).toBeInTheDocument();
  });

  it('renders recommendation table when results are available', () => {
    (useMutation as jest.Mock).mockReturnValue({
      ...defaultMutation,
      isSuccess: true,
      data: {
        recomendaciones: [
          { userId: 1, nombre: 'Dev One', puntuacion: 92, justificacion: 'Especialista en DESARROLLO' },
          { userId: 2, nombre: 'Dev Two', puntuacion: 74, justificacion: 'Carga actual baja'           },
        ],
      },
    });

    renderWithClient(<AiAssignmentPanel descripcion="Some task" />);

    expect(screen.getByText('Dev One')).toBeInTheDocument();
    expect(screen.getByText('Dev Two')).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();
    expect(screen.getByText('74')).toBeInTheDocument();
    expect(screen.getByText('Especialista en DESARROLLO')).toBeInTheDocument();
  });

  it('shows medal icons for top 3 developers', () => {
    (useMutation as jest.Mock).mockReturnValue({
      ...defaultMutation,
      isSuccess: true,
      data: {
        recomendaciones: [
          { userId: 1, nombre: 'Dev One',   puntuacion: 92, justificacion: 'Primero'  },
          { userId: 2, nombre: 'Dev Two',   puntuacion: 80, justificacion: 'Segundo'  },
          { userId: 3, nombre: 'Dev Three', puntuacion: 65, justificacion: 'Tercero'  },
          { userId: 4, nombre: 'Dev Four',  puntuacion: 50, justificacion: 'Cuarto'   },
        ],
      },
    });

    renderWithClient(<AiAssignmentPanel descripcion="Some task" />);

    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('does not show recommendation table when no results', () => {
    renderWithClient(<AiAssignmentPanel descripcion="Some task" />);

    expect(screen.queryByText(/Ranking de desarrolladores/i)).not.toBeInTheDocument();
  });

  it('calls reset when tipo selector changes', () => {
    const mockReset = jest.fn();
    (useMutation as jest.Mock).mockReturnValue({
      ...defaultMutation,
      reset: mockReset,
    });

    renderWithClient(<AiAssignmentPanel descripcion="Some task" />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'TESTING' } });

    expect(mockReset).toHaveBeenCalled();
  });

  it('uses 0 as default for estimacion and storyPoints when not provided', () => {
    renderWithClient(<AiAssignmentPanel descripcion="Task without numbers" />);

    fireEvent.click(screen.getByRole('button', { name: /Sugerir asignación IA/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ estimacion: 0, storyPoints: 0 })
    );
  });

  it('matches snapshot in idle state', () => {
    const { container } = renderWithClient(
      <AiAssignmentPanel descripcion="Snapshot task" estimacion={4} storyPoints={3} />
    );
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with recommendations', () => {
    (useMutation as jest.Mock).mockReturnValue({
      ...defaultMutation,
      isSuccess: true,
      data: {
        recomendaciones: [
          { userId: 1, nombre: 'Dev One', puntuacion: 88, justificacion: 'Mejor candidato' },
        ],
      },
    });

    const { container } = renderWithClient(
      <AiAssignmentPanel descripcion="Snapshot with results" />
    );
    expect(container).toMatchSnapshot();
  });
});
