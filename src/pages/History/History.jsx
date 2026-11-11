import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  FastForward,
  Clock,
  Utensils,
  Store,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Flame,
  Trophy
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import {
  getMonthCalendarDays,
  formatReadableDate,
  formatTime12h,
  getPreviousDateKeys
} from '../../utils/dateUtils';
import {
  calculateDailyNutritionSummary,
  groupFoodEntriesByMeal
} from '../../services/nutrition/nutritionService';
import { fetchPaginatedDailyRecords } from '../../services/firebase/firestoreService';
import { saveStoredDailyRecord } from '../../services/localStorage/storageService';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function evaluateFireDay(record, calorieGoal = 2000) {
  if (!record) {
    return {
      isFireDay: false,
      allHabitsCompleted: false,
      isUnderDeficit: false,
      completedCount: 0,
      totalHabits: 0,
      recPct: null,
      foodCalories: 0,
      burnedCalories: 0,
      netCalories: 0,
      deficitRemaining: calorieGoal
    };
  }

  const habits = Object.values(record.habitStatuses || {});
  const totalHabits = habits.length;
  const completedCount = habits.filter((h) => h.status === 'completed').length;
  const recPct = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : null;
  const allHabitsCompleted = totalHabits > 0 && completedCount === totalHabits;

  const foodSummary = calculateDailyNutritionSummary(record.foodEntries || []);
  const foodCalories = foodSummary.totalCalories || 0;
  const burnedCalories = Math.max(0, Math.round(Number(record.activitySummary?.caloriesBurned) || 0));
  const netCalories = foodCalories - burnedCalories;
  const deficitRemaining = calorieGoal - netCalories;
  const isUnderDeficit = netCalories <= calorieGoal;

  const isFireDay = allHabitsCompleted && isUnderDeficit;

  return {
    isFireDay,
    allHabitsCompleted,
    isUnderDeficit,
    completedCount,
    totalHabits,
    recPct,
    foodCalories,
    burnedCalories,
    netCalories,
    deficitRemaining
  };
}

export default function History() {
  const {
    user,
    settings,
    todayDateKey,
    todayRecord,
    getHistoricalRecord,
    getAllStoredDailyRecords
  } = useApp();

  const calorieGoal = Number(settings?.nutritionGoals?.calories) || 2000;

  const [selectedDateKey, setSelectedDateKey] = useState(todayDateKey);
  const [viewYear, setViewYear] = useState(() => Number(todayDateKey.split('-')[0]));
  const [viewMonth, setViewMonth] = useState(() => Number(todayDateKey.split('-')[1]) - 1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loadingDate, setLoadingDate] = useState(false);
  const [paginationCursor, setPaginationCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allRecordsMap, setAllRecordsMap] = useState(() => getAllStoredDailyRecords());
  const [expandedHistoryMeals, setExpandedHistoryMeals] = useState({});

  const toggleHistoryMeal = (id) => {
    setExpandedHistoryMeals((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    let active = true;
    setLoadingDate(true);
    getHistoricalRecord(selectedDateKey).then((rec) => {
      if (!active) return;
      setSelectedRecord(rec);
      const latestMap = getAllStoredDailyRecords();
      if (todayRecord && todayDateKey) {
        latestMap[todayDateKey] = todayRecord;
      }
      setAllRecordsMap(latestMap);
      setLoadingDate(false);
    });
    return () => {
      active = false;
    };
  }, [selectedDateKey, todayRecord, todayDateKey, getHistoricalRecord, getAllStoredDailyRecords]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleLoadOlderCloudHistory = async () => {
    if (!user?.uid || user?.isLocalOnly) return;
    setLoadingMore(true);
    try {
      const { records, nextCursor } = await fetchPaginatedDailyRecords(
        user.uid,
        14,
        paginationCursor
      );
      records.forEach((rec) => {
        if (rec?.date) {
          saveStoredDailyRecord(rec.date, rec);
        }
      });
      setAllRecordsMap(getAllStoredDailyRecords());
      setPaginationCursor(nextCursor);
    } catch {
      void 0;
    } finally {
      setLoadingMore(false);
    }
  };

  const calendarDays = getMonthCalendarDays(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });

  const streakStats = useMemo(() => {
    const last90Keys = getPreviousDateKeys(todayDateKey, 90);
    let currentStreak = 0;
    let bestStreak = 0;
    let running = 0;

    last90Keys.forEach((dKey) => {
      const rec = dKey === todayDateKey ? todayRecord || allRecordsMap[dKey] : allRecordsMap[dKey];
      const { isFireDay } = evaluateFireDay(rec, calorieGoal);
      if (isFireDay) {
        running += 1;
        if (running > bestStreak) bestStreak = running;
      } else {
        running = 0;
      }
    });

    const reversedKeys = [...last90Keys].reverse();
    for (let i = 0; i < reversedKeys.length; i += 1) {
      const dKey = reversedKeys[i];
      const rec = dKey === todayDateKey ? todayRecord || allRecordsMap[dKey] : allRecordsMap[dKey];
      const { isFireDay } = evaluateFireDay(rec, calorieGoal);
      if (isFireDay) {
        currentStreak += 1;
      } else if (i === 0 && dKey === todayDateKey) {
        continue;
      } else {
        break;
      }
    }

    const monthFireDays = calendarDays.reduce((acc, cell) => {
      if (!cell) return acc;
      const rec =
        cell.dateKey === todayDateKey
          ? todayRecord || allRecordsMap[cell.dateKey]
          : allRecordsMap[cell.dateKey];
      return evaluateFireDay(rec, calorieGoal).isFireDay ? acc + 1 : acc;
    }, 0);

    return {
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
      monthFireDays
    };
  }, [allRecordsMap, todayDateKey, todayRecord, calorieGoal, calendarDays]);

  const habitList = Object.values(selectedRecord?.habitStatuses || {});
  const completedHabits = habitList.filter((h) => h.status === 'completed');
  const missedHabits = habitList.filter((h) => h.status === 'missed');
  const skippedHabits = habitList.filter((h) => h.status === 'skipped');
  const pendingHabits = habitList.filter((h) => h.status === 'pending');
  const completionPct =
    habitList.length > 0 ? Math.round((completedHabits.length / habitList.length) * 100) : 0;

  const foodEntries = selectedRecord?.foodEntries || [];
  const groupedFoodEntries = groupFoodEntriesByMeal(foodEntries);
  const nutrition = calculateDailyNutritionSummary(foodEntries);
  const selectedFireEval = evaluateFireDay(selectedRecord, calorieGoal);

  return (
    <div className="space-y-5">
      <div className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-crown-text">History & Daily Archive</h1>
          <p className="text-xs text-crown-muted mt-0.5">
            Select any previous date to inspect preserved habit checklists and food entries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            max={todayDateKey}
            value={selectedDateKey}
            onChange={(e) => {
              if (e.target.value) {
                setSelectedDateKey(e.target.value);
                const [y, m] = e.target.value.split('-').map(Number);
                setViewYear(y);
                setViewMonth(m - 1);
              }
            }}
            className="px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-xs font-semibold text-crown-text"
          />
          <button
            type="button"
            onClick={() => {
              setSelectedDateKey(todayDateKey);
              const [y, m] = todayDateKey.split('-').map(Number);
              setViewYear(y);
              setViewMonth(m - 1);
            }}
            className="px-3 py-2 rounded-lg bg-crown-blue text-white text-xs font-semibold"
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-crown-card border border-crown-border rounded-xl p-5 shadow-card">
          <div className="mb-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-crown-text">
                  {streakStats.currentStreak} Day Fire Streak
                </div>
                <div className="text-[10px] font-medium text-crown-muted">
                  100% Habits Done + Net Under {calorieGoal} kcal
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-amber-200 text-[10px] font-bold text-amber-700">
                <Trophy className="w-3 h-3 text-amber-500" />
                <span>Best: {streakStats.bestStreak}d</span>
              </div>
              <div className="text-[10px] font-semibold text-crown-muted mt-0.5">
                This month: {streakStats.monthFireDays} fire {streakStats.monthFireDays === 1 ? 'day' : 'days'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-crown-input text-crown-text"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold text-crown-text">{monthLabel}</h2>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-crown-input text-crown-text"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-[11px] font-semibold text-crown-muted py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty_${idx}`} className="h-12" />;
              }

              const rec =
                cell.dateKey === todayDateKey
                  ? todayRecord || allRecordsMap[cell.dateKey]
                  : allRecordsMap[cell.dateKey];
              const { isFireDay, recPct } = evaluateFireDay(rec, calorieGoal);
              const hasFood = (rec?.foodEntries?.length || 0) > 0;
              const isSelected = cell.dateKey === selectedDateKey;
              const isToday = cell.dateKey === todayDateKey;

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(cell.dateKey)}
                  className={`h-12 rounded-lg border flex flex-col items-center justify-center relative transition-colors ${
                    isSelected
                      ? 'bg-crown-blue text-white border-crown-blue font-bold'
                      : isFireDay
                      ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold hover:border-amber-400'
                      : isToday
                      ? 'bg-blue-50 text-crown-blue border-blue-300 font-bold'
                      : rec
                      ? 'bg-crown-input text-crown-text border-crown-border hover:border-crown-blue'
                      : 'bg-white text-crown-muted border-transparent hover:bg-crown-input'
                  }`}
                >
                  <span className="text-xs leading-none">{cell.day}</span>
                  {isFireDay ? (
                    <div className="mt-0.5 flex items-center justify-center">
                      <Flame
                        className={`w-3.5 h-3.5 fill-current ${
                          isSelected ? 'text-amber-300' : 'text-amber-500'
                        }`}
                      />
                    </div>
                  ) : (
                    (recPct !== null || hasFood) && (
                      <div className="flex items-center gap-1 mt-1">
                        {recPct !== null && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? 'bg-white'
                                : recPct >= 70
                                ? 'bg-crown-teal'
                                : recPct > 0
                                ? 'bg-crown-warning'
                                : 'bg-slate-300'
                            }`}
                          />
                        )}
                        {hasFood && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-emerald-200' : 'bg-crown-navy'
                            }`}
                          />
                        )}
                      </div>
                    )
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-crown-border flex flex-wrap items-center justify-center gap-3 text-[10px] font-semibold text-crown-muted">
            <span className="inline-flex items-center gap-1 text-amber-700">
              <Flame className="w-3 h-3 text-amber-500 fill-current" />
              Fire Streak (100% Done + Under Deficit)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-crown-teal" />
              70%+ Habits
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-crown-navy" />
              Meals Logged
            </span>
          </div>

          {user && !user.isLocalOnly && (
            <div className="mt-4 pt-3 border-t border-crown-border text-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={handleLoadOlderCloudHistory}
                className="text-xs font-semibold text-crown-blue hover:underline disabled:opacity-50"
              >
                {loadingMore ? 'Loading paginated cloud records...' : 'Load Older Records from Firestore'}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-crown-border">
              <div>
                <div className="text-xs font-semibold text-crown-muted">Selected Date</div>
                <h2 className="text-base font-bold text-crown-text">
                  {formatReadableDate(selectedDateKey)}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {selectedFireEval.isFireDay && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    <span>Fire Streak Achieved</span>
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-crown-teal border border-emerald-200">
                  {completionPct}% Completed
                </span>
              </div>
            </div>

            {loadingDate ? (
              <div className="py-8 text-center text-xs text-crown-muted">
                Loading daily record...
              </div>
            ) : !selectedRecord ? (
              <div className="py-8 text-center space-y-1">
                <CalendarIcon className="w-7 h-7 text-crown-muted mx-auto" />
                <div className="text-xs font-semibold text-crown-text">
                  No record stored for {selectedDateKey}
                </div>
                <p className="text-[11px] text-crown-muted">
                  Records are created automatically on each active day and preserved permanently.
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-lg bg-crown-input border border-crown-border">
                    <div className="text-[11px] text-crown-muted">Net Calories</div>
                    <div className="text-sm font-bold text-crown-navy">
                      {selectedFireEval.netCalories} / {calorieGoal} kcal
                    </div>
                    <div
                      className={`text-[10px] font-semibold mt-0.5 ${
                        selectedFireEval.isUnderDeficit ? 'text-crown-teal' : 'text-crown-error'
                      }`}
                    >
                      {selectedFireEval.isUnderDeficit
                        ? `${selectedFireEval.deficitRemaining} kcal deficit`
                        : `+${Math.abs(selectedFireEval.deficitRemaining)} kcal over`}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-crown-input border border-crown-border">
                    <div className="text-[11px] text-crown-muted">Walk Burned</div>
                    <div className="text-sm font-bold text-crown-teal">
                      -{selectedFireEval.burnedCalories} kcal
                    </div>
                    <div className="text-[10px] text-crown-muted mt-0.5">
                      {selectedRecord?.activitySummary?.steps || 0} steps
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-crown-input border border-crown-border">
                    <div className="text-[11px] text-crown-muted">Total Protein</div>
                    <div className="text-sm font-bold text-crown-teal">
                      {nutrition.totalProtein} g
                    </div>
                    <div className="text-[10px] text-crown-muted mt-0.5">
                      Outside: {nutrition.outsideCalories} kcal
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-crown-input border border-crown-border">
                    <div className="text-[11px] text-crown-muted">Habits Done</div>
                    <div className="text-sm font-bold text-crown-teal">
                      {completedHabits.length} / {habitList.length}
                    </div>
                    <div className="text-[10px] text-crown-muted mt-0.5">
                      {selectedFireEval.allHabitsCompleted ? '100% Complete' : `${completionPct}% Complete`}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-crown-muted mb-2">
                    Habit Checklist Breakdown
                  </h3>
                  {habitList.length === 0 ? (
                    <p className="text-xs text-crown-muted">No habits recorded for this date.</p>
                  ) : (
                    <div className="space-y-2">
                      {habitList.map((h, i) => (
                        <div
                          key={h.routineId || i}
                          className="p-2.5 rounded-lg bg-crown-input border border-crown-border flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {h.status === 'completed' && (
                              <CheckCircle2 className="w-4 h-4 text-crown-teal" />
                            )}
                            {h.status === 'missed' && (
                              <XCircle className="w-4 h-4 text-crown-error" />
                            )}
                            {h.status === 'skipped' && (
                              <FastForward className="w-4 h-4 text-crown-warning" />
                            )}
                            {h.status === 'pending' && (
                              <Clock className="w-4 h-4 text-crown-muted" />
                            )}
                            <span className="font-semibold text-crown-text">{h.name}</span>
                            <span className="text-crown-muted">
                              ({formatTime12h(h.scheduledTime)})
                            </span>
                          </div>
                          <span className="capitalize font-semibold text-crown-navy">
                            {h.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-crown-muted">
                    <span>Completed: {completedHabits.length}</span>
                    <span>Missed: {missedHabits.length}</span>
                    <span>Skipped: {skippedHabits.length}</span>
                    <span>Pending: {pendingHabits.length}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-crown-muted mb-2">
                    Food Entries ({groupedFoodEntries.length})
                  </h3>
                  {groupedFoodEntries.length === 0 ? (
                    <p className="text-xs text-crown-muted">No food entries logged on this date.</p>
                  ) : (
                    <div className="space-y-2">
                      {groupedFoodEntries.map((item) => {
                        const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
                        const isExpanded = Boolean(expandedHistoryMeals[item.id]);
                        return (
                          <div
                            key={item.id}
                            className="p-3 rounded-lg bg-crown-input border border-crown-border text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {item.isOutsideFood ? (
                                  <Store className="w-4 h-4 text-crown-navy shrink-0" />
                                ) : (
                                  <Utensils className="w-4 h-4 text-crown-teal shrink-0" />
                                )}
                                <span className="font-bold text-crown-text">{item.name}</span>
                                <span className="text-crown-muted">
                                  {hasSubItems
                                    ? `${item.subItems.length} items • ${item.category}`
                                    : `${item.quantity} ${item.unit} • ${item.category}`}
                                </span>
                                {hasSubItems && (
                                  <button
                                    type="button"
                                    onClick={() => toggleHistoryMeal(item.id)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-crown-blue hover:bg-blue-100"
                                  >
                                    <span>
                                      {isExpanded
                                        ? 'Hide Details'
                                        : `Details (${item.subItems.length} items)`}
                                    </span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3 h-3" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                              <div className="text-right font-bold text-crown-navy shrink-0">
                                {item.calories} kcal • {item.protein}g P
                              </div>
                            </div>

                            {hasSubItems && isExpanded && (
                              <div className="pt-2 border-t border-crown-border space-y-1.5 pl-6">
                                {item.subItems.map((sub, i) => (
                                  <div
                                    key={sub.id || i}
                                    className="flex items-center justify-between text-[11px]"
                                  >
                                    <div>
                                      <span className="font-semibold text-crown-text">
                                        {sub.name}
                                      </span>
                                      <span className="text-crown-muted ml-1.5">
                                        ({sub.quantity} {sub.unit})
                                      </span>
                                    </div>
                                    <span className="font-semibold text-crown-navy">
                                      {sub.calories ?? sub.calories_kcal ?? 0} kcal • {sub.protein ?? sub.protein_g ?? 0}g P
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
