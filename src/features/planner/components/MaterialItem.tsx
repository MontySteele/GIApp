import { Check, AlertCircle, Calendar } from 'lucide-react';
import type { MaterialRequirement } from '../domain/ascensionCalculator';

interface MaterialItemProps {
  mat: MaterialRequirement;
}

export default function MaterialItem({ mat }: MaterialItemProps) {
  return (
    <div
      className={`flex items-start justify-between p-3 rounded-lg ${
        mat.deficit > 0 ? 'bg-red-900/20 border border-red-900/30' : 'bg-slate-900'
      }`}
    >
      <div className="flex items-start gap-3 flex-1">
        <div
          className={`w-2 h-2 rounded-full mt-1.5 ${
            mat.deficit > 0 ? 'bg-red-500' : 'bg-green-500'
          }`}
        />
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-200">{mat.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500 capitalize">{mat.category}</span>
            {mat.tier && (
              <span className="text-xs text-slate-600">• Tier {mat.tier}</span>
            )}
          </div>
          {/* Source and availability info */}
          {(mat.source || mat.availability) && (
            <div className="mt-1 flex items-center gap-2">
              {mat.availability && mat.availability.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-blue-400">
                  <Calendar className="w-3 h-3" />
                  <span>{mat.availability.join(', ')}</span>
                </div>
              )}
              {mat.source && !mat.availability && (
                <div className="text-xs text-slate-500">
                  {mat.source}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm text-slate-300">
            {mat.owned.toLocaleString()} / {mat.required.toLocaleString()}
          </div>
          {mat.deficit > 0 && (
            <div className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Need {mat.deficit.toLocaleString()} more
            </div>
          )}
        </div>
        {mat.deficit === 0 && (
          <Check className="w-5 h-5 text-green-500" />
        )}
      </div>
    </div>
  );
}
