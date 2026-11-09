import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import Logo from './components/Logo';
import { Menu } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Advances from './pages/Advances';
import Payroll from './pages/Payroll';
import ManagePayroll from './pages/ManagePayroll';
import Performance from './pages/Performance';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';
import BankDetails from './pages/BankDetails';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <div className="w-12 h-12 border-4 border-zinc-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center px-4 lg:hidden sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-zinc-500 hover:bg-zinc-50 rounded-xl transition-colors"
          >
            <Menu size={24} />
          </button>
            <Logo size="sm" />
            <div className="ml-2 leading-tight">
              <span className="font-black text-[#0B1E36] tracking-tight text-xs block">RUPASINGHE</span>
              <span className="font-extrabold text-[#C5A059] tracking-widest text-[9px] block">CAPITAL HR</span>
            </div>
        </header>
        <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto max-h-screen">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/employees" element={<PrivateRoute><Employees /></PrivateRoute>} />
      <Route path="/attendance" element={<PrivateRoute><Attendance /></PrivateRoute>} />
      <Route path="/leaves" element={<PrivateRoute><Leaves /></PrivateRoute>} />
      <Route path="/advances" element={<PrivateRoute><Advances /></PrivateRoute>} />
      <Route path="/payroll" element={<PrivateRoute><Payroll /></PrivateRoute>} />
      <Route path="/bank-details" element={<PrivateRoute>{(user?.role === 'super' || user?.role === 'hr') ? <BankDetails /> : <Navigate to="/" replace />}</PrivateRoute>} />
      <Route path="/manage-payroll" element={<PrivateRoute><ManagePayroll /></PrivateRoute>} />
      <Route path="/performance" element={<PrivateRoute><Performance /></PrivateRoute>} />
      <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-zinc-100">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-500 flex items-center justify-center font-black text-lg">!</div>
            <div>
              <h2 className="text-lg font-black text-white">Supabase Setup Required</h2>
              <p className="text-xs text-zinc-400">Environment variables missing on Vercel</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Your Vercel deployment needs the following Environment Variables to connect to the database:
          </p>
          <div className="space-y-2 bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 font-mono text-xs">
            <div className="text-orange-400 font-bold">VITE_SUPABASE_URL</div>
            <div className="text-orange-400 font-bold">VITE_SUPABASE_ANON_KEY</div>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Go to <b>Vercel Project Settings &gt; Environment Variables</b>, add these keys, and then redeploy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" richColors closeButton />
      </Router>
    </AuthProvider>
  );
}
