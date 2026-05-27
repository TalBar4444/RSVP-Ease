import { useEffect, useMemo, useState } from 'react';
import { computeGuestKpis } from '../lib/guestAnalytics';
import { getAdminSupabase } from '../lib/supabaseClient';
import type { Guest, GuestStatus } from '../types/guest';

const ADMIN_AUTH_KEY = 'rsvp-ease-admin-auth';

const STATUS_STYLES: Record<GuestStatus, string> = {
  attending: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  declined: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

function StatusBadge({ status }: { status: GuestStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

function DietaryBadges({ guest }: { guest: Guest }) {
  const badges: { label: string; className: string }[] = [];

  if (guest.is_vegetarian) {
    badges.push({ label: 'Vegetarian', className: 'bg-green-500/15 text-green-300 border-green-500/30' });
  }
  if (guest.is_vegan) {
    badges.push({ label: 'Vegan', className: 'bg-lime-500/15 text-lime-300 border-lime-500/30' });
  }
  if (guest.is_gluten_free) {
    badges.push({ label: 'Gluten-Free', className: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' });
  }

  if (badges.length === 0) {
    return <span className="text-slate-500 text-sm">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((badge) => (
        <span
          key={badge.label}
          className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}

function AdminLogin({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = import.meta.env.VITE_ADMIN_PASSWORD;

    if (!expected) {
      setLoginError('Admin password is not configured (VITE_ADMIN_PASSWORD).');
      return;
    }

    if (password === expected) {
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      setLoginError(null);
      onAuthenticated();
    } else {
      setLoginError('Incorrect password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-xl"
      >
        <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
        <p className="text-slate-400 text-sm mb-6">Enter the admin password to view the dashboard.</p>

        <label htmlFor="admin-password" className="block text-sm font-medium text-slate-300 mb-2">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 mb-4"
          placeholder="Enter admin password"
          autoComplete="current-password"
        />

        {loginError && (
          <p className="text-rose-400 text-sm mb-4">{loginError}</p>
        )}

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true',
  );
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const metrics = useMemo(() => computeGuestKpis(guests), [guests]);

  const filteredGuests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return guests;
    return guests.filter((guest) => guest.name.toLowerCase().includes(query));
  }, [guests, searchQuery]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchGuests() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await getAdminSupabase()
          .from('guests')
          .select('*')
          .order('name');

        if (fetchError) throw fetchError;
        setGuests((data as Guest[]) ?? []);
      } catch (err) {
        console.error(err);
        setError('Failed to load guest data. Check your Supabase credentials and RLS policies.');
      } finally {
        setLoading(false);
      }
    }

    fetchGuests();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <AdminLogin onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p className="text-xl animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-rose-950/40 border border-rose-800 p-6 rounded-2xl max-w-md text-center">
          <p className="text-rose-300 text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 lg:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-indigo-400">RSVP Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">Guest overview and analytics</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <p className="text-slate-400 text-sm font-medium">Total Confirmed Guests</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{metrics.totalConfirmed}</p>
          <p className="text-slate-500 text-xs mt-1">Adults + children attending</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <p className="text-slate-400 text-sm font-medium">Adults vs. Children</p>
          <div className="flex items-baseline gap-3 mt-2">
            <p className="text-3xl font-bold text-indigo-400">{metrics.totalAdults}</p>
            <span className="text-slate-500 text-sm">adults</span>
            <span className="text-slate-600">/</span>
            <p className="text-3xl font-bold text-violet-400">{metrics.totalChildren}</p>
            <span className="text-slate-500 text-sm">kids</span>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <p className="text-slate-400 text-sm font-medium">Pending Invitations</p>
          <p className="text-3xl font-bold text-amber-400 mt-2">{metrics.pendingInvitations}</p>
          <p className="text-slate-500 text-xs mt-1">Awaiting response</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <p className="text-slate-400 text-sm font-medium">Dietary Breakdown</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
            <span className="text-green-300">
              <span className="font-bold">{metrics.vegetarianCount}</span> vegetarian
            </span>
            <span className="text-lime-300">
              <span className="font-bold">{metrics.veganCount}</span> vegan
            </span>
            <span className="text-yellow-300">
              <span className="font-bold">{metrics.glutenFreeCount}</span> gluten-free
            </span>
          </div>
        </div>
      </div>

      <section className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Guest List</h2>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full max-w-sm px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/80">
                <th className="px-5 py-3 font-semibold text-slate-300">Name</th>
                <th className="px-5 py-3 font-semibold text-slate-300">Phone</th>
                <th className="px-5 py-3 font-semibold text-slate-300">Status</th>
                <th className="px-5 py-3 font-semibold text-slate-300 text-center">Adults</th>
                <th className="px-5 py-3 font-semibold text-slate-300 text-center">Kids</th>
                <th className="px-5 py-3 font-semibold text-slate-300">Dietary</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    {searchQuery ? 'No guests match your search.' : 'No guests found.'}
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr
                    key={guest.id}
                    className="border-b border-slate-700/60 hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-white">{guest.name}</td>
                    <td className="px-5 py-3 text-slate-300">{guest.phone ?? '—'}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={guest.status} />
                    </td>
                    <td className="px-5 py-3 text-center text-slate-300">{guest.guests_count}</td>
                    <td className="px-5 py-3 text-center text-slate-300">{guest.children_count}</td>
                    <td className="px-5 py-3">
                      <DietaryBadges guest={guest} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-700 text-slate-500 text-xs">
          Showing {filteredGuests.length} of {guests.length} guests
        </div>
      </section>
    </div>
  );
}
