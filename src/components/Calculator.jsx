import React, { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { ArrowLeft, Hash, Zap, BookOpen, Edit3, Printer, FileText, ChefHat } from 'lucide-react';

const formatTechText = (t) => {
  if (!t || typeof t !== 'string') return '';
  const html = t
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/^- (.*$)/gim, '• $1')
    .replace(/\n/g, '<br />');
  return DOMPurify.sanitize(html);
};

const Calculator = ({ user, userProfile, recipe, totalTarget, setTotalTarget, onBack, onEditRecipe }) => {
  const calculations = useMemo(() => {
    if (!recipe) return { meats: [], spices: [] };
    return {
      meats: (recipe.meats || []).map(m => ({
        ...m,
        weight: ((totalTarget * Number(m.percentage ?? 0)) / 100).toFixed(2),
      })),
      spices: (recipe.spices || []).map(s => ({
        ...s,
        weight: (totalTarget * Number(s.perKg ?? 0)).toFixed(2),
      })),
    };
  }, [recipe, totalTarget]);

  /* ── Stan pusty ─────────────────────────────────────── */
  if (!recipe) {
    return (
      <div className="flex items-center justify-center py-24 px-8">
        <p className="text-[var(--text-dim)] font-bold text-sm text-center">
          Wybierz recepturę z zakładki Receptury
        </p>
      </div>
    );
  }

  /* ── Widok kalkulatora ──────────────────────────────── */
  return (
    <div>

      <div className="no-print">

      {/* Nagłówek receptury */}
      <div className="bg-[var(--bg)] px-4 pt-4 pb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[var(--text-dim)] text-[11px] font-black uppercase tracking-wider mb-4"
        >
          <ArrowLeft size={14} /> Wróć
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black text-[#DC2626] uppercase tracking-widest">
              {recipe.category}
            </span>
            <h2 className="text-3xl font-black uppercase text-[var(--text)] leading-tight mt-1 break-words">
              {recipe.name}
            </h2>
          </div>
          {recipe.imageUrl && (
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-none border-2 border-[var(--border)] shadow-xl">
              <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Blok wsadu */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] mx-4 mt-4 rounded-3xl p-6 shadow-xl">
        <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest text-center mb-1">
          Wsad Całkowity (kg)
        </p>
        <input
          type="number"
          max="40"
          value={totalTarget}
          onChange={e => setTotalTarget(Math.min(40, Math.max(0.5, Number(e.target.value))))}
          className="text-7xl font-black w-full text-center bg-transparent outline-none text-[var(--text)] tabular-nums"
        />
        <input
          type="range"
          min="0.5"
          max="40"
          step="0.5"
          value={totalTarget}
          onChange={e => setTotalTarget(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none accent-[#DC2626] mt-4 bg-[var(--border)]"
        />
        <div className="flex justify-between text-[10px] font-bold text-[var(--text-dim)] mt-1.5">
          <span>0.5 kg</span>
          <span>40 kg</span>
        </div>
      </div>

      {/* Surowce */}
      {calculations.meats.length > 0 && (
        <div className="px-4 mt-6">
          <h3 className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Hash size={12} /> Surowce
          </h3>
          <div className="space-y-2">
            {calculations.meats.map((m, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
                <div>
                  <p className="font-black text-[var(--text)] text-sm">{m.name}</p>
                  <p className="text-[10px] font-bold text-[#DC2626] uppercase tracking-wide mt-0.5">
                    Siatka: {m.grinding || '---'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[var(--text)] tabular-nums">{m.weight}</span>
                  <span className="text-xs text-[var(--text-dim)] font-bold ml-1">kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Przyprawy */}
      {calculations.spices.length > 0 && (
        <div className="px-4 mt-6">
          <h3 className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Zap size={12} /> Przyprawy
          </h3>
          <div className="space-y-2">
            {calculations.spices.map((s, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-[var(--bg-input)] rounded-2xl relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#DC2626] rounded-l-2xl" />
                <div className="pl-3">
                  <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">{s.name}</p>
                  <p className="text-2xl font-black text-[var(--text)] tabular-nums leading-tight">
                    {s.weight}
                    <span className="text-xs text-[var(--text-dim)] font-black ml-1">{s.unit}</span>
                  </p>
                </div>
                <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase">{s.perKg} {s.unit}/kg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opis technologiczny */}
      {recipe.tech && (
        <div className="px-4 mt-6">
          <div className="p-5 bg-[var(--bg-card)] border-2 border-dashed border-[var(--border)] rounded-3xl">
            <h5 className="flex items-center gap-2 text-[10px] font-black uppercase text-[var(--text-dim)] mb-4 tracking-widest">
              <BookOpen size={13} /> Opis Technologiczny
            </h5>
            <div
              className="text-sm text-[var(--text)] leading-relaxed font-medium italic"
              dangerouslySetInnerHTML={{ __html: formatTechText(recipe.tech) }}
            />
          </div>
        </div>
      )}

      {/* Przyciski akcji */}
      <div className="px-4 mt-6 flex gap-3">
        {(recipe.ownerId === user?.uid || userProfile?.isAdmin) && (
          <button
            onClick={() => onEditRecipe(recipe)}
            className="flex-1 py-4 bg-[var(--bg-input)] text-[var(--text)] rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          >
            <Edit3 size={15} /> Edytuj
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="flex-1 py-4 bg-[#DC2626] text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 active:scale-[0.97] transition-transform"
        >
          <Printer size={15} /> Drukuj
        </button>
      </div>

      </div>

      {/* ── Karta do druku (ukryta na ekranie) ── */}
      <div className="hidden print:block print-container text-black font-serif text-left">
        <div className="flex justify-between items-center border-b-4 border-black pb-6 mb-8">
          <div className="w-32"><img src="/logo.svg" alt="EBRA" className="w-full" /></div>
          <div className="text-right">
            <h1 className="text-sm font-bold tracking-widest text-slate-400 uppercase leading-none">EBRA Rzemiosło</h1>
            <h2 className="text-3xl font-black tracking-tighter italic uppercase mt-2">Karta Receptury</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 mb-10 border-b-2 border-slate-100 pb-8">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 leading-none">Nazwa Wyrobu:</p>
            <h3 className="text-4xl font-black uppercase italic leading-none">{recipe.name}</h3>
            <p className="mt-4 border-2 border-black inline-block px-4 py-1 text-xs font-bold uppercase tracking-widest leading-none">{recipe.category}</p>
          </div>
          <div className="text-right flex flex-col justify-end">
            <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Wsad:</p>
            <p className="text-6xl font-black tabular-nums leading-none mt-2">{totalTarget} <span className="text-xl font-black">KG</span></p>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-10 mb-10">
          <div className="col-span-7">
            <h4 className="text-xs font-black uppercase border-b-2 border-black pb-2 mb-4 flex items-center gap-2"><FileText size={14} /> Surowce Mięsne</h4>
            <table className="w-full text-sm border-collapse">
              <thead><tr className="text-left border-b border-slate-300"><th className="pb-2">Surowiec</th><th className="pb-2 text-center">Siatka</th><th className="pb-2 text-right">Waga</th></tr></thead>
              <tbody>{calculations.meats.map((m, i) => (<tr key={i} className="border-b border-slate-100"><td className="py-3 font-bold">{m.name}</td><td className="py-3 text-center text-xs italic">{m.grinding || '---'}</td><td className="py-3 text-right font-black">{m.weight} kg</td></tr>))}</tbody>
            </table>
          </div>
          <div className="col-span-5">
            <h4 className="text-xs font-black uppercase border-b-2 border-black pb-2 mb-4 flex items-center gap-2"><Zap size={14} /> Dodatki</h4>
            <table className="w-full text-sm border-collapse">
              <thead><tr className="text-left border-b border-slate-300"><th className="pb-2">Składnik</th><th className="pb-2 text-right">Ilość</th></tr></thead>
              <tbody>{calculations.spices.map((s, i) => (<tr key={i} className="border-b border-slate-100"><td className="py-3">{s.name}</td><td className="py-3 text-right font-black">{s.weight} {s.unit}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
        <div className="border-2 border-black p-8 rounded-2xl mb-10 bg-slate-50/50">
          <h4 className="text-xs font-black uppercase mb-4 flex items-center gap-2"><ChefHat size={14} /> Proces Technologiczny</h4>
          <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatTechText(recipe.tech) }} />
        </div>
        <div className="border-t-2 border-dashed border-slate-300 pt-6 text-center">
          <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest italic">Notatki z produkcji:</h4>
          <div className="space-y-8">{[1, 2, 3].map(l => <div key={l} className="border-b border-slate-200 w-full h-1" />)}</div>
          <div className="mt-12 flex justify-between items-center text-[8px] font-bold text-slate-300 uppercase tracking-[0.4em]">
            <span>Masarski Master PRO</span><span>ebra.pl</span><span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Calculator;
