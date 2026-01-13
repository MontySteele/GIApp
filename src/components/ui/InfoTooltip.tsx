import { useState, useRef, useEffect, type ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  /** The tooltip content to display */
  content: ReactNode;
  /** Size of the help icon */
  size?: 'sm' | 'md';
  /** Additional className for the trigger button */
  className?: string;
  /** Position preference for the tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * InfoTooltip - A hoverable info icon that shows explanatory text
 *
 * Used to explain game mechanics like pity, 50/50, Capturing Radiance, etc.
 */
export default function InfoTooltip({
  content,
  size = 'sm',
  className = '',
  position = 'top',
}: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  // Adjust position if tooltip would overflow viewport
  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltip = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newPosition = position;

      if (position === 'top' && tooltip.top < 0) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && tooltip.bottom > viewportHeight) {
        newPosition = 'top';
      } else if (position === 'left' && tooltip.left < 0) {
        newPosition = 'right';
      } else if (position === 'right' && tooltip.right > viewportWidth) {
        newPosition = 'left';
      }

      if (newPosition !== actualPosition) {
        setActualPosition(newPosition);
      }
    }
  }, [isVisible, position, actualPosition]);

  const getPositionClasses = () => {
    switch (actualPosition) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
    }
  };

  const getArrowClasses = () => {
    switch (actualPosition) {
      case 'top':
        return 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 border-x-transparent border-b-transparent';
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 border-x-transparent border-t-transparent';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 border-y-transparent border-r-transparent';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 border-y-transparent border-l-transparent';
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={triggerRef}
        type="button"
        className={`text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-full ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label="More information"
      >
        <HelpCircle className={iconSize} />
      </button>

      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`absolute z-50 ${getPositionClasses()}`}
        >
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl px-3 py-2 text-sm text-slate-200 max-w-xs whitespace-normal">
            {content}
          </div>
          {/* Arrow */}
          <div className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`} />
        </div>
      )}
    </div>
  );
}

/**
 * Pre-defined tooltip content for common gacha mechanics
 */
export const GACHA_TOOLTIPS = {
  softPity: (
    <div className="space-y-1">
      <p className="font-medium text-primary-400">Soft Pity</p>
      <p>Starting at 74 pulls, 5-star rates increase significantly each pull until the hard pity at 90.</p>
    </div>
  ),

  hardPity: (
    <div className="space-y-1">
      <p className="font-medium text-primary-400">Hard Pity</p>
      <p>Guaranteed 5-star at 90 pulls for character/standard banners, 80 for weapon banner.</p>
    </div>
  ),

  fiftyFifty: (
    <div className="space-y-1">
      <p className="font-medium text-primary-400">50/50 System</p>
      <p>First 5-star has 50% chance to be featured. If you lose, the next 5-star is guaranteed to be featured.</p>
    </div>
  ),

  guaranteed: (
    <div className="space-y-1">
      <p className="font-medium text-green-400">Guaranteed</p>
      <p>Your next 5-star is guaranteed to be the featured character (you lost the 50/50 previously).</p>
    </div>
  ),

  capturingRadiance: (
    <div className="space-y-1">
      <p className="font-medium text-purple-400">Capturing Radiance</p>
      <p>When winning 50/50, there's a 55% chance to trigger Radiance for an extra featured character. After 2 consecutive losses, the 3rd 50/50 win is guaranteed to trigger.</p>
    </div>
  ),

  fatePoints: (
    <div className="space-y-1">
      <p className="font-medium text-blue-400">Epitomized Path</p>
      <p>Choose a featured weapon. Each off-path 5-star weapon gives 1 Fate Point. At 2 points, the next 5-star is guaranteed to be your chosen weapon.</p>
    </div>
  ),

  monteCarloSimulation: (
    <div className="space-y-1">
      <p className="font-medium text-primary-400">Monte Carlo Simulation</p>
      <p>Probabilities are calculated by simulating millions of pull sequences to determine realistic success rates.</p>
    </div>
  ),

  fourStarPity: (
    <div className="space-y-1">
      <p className="font-medium text-purple-400">4-Star Pity</p>
      <p>Guaranteed 4-star or higher every 10 pulls. Pulls reset when you get any 4-star or 5-star.</p>
    </div>
  ),
} as const;
