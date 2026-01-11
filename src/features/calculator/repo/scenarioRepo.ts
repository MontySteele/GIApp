import { db } from '@/db/schema';
import type { CalculatorScenario, CalculatorScenarioTarget } from '@/types';

export const scenarioRepo = {
  async getAll(): Promise<CalculatorScenario[]> {
    return db.calculatorScenarios.orderBy('updatedAt').reverse().toArray();
  },

  async getById(id: string): Promise<CalculatorScenario | undefined> {
    return db.calculatorScenarios.get(id);
  },

  async create(scenario: Omit<CalculatorScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await db.calculatorScenarios.add({
      ...scenario,
      id,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },

  async update(id: string, updates: Partial<Omit<CalculatorScenario, 'id' | 'createdAt'>>): Promise<void> {
    await db.calculatorScenarios.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.calculatorScenarios.delete(id);
  },

  async saveScenario(
    name: string,
    targets: CalculatorScenarioTarget[],
    availablePulls: number,
    iterations: number,
    resultProbability?: number
  ): Promise<string> {
    return this.create({
      name,
      targets,
      availablePulls,
      iterations,
      resultProbability,
    });
  },
};
