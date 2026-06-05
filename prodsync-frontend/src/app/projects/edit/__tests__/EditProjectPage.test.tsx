
import { render, screen, waitFor } from '@testing-library/react';
import EditProjectPage from '@/app/projects/edit/[id]/page';

jest.mock('next/navigation', () => ({
  usePathname: () => '/projects/edit/1',
}));

jest.mock('@/components/form/EditProjectForm', () => {
  return {
    __esModule: true,
    default: ({ id }: { id: string }) => <div data-testid="edit-project-form">{id}</div>,
  };
});

describe('EditProjectPage', () => {
  it('should render the component and pass the id to the form', async () => {
    const props = {
      params: Promise.resolve({ id: '123' }),
    };
    // @ts-expect-error: Async server component
    const Page = await EditProjectPage(props);
    render(Page);

    await waitFor(() => {
      expect(screen.getByTestId('edit-project-form')).toHaveTextContent('123');
    });
  });
});
