import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '../../prisma/client.js';

export const nutritionAdvisorTool = tool({
  description: `Provide personalized nutrition advice, calculate caloric/macro needs, and suggest meals.
Call when: user asks about calories, macros, diet plans, meal ideas, pre/post workout nutrition, or any food-related question.
Do NOT call for greetings, thanks, or non-nutrition messages.`,

  parameters: z.object({
    userId: z.string().describe('The user ID'),
    query: z.string().describe('The nutrition question or topic'),
    mealType: z
      .string()
      .optional()
      .describe(
        'Specific meal type: breakfast, lunch, dinner, snack, pre_workout, post_workout. Omit when requesting a full day diet plan.'
      ),
  }),

  execute: async ({ userId, query, mealType }) => {
    const goal = await prisma.fitnessGoal.findUnique({ where: { userId } });

    if (!goal) {
      return {
        error: 'No fitness profile found.',
        message: 'Please complete your fitness profile so I can give personalized nutrition advice.',
      };
    }

    const tdee = calculateTDEE(goal);
    const targets = getMacros(goal, tdee);
    const restrictions = goal.dietaryRestrictions ?? [];

    return {
      profile: {
        weightKg: goal.weightKg,
        heightCm: goal.heightCm,
        age: goal.age,
        goal: goal.goal,
        trainingDays: goal.daysPerWeek,
      },
      calories: {
        maintenance: Math.round(tdee),
        target: Math.round(targets.calories),
        deficit_or_surplus:
          goal.goal === 'WEIGHT_LOSS'
            ? '-500 kcal (0.5 kg/week loss)'
            : goal.goal === 'MUSCLE_GAIN'
              ? '+300 kcal (lean bulk)'
              : 'maintenance',
      },
      macros: {
        protein: {
          grams: Math.round(targets.protein),
          calories: Math.round(targets.protein * 4),
          note: `${(targets.protein / goal.weightKg).toFixed(1)}g/kg bodyweight`,
        },
        carbohydrates: {
          grams: Math.round(targets.carbs),
          calories: Math.round(targets.carbs * 4),
        },
        fats: {
          grams: Math.round(targets.fats),
          calories: Math.round(targets.fats * 9),
        },
      },
      timing: getMealTiming(goal.goal),
      preWorkout: {
        timing: '1–2 hours before training',
        focus: 'Moderate carbs + lean protein, low fat and fiber',
        examples: getPreWorkoutMeals(restrictions),
      },
      postWorkout: {
        timing: 'Within 30–60 minutes after training',
        focus: 'Fast-digesting protein + carbohydrates',
        examples: getPostWorkoutMeals(restrictions),
      },
      mealSuggestions: mealType ? getMealSuggestions(mealType, restrictions) : null,
      hydration: `Minimum ${Math.round(goal.weightKg * 0.033)}L/day. Add 500–750ml per hour of exercise.`,
      queryContext: query,
    };
  },
});

// ── Calculation helpers ───────────────────────────────────────────────────────

function calculateTDEE({ weightKg, heightCm, age, daysPerWeek }) {
  // TODO: TDEE always uses the male Mifflin-St Jeor constant (+5).
  // Female formula uses -161 instead, producing ~166 kcal/day less.
  // Fix: add biologicalSex to FitnessGoal schema + onboarding form,
  // then use: const sexConstant = biologicalSex === 'FEMALE' ? -161 : 5;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const multipliers = { 1: 1.2, 2: 1.375, 3: 1.375, 4: 1.55, 5: 1.55, 6: 1.725, 7: 1.9 };
  return bmr * (multipliers[daysPerWeek] ?? 1.375);
}

function getMacros({ goal, weightKg }, tdee) {
  const calAdjust = {
    WEIGHT_LOSS: -500,
    MUSCLE_GAIN: 300,
    ENDURANCE: 100,
    GENERAL_FITNESS: 0,
    ATHLETIC_PERFORMANCE: 200,
  };
  const proteinPerKg = {
    WEIGHT_LOSS: 2.2,
    MUSCLE_GAIN: 2.0,
    ENDURANCE: 1.6,
    GENERAL_FITNESS: 1.8,
    ATHLETIC_PERFORMANCE: 2.0,
  };
  const calories = tdee + (calAdjust[goal] ?? 0);
  const protein = weightKg * (proteinPerKg[goal] ?? 1.8);
  const fats = (calories * 0.25) / 9;
  const carbs = (calories - protein * 4 - fats * 9) / 4;
  return { calories, protein, fats, carbs };
}

function getMealTiming(goal) {
  const timings = {
    MUSCLE_GAIN: 'Eat every 3–4 hours. Prioritize protein at every meal. Time carbs around workouts.',
    WEIGHT_LOSS: '3–4 meals/day. Larger meals earlier. Reduce starchy carbs in the evening.',
    ENDURANCE: 'Carb-load 24–48h before long sessions. Refuel with carbs + protein within 30min.',
    GENERAL_FITNESS: 'Eat 3–4 balanced meals daily. Do not skip breakfast.',
    ATHLETIC_PERFORMANCE: 'Carb periodization: high carb on training days, moderate on rest days.',
  };
  return timings[goal] ?? timings.GENERAL_FITNESS;
}

function getPreWorkoutMeals(restrictions) {
  if (restrictions.includes('vegan'))
    return ['Banana + rice cakes with almond butter', 'Oats with soy milk and dates', 'Whole grain toast with avocado'];
  if (restrictions.includes('vegetarian'))
    return ['Greek yogurt with banana', 'Oats with honey and berries', 'Rice cakes with peanut butter'];
  return ['Banana + rice cakes with peanut butter', 'Oats with protein powder', 'Chicken + rice (2h before)', 'Greek yogurt with berries'];
}

function getPostWorkoutMeals(restrictions) {
  if (restrictions.includes('vegan'))
    return ['Soy protein shake + banana', 'Edamame + brown rice', 'Tofu scramble + sweet potato'];
  if (restrictions.includes('vegetarian'))
    return ['Whey protein shake + banana', 'Cottage cheese + fruit', 'Greek yogurt + granola'];
  return ['Whey protein shake + banana', 'Grilled chicken + sweet potato', 'Low-fat chocolate milk', 'Tuna on rice cakes'];
}

function getMealSuggestions(mealType, restrictions) {
  const isVegan = restrictions.includes('vegan');
  const isVeg = restrictions.includes('vegetarian') || isVegan;

  const meals = {
    breakfast: isVegan
      ? ['Tofu scramble + whole grain toast + avocado', 'Overnight oats with almond milk + chia seeds + berries']
      : isVeg
        ? ['3-egg veggie omelette + sourdough', 'Greek yogurt parfait + granola + fruit']
        : ['Scrambled eggs + oats + banana', '3-egg omelette + smoked salmon + rye toast'],
    lunch: isVegan
      ? ['Lentil and quinoa bowl + roasted vegetables + tahini', 'Chickpea wrap + avocado + greens']
      : isVeg
        ? ['Quinoa bowl + tempeh + roasted veggies + hummus', 'Paneer stir-fry + brown rice + salad']
        : ['Chicken breast + rice + broccoli', 'Tuna salad wrap + Greek yogurt'],
    dinner: isVegan
      ? ['Black bean tacos + guacamole + salsa', 'Veggie curry + brown rice + naan']
      : isVeg
        ? ['Paneer tikka + brown rice + raita', 'Pasta primavera + parmesan']
        : ['Grilled salmon + quinoa + asparagus', 'Lean beef stir-fry + noodles + veggies'],
    snack: ['Rice cakes + nut butter', 'Protein shake', 'Apple + almonds', 'Cottage cheese + fruit'],
    pre_workout: getPreWorkoutMeals(restrictions),
    post_workout: getPostWorkoutMeals(restrictions),
  };

  return meals[mealType] ?? meals.snack;
}
