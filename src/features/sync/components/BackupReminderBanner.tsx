import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppMetaStatus } from '../hooks/useAppMetaStatus';
import { parseDateString, resolveBackupCadenceDays } from '../services/appMetaService';
import { useUIStore } from '@/stores/uiStore';

function formatDateTime(dateString?: string) {
  const parsed = parseDateString(dateString);
  if (!parsed) return 'not recorded yet';

  return parsed.toLocaleString();
}

export default function BackupReminderBanner() {
  const { settings } = useUIStore();
  const cadenceDays = resolveBackupCadenceDays(settings.backupReminderCadenceDays);
  const { status, isLoading } = useAppMetaStatus();

  if (isLoading || !status.needsBackup) {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/40 text-amber-100 rounded-lg px-4 py-3 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-1 text-amber-300 flex-shrink-0" />
        <div>
          <p className="font-semibold text-amber-50">Backup recommended</p>
          <p className="text-sm text-amber-100/90">
            Your last backup is {formatDateTime(status.lastBackupAt ?? status.createdAt)}. We recommend saving your data every{' '}
            {cadenceDays} day{cadenceDays === 1 ? '' : 's'} to keep your progress safe.
          </p>
        </div>
      </div>
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-slate-800 border border-amber-500/40 rounded-lg text-amber-100 hover:bg-slate-700 transition-colors"
      >
        Open Settings
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
