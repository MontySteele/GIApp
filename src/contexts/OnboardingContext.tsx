import { createContext, useContext, type ReactNode } from 'react';
import { useOnboarding, type OnboardingChecklist } from '@/hooks/useOnboarding';

interface OnboardingContextValue {
  isComplete: boolean | null;
  showWizard: boolean;
  checklist: OnboardingChecklist;
  checklistProgress: number;
  checklistTotal: number;
  isChecklistComplete: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  openWizard: () => void;
  closeWizard: () => void;
  updateChecklist: (updates: Partial<OnboardingChecklist>) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const onboarding = useOnboarding();

  return (
    <OnboardingContext.Provider value={onboarding}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
}
