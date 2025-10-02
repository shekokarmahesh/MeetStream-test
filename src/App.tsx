import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import { HomePage, CalendarPage } from './pages/dashboard';
import { CallbackPage } from './pages/oauth';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/oauth/callback" element={<CallbackPage />} />
      </Routes>
    </Router>
  );
}

export default App