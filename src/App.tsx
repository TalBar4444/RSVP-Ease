import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import AdminDashboard from './components/admin/AdminDashboard';
import { AdminDataProvider } from './components/admin/AdminDataProvider';
import GuestRsvpForm from './components/guest/GuestRsvpForm';
import HomePage from './pages/HomePage';

function HomeOrLegacyRedirect() {
  const [params] = useSearchParams();
  const page = params.get('page');
  const guestId = params.get('id');

  if (page === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (guestId) {
    return <Navigate to={`/rsvp/${guestId}`} replace />;
  }

  return <HomePage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminDataProvider>
        <Routes>
          <Route path="/" element={<HomeOrLegacyRedirect />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/rsvp/:guestId" element={<GuestRsvpForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminDataProvider>
    </BrowserRouter>
  );
}
