import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';

export function StatCard({ label, value, sub, icon, trend, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value ?? '—'}</p>
          {sub && <p className="mt-0.5 text-sm text-gray-500">{sub}</p>}
          {trend != null && (
            <p className={cn('mt-1 text-xs font-medium', trend < 0 ? 'text-red-600' : 'text-green-600')}>
              {trend > 0 ? '+' : ''}{trend} from last period
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('rounded-lg p-2.5', colors[color])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
