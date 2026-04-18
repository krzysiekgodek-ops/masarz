import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Upload } from 'lucide-react';
import { MYDEVIL_URL } from '../firebase';

const EMPTY_RECIPE = {
  name: '', category: '',
  meats: [{ name: '', val: 0, grinding: '' }],
  spices: [{ name: '', perKg: 0, unit: 'g' }],
  tech: '', imageUrl: ''
};

const RecipeModal = ({ user, categories, initialRecipe, onClose, onSave }) => {
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

  return (
    <div className="no-print fixed inset-0 bg-slate-900/95 z-50 flex items-center justify-center p-4 backdrop-blur-xl animate-in zoom-in-95 duration-200">
      <div className="bg-white rounded-[4rem] w-full max-w-7xl max-h-[90vh] overflow-y-auto p-10 relative">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 bg-slate-100 rounded-full"><X /></button>
        <h2 className="text-3xl font-black uppercase mb-10 italic text-left leading-none tracking-tighter">Zarządzanie Recepturą</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 text-left text-slate-800">
          {/* Lewa kolumna — metadane */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-300 uppercase ml-4">Nazwa wyrobu</p>
              <input placeholder="Np. Krakowska Sucha" className="w-full p-5 border-2 rounded-2xl font-bold focus:border-red-600 outline-none" value={formRecipe.name} onChange={e => setFormRecipe({ ...formRecipe, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-300 uppercase ml-4">Kategoria</p>
              <select className="w-full p-5 border-2 rounded-2xl font-bold cursor-pointer outline-none" value={formRecipe.category} onChange={e => setFormRecipe({ ...formRecipe, category: e.target.value })}>
                <option value="">Wybierz...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-300 uppercase ml-4 leading-none">Proces (użyj **pogrubienie**)</p>
              <textarea placeholder="Opis procesu produkcyjnego..." className="w-full p-5 border-2 rounded-2xl h-64 font-medium outline-none focus:border-red-600 text-left" value={formRecipe.tech} onChange={e => setFormRecipe({ ...formRecipe, tech: e.target.value })} />
            </div>
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-dashed text-center min-h-[140px] flex items-center justify-center relative overflow-hidden text-slate-400">
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
            <div className="flex justify-between items-center font-black uppercase text-slate-400 ml-2 tracking-widest">
              Wprowadź Surowce (KG)
              <button onClick={() => setFormRecipe({ ...formRecipe, meats: [...formRecipe.meats, { name: '', val: 0, grinding: '' }] })} className="p-2 bg-red-600 text-white rounded-lg shadow-lg"><Plus size={16} /></button>
            </div>
            {formRecipe.meats.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input placeholder="Mięso" className="flex-1 p-3 border-2 rounded-xl font-bold" value={m.name} onChange={e => updateMeat(i, 'name', e.target.value)} />
                <input placeholder="Sitko" className="w-24 p-3 border-2 rounded-xl text-center text-xs" value={m.grinding} onChange={e => updateMeat(i, 'grinding', e.target.value)} />
                <div className="relative">
                  <input type="number" className="w-24 p-3 border-2 rounded-xl text-center font-black text-red-600 pr-6" value={m.val ?? m.percentage ?? ''} onChange={e => updateMeat(i, 'val', e.target.value)} />
                  <span className="absolute right-2 top-3.5 text-[8px] font-black text-slate-300">KG</span>
                </div>
                <button onClick={() => { const l = [...formRecipe.meats]; l.splice(i, 1); setFormRecipe({ ...formRecipe, meats: l }); }} className="text-red-300 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            ))}
            <div className="bg-slate-50 p-4 rounded-2xl text-[10px] font-black uppercase text-slate-400 flex justify-between">
              <span>Suma wag:</span><span className="text-red-600">{totalMeatKg} KG</span>
            </div>

            <div className="flex justify-between items-center font-black uppercase text-slate-400 ml-2 tracking-widest mt-6">
              Przyprawy (g/kg)
              <button onClick={() => setFormRecipe({ ...formRecipe, spices: [...formRecipe.spices, { name: '', perKg: 0, unit: 'g' }] })} className="p-2 bg-slate-900 text-white rounded-lg shadow-lg"><Plus size={16} /></button>
            </div>
            {formRecipe.spices.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input placeholder="Nazwa" className="flex-1 p-3 border-2 rounded-xl font-bold" value={s.name} onChange={e => updateSpice(i, 'name', e.target.value)} />
                <input type="number" step="0.1" className="w-24 p-3 border-2 rounded-xl text-center font-black" value={s.perKg} onChange={e => updateSpice(i, 'perKg', e.target.value)} />
                <select className="w-20 p-3 border-2 rounded-xl text-center font-bold text-xs bg-white outline-none" value={s.unit} onChange={e => updateSpice(i, 'unit', e.target.value)}>
                  <option value="g">g</option>
                  <option value="łyż.">łyż.</option>
                  <option value="ml">ml</option>
                  <option value="l">l</option>
                  <option value="szt">szt</option>
                </select>
                <button onClick={() => { const l = [...formRecipe.spices]; l.splice(i, 1); setFormRecipe({ ...formRecipe, spices: l }); }} className="text-red-300 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => onSave(formRecipe)} className="w-full mt-10 py-6 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:bg-black active:scale-95 transition-all">
          <Save className="inline mr-2" /> Zapisz Recepturę
        </button>
      </div>
    </div>
  );
};

export default RecipeModal;
