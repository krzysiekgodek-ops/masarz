import React, { useState, useMemo } from 'react';
import { collection, doc, addDoc, deleteDoc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Plus, Trash2, Megaphone, Power, ChevronDown, ChevronRight, Eye, Lock, Unlock, X, Users, CreditCard, BookOpen, UserPlus, Download, FileText } from 'lucide-react';
import { auth, db, SUPER_ROOT } from '../firebase';

const formatDate = (ts) => {
  if (!ts) return '';
  if (ts.toDate) return ts.toDate().toLocaleDateString('pl-PL');
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('pl-PL');
  return '';
};

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6 flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <Icon size={16} className={accent ? 'text-[#DC2626]' : 'text-[#94A3B8]'} />
      <span className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">{label}</span>
    </div>
    <span className="text-4xl font-black text-white">{value}</span>
  </div>
);

const AdminPanel = ({ allUsers, categories, ads, allRecipes = [], updatePlayerPlan, toggleAdmin, deleteUserAccount, onAddRecipe }) => {
  const [adminSubTab, setAdminSubTab]       = useState('dashboard');
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [userRecipesMap, setUserRecipesMap] = useState({});
  const [previewRecipe, setPreviewRecipe]   = useState(null);

  const userEmailMap = useMemo(() => {
    const m = {};
    allUsers.forEach(u => { m[u.id] = u.email; });
    return m;
  }, [allUsers]);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const stats = useMemo(() => ({
    totalUsers: allUsers.length,
    activeSubscriptions: allUsers.filter(u => u.plan && u.plan !== 'free').length,
    totalRecipes: allRecipes.length,
    newUsersWeek: allUsers.filter(u => {
      if (!u.createdAt) return false;
      const ts = u.createdAt.seconds ? u.createdAt.seconds * 1000 : Number(u.createdAt);
      return ts >= sevenDaysAgo;
    }).length,
  }), [allUsers, allRecipes]);

  const recentUsers = useMemo(() =>
    [...allUsers]
      .filter(u => u.createdAt)
      .sort((a, b) => {
        const ta = a.createdAt.seconds ?? 0;
        const tb = b.createdAt.seconds ?? 0;
        return tb - ta;
      })
      .slice(0, 10),
    [allUsers]
  );

  const pendingRecipes = useMemo(() =>
    allRecipes.filter(r => r.ownerId !== 'ADMIN' && !r.blocked),
    [allRecipes]
  );

  const activeAds = useMemo(() => ads.filter(ad => ad.active), [ads]);

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
    if (previewRecipe?.id === recipeId) setPreviewRecipe(p => ({ ...p, blocked: block }));
  };

  const exportUsersCSV = () => {
    const header = 'email,plan,createdAt';
    const rows = allUsers.map(u => `${u.email},${u.plan || 'free'},${formatDate(u.createdAt)}`);
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uzytkownicy.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'users',     label: 'Użytkownicy' },
    { id: 'ads',       label: 'Reklamy' },
  ];

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">

      {/* Nagłówek + zakładki */}
      <div className="flex justify-between items-center mb-12 flex-wrap gap-4">
        <div className="flex bg-[#0F172A] border border-[#334155] p-1.5 rounded-3xl w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setAdminSubTab(t.id)}
              className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all ${adminSubTab === t.id ? 'bg-[#1E293B] shadow text-red-500' : 'text-[#64748B]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => signOut(auth)} className="flex items-center gap-2 px-6 py-3 bg-red-900/20 text-red-400 rounded-2xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all border border-red-900/30">
          <Power size={18} /> Wyloguj
        </button>
      </div>

      {/* ── DASHBOARD ───────────────────────────────────────────────────────── */}
      {adminSubTab === 'dashboard' && (
        <div className="space-y-8">

          {/* Wiersz 1 — Statystyki */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users}        label="Wszyscy użytkownicy"    value={stats.totalUsers} />
            <StatCard icon={CreditCard}   label="Aktywne subskrypcje"    value={stats.activeSubscriptions} accent />
            <StatCard icon={BookOpen}     label="Receptury w systemie"   value={stats.totalRecipes} />
            <StatCard icon={UserPlus}     label="Nowi (ostatnie 7 dni)"  value={stats.newUsersWeek} />
          </div>

          {/* Wiersz 2 — Ostatni zarejestrowani */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8] mb-4">Ostatnio zarejestrowani (10)</p>
            <div className="divide-y divide-[#334155]">
              {recentUsers.length === 0 && (
                <p className="text-xs text-[#94A3B8] py-4 text-center">Brak danych</p>
              )}
              {recentUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between py-3">
                  <span className="text-sm font-bold text-white truncate flex-1 pr-4">{u.email}</span>
                  <span className="text-[10px] text-[#94A3B8] font-bold shrink-0 mr-4">{formatDate(u.createdAt)}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full shrink-0 ${u.plan && u.plan !== 'free' ? 'bg-red-900/30 text-red-400' : 'bg-[#334155] text-[#94A3B8]'}`}>
                    {u.plan || 'free'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Wiersz 3 — Moderacja + Aktywne reklamy */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8] mb-4">
                Receptury do moderacji ({pendingRecipes.length})
              </p>
              {pendingRecipes.length === 0 ? (
                <p className="text-xs text-[#94A3B8] py-4 text-center font-bold uppercase">Brak receptur</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {pendingRecipes.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-[#0F172A] border border-[#334155] rounded-2xl">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-bold text-sm text-white truncate">{r.name}</p>
                        <p className="text-[10px] text-[#94A3B8]">
                          {userEmailMap[r.ownerId] || r.ownerId}
                          {formatDate(r.updatedAt) ? ` · ${formatDate(r.updatedAt)}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleBlockRecipe(r.id, true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-900/20 text-red-400 rounded-xl text-[9px] font-black uppercase hover:bg-red-600 hover:text-white transition-all shrink-0"
                      >
                        <Lock size={10} /> Zablokuj
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8] mb-4">
                Aktywne reklamy ({activeAds.length})
              </p>
              {activeAds.length === 0 ? (
                <p className="text-xs text-[#94A3B8] py-4 text-center font-bold uppercase">Brak aktywnych reklam</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {activeAds.map(ad => (
                    <div key={ad.id} className="flex items-center gap-3 p-3 bg-[#0F172A] border border-[#334155] rounded-2xl">
                      <p className="text-sm text-white flex-1 truncate">{ad.content}</p>
                      <button
                        onClick={() => updateDoc(doc(db, 'ads', ad.id), { active: false })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#334155] text-[#94A3B8] rounded-xl text-[9px] font-black uppercase hover:bg-[#475569] transition-all shrink-0"
                      >
                        <Megaphone size={10} /> Wyłącz
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Wiersz 4 — Szybkie akcje */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8] mb-4">Szybkie akcje</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onAddRecipe?.()}
                className="flex items-center gap-2 px-5 py-3 bg-[#DC2626] text-white rounded-2xl text-xs font-black uppercase hover:bg-red-700 transition-all"
              >
                <Plus size={14} /> Dodaj recepturę wzorcową
              </button>
              <button
                onClick={() => addDoc(collection(db, 'ads'), { content: 'Nowy komunikat...', active: true })}
                className="flex items-center gap-2 px-5 py-3 bg-[#334155] text-[#94A3B8] rounded-2xl text-xs font-black uppercase hover:bg-[#475569] hover:text-white transition-all"
              >
                <Megaphone size={14} /> Dodaj reklamę
              </button>
              <button
                onClick={exportUsersCSV}
                className="flex items-center gap-2 px-5 py-3 bg-[#334155] text-[#94A3B8] rounded-2xl text-xs font-black uppercase hover:bg-[#475569] hover:text-white transition-all"
              >
                <Download size={14} /> Eksportuj użytkowników
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── UŻYTKOWNICY ─────────────────────────────────────────────────────── */}
      {adminSubTab === 'users' && (
        <div className="bg-[#1E293B] border border-[#334155] rounded-[3rem] p-6 md:p-10 shadow-xl">
          <div className="divide-y divide-[#334155]">
            {allUsers.map(u => (
              <React.Fragment key={u.id}>

                <div
                  className="flex items-center justify-between py-5 cursor-pointer hover:bg-[#0F172A] px-2 -mx-2 rounded-2xl transition-colors"
                  onClick={() => handleToggleUser(u.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {expandedUserId === u.id
                      ? <ChevronDown size={14} className="text-[#94A3B8] shrink-0" />
                      : <ChevronRight size={14} className="text-[#94A3B8] shrink-0" />
                    }
                    <span className="font-bold text-[#F8FAFC] text-sm truncate">{u.email}</span>
                    {u.isAdmin && (
                      <span className="text-[8px] font-black bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full uppercase shrink-0">Admin</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4" onClick={e => e.stopPropagation()}>
                    <select
                      value={u.plan || 'free'}
                      onChange={e => updatePlayerPlan(u.id, e.target.value)}
                      className="bg-[#0F172A] border border-[#334155] text-[#F8FAFC] p-2 rounded-xl text-[10px] font-black uppercase outline-none"
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
                          className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase ${u.isAdmin ? 'bg-red-900/30 text-red-400' : 'bg-[#334155] text-[#94A3B8]'}`}
                        >
                          {u.isAdmin ? 'Odbierz' : 'Admin'}
                        </button>
                        <button
                          onClick={() => deleteUserAccount(u.id, u.email)}
                          className="p-2 bg-red-900/20 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-colors"
                          title="Usuń użytkownika"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] font-black text-red-500 uppercase px-3">Właściciel</span>
                    )}
                  </div>
                </div>

                {expandedUserId === u.id && (
                  <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-4 mt-1 mb-3 mx-1">
                    <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-3">
                      Receptury użytkownika
                    </p>

                    {!userRecipesMap[u.id] ? (
                      <p className="text-xs text-[#94A3B8] py-4 text-center">Ładowanie…</p>
                    ) : userRecipesMap[u.id].length === 0 ? (
                      <p className="text-xs text-[#94A3B8] py-4 text-center font-bold uppercase">Brak receptur</p>
                    ) : (
                      <div className="space-y-2">
                        {userRecipesMap[u.id].map(r => (
                          <div
                            key={r.id}
                            className={`flex items-center justify-between p-3 rounded-xl border ${
                              r.blocked ? 'bg-red-900/20 border-red-900/30' : 'bg-[#1E293B] border-[#334155]'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-sm text-[#F8FAFC] truncate">{r.name}</p>
                                {r.blocked && (
                                  <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase shrink-0">
                                    Zablokowana
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mt-0.5">
                                {r.category}{formatDate(r.updatedAt) ? ` · ${formatDate(r.updatedAt)}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-3 shrink-0">
                              <button
                                onClick={() => setPreviewRecipe(r)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#334155] text-[#94A3B8] rounded-xl text-[10px] font-black uppercase hover:bg-[#475569] transition-all"
                              >
                                <Eye size={11} /> Podgląd
                              </button>
                              {r.blocked ? (
                                <button
                                  onClick={() => handleBlockRecipe(r.id, false)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/30 text-green-400 rounded-xl text-[10px] font-black uppercase hover:bg-green-700 hover:text-white transition-all"
                                >
                                  <Unlock size={11} /> Odblokuj
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleBlockRecipe(r.id, true)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 text-red-400 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all"
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

      {/* ── REKLAMY ─────────────────────────────────────────────────────────── */}
      {adminSubTab === 'ads' && (
        <div className="bg-[#1E293B] border border-[#334155] rounded-[3rem] p-10 shadow-xl">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black uppercase text-[#F8FAFC]">Reklamy & Info</h3>
            <button onClick={() => addDoc(collection(db, 'ads'), { content: 'Nowy komunikat...', active: true })} className="bg-red-600 text-white p-4 rounded-2xl shadow-lg"><Plus /></button>
          </div>
          <div className="space-y-3">
            {ads.map(ad => (
              <div key={ad.id} className={`flex items-center gap-4 p-5 rounded-2xl border mb-2 transition-all ${ad.active ? 'bg-[#0F172A] border-red-900/30' : 'bg-[#0F172A] border-[#334155] opacity-40 grayscale'}`}>
                <input className="flex-1 bg-transparent border-none font-bold outline-none text-[#F8FAFC]" value={ad.content} onChange={e => updateDoc(doc(db, 'ads', ad.id), { content: e.target.value })} />
                <button onClick={() => updateDoc(doc(db, 'ads', ad.id), { active: !ad.active })} className={`p-3 rounded-xl ${ad.active ? 'bg-green-900/30 text-green-400' : 'bg-[#334155] text-[#94A3B8]'}`}><Megaphone size={18} /></button>
                <button onClick={() => deleteDoc(doc(db, 'ads', ad.id))} className="p-3 text-red-400 hover:bg-red-900/20 rounded-xl"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL PODGLĄDU RECEPTURY ─────────────────────────────────────────── */}
      {previewRecipe && (
        <div
          className="fixed inset-0 bg-[#0F172A]/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewRecipe(null)}
        >
          <div
            className="bg-[#1E293B] border border-[#334155] rounded-[2.5rem] w-full max-w-lg max-h-[85vh] overflow-y-auto p-8 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-xl font-black text-[#F8FAFC]">{previewRecipe.name}</h3>
                  {previewRecipe.blocked && (
                    <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">
                      Zablokowana
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{previewRecipe.category}</p>
              </div>
              <button onClick={() => setPreviewRecipe(null)} className="p-2 bg-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] rounded-xl shrink-0 transition-colors">
                <X size={16} />
              </button>
            </div>

            {previewRecipe.imageUrl && (
              <img src={previewRecipe.imageUrl} className="w-full h-40 object-cover rounded-2xl mb-5" alt="" />
            )}

            {previewRecipe.meats?.length > 0 && (
              <div className="mb-5">
                <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-3">Surowce</p>
                <div className="space-y-2">
                  {previewRecipe.meats.map((m, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-[#0F172A] border border-[#334155] rounded-xl">
                      <div>
                        <p className="font-bold text-sm text-[#F8FAFC]">{m.name}</p>
                        {m.grinding && <p className="text-[10px] text-[#94A3B8]">Siatka: {m.grinding}</p>}
                      </div>
                      <span className="font-black text-[#F8FAFC] text-sm">{Number(m.percentage ?? 0).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previewRecipe.spices?.length > 0 && (
              <div className="mb-5">
                <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-3">Przyprawy</p>
                <div className="space-y-2">
                  {previewRecipe.spices.map((s, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-[#0F172A] border border-[#334155] rounded-xl">
                      <p className="font-bold text-sm text-[#F8FAFC]">{s.name}</p>
                      <span className="font-black text-[#F8FAFC] text-sm">{s.perKg} {s.unit}/kg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previewRecipe.tech && (
              <div className="mb-5">
                <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-3">Opis technologiczny</p>
                <p className="text-sm text-slate-300 leading-relaxed bg-[#0F172A] border border-[#334155] p-4 rounded-2xl whitespace-pre-line">
                  {previewRecipe.tech}
                </p>
              </div>
            )}

            <div className="pt-5 border-t border-[#334155]">
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
