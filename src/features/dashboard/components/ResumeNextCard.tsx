import { Link } from 'react-router-dom';
import { ArrowRight, Import, ListChecks, Play, Target } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import type { DashboardResumeAction } from '../domain/dashboardResume';

const ICONS = {
  target: Target,
  import: Import,
  manual: ListChecks,
  start: Play,
} satisfies Record<DashboardResumeAction['priority'], typeof Target>;

export default function ResumeNextCard({ action }: { action: DashboardResumeAction }) {
  const Icon = ICONS[action.priority];

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary-300" aria-hidden="true" />
          <h2 className="font-semibold text-slate-100">Resume</h2>
        </div>
        <Link to={action.href} className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300">
          {action.actionLabel}
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold text-slate-100">{action.title}</h3>
        <p className="mt-1 text-sm text-slate-400">{action.detail}</p>
      </CardContent>
    </Card>
  );
}
