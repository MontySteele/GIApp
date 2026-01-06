import { Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 backdrop-blur">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Genshin Progress Tracker
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track your journey through Teyvat
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
