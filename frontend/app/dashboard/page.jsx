'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { workoutApi, progressApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { WorkoutPlanCard } from '../../components/workout/WorkoutPlanCard';
import { StatCard } from '../../components/progress/StatCard';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { Dumbbell, Clock, Zap, Scale, MessageCircle, CheckCircle, UserCircle, RefreshCw, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [plan, setPlan] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [planRes, summaryRes] = await Promise.allSettled([
          workoutApi.getCurrentPlan(),
          progressApi.getSummary(30),
        ]);
        if (planRes.status === 'fulfilled') setPlan(planRes.value.data.data);
        if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      await workoutApi.generatePlan();
      toast.success('New workout plan generated!');
      const res = await workoutApi.getCurrentPlan();
      setPlan(res.data.data);
    } catch {
      toast.error('Failed to generate plan. Make sure your fitness profile is set up.');
    } finally {
      setGenerating(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getTimeOfDay()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500">{today}</p>
        </div>
        <Link href="/chat">
          <Button size="sm">
            <MessageCircle className="mr-1.5 h-4 w-4" />
            Chat with Coach
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Stats row */}
          {summary && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard
                label="Workouts"
                value={summary.workouts.total}
                sub="last 30 days"
                color="brand"
                icon={<Dumbbell className="h-5 w-5" />}
              />
              <StatCard
                label="Total Time"
                value={`${summary.workouts.totalMinutes}m`}
                sub="total minutes"
                color="blue"
                icon={<Clock className="h-5 w-5" />}
              />
              <StatCard
                label="Avg RPE"
                value={summary.workouts.avgRPE || '—'}
                sub="effort score"
                color="purple"
                icon={<Zap className="h-5 w-5" />}
              />
              <StatCard
                label="Weight"
                value={summary.weight.current ? `${summary.weight.current}kg` : '—'}
                sub={summary.weight.change != null ? `${summary.weight.change > 0 ? '+' : ''}${summary.weight.change?.toFixed(1)}kg` : 'not logged'}
                color="orange"
                icon={<Scale className="h-5 w-5" />}
              />
            </div>
          )}

          {/* Workout plan */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Current Workout Plan</h2>
              <Button
                variant="outline"
                size="sm"
                loading={generating}
                onClick={handleGeneratePlan}
              >
                {plan
                  ? <><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Regenerate</>
                  : <><Sparkles className="mr-1.5 h-3.5 w-3.5" />Generate Plan</>
                }
              </Button>
            </div>
            <WorkoutPlanCard plan={plan} />
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="mb-3 font-semibold text-gray-900">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { href: '/chat', label: 'Ask AI Coach', Icon: MessageCircle, desc: 'Get advice', color: 'text-brand-600 bg-brand-50' },
                { href: '/progress', label: 'Log Weight', Icon: Scale, desc: 'Track metrics', color: 'text-orange-600 bg-orange-50' },
                { href: '/progress', label: 'Log Workout', Icon: CheckCircle, desc: 'Record session', color: 'text-green-600 bg-green-50' },
                { href: '/settings', label: 'Update Profile', Icon: UserCircle, desc: 'Edit goals', color: 'text-purple-600 bg-purple-50' },
              ].map(({ href, label, Icon, desc, color }) => (
                <Link
                  key={label}
                  href={href}
                  className="rounded-xl border border-gray-200 bg-white p-4 text-center transition hover:border-brand-300 hover:shadow-sm"
                >
                  <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
