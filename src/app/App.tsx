import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import DatabaseGate from './DatabaseGate';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

function App() {
  return (
    <DatabaseGate>
      <OnboardingProvider>
        <RouterProvider router={router} />
      </OnboardingProvider>
    </DatabaseGate>
  );
}

export default App;
