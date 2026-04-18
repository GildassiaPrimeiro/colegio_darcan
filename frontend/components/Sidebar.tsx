
import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  FileText, 
  ClipboardCheck,
  Calendar, 
  MessageSquare, 
  BarChart3, 
  Settings,
  ShieldCheck,
  LogOut,
  X,
  UserCircle,
  User
} from 'lucide-react';
import { UserRole, ManagerRestrictions } from '../types';

interface SidebarProps {
  role: UserRole;
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
  restrictions?: ManagerRestrictions;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  logoUrl: string;
}

const Sidebar: React.FC<SidebarProps> = ({ role, activeView, setActiveView, onLogout, restrictions, isOpen, setIsOpen, logoUrl }) => {
  const isAdmin = role === UserRole.ADMIN;

  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: <LayoutDashboard size={20} />, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'profile', label: 'Meu Perfil', icon: <User size={20} />, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'jobs', label: 'Gestão de Vagas', icon: <Briefcase size={20} />, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'candidates', label: 'Candidaturas', icon: <Users size={20} />, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'tests', label: 'Configurar Testes', icon: <FileText size={20} />, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'test-review', label: 'Avaliar Testes', icon: <ClipboardCheck size={20} />, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'interviews', label: 'Entrevistas', icon: <Calendar size={20} />, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'comms', label: 'Comunicação', icon: <MessageSquare size={20} />, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'reports', label: 'Relatórios', icon: <BarChart3 size={20} />, roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { id: 'admin', label: 'Equipa de Gestão', icon: <ShieldCheck size={20} />, roles: [UserRole.ADMIN] },
    { id: 'settings', label: 'Definições', icon: <Settings size={20} />, roles: [UserRole.ADMIN] },
  ];

  const filteredItems = menuItems.filter(item => {
    const hasRoleAccess = item.roles.includes(role);
    if (!hasRoleAccess) return false;
    if (role === UserRole.MANAGER && restrictions) {
      if (restrictions.disabledModules.includes(item.id)) {
        return false;
      }
    }
    return true;
  });

  const handleNavClick = (view: string) => {
    setActiveView(view);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 z-50 h-screen border-r flex flex-col transition-transform duration-300 ease-in-out w-64 
        ${isAdmin ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-green-100 text-gray-600'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        <div className="p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img 
              src={logoUrl} 
              alt="Logo Darcan" 
              className="w-10 h-10 object-contain rounded-lg bg-white p-1"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <h1 className={`text-xl font-bold ${isAdmin ? 'text-white' : 'text-green-700'}`}>
                Darcan <span className={isAdmin ? 'text-emerald-400' : 'text-green-500'}>Portal</span>
              </h1>
              <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                isAdmin ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-green-50 text-green-700 border border-green-100'
              }`}>
                {isAdmin ? <ShieldCheck size={12} /> : <UserCircle size={12} />}
                {isAdmin ? 'ADMINISTRADOR' : 'GESTOR DE RH'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className={`p-2 lg:hidden ${isAdmin ? 'text-slate-500 hover:text-white' : 'text-gray-400 hover:text-green-600'}`}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pb-6 mt-4">
          {filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeView === item.id 
                  ? (isAdmin ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'bg-green-100 text-green-800')
                  : (isAdmin ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-green-50 hover:text-green-700')
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className={`p-4 border-t shrink-0 ${isAdmin ? 'border-slate-800' : 'border-green-50'}`}>
          <button 
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg ${
              isAdmin ? 'text-slate-400 hover:text-red-400 hover:bg-slate-800' : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut size={20} />
            Terminar Sessão
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
