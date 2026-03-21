
// mockData.js
// All mock data and helper functions for FitTrack Phase 1.


// Survey data collected at registration.
// currentWeight + targetWeight + duration → system calculates weekly rate
export const MOCK_USERS = [
  {
    id: 1,
    name: "Alex Johnson",
    email: "alex@fittrack.com",
    password: "password123",
    gender: "male",
    age: 22,
    currentWeight: 78,       // kg
    targetWeight: 85,         // kg - wants to gain
    height: 180,              // cm
    activityLevel: "moderately_active",
    goal: "gain_muscle",
    duration: 6,              // months - null if ongoing
    isOngoing: false,
  },
  {
    id: 2,
    name: "Sara Ahmed",
    email: "sara@fittrack.com",
    password: "password123",
    gender: "female",
    age: 24,
    currentWeight: 72,
    targetWeight: 62,         // wants to lose 10kg
    height: 165,
    activityLevel: "lightly_active",
    goal: "lose_weight",
    duration: 3,              // months
    isOngoing: false,
  },
  {
    id: 3,
    name: "Omar Khalil",
    email: "omar@fittrack.com",
    password: "password123",
    gender: "male",
    age: 28,
    currentWeight: 90,
    targetWeight: 90,         // no change - maintain
    height: 175,
    activityLevel: "very_active",
    goal: "maintain",
    duration: null,
    isOngoing: true,
  },
  {
    id: 4,
    name: "Lara Nassar",
    email: "lara@fittrack.com",
    password: "password123",
    gender: "female",
    age: 21,
    currentWeight: 55,
    targetWeight: 60,         // wants to gain
    height: 160,
    activityLevel: "sedentary",
    goal: "bulk",
    duration: 4,
    isOngoing: false,
  },
];

// - Fitness Goals 
export const FITNESS_GOALS = [
  { id: "lose_weight", label: "Lose Weight", desc: "Calorie deficit to reduce body fat." },
  { id: "maintain",    label: "Maintain",    desc: "Maintain current weight and composition." },
  { id: "gain_muscle", label: "Gain Muscle", desc: "Slight surplus with high protein to build muscle." },
  { id: "bulk",        label: "Bulk",        desc: "Larger surplus to gain overall body weight." },
];

//  Nutrition Calculator 
// Takes the user's full profile and returns personalised daily macro targets.
//
// New logic:
//   - Calculates weekly rate from (currentWeight - targetWeight) / (duration in weeks)
//   - If ongoing → uses safe default rates per goal
//  
export function calcNutritionTargets(user) {
  if (!user) {
    return { kcal: 2000, protein: 140, carbs: 220, fat: 65, weeklyRate: 0, isAggressive: false, durationWeeks: null };
  }

  //  Step 1: BMR (Mifflin-St Jeor) 
  let bmr;
  if (user.gender === "female") {
    bmr = 10 * user.currentWeight + 6.25 * user.height - 5 * user.age - 161;
  } else {
    bmr = 10 * user.currentWeight + 6.25 * user.height - 5 * user.age + 5;
  }

  //  Step 2: TDEE = BMR × activity multiplier 
  const activityMultipliers = {
    sedentary:         1.2,
    lightly_active:    1.375,
    moderately_active: 1.55,
    very_active:       1.725,
  };
  const tdee = bmr * (activityMultipliers[user.activityLevel] || 1.55);

  //  Step 3: Calculate weekly rate from goal + duration 
  // Convert months to weeks (1 month ≈ 4.33 weeks)
  const durationWeeks = user.isOngoing || !user.duration ? null : user.duration * 4.33;

  // Weight difference - positive means gaining, negative means losing
  const weightDiff = (user.targetWeight || user.currentWeight) - user.currentWeight;

  let weeklyRate = 0;
  let isAggressive = false;

  if (user.goal === "maintain" || user.isOngoing) {
    // Ongoing or maintain → use safe defaults
    const defaultRates = {
      lose_weight: 0.5,
      gain_muscle: 0.25,
      bulk:        0.5,
      maintain:    0,
    };
    weeklyRate = defaultRates[user.goal] || 0;

  } else if (durationWeeks && weightDiff !== 0) {
    // Calculate from target weight and duration
    weeklyRate = Math.abs(weightDiff) / durationWeeks;

    
  }

  //  Step 4: Daily calorie adjustment from weekly rate 
  // 1kg of body weight ≈ 7700 kcal
  const dailyAdjustment = (weeklyRate * 7700) / 7;

  let kcal;
  if (user.goal === "lose_weight") {
    kcal = Math.round(tdee - dailyAdjustment);
  } else if (user.goal === "maintain") {
    kcal = Math.round(tdee);
  } else {
    // gain_muscle or bulk
    kcal = Math.round(tdee + dailyAdjustment);
  }

  //  Step 5: Protein (g/kg, higher for muscle goals) 
  const proteinPerKg = {
    lose_weight: 1.6,
    maintain:    1.6,
    gain_muscle: 2.2,
    bulk:        1.8,
  };
  const protein = Math.round(user.currentWeight * (proteinPerKg[user.goal] || 1.6));

  //  Step 6: Fat (25% of calories) 
  const fat = Math.round((kcal * 0.25) / 9);

  //  Step 7: Carbs (remaining calories) 
  const remainingKcal = kcal - (protein * 4) - (fat * 9);
  const carbs = Math.max(20, Math.round(remainingKcal / 4));

  return {
    kcal:         Math.max(kcal, 1200),
    protein:      Math.max(protein, 50),
    carbs,
    fat:          Math.max(fat, 30),
    weeklyRate:   Math.round(weeklyRate * 100) / 100,
    durationWeeks,
  };
}

//  Meal Pool 
// 16 meals - recommender picks from these based on user targets + duration
export const MEAL_POOL = [
  // Breakfast
  { id: "B1", cat: "breakfast", name: "Oats & Protein Shake",      time: "07:30", kcal: 520, protein: 42, carbs: 62, fat: 8,  profile: "high_protein" },
  { id: "B2", cat: "breakfast", name: "Scrambled Eggs on Toast",   time: "07:30", kcal: 380, protein: 28, carbs: 30, fat: 14, profile: "balanced"     },
  { id: "B3", cat: "breakfast", name: "Egg White Omelette",        time: "07:00", kcal: 220, protein: 32, carbs: 8,  fat: 6,  profile: "low_cal"      },
  { id: "B4", cat: "breakfast", name: "Manakish Zaatar",           time: "08:00", kcal: 420, protein: 12, carbs: 56, fat: 16, profile: "high_carb"    },
  { id: "B5", cat: "breakfast", name: "Eggs, Avocado & Labneh",    time: "08:00", kcal: 540, protein: 34, carbs: 6,  fat: 42, profile: "high_fat"     },
  // Lunch
  { id: "L1", cat: "lunch",     name: "Grilled Chicken Rice Bowl", time: "13:00", kcal: 620, protein: 48, carbs: 68, fat: 12, profile: "high_protein" },
  { id: "L2", cat: "lunch",     name: "Chicken Tawook Salad",      time: "12:30", kcal: 360, protein: 44, carbs: 14, fat: 12, profile: "low_cal"      },
  { id: "L3", cat: "lunch",     name: "Mjaddara & Fattoush",       time: "13:00", kcal: 480, protein: 18, carbs: 72, fat: 10, profile: "high_carb"    },
  { id: "L4", cat: "lunch",     name: "Caesar Salad with Steak",   time: "13:00", kcal: 580, protein: 50, carbs: 8,  fat: 40, profile: "high_protein" },
  // Dinner
  { id: "D1", cat: "dinner",    name: "Grilled Kafta & Rice",      time: "19:00", kcal: 580, protein: 38, carbs: 52, fat: 20, profile: "balanced"     },
  { id: "D2", cat: "dinner",    name: "Samkeh Harra (Spicy Fish)", time: "19:00", kcal: 340, protein: 46, carbs: 12, fat: 11, profile: "low_cal"      },
  { id: "D3", cat: "dinner",    name: "Butter-Basted Salmon",      time: "19:00", kcal: 520, protein: 44, carbs: 4,  fat: 36, profile: "high_protein" },
  // Snack
  { id: "S1", cat: "snack",     name: "Greek Yogurt & Fruit",      time: "15:30", kcal: 220, protein: 18, carbs: 26, fat: 4,  profile: "balanced"     },
  { id: "S2", cat: "snack",     name: "Cottage Cheese & Apple",    time: "21:00", kcal: 180, protein: 14, carbs: 16, fat: 5,  profile: "low_cal"      },
  { id: "S3", cat: "snack",     name: "Protein Shake",             time: "21:00", kcal: 160, protein: 28, carbs: 8,  fat: 3,  profile: "high_protein" },
  { id: "S4", cat: "snack",     name: "Mixed Nuts & Banana",       time: "16:00", kcal: 310, protein: 8,  carbs: 34, fat: 16, profile: "high_carb"    },
];

//  Meal Recommender 
// Picks 4 meals (one per category) that together hit the user's daily targets.
//
// Now accounts for:
//   - Duration: short plans → prioritise specific profiles (e.g. low_cal for fast cut)
//   - Goal: which meal profiles to favour
//   - 3-day rotation via localStorage
//   - Within 10% tolerance of all 4 macro targets
export function recommendMeals(targets, todayKey, user) {
  //  Determine which meal profile to prioritise based on goal + duration 
  // Short duration = more aggressive = prioritise specific profile
  // Long duration / ongoing = balanced variety is fine

  const durationWeeks = targets.durationWeeks;
  const isShortPlan   = durationWeeks !== null && durationWeeks <= 8; // 2 months or less
  const isLongPlan    = durationWeeks === null || durationWeeks >= 26; // 6 months+ or ongoing

  // Which meal profile fits this user best
  let preferredProfile = "balanced";
  if (user) {
    if (user.goal === "lose_weight" && isShortPlan)  preferredProfile = "low_cal";
    if (user.goal === "lose_weight" && isLongPlan)   preferredProfile = "balanced";
    if (user.goal === "gain_muscle")                  preferredProfile = "high_protein";
    if (user.goal === "bulk")                         preferredProfile = "high_carb";
    if (user.goal === "maintain")                     preferredProfile = "balanced";
  }

  //  Filter out recently used meals (3-day rotation) 
  let available = MEAL_POOL.filter((meal) => !usedRecently(meal.id, todayKey));
  if (available.length < 6) available = [...MEAL_POOL]; // safety fallback

  //  Shuffle using date-seeded random (stable all day) 
  const seed = todayKey.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  let randomState = seed;

  function seededRandom() {
    randomState = (randomState * 1664525 + 1013904223) & 0xffffffff;
    return (randomState >>> 0) / 0xffffffff;
  }

  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  //  Sort: preferred profile meals come first within each category 
  // This means when we pick "the first available meal per category",
  // we're more likely to get a meal that fits the user's goal
  shuffled.sort((a, b) => {
    if (a.profile === preferredProfile && b.profile !== preferredProfile) return -1;
    if (b.profile === preferredProfile && a.profile !== preferredProfile) return 1;
    return 0;
  });

  //  Pick one meal per category 
  const categories = ["breakfast", "lunch", "dinner", "snack"];

  function pickOneMealPerCategory(mealList) {
    const result = [];
    for (const cat of categories) {
      const found = mealList.find((m) => m.cat === cat);
      if (found) result.push(found);
    }
    return result;
  }

  let combo = pickOneMealPerCategory(shuffled);

  //  Check if combo hits targets within 10% 
  function isGoodEnough(mealCombo) {
    let totalKcal = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    for (const meal of mealCombo) {
      totalKcal    += meal.kcal;
      totalProtein += meal.protein;
      totalCarbs   += meal.carbs;
      totalFat     += meal.fat;
    }
    const t = 0.10;
    const kcalOk    = totalKcal    >= targets.kcal    * (1 - t) && totalKcal    <= targets.kcal    * (1 + t);
    const proteinOk = totalProtein >= targets.protein * (1 - t) && totalProtein <= targets.protein * (1 + t);
    const carbsOk   = totalCarbs   >= targets.carbs   * (1 - t) && totalCarbs   <= targets.carbs   * (1 + t);
    const fatOk     = totalFat     >= targets.fat     * (1 - t) && totalFat     <= targets.fat     * (1 + t);
    return kcalOk && proteinOk && carbsOk && fatOk;
  }

  //  Try swapping meals if combo doesn't hit targets
  if (!isGoodEnough(combo)) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const catToSwap = categories[attempt % categories.length];
      const options   = shuffled.filter((m) => m.cat === catToSwap);
      if (options.length > 1) {
        const newMeal = options[attempt % options.length];
        combo = combo.map((m) => (m.cat === catToSwap ? newMeal : m));
        if (isGoodEnough(combo)) break;
      }
    }
  }

  //  Save selected meals to localStorage to enforce 3-day rotation
  saveMealDates(combo.map((m) => m.id), todayKey);

  return combo;
}

//  3-Day Rotation Helpers 
function getSavedDates() {
  try {
    return JSON.parse(localStorage.getItem("fittrack_meal_dates") || "{}");
  } catch {
    return {};
  }
}

function saveMealDates(mealIds, todayKey) {
  const saved = getSavedDates();
  for (const id of mealIds) {
    saved[id] = todayKey;
  }
  localStorage.setItem("fittrack_meal_dates", JSON.stringify(saved));
}

function usedRecently(mealId, todayKey) {
  const saved   = getSavedDates();
  const usedOn  = saved[mealId];
  if (!usedOn || usedOn === todayKey) return false;
  const today   = new Date(todayKey);
  const used    = new Date(usedOn);
  const daysApart = Math.round((today - used) / (1000 * 60 * 60 * 24));
  return daysApart < 3;
}

//  Meal Ingredients 
export const MEAL_INGREDIENTS = {
  B1: [
    { ingredientId: 15, portionG: 80,  label: "Oats (dry)"           },
    { ingredientId: 51, portionG: 30,  label: "Protein Shake Powder" },
    { ingredientId: 44, portionG: 250, label: "Milk (whole)"          },
  ],
  B2: [
    { ingredientId: 4,  portionG: 200, label: "Eggs (whole)"         },
    { ingredientId: 17, portionG: 80,  label: "Pita Bread"           },
    { ingredientId: 34, portionG: 10,  label: "Olive Oil"            },
    { ingredientId: 25, portionG: 40,  label: "Spinach"              },
  ],
  B3: [
    { ingredientId: 5,  portionG: 250, label: "Egg Whites"           },
    { ingredientId: 31, portionG: 60,  label: "Bell Pepper"          },
    { ingredientId: 25, portionG: 40,  label: "Spinach"              },
    { ingredientId: 34, portionG: 5,   label: "Olive Oil"            },
  ],
  B4: [
    { ingredientId: 17, portionG: 100, label: "Pita Bread"           },
    { ingredientId: 50, portionG: 30,  label: "Zaatar Mix"           },
    { ingredientId: 34, portionG: 15,  label: "Olive Oil"            },
  ],
  B5: [
    { ingredientId: 4,  portionG: 180, label: "Eggs (whole)"         },
    { ingredientId: 33, portionG: 100, label: "Avocado"              },
    { ingredientId: 41, portionG: 60,  label: "Labneh"               },
  ],
  L1: [
    { ingredientId: 1,  portionG: 200, label: "Chicken Breast"       },
    { ingredientId: 13, portionG: 200, label: "White Rice (cooked)"  },
    { ingredientId: 24, portionG: 80,  label: "Broccoli"             },
    { ingredientId: 34, portionG: 10,  label: "Olive Oil"            },
  ],
  L2: [
    { ingredientId: 10, portionG: 180, label: "Shish Tawook"         },
    { ingredientId: 48, portionG: 120, label: "Fattoush Salad"       },
    { ingredientId: 27, portionG: 80,  label: "Cucumber"             },
  ],
  L3: [
    { ingredientId: 20, portionG: 200, label: "Lentils (cooked)"     },
    { ingredientId: 13, portionG: 150, label: "White Rice (cooked)"  },
    { ingredientId: 48, portionG: 100, label: "Fattoush Salad"       },
    { ingredientId: 34, portionG: 10,  label: "Olive Oil"            },
  ],
  L4: [
    { ingredientId: 7,  portionG: 220, label: "Beef Steak (lean)"    },
    { ingredientId: 25, portionG: 100, label: "Spinach"              },
    { ingredientId: 37, portionG: 30,  label: "Tahini"               },
    { ingredientId: 34, portionG: 15,  label: "Olive Oil"            },
  ],
  D1: [
    { ingredientId: 9,  portionG: 180, label: "Kafta (beef & lamb)"  },
    { ingredientId: 13, portionG: 200, label: "White Rice (cooked)"  },
    { ingredientId: 26, portionG: 60,  label: "Tomato"               },
    { ingredientId: 30, portionG: 40,  label: "Onion"                },
  ],
  D2: [
    { ingredientId: 11, portionG: 220, label: "Grilled Samke (Fish)" },
    { ingredientId: 26, portionG: 80,  label: "Tomato"               },
    { ingredientId: 30, portionG: 50,  label: "Onion"                },
    { ingredientId: 34, portionG: 12,  label: "Olive Oil"            },
  ],
  D3: [
    { ingredientId: 2,  portionG: 250, label: "Salmon Fillet"        },
    { ingredientId: 25, portionG: 80,  label: "Spinach"              },
    { ingredientId: 34, portionG: 20,  label: "Olive Oil"            },
  ],
  S1: [
    { ingredientId: 40, portionG: 200, label: "Greek Yogurt"         },
    { ingredientId: 22, portionG: 100, label: "Banana"               },
  ],
  S2: [
    { ingredientId: 45, portionG: 150, label: "Cottage Cheese"       },
    { ingredientId: 23, portionG: 100, label: "Apple"                },
  ],
  S3: [
    { ingredientId: 51, portionG: 35,  label: "Protein Shake Powder" },
    { ingredientId: 44, portionG: 200, label: "Milk (whole)"          },
  ],
  S4: [
    { ingredientId: 35, portionG: 40,  label: "Mixed Nuts"           },
    { ingredientId: 22, portionG: 120, label: "Banana"               },
  ],
};

//  Ingredient Database (per 100g) 
export const INGREDIENTS = [
  // Proteins
  { id: 1,  name: "Chicken Breast",        cat: "protein",   kcal: 165, protein: 31,  carbs: 0,   fat: 3.6 },
  { id: 2,  name: "Salmon Fillet",         cat: "protein",   kcal: 208, protein: 20,  carbs: 0,   fat: 13  },
  { id: 3,  name: "Tuna (canned)",          cat: "protein",   kcal: 116, protein: 26,  carbs: 0,   fat: 1   },
  { id: 4,  name: "Eggs (whole)",           cat: "protein",   kcal: 155, protein: 13,  carbs: 1.1, fat: 11  },
  { id: 5,  name: "Egg Whites",            cat: "protein",   kcal: 52,  protein: 11,  carbs: 0.7, fat: 0.2 },
  { id: 6,  name: "Turkey Breast",         cat: "protein",   kcal: 135, protein: 30,  carbs: 0,   fat: 1   },
  { id: 7,  name: "Beef Steak (lean)",      cat: "protein",   kcal: 217, protein: 26,  carbs: 0,   fat: 12  },
  { id: 8,  name: "Tilapia",               cat: "protein",   kcal: 128, protein: 26,  carbs: 0,   fat: 2.7 },
  { id: 9,  name: "Kafta (beef & lamb)",    cat: "protein",   kcal: 260, protein: 18,  carbs: 4,   fat: 19  },
  { id: 10, name: "Shish Tawook",          cat: "protein",   kcal: 185, protein: 28,  carbs: 3,   fat: 7   },
  { id: 11, name: "Grilled Samke (Fish)",   cat: "protein",   kcal: 140, protein: 26,  carbs: 0,   fat: 4   },
  { id: 12, name: "Shawarma Chicken",      cat: "protein",   kcal: 220, protein: 24,  carbs: 6,   fat: 11  },
  // Carbs
  { id: 13, name: "White Rice (cooked)",   cat: "carbs",     kcal: 130, protein: 2.7, carbs: 28,  fat: 0.3 },
  { id: 14, name: "Brown Rice (cooked)",   cat: "carbs",     kcal: 123, protein: 2.7, carbs: 26,  fat: 1   },
  { id: 15, name: "Oats (dry)",             cat: "carbs",     kcal: 389, protein: 17,  carbs: 66,  fat: 7   },
  { id: 16, name: "Sweet Potato",          cat: "carbs",     kcal: 86,  protein: 1.6, carbs: 20,  fat: 0.1 },
  { id: 17, name: "Pita Bread",            cat: "carbs",     kcal: 275, protein: 9,   carbs: 55,  fat: 1.2 },
  { id: 18, name: "Markouk (Saj Bread)",   cat: "carbs",     kcal: 230, protein: 7,   carbs: 48,  fat: 0.8 },
  { id: 19, name: "Bulgur Wheat",          cat: "carbs",     kcal: 342, protein: 12,  carbs: 76,  fat: 1.3 },
  { id: 20, name: "Lentils (cooked)",      cat: "carbs",     kcal: 116, protein: 9,   carbs: 20,  fat: 0.4 },
  { id: 21, name: "Freekeh (cooked)",      cat: "carbs",     kcal: 130, protein: 5,   carbs: 24,  fat: 0.5 },
  { id: 22, name: "Banana",               cat: "carbs",     kcal: 89,  protein: 1.1, carbs: 23,  fat: 0.3 },
  { id: 23, name: "Apple",                cat: "carbs",     kcal: 52,  protein: 0.3, carbs: 14,  fat: 0.2 },
  // Vegetables
  { id: 24, name: "Broccoli",             cat: "vegetable", kcal: 34,  protein: 2.8, carbs: 7,   fat: 0.4 },
  { id: 25, name: "Spinach",              cat: "vegetable", kcal: 23,  protein: 2.9, carbs: 3.6, fat: 0.4 },
  { id: 26, name: "Tomato",               cat: "vegetable", kcal: 18,  protein: 0.9, carbs: 3.9, fat: 0.2 },
  { id: 27, name: "Cucumber",             cat: "vegetable", kcal: 15,  protein: 0.7, carbs: 3.6, fat: 0.1 },
  { id: 28, name: "Parsley",              cat: "vegetable", kcal: 36,  protein: 3,   carbs: 6,   fat: 0.8 },
  { id: 29, name: "Mint",                 cat: "vegetable", kcal: 70,  protein: 3.8, carbs: 15,  fat: 0.9 },
  { id: 30, name: "Onion",                cat: "vegetable", kcal: 40,  protein: 1.1, carbs: 9,   fat: 0.1 },
  { id: 31, name: "Bell Pepper",          cat: "vegetable", kcal: 31,  protein: 1,   carbs: 6,   fat: 0.3 },
  { id: 32, name: "Eggplant (Batinjan)",  cat: "vegetable", kcal: 25,  protein: 1,   carbs: 6,   fat: 0.2 },
  // Fats
  { id: 33, name: "Avocado",              cat: "fat",       kcal: 160, protein: 2,   carbs: 9,   fat: 15  },
  { id: 34, name: "Olive Oil",            cat: "fat",       kcal: 884, protein: 0,   carbs: 0,   fat: 100 },
  { id: 35, name: "Mixed Nuts",           cat: "fat",       kcal: 607, protein: 20,  carbs: 21,  fat: 54  },
  { id: 36, name: "Almonds",              cat: "fat",       kcal: 579, protein: 21,  carbs: 22,  fat: 50  },
  { id: 37, name: "Tahini",               cat: "fat",       kcal: 595, protein: 17,  carbs: 21,  fat: 54  },
  { id: 38, name: "Pine Nuts",            cat: "fat",       kcal: 673, protein: 14,  carbs: 13,  fat: 68  },
  { id: 39, name: "Walnuts",              cat: "fat",       kcal: 654, protein: 15,  carbs: 14,  fat: 65  },
  // Dairy
  { id: 40, name: "Greek Yogurt",         cat: "dairy",     kcal: 97,  protein: 9,   carbs: 3.6, fat: 5   },
  { id: 41, name: "Labneh",               cat: "dairy",     kcal: 170, protein: 10,  carbs: 4,   fat: 13  },
  { id: 42, name: "Akkawi Cheese",        cat: "dairy",     kcal: 260, protein: 20,  carbs: 1,   fat: 19  },
  { id: 43, name: "Halloumi",             cat: "dairy",     kcal: 321, protein: 22,  carbs: 1,   fat: 25  },
  { id: 44, name: "Milk (whole)",          cat: "dairy",     kcal: 61,  protein: 3.2, carbs: 4.8, fat: 3.3 },
  { id: 45, name: "Cottage Cheese",       cat: "dairy",     kcal: 98,  protein: 11,  carbs: 3.4, fat: 4.3 },
  // Lebanese
  { id: 46, name: "Hummus (homemade)",    cat: "fat",       kcal: 177, protein: 8,   carbs: 20,  fat: 8   },
  { id: 47, name: "Moutabal",             cat: "fat",       kcal: 88,  protein: 3,   carbs: 9,   fat: 5   },
  { id: 48, name: "Fattoush Salad",       cat: "vegetable", kcal: 80,  protein: 2,   carbs: 12,  fat: 3   },
  { id: 49, name: "Tabbouleh",            cat: "vegetable", kcal: 90,  protein: 3,   carbs: 14,  fat: 3.5 },
  { id: 50, name: "Zaatar Mix",           cat: "fat",       kcal: 310, protein: 10,  carbs: 42,  fat: 12  },
  { id: 51, name: "Protein Shake Powder", cat: "protein",   kcal: 380, protein: 80,  carbs: 7,   fat: 4   },
];

//  Calendar Seed Data 
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export const INITIAL_CALENDAR = {
  [daysAgo(3)]: [
    { name: "Oats & Shake",   kcal: 520, cat: "breakfast", protein: 42, carbs: 62, fat: 8,  type: "meal" },
    { name: "Chicken Bowl",   kcal: 620, cat: "lunch",     protein: 48, carbs: 68, fat: 12, type: "meal" },
    { name: "Grilled Kafta",  kcal: 580, cat: "dinner",    protein: 38, carbs: 52, fat: 20, type: "meal" },
  ],
  [daysAgo(2)]: [
    { name: "Scrambled Eggs", kcal: 380, cat: "breakfast", protein: 28, carbs: 30, fat: 14, type: "meal" },
    { name: "Tawook Salad",   kcal: 360, cat: "lunch",     protein: 44, carbs: 14, fat: 12, type: "meal" },
    { name: "Protein Shake",  kcal: 160, cat: "snack",     protein: 28, carbs: 8,  fat: 3,  type: "meal" },
  ],
  [daysAgo(1)]: [
    { name: "Oats & Shake",   kcal: 520, cat: "breakfast", protein: 42, carbs: 62, fat: 8,  type: "meal" },
    { name: "Mjaddara",       kcal: 480, cat: "lunch",     protein: 18, carbs: 72, fat: 10, type: "meal" },
    { name: "Samkeh Harra",   kcal: 340, cat: "dinner",    protein: 46, carbs: 12, fat: 11, type: "meal" },
    { name: "Greek Yogurt",   kcal: 220, cat: "snack",     protein: 18, carbs: 26, fat: 4,  type: "meal" },
  ],
};

//  Today Key 
export function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}
// ─────────────────────────────────────────────────────────────
// ADDED BY JAWAD — Exercise Library
// ─────────────────────────────────────────────────────────────

// Calories burned — meal planner friend reads this
// import { dailyCalorieLog } from "../data/mockData"
// const burned = dailyCalorieLog.filter(e => e.date === today).reduce((sum,e) => sum + e.caloriesBurned, 0)
export const dailyCalorieLog = [];
export const workoutLog      = [];

// Read user profile saved by friend's survey
// Returns fields for both ExerciseLibrary AND DietProgram calcNutritionTargets()
export function getUserProfile() {
  try {
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      const p = JSON.parse(saved);
      return {
        // For ExerciseLibrary
        name:         p.name          || "User",
        gender:       (p.gender       || "male").toLowerCase(),
        age:          p.age           || 20,
        weight:       parseFloat(p.weight)       || 70,
        weightUnit:   p.weightUnit    || "kg",
        height:       parseFloat(p.height)       || 170,
        weightGoal:   p.weightGoal    || "maintain",
        level:        p.fitnessLevel  ? p.fitnessLevel.toLowerCase() : "beginner",
        limitations:  Array.isArray(p.limitations) ? p.limitations : [],
        equipment:    Array.isArray(p.equipment)   ? p.equipment   : [],
        workoutTypes: Array.isArray(p.workoutTypes)? p.workoutTypes : [],
        goal:
          p.weightGoal === "lose"        ? "weight loss"     :
          p.weightGoal === "gain"        ? "muscle gain"     :
          p.weightGoal === "buildMuscle" ? "muscle gain"     :
                                          "general fitness",
        weeklyTarget: p.weeklyRate ? parseFloat(p.weeklyRate) : 0.5,
        totalGoal:    p.targetWeight && p.weight
          ? Math.abs(parseFloat(p.targetWeight) - parseFloat(p.weight))
          : 5,
        // For DietProgram calcNutritionTargets()
        currentWeight: parseFloat(p.weight)       || 70,
        targetWeight:  parseFloat(p.targetWeight) || 70,
        activityLevel: "moderately_active",
        isOngoing:     p.timeline === "Ongoing",
        duration:
          p.timeline === "1 month"  ? 1  :
          p.timeline === "3 months" ? 3  :
          p.timeline === "6 months" ? 6  :
          p.timeline === "1 year"   ? 12 :
          p.timeline === "2 years"  ? 24 : null,
        goal_meal:
          p.weightGoal === "lose"        ? "lose_weight" :
          p.weightGoal === "gain"        ? "gain_muscle" :
          p.weightGoal === "buildMuscle" ? "gain_muscle" :
                                          "maintain",
      };
    }
  } catch (e) {}
  return {
    name: "User", gender: "male", age: 20,
    weight: 70, weightUnit: "kg", height: 170,
    weightGoal: "maintain", level: "beginner",
    limitations: [], equipment: [], workoutTypes: [],
    goal: "general fitness", weeklyTarget: 0.5, totalGoal: 5,
    currentWeight: 70, targetWeight: 70,
    activityLevel: "moderately_active",
    isOngoing: true, duration: null, goal_meal: "maintain",
  };
}

// Exercise list
export const EXERCISES = [
  {
    id: 1, name: "Jump Rope", category: "Cardio", difficulty: "Beginner",
    logType: "duration", met: 11.8,
    goals: ["weight loss", "general fitness"],
    link: "/exercise/1", kcalRange: "70–90", muscles: "Full Body",
    desc: "A cardio movement for endurance, rhythm, and calorie burn.",
    limitedFor: ["Knee issues", "Joint pain"],
  },
  {
    id: 2, name: "High Knees", category: "Cardio", difficulty: "Beginner",
    logType: "reps-cardio", kcalPerRep: 0.5,
    goals: ["weight loss", "general fitness"],
    link: "/exercise/2", kcalRange: "60–80", muscles: "Legs, Core",
    desc: "A fast-paced cardio drill that drives your knees up and spikes your heart rate.",
    limitedFor: ["Knee issues", "Joint pain"],
  },
  {
    id: 3, name: "Burpees", category: "Cardio", difficulty: "Intermediate",
    logType: "reps-cardio", kcalPerRep: 1.4,
    goals: ["weight loss", "general fitness"],
    link: "/exercise/3", kcalRange: "80–100", muscles: "Full Body",
    desc: "Full-body cardio combining squat, jump, and plank.",
    limitedFor: ["Knee issues", "Shoulder injuries", "Back problems", "Joint pain"],
  },
  {
    id: 4, name: "Mountain Climbers", category: "Cardio", difficulty: "Beginner",
    logType: "duration", met: 8.0,
    goals: ["weight loss", "general fitness"],
    link: "/exercise/4", kcalRange: "60–80", muscles: "Core, Shoulders",
    desc: "Core and cardio movement in a plank position.",
    limitedFor: ["Shoulder injuries", "Back problems", "Knee issues"],
  },
  {
    id: 5, name: "Jumping Jacks", category: "Cardio", difficulty: "Beginner",
    logType: "reps-cardio", kcalPerRep: 0.2,
    goals: ["weight loss", "general fitness"],
    link: "/exercise/5", kcalRange: "50–70", muscles: "Full Body",
    desc: "Classic warm-up and fat-loss cardio. No equipment needed.",
    limitedFor: ["Knee issues", "Joint pain"],
  },
  {
    id: 6, name: "Running in Place", category: "Cardio", difficulty: "Beginner",
    logType: "duration", met: 8.0,
    goals: ["weight loss", "general fitness"],
    link: "/exercise/6", kcalRange: "55–75", muscles: "Legs, Core",
    desc: "Indoor cardio that builds stamina without any equipment.",
    limitedFor: ["Knee issues", "Joint pain"],
  },
  {
    id: 7, name: "Cycling", category: "Cardio", difficulty: "Intermediate",
    logType: "duration", met: 7.5,
    goals: ["weight loss", "general fitness"],
    link: "/exercise/7", kcalRange: "60–90", muscles: "Legs, Glutes",
    desc: "Steady endurance and calorie burn. Low joint impact.",
    limitedFor: [],
  },
  {
    id: 8, name: "Treadmill Walk", category: "Cardio", difficulty: "Beginner",
    logType: "duration", met: 3.5,
    goals: ["weight loss", "general fitness"],
    link: "/exercise/8", kcalRange: "35–50", muscles: "Legs, Core",
    desc: "Low-impact cardio suitable for beginners and recovery.",
    limitedFor: [],
  },
  {
    id: 9, name: "Rowing Machine", category: "Cardio", difficulty: "Intermediate",
    logType: "duration", met: 7.0,
    goals: ["weight loss", "general fitness"],
    link: "/exercise/9", kcalRange: "70–95", muscles: "Back, Arms, Legs",
    desc: "Full-body cardio engaging back, arms, and legs simultaneously.",
    limitedFor: ["Back problems", "Shoulder injuries"],
  },
  {
    id: 10, name: "Stair Climber", category: "Cardio", difficulty: "Intermediate",
    logType: "duration", met: 9.0,
    goals: ["weight loss", "general fitness"],
    link: "/exercise/10", kcalRange: "65–85", muscles: "Glutes, Legs",
    desc: "High glute and leg activation per step.",
    limitedFor: ["Knee issues", "Joint pain"],
  },
  {
    id: 11, name: "Push Up", category: "Weightlifting", difficulty: "Beginner",
    logType: "bodyweight", kcalPerRep: 0.32,
    goals: ["muscle gain", "general fitness"],
    link: "/exercise/11", kcalRange: "50–65", muscles: "Chest, Triceps, Shoulders",
    desc: "The most fundamental bodyweight exercise. Zero equipment.",
    limitedFor: ["Shoulder injuries"],
  },
  {
    id: 12, name: "Bench Press", category: "Weightlifting", difficulty: "Intermediate",
    logType: "weighted",
    goals: ["muscle gain"],
    link: "/exercise/12", kcalRange: "45–65", muscles: "Chest, Triceps, Shoulders",
    desc: "Upper-body strength and power with a barbell.",
    limitedFor: ["Shoulder injuries"],
  },
  {
    id: 13, name: "Pull Up", category: "Weightlifting", difficulty: "Intermediate",
    logType: "bodyweight", kcalPerRep: 0.45,
    goals: ["muscle gain", "general fitness"],
    link: "/exercise/13", kcalRange: "50–70", muscles: "Back, Biceps",
    desc: "Compound back exercise building arms and grip strength.",
    limitedFor: ["Shoulder injuries"],
  },
  {
    id: 14, name: "Lat Pulldown", category: "Weightlifting", difficulty: "Beginner",
    logType: "weighted",
    goals: ["muscle gain", "general fitness"],
    link: "/exercise/14", kcalRange: "40–55", muscles: "Lats, Upper Back",
    desc: "Machine-based pulling targeting lats and upper back.",
    limitedFor: ["Shoulder injuries"],
  },
  {
    id: 15, name: "Squat", category: "Weightlifting", difficulty: "Beginner",
    logType: "bodyweight", kcalPerRep: 0.32,
    goals: ["weight loss", "muscle gain", "general fitness"],
    link: "/exercise/15", kcalRange: "50–70", muscles: "Quads, Glutes, Hamstrings",
    desc: "King of lower body exercises. Builds raw leg and glute strength.",
    limitedFor: ["Knee issues", "Back problems", "Joint pain"],
  },
  {
    id: 16, name: "Lunges", category: "Weightlifting", difficulty: "Beginner",
    logType: "bodyweight", kcalPerRep: 0.28,
    goals: ["weight loss", "general fitness"],
    link: "/exercise/16", kcalRange: "45–60", muscles: "Quads, Glutes",
    desc: "Unilateral leg movement for balance and lower body strength.",
    limitedFor: ["Knee issues", "Joint pain"],
  },
  {
    id: 17, name: "Deadlift", category: "Weightlifting", difficulty: "Advanced",
    logType: "weighted",
    goals: ["muscle gain"],
    link: "/exercise/17", kcalRange: "60–80", muscles: "Hamstrings, Glutes, Back",
    desc: "Powerful compound lift targeting the posterior chain.",
    limitedFor: ["Back problems"],
  },
  {
    id: 18, name: "Leg Press", category: "Weightlifting", difficulty: "Intermediate",
    logType: "weighted",
    goals: ["muscle gain", "general fitness"],
    link: "/exercise/18", kcalRange: "45–60", muscles: "Quads, Glutes",
    desc: "Machine exercise for quads and glutes.",
    limitedFor: ["Knee issues", "Joint pain"],
  },
  {
    id: 19, name: "Shoulder Press", category: "Weightlifting", difficulty: "Intermediate",
    logType: "weighted",
    goals: ["muscle gain"],
    link: "/exercise/19", kcalRange: "40–55", muscles: "Shoulders, Triceps",
    desc: "Pressing movement for strong shoulders and triceps.",
    limitedFor: ["Shoulder injuries"],
  },
  {
    id: 20, name: "Biceps Curl", category: "Weightlifting", difficulty: "Beginner",
    logType: "weighted",
    goals: ["muscle gain", "general fitness"],
    link: "/exercise/20", kcalRange: "30–45", muscles: "Biceps",
    desc: "Classic arm isolation for direct biceps growth.",
    limitedFor: [],
  },
];

// Algorithm helpers
export function getCardioRatio(weightGoal) {
  if (weightGoal === "lose")        return 0.7;
  if (weightGoal === "gain")        return 0.3;
  if (weightGoal === "buildMuscle") return 0.2;
  if (weightGoal === "maintain")    return 0.5;
  return 0.5;
}

export function isRiskyForUser(ex, limitations) {
  if (!limitations || limitations.length === 0) return false;
  if (limitations.includes("No limitations")) return false;
  return ex.limitedFor.some(l => limitations.includes(l));
}
