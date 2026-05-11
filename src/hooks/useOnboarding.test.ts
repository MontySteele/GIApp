import { describe, expect, it, beforeEach } from 'vitest';
import {
  markChecklistItem,
  normalizeOnboardingChecklist,
  type OnboardingChecklist,
} from './useOnboarding';

const CHECKLIST_KEY = 'onboarding_checklist';

describe('onboarding checklist helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('normalizes legacy checklist state without treating a pulls visit as wish import', () => {
    const checklist = normalizeOnboardingChecklist({
      hasImportedCharacters: true,
      hasCreatedTeam: false,
      hasVisitedPlanner: true,
      hasCheckedPulls: true,
    });

    expect(checklist).toEqual<OnboardingChecklist>({
      hasImportedCharacters: true,
      hasCreatedTeam: false,
      hasVisitedPlanner: true,
      hasImportedWishHistory: false,
    });
  });

  it('marks the explicit wish history import item', () => {
    markChecklistItem('hasImportedWishHistory');

    expect(JSON.parse(localStorage.getItem(CHECKLIST_KEY) ?? '{}')).toMatchObject({
      hasImportedWishHistory: true,
    });
  });
});
