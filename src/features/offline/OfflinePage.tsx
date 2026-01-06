export default function OfflinePage() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg max-w-2xl">
      <h1 className="text-3xl font-bold text-primary-300 mb-3">Offline mode</h1>
      <p className="text-slate-200 mb-3">
        You&apos;re offline right now. A cached version of the tracker is available so
        you can continue browsing your data.
      </p>
      <p className="text-slate-400">
        When your connection returns the app will sync automatically. If a page
        fails to load, try heading back to your last viewed tab or reloading once
        you&apos;re online again.
      </p>
    </div>
  );
}
