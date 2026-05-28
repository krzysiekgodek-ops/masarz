import React from 'react';
import { X, Lock, BookOpen, Calculator, Heart } from 'lucide-react';

const BENEFITS = [
  { icon: BookOpen,   text: 'Dostęp do wszystkich receptur masarskich' },
  { icon: Calculator, text: 'Pełny kalkulator wsadu bez ograniczeń' },
  { icon: Heart,      text: 'Zapisuj ulubione receptury' },
];

const RegisterPromptModal = ({ onRegister, onLogin, onClose }) => {
  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-xl animate-in fade-in duration-300"
      style={{ background: 'var(--bg-overlay)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full sm:max-w-md relative shadow-2xl border-t-[12px] border-t-red-600">

        {/* Zamknij */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
        >
          <X size={28} />
        </button>

        <div className="px-8 pt-10 pb-10">

          {/* Ikona kłódki */}
          <div className="w-16 h-16 mx-auto mb-6 bg-red-600/10 rounded-2xl flex items-center justify-center">
            <Lock size={32} className="text-red-600" />
          </div>

          {/* Nagłówek */}
          <h2 className="text-2xl font-black uppercase tracking-tighter text-center text-[var(--text)] leading-tight mb-2">
            Odblokuj wszystkie receptury
          </h2>
          <p className="text-center text-[var(--text-dim)] text-sm font-bold mb-8">
            Rejestracja jest{' '}
            <span className="text-red-500 uppercase">zawsze w 100% darmowa</span>
          </p>

          {/* Korzyści */}
          <ul className="space-y-3 mb-8">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-600/10 flex items-center justify-center flex-none">
                  <Icon size={15} className="text-red-500" />
                </div>
                <span className="text-sm font-bold text-[var(--text)]">{text}</span>
              </li>
            ))}
          </ul>

          {/* CTA rejestracja */}
          <button
            onClick={onRegister}
            className="w-full bg-[#DC2626] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-red-900/40 active:scale-95 transition-all mb-3"
          >
            Zarejestruj się bezpłatnie
          </button>

          {/* Link logowanie */}
          <button
            onClick={onLogin}
            className="w-full py-3 text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest hover:text-red-500 transition-colors"
          >
            Mam już konto — zaloguj się
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPromptModal;
