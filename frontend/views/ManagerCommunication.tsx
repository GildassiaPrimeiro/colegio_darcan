import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole, Application, Message } from '../types';
import { Send, Search, MoreVertical, MessageSquare, CheckCheck } from 'lucide-react';

interface ChatContact {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  isOnline: boolean;
}

interface ManagerCommunicationProps {
  currentUser: User;
  staffUsers: User[];
  applications: Application[];
  messages: Message[];
  onSendMessage: (receiverId: string, receiverRole: UserRole, text: string) => void;
}

const ManagerCommunication: React.FC<ManagerCommunicationProps> = ({ currentUser, staffUsers, applications: _applications, messages, onSendMessage }) => {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const availableContacts = currentUser.role === UserRole.ADMIN
    ? staffUsers.filter((user) => user.role === UserRole.MANAGER)
    : staffUsers.filter((user) => user.id !== currentUser.id && user.role === UserRole.ADMIN);

  const allContacts: ChatContact[] = availableContacts.map((contact) => {
    const latest = [...messages]
      .filter((msg) =>
        (msg.senderId === currentUser.id && msg.receiverId === contact.id) ||
        (msg.senderId === contact.id && msg.receiverId === currentUser.id)
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    return {
      id: contact.id,
      name: contact.name,
      role: contact.role,
      avatar: contact.avatar,
      lastMessage: latest?.content || '',
      lastMessageTime: latest ? new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      isOnline: !!contact.isOnline,
    };
  });

  const filteredContacts = allContacts.filter((contact) => contact.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(filteredContacts[0] || null);

  useEffect(() => {
    if (selectedContact && !filteredContacts.some((contact) => contact.id === selectedContact.id)) {
      setSelectedContact(filteredContacts[0] || null);
      return;
    }

    if (!selectedContact && filteredContacts.length > 0) {
      setSelectedContact(filteredContacts[0]);
    }
  }, [filteredContacts, selectedContact]);

  const visibleMessages = selectedContact
    ? [...messages]
        .filter((msg) =>
          (msg.senderId === currentUser.id && msg.receiverId === selectedContact.id) ||
          (msg.senderId === selectedContact.id && msg.receiverId === currentUser.id)
        )
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !messageInput.trim()) return;
    onSendMessage(selectedContact.id, selectedContact.role, messageInput);
    setMessageInput('');
  };

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <aside className="w-full md:w-80 flex flex-col border-r border-gray-50 bg-gray-50/30">
        <div className="p-6">
          <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare size={24} className={isAdmin ? 'text-slate-900' : 'text-green-700'} />
            Conversas
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar utilizador..."
              className="w-full pl-10 pr-4 py-3 bg-white border-none rounded-2xl text-sm font-medium text-black focus:ring-2 focus:ring-green-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3">
          <div className="space-y-1">
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                  selectedContact?.id === contact.id
                    ? (isAdmin ? 'bg-slate-900 text-white shadow-lg' : 'bg-green-700 text-white shadow-lg')
                    : 'hover:bg-white text-gray-600'
                }`}
              >
                <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg overflow-hidden border-2 ${
                  selectedContact?.id === contact.id ? 'border-white/20' : 'border-gray-100 bg-white'
                }`}>
                  {contact.avatar ? (
                    <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                  ) : (
                    contact.name.charAt(0)
                  )}
                  <span className={`absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 ${selectedContact?.id === contact.id ? 'border-green-700' : 'border-white'} ${contact.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className="font-bold truncate text-sm">{contact.name}</h4>
                    <span className={`text-[10px] font-medium ${selectedContact?.id === contact.id ? 'text-white/60' : 'text-gray-400'}`}>
                      {contact.lastMessageTime}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${selectedContact?.id === contact.id ? 'text-white/70' : 'text-gray-400'}`}>
                    {contact.lastMessage || 'Sem histórico de mensagens'}
                  </p>
                  <p className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${selectedContact?.id === contact.id ? 'text-white/70' : (contact.isOnline ? 'text-green-600' : 'text-red-500')}`}>
                    {contact.isOnline ? 'Ativo no sistema' : 'Offline'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-white">
        {selectedContact ? (
          <>
            <header className="px-8 py-4 border-b border-gray-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="relative w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-gray-400 border border-gray-100 overflow-hidden">
                  {selectedContact.avatar ? (
                    <img src={selectedContact.avatar} alt={selectedContact.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedContact.name.charAt(0)
                  )}
                  <span className={`absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white ${selectedContact.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{selectedContact.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                      selectedContact.role === UserRole.ADMIN ? 'bg-slate-100 text-slate-900' : 'bg-green-100 text-green-700'
                    }`}>
                      {selectedContact.role}
                    </span>
                  </div>
                  <p className={`text-xs font-bold ${selectedContact.isOnline ? 'text-green-600' : 'text-red-500'}`}>
                    {selectedContact.isOnline ? 'Ativo no sistema' : 'Offline'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"><MoreVertical size={20} /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/20 custom-scrollbar">
              {visibleMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-400 font-medium">
                  Ainda não existem mensagens nesta conversa.
                </div>
              ) : (
                visibleMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`px-5 py-3.5 rounded-3xl text-sm font-bold shadow-sm ${
                          isMe
                            ? (isAdmin ? 'bg-slate-100 text-black border border-slate-200 rounded-tr-none' : 'bg-green-100 text-black border border-green-200 rounded-tr-none')
                            : 'bg-white text-black border border-gray-100 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                        <div className={`flex items-center gap-2 mt-1.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] font-bold text-gray-400">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                            <span className={msg.read ? 'text-emerald-500' : 'text-gray-300'}>
                              <CheckCheck size={14} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <footer className="p-6 bg-white border-t border-gray-50">
              <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Escreve a tua mensagem aqui..."
                  className="flex-1 px-6 py-4 bg-gray-50 border-none rounded-[2rem] text-sm font-medium text-black focus:ring-2 focus:ring-green-600 outline-none transition-all"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className={`p-4 rounded-2xl text-white shadow-lg transition-all disabled:opacity-50 ${
                    isAdmin ? 'bg-slate-900 shadow-slate-200' : 'bg-green-700 shadow-green-100'
                  }`}
                >
                  <Send size={24} />
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            Nenhum utilizador disponível para comunicação.
          </div>
        )}
      </main>
    </div>
  );
};

export default ManagerCommunication;
