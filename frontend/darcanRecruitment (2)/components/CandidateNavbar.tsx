
import React from 'react';
import { Briefcase, User, LogOut, Layout, UserCircle, Bell } from 'lucide-react';
import { Notification } from '../types';
import NotificationPanel from './NotificationPanel';

interface CandidateNavbarProps {
  userName: string;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  logoUrl: string;
  notifications: Notification[];
  unreadCount: number;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void | Promise<void>;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onViewDetail: (notification: Notification) => void;
}

const CandidateNavbar: React.FC<CandidateNavbarProps> = ({ 
  userName, 
  onLogout, 
  activeTab, 
  setActiveTab, 
  logoUrl,
  notifications,
  unreadCount,
  showNotifications,
  setShowNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewDetail
}) => {
  const handleNotificationToggle = async () => {
    const nextShow = !showNotifications;
    if (nextShow && unreadCount > 0) {
      await onMarkAllAsRead();
    }
    await setShowNotifications(nextShow);
  };

  return (
    <nav className="bg-white border-b border-green-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center gap-2 mr-4">
              <img 
                src={logoUrl} 
                alt="Logo Darcan" 
                className="w-8 h-8 object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
              <span className="text-xl font-bold text-green-700">Darcan Portal</span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === 'jobs' ? 'border-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Vagas Disponíveis
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === 'applications' ? 'border-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Minhas Candidaturas
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === 'messages' ? 'border-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Mensagens
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === 'profile' ? 'border-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Meu Perfil
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => {
                  void handleNotificationToggle();
                }}
                className="p-2 text-gray-400 hover:text-green-600 transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationPanel 
                  notifications={notifications}
                  onMarkAsRead={onMarkAsRead}
                  onMarkAllAsRead={onMarkAllAsRead}
                  onClose={() => setShowNotifications(false)}
                  onViewDetail={onViewDetail}
                />
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer" onClick={() => setActiveTab('profile')}>
              <UserCircle size={20} className="text-green-600" />
              <span className="hidden sm:inline font-bold">{userName}</span>
            </div>
            <button
              onClick={onLogout}
              className="text-gray-400 hover:text-red-600 transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default CandidateNavbar;
