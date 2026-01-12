import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const variantClasses = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
};

export default function Skeleton({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const animationClass = animation === 'pulse' ? 'animate-pulse' : animation === 'wave' ? 'animate-shimmer' : '';

  return (
    <div
      className={`bg-slate-700 ${variantClasses[variant]} ${animationClass} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

/** Card skeleton matching the Card component layout */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-lg p-4 ${className}`}>
      <Skeleton variant="text" height={20} width="60%" className="mb-3" />
      <Skeleton variant="text" height={16} width="80%" className="mb-2" />
      <Skeleton variant="text" height={16} width="40%" />
    </div>
  );
}

/** Character card skeleton matching CharacterCard layout */
export function CharacterCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton variant="text" height={20} width="70%" className="mb-2" />
          <Skeleton variant="text" height={14} width="40%" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Skeleton variant="rectangular" height={32} />
        <Skeleton variant="rectangular" height={32} />
        <Skeleton variant="rectangular" height={32} />
      </div>
    </div>
  );
}

/** Stat card skeleton for dashboard */
export function StatCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <Skeleton variant="text" height={14} width="50%" className="mb-2" />
      <Skeleton variant="text" height={32} width="40%" className="mb-1" />
      <Skeleton variant="text" height={12} width="60%" />
    </div>
  );
}

/** Team card skeleton */
export function TeamCardSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <Skeleton variant="text" height={20} width="50%" className="mb-3" />
      <div className="flex gap-2">
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
    </div>
  );
}

/** Table row skeleton */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-800">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" height={16} className="flex-1" />
      ))}
    </div>
  );
}

/** Page loading skeleton with multiple cards */
export function PageLoadingSkeleton({
  cards = 8,
  columns = 4,
}: {
  cards?: number;
  columns?: number;
}) {
  const gridClass =
    columns === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {Array.from({ length: cards }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
