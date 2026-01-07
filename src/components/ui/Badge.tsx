import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline' | 'pyro' | 'hydro' | 'anemo' | 'electro' | 'dendro' | 'cryo' | 'geo';
}

export default function Badge({ className = '', variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-700 text-slate-200',
    primary: 'bg-primary-600 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-600 text-white',
    danger: 'bg-red-600 text-white',
    outline: 'bg-transparent border border-slate-600 text-slate-300',
    pyro: 'bg-pyro text-white',
    hydro: 'bg-hydro text-white',
    anemo: 'bg-anemo text-white',
    electro: 'bg-electro text-white',
    dendro: 'bg-dendro text-white',
    cryo: 'bg-cryo text-slate-900',
    geo: 'bg-geo text-slate-900',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
