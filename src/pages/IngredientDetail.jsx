// IngredientDetail.jsx
// Page: Ingredient Detail View
// Route: /ingredient/:id
//
// Features:
//   - Food photo at the top
//   - Calorie hero number (updates with portion)
//   - Number input for portion size (in grams) with quick preset buttons
//   - Macro breakdown bars
//   - Full nutrition facts table
//   - Quick stats sidebar
//   - "Add to Meal" button back to meal log
//
// Hooks used: useState, useEffect

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { INGREDIENTS } from "../data/mockData";

//  Food images from Unsplash 
const INGREDIENT_IMAGES = {
  1:  "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80",
  2:  "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80",
  3:  "https://images.unsplash.com/photo-1611171711791-b34b43814029?w=800&q=80",
  4:  "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=800&q=80",
  5:  "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=800&q=80",
  6:  "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80",
  7:  "https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=800&q=80",
  8:  "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80",
  9:  "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80",
  10: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80",
  11: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80",
  12: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80",
  13: "https://images.unsplash.com/photo-1536304993881-ff86e0c9ef1a?w=800&q=80",
  14: "https://images.unsplash.com/photo-1536304993881-ff86e0c9ef1a?w=800&q=80",
  15: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=800&q=80",
  16: "https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=800&q=80",
  17: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
  18: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
  19: "https://images.unsplash.com/photo-1536304993881-ff86e0c9ef1a?w=800&q=80",
  20: "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=800&q=80",
  21: "https://images.unsplash.com/photo-1536304993881-ff86e0c9ef1a?w=800&q=80",
  22: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&q=80",
  23: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&q=80",
  24: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=800&q=80",
  25: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80",
  26: "https://images.unsplash.com/photo-1561136594-7f68413baa99?w=800&q=80",
  27: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=800&q=80",
  28: "https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=800&q=80",
  29: "https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=800&q=80",
  30: "https://images.unsplash.com/photo-1508747703725-719777637510?w=800&q=80",
  31: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800&q=80",
  32: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800&q=80",
  33: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&q=80",
  34: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80",
  35: "https://images.unsplash.com/photo-1509461399763-ae67a981b254?w=800&q=80",
  36: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=800&q=80",
  37: "https://images.unsplash.com/photo-1600718374662-0483d2b9da44?w=800&q=80",
  38: "https://images.unsplash.com/photo-1509461399763-ae67a981b254?w=800&q=80",
  39: "https://images.unsplash.com/photo-1509461399763-ae67a981b254?w=800&q=80",
  40: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80",
  41: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80",
  42: "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=800&q=80",
  43: "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=800&q=80",
  44: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80",
  45: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80",
  46: "https://images.unsplash.com/photo-1576834745837-c87b02e1c2e0?w=800&q=80",
  47: "https://images.unsplash.com/photo-1576834745837-c87b02e1c2e0?w=800&q=80",
  48: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  49: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  50: "https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=800&q=80",
  51: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&q=80",
};

const CAT_FALLBACK = {
  protein:   "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80",
  carbs:     "https://images.unsplash.com/photo-1536304993881-ff86e0c9ef1a?w=800&q=80",
  vegetable: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  fat:       "https://images.unsplash.com/photo-1509461399763-ae67a981b254?w=800&q=80",
  dairy:     "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80",
};

const CAT_COLORS = {
  protein:   { text: "text-[#FF2A5E]", border: "border-[#FF2A5E]" },
  carbs:     { text: "text-[#00E5FF]", border: "border-[#00E5FF]" },
  vegetable: { text: "text-[#C6F135]", border: "border-[#C6F135]" },
  fat:       { text: "text-[#FFAA00]", border: "border-[#FFAA00]" },
  dairy:     { text: "text-[#00E5FF]", border: "border-[#00E5FF]" },
};

//  Hardcoded dark theme 
const bg    = "bg-[#0a0a0a]";
const bg2   = "bg-[#111]";
const bg3   = "bg-[#161616]";
const bdr   = "border-[#222]";
const txt   = "text-[#e8e8e8]";
const muted = "text-[#555]";

export default function IngredientDetail() {

  const { id }   = useParams();
  const navigate = useNavigate();

  const [item,     setItem]     = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [portion,  setPortion]  = useState(100);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const found = INGREDIENTS.find((i) => i.id === parseInt(id));
    if (found) { setItem(found); setPortion(100); }
    else setNotFound(true);
  }, [id]);

  if (notFound) {
    return (
      <main className={`${bg} ${txt} min-h-screen flex flex-col items-center justify-center gap-4`}>
        <p className="font-black text-4xl uppercase text-[#FF2A5E]">Not Found</p>
        <p className={`text-sm ${muted}`}>No ingredient with ID {id} exists.</p>
        <Link to="/meal-log" className="text-xs tracking-widest uppercase text-[#C6F135] border-b border-[#C6F135] pb-0.5">
          ← Back to Meal Log
        </Link>
      </main>
    );
  }

  if (!item) {
    return (
      <main className={`${bg} ${muted} min-h-screen flex items-center justify-center`}>
        <p className="text-xs tracking-widest uppercase">Loading...</p>
      </main>
    );
  }

  //  Scaled values 
  const ratio         = portion / 100;
  const scaledKcal    = Math.round(item.kcal    * ratio);
  const scaledProtein = Math.round(item.protein * ratio * 10) / 10;
  const scaledCarbs   = Math.round(item.carbs   * ratio * 10) / 10;
  const scaledFat     = Math.round(item.fat     * ratio * 10) / 10;
  const maxMacro      = Math.max(item.protein, item.carbs, item.fat, 1);

  const catStyle = CAT_COLORS[item.cat] || CAT_COLORS.fat;
  const imgSrc   = imgError
    ? CAT_FALLBACK[item.cat]
    : (INGREDIENT_IMAGES[item.id] || CAT_FALLBACK[item.cat]);

  return (
    <main className={`${bg} ${txt} min-h-screen`}>

      {/*  Breadcrumb  */}
      <div className={`px-6 md:px-8 py-3 border-b ${bdr} ${bg2} flex items-center gap-2 text-xs ${muted}`}>
        <Link to="/meal-log" className="hover:text-[#C6F135] transition-colors">Meal Log</Link>
        <span>/</span>
        <span className={`capitalize ${catStyle.text}`}>{item.cat}</span>
        <span>/</span>
        <span className={txt}>{item.name}</span>
      </div>

      {/*  Food Photo  */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden">
        <img src={imgSrc} alt={item.name} onError={() => setImgError(true)}
          className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button onClick={() => navigate(-1)} aria-label="Go back"
          className="absolute top-4 left-6 text-xs tracking-widest uppercase text-white/70 hover:text-white transition-colors border-b border-white/30 pb-0.5">
          ← Back
        </button>
        <div className="absolute bottom-4 left-6">
          <span className={`inline-block text-xs tracking-widest uppercase px-2 py-1 border font-bold bg-black/40 ${catStyle.text} ${catStyle.border}`}>
            {item.cat}
          </span>
        </div>
      </div>

      {/*  Page Title  */}
      <header className={`px-6 md:px-8 pt-5 pb-5 border-b ${bdr}`}>
        <h1 className="font-black text-4xl md:text-5xl uppercase tracking-tight leading-none">{item.name}</h1>
        <p className={`text-xs tracking-widest uppercase ${muted} mt-2`}>
          All values shown per 100g unless adjusted below
        </p>
      </header>

      {/*  Main Content  */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">

        {/*  Left: Nutrition  */}
        <div className={`border-r ${bdr}`}>

          {/* Calorie hero */}
          <section className={`px-6 md:px-8 py-8 border-b ${bdr} text-center ${bg2}`}>
            <p className={`text-xs tracking-widest uppercase ${muted} mb-2`}>Calories per {portion}g</p>
            <p className="font-black text-7xl leading-none text-[#C6F135]" aria-live="polite">{scaledKcal}</p>
            <p className={`text-xs tracking-widest uppercase ${muted} mt-2`}>kcal</p>
          </section>

          {/* Portion input */}
          <section className={`px-6 md:px-8 py-5 border-b ${bdr} ${bg2}`}>
            <label htmlFor="portionInput" className={`block text-xs tracking-widest uppercase ${muted} mb-3`}>
              Adjust Portion Size
            </label>
            <div className="flex items-center gap-3">
              <input id="portionInput" type="number" min="1" max="2000" step="10" value={portion}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val > 0) setPortion(val);
                }}
                aria-label="Portion in grams"
                className={`w-28 bg-[#0a0a0a] text-[#e8e8e8] border border-[#222] font-mono text-sm px-3 py-2 outline-none focus:border-[#C6F135] transition-colors text-center`} />
              <span className={`text-sm ${muted}`}>grams</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {[50, 100, 150, 200].map((g) => (
                  <button key={g} onClick={() => setPortion(g)} aria-label={`Set portion to ${g}g`}
                    className={`text-xs px-3 py-2 border transition-colors ${
                      portion === g
                        ? "bg-[#C6F135] text-black border-[#C6F135]"
                        : `border-[#222] text-[#555] hover:border-[#C6F135] hover:text-[#C6F135]`
                    }`}>
                    {g}g
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Macro breakdown bars */}
          <section className={`px-6 md:px-8 py-6 border-b ${bdr}`}>
            <h2 className={`text-xs tracking-widest uppercase ${muted} mb-5`}>Macro Breakdown</h2>
            {[
              { label: "Protein",       per100: item.protein, scaled: scaledProtein, color: "#FF2A5E", cls: "text-[#FF2A5E]" },
              { label: "Carbohydrates", per100: item.carbs,   scaled: scaledCarbs,   color: "#00E5FF", cls: "text-[#00E5FF]" },
              { label: "Fat",           per100: item.fat,     scaled: scaledFat,     color: "#FFAA00", cls: "text-[#FFAA00]" },
            ].map((macro) => (
              <div key={macro.label} className="mb-5 last:mb-0">
                <div className="flex justify-between items-baseline mb-2">
                  <span className={`text-xs uppercase tracking-wide font-bold ${macro.cls}`}>{macro.label}</span>
                  <div className="text-right">
                    <span className={`font-black text-xl ${macro.cls}`} aria-live="polite">{macro.scaled}g</span>
                    <span className={`text-xs ${muted} ml-1`}>per {portion}g</span>
                    <span className={`text-xs ${muted} ml-2`}>({macro.per100}g / 100g)</span>
                  </div>
                </div>
                <div className="h-2 bg-[#2e2e2e] rounded-sm overflow-hidden">
                  <div className="h-full transition-all duration-500 rounded-sm"
                    style={{
                      width: `${Math.min(100, (macro.per100 / maxMacro) * 100)}%`,
                      background: macro.color,
                    }}
                    role="progressbar"
                    aria-valuenow={macro.per100}
                    aria-valuemax={maxMacro}
                  />
                </div>
              </div>
            ))}
          </section>
        </div>

        {/*  Right: Sidebar  */}
        <aside className="flex flex-col">
          <div className={`px-5 py-5 border-b ${bdr} ${bg2}`}>
            <p className={`text-xs tracking-widest uppercase ${muted} mb-4`}>Quick Stats (per 100g)</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Calories", value: item.kcal,    unit: "kcal", cls: "text-[#C6F135]" },
                { label: "Protein",  value: item.protein, unit: "g",    cls: "text-[#FF2A5E]" },
                { label: "Carbs",    value: item.carbs,   unit: "g",    cls: "text-[#00E5FF]" },
                { label: "Fat",      value: item.fat,     unit: "g",    cls: "text-[#FFAA00]" },
              ].map((stat) => (
                <div key={stat.label} className={`${bg3} border ${bdr} px-3 py-3`}>
                  <p className={`text-xs ${muted} mb-1`}>{stat.label}</p>
                  <p className={`font-black text-xl leading-none ${stat.cls}`}>
                    {stat.value}<span className={`text-xs font-normal ${muted} ml-0.5`}>{stat.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className={`px-5 py-5 border-b ${bdr}`}>
            <p className={`text-xs tracking-widest uppercase ${muted} mb-3`}>Add to a Meal</p>
            <Link to="/meal-log"
              className="block w-full text-center bg-[#C6F135] text-black text-xs font-bold tracking-widest uppercase py-3 hover:bg-[#FF2A5E] hover:text-white transition-colors">
              + Log This in a Meal
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
