import React, { useState, useEffect } from 'react';
import { X, Utensils, Camera, Sparkles, Search, Check } from 'lucide-react';
import {
  MEAL_CATEGORIES,
  INDIAN_FOOD_CATALOG
} from '../services/nutrition/nutritionService';
import { useApp } from '../hooks/useApp';

export default function QuickFoodModal({
  isOpen,
  onClose,
  defaultOutside = false,
  initialEntry = null,
  targetDateKey = null
}) {
  const {
    addFoodEntriesToDay,
    updateFoodEntryInDay,
    todayDateKey,
    setActiveTab,
    setScannerPrefillOutside
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('serving');
  const [weightG, setWeightG] = useState(150);
  const [category, setCategory] = useState(defaultOutside ? 'Outside food' : 'Lunch');
  const [isOutsideFood, setIsOutsideFood] = useState(defaultOutside);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fibre, setFibre] = useState('');
  const [consumedTime, setConsumedTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialEntry) {
      setName(initialEntry.name || '');
      setQuantity(initialEntry.quantity || 1);
      setUnit(initialEntry.unit || 'serving');
      setWeightG(initialEntry.weightG || 150);
      setCategory(initialEntry.category || 'Lunch');
      setIsOutsideFood(Boolean(initialEntry.isOutsideFood || initialEntry.category === 'Outside food'));
      setCalories(String(initialEntry.calories ?? ''));
      setProtein(String(initialEntry.protein ?? ''));
      setCarbs(String(initialEntry.carbs ?? ''));
      setFat(String(initialEntry.fat ?? ''));
      setFibre(String(initialEntry.fibre ?? ''));
      setNotes(initialEntry.notes || '');
      if (initialEntry.consumedAt) {
        const dt = new Date(initialEntry.consumedAt);
        if (!Number.isNaN(dt.getTime())) {
          setConsumedTime(
            `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
          );
        }
      }
    } else {
      setName('');
      setQuantity(1);
      setUnit('serving');
      setWeightG(150);
      setCategory(defaultOutside ? 'Outside food' : 'Lunch');
      setIsOutsideFood(defaultOutside);
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setFibre('');
      setNotes('');
      setError('');
    }
  }, [initialEntry, defaultOutside, isOpen]);

  if (!isOpen) return null;

  const filteredPresets = INDIAN_FOOD_CATALOG.filter((item) => {
    if (defaultOutside && !searchQuery) {
      return item.isOutside;
    }
    return item.name.toLowerCase().includes(searchQuery.toLowerCase());
  }).slice(0, 8);

  const handleApplyPreset = (preset) => {
    setName(preset.name);
    setQuantity(preset.quantity || 1);
    setUnit(preset.unit || 'serving');
    setWeightG(preset.weight_g || 150);
    setCategory(defaultOutside ? 'Outside food' : preset.category || 'Lunch');
    setIsOutsideFood(defaultOutside || Boolean(preset.isOutside));
    setCalories(String(preset.calories_kcal));
    setProtein(String(preset.protein_g));
    setCarbs(String(preset.carbs_g));
    setFat(String(preset.fat_g));
    setFibre(String(preset.fibre_g || 0));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a food name.');
      return;
    }
    if (calories === '' || Number(calories) < 0) {
      setError('Please enter a valid calorie estimate.');
      return;
    }

    const activeDate = targetDateKey || todayDateKey;
    const [hh, mm] = (consumedTime || '12:30').split(':').map(Number);
    const [yr, mo, da] = activeDate.split('-').map(Number);
    const consumedDateObj = new Date(yr, mo - 1, da, hh || 12, mm || 0);

    const payload = {
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unit: unit.trim() || 'serving',
      weightG: Number(weightG) || 100,
      category,
      isOutsideFood: Boolean(isOutsideFood || category === 'Outside food'),
      calories: Math.round(Number(calories) || 0),
      protein: Math.round((Number(protein) || 0) * 10) / 10,
      carbs: Math.round((Number(carbs) || 0) * 10) / 10,
      fat: Math.round((Number(fat) || 0) * 10) / 10,
      fibre: Math.round((Number(fibre) || 0) * 10) / 10,
      consumedAt: consumedDateObj.toISOString(),
      notes: notes.trim(),
      source: initialEntry?.source || 'manual'
    };

    if (initialEntry?.id) {
      await updateFoodEntryInDay(initialEntry.id, payload, activeDate);
    } else {
      await addFoodEntriesToDay([payload], activeDate);
    }
    onClose();
  };

  const handleSwitchToScanner = () => {
    onClose();
    setScannerPrefillOutside(Boolean(defaultOutside || isOutsideFood));
    setActiveTab('scanner');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-crown-navy/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-crown-card border border-crown-border rounded-xl shadow-elevated w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-crown-border sticky top-0 bg-crown-card z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-crown-blue flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-crown-text">
                {initialEntry
                  ? 'Edit Food Entry'
                  : defaultOutside
                  ? 'Log Outside Food'
                  : 'Add Food Entry'}
              </h2>
              <p className="text-xs text-crown-muted">
                {defaultOutside
                  ? 'Mindful logging helps balance your weekly routine — no judgement.'
                  : 'Log a home meal, snack, drink, or restaurant dish.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-crown-muted hover:text-crown-text hover:bg-crown-input"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!initialEntry && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-blue-50/70 border border-blue-100">
              <div className="text-xs text-crown-navy">
                <span className="font-semibold">Have a meal photo?</span> Use Crown AI Nutrition to scan Indian & restaurant meals automatically.
              </div>
              <button
                type="button"
                onClick={handleSwitchToScanner}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-crown-blue text-white text-xs font-semibold hover:opacity-95"
              >
                <Camera className="w-3.5 h-3.5" />
                Scan Photo
              </button>
            </div>
          )}

          {!initialEntry && (
            <div>
              <label className="block text-xs font-semibold text-crown-muted mb-1.5">
                Quick-Fill Indian & Common Foods
              </label>
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-crown-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Poha, Chapati, Dal, Vada pav, Biryani..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-crown-input border border-crown-border text-crown-text focus:outline-none focus:border-crown-blue"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-crown-input hover:bg-blue-50 text-crown-text hover:text-crown-blue border border-crown-border transition-colors"
                  >
                    {preset.name} • {preset.calories_kcal} kcal
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-crown-error font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-crown-text mb-1">
                Food Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Masala Dosa, 2 Chapati & Dal, Vada Pav"
                className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-sm text-crown-text focus:outline-none focus:border-crown-blue"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-crown-text mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-sm text-crown-text focus:outline-none focus:border-crown-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-crown-text mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="bowl, pieces, plate"
                  className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-sm text-crown-text focus:outline-none focus:border-crown-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-crown-text mb-1">
                  Weight (g)
                </label>
                <input
                  type="number"
                  min="1"
                  value={weightG}
                  onChange={(e) => setWeightG(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-sm text-crown-text focus:outline-none focus:border-crown-blue"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-crown-text mb-1">
                  Meal Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCategory(val);
                    if (val === 'Outside food') {
                      setIsOutsideFood(true);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-sm text-crown-text focus:outline-none focus:border-crown-blue"
                >
                  {MEAL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-crown-text mb-1">
                  Time Consumed
                </label>
                <input
                  type="time"
                  value={consumedTime}
                  onChange={(e) => setConsumedTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-sm text-crown-text focus:outline-none focus:border-crown-blue"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-crown-input border border-crown-border flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-crown-text">
                  Food Source Classification
                </div>
                <div className="text-[11px] text-crown-muted">
                  Track home-cooked vs. outside/restaurant meals effortlessly
                </div>
              </div>
              <div className="flex rounded-lg bg-white p-0.5 border border-crown-border">
                <button
                  type="button"
                  onClick={() => setIsOutsideFood(false)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    !isOutsideFood
                      ? 'bg-crown-teal text-white'
                      : 'text-crown-muted hover:text-crown-text'
                  }`}
                >
                  Home Food
                </button>
                <button
                  type="button"
                  onClick={() => setIsOutsideFood(true)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    isOutsideFood
                      ? 'bg-crown-navy text-white'
                      : 'text-crown-muted hover:text-crown-text'
                  }`}
                >
                  Outside Food
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-crown-text mb-1">
                  Calories *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="kcal"
                  className="w-full px-2.5 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text focus:outline-none focus:border-crown-blue"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-crown-text mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  className="w-full px-2.5 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text focus:outline-none focus:border-crown-blue"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-crown-text mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  className="w-full px-2.5 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text focus:outline-none focus:border-crown-blue"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-crown-text mb-1">
                  Fat (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0"
                  className="w-full px-2.5 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text focus:outline-none focus:border-crown-blue"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-crown-text mb-1">
                  Fibre (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={fibre}
                  onChange={(e) => setFibre(e.target.value)}
                  placeholder="0"
                  className="w-full px-2.5 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text focus:outline-none focus:border-crown-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-crown-text mb-1">
                Optional Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Less oil, homemade ghee, shared portion"
                className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text focus:outline-none focus:border-crown-blue"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-crown-muted hover:bg-crown-input"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold bg-crown-blue text-white hover:opacity-95 shadow-xs"
              >
                <Check className="w-4 h-4" />
                {initialEntry ? 'Update Food Entry' : 'Save to Food Diary'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
