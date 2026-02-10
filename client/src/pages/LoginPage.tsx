import { useState } from 'react';
import { supabase } from '../services/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setMessage('נרשמת בהצלחה! בדוק את המייל לאישור.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl">
            🤖 {isSignUp ? 'הרשמה' : 'כניסה'}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-4">
            <input
              type="email"
              placeholder="אימייל"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="סיסמה"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button className="btn btn-primary w-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner" /> : isSignUp ? 'הרשמה' : 'כניסה'}
            </button>
          </form>
          {error && <div className="alert alert-error mt-3 text-sm">{error}</div>}
          {message && <div className="alert alert-success mt-3 text-sm">{message}</div>}
          <div className="text-center mt-2">
            <button className="btn btn-link btn-sm" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'יש לך חשבון? כניסה' : 'אין לך חשבון? הרשמה'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
