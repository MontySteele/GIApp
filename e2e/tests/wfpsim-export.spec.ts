/**
 * E2E Tests: wfpsim Export Flow
 * Tests for exporting team configurations to wfpsim/gcsim format
 */

import { test, expect, type Page } from '@playwright/test';
import { RosterPage, TeamsPage } from '../pages';
import { clearDatabase, waitForAppReady, sampleGOODData } from '../fixtures/test-data';

// Extended GOOD data with 4 characters for a full team
const fourCharacterGOODData = {
  ...sampleGOODData,
  characters: [
    {
      key: 'RaidenShogun',
      level: 90,
      constellation: 0,
      ascension: 6,
      talent: { auto: 1, skill: 9, burst: 10 },
    },
    {
      key: 'Bennett',
      level: 90,
      constellation: 6,
      ascension: 6,
      talent: { auto: 1, skill: 6, burst: 10 },
    },
    {
      key: 'Xiangling',
      level: 90,
      constellation: 6,
      ascension: 6,
      talent: { auto: 1, skill: 6, burst: 10 },
    },
    {
      key: 'Xingqiu',
      level: 90,
      constellation: 6,
      ascension: 6,
      talent: { auto: 1, skill: 6, burst: 10 },
    },
  ],
  weapons: [
    {
      key: 'EngulfingLightning',
      level: 90,
      ascension: 6,
      refinement: 1,
      location: 'RaidenShogun',
      lock: true,
    },
    {
      key: 'SkywardBlade',
      level: 90,
      ascension: 6,
      refinement: 1,
      location: 'Bennett',
      lock: true,
    },
    {
      key: 'TheCatch',
      level: 90,
      ascension: 6,
      refinement: 5,
      location: 'Xiangling',
      lock: true,
    },
    {
      key: 'SacrificialSword',
      level: 90,
      ascension: 6,
      refinement: 5,
      location: 'Xingqiu',
      lock: true,
    },
  ],
  artifacts: [
    {
      setKey: 'EmblemOfSeveredFate',
      slotKey: 'flower',
      level: 20,
      rarity: 5,
      mainStatKey: 'hp',
      location: 'RaidenShogun',
      lock: true,
      substats: [],
    },
    {
      setKey: 'NoblesseOblige',
      slotKey: 'flower',
      level: 20,
      rarity: 5,
      mainStatKey: 'hp',
      location: 'Bennett',
      lock: true,
      substats: [],
    },
    {
      setKey: 'EmblemOfSeveredFate',
      slotKey: 'flower',
      level: 20,
      rarity: 5,
      mainStatKey: 'hp',
      location: 'Xiangling',
      lock: true,
      substats: [],
    },
    {
      setKey: 'EmblemOfSeveredFate',
      slotKey: 'flower',
      level: 20,
      rarity: 5,
      mainStatKey: 'hp',
      location: 'Xingqiu',
      lock: true,
      substats: [],
    },
  ],
};

async function createFourCharacterTeam(page: Page, teamName: string): Promise<void> {
  const teams = new TeamsPage(page);
  await teams.goto();
  const modal = await teams.openCreateTeamModal();
  await teams.fillTeamName(teamName);

  const characterCheckboxes = modal.locator('input[type="checkbox"]');
  const count = await characterCheckboxes.count();
  for (let i = 0; i < Math.min(4, count); i++) {
    await characterCheckboxes.nth(i).check();
  }

  await teams.saveTeam();
  await expect(teams.teamCards.filter({ hasText: teamName }).first()).toBeVisible({ timeout: 5000 });
}

async function openWfpsimExport(page: Page, teamName: string) {
  const teams = new TeamsPage(page);
  await teams.goto();
  await teams.exportToWfpsim(teamName);

  const modal = page.locator('[role="dialog"]');
  await expect(modal.getByRole('heading', { name: /^export to wfpsim$/i })).toBeVisible();
  return modal;
}

test.describe('wfpsim Export Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearDatabase(page);
    await page.goto('/');
    await waitForAppReady(page);

    const roster = new RosterPage(page);
    await roster.goto();
    await roster.openAddCharacterModal();
    await roster.selectImportMethod('good');
    await roster.importFromGOOD(JSON.stringify(fourCharacterGOODData));
    await expect(page.locator('[role="alert"], [data-testid="import-success"], text=/imported|success/i').first()).toBeVisible({ timeout: 10000 }).catch(() => {});
  });

  test('can export team to wfpsim format', async ({ page }) => {
    await createFourCharacterTeam(page, 'National Raiden');

    const modal = await openWfpsimExport(page, 'National Raiden');

    await expect(modal.getByText('Generated Config')).toBeVisible();
    await expect(modal.locator('pre')).toBeVisible();
  });

  test('export modal shows configuration options', async ({ page }) => {
    await createFourCharacterTeam(page, 'Export Test Team');

    const modal = await openWfpsimExport(page, 'Export Test Team');

    await expect(modal.getByText(/^iterations$/i)).toBeVisible();
    await expect(modal.getByText(/^duration \(s\)$/i)).toBeVisible();
    await expect(modal.getByText(/^target level$/i)).toBeVisible();
    await expect(modal.getByText(/^resist \(%\)$/i)).toBeVisible();
    await expect(modal.getByLabel(/include comments/i)).toBeVisible();
  });

  test('can copy gcsim config to clipboard', async ({ page }) => {
    await createFourCharacterTeam(page, 'Clipboard Test Team');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const modal = await openWfpsimExport(page, 'Clipboard Test Team');
    await modal.getByRole('button', { name: /^copy config$/i }).click();

    await expect(modal.getByRole('button', { name: /^copied!$/i })).toBeVisible({ timeout: 3000 });
  });

  test('exported config has valid gcsim structure', async ({ page }) => {
    await createFourCharacterTeam(page, 'Structure Test Team');

    const modal = await openWfpsimExport(page, 'Structure Test Team');
    const configText = await modal.locator('pre').textContent();

    expect(configText).toContain('target lvl=');
    expect(configText).toContain('options iteration=');
  });
});
