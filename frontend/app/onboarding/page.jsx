'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { userApi } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useRequireAuth } from '../../hooks/useAuth';
import { getErrorMessage, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const STEPS = ['Personal Info', 'Fitness Goal', 'Equipment', 'Schedule'];

const EQUIPMENT_OPTIONS = [
  { id: 'barbell', label: 'Barbell & Rack' },
  { id: 'dumbbells', label: 'Dumbbells' },
  { id: 'cable_machine', label: 'Cable Machine' },
  { id: 'pull_up_bar', label: 'Pull-up Bar' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'resistance_bands', label: 'Resistance Bands' },
  { id: 'bodyweight_only', label: 'Bodyweight Only' },
];

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten_free', label: 'Gluten Free' },
  { id: 'dairy_free', label: 'Dairy Free' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
];

export default function OnboardingPage() {
  const { isAuthenticated } = useRequireAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    age: '',
    weightKg: '',
    heightCm: '',
    goal: 'GENERAL_FITNESS',
    experienceLevel: 'BEGINNER',
    equipment: [],
    daysPerWeek: '3',
    sessionMinutes: '60',
    dietaryRestrictions: [],
    healthConditions: '',
    notes: '',
  });

  const update = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const toggleEquipment = (id) => {
    setForm((f) => ({
      ...f,
      equipment: f.equipment.includes(id)
        ? f.equipment.filter((e) => e !== id)
        : [...f.equipment, id],
    }));
  };

  const toggleDietary = (id) => {
    setForm((f) => ({
      ...f,
      dietaryRestrictions: f.dietaryRestrictions.includes(id)
        ? f.dietaryRestrictions.filter((d) => d !== id)
        : [...f.dietaryRestrictions, id],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await userApi.setFitnessGoal({
        age: Number(form.age),
        weightKg: Number(form.weightKg),
        heightCm: Number(form.heightCm),
        goal: form.goal,
        experienceLevel: form.experienceLevel,
        equipment: form.equipment,
        daysPerWeek: Number(form.daysPerWeek),
        sessionMinutes: Number(form.sessionMinutes),
        dietaryRestrictions: form.dietaryRestrictions,
        healthConditions: form.healthConditions
          ? form.healthConditions.split(',').map((s) => s.trim())
          : [],
        notes: form.notes || undefined,
      });
      toast.success('Profile saved! Redirecting to your dashboard...');
      router.push('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Set up your profile</h1>
          <p className="mt-1 text-gray-600 text-sm">
            This helps your AI coach give you personalized recommendations
          </p>
        </div>

        {/* Step indicators */}
        <div className="mb-8 flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-colors',
                  i <= step ? 'bg-brand-600' : 'bg-gray-200'
                )}
              />
              <p className={cn('mt-1 text-xs text-center', i === step ? 'text-brand-600 font-medium' : 'text-gray-400')}>
                {s}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
          {/* Step 0: Personal Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">Tell us about yourself</h2>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Age" type="number" min="10" max="100" value={form.age} onChange={(e) => update('age', e.target.value)} placeholder="25" />
                <Input label="Weight (kg)" type="number" min="20" max="500" step="0.1" value={form.weightKg} onChange={(e) => update('weightKg', e.target.value)} placeholder="70" />
                <Input label="Height (cm)" type="number" min="100" max="250" value={form.heightCm} onChange={(e) => update('heightCm', e.target.value)} placeholder="175" />
              </div>
              {form.weightKg && form.heightCm && (
                <p className="text-sm text-gray-500">
                  BMI: {(Number(form.weightKg) / Math.pow(Number(form.heightCm) / 100, 2)).toFixed(1)}
                </p>
              )}
            </div>
          )}

          {/* Step 1: Goal */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">What's your main goal?</h2>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'WEIGHT_LOSS', label: 'Lose Weight', icon: '🔥' },
                  { value: 'MUSCLE_GAIN', label: 'Build Muscle', icon: '💪' },
                  { value: 'ENDURANCE', label: 'Improve Endurance', icon: '🏃' },
                  { value: 'GENERAL_FITNESS', label: 'General Fitness', icon: '⚡' },
                  { value: 'ATHLETIC_PERFORMANCE', label: 'Athletic Performance', icon: '🏆' },
                ].map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => update('goal', g.value)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 text-left transition',
                      form.goal === g.value
                        ? 'border-brand-500 bg-brand-50 text-brand-900'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <span className="text-xl">{g.icon}</span>
                    <span className="font-medium text-sm">{g.label}</span>
                  </button>
                ))}
              </div>
              <Select
                label="Experience Level"
                value={form.experienceLevel}
                onChange={(e) => update('experienceLevel', e.target.value)}
                options={[
                  { value: 'BEGINNER', label: 'Beginner (0–1 year)' },
                  { value: 'INTERMEDIATE', label: 'Intermediate (1–3 years)' },
                  { value: 'ADVANCED', label: 'Advanced (3+ years)' },
                ]}
              />
            </div>
          )}

          {/* Step 2: Equipment */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">What equipment do you have?</h2>
              <p className="text-sm text-gray-500">Select all that apply</p>
              <div className="grid grid-cols-2 gap-2">
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => toggleEquipment(eq.id)}
                    className={cn(
                      'rounded-lg border p-3 text-sm text-left transition',
                      form.equipment.includes(eq.id)
                        ? 'border-brand-500 bg-brand-50 text-brand-800 font-medium'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    )}
                  >
                    {eq.label}
                  </button>
                ))}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Dietary Restrictions (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDietary(d.id)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs transition',
                        form.dietaryRestrictions.includes(d.id)
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">Your workout schedule</h2>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Days per week"
                  value={form.daysPerWeek}
                  onChange={(e) => update('daysPerWeek', e.target.value)}
                  options={[1, 2, 3, 4, 5, 6, 7].map((n) => ({ value: String(n), label: `${n} day${n > 1 ? 's' : ''}` }))}
                />
                <Select
                  label="Session length"
                  value={form.sessionMinutes}
                  onChange={(e) => update('sessionMinutes', e.target.value)}
                  options={[
                    { value: '30', label: '30 min' },
                    { value: '45', label: '45 min' },
                    { value: '60', label: '60 min' },
                    { value: '75', label: '75 min' },
                    { value: '90', label: '90 min' },
                  ]}
                />
              </div>
              <Input
                label="Health conditions (optional)"
                value={form.healthConditions}
                onChange={(e) => update('healthConditions', e.target.value)}
                placeholder="e.g. lower back pain, knee injury (comma separated)"
              />
              <Input
                label="Additional notes (optional)"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Anything else your coach should know?"
              />
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <Button
                variant="secondary"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                className="flex-1"
                disabled={
                  (step === 0 && (!form.age || !form.weightKg || !form.heightCm)) ||
                  (step === 2 && form.equipment.length === 0)
                }
              >
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={loading} className="flex-1">
                Save & Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
