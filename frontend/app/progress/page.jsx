'use client';
import { useEffect, useState } from 'react';
import { progressApi, workoutApi } from '../../lib/api';
import { WeightChart } from '../../components/progress/WeightChart';
import { WorkoutCalendar } from '../../components/progress/WorkoutCalendar';
import { StatCard } from '../../components/progress/StatCard';
import { LogWorkoutForm } from '../../components/workout/LogWorkoutForm';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { useRequireAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../lib/utils';
import toast from 'react-hot-toast';
import { Dumbbell, Clock, Zap, Scale, TrendingUp, CalendarDays, Plus, ChevronUp, Activity } from 'lucide-react';

export default function ProgressPage() {
  const { isAuthenticated } = useRequireAuth();
  const [summary, setSummary] = useState(null);
  const [weightData, setWeightData] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [showLogForm, setShowLogForm] = useState(false);

  // Weight log form
  const [weightInput, setWeightInput] = useState('');
  const [loggingWeight, setLoggingWeight] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [summaryRes, weightRes, logsRes] = await Promise.allSettled([
        progressApi.getSummary(days),
        progressApi.getMetrics('weight_kg', days),
        workoutApi.getLogs({ days }),
      ]);
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data.data);
      if (weightRes.status === 'fulfilled') setWeightData(weightRes.value.data.data);
      if (logsRes.status === 'fulfilled') setWorkoutLogs(logsRes.value.data.data.logs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) load();
  }, [days, isAuthenticated]);

  const logWeight = async () => {
    if (!weightInput) return;
    setLoggingWeight(true);
    try {
      await progressApi.logMetric({ metricType: 'weight_kg', value: Number(weightInput), unit: 'kg' });
      toast.success('Weight logged!');
      setWeightInput('');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoggingWeight(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
            <TrendingUp className="h-5 w-5 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                days === d ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Stats */}
          {summary && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Workouts" value={summary.workouts.total} sub={`last ${days} days`} icon={<Dumbbell className="h-5 w-5" />} />
              <StatCard label="Total Time" value={`${summary.workouts.totalMinutes}m`} sub="trained" color="blue" icon={<Clock className="h-5 w-5" />} />
              <StatCard label="Avg Effort" value={summary.workouts.avgRPE || '—'} sub="RPE score" color="purple" icon={<Zap className="h-5 w-5" />} />
              <StatCard
                label="Weight"
                value={summary.weight.current ? `${summary.weight.current}kg` : '—'}
                sub={summary.weight.change != null ? `${summary.weight.change > 0 ? '+' : ''}${summary.weight.change?.toFixed(1)}kg change` : 'no data'}
                color="orange"
                icon={<Scale className="h-5 w-5" />}
              />
            </div>
          )}

          {/* Weight tracking */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  Weight Trend
                </CardTitle>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="kg"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <Button size="sm" loading={loggingWeight} onClick={logWeight}>
                    Log
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <WeightChart data={weightData} />
            </CardContent>
          </Card>

          {/* Workout calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-500" />
                Workout Activity (Last 90 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorkoutCalendar logs={workoutLogs} />
            </CardContent>
          </Card>

          {/* Log workout */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-gray-500" />
                  Log a Workout
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowLogForm((v) => !v)}
                >
                  {showLogForm
                    ? <><ChevronUp className="mr-1 h-3.5 w-3.5" />Hide</>
                    : <><Plus className="mr-1 h-3.5 w-3.5" />Add</>
                  }
                </Button>
              </div>
            </CardHeader>
            {showLogForm && (
              <CardContent>
                <LogWorkoutForm onSuccess={() => { setShowLogForm(false); load(); }} />
              </CardContent>
            )}
          </Card>

          {/* Recent workout logs */}
          {workoutLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 p-0">
                {workoutLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(log.completedAt).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric',
                        })}
                      </p>
                      {log.notes && <p className="text-xs text-gray-500">{log.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{log.durationMin} min</p>
                      {log.perceivedRPE && (
                        <p className="text-xs text-gray-500">RPE {log.perceivedRPE}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
