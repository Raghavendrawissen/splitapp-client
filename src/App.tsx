import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { Providers } from './components/providers';
import { useAuth } from './lib/auth';
import { Dashboard } from './pages/dashboard';
import { Groups } from './pages/groups';
import { Expenses } from './pages/expenses';
import { Settings } from './pages/settings';
import { Login } from './pages/auth/login';
import { Register } from './pages/auth/register';
import { ResetPassword } from './pages/auth/reset-password';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Providers>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="groups" element={<Groups />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </Providers>
  );
}

export default App;