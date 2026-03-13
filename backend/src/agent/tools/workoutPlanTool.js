import { tool } from 'ai';
import { z } from 'zod';
import { WorkoutService } from '../../services/workoutService.js';
import { logger } from '../../config/logger.js';

export const workoutPlanTool = tool({
  description: `Generate a complete, structured weekly workout plan and save it for the user.
Call when: user asks for a workout plan, wants to know what exercises to do, requests a training schedule, or wants to start a new fitness program.
Do NOT call for casual messages or when only nutrition/progress info is needed.`,

  parameters: z.object({
    userId: z.string().describe('The user ID'),
    fitnessGoal: z
      .enum(['WEIGHT_LOSS', 'MUSCLE_GAIN', 'ENDURANCE', 'GENERAL_FITNESS', 'ATHLETIC_PERFORMANCE'])
      .describe('Primary fitness goal'),
    experienceLevel: z
      .enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
      .describe('Current training experience level'),
    availableEquipment: z
      .array(z.string())
      .describe('Equipment available e.g. ["barbell","dumbbells"] or ["bodyweight_only"]'),
    daysPerWeek: z
      .number()
      .min(1)
      .max(7)
      .describe('Number of training days per week'),
    sessionDurationMinutes: z
      .number()
      .min(15)
      .max(180)
      .optional()
      .describe('Target session length in minutes, defaults to 60'),
    planName: z.string().optional().describe('Custom name for the plan'),
  }),

  execute: async (params) => {
    logger.debug('workout_plan_generator called', { userId: params.userId });
    const plan = buildPlan(params);

    const saved = await WorkoutService.savePlan(params.userId, {
      name: params.planName ?? `${params.fitnessGoal.replace(/_/g, ' ')} Plan`,
      description: `AI-generated ${params.experienceLevel.toLowerCase()} ${params.fitnessGoal.toLowerCase()} plan`,
      planData: plan,
    });

    return { planId: saved.id, plan, saved: true };
  },
});

// ── Plan builder ─────────────────────────────────────────────────────────────

function buildPlan({ fitnessGoal, experienceLevel, availableEquipment, daysPerWeek, sessionDurationMinutes = 60 }) {
  const eq = {
    hasBarbell: availableEquipment.includes('barbell'),
    hasDumbbells: availableEquipment.includes('dumbbells') || availableEquipment.includes('barbell'),
    hasCable: availableEquipment.includes('cable_machine'),
    hasKettlebell: availableEquipment.includes('kettlebell'),
    isPureBodyweight: availableEquipment.includes('bodyweight_only') || availableEquipment.length === 0,
  };

  const split = chooseSplit(fitnessGoal, daysPerWeek);
  const schedule = buildSchedule(split, daysPerWeek, fitnessGoal, experienceLevel, eq);

  return {
    goal: fitnessGoal,
    experienceLevel,
    split,
    daysPerWeek,
    sessionDurationMinutes,
    weeklySchedule: schedule,
    progressionRule: progressionRules[experienceLevel],
    warmupProtocol: '5–10 min light cardio + dynamic stretching',
    cooldownProtocol: '5 min static stretching targeting worked muscles',
    notes: [
      'Log every workout to track progress',
      'Increase load only when you complete all reps with good form',
      'Stay hydrated: 500ml water before, 250ml every 15–20 min during',
      'Aim for 7–9 hours of sleep for optimal recovery',
    ],
  };
}

const progressionRules = {
  BEGINNER: 'Add weight each session you complete all reps cleanly. Focus on form above all.',
  INTERMEDIATE: 'Double progression: complete top of rep range for all sets before adding weight.',
  ADVANCED: 'Wave periodization: 3 weeks progressive overload → 1 week deload. Train by RPE 7–9.',
};

function chooseSplit(goal, days) {
  if (days <= 2) return 'full_body';
  if (days === 3) return goal === 'MUSCLE_GAIN' ? 'push_pull_legs' : 'full_body';
  if (days === 4) return 'upper_lower';
  return 'push_pull_legs';
}

function buildSchedule(split, days, goal, level, eq) {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const trainingDayMap = { 1:[0], 2:[0,3], 3:[0,2,4], 4:[0,1,3,4], 5:[0,1,2,4,5], 6:[0,1,2,3,4,5], 7:[0,1,2,3,4,5,6] };
  const trainingDays = trainingDayMap[days] ?? trainingDayMap[3];
  const schedule = {};

  dayNames.forEach((day, idx) => {
    if (!trainingDays.includes(idx)) {
      schedule[day] = { type: 'rest', focus: 'Rest & Recovery', exercises: [] };
      return;
    }
    const focus = getSplitFocus(split, trainingDays.indexOf(idx));
    schedule[day] = { type: 'training', focus, exercises: getExercisesForFocus(focus, goal, level, eq) };
  });

  return schedule;
}

function getSplitFocus(split, idx) {
  const splits = {
    full_body: () => 'Full Body',
    push_pull_legs: () => ['Push', 'Pull', 'Legs'][idx % 3],
    upper_lower: () => ['Upper Body', 'Lower Body'][idx % 2],
  };
  return (splits[split] ?? splits.full_body)();
}

function getExercisesForFocus(focus, goal, level, eq) {
  const isStrength = goal === 'MUSCLE_GAIN' || goal === 'ATHLETIC_PERFORMANCE';
  const sets = level === 'BEGINNER' ? 3 : 4;
  const mainReps = isStrength
    ? (level === 'BEGINNER' ? '8–12' : level === 'INTERMEDIATE' ? '6–10' : '4–8')
    : (level === 'BEGINNER' ? '12–15' : '12–20');
  const mainRest = isStrength ? '90–120s' : '60s';

  const db = {
    'Full Body': [
      ex('Squat', eq.hasBarbell ? 'Barbell Back Squat' : eq.hasDumbbells ? 'Goblet Squat' : 'Bodyweight Squat', sets, mainReps, mainRest, 'Quads, Glutes, Core'),
      ex('Hip Hinge', eq.hasBarbell ? 'Deadlift' : eq.hasDumbbells ? 'DB Romanian Deadlift' : 'Single-Leg Hip Hinge', sets, mainReps, mainRest, 'Hamstrings, Glutes, Back'),
      ex('Horizontal Push', eq.hasBarbell ? 'Bench Press' : eq.hasDumbbells ? 'Dumbbell Press' : 'Push-Up', sets, mainReps, '75s', 'Chest, Triceps, Shoulders'),
      ex('Horizontal Pull', eq.hasBarbell ? 'Barbell Row' : eq.hasDumbbells ? 'Dumbbell Row' : 'Inverted Row', sets, mainReps, '75s', 'Back, Biceps'),
      ex('Core', 'Plank Hold', 3, '30–60s', '45s', 'Core, Stability'),
    ],
    'Push': [
      ex('Chest Press', eq.hasBarbell ? 'Barbell Bench Press' : eq.hasDumbbells ? 'Dumbbell Bench Press' : 'Push-Up', sets, mainReps, mainRest, 'Chest, Anterior Deltoid, Triceps'),
      ex('Incline Press', eq.hasDumbbells ? 'Incline Dumbbell Press' : 'Incline Push-Up', 3, '8–12', '75s', 'Upper Chest'),
      ex('Overhead Press', eq.hasBarbell ? 'Barbell OHP' : eq.hasDumbbells ? 'Dumbbell Shoulder Press' : 'Pike Push-Up', sets, '8–12', '90s', 'Shoulders, Triceps'),
      ex('Lateral Raise', eq.hasDumbbells ? 'Dumbbell Lateral Raise' : 'Band Lateral Raise', 3, '12–20', '45s', 'Lateral Deltoid'),
      ex('Tricep Isolation', eq.hasDumbbells ? 'Overhead Tricep Extension' : 'Diamond Push-Up', 3, '10–15', '45s', 'Triceps'),
    ],
    'Pull': [
      ex('Vertical Pull', eq.isPureBodyweight ? 'Pull-Up (or Band-Assisted)' : eq.hasBarbell ? 'Weighted Pull-Up' : 'Lat Pulldown', sets, mainReps, mainRest, 'Lats, Biceps, Rear Delt'),
      ex('Horizontal Row', eq.hasBarbell ? 'Barbell Pendlay Row' : eq.hasDumbbells ? 'Dumbbell Row' : 'Inverted Row', sets, mainReps, '90s', 'Mid Back, Biceps'),
      ex('Rear Delt', eq.hasDumbbells ? 'Dumbbell Reverse Fly' : 'Band Face Pull', 3, '15–20', '45s', 'Rear Deltoid'),
      ex('Bicep Curl', eq.hasDumbbells ? 'Dumbbell Bicep Curl' : 'Band Bicep Curl', 3, '10–15', '45s', 'Biceps'),
      ex('Shrug', eq.hasBarbell ? 'Barbell Shrug' : eq.hasDumbbells ? 'Dumbbell Shrug' : 'Bodyweight Shrug', 3, '15–20', '30s', 'Traps'),
    ],
    'Legs': [
      ex('Squat', eq.hasBarbell ? 'Barbell Back Squat' : eq.hasDumbbells ? 'Goblet Squat' : 'Bodyweight Squat', sets, isStrength ? '5–8' : '10–15', '120s', 'Quads, Glutes'),
      ex('Hip Hinge', eq.hasBarbell ? 'Romanian Deadlift' : eq.hasDumbbells ? 'Dumbbell RDL' : 'Single-Leg RDL', sets, '8–12', '90s', 'Hamstrings, Glutes'),
      ex('Lunge', eq.hasDumbbells ? 'Dumbbell Reverse Lunge' : 'Bodyweight Reverse Lunge', 3, '10–12 each', '60s', 'Quads, Glutes'),
      ex('Calf Raise', eq.hasDumbbells ? 'Standing Calf Raise' : 'Bodyweight Calf Raise', 4, '15–20', '30s', 'Calves'),
      ex('Core', 'Hanging Leg Raise or Ab Wheel', 3, '10–15', '45s', 'Core'),
    ],
    'Upper Body': [
      ex('Chest Press', eq.hasBarbell ? 'Bench Press' : eq.hasDumbbells ? 'Dumbbell Press' : 'Push-Up', sets, mainReps, '90s', 'Chest'),
      ex('Row', eq.hasBarbell ? 'Barbell Row' : eq.hasDumbbells ? 'Dumbbell Row' : 'Inverted Row', sets, mainReps, '90s', 'Back'),
      ex('Overhead Press', eq.hasDumbbells ? 'Dumbbell OHP' : 'Pike Push-Up', 3, '8–12', '75s', 'Shoulders'),
      ex('Pull-Up / Pulldown', 'Pull-Up or Lat Pulldown', 3, '8–12', '75s', 'Lats'),
      ex('Arms', eq.hasDumbbells ? 'Curl + Tricep Extension' : 'Band Curl + Dip', 3, '10–12 each', '60s', 'Biceps & Triceps'),
    ],
    'Lower Body': [
      ex('Squat', eq.hasBarbell ? 'Back Squat' : eq.hasDumbbells ? 'Goblet Squat' : 'Jump Squat', sets, isStrength ? '5–6' : '8–15', '120s', 'Quads'),
      ex('Deadlift', eq.hasBarbell ? 'Conventional Deadlift' : eq.hasDumbbells ? 'DB Deadlift' : 'Single-Leg Deadlift', 3, '6–8', '120s', 'Posterior Chain'),
      ex('Accessory', 'Leg Press or Bulgarian Split Squat', 3, '10–15', '60s', 'Quads, Glutes'),
      ex('Hamstring', eq.hasDumbbells ? 'Nordic Curl or Leg Curl' : 'Glute-Ham Raise', 3, '10–15', '60s', 'Hamstrings'),
      ex('Calves + Core', 'Calf Raise + Plank', 3, '15 / 45s', '30s', 'Calves & Core'),
    ],
  };

  return db[focus] ?? db['Full Body'];
}

function ex(category, name, sets, reps, rest, muscles) {
  return { category, name, sets, reps, rest, musclesWorked: muscles };
}
