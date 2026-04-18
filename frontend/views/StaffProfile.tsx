
import React, { useState, useRef } from 'react';
import { User, UserRole } from '../types';
import { 
  Mail, 
  Lock, 
  Save, 
  User as UserIcon, 
  ShieldCheck, 
  CheckCircle2, 
  Smartphone,
  Camera
} from 'lucide-react';

interface StaffProfileProps {
  user: User;
  onUpdateUser: (userData: Partial<User>) => void;
}

const StaffProfile: React.FC<StaffProfileProps> = ({ user, onUpdateUser }) => {
  const isAdmin = user.role === UserRole.ADMIN;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    bio: 'Profissional dedicado à excelência operacional e à gestão estratégica de talentos no ecossistema Darcan.',
  });

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onUpdateUser({ avatar: base64String });
        setSuccessMessage('Foto de perfil atualizada!');
        setTimeout(() => setSuccessMessage(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ name: formData.name, email: formData.email });
    setIsEditing(false);
    setSuccessMessage('Perfil atualizado com sucesso!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isAdmin ? 'text-slate-900' : 'text-gray-900'}`}>O Meu Perfil</h1>
          <p className="text-gray-500">Gerencie as suas informações pessoais e configurações de conta.</p>
        </div>
        {successMessage && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl font-bold text-sm animate-in zoom-in duration-300">
            <CheckCircle2 size={18} />
            {successMessage}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Esquerda - Cartão de Perfil com Edição de Foto */}
        <div className="space-y-6">
          <div className={`bg-white rounded-[2rem] border overflow-hidden shadow-sm ${isAdmin ? 'border-slate-100' : 'border-green-100'}`}>
            <div className={`h-24 ${isAdmin ? 'bg-slate-900' : 'bg-green-700'}`} />
            <div className="px-6 pb-8 -mt-12">
              <div className="relative inline-block">
                <div className={`w-24 h-24 rounded-3xl border-4 border-white overflow-hidden shadow-lg ${isAdmin ? 'bg-emerald-500' : 'bg-green-600'} text-white flex items-center justify-center text-4xl font-bold`}>
                  {user.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                
                {/* Botão de Câmera para Editar Foto */}
                <button 
                  onClick={handleCameraClick}
                  className={`absolute -bottom-2 -right-2 p-2.5 rounded-xl shadow-lg border-2 border-white transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center ${
                    isAdmin ? 'bg-slate-900 text-emerald-400' : 'bg-green-700 text-white'
                  }`}
                  title="Alterar foto de perfil"
                >
                  <Camera size={18} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              
              <div className="mt-4">
                <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                <p className="text-gray-500 text-sm">{user.email}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  isAdmin ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-green-50 text-green-700 border border-green-100'
                }`}>
                  {isAdmin ? 'Acesso Total' : 'Recrutador Ativo'}
                </span>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${
                  user.isOnline ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  {user.isOnline ? 'Online' : 'Offline'}
                </span>
                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-500 border border-gray-100">
                  {user.role}
                </span>
              </div>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <ShieldCheck size={18} className={isAdmin ? 'text-emerald-500' : 'text-green-600'} />
                  <span>Autenticação em dois passos ativa</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Smartphone size={18} className={isAdmin ? 'text-emerald-500' : 'text-green-600'} />
                  <span>Sessão iniciada via Desktop</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-[2rem] border ${isAdmin ? 'bg-slate-900 border-slate-800 text-white' : 'bg-green-700 border-green-800 text-white'}`}>
            <h4 className="font-bold flex items-center gap-2 mb-4">
              <ShieldCheck size={20} /> Estado da Conta
            </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="opacity-80">Perfil</span>
                  <span className="font-bold flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${user.isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                    {user.isOnline ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              <div className="flex items-center justify-between">
                <span className="opacity-80">Função</span>
                <span className="font-bold">{isAdmin ? 'Administrador' : 'Gestor'}</span>
              </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-80">Última atualização</span>
                  <span className="font-bold">{user.lastSeenAt ? new Date(user.lastSeenAt).toLocaleString() : 'Sem registo'}</span>
                </div>
              </div>
          </div>
        </div>

        {/* Coluna Direita - Formulários */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <UserIcon className={isAdmin ? 'text-slate-900' : 'text-green-700'} size={20} />
                <h3 className="font-bold text-gray-900">Informações Pessoais</h3>
              </div>
              {!isEditing && (
                <button 
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`text-sm font-bold ${isAdmin ? 'text-slate-600' : 'text-green-700'} hover:underline`}
                >
                  Editar Dados
                </button>
              )}
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome de Exibição</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="text" 
                      disabled={!isEditing}
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-900 disabled:opacity-60"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Endereço de E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="email" 
                      disabled={!isEditing}
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-900 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Breve Biografia</label>
                <textarea 
                  disabled={!isEditing}
                  value={formData.bio}
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-900 disabled:opacity-60 resize-none"
                />
              </div>

              {isEditing && (
                <div className="pt-4 flex gap-3">
                  <button 
                    type="submit"
                    className={`px-8 py-3 rounded-xl text-white font-bold shadow-lg transition-all flex items-center gap-2 ${isAdmin ? 'bg-slate-900 hover:bg-slate-800' : 'bg-green-700 hover:bg-green-800'}`}
                  >
                    <Save size={18} /> Guardar Alterações
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setIsEditing(false); setFormData({...formData, name: user.name, email: user.email}); }}
                    className="px-8 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </form>

          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
              <Lock className={isAdmin ? 'text-slate-900' : 'text-green-700'} size={20} />
              <h3 className="font-bold text-gray-900">Segurança da Conta</h3>
            </div>
            <div className="p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-red-50/50 rounded-[2rem] border border-red-50">
                <div className="flex gap-4">
                  <div className="p-3 bg-white rounded-2xl text-red-600 shadow-sm">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Palavra-passe</h4>
                    <p className="text-xs text-gray-500">Altere a sua palavra-passe de acesso periodicamente.</p>
                  </div>
                </div>
                <button className="px-6 py-2 bg-white text-gray-900 border border-red-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-colors">
                  Atualizar
                </button>
              </div>

              <div className="mt-8 space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Sessões Ativas</h4>
                <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-400">
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Desktop - Luanda, Angola</p>
                      <p className={`text-[10px] font-bold ${user.isOnline ? 'text-green-600' : 'text-red-500'}`}>{user.isOnline ? 'Sessão Atual' : 'Sessão encerrada'}</p>
                    </div>
                  </div>
                  <button className="text-[10px] font-black uppercase text-gray-400 hover:text-red-600">Encerrar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
