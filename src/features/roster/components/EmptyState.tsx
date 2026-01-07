import { Users, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';

interface EmptyStateProps {
  onAddCharacter: () => void;
}

export default function EmptyState({ onAddCharacter }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-slate-800 rounded-full p-6 mb-4">
        <Users className="w-12 h-12 text-slate-600" />
      </div>
      <h3 className="text-xl font-semibold text-slate-200 mb-2">
        No Characters Yet
      </h3>
      <p className="text-slate-400 mb-6 text-center max-w-md">
        Start building your roster by adding characters manually, importing from Enka.network, or uploading a GOOD format file.
      </p>
      <Button onClick={onAddCharacter}>
        <Plus className="w-4 h-4" />
        Add Character
      </Button>
    </div>
  );
}
