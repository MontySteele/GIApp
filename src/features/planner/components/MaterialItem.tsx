import { useState, useCallback, useRef, useEffect } from 'react';
import { Check, AlertCircle, Calendar, Pencil } from 'lucide-react';
import type { MaterialRequirement } from '../domain/ascensionCalculator';

interface MaterialItemProps {
  mat: MaterialRequirement;
  onUpdateOwned?: (key: string, newCount: number) => void;
}

export default function MaterialItem({ mat, onUpdateOwned }: MaterialItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = useCallback(() => {
    if (!onUpdateOwned) return;
    setEditValue(String(mat.owned));
    setIsEditing(true);
  }, [onUpdateOwned, mat.owned]);

  const saveEdit = useCallback(() => {
    setIsEditing(false);
    const parsed = parseInt(editValue, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed !== mat.owned) {
      onUpdateOwned?.(mat.key, parsed);
    }
  }, [editValue, mat.owned, mat.key, onUpdateOwned]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        saveEdit();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
      }
    },
    [saveEdit]
  );

  const progressPercent = mat.required > 0 ? Math.min(100, (mat.owned / mat.required) * 100) : 100;

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
          {/* Progress bar */}
          <div className="mt-1.5 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                mat.deficit > 0 ? 'bg-red-500/70' : 'bg-green-500/70'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
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
          <div className="text-sm text-slate-300 flex items-center gap-1.5 justify-end">
            {isEditing ? (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                  onBlur={saveEdit}
                  onKeyDown={handleKeyDown}
                  className="w-16 px-1.5 py-0.5 text-sm text-right bg-slate-800 border border-primary-500 rounded text-slate-200 focus:outline-none"
                />
                <span className="text-slate-500">/</span>
                <span>{mat.required.toLocaleString()}</span>
              </>
            ) : (
              <>
                {onUpdateOwned ? (
                  <button
                    onClick={startEditing}
                    className="group flex items-center gap-1 hover:text-primary-400 transition-colors"
                    title="Click to edit owned count"
                  >
                    <span>{mat.owned.toLocaleString()}</span>
                    <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary-400" />
                  </button>
                ) : (
                  <span>{mat.owned.toLocaleString()}</span>
                )}
                <span className="text-slate-500">/</span>
                <span>{mat.required.toLocaleString()}</span>
              </>
            )}
          </div>
          {mat.deficit > 0 && (
            <div className="text-xs text-red-400 flex items-center gap-1 justify-end mt-0.5">
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
