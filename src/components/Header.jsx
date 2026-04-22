import React from 'react';
import { LayoutDashboard, Cog } from 'lucide-react';

const Header = ({ user, userProfile, activeTab, setActiveTab, setIsAuthModalOpen }) => (
  <header className="no-print bg-[#0F172A] border-b border-[#334155] px-4 py-3 flex justify-between items-center sticky top-0 z-40">
    <a
      href="https://www.ebra.pl"
      className="flex items-center gap-2 cursor-pointer select-none no-underline"
      style={{ textDecoration: 'none' }}
    >
      <Cog
        size={26}
        color="#c9a227"
        strokeWidth={1.75}
        style={{ animation: 'ebra-gear-spin 8s linear infinite', flexShrink: 0 }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, gap: '2px' }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.06em', color: '#fff' }}>
          EBRA
        </span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b' }}>
          Kalkulatory
        </span>
      </div>
    </a>

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
