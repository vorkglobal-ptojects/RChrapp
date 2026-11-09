import React from 'react';
import { NavLink } from 'react-router-dom';
import Logo from './Logo';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Clock, 
  FileText, 
  CreditCard, 
  Settings, 
  LogOut,
  User,
  TrendingUp,
  Briefcase,
  X,
  Coins
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['super', 'owner', 'hr', 'employee'] },
    { name: 'Employees', icon: Users, path: '/employees', roles: ['super', 'owner', 'hr'] },
    { name: 'Attendance', icon: Clock, path: '/attendance', roles: ['super', 'owner', 'hr', 'employee'] },
    { name: 'Leave Requests', icon: FileText, path: '/leaves', roles: ['super', 'owner', 'hr', 'employee'] },
    { name: 'Advances', icon: Coins, path: '/advances', roles: ['super', 'owner', 'hr', 'employee'] },
    { name: 'Payroll', icon: CreditCard, path: '/payroll', roles: ['super', 'owner', 'hr'] },
    { name: 'Bank Details', icon: CreditCard, path: '/bank-details', roles: ['super', 'hr'] },
    { name: 'Manage Payroll', icon: Settings, path: '/manage-payroll', roles: ['super', 'hr'] },
    { name: 'Performance', icon: TrendingUp, path: '/performance', roles: ['super', 'owner', 'hr', 'employee'] },
    { name: 'Calendar', icon: Calendar, path: '/calendar', roles: ['super', 'owner', 'hr', 'employee'] },
    { name: 'Profile', icon: User, path: '/profile', roles: ['super', 'owner', 'hr', 'employee'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div className="leading-tight">
              <h1 className="text-sm font-black tracking-tight text-[#0B1E36]">RUPASINGHE</h1>
              <span className="text-[10px] font-black tracking-widest text-[#C5A059] block">CAPITAL HR</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose?.();
              }}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200",
                isActive 
                  ? "bg-orange-50 text-orange-600 shadow-sm" 
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <item.icon size={20} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <div className="bg-zinc-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-zinc-900 truncate">{user?.name}</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{user?.role}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
