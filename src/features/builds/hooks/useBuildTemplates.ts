import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useCallback } from 'react';
import { buildTemplateRepo } from '../repo/buildTemplateRepo';
import type { BuildTemplate, CharacterRole, BuildDifficulty, BuildBudget } from '@/types';

export interface BuildTemplateQuery {
  filters?: {
    characterKey?: string;
    role?: CharacterRole;
    difficulty?: BuildDifficulty;
    budget?: BuildBudget;
    isOfficial?: boolean;
    tags?: string[];
    search?: string;
  };
  sort?: {
    field: 'name' | 'updatedAt' | 'characterKey';
    direction: 'asc' | 'desc';
  };
}

function filterAndSortTemplates(
  templates: BuildTemplate[],
  query?: BuildTemplateQuery
): BuildTemplate[] {
  if (!query) return templates;

  let result = [...templates];

  // Apply filters
  if (query.filters) {
    const { characterKey, role, difficulty, budget, isOfficial, tags, search } = query.filters;

    if (characterKey) {
      result = result.filter((t) => t.characterKey === characterKey);
    }
    if (role) {
      result = result.filter((t) => t.role === role);
    }
    if (difficulty) {
      result = result.filter((t) => t.difficulty === difficulty);
    }
    if (budget) {
      result = result.filter((t) => t.budget === budget);
    }
    if (isOfficial !== undefined) {
      result = result.filter((t) => t.isOfficial === isOfficial);
    }
    if (tags && tags.length > 0) {
      result = result.filter((t) => tags.some((tag) => t.tags.includes(tag)));
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(lower) ||
          t.description.toLowerCase().includes(lower) ||
          t.characterKey.toLowerCase().includes(lower)
      );
    }
  }

  // Apply sort
  if (query.sort) {
    const { field, direction } = query.sort;
    result.sort((a, b) => {
      let comparison = 0;
      switch (field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'updatedAt':
          comparison = a.updatedAt.localeCompare(b.updatedAt);
          break;
        case 'characterKey':
          comparison = a.characterKey.localeCompare(b.characterKey);
          break;
      }
      return direction === 'desc' ? -comparison : comparison;
    });
  }

  return result;
}

export function useBuildTemplates(query?: BuildTemplateQuery) {
  const templates = useLiveQuery(() => buildTemplateRepo.getAll(), []);

  const filteredTemplates = useMemo(
    () => filterAndSortTemplates(templates ?? [], query),
    [
      templates,
      query?.filters?.characterKey,
      query?.filters?.role,
      query?.filters?.difficulty,
      query?.filters?.budget,
      query?.filters?.isOfficial,
      query?.filters?.tags,
      query?.filters?.search,
      query?.sort?.field,
      query?.sort?.direction,
    ]
  );

  const createTemplate = useCallback(
    async (template: Omit<BuildTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
      return buildTemplateRepo.create(template);
    },
    []
  );

  const updateTemplate = useCallback(
    async (id: string, updates: Partial<Omit<BuildTemplate, 'id' | 'createdAt'>>) => {
      return buildTemplateRepo.update(id, updates);
    },
    []
  );

  const deleteTemplate = useCallback(async (id: string) => {
    return buildTemplateRepo.delete(id);
  }, []);

  // Statistics
  const stats = useMemo(() => {
    if (!templates) return null;
    return {
      total: templates.length,
      official: templates.filter((t) => t.isOfficial).length,
      byRole: templates.reduce(
        (acc, t) => {
          acc[t.role] = (acc[t.role] || 0) + 1;
          return acc;
        },
        {} as Record<CharacterRole, number>
      ),
      byDifficulty: templates.reduce(
        (acc, t) => {
          acc[t.difficulty] = (acc[t.difficulty] || 0) + 1;
          return acc;
        },
        {} as Record<BuildDifficulty, number>
      ),
      byBudget: templates.reduce(
        (acc, t) => {
          acc[t.budget] = (acc[t.budget] || 0) + 1;
          return acc;
        },
        {} as Record<BuildBudget, number>
      ),
    };
  }, [templates]);

  return {
    templates: filteredTemplates,
    allTemplates: templates ?? [],
    stats,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    isLoading: templates === undefined,
  };
}

/**
 * Hook for getting templates for a specific character
 */
export function useCharacterBuildTemplates(characterKey: string | undefined) {
  const templates = useLiveQuery(
    () => (characterKey ? buildTemplateRepo.getByCharacter(characterKey) : []),
    [characterKey]
  );

  return {
    templates: templates ?? [],
    isLoading: templates === undefined && characterKey !== undefined,
    hasTemplates: (templates ?? []).length > 0,
  };
}

/**
 * Hook for getting a single build template by ID
 */
export function useBuildTemplate(id: string | undefined) {
  const template = useLiveQuery(
    () => (id ? buildTemplateRepo.getById(id) : undefined),
    [id]
  );

  return {
    template,
    isLoading: template === undefined && id !== undefined,
  };
}
