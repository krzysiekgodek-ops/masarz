import React, { useState } from 'react';
import { collection, doc, addDoc, deleteDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Plus, Trash2, Tag, Megaphone, Power, ChevronDown, ChevronRight, Eye, Lock, Unlock, X } from 'lucide-react';
import { auth, db, SUPER_ROOT } from '../firebase';

const formatDate = (ts) => {
  if (!ts) return '';
  if (ts.toDate) return ts.toDate().toLocaleDateString('pl-PL');
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('pl-PL');
  return '';
};

const AdminPanel = ({ allUsers, categories, ads, plans, updatePlayerPlan, toggleAdmin, deleteUserAccount, updatePrice }) => {
  const [adminSubTab, setAdminSubTab]     = useState('users');
  const [newCatName, setNewCatName]       = useState('');
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [userRecipesMap, setUserRecipesMap] = useState({});
  const [previewRecipe, setPreviewRecipe] = useState(null);

  const loadUserRecipes = async (userId) => {
    if (userRecipesMap[userId]) return;
    const snap = await getDocs(query(collection(db, 'recipes'), where('ownerId', '==', userId)));
    setUserRecipesMap(prev => ({
      ...prev,
      [userId]: snap.docs.map(d => ({ ...d.data(), id: d.id })),
    }));
  };

  const handleToggleUser = (userId) => {
    const next = expandedUserId === userId ? null : userId;
    setExpandedUserId(next);
    if (next) loadUserRecipes(next);
  };

  const handleBlockRecipe = async (recipeId, block) => {
    await updateDoc(doc(db, 'recipes', recipeId), { blocked: block });
    setUserRecipesMap(prev => {
      const updated = { ...prev };
      for (const uid in updated) {
        updated[uid] = updated[uid].map(r => r.id === recipeId ? { ...r, blocked: block } : r);
      }
      return updated;
    });
    if (previewRecipe?.id === recipeId) {
      setPreviewRecipe(p => ({ ...p, blocked: block }));
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">

      {/* Nagłówek + zakładki */}
      <div className="flex justify-between items-center mb-12">
        <div className="flex bg-slate-100 p-1.5 rounded-3xl w-fit">
          <button onClick={() => setAdminSubTab('users')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all ${adminSubTab === 'users' ? 'bg-white shadow text-red-600' : 'text-slate-400'}`}>Użytkownicy</button>
          <button onClick={() => setAdminSubTab('pricing')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all ${adminSubTab === 'pricing' ? 'bg-white shadow text-red-600' : 'text-slate-400'}`}>Cennik & Kategorie</button>
          <button onClick={() => setAdminSubTab('ads')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all ${adminSubTab === 'ads' ? 'bg-white shadow text-red-600' : 'text-slate-400'}`}>Reklamy</button>
        </div>
        <button onClick={() => signOut(auth)} className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all shadow-sm">
          <Power size={18} /> Wyloguj
        </button>
      </div>

      {/* ── UŻYTKOWNICY ─────────────────────────────────────────────────────── */}
      {adminSubTab === 'users' && (
        <div className="bg-white rounded-[3rem] p-6 md:p-10 shadow-xl border">
          <div className="divide-y">
            {allUsers.map(u => (
              <React.Fragment key={u.id}>

                {/* Wiersz użytkownika */}
                <div
                  className="flex items-center justify-between py-5 cursor-pointer hover:bg-slate-50 px-2 -mx-2 rounded-2xl transition-colors"
                  onClick={() => handleToggleUser(u.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {expandedUserId === u.id
                      ? <ChevronDown size={14} className="text-slate-400 shrink-0" />
                      : <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    }
                    <span className="font-bold text-slate-800 text-sm truncate">{u.email}</span>
                    {u.isAdmin && (
                      <span className="text-[8px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase shrink-0">Admin</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4" onClick={e => e.stopPropagation()}>
                    <select
                      value={u.plan || 'free'}
                      onChange={e => updatePlayerPlan(u.id, e.target.value)}
                      className="bg-white border p-2 rounded-xl text-[10px] font-black uppercase outline-none"
                    >
                      <option value="free">Free</option>
                      <option value="mini">Mini</option>
                      <option value="midi">Midi</option>
                      <option value="max">Max</option>
                    </select>
                    {u.email !== SUPER_ROOT ? (
                      <>
                        <button
                          onClick={() => toggleAdmin(u.id, u.isAdmin)}
                          className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase ${u.isAdmin ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}
                        >
                          {u.isAdmin ? 'Odbierz' : 'Admin'}
                        </button>
                        <button
                          onClick={() => deleteUserAccount(u.id, u.email)}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors"
                          title="Usuń użytkownika"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] font-black text-red-600 uppercase px-3">Właściciel</span>
                    )}
                  </div>
                </div>

                {/* Rozwinięta lista receptur użytkownika */}
                {expandedUserId === u.id && (
                  <div className="bg-slate-50 rounded-2xl p-4 mt-1 mb-3 mx-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Receptury użytkownika
                    </p>

                    {!userRecipesMap[u.id] ? (
                      <p className="text-xs text-slate-400 py-4 text-center">Ładowanie…</p>
                    ) : userRecipesMap[u.id].length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center font-bold uppercase">Brak receptur</p>
                    ) : (
                      <div className="space-y-2">
                        {userRecipesMap[u.id].map(r => (
                          <div
                            key={r.id}
                            className={`flex items-center justify-between p-3 rounded-xl border ${
                              r.blocked ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-sm text-slate-900 truncate">{r.name}</p>
                                {r.blocked && (
                                  <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase shrink-0">
                                    Zablokowana
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                {r.category}{formatDate(r.updatedAt) ? ` · ${formatDate(r.updatedAt)}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-3 shrink-0">
                              <button
                                onClick={() => setPreviewRecipe(r)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
                              >
                                <Eye size={11} /> Podgląd
                              </button>
                              {r.blocked ? (
                                <button
                                  onClick={() => handleBlockRecipe(r.id, false)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-xl text-[10px] font-black uppercase hover:bg-green-200 transition-all"
                                >
                                  <Unlock size={11} /> Odblokuj
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleBlockRecipe(r.id, true)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-red-200 transition-all"
                                >
                                  <Lock size={11} /> Zablokuj
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ── CENNIK & KATEGORIE ──────────────────────────────────────────────── */}
      {adminSubTab === 'pricing' && plans && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border text-left">
            <h3 className="text-xl font-black uppercase mb-8 text-red-600">Cennik</h3>
            {['mini', 'midi', 'max'].map(k => (
              <div key={k} className="mb-6 bg-slate-50 p-6 rounded-3xl border">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{k}</p>
                <div className="flex gap-4">
                  <input className="bg-white border p-3 rounded-xl flex-1 font-bold outline-none" value={plans.food[k].price} onChange={e => updatePrice('food', k, { ...plans.food[k], price: e.target.value })} />
                  <input className="bg-white border p-3 rounded-xl w-24 text-center font-black outline-none" type="number" value={plans.food[k].limit} onChange={e => updatePrice('food', k, { ...plans.food[k], limit: Number(e.target.value) })} />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#0F172A] p-10 rounded-[3rem] text-white shadow-2xl">
            <h3 className="text-xl font-black uppercase mb-8 text-red-400 flex items-center gap-2"><Tag /> Kategorie Globalne</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-6 pr-2">
              {categories.map(c => (
                <div key={c} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 group">
                  <span className="text-xs font-bold uppercase tracking-widest">{c}</span>
                  <button
                    onClick={async () => {
                      const snap = await getDocs(query(collection(db, 'categories'), where('name', '==', c)));
                      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'categories', d.id))));
                    }}
                    className="text-red-400 opacity-50 group-hover:opacity-100 p-2 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Nowa kategoria..."
                className="bg-white/10 rounded-xl p-4 text-xs w-full text-white outline-none focus:ring-2 focus:ring-red-600"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
              />
              <button
                onClick={async () => {
                  if (!newCatName) return;
                  await addDoc(collection(db, 'categories'), { name: newCatName });
                  setNewCatName('');
                }}
                className="bg-red-600 p-4 rounded-xl hover:bg-red-700 transition-all"
              >
                <Plus />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REKLAMY ─────────────────────────────────────────────────────────── */}
      {adminSubTab === 'ads' && (
        <div className="bg-white rounded-[3rem] p-10 shadow-xl border">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black uppercase">Reklamy & Info</h3>
            <button onClick={() => addDoc(collection(db, 'ads'), { content: 'Nowy komunikat...', active: true })} className="bg-red-600 text-white p-4 rounded-2xl shadow-lg"><Plus /></button>
          </div>
          <div className="space-y-3">
            {ads.map(ad => (
              <div key={ad.id} className={`flex items-center gap-4 p-5 rounded-2xl border mb-2 transition-all ${ad.active ? 'bg-white border-red-100 shadow-sm' : 'bg-slate-50 opacity-40 grayscale'}`}>
                <input className="flex-1 bg-transparent border-none font-bold outline-none" value={ad.content} onChange={e => updateDoc(doc(db, 'ads', ad.id), { content: e.target.value })} />
                <button onClick={() => updateDoc(doc(db, 'ads', ad.id), { active: !ad.active })} className={`p-3 rounded-xl ${ad.active ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}><Megaphone size={18} /></button>
                <button onClick={() => deleteDoc(doc(db, 'ads', ad.id))} className="p-3 text-red-400 hover:bg-red-50 rounded-xl"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL PODGLĄDU RECEPTURY ─────────────────────────────────────────── */}
      {previewRecipe && (
        <div
          className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewRecipe(null)}
        >
          <div
            className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[85vh] overflow-y-auto p-8 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Nagłówek modalu */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-xl font-black text-slate-900">{previewRecipe.name}</h3>
                  {previewRecipe.blocked && (
                    <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">
                      Zablokowana
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{previewRecipe.category}</p>
              </div>
              <button onClick={() => setPreviewRecipe(null)} className="p-2 bg-slate-100 rounded-xl shrink-0">
                <X size={16} />
              </button>
            </div>

            {previewRecipe.imageUrl && (
              <img src={previewRecipe.imageUrl} className="w-full h-40 object-cover rounded-2xl mb-5" alt="" />
            )}

            {/* Surowce */}
            {previewRecipe.meats?.length > 0 && (
              <div className="mb-5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Surowce</p>
                <div className="space-y-2">
                  {previewRecipe.meats.map((m, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-bold text-sm text-slate-900">{m.name}</p>
                        {m.grinding && <p className="text-[10px] text-slate-400">Siatka: {m.grinding}</p>}
                      </div>
                      <span className="font-black text-slate-700 text-sm">{Number(m.percentage ?? 0).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Przyprawy */}
            {previewRecipe.spices?.length > 0 && (
              <div className="mb-5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Przyprawy</p>
                <div className="space-y-2">
                  {previewRecipe.spices.map((s, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <p className="font-bold text-sm text-slate-900">{s.name}</p>
                      <span className="font-black text-slate-700 text-sm">{s.perKg} {s.unit}/kg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opis technologiczny */}
            {previewRecipe.tech && (
              <div className="mb-5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Opis technologiczny</p>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl whitespace-pre-line">
                  {previewRecipe.tech}
                </p>
              </div>
            )}

            {/* Akcja blokowania */}
            <div className="pt-5 border-t">
              {previewRecipe.blocked ? (
                <button
                  onClick={() => handleBlockRecipe(previewRecipe.id, false)}
                  className="w-full py-3 bg-green-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-green-700 transition-all"
                >
                  <Unlock size={14} /> Odblokuj recepturę
                </button>
              ) : (
                <button
                  onClick={() => handleBlockRecipe(previewRecipe.id, true)}
                  className="w-full py-3 bg-red-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-red-700 transition-all"
                >
                  <Lock size={14} /> Zablokuj recepturę
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default AdminPanel;
