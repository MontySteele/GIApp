import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { initializeDatabase } from '@/db/migrations';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

function App() {
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);

  return (
    <OnboardingProvider>
      <RouterProvider router={router} />
    </OnboardingProvider>
  );
}

export default App;
