import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom';
import RouteErrorPage, { NotFoundPage, getRouteErrorDetails } from './RouteErrorPage';

describe('RouteErrorPage', () => {
  it('renders a friendly catch-all 404 state', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to dashboard/i })).toHaveAttribute('href', '/');
  });

  it('renders route error responses without the default React Router fallback', async () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <div>Home</div>,
        errorElement: <RouteErrorPage />,
        loader: () => {
          throw new Response('Missing', {
            status: 404,
            statusText: 'Missing route',
          });
        },
      },
    ]);

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByText('Missing route')).toBeInTheDocument();
  });

  it('hides raw JavaScript error details outside development mode', () => {
    const details = getRouteErrorDetails(
      new Error('Internal failure at /Users/example/app/src/private.ts'),
      500,
      { showErrorMessage: false }
    );

    expect(details.message).toBe('An unexpected error occurred while loading this page.');
    expect(details.message).not.toContain('/Users/example');
  });
});
