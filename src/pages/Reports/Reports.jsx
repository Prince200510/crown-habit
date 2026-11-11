import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Award,
  AlertCircle,
  Flame,
  Home,
  Store,
  TrendingUp,
  Utensils
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { getLastNDates, formatShortDate } from '../../utils/dateUtils';
import { calculateDailyNutritionSummary } from '../../services/nutrition/nutritionService';

export default function Reports() {
  const { todayDateKey, getAllStoredDailyRecords } = useApp();
  const [rangeDays, setRangeDays] = useState(7);

  const analytics = useMemo(() => {
    const allRecords = getAllStoredDailyRecords();
    const dates = getLastNDates(rangeDays, todayDateKey);

    let totalScheduledHabits = 0;
    let totalCompletedHabits = 0;
    const habitStatsMap = {};

    let sumCalories = 0;
    let sumProtein = 0;
    let sumCarbs = 0;
    let sumFat = 0;
    let sumHomeCal = 0;
    let sumOutsideCal = 0;
    let totalMealsLogged = 0;
    let activeNutritionDays = 0;

    const categoryCounts = {
      Breakfast: 0,
      Lunch: 0,
      Dinner: 0,
      Snack: 0,
      Drink: 0,
      'Outside food': 0
    };

    const dailySeries = dates.map((dateKey) => {
      const rec = allRecords[dateKey];
      const habits = Object.values(rec?.habitStatuses || {});
      const doneCount = habits.filter((h) => h.status === 'completed').length;

      totalScheduledHabits += habits.length;
      totalCompletedHabits += doneCount;

      habits.forEach((h) => {
        const key = h.routineId || h.name;
        if (!habitStatsMap[key]) {
          habitStatsMap[key] = {
            name: h.name || 'Habit',
            total: 0,
            completed: 0,
            missed: 0,
            skipped: 0
          };
        }
        habitStatsMap[key].total += 1;
        if (h.status === 'completed') habitStatsMap[key].completed += 1;
        if (h.status === 'missed') habitStatsMap[key].missed += 1;
        if (h.status === 'skipped') habitStatsMap[key].skipped += 1;
      });

      const foods = rec?.foodEntries || [];
      const nut = calculateDailyNutritionSummary(foods);

      if (foods.length > 0) {
        activeNutritionDays += 1;
        sumCalories += nut.totalCalories;
        sumProtein += nut.totalProtein;
        sumCarbs += nut.totalCarbs;
        sumFat += nut.totalFat;
        sumHomeCal += nut.homeCalories;
        sumOutsideCal += nut.outsideCalories;
        totalMealsLogged += foods.length;

        foods.forEach((f) => {
          if (categoryCounts[f.category] !== undefined) {
            categoryCounts[f.category] += 1;
          }
          if (f.isOutsideFood && f.category !== 'Outside food') {
            categoryCounts['Outside food'] += 1;
          }
        });
      }

      return {
        dateKey,
        label: formatShortDate(dateKey),
        habitPct: habits.length > 0 ? Math.round((doneCount / habits.length) * 100) : 0,
        calories: nut.totalCalories,
        protein: nut.totalProtein,
        carbs: nut.totalCarbs,
        fat: nut.totalFat,
        homeCalories: nut.homeCalories,
        outsideCalories: nut.outsideCalories,
        mealCount: foods.length
      };
    });

    const habitArray = Object.values(habitStatsMap).map((h) => ({
      ...h,
      rate: h.total > 0 ? Math.round((h.completed / h.total) * 100) : 0,
      unfinished: h.total - h.completed
    }));

    const mostConsistent = [...habitArray]
      .sort((a, b) => b.rate - a.rate || b.completed - a.completed)
      .slice(0, 4);

    const frequentlyMissed = [...habitArray]
      .filter((h) => h.missed > 0 || h.rate < 100)
      .sort((a, b) => b.missed - a.missed || a.rate - b.rate)
      .slice(0, 4);

    const overallHabitPct =
      totalScheduledHabits > 0
        ? Math.round((totalCompletedHabits / totalScheduledHabits) * 100)
        : 0;

    const divisor = activeNutritionDays || 1;
    const maxCalories = Math.max(2000, ...dailySeries.map((d) => d.calories));
    const maxProtein = Math.max(80, ...dailySeries.map((d) => d.protein));

    return {
      dailySeries,
      overallHabitPct,
      totalCompletedHabits,
      totalScheduledHabits,
      mostConsistent,
      frequentlyMissed,
      avgCalories: Math.round(sumCalories / divisor),
      avgProtein: Math.round((sumProtein / divisor) * 10) / 10,
      avgCarbs: Math.round((sumCarbs / divisor) * 10) / 10,
      avgFat: Math.round((sumFat / divisor) * 10) / 10,
      sumHomeCal: Math.round(sumHomeCal),
      sumOutsideCal: Math.round(sumOutsideCal),
      totalMealsLogged,
      categoryCounts,
      maxCalories,
      maxProtein
    };
  }, [rangeDays, todayDateKey, getAllStoredDailyRecords]);

  const totalFoodCalories = analytics.sumHomeCal + analytics.sumOutsideCal;
  const homeSharePct =
    totalFoodCalories > 0 ? Math.round((analytics.sumHomeCal / totalFoodCalories) * 100) : 100;
  const outsideSharePct = 100 - homeSharePct;

  return (
    <div className="space-y-5">
      <div className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-crown-text">Reports & Analytics</h1>
          <p className="text-xs text-crown-muted mt-0.5">
            Calculated directly from your daily records with zero redundant cloud storage.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-crown-input p-1 border border-crown-border self-start">
          <button
            type="button"
            onClick={() => setRangeDays(7)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              rangeDays === 7
                ? 'bg-crown-blue text-white shadow-xs'
                : 'text-crown-muted hover:text-crown-text'
            }`}
          >
            Weekly (7 Days)
          </button>
          <button
            type="button"
            onClick={() => setRangeDays(30)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              rangeDays === 30
                ? 'bg-crown-blue text-white shadow-xs'
                : 'text-crown-muted hover:text-crown-text'
            }`}
          >
            Monthly (30 Days)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-crown-card border border-crown-border rounded-xl p-4 shadow-card">
          <div className="text-xs text-crown-muted font-medium">Habit Completion</div>
          <div className="text-2xl font-bold text-crown-teal mt-1">
            {analytics.overallHabitPct}%
          </div>
          <div className="text-[11px] text-crown-muted mt-0.5">
            {analytics.totalCompletedHabits} / {analytics.totalScheduledHabits} tasks done
          </div>
        </div>

        <div className="bg-crown-card border border-crown-border rounded-xl p-4 shadow-card">
          <div className="text-xs text-crown-muted font-medium">Avg Daily Calories</div>
          <div className="text-2xl font-bold text-crown-navy mt-1">
            {analytics.avgCalories} kcal
          </div>
          <div className="text-[11px] text-crown-muted mt-0.5">
            Carbs: {analytics.avgCarbs}g • Fat: {analytics.avgFat}g
          </div>
        </div>

        <div className="bg-crown-card border border-crown-border rounded-xl p-4 shadow-card">
          <div className="text-xs text-crown-muted font-medium">Avg Daily Protein</div>
          <div className="text-2xl font-bold text-crown-blue mt-1">
            {analytics.avgProtein} g
          </div>
          <div className="text-[11px] text-crown-muted mt-0.5">
            Across active logged days
          </div>
        </div>

        <div className="bg-crown-card border border-crown-border rounded-xl p-4 shadow-card">
          <div className="text-xs text-crown-muted font-medium">Home vs. Outside</div>
          <div className="text-2xl font-bold text-crown-text mt-1">
            {homeSharePct}% / {outsideSharePct}%
          </div>
          <div className="text-[11px] text-crown-muted mt-0.5">
            Outside: {analytics.sumOutsideCal} kcal total
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-crown-text flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-crown-blue" />
                Daily Calorie Consumption ({rangeDays} Days)
              </h2>
              <p className="text-[11px] text-crown-muted">
                Stacked by Home Food (Teal) and Outside Food (Navy)
              </p>
            </div>
          </div>

          <div className="h-44 flex items-end gap-1.5 pt-4 border-b border-crown-border">
            {analytics.dailySeries.map((day) => {
              const totalH = Math.min(100, Math.round((day.calories / analytics.maxCalories) * 100));
              const outsideRatio =
                day.calories > 0 ? Math.round((day.outsideCalories / day.calories) * 100) : 0;

              return (
                <div
                  key={day.dateKey}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  <div
                    className="w-full max-w-[26px] rounded-t-md overflow-hidden flex flex-col justify-end bg-crown-input"
                    style={{ height: `${Math.max(4, totalH)}%` }}
                    title={`${day.label}: ${day.calories} kcal (Home: ${day.homeCalories}, Outside: ${day.outsideCalories})`}
                  >
                    {day.outsideCalories > 0 && (
                      <div
                        className="w-full bg-crown-navy"
                        style={{ height: `${outsideRatio}%` }}
                      />
                    )}
                    <div className="w-full bg-crown-teal flex-1" />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-crown-muted mt-2">
            <span>{analytics.dailySeries[0]?.label}</span>
            <span>{analytics.dailySeries[Math.floor(analytics.dailySeries.length / 2)]?.label}</span>
            <span>{analytics.dailySeries[analytics.dailySeries.length - 1]?.label}</span>
          </div>
        </div>

        <div className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-crown-text flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-crown-teal" />
                Daily Protein & Habit Completion Trend
              </h2>
              <p className="text-[11px] text-crown-muted">
                Protein intake (g) and daily routine completion (%)
              </p>
            </div>
          </div>

          <div className="h-44 flex items-end gap-1.5 pt-4 border-b border-crown-border">
            {analytics.dailySeries.map((day) => {
              const proteinH = Math.min(
                100,
                Math.round((day.protein / analytics.maxProtein) * 100)
              );
              return (
                <div
                  key={day.dateKey}
                  className="flex-1 flex flex-col items-center justify-end h-full"
                >
                  <div
                    className="w-full max-w-[26px] rounded-t-md bg-crown-blue"
                    style={{ height: `${Math.max(4, proteinH)}%` }}
                    title={`${day.label}: ${day.protein}g protein • ${day.habitPct}% habits`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-crown-muted mt-2">
            <span>{analytics.dailySeries[0]?.label}</span>
            <span>{analytics.dailySeries[Math.floor(analytics.dailySeries.length / 2)]?.label}</span>
            <span>{analytics.dailySeries[analytics.dailySeries.length - 1]?.label}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card space-y-3">
          <h2 className="text-sm font-bold text-crown-text flex items-center gap-1.5">
            <Award className="w-4 h-4 text-crown-teal" />
            Most Consistent Habits
          </h2>

          {analytics.mostConsistent.length === 0 ? (
            <p className="text-xs text-crown-muted">No habit records in this period yet.</p>
          ) : (
            <div className="space-y-2.5">
              {analytics.mostConsistent.map((h) => (
                <div
                  key={h.name}
                  className="p-3 rounded-lg bg-crown-input border border-crown-border flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-crown-text">{h.name}</div>
                    <div className="text-[11px] text-crown-muted">
                      Completed {h.completed} of {h.total} days
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-crown-teal">
                    {h.rate}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card space-y-3">
          <h2 className="text-sm font-bold text-crown-text flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-crown-warning" />
            Habits Needing Attention
          </h2>

          {analytics.frequentlyMissed.length === 0 ? (
            <p className="text-xs text-crown-muted">
              Zero missed habits recorded during this period!
            </p>
          ) : (
            <div className="space-y-2.5">
              {analytics.frequentlyMissed.map((h) => (
                <div
                  key={h.name}
                  className="p-3 rounded-lg bg-crown-input border border-crown-border flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-crown-text">{h.name}</div>
                    <div className="text-[11px] text-crown-muted">
                      Missed: {h.missed} • Skipped: {h.skipped} • Pending: {h.unfinished - h.missed - h.skipped}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-crown-warning">
                    {h.rate}% done
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-crown-text flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-crown-navy" />
              Home vs. Outside Food & Meal Frequency
            </h2>
            <p className="text-xs text-crown-muted">
              Total meals logged: {analytics.totalMealsLogged} entries over {rangeDays} days
            </p>
          </div>
        </div>

        <div className="w-full h-3 bg-crown-input rounded-full overflow-hidden flex border border-crown-border">
          <div
            className="bg-crown-teal h-full transition-all"
            style={{ width: `${homeSharePct}%` }}
          />
          <div
            className="bg-crown-navy h-full transition-all"
            style={{ width: `${outsideSharePct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-crown-teal">
            <Home className="w-3.5 h-3.5" />
            Home Food: {analytics.sumHomeCal} kcal ({homeSharePct}%)
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-crown-navy">
            <Store className="w-3.5 h-3.5" />
            Outside Food: {analytics.sumOutsideCal} kcal ({outsideSharePct}%)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
          {Object.entries(analytics.categoryCounts).map(([cat, count]) => (
            <div
              key={cat}
              className="p-2.5 rounded-lg bg-crown-input border border-crown-border text-center"
            >
              <div className="text-[11px] text-crown-muted truncate">{cat}</div>
              <div className="text-sm font-bold text-crown-text mt-0.5">{count}</div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-crown-muted border-t border-crown-border pt-3">
          Note: Nutritional figures and habit reports are informational estimates for personal wellness tracking and do not constitute medical diagnosis or clinical dietary advice.
        </p>
      </div>
    </div>
  );
}
