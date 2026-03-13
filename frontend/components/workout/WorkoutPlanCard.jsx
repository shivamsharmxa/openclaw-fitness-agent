'use client';
import { cn, formatDate } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Dumbbell, Flame, CalendarDays, Zap } from 'lucide-react';

export function WorkoutPlanCard({ plan }) {
  if (!plan) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Dumbbell className="h-6 w-6 text-gray-400" />
          </div>
          <p className="font-medium text-gray-700">No active workout plan</p>
          <p className="mt-1 text-sm text-gray-400">
            Go to the chat and ask "Generate a workout plan for me"
          </p>
        </CardContent>
      </Card>
    );
  }

  const schedule = plan.planData?.weeklySchedule ?? {};
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySession = schedule[today];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{plan.name}</CardTitle>
          <Badge variant="green">Active</Badge>
        </div>
        <p className="mt-1 text-xs text-gray-500">Started {formatDate(plan.startDate)}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's workout highlight */}
        {todaySession && (
          <div className="rounded-lg bg-brand-50 border border-brand-200 p-3">
            <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-brand-600" />
              <p className="text-xs font-semibold text-brand-700">TODAY — {today}</p>
            </div>
            <p className="mt-0.5 font-medium text-brand-900">{todaySession.focus}</p>
            {todaySession.exercises?.length > 0 && (
              <p className="mt-1 text-sm text-brand-700">
                {todaySession.exercises.length} exercises
              </p>
            )}
          </div>
        )}

        {/* Weekly schedule */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <CalendarDays className="h-3.5 w-3.5" />
            Weekly Schedule
          </p>
          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
              const fullDay = {
                Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
                Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
              }[day];
              const session = schedule[fullDay];
              const isRest = !session || session.type === 'rest';
              const isToday = fullDay === today;

              return (
                <div
                  key={day}
                  className={cn(
                    'rounded-lg p-1.5 text-center',
                    isToday ? 'bg-brand-600 text-white' : isRest ? 'bg-gray-50' : 'bg-gray-100',
                    'transition'
                  )}
                >
                  <p className={cn('text-xs font-medium', isToday ? 'text-white' : 'text-gray-600')}>
                    {day}
                  </p>
                  <p className={cn('mt-0.5 text-xs', isToday ? 'text-brand-100' : isRest ? 'text-gray-400' : 'text-gray-700')}>
                    {isRest ? 'Rest' : session.focus?.split(' ')[0]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExerciseList({ exercises }) {
  if (!exercises?.length) return null;

  return (
    <div className="space-y-2">
      {exercises.map((ex, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm">{ex.name}</p>
            <p className="text-xs text-gray-500">{ex.musclesWorked}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-medium text-gray-900">
              {ex.sets} × {ex.reps}
            </p>
            <p className="text-xs text-gray-400">Rest {ex.rest}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
