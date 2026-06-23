import React from 'react';
import { useAuth } from './context/AuthContext';
import { FullScreenLoader } from './components/ui/Loader';
import { Login } from './pages/Login';
import { DeanDashboard } from './pages/DeanDashboard';
import { FacultyDashboard } from './pages/FacultyDashboard';

const App: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Login />;
  }

  return user.role === 'admin' ? <DeanDashboard /> : <FacultyDashboard />;
};

export default App;
