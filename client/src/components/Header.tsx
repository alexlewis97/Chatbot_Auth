import { supabase } from '../services/supabase';
import { isSkipAuth } from '../services/auth';

interface HeaderProps {
  userEmail?: string;
}

export default function Header({ userEmail }: HeaderProps) {
  return (
    <header className="navbar bg-primary text-primary-content shadow-lg">
      <div className="flex-1">
        <span className="text-xl font-bold">🤖 Base42 — ניהול הרשאות צ'אטבוטים</span>
      </div>
      <div className="flex-none gap-2">
        <span className="text-sm opacity-80">
          {isSkipAuth ? 'מצב בדיקה' : userEmail}
        </span>
        {!isSkipAuth && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => supabase.auth.signOut()}
          >
            יציאה
          </button>
        )}
      </div>
    </header>
  );
}
