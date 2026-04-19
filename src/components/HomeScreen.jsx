import React, { useState } from 'react';
import { Heart } from 'lucide-react';

const STORAGE_KEY = 'favorite_calculators';

const CALCULATORS = [
  {
    id: 'masarski',
    name: 'Masarski Master',
    description: 'Receptury mięsne i wędliniarskie',
    active: true,
  },
  {
    id: 'techniczny',
    name: 'Kalkulator Techniczny',
    description: 'Obliczenia technologiczne',
    active: false,
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>
      </svg>
    ),
  },
  {
    id: 'autoserwis',
    name: 'Auto Serwis',
    description: 'Kalkulator serwisowy',
    active: false,
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
];

const HomeScreen = ({ setActiveTab, ads }) => {
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  });
  const [toast, setToast] = useState(false);

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleCardClick = (calc) => {
    if (calc.active) {
      setActiveTab('recipes');
    } else {
      setToast(true);
      setTimeout(() => setToast(false), 2500);
    }
  };

  const sorted = [...CALCULATORS].sort((a, b) => {
    const aFav = favorites.includes(a.id) ? 0 : 1;
    const bFav = favorites.includes(b.id) ? 0 : 1;
    return aFav - bFav;
  });

  return (
    <div className="p-5 pt-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-lg tracking-wide pointer-events-none">
          Wkrótce dostępne
        </div>
      )}

      {/* Banery reklamowe */}
      {ads.filter(a => a.active).map(ad => (
        <div key={ad.id} className="mb-3 bg-[#DC2626] text-white px-4 py-3 rounded-2xl flex items-center gap-3">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-none">
            <path d="M3 11l19-9-9 19-2-8-8-2z"/>
          </svg>
          <p className="text-xs font-black uppercase tracking-wide leading-tight">{ad.content}</p>
        </div>
      ))}

      <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[#F8FAFC] leading-none mb-2">Kalkulatory</h2>
      <p className="text-sm text-[#94A3B8] font-medium mb-6">Wybierz kalkulator, aby rozpocząć pracę</p>

      <div className="flex flex-col gap-4">
        {sorted.map(calc => {
          const isFav = favorites.includes(calc.id);
          return (
            <div key={calc.id} className="relative">
              {/* Karta kalkulatora */}
              <button
                onClick={() => handleCardClick(calc)}
                className={`w-full text-left bg-[#1E293B] rounded-[2.5rem] border border-[#334155] overflow-hidden transition-all ${
                  calc.active
                    ? 'shadow-xl hover:shadow-2xl group'
                    : 'opacity-50 grayscale'
                }`}
              >
                {calc.active ? (
                  <div className="relative w-full overflow-hidden" style={{ height: '200px' }}>
                    {/* Zdjęcie banera */}
                    <img
                      src="/masarz-banner.jpg"
                      alt="Masarski Master"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    {/* Ciemny gradient po lewej */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
                    {/* Logo góra środek */}
                    <img src="/logo.svg" alt="Logo" className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-12 drop-shadow z-10" />
                    {/* Tekst po lewej */}
                    <div className="absolute inset-0 flex flex-col justify-center px-7 gap-1">
                      <p className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none drop-shadow">
                        Masarski Master
                      </p>
                      <p className="text-sm text-slate-300 font-medium">Receptury mięsne</p>
                      <span className="mt-3 self-start bg-[#DC2626] text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest">
                        Otwórz
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-28 bg-[#0F172A] flex items-center justify-center">
                    {calc.icon}
                  </div>
                )}

                {!calc.active && (
                  <div className="p-6 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-xl font-black uppercase italic tracking-tighter text-[#F8FAFC]">{calc.name}</h3>
                      <p className="text-xs text-[#94A3B8] font-medium mt-1">{calc.description}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest bg-[#334155] text-[#94A3B8]">
                      Wkrótce
                    </span>
                  </div>
                )}
              </button>

              {/* Przycisk serce — poza <button> karty, żeby nie triggerował kliknięcia */}
              <button
                onClick={(e) => toggleFavorite(calc.id, e)}
                aria-label={isFav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-[#1E293B]/90 backdrop-blur-sm shadow-md transition-transform active:scale-90 hover:scale-110"
              >
                <Heart
                  size={18}
                  strokeWidth={2}
                  fill={isFav ? '#DC2626' : 'none'}
                  stroke={isFav ? '#DC2626' : '#94a3b8'}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HomeScreen;
