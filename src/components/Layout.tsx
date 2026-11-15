import { Stethoscope, LayoutDashboard, Users, CalendarDays, BedDouble, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export type Page = 'dashboard' | 'doctors' | 'appointments';

type LayoutProps = {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
};

const navItems: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'doctors', label: 'Doctors', icon: Users },
  { page: 'appointments', label: 'Appointments', icon: CalendarDays },
];

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-30 hidden md:flex">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 shadow-lg shadow-teal-500/20">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">MediCare Connect</h1>
            <p className="text-xs text-slate-400">Hospital Management</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ page, label, icon: Icon }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentPage === page
                  ? 'bg-gradient-to-r from-teal-500/20 to-cyan-600/20 text-teal-300 border border-teal-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 mb-2 truncate">{user?.email}</div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed top-0 inset-x-0 z-30 md:hidden">
        <div className="bg-slate-900 text-white flex items-center justify-between px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-600">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-bold">MediCare</span>
          </div>
          <button onClick={signOut} className="text-slate-400 hover:text-red-400">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="flex bg-white border-b shadow-sm">
          {navItems.map(({ page, label, icon: Icon }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                currentPage === page ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-20 md:pt-0">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
