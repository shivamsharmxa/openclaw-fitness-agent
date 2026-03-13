'use client';
import { useState } from 'react';
import { workoutApi } from '../../lib/api';
import { getErrorMessage } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

export function LogWorkoutForm({ planId, onSuccess }) {
  const [form, setForm] = useState({
    durationMin: '',
    perceivedRPE: '',
    mood: '',
    notes: '',
    caloriesBurned: '',
  });
  const [exercises, setExercises] = useState([
    { name: '', sets: '', reps: '', weight: '' },
  ]);
  const [loading, setLoading] = useState(false);

  const update = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const updateExercise = (idx, field, val) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === idx ? { ...ex, [field]: val } : ex))
    );
  };

  const addExercise = () =>
    setExercises((prev) => [...prev, { name: '', sets: '', reps: '', weight: '' }]);

  const removeExercise = (idx) =>
    setExercises((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await workoutApi.logWorkout({
        planId: planId ?? undefined,
        durationMin: Number(form.durationMin),
        perceivedRPE: form.perceivedRPE ? Number(form.perceivedRPE) : undefined,
        mood: form.mood || undefined,
        notes: form.notes || undefined,
        caloriesBurned: form.caloriesBurned ? Number(form.caloriesBurned) : undefined,
        exercisesData: exercises.filter((ex) => ex.name),
      });
      toast.success('Workout logged successfully!');
      onSuccess?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Duration (min)"
          type="number"
          min="1"
          required
          value={form.durationMin}
          onChange={(e) => update('durationMin', e.target.value)}
          placeholder="45"
        />
        <Input
          label="RPE (1–10)"
          type="number"
          min="1"
          max="10"
          value={form.perceivedRPE}
          onChange={(e) => update('perceivedRPE', e.target.value)}
          placeholder="7"
        />
        <Input
          label="Mood"
          value={form.mood}
          onChange={(e) => update('mood', e.target.value)}
          placeholder="Great / Tired / Normal"
        />
        <Input
          label="Calories Burned"
          type="number"
          value={form.caloriesBurned}
          onChange={(e) => update('caloriesBurned', e.target.value)}
          placeholder="300"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Exercises</p>
          <button
            type="button"
            onClick={addExercise}
            className="text-xs text-brand-600 hover:text-brand-700"
          >
            + Add exercise
          </button>
        </div>
        <div className="space-y-2">
          {exercises.map((ex, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Exercise name"
                value={ex.name}
                onChange={(e) => updateExercise(idx, 'name', e.target.value)}
              />
              <input
                className="w-14 rounded-lg border border-gray-300 px-2 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Sets"
                type="number"
                value={ex.sets}
                onChange={(e) => updateExercise(idx, 'sets', e.target.value)}
              />
              <input
                className="w-14 rounded-lg border border-gray-300 px-2 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Reps"
                value={ex.reps}
                onChange={(e) => updateExercise(idx, 'reps', e.target.value)}
              />
              <input
                className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="kg"
                type="number"
                value={ex.weight}
                onChange={(e) => updateExercise(idx, 'weight', e.target.value)}
              />
              {exercises.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExercise(idx)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <Input
        label="Notes (optional)"
        value={form.notes}
        onChange={(e) => update('notes', e.target.value)}
        placeholder="How did the session go?"
      />

      <Button type="submit" loading={loading} className="w-full">
        Log Workout
      </Button>
    </form>
  );
}
