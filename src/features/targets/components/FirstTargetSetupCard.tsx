import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle, Target } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import type { FirstTargetSetupState } from '../domain/firstTargetSetup';

interface FirstTargetSetupCardProps {
  setup: FirstTargetSetupState;
}

export default function FirstTargetSetupCard({ setup }: FirstTargetSetupCardProps) {
  return (
    <Card className="border-primary-900/50 bg-primary-950/20">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary-300" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-100">{setup.title}</h2>
          </div>
          <p className="text-sm text-slate-300">{setup.detail}</p>
        </div>
        <Badge variant={setup.activeStep === 'review-plan' ? 'success' : 'primary'} className="w-fit">
          {setup.statusLabel}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="grid grid-cols-1 gap-2 md:grid-cols-4" aria-label="First target setup steps">
          {setup.steps.map((step) => {
            const StepIcon = step.isComplete ? CheckCircle2 : Circle;
            return (
              <li
                key={step.id}
                className={`rounded-lg border px-3 py-2 ${
                  step.isActive
                    ? 'border-primary-500 bg-primary-950/50'
                    : step.isComplete
                      ? 'border-emerald-900/70 bg-emerald-950/20'
                      : 'border-slate-700 bg-slate-950/60'
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <StepIcon
                    className={`h-4 w-4 ${
                      step.isComplete
                        ? 'text-emerald-300'
                        : step.isActive
                          ? 'text-primary-300'
                          : 'text-slate-500'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-slate-100">{step.label}</span>
                </div>
                <p className="text-xs text-slate-500">{step.detail}</p>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            to={setup.primaryAction.href}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            {setup.primaryAction.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div className="flex flex-wrap gap-2">
            {setup.secondaryActions.map((action) => (
              <Link
                key={action.href}
                to={action.href}
                className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
