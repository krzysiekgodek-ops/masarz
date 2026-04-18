import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, onSnapshot, query, where, addDoc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, SUPER_ROOT } from './firebase';

import Header     from './components/Header';
import BottomNav  from './components/BottomNav';
import AuthModal  from './components/AuthModal';
import RecipeModal from './components/RecipeModal';
import RecipeList from './components/RecipeList';
import Calculator from './components/Calculator';
import ClientPanel from './components/ClientPanel';
import AdminPanel  from './components/AdminPanel';

const DEFAULT_PLANS = {
  food: { free: { name: 'Free', limit: 2, price: '0 zł' }, mini: { name: 'Mini', limit: 15, price: '15 zł / rok' }, midi: { name: 'Midi', limit: 30, price: '25 zł / rok' }, max: { name: 'Max', limit: 100, price: '40 zł / rok' } },
  tech: { free: { name: 'Free', limit: 2, price: '0 zł' }, mini: { name: 'Mini', limit: 15, price: '10 zł netto / msc' }, midi: { name: 'Midi', limit: 30, price: '15 zł netto / msc' }, max: { name: 'Max', limit: 9999, price: '25 zł netto / msc' } }
};

const App = () => {
  // ── Dane globalne ──────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [recipes, setRecipes] = useState({});
  const [categories, setCategories] = useState([]);
  const [ads, setAds] = useState([]);
  const [plans, setPlans] = useState(null);

  // ── Nawigacja ──────────────────────────────────────────────────────────────
  // tabs: 'home' | 'recipes' | 'my' | 'account' | 'calculator' | 'superadmin'
  const [activeTab, setActiveTab] = useState('home');
  const [prevTab, setPrevTab]     = useState('recipes'); // skąd otwarto kalkulator
  const [selectedKey, setSelectedKey] = useState('');   // klucz wybranej receptury
  const [totalTarget, setTotalTarget] = useState(10);   // wsad w kg

  // ── Modale ─────────────────────────────────────────────────────────────────
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState(null);

  // ── Firebase: auth + pricing ───────────────────────────────────────────────
  useEffect(() => {
    const unsubPricing = onSnapshot(doc(db, 'settings', 'pricing'), s => {
      if (s.exists()) setPlans(s.data());
      else setDoc(doc(db, 'settings', 'pricing'), DEFAULT_PLANS);
    });

    const unsubAuth = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        setIsAuthModalOpen(false);
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        let profileData;
        if (userSnap.exists()) {
          profileData = userSnap.data();
        } else {
          profileData = { email: u.email || 'Użytkownik', plan: 'free', tools: ['masarski'], favorites: [], createdAt: new Date().toISOString(), isAdmin: u.email === SUPER_ROOT };
          await setDoc(userRef, profileData);
        }
        if (u.email === SUPER_ROOT) profileData.isAdmin = true;
        profileData.isTrialActive = Math.floor((new Date() - new Date(profileData.createdAt)) / 86400000) <= 21;
        if (!profileData.favorites) profileData.favorites = [];
        setUserProfile(profileData);
      } else {
        setUserProfile(null);
        setActiveTab('home');
      }
    });

    return () => { unsubPricing(); unsubAuth(); };
  }, []);

  // ── Firebase: użytkownicy + reklamy (tylko admin) ──────────────────────────
  useEffect(() => {
    if (!userProfile?.isAdmin) return;
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      setAllUsers(snap.docs.map(d => ({ ...d.data(), id: d.id, tools: d.data().tools || ['masarski'] })));
    });
    const unsubAds = onSnapshot(collection(db, 'ads'), snap => {
      setAds(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    return () => { unsubUsers(); unsubAds(); };
  }, [userProfile?.isAdmin]);

  // ── Firebase: receptury + kategorie ───────────────────────────────────────
  useEffect(() => {
    const ownerIds = user ? ['ADMIN', user.uid] : ['ADMIN'];
    const q = query(collection(db, 'recipes'), where('ownerId', 'in', ownerIds));
    const unsubRecipes = onSnapshot(q, snapshot => {
      const docs = {};
      snapshot.forEach(d => docs[d.id] = { ...d.data(), id: d.id });
      setRecipes(docs);
    });
    const unsubCats = onSnapshot(collection(db, 'categories'), snap => {
      setCategories(snap.docs.map(d => d.data().name).sort());
    });
    return () => { unsubRecipes(); unsubCats(); };
  }, [user]);

  // ── Wybór receptury — zapamiętuje źródłową zakładkę, przechodzi do kalkulatora
  const handleSelectRecipe = (recipe, sourceTab) => {
    setSelectedKey(recipe.id);
    setPrevTab(sourceTab || activeTab);
    setActiveTab('calculator');
  };

  // ── Toggle ulubionej receptury (admina) ───────────────────────────────────
  const toggleFavorite = async (recipeId) => {
    if (!user) { setIsAuthModalOpen(true); return; }
    const current = userProfile?.favorites || [];
    const updated = current.includes(recipeId)
      ? current.filter(id => id !== recipeId)
      : [...current, recipeId];
    await updateDoc(doc(db, 'users', user.uid), { favorites: updated });
    setUserProfile(prev => ({ ...prev, favorites: updated }));
  };

  // ── Modal receptury ────────────────────────────────────────────────────────
  const openRecipeModal = (recipe = null) => {
    setRecipeToEdit(recipe);
    setIsRecipeModalOpen(true);
  };

  const handleSaveRecipe = async (formRecipe) => {
    if (!formRecipe.name || !formRecipe.category) return alert("Uzupełnij dane!");
    const totalInputKg = formRecipe.meats.reduce((acc, m) => acc + Number(m.val ?? m.percentage ?? 0), 0);
    if (totalInputKg <= 0) return alert("Suma wag mięsa musi być większa niż 0!");
    try {
      const payload = {
        ...formRecipe,
        meats: formRecipe.meats.map(m => ({
          name: m.name,
          grinding: m.grinding || '',
          percentage: (Number(m.val ?? m.percentage ?? 0) / totalInputKg) * 100,
          val: Number(m.val ?? m.percentage ?? 0)
        })),
        spices: formRecipe.spices.map(s => ({
          name: s.name,
          unit: s.unit || 'g',
          perKg: Number(s.perKg ?? 0)
        })),
        updatedAt: serverTimestamp(),
        ownerId: userProfile?.isAdmin ? 'ADMIN' : user.uid
      };
      if (formRecipe.id) await updateDoc(doc(db, 'recipes', formRecipe.id), payload);
      else await addDoc(collection(db, 'recipes'), payload);
      setIsRecipeModalOpen(false);
    } catch (e) { alert(e.message); }
  };

  // ── Funkcje admina ─────────────────────────────────────────────────────────
  const updatePlayerPlan = async (userId, newPlan) =>
    await updateDoc(doc(db, 'users', userId), { plan: newPlan });

  const toggleAdmin = async (userId, currentStatus) => {
    if (userProfile.email !== SUPER_ROOT) return alert("Tylko Właściciel.");
    await updateDoc(doc(db, 'users', userId), { isAdmin: !currentStatus });
  };

  const deleteUserAccount = async (userId, userEmail) => {
    if (userProfile.email !== SUPER_ROOT) return alert("Tylko Właściciel może usuwać konta.");
    if (userEmail === SUPER_ROOT) return alert("Nie możesz usunąć konta głównego Właściciela!");
    if (window.confirm(`Czy na pewno chcesz bezpowrotnie usunąć z bazy użytkownika ${userEmail || 'Brak Emaila'}?`)) {
      try { await deleteDoc(doc(db, 'users', userId)); } catch (e) { alert("Błąd usuwania: " + e.message); }
    }
  };

  const updatePrice = async (branch, planKey, newData) => {
    const newPlans = {
      ...plans,
      [branch]: { ...(plans?.[branch] || {}), [planKey]: newData }
    };
    await setDoc(doc(db, 'settings', 'pricing'), newPlans);
  };

  const userRecipesList = useMemo(() => Object.values(recipes), [recipes]);
  const currentRecipe  = recipes[selectedKey] ?? null;
  const adminRecipes   = useMemo(() => Object.values(recipes).filter(r => r.ownerId === 'ADMIN' && !r.blocked), [recipes]);
  const myRecipes      = useMemo(() => Object.values(recipes).filter(r => r.ownerId === user?.uid && !r.blocked), [recipes, user]);
  const favoriteIds    = userProfile?.favorites || [];
  const favoriteRecipes = useMemo(() => adminRecipes.filter(r => favoriteIds.includes(r.id)), [adminRecipes, favoriteIds]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <style>{`
        @media print {
          .no-print, header, footer, nav, .trial-banner { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .print-container { display: block !important; width: 100% !important; }
          @page { size: auto; margin: 15mm; }
        }
      `}</style>

      <Header
        user={user}
        userProfile={userProfile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsAuthModalOpen={setIsAuthModalOpen}
      />

      {/* Główna treść — padding-bottom dla bottom nav */}
      <main
        className="max-w-2xl mx-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
      >
        {/* HOME */}
        {activeTab === 'home' && (
          <div className="p-5 pt-6">
            {/* Banery reklamowe */}
            {ads.filter(a => a.active).map(ad => (
              <div key={ad.id} className="mb-3 bg-[#DC2626] text-white px-4 py-3 rounded-2xl flex items-center gap-3">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-none"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
                <p className="text-xs font-black uppercase tracking-wide leading-tight">{ad.content}</p>
              </div>
            ))}

            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-2">Kalkulatory</h2>
            <p className="text-sm text-slate-500 font-medium mb-6">Wybierz kalkulator, aby rozpocząć pracę</p>

            {/* Masarski Master */}
            <button
              onClick={() => setActiveTab('recipes')}
              className="w-full text-left block bg-white rounded-[2.5rem] border shadow-xl overflow-hidden hover:shadow-2xl transition-all group"
            >
              <div className="h-36 bg-[#DC2626] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/bild/front.jpg')] bg-cover bg-center opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-700" />
                <div className="relative z-10 w-20 h-14"><img src="/logo.svg" alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" /></div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Masarski Master</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Receptury mięsne</p>
                  </div>
                  <span className="bg-red-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shrink-0">Otwórz</span>
                </div>
              </div>
            </button>

            {/* Wkrótce: Kalkulator Techniczny */}
            <div className="mt-4 bg-white rounded-[2.5rem] border shadow-sm overflow-hidden opacity-50 grayscale">
              <div className="h-28 bg-slate-200 flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Kalkulator Techniczny</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Obliczenia technologiczne</p>
                </div>
                <span className="bg-slate-200 text-slate-500 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shrink-0">Wkrótce</span>
              </div>
            </div>

            {/* Wkrótce: Auto Serwis */}
            <div className="mt-4 bg-white rounded-[2.5rem] border shadow-sm overflow-hidden opacity-50 grayscale">
              <div className="h-28 bg-slate-200 flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Auto Serwis</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Kalkulator serwisowy</p>
                </div>
                <span className="bg-slate-200 text-slate-500 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shrink-0">Wkrótce</span>
              </div>
            </div>
          </div>
        )}

        {/* RECEPTURY — tylko admin recipes */}
        {activeTab === 'recipes' && (
          <RecipeList
            recipes={adminRecipes}
            categories={categories}
            ads={ads}
            user={user}
            userProfile={userProfile}
            favoriteIds={favoriteIds}
            onSelectRecipe={(r) => handleSelectRecipe(r, 'recipes')}
            onOpenRecipeModal={openRecipeModal}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {/* MOJE — własne receptury + ulubione */}
        {activeTab === 'my' && userProfile && (
          <ClientPanel
            user={user}
            userProfile={userProfile}
            myRecipes={myRecipes}
            favoriteRecipes={favoriteRecipes}
            favoriteIds={favoriteIds}
            plans={plans}
            onSelectRecipe={(r) => handleSelectRecipe(r, 'my')}
            onOpenRecipeModal={openRecipeModal}
            onToggleFavorite={toggleFavorite}
            setActiveTab={setActiveTab}
          />
        )}

        {/* KONTO */}
        {activeTab === 'account' && userProfile && (
          <ClientPanel
            user={user}
            userProfile={userProfile}
            myRecipes={myRecipes}
            favoriteRecipes={favoriteRecipes}
            favoriteIds={favoriteIds}
            plans={plans}
            accountView
            onSelectRecipe={(r) => handleSelectRecipe(r, 'account')}
            onOpenRecipeModal={openRecipeModal}
            onToggleFavorite={toggleFavorite}
            setActiveTab={setActiveTab}
          />
        )}

        {/* KALKULATOR */}
        {activeTab === 'calculator' && (
          <Calculator
            user={user}
            userProfile={userProfile}
            recipe={currentRecipe}
            totalTarget={totalTarget}
            setTotalTarget={setTotalTarget}
            onBack={() => setActiveTab(prevTab)}
            onEditRecipe={openRecipeModal}
          />
        )}

        {/* SUPERADMIN */}
        {activeTab === 'superadmin' && userProfile?.isAdmin && (
          <AdminPanel
            allUsers={allUsers}
            categories={categories}
            ads={ads}
            plans={plans}
            updatePlayerPlan={updatePlayerPlan}
            toggleAdmin={toggleAdmin}
            deleteUserAccount={deleteUserAccount}
            updatePrice={updatePrice}
          />
        )}
      </main>

      {/* Dolna nawigacja — ukryta w superadmin i w kalkulatorze */}
      {activeTab !== 'superadmin' && activeTab !== 'calculator' && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          setIsAuthModalOpen={setIsAuthModalOpen}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}

      {isRecipeModalOpen && (
        <RecipeModal
          user={user}
          categories={categories}
          initialRecipe={recipeToEdit}
          onClose={() => setIsRecipeModalOpen(false)}
          onSave={handleSaveRecipe}
        />
      )}
    </div>
  );
};

export default App;
