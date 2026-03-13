'use client';
import { useMemo } from 'react';
import { cn } from '../../lib/utils';
import { format, eachDayOfInterval, subDays } from 'date-fns';

export function WorkoutCalendar({ logs }) {
  const today = new Date();
  const days = eachDayOfInterval({ start: subDays(today, 89), end: today });

  const logSet = useMemo(() => {
    const set = new Set();
    for (const log of logs ?? []) {
      set.add(format(new Date(log.completedAt), 'yyyy-MM-dd'));
    }
    return set;
  }, [logs]);

  const weeks = [];
  let week = [];
  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push(week);

  return (
    <div className="space-y-2">
      <div className="flex gap-1 flex-wrap">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const hasWorkout = logSet.has(key);
          const isToday = key === format(today, 'yyyy-MM-dd');
          return (
            <div
              key={key}
              title={`${format(day, 'MMM d')}${hasWorkout ? ' — workout logged' : ''}`}
              className={cn(
                'h-3 w-3 rounded-sm transition',
                hasWorkout
                  ? 'bg-brand-500'
                  : 'bg-gray-100',
                isToday && 'ring-1 ring-brand-600 ring-offset-1'
              )}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="h-3 w-3 rounded-sm bg-gray-100 inline-block" /> No workout
        <span className="h-3 w-3 rounded-sm bg-brand-500 inline-block ml-2" /> Workout logged
      </div>
    </div>
  );
}
