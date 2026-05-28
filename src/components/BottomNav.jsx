import React from 'react';
import { Home, BookOpen, Heart, User, Lightbulb } from 'lucide-react';

const TABS = [
  { id: 'home',    label: 'Home',     Icon: Home      },
  { id: 'recipes', label: 'Receptury',Icon: BookOpen  },
  { id: 'tips',    label: 'Porady',   Icon: Lightbulb },
  { id: 'my',      label: 'Moje',     Icon: Heart     },
  { id: 'account', label: 'Konto',    Icon: User      },
];

const BottomNav = ({ activeTab, setActiveTab, user, onShowRegisterPrompt }) => {
  const handleTab = (id) => {
    if (id === 'account' && !user) {
      onShowRegisterPrompt?.();
      return;
    }
    setActiveTab(id);
  };

  return (
    <nav
      className="no-print fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)] border-t border-[var(--border)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => handleTab(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                active ? 'text-red-600' : 'text-[var(--text-dim)] hover:text-[var(--text)]'
              }`}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 1.5}
                fill={active && id === 'my' ? 'currentColor' : 'none'}
              />
              <span className={`text-[8px] font-black uppercase tracking-wider ${active ? 'text-red-600' : 'text-[var(--text-dim)]'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
