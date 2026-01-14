import { Link } from 'react-router-dom';
import { Check, Circle, ArrowRight, Sparkles, X } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { OnboardingChecklist } from '@/hooks/useOnboarding';

interface GettingStartedChecklistProps {
  checklist: OnboardingChecklist;
  progress: number;
  total: number;
  onDismiss: () => void;
}

const CHECKLIST_ITEMS: Array<{
  key: keyof OnboardingChecklist;
  title: string;
  description: string;
  link: string;
  linkLabel: string;
}> = [
  {
    key: 'hasImportedCharacters',
    title: 'Import your characters',
    description: 'Add your Genshin characters via Enka, Irminsul, or GOOD format.',
    link: '/roster',
    linkLabel: 'Go to Roster',
  },
  {
    key: 'hasCreatedTeam',
    title: 'Create a team',
    description: 'Build your first team composition for Spiral Abyss or other content.',
    link: '/teams',
    linkLabel: 'Go to Teams',
  },
  {
    key: 'hasVisitedPlanner',
    title: 'Plan your materials',
    description: 'See what materials you need to farm for your characters.',
    link: '/planner',
    linkLabel: 'Go to Planner',
  },
  {
    key: 'hasCheckedPulls',
    title: 'Check your pulls',
    description: 'Track your pity and budget your primogems for upcoming banners.',
    link: '/pulls',
    linkLabel: 'Go to Pulls',
  },
];

export default function GettingStartedChecklist({
  checklist,
  progress,
  total,
  onDismiss,
}: GettingStartedChecklistProps) {
  const isComplete = progress === total;

  if (isComplete) {
    return null;
  }

  return (
    <Card className="border-primary-900/50 bg-gradient-to-br from-slate-900 to-slate-900/50">
      <CardHeader className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Getting Started</h2>
            <p className="text-sm text-slate-400">
              {progress} of {total} tasks complete
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          aria-label="Dismiss getting started checklist"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-300"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>

        {/* Checklist items */}
        <div className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => {
            const isChecked = checklist[item.key];
            return (
              <div
                key={item.key}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  isChecked
                    ? 'bg-green-900/20 border border-green-900/30'
                    : 'bg-slate-800/50 border border-slate-700/50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isChecked
                      ? 'bg-green-500 text-white'
                      : 'border-2 border-slate-600 text-slate-600'
                  }`}
                >
                  {isChecked ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium ${
                      isChecked ? 'text-green-400 line-through' : 'text-slate-200'
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className={`text-sm ${isChecked ? 'text-slate-500' : 'text-slate-400'}`}>
                    {item.description}
                  </p>
                </div>
                {!isChecked && (
                  <Link
                    to={item.link}
                    className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 whitespace-nowrap"
                  >
                    {item.linkLabel}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
