import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ViewUserCard from '@/components/user-profile/ViewUserCard';
import { User } from '@/types/models';
import { userService } from '@/services/userService';
import { ApiServiceError } from '@/services/errors';

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('@/services/userService', () => ({
  userService: {
    getById: jest.fn(),
  },
}));

// Mock UserAnalytics so ViewUserCard tests stay isolated and fast
jest.mock('@/components/user-profile/UserAnalytics', () => {
  const MockUserAnalytics = () => <div data-testid="user-analytics" />;
  MockUserAnalytics.displayName = 'MockUserAnalytics';
  return MockUserAnalytics;
});

// ── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_USER: User = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  status: 'active',
  username: 'testuser',
};

const MOCK_OPERATOR: User = {
  id: '2',
  name: 'Test Operator',
  email: 'operator@example.com',
  role: 'operator',
  status: 'active',
  username: 'testoperator',
};

// ── Suite ──────────────────────────────────────────────────────────────────

describe('ViewUserCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── User data rendering ────────────────────────────────────────────────

  it('renders user data correctly', async () => {
    (userService.getById as jest.Mock).mockResolvedValue(MOCK_USER);

    render(<ViewUserCard id="1" />);

    expect(userService.getById).toHaveBeenCalledWith('1');
    expect(await screen.findByText('Test User')).toBeInTheDocument();
    const emailElements = await screen.findAllByText('test@example.com');
    expect(emailElements.length).toBeGreaterThan(0);
    emailElements.forEach(el => expect(el).toBeInTheDocument());
    expect(await screen.findByText('user')).toBeInTheDocument();
  });

  it('renders operator profile correctly', async () => {
    (userService.getById as jest.Mock).mockResolvedValue(MOCK_OPERATOR);

    render(<ViewUserCard id="2" />);

    expect(await screen.findByText('Test Operator')).toBeInTheDocument();
    expect(await screen.findByText('operator')).toBeInTheDocument();
  });

  it('renders username in the personal information section', async () => {
    (userService.getById as jest.Mock).mockResolvedValue(MOCK_USER);

    render(<ViewUserCard id="1" />);

    expect(await screen.findByText('testuser')).toBeInTheDocument();
  });

  it('renders user status in the personal information section', async () => {
    (userService.getById as jest.Mock).mockResolvedValue(MOCK_USER);

    render(<ViewUserCard id="1" />);

    expect(await screen.findByText('active')).toBeInTheDocument();
  });

  // ── Loading & error states ─────────────────────────────────────────────

  it('shows loading indicator while fetching data', () => {
    (userService.getById as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<ViewUserCard id="1" />);

    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-analytics')).not.toBeInTheDocument();
  });

  it('shows error message when fetching fails', async () => {
    (userService.getById as jest.Mock).mockRejectedValueOnce(
      new ApiServiceError('Failed to fetch user.', 404)
    );

    render(<ViewUserCard id="1" />);

    expect(await screen.findByText('El recurso solicitado no se encontró.')).toBeInTheDocument();
  });

  // ── Analytics integration ──────────────────────────────────────────────

  it('renders the "Rendimiento del Sistema" section after data loads', async () => {
    (userService.getById as jest.Mock).mockResolvedValue(MOCK_USER);

    render(<ViewUserCard id="1" />);

    expect(await screen.findByText('Rendimiento del Sistema')).toBeInTheDocument();
  });

  it('mounts the UserAnalytics component inside the profile', async () => {
    (userService.getById as jest.Mock).mockResolvedValue(MOCK_USER);

    render(<ViewUserCard id="1" />);

    expect(await screen.findByTestId('user-analytics')).toBeInTheDocument();
  });

  it('does NOT render UserAnalytics while still loading', () => {
    (userService.getById as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<ViewUserCard id="1" />);

    expect(screen.queryByTestId('user-analytics')).not.toBeInTheDocument();
    expect(screen.queryByText('Rendimiento del Sistema')).not.toBeInTheDocument();
  });

  it('does NOT render UserAnalytics when fetch returns an error', async () => {
    (userService.getById as jest.Mock).mockRejectedValueOnce(
      new ApiServiceError('Network error', 500)
    );

    render(<ViewUserCard id="1" />);

    await screen.findByText('Error interno del servidor. Por favor, inténtalo de nuevo más tarde.');
    expect(screen.queryByTestId('user-analytics')).not.toBeInTheDocument();
  });
});
