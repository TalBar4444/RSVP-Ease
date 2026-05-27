import AdminDashboard from './components/AdminDashboard';
import GuestRsvpForm from './components/GuestRsvpForm';

function getPageFromSearch(): string | null {
  return new URLSearchParams(window.location.search).get('page');
}

function App() {
  const page = getPageFromSearch();

  if (page === 'admin') {
    return <AdminDashboard />;
  }

  return <GuestRsvpForm />;
}

export default App;
