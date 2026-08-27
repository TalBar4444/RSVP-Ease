import { useState } from 'react';
import {
  getRememberedEmail,
  getRememberMe,
  setRememberMe,
  setRememberedEmail,
  supabase,
} from '../../lib/supabaseClient';
import AdminShell, { GoldDivider } from './AdminShell';

export default function AdminLogin() {
  const [email, setEmail] = useState(getRememberedEmail);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMeChecked] = useState(getRememberMe);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setLoginError(null);

    const trimmedEmail = email.trim();
    const previousRememberMe = getRememberMe();
    setRememberMe(rememberMe);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        setRememberMe(previousRememberMe);
        setLoginError('אימייל או סיסמה שגויים.');
        return;
      }

      setRememberedEmail(rememberMe ? trimmedEmail : null);
    } catch (err) {
      console.error(err);
      setRememberMe(previousRememberMe);
      setLoginError('לא ניתן להתחבר כרגע. נסו שוב.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell compact>
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-sm rounded-2xl border border-[#E6DCCB] bg-white/70 p-8 shadow-[0_12px_32px_rgba(8,45,88,0.06)]"
      >
        <img src="/logo-cropped.png" alt="" className="mx-auto mb-3 h-16 w-auto object-contain" />
        <h1 className="text-center text-2xl font-medium">כניסת מנהלים</h1>
        <p className="mb-6 mt-1 text-center text-sm text-[#6F7C91]">
          הזינו אימייל וסיסמה כדי לצפות בלוח הבקרה.
        </p>
        <GoldDivider className="mb-6" />

        <label htmlFor="admin-email" className="mb-2 block text-sm font-medium">
          אימייל
        </label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-[#C5A059]/80 bg-[#FBF8F2] px-4 py-2.5 text-[#082D58] placeholder-[#9AA6B8] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/25"
          placeholder="admin@example.com"
          autoComplete="username"
          dir="ltr"
          required
        />

        <label htmlFor="admin-password" className="mb-2 block text-sm font-medium">
          סיסמה
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-[#C5A059]/80 bg-[#FBF8F2] px-4 py-2.5 text-[#082D58] placeholder-[#9AA6B8] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/25"
          placeholder="הזינו סיסמה"
          autoComplete="current-password"
          required
        />

        <label htmlFor="admin-remember-me" className="mb-4 flex cursor-pointer items-center gap-2 text-sm">
          <input
            id="admin-remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMeChecked(e.target.checked)}
            className="h-4 w-4 accent-[#082D58]"
          />
          זכור אותי
        </label>

        {loginError ? <p className="mb-4 text-sm text-rose-700">{loginError}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[#082D58] py-3 font-medium text-white shadow-[0_7px_18px_rgba(8,45,88,0.13)] transition-all active:scale-[0.99] disabled:opacity-60"
        >
          {submitting ? 'מתחבר...' : 'כניסה'}
        </button>
      </form>
    </AdminShell>
  );
}
