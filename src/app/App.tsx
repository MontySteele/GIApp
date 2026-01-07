import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { initializeDatabase } from '@/db/migrations';

function App() {
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
