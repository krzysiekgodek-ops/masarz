import React, { useState } from 'react';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import {
  Edit3, ChefHat, Trash2, Power, Heart, Plus, Lock,
  CheckCircle2, LayoutDashboard, Star
} from 'lucide-react';
import { auth, db, SUPER_ROOT } from '../firebase';
import { STRIPE_PLANS } from '../stripe';

const DEFAULT_PLANS = {
  food: {
    free: { name: 'Free',  limit: 2    },
    mini: { name: 'Mini',  limit: 15   },
    midi: { name: 'Midi',  limit: 30   },
    max:  { name: 'Max',   limit: 100  },
    maxi: { name: 'Maxi',  limit: 100  },
    vip:  { name: 'VIP',   limit: 9999 },
  },
};

const ClientPanel = ({
  user,
  userProfile,
  myRecipes       = [],
  favoriteRecipes = [],
  favoriteIds     = [],
  plans,
  accountView     = false,
  onSelectRecipe,
  onOpenRecipeModal,
  onToggleFavorite,
  setActiveTab,
}) => {

  const effectivePlan = userProfile?.isTrialActive ? 'max' : (userProfile?.plan || 'free');
  const planSource    = plans?.food ?? DEFAULT_PLANS.food;
  const planData      = planSource[effectivePlan] ?? planSource.free;
  const recipeLimit   = planData.limit;
  const canAdd        = myRecipes.length < recipeLimit;

  const trialDaysLeft = (() => {
    if (!userProfile?.createdAt) return 0;
    const created = new Date(userProfile.createdAt);
    if (isNaN(created.getTime())) return 0;
    return Math.max(0, 21 - Math.floor((new Date() - created) / 86400000));
  })();

  const handleCheckout = (plan) => {
    if (!plan.paymentLink || !user) return;
    const url = new URL(plan.paymentLink);
    url.searchParams.set('client_reference_id', user.uid);
    url.searchParams.set('prefilled_email', user.email);
    window.open(url.toString(), '_blank');
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert('Link do resetowania hasła został wysłany na ' + user.email);
    } catch (e) { alert(e.message); }
  };

  const RecipeRow = ({ recipe, showFav = false }) => {
    const isAdminRecipe = recipe.ownerId === 'ADMIN';
    return (
      <div
        className="relative flex items-center justify-between p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.5rem] hover:border-[var(--text-dim)] transition-all cursor-pointer"
        onClick={() => onSelectRecipe?.(recipe)}
      >
        {isAdminRecipe && (
          <span className="absolute -top-2 left-4 bg-[#DC2626] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-sm">
            <Heart size={8} fill="currentColor" /> Ulubiona
          </span>
        )}

        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0">
            {recipe.imageUrl
              ? <img src={recipe.imageUrl} className="w-full h-full object-cover" alt="" />
              : <ChefHat className="text-[var(--text-dim)]" size={20} />}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-[var(--text)] truncate text-sm">{recipe.name}</h4>
            <span className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">{recipe.category}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {showFav && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(recipe.id); }}
              className="p-2 rounded-xl transition-all text-[#DC2626] hover:bg-red-900/20"
              title="Usuń z ulubionych"
            >
              <Heart size={16} fill="currentColor" />
            </button>
          )}
          {recipe.ownerId === user?.uid && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenRecipeModal?.(recipe); }}
                className="p-2 text-[var(--text-dim)] hover:text-red-500 rounded-xl transition-all"
              >
                <Edit3 size={15} />
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (window.confirm('Usunąć recepturę?')) await deleteDoc(doc(db, 'recipes', recipe.id));
                }}
                className="p-2 text-[var(--text-dim)] hover:text-red-500 rounded-xl transition-all"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════
     WIDOK: MOJE
  ══════════════════════════════════════════════════════ */
  if (!accountView) {
    return (
      <main className="max-w-lg mx-auto p-4 animate-in fade-in duration-300 text-left">

        <div className="mt-4 mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[var(--text)]">Moje receptury</h2>
            <p className="text-xs text-[var(--text-dim)] mt-1 font-medium">
              {myRecipes.length} / {recipeLimit === 9999 ? '∞' : recipeLimit} receptur
            </p>
          </div>
          {canAdd ? (
            <button
              onClick={() => onOpenRecipeModal?.(null)}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg hover:bg-red-700 transition-all"
            >
              <Plus size={14} /> Dodaj
            </button>
          ) : (
            <span className="text-[10px] font-black text-red-400 uppercase bg-red-900/20 px-3 py-2 rounded-xl border border-red-900/30">
              Limit osiągnięty
            </span>
          )}
        </div>

        {myRecipes.length === 0 ? (
          <div className="text-center py-10 bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] mb-6">
            <ChefHat size={36} className="mx-auto mb-3 text-[var(--text-dim)]" />
            <p className="font-bold text-sm text-[var(--text-dim)] uppercase">Nie masz jeszcze receptur</p>
            {canAdd && (
              <button
                onClick={() => onOpenRecipeModal?.(null)}
                className="mt-4 text-red-500 font-black text-xs uppercase underline underline-offset-4"
              >
                Dodaj pierwszą
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {myRecipes.map(r => <RecipeRow key={r.id} recipe={r} />)}
          </div>
        )}

        {favoriteRecipes.length > 0 && (
          <>
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-[var(--text)] flex items-center gap-2 mb-4 mt-6">
              <Heart size={16} className="text-red-500" fill="currentColor" /> Ulubione receptury
            </h3>
            <div className="space-y-3">
              {favoriteRecipes.map(r => <RecipeRow key={r.id} recipe={r} showFav />)}
            </div>
          </>
        )}

        {favoriteRecipes.length === 0 && (
          <div className="mt-3 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.5rem] text-center">
            <Heart size={22} className="mx-auto mb-2 text-[var(--text-dim)]" />
            <p className="text-[11px] font-black text-[var(--text-dim)] uppercase tracking-widest">
              Dodaj ulubione klikając serduszko w zakładce Receptury
            </p>
          </div>
        )}
      </main>
    );
  }

  /* ══════════════════════════════════════════════════════
     WIDOK: KONTO
  ══════════════════════════════════════════════════════ */
  return (
    <main className="max-w-lg mx-auto p-4 animate-in fade-in duration-300 text-left">
      <div className="space-y-4 mt-4">

        {/* Profil */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5 flex items-center gap-5">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg rotate-3 shrink-0">
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[var(--text)] truncate text-sm">{user?.email}</p>
            <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase mt-1 tracking-wider">
              Dołączono: {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('pl-PL') : '—'}
            </p>
          </div>
        </div>

        {/* Subskrypcja */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5">
          <p className="text-[10px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-4">Subskrypcja</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[var(--text)]">Aktywny plan</span>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${
              userProfile?.isTrialActive
                ? 'bg-red-600 text-white'
                : userProfile?.plan === 'free'
                  ? 'bg-[var(--bg-input)] text-[var(--text-dim)]'
                  : 'bg-green-600 text-white'
            }`}>
              {userProfile?.isTrialActive ? 'Trial MAX' : (planData?.name || 'Free')}
            </span>
          </div>
          {userProfile?.isTrialActive && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--text-dim)]">Pozostało w trialu</span>
              <span className="font-black text-orange-400 text-sm">
                {trialDaysLeft} {trialDaysLeft === 1 ? 'dzień' : 'dni'}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[var(--text-dim)]">Wykorzystane receptury</span>
            <span className="font-black text-[var(--text)] text-sm">
              {myRecipes.length} / {recipeLimit === 9999 ? '∞' : recipeLimit}
            </span>
          </div>
          <div className="bg-[var(--bg)] rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${myRecipes.length >= recipeLimit ? 'bg-red-500' : 'bg-red-600'}`}
              style={{ width: `${recipeLimit >= 9999 ? 5 : Math.min(100, (myRecipes.length / Math.max(1, recipeLimit)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Kup / zmień plan */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5">
          <p className="text-[10px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-4">Kup plan roczny</p>
          <div className="space-y-3">
            {STRIPE_PLANS.map(plan => {
              const isActive = effectivePlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => handleCheckout(plan)}
                  disabled={!plan.paymentLink}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                    isActive
                      ? 'bg-red-600 text-white border-red-600 shadow-lg'
                      : 'bg-[var(--bg)] border-[var(--border)] hover:border-red-600 hover:bg-red-900/10 text-[var(--text)]'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center gap-3">
                    {plan.id === 'vip' && (
                      <Star size={14} className={isActive ? 'text-yellow-300' : 'text-yellow-500'} fill="currentColor" />
                    )}
                    <div>
                      <p className="font-black text-sm uppercase tracking-wide">{plan.label}</p>
                      <p className={`text-[10px] font-bold ${isActive ? 'text-red-100' : 'text-[var(--text-dim)]'}`}>
                        {plan.limit >= 9999 ? '∞ receptur' : `do ${plan.limit} receptur`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-black text-sm ${isActive ? 'text-white' : 'text-red-500'}`}>{plan.price}</span>
                    {isActive && <CheckCircle2 size={15} />}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[var(--text-dim)] text-center mt-4 leading-relaxed">
            Po opłaceniu subskrypcji plan zostanie aktywowany w ciągu kilku minut.
          </p>
        </div>

        {/* Zakupione kalkulatory */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5">
          <p className="text-[10px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-4">Zakupione kalkulatory</p>
          <div className="space-y-2">
            {(userProfile?.tools || ['masarski']).map(tool => (
              <div key={tool} className="flex items-center gap-3 p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl">
                <div className="w-9 h-9 bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <ChefHat size={15} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[var(--text)]">
                    {tool === 'masarski' ? 'Masarski Master' : tool}
                  </p>
                  <p className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-wider">Aktywny</p>
                </div>
                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Ustawienia */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5">
          <p className="text-[10px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-4">Ustawienia konta</p>
          <button
            onClick={handleResetPassword}
            className="w-full flex items-center justify-between p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl font-bold text-[var(--text)] hover:border-[var(--text-dim)] transition-all text-sm group"
          >
            <div className="flex items-center gap-3">
              <Lock size={16} className="text-[var(--text-dim)] group-hover:text-red-500 transition-colors" />
              <span>Zmień hasło</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-dim)]"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {userProfile?.isAdmin && (
          <button
            onClick={() => setActiveTab?.('superadmin')}
            className="w-full p-4 bg-[var(--bg-input)] text-[var(--text)] rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:opacity-80 transition-all shadow-lg"
          >
            <LayoutDashboard size={16} /> Panel Administratora
          </button>
        )}

        <button
          onClick={() => signOut(auth)}
          className="w-full flex items-center justify-center gap-3 p-4 bg-red-900/20 text-red-400 rounded-2xl border border-red-900/30 font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all"
        >
          <Power size={16} /> Wyloguj się
        </button>

      </div>
    </main>
  );
};

export default ClientPanel;
