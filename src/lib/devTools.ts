import { characterRepo } from '@/features/roster/repo/characterRepo';
import { sampleCharacters } from './testData';

// Development utilities - only use in dev mode
export async function seedSampleCharacters() {
  try {
    await characterRepo.bulkCreate(sampleCharacters);
    console.log('✅ Sample characters added successfully');
  } catch (error) {
    console.error('❌ Failed to seed sample characters:', error);
  }
}

export async function clearAllCharacters() {
  // We'll implement this when needed
  console.log('Clear all characters - not implemented yet');
}

declare global {
  interface Window {
    devTools?: {
      seedSampleCharacters: typeof seedSampleCharacters;
      clearAllCharacters: typeof clearAllCharacters;
    };
  }
}

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  window.devTools = {
    seedSampleCharacters,
    clearAllCharacters,
  };
  console.log('🛠️ Dev tools available: window.devTools.seedSampleCharacters()');
}
