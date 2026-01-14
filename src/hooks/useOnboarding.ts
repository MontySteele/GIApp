import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'onboarding_completed';
const CHECKLIST_KEY = 'onboarding_checklist';

export interface OnboardingChecklist {
  hasImportedCharacters: boolean;
  hasCreatedTeam: boolean;
  hasVisitedPlanner: boolean;
  hasCheckedPulls: boolean;
}

const DEFAULT_CHECKLIST: OnboardingChecklist = {
  hasImportedCharacters: false,
  hasCreatedTeam: false,
  hasVisitedPlanner: false,
  hasCheckedPulls: false,
};

/**
 * Hook to manage onboarding state
 */
export function useOnboarding() {
  const [isComplete, setIsComplete] = useState<boolean | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [checklist, setChecklist] = useState<OnboardingChecklist>(DEFAULT_CHECKLIST);

  // Load state from localStorage on mount
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    setIsComplete(completed === 'true');

    const savedChecklist = localStorage.getItem(CHECKLIST_KEY);
    if (savedChecklist) {
      try {
        setChecklist(JSON.parse(savedChecklist));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Show wizard if first visit (not completed)
  useEffect(() => {
    if (isComplete === false) {
      setShowWizard(true);
    }
  }, [isComplete]);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsComplete(true);
    setShowWizard(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CHECKLIST_KEY);
    setIsComplete(false);
    setChecklist(DEFAULT_CHECKLIST);
    setShowWizard(true);
  }, []);

  const openWizard = useCallback(() => {
    setShowWizard(true);
  }, []);

  const closeWizard = useCallback(() => {
    setShowWizard(false);
  }, []);

  const updateChecklist = useCallback((updates: Partial<OnboardingChecklist>) => {
    setChecklist((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const checklistProgress = Object.values(checklist).filter(Boolean).length;
  const checklistTotal = Object.keys(checklist).length;
  const isChecklistComplete = checklistProgress === checklistTotal;

  return {
    isComplete,
    showWizard,
    checklist,
    checklistProgress,
    checklistTotal,
    isChecklistComplete,
    completeOnboarding,
    resetOnboarding,
    openWizard,
    closeWizard,
    updateChecklist,
  };
}

/**
 * Mark a checklist item as complete
 * Can be called from anywhere without the full hook
 */
export function markChecklistItem(item: keyof OnboardingChecklist) {
  const saved = localStorage.getItem(CHECKLIST_KEY);
  let checklist = DEFAULT_CHECKLIST;
  if (saved) {
    try {
      checklist = JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  checklist[item] = true;
  localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklist));
}
