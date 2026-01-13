/**
 * useTeamPlan Hook
 *
 * Extends multi-character planning with team-specific features:
 * - Shared material detection across team members
 * - Boss optimization (which bosses benefit multiple characters)
 * - Domain efficiency (shared talent book domains)
 * - Aggregate resource totals
 */

import { useState, useEffect, useMemo } from 'react';
import { useTeams } from '@/features/roster/hooks/useTeams';
import {
  calculateMultiCharacterSummary,
  createGoalsFromCharacters,
  type AggregatedMaterialSummary,
} from '../domain/multiCharacterCalculator';
import type { Character, Team } from '@/types';
import type { GoalType } from './useMultiCharacterPlan';

interface UseTeamPlanOptions {
  teamId: string | undefined;
  characters: Character[];
  inventory: Record<string, number>;
  goalType?: GoalType;
}

interface SharedMaterial {
  key: string;
  name: string;
  category: string;
  sharedBy: string[]; // Character keys that need this material
  totalNeeded: number;
  totalHave: number;
  deficit: number;
}

interface BossOptimization {
  bossName: string;
  materials: string[];
  benefitsCharacters: string[]; // Character keys
  priority: 'high' | 'medium' | 'low'; // Based on how many team members benefit
}

interface DomainEfficiency {
  domainName: string;
  materials: string[];
  benefitsCharacters: string[];
  daysAvailable: string[]; // 'Monday', 'Tuesday', etc.
  efficiency: number; // 0-1, higher is better (more characters benefit)
}

interface TeamPlanResult {
  // Team info
  team: Team | undefined;
  teamMembers: Character[];
  isLoading: boolean;

  // Material summary
  summary: AggregatedMaterialSummary | null;
  isCalculating: boolean;
  calculationError: string | null;

  // Team-specific insights
  sharedMaterials: SharedMaterial[];
  bossOptimizations: BossOptimization[];
  domainEfficiencies: DomainEfficiency[];

  // Aggregate stats
  aggregateStats: {
    totalMora: number;
    totalExp: number;
    totalResin: number;
    estimatedDays: number;
    sharedMaterialCount: number;
    bossesNeeded: number;
  };
}

// Material to boss mapping (simplified)
const BOSS_MATERIALS: Record<string, string> = {
  'Dvalin': 'Dvalin',
  'Andrius': 'Andrius',
  'Childe': 'Childe',
  'Azhdaha': 'Azhdaha',
  'Signora': 'Signora',
  'Raiden Shogun': 'Raiden Shogun',
  'Scaramouche': 'Scaramouche',
  'Guardian of Apep': 'Apep',
  'All-Devouring Narwhal': 'Narwhal',
};

// Talent book domains by day
const TALENT_DOMAIN_DAYS: Record<string, string[]> = {
  'Freedom': ['Monday', 'Thursday', 'Sunday'],
  'Resistance': ['Tuesday', 'Friday', 'Sunday'],
  'Ballad': ['Wednesday', 'Saturday', 'Sunday'],
  'Prosperity': ['Monday', 'Thursday', 'Sunday'],
  'Diligence': ['Tuesday', 'Friday', 'Sunday'],
  'Gold': ['Wednesday', 'Saturday', 'Sunday'],
  'Transience': ['Monday', 'Thursday', 'Sunday'],
  'Elegance': ['Tuesday', 'Friday', 'Sunday'],
  'Light': ['Wednesday', 'Saturday', 'Sunday'],
  'Admonition': ['Monday', 'Thursday', 'Sunday'],
  'Ingenuity': ['Tuesday', 'Friday', 'Sunday'],
  'Praxis': ['Wednesday', 'Saturday', 'Sunday'],
  'Equity': ['Monday', 'Thursday', 'Sunday'],
  'Justice': ['Tuesday', 'Friday', 'Sunday'],
  'Order': ['Wednesday', 'Saturday', 'Sunday'],
  'Contention': ['Monday', 'Thursday', 'Sunday'],
  'Kindling': ['Tuesday', 'Friday', 'Sunday'],
  'Conflict': ['Wednesday', 'Saturday', 'Sunday'],
};

export function useTeamPlan({
  teamId,
  characters,
  inventory,
  goalType = 'full',
}: UseTeamPlanOptions): TeamPlanResult {
  const { teams, isLoading: loadingTeams } = useTeams();

  // Get the selected team
  const team = useMemo(
    () => teams.find((t) => t.id === teamId),
    [teams, teamId]
  );

  // Get team members from characters
  const teamMembers = useMemo(() => {
    if (!team) return [];
    return team.characterKeys
      .map((key) => characters.find((c) => c.key === key))
      .filter((c): c is Character => c !== undefined);
  }, [team, characters]);

  // Calculation state
  const [summary, setSummary] = useState<AggregatedMaterialSummary | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Calculate materials for team members
  useEffect(() => {
    if (teamMembers.length === 0) {
      setSummary(null);
      return;
    }

    let isCancelled = false;

    const calculate = async () => {
      setIsCalculating(true);
      setCalculationError(null);

      try {
        const goals = createGoalsFromCharacters(teamMembers, goalType);
        const result = await calculateMultiCharacterSummary(goals, inventory);
        if (!isCancelled) {
          setSummary(result);
        }
      } catch (error) {
        console.error('Team plan calculation error:', error);
        if (!isCancelled) {
          setCalculationError(
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      } finally {
        if (!isCancelled) {
          setIsCalculating(false);
        }
      }
    };

    void calculate();
    return () => {
      isCancelled = true;
    };
  }, [teamMembers, inventory, goalType]);

  // Calculate shared materials
  const sharedMaterials = useMemo((): SharedMaterial[] => {
    if (!summary?.aggregatedMaterials) return [];

    // Group materials by which characters need them
    const materialCharacterMap = new Map<string, Set<string>>();

    summary.characterSummaries.forEach((charSummary) => {
      charSummary.materials.forEach((mat) => {
        if (!materialCharacterMap.has(mat.key)) {
          materialCharacterMap.set(mat.key, new Set());
        }
        materialCharacterMap.get(mat.key)!.add(charSummary.characterKey);
      });
    });

    // Filter to materials needed by 2+ characters
    return summary.aggregatedMaterials
      .filter((mat) => {
        const chars = materialCharacterMap.get(mat.key);
        return chars && chars.size >= 2;
      })
      .map((mat) => ({
        key: mat.key,
        name: mat.name,
        category: mat.category,
        sharedBy: Array.from(materialCharacterMap.get(mat.key) || []),
        totalNeeded: mat.required,
        totalHave: mat.owned,
        deficit: mat.deficit,
      }))
      .sort((a, b) => b.sharedBy.length - a.sharedBy.length);
  }, [summary]);

  // Calculate boss optimizations
  const bossOptimizations = useMemo((): BossOptimization[] => {
    if (!summary?.groupedMaterials?.weekly) return [];

    const bossCharacterMap = new Map<string, { materials: Set<string>; characters: Set<string> }>();

    // Group weekly boss materials by boss
    summary.characterSummaries.forEach((charSummary) => {
      const weeklyMats = charSummary.materials.filter((m) => m.category === 'weekly');
      weeklyMats.forEach((mat) => {
        // Extract boss name from material key (simplified)
        const bossName = Object.entries(BOSS_MATERIALS).find(([key]) =>
          mat.key.toLowerCase().includes(key.toLowerCase())
        )?.[1] || 'Unknown Boss';

        if (!bossCharacterMap.has(bossName)) {
          bossCharacterMap.set(bossName, { materials: new Set(), characters: new Set() });
        }
        bossCharacterMap.get(bossName)!.materials.add(mat.key);
        bossCharacterMap.get(bossName)!.characters.add(charSummary.characterKey);
      });
    });

    return Array.from(bossCharacterMap.entries())
      .map(([bossName, data]) => ({
        bossName,
        materials: Array.from(data.materials),
        benefitsCharacters: Array.from(data.characters),
        priority:
          data.characters.size >= 3
            ? 'high'
            : data.characters.size >= 2
              ? 'medium'
              : 'low',
      }))
      .sort((a, b) => b.benefitsCharacters.length - a.benefitsCharacters.length) as BossOptimization[];
  }, [summary]);

  // Calculate domain efficiencies
  const domainEfficiencies = useMemo((): DomainEfficiency[] => {
    if (!summary?.groupedMaterials?.talent) return [];

    const domainCharacterMap = new Map<string, { materials: Set<string>; characters: Set<string> }>();

    // Group talent materials by domain
    summary.characterSummaries.forEach((charSummary) => {
      const talentMats = charSummary.materials.filter((m) => m.category === 'talent');
      talentMats.forEach((mat) => {
        // Extract domain type from material key
        const domainType = Object.keys(TALENT_DOMAIN_DAYS).find((domain) =>
          mat.key.toLowerCase().includes(domain.toLowerCase())
        );

        if (domainType) {
          if (!domainCharacterMap.has(domainType)) {
            domainCharacterMap.set(domainType, { materials: new Set(), characters: new Set() });
          }
          domainCharacterMap.get(domainType)!.materials.add(mat.key);
          domainCharacterMap.get(domainType)!.characters.add(charSummary.characterKey);
        }
      });
    });

    return Array.from(domainCharacterMap.entries())
      .map(([domainName, data]) => ({
        domainName: `${domainName} Domain`,
        materials: Array.from(data.materials),
        benefitsCharacters: Array.from(data.characters),
        daysAvailable: TALENT_DOMAIN_DAYS[domainName] || [],
        efficiency: data.characters.size / teamMembers.length,
      }))
      .sort((a, b) => b.efficiency - a.efficiency);
  }, [summary, teamMembers.length]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    if (!summary) {
      return {
        totalMora: 0,
        totalExp: 0,
        totalResin: 0,
        estimatedDays: 0,
        sharedMaterialCount: sharedMaterials.length,
        bossesNeeded: bossOptimizations.length,
      };
    }

    return {
      totalMora: summary.totalMora,
      totalExp: summary.totalExp,
      totalResin: summary.totalEstimatedResin,
      estimatedDays: summary.totalEstimatedDays,
      sharedMaterialCount: sharedMaterials.length,
      bossesNeeded: bossOptimizations.length,
    };
  }, [summary, sharedMaterials.length, bossOptimizations.length]);

  return {
    team,
    teamMembers,
    isLoading: loadingTeams,
    summary,
    isCalculating,
    calculationError,
    sharedMaterials,
    bossOptimizations,
    domainEfficiencies,
    aggregateStats,
  };
}
