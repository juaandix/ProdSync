
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Pagination from '@/app/users/components/Pagination';

describe('Pagination', () => {
  const onPageChange = jest.fn();

  it('renders the correct number of pages', () => {
    render(<Pagination totalPages={5} currentPage={1} onPageChange={onPageChange} />);

    const pageButtons = screen.getAllByRole('button');
    expect(pageButtons).toHaveLength(5);
  });

  it('highlights the current page', () => {
    render(<Pagination totalPages={5} currentPage={3} onPageChange={onPageChange} />);

    const currentPageButton = screen.getByText('3');
    expect(currentPageButton).toHaveClass('bg-blue-500');
  });

  it('calls onPageChange with the correct page number when a page is clicked', () => {
    render(<Pagination totalPages={5} currentPage={1} onPageChange={onPageChange} />);

    const pageButton = screen.getByText('4');
    fireEvent.click(pageButton);

    expect(onPageChange).toHaveBeenCalledWith(4);
  });
});
