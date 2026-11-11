export const MEAL_CATEGORIES = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Drink',
  'Outside food'
];

export const INDIAN_FOOD_CATALOG = [
  { name: 'Oats Porridge (Cooked)', category: 'Breakfast', unit: 'bowl', weight_g: 200, calories_kcal: 165, protein_g: 6, carbs_g: 27, fat_g: 3.5, fibre_g: 4, isOutside: false },
  { name: 'Kanda Poha', category: 'Breakfast', unit: 'plate', weight_g: 180, calories_kcal: 250, protein_g: 5, carbs_g: 44, fat_g: 6, fibre_g: 2.5, isOutside: false },
  { name: 'Rava Upma', category: 'Breakfast', unit: 'bowl', weight_g: 180, calories_kcal: 240, protein_g: 6, carbs_g: 38, fat_g: 7, fibre_g: 2, isOutside: false },
  { name: 'Steamed Idli', category: 'Breakfast', unit: 'pieces', quantity: 2, weight_g: 100, calories_kcal: 130, protein_g: 4, carbs_g: 26, fat_g: 0.8, fibre_g: 1.5, isOutside: false },
  { name: 'Masala Dosa', category: 'Breakfast', unit: 'piece', weight_g: 180, calories_kcal: 340, protein_g: 7, carbs_g: 48, fat_g: 13, fibre_g: 3.5, isOutside: false },
  { name: 'Aloo Paratha', category: 'Breakfast', unit: 'piece', weight_g: 120, calories_kcal: 290, protein_g: 6, carbs_g: 40, fat_g: 11, fibre_g: 3.5, isOutside: false },
  { name: 'Methi Thepla', category: 'Breakfast', unit: 'pieces', quantity: 2, weight_g: 90, calories_kcal: 240, protein_g: 6, carbs_g: 34, fat_g: 9, fibre_g: 4, isOutside: false },
  { name: 'Veg Grilled Sandwich', category: 'Breakfast', unit: 'piece', weight_g: 160, calories_kcal: 280, protein_g: 8, carbs_g: 38, fat_g: 10, fibre_g: 3, isOutside: false },
  { name: 'Wheat Chapati / Roti', category: 'Lunch', unit: 'pieces', quantity: 2, weight_g: 80, calories_kcal: 220, protein_g: 6.8, carbs_g: 42, fat_g: 3, fibre_g: 5.5, isOutside: false },
  { name: 'Toor Dal Tadka', category: 'Lunch', unit: 'bowl', weight_g: 150, calories_kcal: 180, protein_g: 9.5, carbs_g: 24, fat_g: 5, fibre_g: 5, isOutside: false },
  { name: 'Steamed White Rice', category: 'Lunch', unit: 'bowl', weight_g: 150, calories_kcal: 195, protein_g: 4, carbs_g: 43, fat_g: 0.5, fibre_g: 0.8, isOutside: false },
  { name: 'Moong Dal Khichdi', category: 'Dinner', unit: 'bowl', weight_g: 220, calories_kcal: 260, protein_g: 9, carbs_g: 44, fat_g: 5.5, fibre_g: 4, isOutside: false },
  { name: 'Mixed Veg Sabzi', category: 'Lunch', unit: 'bowl', weight_g: 150, calories_kcal: 155, protein_g: 3.5, carbs_g: 16, fat_g: 8, fibre_g: 4.5, isOutside: false },
  { name: 'Rajma Masala', category: 'Lunch', unit: 'bowl', weight_g: 160, calories_kcal: 230, protein_g: 11, carbs_g: 32, fat_g: 6.5, fibre_g: 7, isOutside: false },
  { name: 'Chole Masala', category: 'Lunch', unit: 'bowl', weight_g: 160, calories_kcal: 245, protein_g: 11, carbs_g: 34, fat_g: 7.5, fibre_g: 7.5, isOutside: false },
  { name: 'Paneer Bhurji / Curry', category: 'Dinner', unit: 'bowl', weight_g: 150, calories_kcal: 310, protein_g: 16, carbs_g: 9, fat_g: 23, fibre_g: 1.5, isOutside: false },
  { name: 'Plain Curd / Dahi', category: 'Lunch', unit: 'bowl', weight_g: 100, calories_kcal: 62, protein_g: 3.5, carbs_g: 4.5, fat_g: 3.2, fibre_g: 0, isOutside: false },
  { name: 'Vada Pav', category: 'Outside food', unit: 'piece', weight_g: 130, calories_kcal: 300, protein_g: 6, carbs_g: 42, fat_g: 12, fibre_g: 2.5, isOutside: true },
  { name: 'Pav Bhaji', category: 'Outside food', unit: 'plate', weight_g: 280, calories_kcal: 460, protein_g: 10, carbs_g: 58, fat_g: 20, fibre_g: 5, isOutside: true },
  { name: 'Samosa', category: 'Outside food', unit: 'piece', weight_g: 90, calories_kcal: 260, protein_g: 4.5, carbs_g: 30, fat_g: 14, fibre_g: 2, isOutside: true },
  { name: 'Pani Puri (6 puris)', category: 'Outside food', unit: 'plate', weight_g: 150, calories_kcal: 220, protein_g: 4, carbs_g: 36, fat_g: 6.5, fibre_g: 2.5, isOutside: true },
  { name: 'Bhel Puri', category: 'Outside food', unit: 'plate', weight_g: 150, calories_kcal: 270, protein_g: 6, carbs_g: 42, fat_g: 8.5, fibre_g: 3, isOutside: true },
  { name: 'Kutchi Dabeli', category: 'Outside food', unit: 'piece', weight_g: 130, calories_kcal: 290, protein_g: 6, carbs_g: 44, fat_g: 10, fibre_g: 2.5, isOutside: true },
  { name: 'Misal Pav', category: 'Outside food', unit: 'plate', weight_g: 280, calories_kcal: 440, protein_g: 13, carbs_g: 52, fat_g: 19, fibre_g: 6, isOutside: true },
  { name: 'Chicken / Veg Biryani', category: 'Outside food', unit: 'plate', weight_g: 320, calories_kcal: 540, protein_g: 22, carbs_g: 64, fat_g: 21, fibre_g: 3.5, isOutside: true },
  { name: 'Butter Naan', category: 'Outside food', unit: 'piece', weight_g: 95, calories_kcal: 285, protein_g: 7, carbs_g: 44, fat_g: 9, fibre_g: 2, isOutside: true },
  { name: 'Butter Chicken', category: 'Outside food', unit: 'bowl', weight_g: 220, calories_kcal: 490, protein_g: 28, carbs_g: 14, fat_g: 36, fibre_g: 1.5, isOutside: true },
  { name: 'Paneer Butter Masala', category: 'Outside food', unit: 'bowl', weight_g: 220, calories_kcal: 470, protein_g: 17, carbs_g: 18, fat_g: 37, fibre_g: 2, isOutside: true },
  { name: 'Restaurant Indian Thali', category: 'Outside food', unit: 'thali', weight_g: 550, calories_kcal: 780, protein_g: 22, carbs_g: 105, fat_g: 30, fibre_g: 11, isOutside: true },
  { name: 'Veg Fried Rice', category: 'Outside food', unit: 'plate', weight_g: 250, calories_kcal: 410, protein_g: 8, carbs_g: 62, fat_g: 14, fibre_g: 3, isOutside: true },
  { name: 'Hakka Noodles', category: 'Outside food', unit: 'plate', weight_g: 240, calories_kcal: 420, protein_g: 9, carbs_g: 60, fat_g: 16, fibre_g: 3, isOutside: true },
  { name: 'Masala Chai', category: 'Drink', unit: 'cup', weight_g: 150, calories_kcal: 95, protein_g: 2.5, carbs_g: 14, fat_g: 3, fibre_g: 0, isOutside: false }
];

export function calculateItemsTotals(items = []) {
  return items.reduce(
    (acc, item) => ({
      calories_kcal: Math.round(acc.calories_kcal + (Number(item.calories_kcal) || 0)),
      protein_g: Math.round((acc.protein_g + (Number(item.protein_g) || 0)) * 10) / 10,
      carbs_g: Math.round((acc.carbs_g + (Number(item.carbs_g) || 0)) * 10) / 10,
      fat_g: Math.round((acc.fat_g + (Number(item.fat_g) || 0)) * 10) / 10,
      fibre_g: Math.round((acc.fibre_g + (Number(item.fibre_g) || 0)) * 10) / 10,
      sugar_g: Math.round((acc.sugar_g + (Number(item.sugar_g) || 0)) * 10) / 10,
      sodium_mg: Math.round(acc.sodium_mg + (Number(item.sodium_mg) || 0))
    }),
    { calories_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0, sugar_g: 0, sodium_mg: 0 }
  );
}

export function calculateDailyNutritionSummary(foodEntries = []) {
  const summary = {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    totalFibre: 0,
    homeCalories: 0,
    outsideCalories: 0,
    outsideCount: 0,
    homeCount: 0,
    mealCount: foodEntries.length,
    byCategory: {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snack: [],
      Drink: [],
      'Outside food': []
    }
  };

  foodEntries.forEach((entry) => {
    const cal = Number(entry.calories) || 0;
    const pro = Number(entry.protein) || 0;
    const carb = Number(entry.carbs) || 0;
    const fat = Number(entry.fat) || 0;
    const fib = Number(entry.fibre) || 0;
    const isOutside = Boolean(entry.isOutsideFood || entry.category === 'Outside food');

    summary.totalCalories += cal;
    summary.totalProtein += pro;
    summary.totalCarbs += carb;
    summary.totalFat += fat;
    summary.totalFibre += fib;

    if (isOutside) {
      summary.outsideCalories += cal;
      summary.outsideCount += 1;
    } else {
      summary.homeCalories += cal;
      summary.homeCount += 1;
    }

    const cat = summary.byCategory[entry.category] ? entry.category : 'Snack';
    summary.byCategory[cat].push(entry);
    if (isOutside && cat !== 'Outside food') {
      summary.byCategory['Outside food'].push(entry);
    }
  });

  summary.totalCalories = Math.round(summary.totalCalories);
  summary.totalProtein = Math.round(summary.totalProtein * 10) / 10;
  summary.totalCarbs = Math.round(summary.totalCarbs * 10) / 10;
  summary.totalFat = Math.round(summary.totalFat * 10) / 10;
  summary.totalFibre = Math.round(summary.totalFibre * 10) / 10;
  summary.homeCalories = Math.round(summary.homeCalories);
  summary.outsideCalories = Math.round(summary.outsideCalories);

  return summary;
}

export function scaleFoodItemByQuantity(item, newQuantity) {
  const oldQty = Number(item.quantity) || 1;
  const targetQty = Math.max(0.25, Number(newQuantity) || 1);
  const ratio = targetQty / oldQty;

  return {
    ...item,
    quantity: targetQty,
    estimated_weight_g: Math.max(1, Math.round((Number(item.estimated_weight_g) || 100) * ratio)),
    calories_kcal: Math.max(0, Math.round((Number(item.calories_kcal) || 0) * ratio)),
    protein_g: Math.max(0, Math.round((Number(item.protein_g) || 0) * ratio * 10) / 10),
    carbs_g: Math.max(0, Math.round((Number(item.carbs_g) || 0) * ratio * 10) / 10),
    fat_g: Math.max(0, Math.round((Number(item.fat_g) || 0) * ratio * 10) / 10),
    fibre_g: Math.max(0, Math.round((Number(item.fibre_g) || 0) * ratio * 10) / 10)
  };
}

export function groupFoodEntriesByMeal(foodEntries = []) {
  const grouped = [];
  const legacyBuckets = {};

  foodEntries.forEach((entry) => {
    const mealMatch =
      typeof entry.notes === 'string' && entry.notes.startsWith('Meal:')
        ? entry.notes.replace(/^Meal:\s*/i, '').trim()
        : null;

    if (mealMatch && !Array.isArray(entry.subItems)) {
      const timeKey = entry.consumedAt ? entry.consumedAt.slice(0, 16) : 'same_day';
      const bucketKey = `${mealMatch}__${entry.category}__${timeKey}`;
      if (!legacyBuckets[bucketKey]) {
        const groupObj = {
          id: entry.id,
          allEntryIds: [entry.id],
          name: mealMatch,
          quantity: 1,
          unit: 'meal',
          weightG: Number(entry.weightG) || 0,
          category: entry.category || 'Lunch',
          isOutsideFood: Boolean(entry.isOutsideFood),
          calories: Number(entry.calories) || 0,
          protein: Number(entry.protein) || 0,
          carbs: Number(entry.carbs) || 0,
          fat: Number(entry.fat) || 0,
          fibre: Number(entry.fibre) || 0,
          consumedAt: entry.consumedAt,
          notes: '',
          source: entry.source || 'crown_ai',
          subItems: [
            {
              id: entry.id,
              name: entry.name,
              quantity: entry.quantity,
              unit: entry.unit,
              weightG: entry.weightG,
              calories: entry.calories,
              protein: entry.protein,
              carbs: entry.carbs,
              fat: entry.fat,
              fibre: entry.fibre
            }
          ]
        };
        legacyBuckets[bucketKey] = groupObj;
        grouped.push(groupObj);
      } else {
        const bucket = legacyBuckets[bucketKey];
        bucket.allEntryIds.push(entry.id);
        bucket.weightG = Math.round(bucket.weightG + (Number(entry.weightG) || 0));
        bucket.calories = Math.round(bucket.calories + (Number(entry.calories) || 0));
        bucket.protein = Math.round((bucket.protein + (Number(entry.protein) || 0)) * 10) / 10;
        bucket.carbs = Math.round((bucket.carbs + (Number(entry.carbs) || 0)) * 10) / 10;
        bucket.fat = Math.round((bucket.fat + (Number(entry.fat) || 0)) * 10) / 10;
        bucket.fibre = Math.round((bucket.fibre + (Number(entry.fibre) || 0)) * 10) / 10;
        bucket.subItems.push({
          id: entry.id,
          name: entry.name,
          quantity: entry.quantity,
          unit: entry.unit,
          weightG: entry.weightG,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          fibre: entry.fibre
        });
      }
    } else {
      grouped.push({
        ...entry,
        allEntryIds: [entry.id],
        subItems: Array.isArray(entry.subItems) ? entry.subItems : []
      });
    }
  });

  return grouped;
}
