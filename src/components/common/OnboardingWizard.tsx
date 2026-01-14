import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Users,
  Target,
  Gem,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Check,
  Download,
  Edit3,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

type WizardStep = 'welcome' | 'import' | 'features' | 'complete';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const IMPORT_OPTIONS = [
  {
    id: 'enka',
    title: 'Enka.Network',
    description: 'Import directly from your UID. Requires in-game showcase enabled.',
    icon: Download,
    recommended: true,
  },
  {
    id: 'irminsul',
    title: 'Irminsul Scanner',
    description: 'Use the desktop scanner app for detailed artifact data.',
    icon: Download,
    recommended: false,
  },
  {
    id: 'good',
    title: 'GOOD Format',
    description: 'Import JSON file from other Genshin tools.',
    icon: Download,
    recommended: false,
  },
  {
    id: 'manual',
    title: 'Manual Entry',
    description: 'Add characters one by one with full control.',
    icon: Edit3,
    recommended: false,
  },
] as const;

const FEATURES = [
  {
    id: 'roster',
    title: 'Character Roster',
    description: 'Track all your characters, weapons, and artifacts with detailed stats.',
    icon: Users,
    color: 'text-blue-400',
  },
  {
    id: 'teams',
    title: 'Team Builder',
    description: 'Create and manage team compositions for different content.',
    icon: Target,
    color: 'text-green-400',
  },
  {
    id: 'planner',
    title: 'Material Planner',
    description: 'Plan farming routes and track material deficits for your characters.',
    icon: Calendar,
    color: 'text-purple-400',
  },
  {
    id: 'pulls',
    title: 'Pull Tracker',
    description: 'Manage pity, simulate pulls, and budget your primogems.',
    icon: Gem,
    color: 'text-yellow-400',
  },
] as const;

export default function OnboardingWizard({ isOpen, onClose, onComplete }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>('welcome');
  const [selectedImport, setSelectedImport] = useState<string | null>(null);

  const handleNext = () => {
    switch (step) {
      case 'welcome':
        setStep('import');
        break;
      case 'import':
        setStep('features');
        break;
      case 'features':
        setStep('complete');
        break;
      case 'complete':
        onComplete();
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'import':
        setStep('welcome');
        break;
      case 'features':
        setStep('import');
        break;
      case 'complete':
        setStep('features');
        break;
    }
  };

  const handleStartImport = () => {
    onComplete();
    // Navigate to roster with import method as query param to auto-open the modal
    if (selectedImport) {
      navigate(`/roster?import=${selectedImport}`);
    } else {
      navigate('/roster');
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const stepIndex = ['welcome', 'import', 'features', 'complete'].indexOf(step);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i <= stepIndex
                ? 'w-8 bg-primary-500'
                : 'w-4 bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      {step === 'welcome' && (
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">
            Welcome to GIApp
          </h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Your personal Genshin Impact companion for tracking characters,
            planning materials, managing teams, and optimizing your pulls.
          </p>
          <div className="flex flex-col gap-2 text-left max-w-sm mx-auto mb-6">
            <div className="flex items-center gap-3 text-slate-300">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Track your complete character roster</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Plan material farming efficiently</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Build and optimize team compositions</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span>Budget primogems and simulate pulls</span>
            </div>
          </div>
        </div>
      )}

      {step === 'import' && (
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-2 text-center">
            Import Your Data
          </h2>
          <p className="text-slate-400 mb-6 text-center">
            Get started quickly by importing your existing characters.
          </p>
          <div className="grid gap-3">
            {IMPORT_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedImport === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedImport(option.id)}
                  className={`flex items-start gap-4 p-4 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-primary-900/30 border-primary-500'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary-500/20' : 'bg-slate-800'}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-primary-400' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isSelected ? 'text-primary-300' : 'text-slate-200'}`}>
                        {option.title}
                      </span>
                      {option.recommended && (
                        <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{option.description}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary-500 bg-primary-500' : 'border-slate-600'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-sm text-slate-500 mt-4 text-center">
            You can always import more characters later from the Roster page.
          </p>
        </div>
      )}

      {step === 'features' && (
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-2 text-center">
            Key Features
          </h2>
          <p className="text-slate-400 mb-6 text-center">
            Here's what you can do with GIApp.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  className="p-4 bg-slate-900 border border-slate-700 rounded-lg"
                >
                  <Icon className={`w-8 h-8 ${feature.color} mb-3`} />
                  <h3 className="font-medium text-slate-200 mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-3">
            You're All Set!
          </h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Head to the Roster page to import your characters and start tracking your progress.
          </p>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-left max-w-sm mx-auto">
            <p className="text-sm text-slate-400 mb-2">Quick tip:</p>
            <p className="text-slate-300">
              Check the Getting Started checklist on your Dashboard to make sure you've set everything up.
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-800">
        <div>
          {step !== 'welcome' ? (
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleSkip}>
              Skip tutorial
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {step === 'complete' ? (
            <Button onClick={handleStartImport}>
              Go to Roster
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {step === 'features' ? 'Finish' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
