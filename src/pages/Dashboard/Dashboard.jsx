import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Camera,
  Plus,
  Utensils,
  Flame,
  ArrowRight,
  Store,
  ChevronDown,
  ChevronUp,
  Footprints,
  Activity,
  Edit3,
  Check
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { groupFoodEntriesByMeal } from '../../services/nutrition/nutritionService';
import { formatDurationClock } from '../../services/nutrition/stepTrackerService';
import {
  getGreeting,
  formatReadableDate,
  formatTime12h,
  timeToMinutes,
  getCurrentMinutesInZone
} from '../../utils/dateUtils';

export default function Dashboard({ onOpenFoodModal, onOpenOutsideFoodModal }) {
  const {
    settings,
    updateSettings,
    todayDateKey,
    todayRecord,
    todayNutrition,
    todayWalkingMetrics,
    todayHabitsSummary,
    updateHabitStatus,
    addOrUpdateRoutine,
    setActiveTab
  } = useApp();

  const [quickHabitOpen, setQuickHabitOpen] = useState(false);
  const [quickHabitName, setQuickHabitName] = useState('');
  const [quickHabitTime, setQuickHabitTime] = useState('09:00');
  const [quickHabitCategory, setQuickHabitCategory] = useState('Health');
  const [expandedDashMeals, setExpandedDashMeals] = useState({});

  const [editingWeight, setEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState(
    String(settings.nutritionGoals?.weightKg || 70)
  );
  const [editingHabitMacroId, setEditingHabitMacroId] = useState(null);
  const [habitMacroDraft, setHabitMacroDraft] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  const toggleDashMeal = (id) => {
    setExpandedDashMeals((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openHabitMacroEditor = (habit) => {
    setEditingHabitMacroId(habit.id);
    setHabitMacroDraft({
      calories: Number(habit.calories) || 0,
      protein: Number(habit.protein) || 0,
      carbs: Number(habit.carbs) || 0,
      fat: Number(habit.fat) || 0
    });
  };

  const handleSaveHabitMacros = async (habit) => {
    await addOrUpdateRoutine({
      ...habit,
      calories: Math.max(0, Math.round(Number(habitMacroDraft.calories) || 0)),
      protein: Math.max(0, Math.round((Number(habitMacroDraft.protein) || 0) * 10) / 10),
      carbs: Math.max(0, Math.round((Number(habitMacroDraft.carbs) || 0) * 10) / 10),
      fat: Math.max(0, Math.round((Number(habitMacroDraft.fat) || 0) * 10) / 10)
    });
    setEditingHabitMacroId(null);
  };

  const handleSaveWeight = (e) => {
    e.preventDefault();
    const num = Math.max(30, Math.min(250, Number(weightInput) || 70));
    updateSettings({
      nutritionGoals: {
        ...settings.nutritionGoals,
        weightKg: num
      }
    });
    setWeightInput(String(num));
    setEditingWeight(false);
  };

  const greeting = getGreeting(settings.timezone);
  const currentMins = getCurrentMinutesInZone(settings.timezone);

  const pendingHabitsSorted = [...todayHabitsSummary.items]
    .filter((h) => h.status === 'pending')
    .sort((a, b) => timeToMinutes(a.scheduledTime) - timeToMinutes(b.scheduledTime));

  const nextUpcomingRoutine =
    pendingHabitsSorted.find((h) => timeToMinutes(h.scheduledTime) >= currentMins) ||
    pendingHabitsSorted[0] ||
    null;

  const handleQuickAddHabit = async (e) => {
    e.preventDefault();
    if (!quickHabitName.trim()) return;
    await addOrUpdateRoutine({
      name: quickHabitName.trim(),
      scheduledTime: quickHabitTime,
      category: quickHabitCategory,
      reminderEnabled: true,
      followUpEnabled: true,
      followUpMinutes: settings.followUpMinutes || 15,
      repeatSchedule: 'daily',
      active: true
    });
    setQuickHabitName('');
    setQuickHabitOpen(false);
  };

  const todayFoods = groupFoodEntriesByMeal(todayRecord?.foodEntries || []);
  const calorieGoal = settings.nutritionGoals?.calories || 2000;
  const proteinGoal = settings.nutritionGoals?.protein || 75;
  const stepGoal = settings.nutritionGoals?.dailyStepGoal || 6000;
  const currentWeightKg = settings.nutritionGoals?.weightKg || 70;
  const caloriePct = Math.min(100, Math.round((todayNutrition.totalCalories / calorieGoal) * 100));
  const stepPct = Math.min(100, Math.round((todayWalkingMetrics.steps / stepGoal) * 100));

  return (
    <div className="space-y-4">
      <div className="bg-crown-card border border-crown-border rounded-2xl p-4 sm:p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-crown-muted">
              {formatReadableDate(todayDateKey)}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-crown-text mt-0.5 tracking-tight">
              {greeting}
            </h1>
            <p className="text-xs text-crown-muted mt-0.5">
              Track your daily habits, nutrition, and active calorie burn.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-crown-blue text-white text-xs font-semibold shadow-2xs hover:opacity-95 transition-opacity whitespace-nowrap"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Scan Food</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickHabitOpen((prev) => !prev)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-crown-input text-crown-navy border border-crown-border text-xs font-semibold hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-crown-blue shrink-0" />
              <span>Add Habit</span>
            </button>
          </div>
        </div>
      </div>

      {quickHabitOpen && (
        <form
          onSubmit={handleQuickAddHabit}
          className="bg-crown-card border border-crown-border rounded-2xl p-4 shadow-card space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-crown-navy">
              New Daily Habit
            </h2>
            <button
              type="button"
              onClick={() => setQuickHabitOpen(false)}
              className="text-xs font-semibold text-crown-muted hover:text-crown-text"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <input
              type="text"
              required
              value={quickHabitName}
              onChange={(e) => setQuickHabitName(e.target.value)}
              placeholder="Habit name (e.g., Morning stretching)"
              className="sm:col-span-2 px-3 py-2 rounded-xl bg-crown-input border border-crown-border text-xs text-crown-text focus:outline-none focus:border-crown-blue"
            />
            <input
              type="time"
              value={quickHabitTime}
              onChange={(e) => setQuickHabitTime(e.target.value)}
              className="px-3 py-2 rounded-xl bg-crown-input border border-crown-border text-xs text-crown-text focus:outline-none focus:border-crown-blue"
            />
            <select
              value={quickHabitCategory}
              onChange={(e) => setQuickHabitCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-crown-input border border-crown-border text-xs text-crown-text focus:outline-none focus:border-crown-blue"
            >
              <option value="Health">Health</option>
              <option value="Nutrition">Nutrition</option>
              <option value="Hydration">Hydration</option>
              <option value="Fitness">Fitness</option>
              <option value="Sleep">Sleep</option>
              <option value="Mindfulness">Mindfulness</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-crown-blue text-white text-xs font-semibold hover:opacity-95"
            >
              Save Habit
            </button>
          </div>
        </form>
      )}

      <div className="bg-crown-card border border-crown-border rounded-2xl p-4 sm:p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-crown-blue flex items-center justify-center shrink-0">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-extrabold text-crown-text">
                  Walk & Calorie Deficit Tracker
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-crown-teal border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-crown-teal animate-pulse" />
                  Auto Sensor Active
                </span>
              </div>
              <p className="text-xs text-crown-muted mt-0.5">
                Automatically records your steps in foreground & background using phone sensors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {editingWeight ? (
              <form onSubmit={handleSaveWeight} className="inline-flex items-center gap-1.5">
                <span className="text-xs font-semibold text-crown-muted">Weight:</span>
                <input
                  type="number"
                  min="30"
                  max="250"
                  step="0.5"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-16 px-2 py-1 rounded-lg bg-crown-input border border-crown-blue text-xs font-bold text-crown-text focus:outline-none"
                />
                <span className="text-xs text-crown-muted">kg</span>
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-crown-teal text-white hover:opacity-95"
                  title="Save Weight"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setWeightInput(String(currentWeightKg));
                  setEditingWeight(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-crown-input hover:bg-slate-100 border border-crown-border text-xs font-semibold text-crown-navy transition-colors"
              >
                <span>Body Weight: {currentWeightKg} kg</span>
                <Edit3 className="w-3.5 h-3.5 text-crown-blue" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-crown-input border border-crown-border">
            <div className="text-[11px] font-medium text-crown-muted">Steps Today</div>
            <div className="text-lg font-extrabold text-crown-text mt-0.5">
              {todayWalkingMetrics.steps.toLocaleString()}{' '}
              <span className="text-xs font-normal text-crown-muted">/ {stepGoal}</span>
            </div>
            <div className="w-full h-1.5 bg-white rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-crown-teal transition-all"
                style={{ width: `${stepPct}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-crown-input border border-crown-border">
            <div className="text-[11px] font-medium text-crown-muted">Distance & Walk Time</div>
            <div className="text-lg font-extrabold text-crown-text mt-0.5">
              {todayWalkingMetrics.distanceKm} km
            </div>
            <div className="text-[11px] text-crown-muted mt-0.5">
              Walked: {formatDurationClock(todayWalkingMetrics.activeSeconds)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="text-[11px] font-semibold text-crown-teal">Walk Calories Burned</div>
            <div className="text-lg font-extrabold text-crown-teal mt-0.5">
              {todayWalkingMetrics.caloriesBurned} kcal
            </div>
            <div className="text-[11px] text-crown-muted mt-0.5">
              Based on {currentWeightKg} kg weight
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
            <div className="text-[11px] font-semibold text-crown-navy flex items-center gap-1">
              <Activity className="w-3 h-3 text-crown-blue" />
              Net Calorie Balance
            </div>
            <div className="text-lg font-extrabold text-crown-navy mt-0.5">
              {todayWalkingMetrics.netCalories} kcal
            </div>
            <div className="text-[11px] font-semibold text-crown-blue mt-0.5">
              {todayWalkingMetrics.calorieDeficit >= 0
                ? `${todayWalkingMetrics.calorieDeficit} kcal deficit left`
                : `${Math.abs(todayWalkingMetrics.calorieDeficit)} kcal over goal`}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-crown-card border border-crown-border rounded-2xl p-4 sm:p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-crown-muted">
                Daily Routine Progress
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-crown-teal border border-emerald-200">
                {todayHabitsSummary.completed}/{todayHabitsSummary.total} Done
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-crown-text tracking-tight">
                {todayHabitsSummary.progressPercent}%
              </span>
              <span className="text-xs text-crown-muted">completed today</span>
            </div>

            <div className="w-full h-2 bg-crown-input rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-crown-teal transition-all duration-300 rounded-full"
                style={{ width: `${todayHabitsSummary.progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-2.5 rounded-xl bg-crown-input border border-crown-border text-center">
                <div className="text-base font-extrabold text-crown-teal leading-none">
                  {todayHabitsSummary.completed}
                </div>
                <div className="text-[11px] font-medium text-crown-muted mt-1">Completed</div>
              </div>
              <div className="p-2.5 rounded-xl bg-crown-input border border-crown-border text-center">
                <div className="text-base font-extrabold text-crown-blue leading-none">
                  {todayHabitsSummary.pending}
                </div>
                <div className="text-[11px] font-medium text-crown-muted mt-1">Pending</div>
              </div>
              <div className="p-2.5 rounded-xl bg-crown-input border border-crown-border text-center">
                <div className="text-base font-extrabold text-crown-warning leading-none">
                  {todayHabitsSummary.missed + todayHabitsSummary.skipped}
                </div>
                <div className="text-[11px] font-medium text-crown-muted mt-1">Skipped</div>
              </div>
            </div>
          </div>

          {nextUpcomingRoutine ? (
            <div className="mt-4 pt-3.5 border-t border-crown-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-crown-blue flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-crown-muted">
                    Next Up • {formatTime12h(nextUpcomingRoutine.scheduledTime)}
                  </div>
                  <div className="text-xs font-bold text-crown-text truncate">
                    {nextUpcomingRoutine.name}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateHabitStatus(nextUpcomingRoutine.id, 'completed')}
                className="px-3.5 py-1.5 rounded-xl bg-crown-teal text-white text-xs font-semibold hover:opacity-95 shrink-0"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="mt-4 pt-3.5 border-t border-crown-border text-xs font-semibold text-crown-teal flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              All scheduled habits completed for today!
            </div>
          )}
        </div>

        <div className="bg-crown-card border border-crown-border rounded-2xl p-4 sm:p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-crown-muted">
                Nutrition Summary
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('diary')}
                className="text-xs font-semibold text-crown-blue hover:underline inline-flex items-center gap-1"
              >
                <span>Food Diary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              <div>
                <span className="text-3xl font-extrabold text-crown-text tracking-tight">
                  {todayNutrition.totalCalories}
                </span>
                <span className="text-xs font-medium text-crown-muted ml-1">
                  / {calorieGoal} kcal
                </span>
              </div>
              <span className="text-xs font-bold text-crown-teal">
                {todayNutrition.totalProtein}g / {proteinGoal}g Protein
              </span>
            </div>

            <div className="w-full h-2 bg-crown-input rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-crown-blue transition-all duration-300 rounded-full"
                style={{ width: `${caloriePct}%` }}
              />
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="p-2 rounded-xl bg-crown-input border border-crown-border text-center">
                <div className="text-xs font-extrabold text-crown-text">
                  {todayNutrition.totalProtein}g
                </div>
                <div className="text-[10px] font-medium text-crown-muted mt-0.5">Protein</div>
              </div>
              <div className="p-2 rounded-xl bg-crown-input border border-crown-border text-center">
                <div className="text-xs font-extrabold text-crown-text">
                  {todayNutrition.totalCarbs}g
                </div>
                <div className="text-[10px] font-medium text-crown-muted mt-0.5">Carbs</div>
              </div>
              <div className="p-2 rounded-xl bg-crown-input border border-crown-border text-center">
                <div className="text-xs font-extrabold text-crown-text">
                  {todayNutrition.totalFat}g
                </div>
                <div className="text-[10px] font-medium text-crown-muted mt-0.5">Fat</div>
              </div>
              <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200 text-center">
                <div className="text-xs font-extrabold text-crown-navy">
                  {todayNutrition.outsideCalories}
                </div>
                <div className="text-[10px] font-medium text-crown-muted mt-0.5">Outside</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-crown-border grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenFoodModal}
              className="py-2 px-3 rounded-xl bg-crown-input hover:bg-slate-100 text-crown-text border border-crown-border text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Utensils className="w-3.5 h-3.5 text-crown-blue shrink-0" />
              <span>Log Meal</span>
            </button>
            <button
              type="button"
              onClick={onOpenOutsideFoodModal}
              className="py-2 px-3 rounded-xl bg-crown-navy hover:opacity-95 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span>Outside Food</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-crown-card border border-crown-border rounded-2xl p-4 sm:p-5 shadow-card">
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div>
              <h2 className="text-base font-bold text-crown-text">Today&apos;s Routine</h2>
              <p className="text-xs text-crown-muted">
                Tap any habit to mark completed
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('routine')}
              className="px-3 py-1.5 rounded-lg bg-crown-input hover:bg-slate-100 text-xs font-semibold text-crown-blue whitespace-nowrap shrink-0"
            >
              Edit Routine
            </button>
          </div>

          {todayHabitsSummary.items.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-crown-input border border-crown-border">
              <p className="text-xs text-crown-muted">No active habits scheduled for today.</p>
              <button
                type="button"
                onClick={() => setActiveTab('routine')}
                className="mt-2 px-3.5 py-1.5 rounded-lg bg-crown-blue text-white text-xs font-semibold"
              >
                Create Routine
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayHabitsSummary.items.map((habit) => {
                const isCompleted = habit.status === 'completed';
                const isSkipped = habit.status === 'skipped';
                const isMissed = habit.status === 'missed';

                return (
                  <div
                    key={habit.id}
                    className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                      isCompleted
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : isMissed
                        ? 'bg-red-50/40 border-red-200'
                        : isSkipped
                        ? 'bg-amber-50/30 border-amber-200'
                        : 'bg-white border-crown-border hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateHabitStatus(habit.id, isCompleted ? 'pending' : 'completed')
                        }
                        className="flex items-center gap-2.5 text-left min-w-0 flex-1"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-crown-teal shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 hover:text-crown-blue shrink-0" />
                        )}
                        <span
                          className={`text-sm font-bold truncate ${
                            isCompleted ? 'line-through text-crown-muted' : 'text-crown-text'
                          }`}
                        >
                          {habit.name}
                        </span>
                      </button>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-crown-input border border-crown-border text-[11px] font-semibold text-crown-navy whitespace-nowrap shrink-0">
                        <Clock className="w-3 h-3 text-crown-blue" />
                        {formatTime12h(habit.scheduledTime)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pl-7">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span className="text-xs font-medium text-crown-muted truncate">
                          {habit.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => openHabitMacroEditor(habit)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50/80 hover:bg-blue-100 border border-blue-200 text-[10px] font-semibold text-crown-navy"
                        >
                          {Number(habit.calories) > 0 ||
                          Number(habit.protein) > 0 ||
                          Number(habit.carbs) > 0 ? (
                            <>
                              <span className="font-bold text-crown-blue">
                                {Number(habit.calories) || 0} kcal
                              </span>
                              <span>• {Number(habit.protein) || 0}g P</span>
                              <span>• {Number(habit.carbs) || 0}g C</span>
                              <span className="text-crown-blue underline">✎</span>
                            </>
                          ) : (
                            <span className="text-crown-blue">+ Set kcal</span>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            updateHabitStatus(habit.id, isCompleted ? 'pending' : 'completed')
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                            isCompleted
                              ? 'bg-crown-teal text-white border-crown-teal'
                              : 'bg-emerald-50 text-crown-teal border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {isCompleted ? 'Completed' : 'Done'}
                        </button>
                        {!isCompleted && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                updateHabitStatus(habit.id, isSkipped ? 'pending' : 'skipped')
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                                isSkipped
                                  ? 'bg-amber-100 text-crown-warning border-amber-300'
                                  : 'bg-crown-input text-crown-muted border-crown-border hover:text-crown-text'
                              }`}
                            >
                              Skip
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateHabitStatus(habit.id, isMissed ? 'pending' : 'missed')
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                                isMissed
                                  ? 'bg-red-100 text-crown-error border-red-300'
                                  : 'bg-crown-input text-crown-muted border-crown-border hover:text-crown-error'
                              }`}
                            >
                              Missed
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {editingHabitMacroId === habit.id && (
                      <div className="ml-7 p-2.5 rounded-xl bg-crown-input border border-crown-border space-y-2">
                        <div className="grid grid-cols-4 gap-1.5">
                          <div>
                            <label className="block text-[10px] font-bold text-crown-muted mb-0.5">
                              Calories
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={habitMacroDraft.calories}
                              onChange={(e) =>
                                setHabitMacroDraft((p) => ({ ...p, calories: e.target.value }))
                              }
                              className="w-full px-2 py-1 rounded-md bg-white border border-crown-border text-xs font-bold text-crown-text focus:outline-none focus:border-crown-blue"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-crown-muted mb-0.5">
                              Protein(g)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={habitMacroDraft.protein}
                              onChange={(e) =>
                                setHabitMacroDraft((p) => ({ ...p, protein: e.target.value }))
                              }
                              className="w-full px-2 py-1 rounded-md bg-white border border-crown-border text-xs font-bold text-crown-text focus:outline-none focus:border-crown-blue"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-crown-muted mb-0.5">
                              Carbs(g)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={habitMacroDraft.carbs}
                              onChange={(e) =>
                                setHabitMacroDraft((p) => ({ ...p, carbs: e.target.value }))
                              }
                              className="w-full px-2 py-1 rounded-md bg-white border border-crown-border text-xs font-bold text-crown-text focus:outline-none focus:border-crown-blue"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-crown-muted mb-0.5">
                              Fat(g)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={habitMacroDraft.fat}
                              onChange={(e) =>
                                setHabitMacroDraft((p) => ({ ...p, fat: e.target.value }))
                              }
                              className="w-full px-2 py-1 rounded-md bg-white border border-crown-border text-xs font-bold text-crown-text focus:outline-none focus:border-crown-blue"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingHabitMacroId(null)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-crown-muted hover:text-crown-text"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveHabitMacros(habit)}
                            className="px-3 py-1 rounded-md bg-crown-blue text-white text-[11px] font-bold"
                          >
                            Save Macros
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-crown-card border border-crown-border rounded-2xl p-4 sm:p-5 shadow-card">
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div>
              <h2 className="text-base font-bold text-crown-text">Food Consumed Today</h2>
              <p className="text-xs text-crown-muted">
                {todayFoods.length} {todayFoods.length === 1 ? 'meal' : 'meals'} logged today
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-crown-blue text-xs font-semibold hover:bg-blue-100 whitespace-nowrap shrink-0"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>AI Scan</span>
            </button>
          </div>

          {todayFoods.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-crown-input border border-crown-border space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-white border border-crown-border flex items-center justify-center mx-auto text-crown-blue">
                <Flame className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-crown-text">
                No meals logged for today yet
              </div>
              <p className="text-[11px] text-crown-muted max-w-xs mx-auto">
                Snap a meal photo with Crown AI Nutrition or log your breakfast, lunch, or snacks manually.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('scanner')}
                  className="px-3.5 py-2 rounded-xl bg-crown-blue text-white text-xs font-semibold"
                >
                  Scan Meal Photo
                </button>
                <button
                  type="button"
                  onClick={onOpenFoodModal}
                  className="px-3.5 py-2 rounded-xl bg-white border border-crown-border text-crown-text text-xs font-semibold"
                >
                  Manual Entry
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayFoods.slice(-6).reverse().map((item) => {
                const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
                const isExpanded = Boolean(expandedDashMeals[item.id]);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white border border-crown-border space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-crown-text">
                            {item.name}
                          </span>
                          {item.isOutsideFood ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-crown-warning border border-amber-200">
                              Outside
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-crown-teal border border-emerald-200">
                              Home
                            </span>
                          )}
                          {hasSubItems && (
                            <button
                              type="button"
                              onClick={() => toggleDashMeal(item.id)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-crown-blue hover:bg-blue-100"
                            >
                              <span>
                                {isExpanded
                                  ? 'Hide Details'
                                  : `Details (${item.subItems.length})`}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-crown-muted mt-1">
                          {hasSubItems
                            ? `${item.subItems.length} items`
                            : `${item.quantity} ${item.unit}`}{' '}
                          • {item.category} • P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-crown-navy whitespace-nowrap">
                          {item.calories} kcal
                        </div>
                      </div>
                    </div>

                    {hasSubItems && isExpanded && (
                      <div className="pt-2.5 border-t border-crown-border space-y-1.5">
                        {item.subItems.map((sub, i) => (
                          <div
                            key={sub.id || i}
                            className="flex items-center justify-between text-xs bg-crown-input px-2.5 py-1.5 rounded-lg"
                          >
                            <span className="text-crown-text">
                              <span className="font-semibold">{sub.name}</span>{' '}
                              <span className="text-crown-muted">
                                ({sub.quantity} {sub.unit})
                              </span>
                            </span>
                            <span className="font-bold text-crown-navy whitespace-nowrap ml-2">
                              {sub.calories ?? sub.calories_kcal ?? 0} kcal
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
