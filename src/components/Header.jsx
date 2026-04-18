import React from 'react';
import { LayoutDashboard } from 'lucide-react';

const Header = ({ user, userProfile, activeTab, setActiveTab, setIsAuthModalOpen }) => (
  <header className="no-print bg-[#111827] px-4 py-3 flex justify-between items-center sticky top-0 z-40">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 flex-none">
        <img src="/logo.svg" alt="Logo" className="w-full h-full" />
      </div>
      <span className="font-black text-white text-[15px] uppercase tracking-tight leading-none">
        Masarski Master
      </span>
    </div>

    <div className="flex items-center gap-2">
      {userProfile?.isAdmin && (
        <button
          onClick={() => setActiveTab(activeTab === 'superadmin' ? 'recipes' : 'superadmin')}
          className={`p-2 rounded-xl transition-colors ${
            activeTab === 'superadmin' ? 'bg-[#DC2626] text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <LayoutDashboard size={18} />
        </button>
      )}
      {!user && (
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="bg-[#DC2626] hover:bg-red-700 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide shadow-lg shadow-red-900/30 transition-colors"
        >
          Zaloguj
        </button>
      )}
    </div>
  </header>
);

export default Header;
