/**
 * Available Pulls Selector
 *
 * Re-exports the shared resource service for backwards compatibility.
 * This file is deprecated - use @/lib/services/resourceService directly.
 */

export {
  getAvailablePullsFromTracker,
  type AvailablePullsResult,
} from '@/lib/services/resourceService';
