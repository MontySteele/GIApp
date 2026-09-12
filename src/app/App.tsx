import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import DatabaseGate from './DatabaseGate';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { ensurePersistentStorage } from '@/features/sync/services/storageHealth';

function App() {
  return (
    <DatabaseGate onReady={ensurePersistentStorage}>
      <OnboardingProvider>
        <RouterProvider router={router} />
      </OnboardingProvider>
    </DatabaseGate>
  );
}

export default App;
