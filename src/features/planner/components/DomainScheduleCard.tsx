import { Calendar } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { DOMAIN_SCHEDULE, TALENT_BOOK_REGIONS } from '../domain/materialConstants';

/**
 * Get today's available talent materials based on day of week
 */
export function getTodaysMaterials(): { materials: string[]; dayName: string } {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const today = new Date();
  const dayName = days[today.getDay()] ?? 'Sunday';

  const materials: string[] = [];
  for (const [material, availableDays] of Object.entries(DOMAIN_SCHEDULE)) {
    if (availableDays.includes(dayName)) {
      materials.push(material);
    }
  }

  return { materials, dayName };
}

export default function DomainScheduleCard() {
  const { materials: todayMaterials, dayName } = getTodaysMaterials();

  // Group today's materials by region
  const materialsByRegion: Record<string, string[]> = {};
  for (const [region, books] of Object.entries(TALENT_BOOK_REGIONS)) {
    const available = books.filter((book) => todayMaterials.includes(book));
    if (available.length > 0) {
      materialsByRegion[region] = available;
    }
  }

  const isSunday = dayName === 'Sunday';

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Today's Domains
        </h3>
        <div className="text-xs text-slate-400">{dayName}</div>
      </CardHeader>
      <CardContent>
        {isSunday ? (
          <div className="text-sm text-green-400 mb-3">All materials available!</div>
        ) : (
          <div className="space-y-3">
            {Object.entries(materialsByRegion).map(([region, books]) => (
              <div key={region}>
                <div className="text-xs text-slate-500 mb-1">{region}</div>
                <div className="flex flex-wrap gap-1">
                  {books.map((book) => (
                    <Badge key={book} variant="default" className="text-xs">
                      {book}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full schedule reference */}
        <div className="mt-4 pt-3 border-t border-slate-700">
          <div className="text-xs text-slate-500 mb-2">Schedule</div>
          <div className="grid grid-cols-3 gap-1 text-xs">
            <div className="text-slate-400">Mon/Thu</div>
            <div className="text-slate-400">Tue/Fri</div>
            <div className="text-slate-400">Wed/Sat</div>
            <div className="text-slate-300">Freedom</div>
            <div className="text-slate-300">Resistance</div>
            <div className="text-slate-300">Ballad</div>
            <div className="text-slate-300">Prosperity</div>
            <div className="text-slate-300">Diligence</div>
            <div className="text-slate-300">Gold</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
