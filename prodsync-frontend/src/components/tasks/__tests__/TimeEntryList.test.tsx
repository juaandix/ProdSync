import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimeEntryList from '@/components/tasks/TimeEntryList';
import { TimeEntry } from '@/types/models';
import { timeEntryService } from '@/services/timeEntryService';
import { ApiServiceError } from '@/services/errors';

// Mock the timeEntryService module
jest.mock('@/services/timeEntryService', () => ({
  timeEntryService: {
    delete: jest.fn(),
  },
}));

describe('TimeEntryList', () => {
  const mockTimeEntries: TimeEntry[] = [
    { id: 'te1', taskId: 't1', date: '2024-01-01', hours: 2, description: 'Work 1', type: 'Normal' },
    { id: 'te2', taskId: 't1', date: '2024-01-02', hours: 3.5, description: 'Work 2', type: 'Hora extra' },
  ];
  const mockOnTimeEntryDeleted = jest.fn();
  const taskId = 't1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "No time entries logged" when the list is empty', () => {
    render(<TimeEntryList taskId={taskId} timeEntries={[]} onTimeEntryDeleted={mockOnTimeEntryDeleted} />);
    expect(screen.getByText(/no time entries logged for this task/i)).toBeInTheDocument();
  });

  it('renders a list of time entries', () => {
    render(<TimeEntryList taskId={taskId} timeEntries={mockTimeEntries} onTimeEntryDeleted={mockOnTimeEntryDeleted} />);

    expect(screen.getByText(/work 1/i)).toBeInTheDocument();
    expect(screen.getByText(/hours: 2.00h/i)).toBeInTheDocument();
    expect(screen.getByText(/type: normal/i)).toBeInTheDocument();
    expect(screen.getByText(/work 2/i)).toBeInTheDocument();
    expect(screen.getByText(/hours: 3.50h/i)).toBeInTheDocument();
    expect(screen.getByText(/type: hora extra/i)).toBeInTheDocument();
  });

  it('calls onTimeEntryDeleted when delete button is clicked', async () => {
    (timeEntryService.delete as jest.Mock).mockResolvedValueOnce(undefined);
    render(<TimeEntryList taskId={taskId} timeEntries={mockTimeEntries} onTimeEntryDeleted={mockOnTimeEntryDeleted} />);

    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    await waitFor(() => {
      expect(timeEntryService.delete).toHaveBeenCalledWith('te1');
    });
    await waitFor(() => {
      expect(mockOnTimeEntryDeleted).toHaveBeenCalledWith('te1');
    });
  });

  it('shows an error message on failed deletion', async () => {
    (timeEntryService.delete as jest.Mock).mockRejectedValueOnce(new ApiServiceError('Failed to delete', 500));
    render(<TimeEntryList taskId={taskId} timeEntries={mockTimeEntries} onTimeEntryDeleted={mockOnTimeEntryDeleted} />);

    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/failed to delete/i)).toBeInTheDocument();
    });
    expect(mockOnTimeEntryDeleted).not.toHaveBeenCalled();
  });
});
