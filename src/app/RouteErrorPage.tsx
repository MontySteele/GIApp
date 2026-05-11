import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import Button from '@/components/ui/Button';

interface RouteErrorViewProps {
  error?: unknown;
  fallbackStatus?: number;
}

const GENERIC_ROUTE_ERROR_MESSAGE = 'An unexpected error occurred while loading this page.';

export function getRouteErrorDetails(
  error: unknown,
  fallbackStatus: number,
  options: { showErrorMessage?: boolean } = {}
) {
  const showErrorMessage = options.showErrorMessage ?? import.meta.env.DEV;

  if (isRouteErrorResponse(error)) {
    return {
      status: error.status,
      title: error.status === 404 ? 'Page not found' : 'Route unavailable',
      message: error.statusText || 'The requested route could not be loaded.',
    };
  }

  if (error instanceof Error) {
    return {
      status: fallbackStatus,
      title: 'Something went wrong',
      message: showErrorMessage ? error.message : GENERIC_ROUTE_ERROR_MESSAGE,
    };
  }

  return {
    status: fallbackStatus,
    title: fallbackStatus === 404 ? 'Page not found' : 'Something went wrong',
    message: fallbackStatus === 404
      ? 'That route is not part of the current app navigation.'
      : 'The app hit a routing error while loading this page.',
  };
}

function RouteErrorView({ error, fallbackStatus = 404 }: RouteErrorViewProps) {
  const details = getRouteErrorDetails(error, fallbackStatus);

  return (
    <section
      aria-labelledby="route-error-title"
      className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center text-center"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
        {details.status}
      </p>
      <h1 id="route-error-title" className="text-3xl font-semibold text-slate-100">
        {details.title}
      </h1>
      <p className="mt-3 max-w-xl text-slate-400">
        {details.message}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Go to dashboard
        </Link>
        {details.status !== 404 && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reload page
          </Button>
        )}
      </div>
    </section>
  );
}

export function NotFoundPage() {
  return <RouteErrorView fallbackStatus={404} />;
}

export default function RouteErrorPage() {
  const error = useRouteError();
  return <RouteErrorView error={error} fallbackStatus={500} />;
}
