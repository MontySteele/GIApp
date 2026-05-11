import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Download, Edit3, Eye, type LucideIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CharacterForm from './CharacterForm';
import GOODImport from './GOODImport';
import IrminsulImport from './IrminsulImport';
import EnkaImport from './EnkaImport';
import type { Character } from '@/types';

export type AddModalView = 'options' | 'manual' | 'enka' | 'good' | 'irminsul';

interface AddCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCharacter: (data: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  /** Initial view to show when modal opens */
  initialView?: AddModalView;
}

const VIEW_TITLES: Record<AddModalView, string> = {
  options: 'Add Character',
  manual: 'Manual Entry',
  enka: 'Import from Enka.network',
  good: 'Import GOOD Format',
  irminsul: 'Import from Irminsul',
};

const ADD_OPTIONS: Array<{
  id: AddModalView;
  title: string;
  description: string;
  icon: LucideIcon;
  recommended?: boolean;
}> = [
  {
    id: 'irminsul',
    title: 'Import from Irminsul',
    description: 'Best for targets: roster, weapons, artifacts, and materials in one planning-ready import.',
    icon: Download,
    recommended: true,
  },
  {
    id: 'good',
    title: 'Import GOOD Format',
    description: 'Use a GOOD JSON export from compatible community tools for full account planning data.',
    icon: CheckCircle2,
  },
  {
    id: 'enka',
    title: 'Import from Enka.network',
    description: 'Quick UID import for public showcase characters only. Useful for trying the roster quickly.',
    icon: Eye,
  },
  {
    id: 'manual',
    title: 'Manual Entry',
    description: 'Add one character by hand when you only need a small correction or placeholder.',
    icon: Edit3,
  },
];

export default function AddCharacterModal({
  isOpen,
  onClose,
  onCreateCharacter,
  initialView = 'options',
}: AddCharacterModalProps) {
  const [view, setView] = useState<AddModalView>(initialView);

  // Update view when modal opens with a specific initial view
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
    }
  }, [isOpen, initialView]);

  const handleClose = () => {
    onClose();
    // Reset view after modal closes
    setTimeout(() => setView('options'), 200);
  };

  const handleSuccess = () => {
    handleClose();
  };

  const BackButton = () => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setView('options')}
      className="mb-4"
      aria-label="Back to import options"
    >
      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      Back to options
    </Button>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={VIEW_TITLES[view]} size="lg">
      {view === 'options' && (
        <div className="space-y-4">
          <p className="text-slate-400">
            Choose the data source that matches how much planning you want GIApp to do.
          </p>
          <div className="grid gap-3">
            {ADD_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setView(option.id)}
                  className="flex w-full items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/60 p-4 text-left transition-colors hover:border-slate-600 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  <span className="rounded-lg bg-slate-900 p-2 text-slate-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-100">{option.title}</span>
                      {option.recommended && (
                        <span className="rounded bg-green-900/50 px-2 py-0.5 text-xs text-green-400">
                          Recommended for targets
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-sm text-slate-400">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-sm text-slate-500">
            Irminsul and GOOD unlock material, weapon, artifact, and farming guidance. Enka only reads public showcase characters.
          </p>
        </div>
      )}

      {view === 'manual' && (
        <div>
          <BackButton />
          <CharacterForm
            onSubmit={async (data) => {
              await onCreateCharacter(data);
              handleSuccess();
            }}
            onCancel={handleClose}
          />
        </div>
      )}

      {view === 'enka' && (
        <div>
          <BackButton />
          <EnkaImport onSuccess={handleSuccess} onCancel={handleClose} />
        </div>
      )}

      {view === 'good' && (
        <div>
          <BackButton />
          <GOODImport onSuccess={handleSuccess} onCancel={handleClose} />
        </div>
      )}

      {view === 'irminsul' && (
        <div>
          <BackButton />
          <IrminsulImport onSuccess={handleSuccess} onCancel={handleClose} />
        </div>
      )}
    </Modal>
  );
}
