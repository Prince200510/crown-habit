import React, { useState } from 'react';
import {
  Utensils,
  Plus,
  Store,
  Camera,
  Edit3,
  Trash2,
  Home,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import {
  MEAL_CATEGORIES,
  groupFoodEntriesByMeal
} from '../../services/nutrition/nutritionService';
import { getLocalThumbnail } from '../../services/localStorage/storageService';
import { formatReadableDate } from '../../utils/dateUtils';
import QuickFoodModal from '../../components/QuickFoodModal';

export default function FoodDiary() {
  const {
    todayDateKey,
    todayRecord,
    todayNutrition,
    deleteFoodEntryFromDay,
    setActiveTab
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [defaultOutside, setDefaultOutside] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [expandedMeals, setExpandedMeals] = useState({});

  const toggleMealDetails = (mealId) => {
    setExpandedMeals((prev) => ({
      ...prev,
      [mealId]: !prev[mealId]
    }));
  };

  const openAddManual = (isOutside = false) => {
    setEditingEntry(null);
    setDefaultOutside(isOutside);
    setModalOpen(true);
  };

  const openEditEntry = (entry) => {
    setEditingEntry(entry);
    setDefaultOutside(Boolean(entry.isOutsideFood));
    setModalOpen(true);
  };

  const handleDeleteGroupedEntry = (entry) => {
    const ids = entry.allEntryIds?.length ? entry.allEntryIds : [entry.id];
    ids.forEach((id) => deleteFoodEntryFromDay(id));
  };

  const rawEntries = todayRecord?.foodEntries || [];
  const groupedEntries = groupFoodEntriesByMeal(rawEntries);
  const totalCal = todayNutrition.totalCalories || 0;
  const homePercent = totalCal > 0 ? Math.round((todayNutrition.homeCalories / totalCal) * 100) : 100;

  return (
    <div className="space-y-5">
      <div className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-crown-muted">
            {formatReadableDate(todayDateKey)}
          </div>
          <h1 className="text-xl font-bold text-crown-text mt-0.5">Daily Food Diary</h1>
          <p className="text-xs text-crown-muted mt-0.5">
            Track home-cooked and outside meals with complete macro transparency.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-crown-blue text-white text-xs font-semibold hover:opacity-95"
          >
            <Camera className="w-4 h-4" />
            AI Food Scanner
          </button>
          <button
            type="button"
            onClick={() => openAddManual(false)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-crown-input text-crown-text border border-crown-border text-xs font-semibold hover:bg-slate-100"
          >
            <Plus className="w-4 h-4 text-crown-blue" />
            + Manual Entry
          </button>
          <button
            type="button"
            onClick={() => openAddManual(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-crown-navy text-white text-xs font-semibold hover:opacity-95"
          >
            <Store className="w-4 h-4" />
            + Add Outside Food
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="bg-crown-card border border-crown-border rounded-xl p-3.5 shadow-card">
          <div className="text-[11px] font-medium text-crown-muted">Total Calories</div>
          <div className="text-lg font-bold text-crown-navy mt-0.5">
            {todayNutrition.totalCalories} kcal
          </div>
        </div>
        <div className="bg-crown-card border border-crown-border rounded-xl p-3.5 shadow-card">
          <div className="text-[11px] font-medium text-crown-muted">Protein</div>
          <div className="text-lg font-bold text-crown-teal mt-0.5">
            {todayNutrition.totalProtein} g
          </div>
        </div>
        <div className="bg-crown-card border border-crown-border rounded-xl p-3.5 shadow-card">
          <div className="text-[11px] font-medium text-crown-muted">Carbohydrates</div>
          <div className="text-lg font-bold text-crown-text mt-0.5">
            {todayNutrition.totalCarbs} g
          </div>
        </div>
        <div className="bg-crown-card border border-crown-border rounded-xl p-3.5 shadow-card">
          <div className="text-[11px] font-medium text-crown-muted">Fats</div>
          <div className="text-lg font-bold text-crown-text mt-0.5">
            {todayNutrition.totalFat} g
          </div>
        </div>
        <div className="bg-crown-card border border-crown-border rounded-xl p-3.5 shadow-card">
          <div className="text-[11px] font-medium text-crown-muted">Dietary Fibre</div>
          <div className="text-lg font-bold text-crown-text mt-0.5">
            {todayNutrition.totalFibre} g
          </div>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-crown-teal">Home Food</div>
          <div className="text-lg font-bold text-crown-teal mt-0.5">
            {todayNutrition.homeCalories} kcal
          </div>
        </div>
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5">
          <div className="text-[11px] font-medium text-crown-navy">Outside Food</div>
          <div className="text-lg font-bold text-crown-navy mt-0.5">
            {todayNutrition.outsideCalories} kcal
          </div>
        </div>
      </div>

      <div className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-crown-navy">
            <Store className="w-4 h-4 text-crown-blue" />
            Mindful Outside-Food Balance
          </div>
          <p className="text-xs text-crown-muted max-w-xl">
            {todayNutrition.outsideCalories === 0
              ? 'All logged meals today are home-prepared. Whenever you eat outside, log it here to stay aware of your weekly balance.'
              : `You have logged ${todayNutrition.outsideCalories} kcal from outside food and ${todayNutrition.homeCalories} kcal from home meals today (${homePercent}% home nutrition). Awareness builds long-term consistency!`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAddManual(true)}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-crown-input hover:bg-slate-100 text-crown-navy border border-crown-border text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5 text-crown-blue" />
          + Add Outside Food
        </button>
      </div>

      <div className="space-y-4">
        {MEAL_CATEGORIES.map((category) => {
          const sectionEntries =
            category === 'Outside food'
              ? groupedEntries.filter((e) => e.isOutsideFood || e.category === 'Outside food')
              : groupedEntries.filter((e) => e.category === category);

          const sectionCalories = sectionEntries.reduce(
            (sum, item) => sum + (Number(item.calories) || 0),
            0
          );

          return (
            <div
              key={category}
              className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card"
            >
              <div className="flex items-center justify-between pb-3 border-b border-crown-border">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-crown-text">
                    {category === 'Snack'
                      ? 'Snacks'
                      : category === 'Drink'
                      ? 'Drinks'
                      : category}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-crown-input text-crown-muted">
                    {sectionEntries.length}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-crown-navy">
                    {Math.round(sectionCalories)} kcal
                  </span>
                  <button
                    type="button"
                    onClick={() => openAddManual(category === 'Outside food')}
                    className="text-xs font-semibold text-crown-blue hover:underline"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {sectionEntries.length === 0 ? (
                <div className="py-4 text-xs text-crown-muted">
                  No entries logged under {category.toLowerCase()} today.
                </div>
              ) : (
                <div className="divide-y divide-crown-border mt-2">
                  {sectionEntries.map((entry) => {
                    const thumb = getLocalThumbnail(entry.id);
                    const timeStr = entry.consumedAt
                      ? new Date(entry.consumedAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '';
                    const hasSubItems = Array.isArray(entry.subItems) && entry.subItems.length > 0;
                    const expandKey = `${category}_${entry.id}`;
                    const isExpanded = Boolean(expandedMeals[expandKey]);

                    return (
                      <div key={expandKey} className="py-3.5 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={entry.name}
                                className="w-12 h-12 rounded-lg object-cover border border-crown-border shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-crown-input border border-crown-border flex items-center justify-center text-crown-muted shrink-0">
                                <Utensils className="w-5 h-5" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-crown-text truncate">
                                  {entry.name}
                                </span>
                                {entry.isOutsideFood ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-crown-navy border border-blue-200">
                                    <Store className="w-2.5 h-2.5" />
                                    Outside
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-crown-teal border border-emerald-200">
                                    <Home className="w-2.5 h-2.5" />
                                    Home
                                  </span>
                                )}
                                {hasSubItems && (
                                  <button
                                    type="button"
                                    onClick={() => toggleMealDetails(expandKey)}
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-crown-blue hover:bg-blue-100 transition-colors"
                                  >
                                    <span>
                                      {isExpanded
                                        ? 'Hide Details'
                                        : `Details (${entry.subItems.length} items)`}
                                    </span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3 h-3" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-xs text-crown-muted mt-0.5">
                                <span>
                                  {hasSubItems
                                    ? `${entry.subItems.length} items (${entry.weightG || 100}g total)`
                                    : `${entry.quantity} ${entry.unit} (${entry.weightG || 100}g)`}
                                </span>
                                <span>•</span>
                                <span>P: {entry.protein}g</span>
                                <span>C: {entry.carbs}g</span>
                                <span>F: {entry.fat}g</span>
                                <span>Fibre: {entry.fibre || 0}g</span>
                                {timeStr && (
                                  <>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {timeStr}
                                    </span>
                                  </>
                                )}
                              </div>

                              {entry.notes && (
                                <div className="text-[11px] text-crown-muted italic mt-0.5">
                                  {entry.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <span className="text-sm font-bold text-crown-navy">
                              {entry.calories} kcal
                            </span>
                            <div className="flex items-center gap-1">
                              {!hasSubItems && (
                                <button
                                  type="button"
                                  onClick={() => openEditEntry(entry)}
                                  className="p-1.5 rounded-lg text-crown-muted hover:text-crown-blue hover:bg-crown-input"
                                  title="Edit entry"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteGroupedEntry(entry)}
                                className="p-1.5 rounded-lg text-crown-muted hover:text-crown-error hover:bg-red-50"
                                title="Delete meal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {hasSubItems && isExpanded && (
                          <div className="ml-0 sm:ml-14 p-3 rounded-xl bg-crown-input border border-crown-border space-y-2">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-crown-muted">
                              Included Items in {entry.name}
                            </div>
                            <div className="divide-y divide-crown-border">
                              {entry.subItems.map((sub, idx) => (
                                <div
                                  key={sub.id || idx}
                                  className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <span className="font-semibold text-crown-text">
                                      {sub.name}
                                    </span>
                                    <span className="text-crown-muted ml-2">
                                      {sub.quantity} {sub.unit} ({sub.weightG || sub.estimated_weight_g || 100}g)
                                    </span>
                                    <div className="text-[11px] text-crown-muted mt-0.5">
                                      P: {sub.protein ?? sub.protein_g ?? 0}g • C: {sub.carbs ?? sub.carbs_g ?? 0}g • F: {sub.fat ?? sub.fat_g ?? 0}g • Fibre: {sub.fibre ?? sub.fibre_g ?? 0}g
                                    </div>
                                  </div>
                                  <div className="font-bold text-crown-navy shrink-0">
                                    {sub.calories ?? sub.calories_kcal ?? 0} kcal
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <QuickFoodModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultOutside={defaultOutside}
        initialEntry={editingEntry}
      />
    </div>
  );
}
