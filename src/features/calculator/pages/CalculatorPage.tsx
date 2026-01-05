import { useState } from 'react';
import { Calculator as CalcIcon, Target, TrendingUp } from 'lucide-react';
import SingleTargetCalculator from '../components/SingleTargetCalculator';

type TabType = 'single' | 'multi' | 'reverse';

export default function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<TabType>('single');

  const tabs = [
    { id: 'single' as const, label: 'Single Target', icon: Target },
    { id: 'multi' as const, label: 'Multi-Target', icon: CalcIcon },
    { id: 'reverse' as const, label: 'Reverse Calculator', icon: TrendingUp },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Pull Calculator</h1>
        <p className="text-slate-400">
          Calculate probabilities and plan your wish strategy with precise mathematics
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'single' && <SingleTargetCalculator />}

      {activeTab === 'multi' && (
        <div className="text-center py-16">
          <p className="text-slate-400">Multi-target planner coming soon...</p>
        </div>
      )}

      {activeTab === 'reverse' && (
        <div className="text-center py-16">
          <p className="text-slate-400">Reverse calculator coming soon...</p>
        </div>
      )}
    </div>
  );
}
