import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  WifiOff,
  Utensils
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import {
  captureOrPickMealImage,
  readFileAsCompressedImage,
  analyseMealWithGemini
} from '../../services/gemini/geminiService';
import {
  MEAL_CATEGORIES,
  INDIAN_FOOD_CATALOG,
  calculateItemsTotals,
  scaleFoodItemByQuantity
} from '../../services/nutrition/nutritionService';

export default function FoodScanner() {
  const {
    isOnline,
    addFoodEntriesToDay,
    setActiveTab,
    scannerPrefillOutside,
    setScannerPrefillOutside
  } = useApp();

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [userHint, setUserHint] = useState('');
  const [analysing, setAnalysing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [analysisResult, setAnalysisResult] = useState(null);
  const [editableMealName, setEditableMealName] = useState('');
  const [editableItems, setEditableItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Lunch');
  const [isOutsideFood, setIsOutsideFood] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (scannerPrefillOutside) {
      setIsOutsideFood(true);
      setSelectedCategory('Outside food');
      setScannerPrefillOutside(false);
    }
  }, [scannerPrefillOutside, setScannerPrefillOutside]);

  const handleCapacitorOrFileCapture = async (mode) => {
    setErrorMessage('');
    try {
      const captured = await captureOrPickMealImage(mode);
      if (captured) {
        setSelectedImage(captured);
        setAnalysisResult(null);
        setEditableItems([]);
      }
    } catch {
      if (mode === 'camera' && cameraInputRef.current) {
        cameraInputRef.current.click();
      } else if (galleryInputRef.current) {
        galleryInputRef.current.click();
      }
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage('');
    try {
      const compressed = await readFileAsCompressedImage(file);
      setSelectedImage(compressed);
      setAnalysisResult(null);
      setEditableItems([]);
    } catch (err) {
      setErrorMessage(err.message || 'Could not load image.');
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setEditableItems([]);
    setErrorMessage('');
  };

  const handleRunGeminiAnalysis = async () => {
    if (!selectedImage?.base64Image) {
      setErrorMessage('Please take a photo or select a meal image from your gallery first.');
      return;
    }

    setAnalysing(true);
    setErrorMessage('');
    try {
      const result = await analyseMealWithGemini({
        base64Image: selectedImage.base64Image,
        mimeType: selectedImage.mimeType,
        userHint
      });

      setAnalysisResult(result);
      setEditableMealName(result.meal_name || 'Indian Meal');
      setEditableItems(result.food_items || []);
      if (result.suggested_category && MEAL_CATEGORIES.includes(result.suggested_category)) {
        setSelectedCategory(result.suggested_category);
      }
      if (result.is_likely_outside_food) {
        setIsOutsideFood(true);
      }
    } catch (err) {
      setErrorMessage(
        err.message ||
          'Could not complete AI nutrition analysis. Check your internet connection or backend proxy configuration.'
      );
    } finally {
      setAnalysing(false);
    }
  };

  const handleLoadIndianTemplateForEditing = (templateType) => {
    setErrorMessage('');
    let sampleItems = [];
    let mealTitle = 'Indian Home Lunch';
    let cat = 'Lunch';
    let outside = false;

    if (templateType === 'thali') {
      mealTitle = 'Indian Chapati & Dal Lunch';
      cat = 'Lunch';
      outside = false;
      sampleItems = [
        {
          id: `item_${Date.now()}_1`,
          name: 'Chapati',
          quantity: 2,
          unit: 'pieces',
          estimated_weight_g: 80,
          calories_kcal: 240,
          protein_g: 7,
          carbs_g: 42,
          fat_g: 5,
          fibre_g: 6
        },
        {
          id: `item_${Date.now()}_2`,
          name: 'Dal Tadka',
          quantity: 1,
          unit: 'bowl',
          estimated_weight_g: 150,
          calories_kcal: 180,
          protein_g: 10,
          carbs_g: 25,
          fat_g: 5,
          fibre_g: 6
        },
        {
          id: `item_${Date.now()}_3`,
          name: 'Mixed Veg Sabzi',
          quantity: 1,
          unit: 'bowl',
          estimated_weight_g: 150,
          calories_kcal: 155,
          protein_g: 3.5,
          carbs_g: 16,
          fat_g: 8,
          fibre_g: 4.5
        }
      ];
    } else if (templateType === 'breakfast') {
      mealTitle = 'Indian Morning Breakfast';
      cat = 'Breakfast';
      outside = false;
      sampleItems = [
        {
          id: `item_${Date.now()}_1`,
          name: 'Kanda Poha',
          quantity: 1,
          unit: 'plate',
          estimated_weight_g: 180,
          calories_kcal: 250,
          protein_g: 5,
          carbs_g: 44,
          fat_g: 6,
          fibre_g: 2.5
        },
        {
          id: `item_${Date.now()}_2`,
          name: 'Masala Chai',
          quantity: 1,
          unit: 'cup',
          estimated_weight_g: 150,
          calories_kcal: 95,
          protein_g: 2.5,
          carbs_g: 14,
          fat_g: 3,
          fibre_g: 0
        }
      ];
    } else {
      mealTitle = 'Mumbai Street Snack';
      cat = 'Outside food';
      outside = true;
      sampleItems = [
        {
          id: `item_${Date.now()}_1`,
          name: 'Vada Pav',
          quantity: 1,
          unit: 'piece',
          estimated_weight_g: 130,
          calories_kcal: 300,
          protein_g: 6,
          carbs_g: 42,
          fat_g: 12,
          fibre_g: 2.5
        }
      ];
    }

    const totals = calculateItemsTotals(sampleItems);
    setAnalysisResult({
      meal_name: mealTitle,
      food_items: sampleItems,
      totals,
      confidence: 'medium',
      uncertainties: [
        'Oil or ghee quantity used during preparation can vary by 40–90 kcal per serving. Adjust values below if needed.'
      ]
    });
    setEditableMealName(mealTitle);
    setEditableItems(sampleItems);
    setSelectedCategory(cat);
    setIsOutsideFood(outside);
  };

  const handleItemFieldChange = (id, field, value) => {
    setEditableItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === 'quantity') {
          return scaleFoodItemByQuantity(item, value);
        }
        if (field === 'name' || field === 'unit') {
          return { ...item, [field]: value };
        }
        return {
          ...item,
          [field]: Math.max(0, Number(value) || 0)
        };
      })
    );
  };

  const handleRemoveFoodItem = (id) => {
    setEditableItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddMissingItem = (presetName = '') => {
    const preset = INDIAN_FOOD_CATALOG.find((p) => p.name === presetName);
    const newItem = preset
      ? {
          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: preset.name,
          quantity: preset.quantity || 1,
          unit: preset.unit || 'serving',
          estimated_weight_g: preset.weight_g || 150,
          calories_kcal: preset.calories_kcal,
          protein_g: preset.protein_g,
          carbs_g: preset.carbs_g,
          fat_g: preset.fat_g,
          fibre_g: preset.fibre_g || 0
        }
      : {
          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: 'New Food Item',
          quantity: 1,
          unit: 'serving',
          estimated_weight_g: 100,
          calories_kcal: 150,
          protein_g: 5,
          carbs_g: 20,
          fat_g: 5,
          fibre_g: 2
        };

    setEditableItems((prev) => [...prev, newItem]);
  };

  const currentTotals = calculateItemsTotals(editableItems);

  const handleConfirmAndSave = async () => {
    if (editableItems.length === 0) {
      setErrorMessage('Please keep at least one food item before saving.');
      return;
    }

    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const totalWeightG = editableItems.reduce(
        (sum, item) => sum + (Number(item.estimated_weight_g) || 100),
        0
      );

      const formattedSubItems = editableItems.map((item, idx) => ({
        id: item.id || `sub_${Date.now()}_${idx}`,
        name: item.name || 'Food Item',
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'serving',
        weightG: Number(item.estimated_weight_g) || 100,
        calories: Math.round(Number(item.calories_kcal) || 0),
        protein: Math.round((Number(item.protein_g) || 0) * 10) / 10,
        carbs: Math.round((Number(item.carbs_g) || 0) * 10) / 10,
        fat: Math.round((Number(item.fat_g) || 0) * 10) / 10,
        fibre: Math.round((Number(item.fibre_g) || 0) * 10) / 10
      }));

      const singleMealEntry = {
        id: `ai_meal_${Date.now()}`,
        name:
          editableItems.length === 1
            ? editableItems[0].name || editableMealName || 'Meal'
            : editableMealName || 'Indian Thali / Meal',
        quantity: editableItems.length === 1 ? Number(editableItems[0].quantity) || 1 : 1,
        unit:
          editableItems.length === 1
            ? editableItems[0].unit || 'serving'
            : `${editableItems.length} items`,
        weightG: Math.round(totalWeightG),
        category: selectedCategory,
        isOutsideFood: Boolean(isOutsideFood || selectedCategory === 'Outside food'),
        calories: Math.round(Number(currentTotals.calories_kcal) || 0),
        protein: Math.round((Number(currentTotals.protein_g) || 0) * 10) / 10,
        carbs: Math.round((Number(currentTotals.carbs_g) || 0) * 10) / 10,
        fat: Math.round((Number(currentTotals.fat_g) || 0) * 10) / 10,
        fibre: Math.round((Number(currentTotals.fibre_g) || 0) * 10) / 10,
        consumedAt: nowIso,
        notes: '',
        source: 'crown_ai',
        subItems: editableItems.length > 1 ? formattedSubItems : []
      };

      await addFoodEntriesToDay(
        [singleMealEntry],
        undefined,
        selectedImage?.thumbnailDataUrl || null
      );

      setSelectedImage(null);
      setAnalysisResult(null);
      setEditableItems([]);
      setActiveTab('diary');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save nutrition data.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-crown-blue mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              CROWN AI NUTRITION
            </div>
            <h1 className="text-xl font-bold text-crown-text">AI Food Scanner</h1>
            <p className="text-xs text-crown-muted mt-0.5">
              Snap or upload a meal photo to detect Indian & everyday foods, estimate macros, and edit portions before saving.
            </p>
          </div>
        </div>

        {!isOnline && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
            <WifiOff className="w-5 h-5 text-crown-warning shrink-0 mt-0.5" />
            <div className="text-xs text-crown-text">
              <span className="font-bold">Offline Mode:</span> AI photograph recognition requires an internet connection. While offline, you can use the interactive Indian Meal Builder below or log meals manually.
            </div>
          </div>
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {!selectedImage ? (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => handleCapacitorOrFileCapture('camera')}
              className="p-6 rounded-xl border-2 border-dashed border-crown-blue/40 bg-blue-50/40 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-crown-blue text-white flex items-center justify-center mb-3 shadow-xs">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-crown-navy">Take Photo</span>
              <span className="text-xs text-crown-muted mt-1">
                Capture your plate using Android camera
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleCapacitorOrFileCapture('gallery')}
              className="p-6 rounded-xl border-2 border-dashed border-crown-border bg-crown-input hover:bg-slate-100 transition-colors flex flex-col items-center justify-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-crown-navy text-white flex items-center justify-center mb-3 shadow-xs">
                <ImageIcon className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-crown-navy">Upload from Gallery</span>
              <span className="text-xs text-crown-muted mt-1">
                Select an existing meal photograph
              </span>
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-crown-border bg-slate-900 max-h-80 flex items-center justify-center">
              <img
                src={selectedImage.dataUrl}
                alt="Selected Meal Preview"
                className="max-h-80 w-auto object-contain"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCapacitorOrFileCapture('camera')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-xs font-semibold text-crown-text hover:bg-slate-100"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retake Photo
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-crown-error hover:bg-red-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Image
                </button>
              </div>
              <span className="text-[11px] text-crown-muted">
                Compressed locally ({selectedImage.width}×{selectedImage.height}px) • Never uploaded to cloud storage
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-crown-text mb-1">
                Optional Preparation Context (helps Gemini estimate hidden oil/ghee/ingredients)
              </label>
              <input
                type="text"
                value={userHint}
                onChange={(e) => setUserHint(e.target.value)}
                placeholder="e.g., Home-cooked with 1 tsp ghee, 2 chapatis and toor dal, or restaurant butter paneer"
                className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text focus:outline-none focus:border-crown-blue"
              />
            </div>

            {!analysing && (
              <button
                type="button"
                disabled={!isOnline}
                onClick={handleRunGeminiAnalysis}
                className="w-full py-3 px-4 rounded-xl bg-crown-blue text-white text-sm font-bold shadow-xs hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Analyse Meal with Gemini AI
              </button>
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-crown-border flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-crown-muted font-medium">
            Or build/edit a structured Indian meal template directly:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleLoadIndianTemplateForEditing('breakfast')}
              className="px-2.5 py-1 rounded-lg bg-crown-input hover:bg-blue-50 text-xs font-semibold text-crown-navy border border-crown-border"
            >
              Poha & Chai Breakfast
            </button>
            <button
              type="button"
              onClick={() => handleLoadIndianTemplateForEditing('thali')}
              className="px-2.5 py-1 rounded-lg bg-crown-input hover:bg-blue-50 text-xs font-semibold text-crown-navy border border-crown-border"
            >
              Chapati, Dal & Sabzi Lunch
            </button>
            <button
              type="button"
              onClick={() => handleLoadIndianTemplateForEditing('street')}
              className="px-2.5 py-1 rounded-lg bg-crown-input hover:bg-blue-50 text-xs font-semibold text-crown-navy border border-crown-border"
            >
              Street Vada Pav
            </button>
          </div>
        </div>
      </div>

      {analysing && (
        <div className="bg-crown-card border border-crown-border rounded-xl p-8 shadow-card text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-crown-blue flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-base font-bold text-crown-text">Analysing your meal...</h2>
          <p className="text-xs text-crown-muted max-w-md mx-auto">
            Identifying Indian and everyday dishes, estimating portion weights, and calculating macronutrients.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-crown-error shrink-0 mt-0.5" />
          <div className="text-xs text-crown-error">
            <div className="font-bold">Nutrition Analysis Notice</div>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {analysisResult && !analysing && (
        <div className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-crown-border">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-crown-muted">
                Detected Meal Name (Editable)
              </label>
              <input
                type="text"
                value={editableMealName}
                onChange={(e) => setEditableMealName(e.target.value)}
                className="mt-1 w-full sm:w-80 px-3 py-1.5 rounded-lg bg-crown-input border border-crown-border text-sm font-bold text-crown-text focus:outline-none focus:border-crown-blue"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-crown-muted">AI Confidence:</span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  analysisResult.confidence === 'high'
                    ? 'bg-emerald-50 text-crown-teal border border-emerald-200'
                    : analysisResult.confidence === 'low'
                    ? 'bg-red-50 text-crown-error border border-red-200'
                    : 'bg-amber-50 text-crown-warning border border-amber-200'
                }`}
              >
                {analysisResult.confidence}
              </span>
            </div>
          </div>

          {analysisResult.uncertainties?.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
              <div className="text-xs font-bold text-crown-warning flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Estimation Uncertainties & Preparation Notes
              </div>
              <ul className="list-disc list-inside text-xs text-crown-text space-y-0.5">
                {analysisResult.uncertainties.map((unc, i) => (
                  <li key={i}>{unc}</li>
                ))}
              </ul>
              <p className="text-[11px] text-crown-muted pt-1">
                Visual nutrition estimates are approximate. Please review and adjust quantities, cooking oil/ghee, or macros below before confirming.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-crown-text">
                Detected Food Items ({editableItems.length})
              </h3>
              <div className="flex items-center gap-2">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddMissingItem(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text"
                >
                  <option value="">+ Quick-Add Indian Dish...</option>
                  {INDIAN_FOOD_CATALOG.map((dish) => (
                    <option key={dish.name} value={dish.name}>
                      {dish.name} ({dish.calories_kcal} kcal)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleAddMissingItem('')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-crown-blue text-xs font-semibold hover:bg-blue-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Custom Item
                </button>
              </div>
            </div>

            {editableItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-crown-input border border-crown-border space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-semibold text-crown-muted mb-0.5">
                      Food Name
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemFieldChange(item.id, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-crown-border text-xs font-semibold text-crown-text"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-crown-muted mb-0.5">
                      Qty (Scales)
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      value={item.quantity}
                      onChange={(e) => handleItemFieldChange(item.id, 'quantity', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-crown-border text-xs text-crown-text"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-crown-muted mb-0.5">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleItemFieldChange(item.id, 'unit', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-crown-border text-xs text-crown-text"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-crown-muted mb-0.5">
                      Weight (g)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.estimated_weight_g}
                      onChange={(e) =>
                        handleItemFieldChange(item.id, 'estimated_weight_g', e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-crown-border text-xs text-crown-text"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveFoodItem(item.id)}
                      className="p-1.5 rounded-lg text-crown-muted hover:text-crown-error hover:bg-red-50"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-crown-muted mb-0.5">
                      Calories (kcal)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.calories_kcal}
                      onChange={(e) =>
                        handleItemFieldChange(item.id, 'calories_kcal', e.target.value)
                      }
                      className="w-full px-2 py-1 rounded-md bg-white border border-crown-border text-xs font-bold text-crown-navy"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-crown-muted mb-0.5">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={item.protein_g}
                      onChange={(e) => handleItemFieldChange(item.id, 'protein_g', e.target.value)}
                      className="w-full px-2 py-1 rounded-md bg-white border border-crown-border text-xs text-crown-text"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-crown-muted mb-0.5">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={item.carbs_g}
                      onChange={(e) => handleItemFieldChange(item.id, 'carbs_g', e.target.value)}
                      className="w-full px-2 py-1 rounded-md bg-white border border-crown-border text-xs text-crown-text"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-crown-muted mb-0.5">
                      Fat (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={item.fat_g}
                      onChange={(e) => handleItemFieldChange(item.id, 'fat_g', e.target.value)}
                      className="w-full px-2 py-1 rounded-md bg-white border border-crown-border text-xs text-crown-text"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-crown-muted mb-0.5">
                      Fibre (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={item.fibre_g}
                      onChange={(e) => handleItemFieldChange(item.id, 'fibre_g', e.target.value)}
                      className="w-full px-2 py-1 rounded-md bg-white border border-crown-border text-xs text-crown-text"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
            <div className="text-xs font-bold uppercase tracking-wider text-crown-navy mb-2">
              Recalculated Meal Totals
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white border border-crown-border">
                <div className="text-[10px] text-crown-muted">Calories</div>
                <div className="text-sm font-bold text-crown-navy">
                  {currentTotals.calories_kcal} kcal
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-crown-border">
                <div className="text-[10px] text-crown-muted">Protein</div>
                <div className="text-sm font-bold text-crown-teal">
                  {currentTotals.protein_g} g
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-crown-border">
                <div className="text-[10px] text-crown-muted">Carbs</div>
                <div className="text-sm font-bold text-crown-text">
                  {currentTotals.carbs_g} g
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-crown-border">
                <div className="text-[10px] text-crown-muted">Fat</div>
                <div className="text-sm font-bold text-crown-text">
                  {currentTotals.fat_g} g
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-crown-border">
                <div className="text-[10px] text-crown-muted">Fibre</div>
                <div className="text-sm font-bold text-crown-text">
                  {currentTotals.fibre_g} g
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-crown-text mb-1.5">
                Confirm Meal Category
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {MEAL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      if (cat === 'Outside food') setIsOutsideFood(true);
                    }}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                      selectedCategory === cat
                        ? 'bg-crown-blue text-white border-crown-blue'
                        : 'bg-crown-input text-crown-text border-crown-border hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-crown-text mb-1.5">
                Home vs. Outside Classification
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsOutsideFood(false)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                    !isOutsideFood
                      ? 'bg-crown-teal text-white border-crown-teal'
                      : 'bg-crown-input text-crown-text border-crown-border'
                  }`}
                >
                  Home-Cooked Food
                </button>
                <button
                  type="button"
                  onClick={() => setIsOutsideFood(true)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                    isOutsideFood
                      ? 'bg-crown-navy text-white border-crown-navy'
                      : 'bg-crown-input text-crown-text border-crown-border'
                  }`}
                >
                  Outside / Restaurant Food
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-crown-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleRemoveImage}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-crown-muted hover:bg-crown-input"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleConfirmAndSave}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-crown-teal text-white text-xs font-bold shadow-xs hover:opacity-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {saving ? 'Saving...' : 'Confirm & Save to Food Diary'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
