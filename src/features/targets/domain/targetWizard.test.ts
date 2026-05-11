import { describe, expect, it } from 'vitest';
import { buildTargetWizardPreview, type TargetWizardState } from './targetWizard';

const baseState: TargetWizardState = {
  mode: 'get-character',
  characterKey: 'Furina',
  teamId: '',
  buildGoal: 'comfortable',
  deadline: '2026-06-10',
  savedPulls: '42',
  currentPity: '10',
  targetConstellation: '',
  pullBudget: '',
  guaranteed: false,
  useWishHistory: false,
};

describe('target wizard preview', () => {
  it('builds manual pull advice and prefilled target links', () => {
    const preview = buildTargetWizardPreview(baseState, {
      now: new Date('2026-05-11T12:00:00.000Z'),
    });

    expect(preview).toMatchObject({
      canCreate: true,
      title: 'Get Furina',
      summary: '58% hard-pity coverage',
      desiredCopies: 1,
      pullShortfall: 38,
      pullsPerDay: 1.3,
      readinessPercent: 58,
      createHref: '/campaigns?type=character-acquisition&character=Furina&buildGoal=comfortable&copies=1&deadline=2026-06-10&pullPlan=1',
    });
    expect(preview.calculatorHref).toContain('/pulls/calculator?');
    expect(preview.adviceRows).toEqual([
      'You need 38 more pulls before the banner target.',
      '1.3 pulls/day until your deadline.',
      'Manual mode is enough to start; importing wish history can refine the odds later.',
    ]);
  });

  it('accounts for constellation, guarantee, and pull budget warnings', () => {
    const preview = buildTargetWizardPreview({
      ...baseState,
      targetConstellation: '1',
      savedPulls: '20',
      currentPity: '5',
      pullBudget: '80',
      guaranteed: true,
      useWishHistory: true,
    }, {
      now: new Date('2026-05-11T12:00:00.000Z'),
    });

    expect(preview.desiredCopies).toBe(2);
    expect(preview.pullShortfall).toBe(155);
    expect(preview.createHref).toContain('constellation=1');
    expect(preview.createHref).toContain('budget=80');
    expect(preview.adviceRows).toContain('Guarantee is active, so the next character five-star is featured.');
    expect(preview.adviceRows).toContain('Budget warning: 80 pulls is below the current hard-pity shortfall.');
  });

  it('builds character polish and team polish previews', () => {
    const characterPreview = buildTargetWizardPreview({
      ...baseState,
      mode: 'build-character',
      deadline: '',
    });
    expect(characterPreview).toMatchObject({
      canCreate: true,
      title: 'Build Furina',
      createHref: '/campaigns?type=character-polish&character=Furina&buildGoal=comfortable&pullPlan=0',
    });
    expect(characterPreview.calculatorHref).toBeUndefined();

    expect(buildTargetWizardPreview({
      ...baseState,
      mode: 'polish-team',
      characterKey: '',
      teamId: 'team-1',
    })).toMatchObject({
      canCreate: true,
      title: 'Polish a team',
      createHref: '/campaigns?team=team-1&buildGoal=comfortable&deadline=2026-06-10',
    });
  });

  it('blocks creation until the relevant target is selected', () => {
    expect(buildTargetWizardPreview({
      ...baseState,
      characterKey: '',
    }).canCreate).toBe(false);

    expect(buildTargetWizardPreview({
      ...baseState,
      mode: 'polish-team',
      characterKey: '',
      teamId: '',
    }).canCreate).toBe(false);
  });
});
