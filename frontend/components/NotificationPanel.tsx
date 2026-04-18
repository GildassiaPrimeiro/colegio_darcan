
import React from 'react';
import { Notification } from '../types';
import { Bell, UserPlus, ClipboardCheck, Info, Check, X } from 'lucide-react';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  onViewDetail?: (notification: Notification) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead,
  onClose,
  onViewDetail
}) => {
  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-green-100 z-[100] animate-in slide-in-from-top-2 duration-200">
      <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-green-600" />
          <h3 className="font-bold text-gray-900">Notificações</h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onMarkAllAsRead}
            className="text-[10px] font-black uppercase text-green-600 hover:text-green-700"
          >
            Lidas
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
              <Bell size={24} />
            </div>
            <p className="text-sm text-gray-400">Nenhuma notificação nova.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 hover:bg-green-50/30 transition-colors relative flex gap-3 cursor-pointer ${!notif.read ? 'bg-green-50/10' : ''}`}
                onClick={() => {
                  onMarkAsRead(notif.id);
                  if (onViewDetail) onViewDetail(notif);
                }}
              >
                {!notif.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-green-500 rounded-full" />
                )}
                
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  notif.type === 'NEW_APPLICATION' ? 'bg-blue-50 text-blue-600' : 
                  notif.type === 'TEST_COMPLETED' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'
                }`}>
                  {notif.type === 'NEW_APPLICATION' ? <UserPlus size={20} /> : 
                   notif.type === 'TEST_COMPLETED' ? <ClipboardCheck size={20} /> : <Info size={20} />}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-900 leading-tight">{notif.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                  <span className="text-[10px] text-gray-400 mt-2 block font-medium">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 bg-gray-50 rounded-b-3xl border-t border-gray-50">
        <button 
          onClick={onClose}
          className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-700 text-center"
        >
          Fechar Painel
        </button>
      </div>
    </div>
  );
};

export default NotificationPanel;
