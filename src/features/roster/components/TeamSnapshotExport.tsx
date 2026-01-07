import { useMemo, useState } from 'react';
import { CheckCircle, Copy, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTeams } from '../hooks/useTeams';
import { toTeamSnapshot } from '@/mappers/teamSnapshot';

interface TeamSnapshotExportProps {
  onClose: () => void;
}

export default function TeamSnapshotExport({ onClose }: TeamSnapshotExportProps) {
  const { teams } = useTeams();
  const [copied, setCopied] = useState(false);

  const snapshot = toTeamSnapshot(teams);
  const jsonText = useMemo(() => JSON.stringify(snapshot, null, 2), [snapshot]);

  const uniqueCharacters = useMemo(() => {
    const keys = new Set<string>();
    teams.forEach((team) => team.characterKeys.forEach((key) => keys.add(key)));
    return keys;
  }, [teams]);

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `genshin-team-snapshot-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy team snapshot', error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-slate-400 mb-4">
          Export a lightweight snapshot of your teams. This stub follows the same UX pattern as GOOD exports
          and will be used for future sync flows.
        </p>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4">
          <div className="text-sm text-slate-300 mb-2">Export includes:</div>
          <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
            <li>{teams.length} {teams.length === 1 ? 'team' : 'teams'}</li>
            <li>{uniqueCharacters.size} unique characters referenced</li>
            <li>Rotation notes and tags</li>
          </ul>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            JSON Output (Preview):
          </label>
          <div className="relative">
            <textarea
              className="w-full h-64 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs resize-none"
              value={jsonText}
              readOnly
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="absolute top-2 right-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button onClick={handleDownload}>
          <Download className="w-4 h-4" />
          Download JSON
        </Button>
      </div>
    </div>
  );
}
