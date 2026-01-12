import { Target, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export function SingleModeEmptyState() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 mb-2">Select a character to calculate materials</p>
        <p className="text-sm text-slate-500">
          Characters are pulled from your roster. Import via Enka or Irminsul first.
        </p>
      </CardContent>
    </Card>
  );
}

export function MultiModeEmptyState() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 mb-2">Select characters to calculate combined materials</p>
        <p className="text-sm text-slate-500">
          Click on characters above or use "Select All" to start planning.
        </p>
      </CardContent>
    </Card>
  );
}
