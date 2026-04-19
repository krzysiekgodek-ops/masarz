import React, { useState } from 'react';
import { ChefHat, Megaphone, Heart } from 'lucide-react';

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-300 flex-none">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const RecipeList = ({
  recipes,
  categories,
  ads,
  user,
  userProfile,
  favoriteIds     = [],
  onSelectRecipe,
  onToggleFavorite,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');

  const filtered = (Array.isArray(recipes) ? recipes : Object.values(recipes)).filter(
    r => selectedCategory === 'Wszystkie' || r.category === selectedCategory
  );

  return (
    <div>
      {/* Banery / komunikaty */}
      {ads.filter(a => a.active).map(ad => (
        <div key={ad.id} className="mx-4 mt-4 bg-[#DC2626] text-white px-4 py-3 rounded-2xl flex items-center gap-3">
          <Megaphone size={15} className="flex-none" />
          <p className="text-xs font-black uppercase tracking-wide leading-tight">{ad.content}</p>
        </div>
      ))}

      {/* Filtry kategorii */}
      <div className="flex gap-2 px-4 pt-4 pb-2 overflow-x-auto scrollbar-hide">
        {['Wszystkie', ...categories].map(c => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`flex-none px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wide whitespace-nowrap transition-all ${
              selectedCategory === c
                ? 'bg-[#DC2626] text-white shadow-md shadow-red-900/30'
                : 'bg-[#1E293B] text-[#94A3B8] border border-[#334155]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Karty receptur */}
      <div className="px-4 pb-4 space-y-2">
        {filtered.map(r => {
          const isFav = favoriteIds.includes(r.id);
          return (
            <div
              key={r.id}
              className="relative flex items-center gap-4 p-3 bg-[#1E293B] rounded-2xl border border-[#334155] text-left"
            >
              {/* Serduszko — prawy górny róg */}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(r.id); }}
                className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-xl transition-all"
                aria-label={isFav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
              >
                <Heart
                  size={17}
                  strokeWidth={2}
                  className={isFav ? 'text-[#DC2626]' : 'text-[#475569] hover:text-[#DC2626] transition-colors'}
                  fill={isFav ? '#DC2626' : 'none'}
                />
              </button>

              {/* Klikalna część — otwiera kalkulator */}
              <button
                onClick={() => onSelectRecipe?.(r)}
                className="flex items-center gap-4 flex-1 min-w-0 active:scale-[0.98] transition-transform"
              >
                <div className="w-14 h-14 rounded-xl bg-[#0F172A] border border-[#334155] flex-none overflow-hidden flex items-center justify-center">
                  {r.imageUrl
                    ? <img src={r.imageUrl} className="w-full h-full object-cover" alt={r.name} />
                    : <ChefHat size={22} className="text-slate-200" />
                  }
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  {r.ownerId === 'ADMIN' && (
                    <span className="text-[9px] font-black bg-amber-900/20 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase inline-block mb-1">
                      ⭐ Wzorzec
                    </span>
                  )}
                  <p className="font-black text-[#F8FAFC] text-sm leading-tight truncate">{r.name}</p>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mt-0.5">{r.category}</p>
                </div>
                <ChevronRight />
              </button>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center text-[#94A3B8] text-sm font-bold py-16">
            Brak receptur w tej kategorii
          </p>
        )}
      </div>
    </div>
  );
};

export default RecipeList;
