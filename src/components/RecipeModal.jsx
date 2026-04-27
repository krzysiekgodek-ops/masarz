import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Upload } from 'lucide-react';
import { MYDEVIL_URL } from '../firebase';

const EMPTY_RECIPE = {
  name: '', category: '',
  meats: [{ name: '', val: 0, grinding: '' }],
  spices: [{ name: '', perKg: 0, unit: 'g' }],
  tech: '', imageUrl: '', videoUrl: ''
};

const POPULAR_SPICES = [
  'Sól', 'Peklosól', 'Pieprz mielony', 'Pieprz w ziarnach',
  'Ziele angielskie', 'Papryka ostra', 'Cukier', 'Woda',
  'Czosnek świeży', 'Czosnek suszony', 'Majeranek', 'Kolendra',
];

const RecipeModal = ({ user, categories, initialRecipe, onClose, onSave, recipeCount = 0, recipeLimit = Infinity }) => {
  const isNew = !initialRecipe?.id;
  const overLimit = isNew && recipeCount >= recipeLimit;
  const [formRecipe, setFormRecipe] = useState(() => {
    if (!initialRecipe) return EMPTY_RECIPE;
    return {
      ...EMPTY_RECIPE,
      ...initialRecipe,
      meats: Array.isArray(initialRecipe.meats) && initialRecipe.meats.length > 0
        ? initialRecipe.meats
        : EMPTY_RECIPE.meats,
      spices: Array.isArray(initialRecipe.spices) && initialRecipe.spices.length > 0
        ? initialRecipe.spices
        : EMPTY_RECIPE.spices,
    };
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleMyDevilUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!user) return alert("Musisz być zalogowany, aby wgrać zdjęcie.");
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return alert("Dozwolone formaty: JPG, PNG, WEBP.");
    if (file.size > 5 * 1024 * 1024) return alert("Plik jest za duży. Maksymalny rozmiar to 5 MB.");
    setIsUploading(true);
    const formData = new FormData(); formData.append('file', file);
    try {
      const res = await fetch(MYDEVIL_URL, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setFormRecipe(prev => ({ ...prev, imageUrl: data.url }));
    } catch (e) { alert("Błąd uploadu."); } finally { setIsUploading(false); }
  };

  const updateMeat = (i, field, value) => {
    const list = [...formRecipe.meats];
    list[i] = { ...list[i], [field]: value };
    setFormRecipe({ ...formRecipe, meats: list });
  };

  const updateSpice = (i, field, value) => {
    const list = [...formRecipe.spices];
    list[i] = { ...list[i], [field]: value };
    setFormRecipe({ ...formRecipe, spices: list });
  };

  const totalMeatKg = formRecipe.meats.reduce((acc, m) => acc + Number(m.val ?? m.percentage ?? 0), 0).toFixed(2);

  const inputCls = "w-full p-5 border-2 border-[var(--border)] rounded-2xl font-bold bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-dim)] focus:border-red-600 outline-none";
  const smInputCls = "p-3 border-2 border-[var(--border)] rounded-xl font-bold bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-dim)] outline-none";

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl animate-in zoom-in-95 duration-200"
      style={{ background: 'var(--bg-overlay)' }}
    >
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[4rem] w-full max-w-7xl max-h-[90vh] overflow-y-auto p-10 relative">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 bg-[var(--bg-input)] text-[var(--text-dim)] hover:text-[var(--text)] rounded-full transition-colors"><X /></button>
        <h2 className="text-3xl font-black uppercase mb-10 italic text-left leading-none tracking-tighter text-[var(--text)]">Zarządzanie Recepturą</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 text-left text-[var(--text)]">
          {/* Lewa kolumna — metadane */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-4">Nazwa wyrobu</p>
              <input placeholder="Np. Krakowska Sucha" className={inputCls} value={formRecipe.name} onChange={e => setFormRecipe({ ...formRecipe, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-4">Kategoria</p>
              <select className={`${inputCls} cursor-pointer`} value={formRecipe.category} onChange={e => setFormRecipe({ ...formRecipe, category: e.target.value })}>
                <option value="">Wybierz...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-4 leading-none">Proces (użyj **pogrubienie**)</p>
              <textarea placeholder="Opis procesu produkcyjnego..." className={`${inputCls} h-64`} value={formRecipe.tech} onChange={e => setFormRecipe({ ...formRecipe, tech: e.target.value })} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-4">Link do YouTube (opcjonalny)</p>
              <input placeholder="https://youtube.com/..." className={inputCls} value={formRecipe.videoUrl || ''} onChange={e => setFormRecipe({ ...formRecipe, videoUrl: e.target.value })} />
            </div>
            <div className="bg-[var(--bg)] p-6 rounded-[2.5rem] border-2 border-dashed border-[var(--border)] text-center min-h-[140px] flex items-center justify-center relative overflow-hidden text-[var(--text-dim)]">
              {formRecipe.imageUrl ? (
                <>
                  <img src={formRecipe.imageUrl} className="w-full h-32 object-cover rounded-2xl shadow-lg" alt="Podgląd" />
                  <button onClick={() => setFormRecipe({ ...formRecipe, imageUrl: '' })} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg"><X size={12} /></button>
                </>
              ) : (
                <label className="cursor-pointer w-full">
                  <Upload size={40} className="mx-auto mb-2 opacity-30" />
                  <span className="text-[9px] font-black uppercase tracking-widest">{isUploading ? 'Wgrywanie...' : 'Wgraj zdjęcie'}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleMyDevilUpload} disabled={isUploading} />
                </label>
              )}
            </div>
          </div>

          {/* Prawa kolumna — składniki */}
          <div className="space-y-6">
            <div className="flex justify-between items-center font-black uppercase text-[var(--text-dim)] ml-2 tracking-widest">
              Wprowadź Surowce (KG)
              <button onClick={() => setFormRecipe({ ...formRecipe, meats: [...formRecipe.meats, { name: '', val: 0, grinding: '' }] })} className="p-2 bg-red-600 text-white rounded-lg shadow-lg"><Plus size={16} /></button>
            </div>
            {formRecipe.meats.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input placeholder="Mięso" className={`flex-1 ${smInputCls}`} value={m.name} onChange={e => updateMeat(i, 'name', e.target.value)} />
                <input placeholder="Sitko" className={`w-24 text-center text-xs ${smInputCls}`} value={m.grinding} onChange={e => updateMeat(i, 'grinding', e.target.value)} />
                <div className="relative">
                  <input type="number" className={`w-24 text-center font-black text-red-500 pr-6 ${smInputCls}`} value={m.val ?? m.percentage ?? ''} onChange={e => updateMeat(i, 'val', e.target.value)} />
                  <span className="absolute right-2 top-3.5 text-[8px] font-black text-[var(--text-dim)]">KG</span>
                </div>
                <button onClick={() => { const l = [...formRecipe.meats]; l.splice(i, 1); setFormRecipe({ ...formRecipe, meats: l }); }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            ))}
            <div className="bg-[var(--bg)] border border-[var(--border)] p-4 rounded-2xl text-[10px] font-black uppercase text-[var(--text-dim)] flex justify-between">
              <span>Suma wag:</span><span className="text-red-500">{totalMeatKg} KG</span>
            </div>

            <div className="flex justify-between items-center font-black uppercase text-[var(--text-dim)] ml-2 tracking-widest mt-6">
              Przyprawy (g/kg)
              <button onClick={() => setFormRecipe({ ...formRecipe, spices: [{ name: '', perKg: 0, unit: 'g' }, ...formRecipe.spices] })} className="p-2 bg-[var(--bg-input)] text-[var(--text)] rounded-lg shadow-lg"><Plus size={16} /></button>
            </div>
            {formRecipe.spices.map((s, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <select
                  className={`text-xs ${smInputCls}`}
                  value=""
                  onChange={e => { if (e.target.value) updateSpice(i, 'name', e.target.value); }}
                >
                  <option value="">Wybierz lub wpisz własną...</option>
                  {POPULAR_SPICES.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                </select>
                <div className="flex gap-2">
                  <input placeholder="Nazwa" className={`flex-1 ${smInputCls}`} value={s.name} onChange={e => updateSpice(i, 'name', e.target.value)} />
                  <input type="number" step="0.1" className={`w-24 text-center font-black ${smInputCls}`} value={s.perKg} onChange={e => updateSpice(i, 'perKg', e.target.value)} />
                  <select className={`w-20 text-center text-xs ${smInputCls}`} value={s.unit} onChange={e => updateSpice(i, 'unit', e.target.value)}>
                    <option value="g">g</option>
                    <option value="łyż.">łyż.</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="szt">szt</option>
                    <option value="ząbki">ząbki</option>
                    <option value="kulki">kulki</option>
                  </select>
                  <button onClick={() => { const l = [...formRecipe.spices]; l.splice(i, 1); setFormRecipe({ ...formRecipe, spices: l }); }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {overLimit && (
          <p className="mt-10 text-center text-sm font-bold text-red-500">
            Osiągnięto limit {recipeLimit} receptur dla aktywnego planu. Kup wyższy plan, aby dodać więcej.
          </p>
        )}
        <button
          onClick={() => !overLimit && onSave(formRecipe)}
          disabled={overLimit}
          className={`w-full mt-4 py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl transition-all ${
            overLimit
              ? 'bg-[var(--bg-input)] text-[var(--text-dim)] cursor-not-allowed'
              : 'bg-[#DC2626] text-white hover:bg-red-700 active:scale-95'
          }`}
        >
          <Save className="inline mr-2" /> Zapisz Recepturę
        </button>
      </div>
    </div>
  );
};

export default RecipeModal;
