import { useState, useEffect } from 'react';
import { materialRepo } from '@/features/roster/repo/inventoryRepo';

export function useMaterials() {
  const [materials, setMaterials] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMaterials() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await materialRepo.get();
        setMaterials(data?.materials ?? {});
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load materials');
      } finally {
        setIsLoading(false);
      }
    }
    loadMaterials();
  }, []);

  const totalMaterialTypes = Object.keys(materials).length;
  const hasMaterials = totalMaterialTypes > 0;

  return {
    materials,
    isLoading,
    error,
    totalMaterialTypes,
    hasMaterials,
  };
}
