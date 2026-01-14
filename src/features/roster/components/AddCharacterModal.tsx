import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
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
          <p className="text-slate-400">Choose how you'd like to add characters to your roster:</p>
          <div className="grid gap-3">
            <Button variant="secondary" className="justify-start" onClick={() => setView('manual')}>
              Manual Entry
            </Button>
            <Button variant="secondary" className="justify-start" onClick={() => setView('enka')}>
              Import from Enka.network
            </Button>
            <Button variant="secondary" className="justify-start" onClick={() => setView('good')}>
              Import GOOD Format (JSON)
            </Button>
            <Button variant="secondary" className="justify-start" onClick={() => setView('irminsul')}>
              Import from Irminsul
            </Button>
          </div>
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
