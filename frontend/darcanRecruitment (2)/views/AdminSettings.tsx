
import React, { useState } from 'react';
import { User, UserRole, ManagerRestrictions } from '../types';
import { ShieldCheck, UserPlus, Settings, Lock, Eye, Trash2, X, Mail, Ban, Unlock } from 'lucide-react';

interface AdminSettingsProps {
  managers: User[];
  onUpdateManagerPermissions: (managerId: string, newRestrictions: ManagerRestrictions) => void;
  onAddManager: (newManager: Partial<User>) => void;
  onToggleBlockManager: (managerId: string) => void;
  onDeleteManager: (managerId: string) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ 
  managers, 
  onUpdateManagerPermissions,
  onAddManager,
  onToggleBlockManager,
  onDeleteManager
}) => {
  const [editingManager, setEditingManager] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newManagerData, setNewManagerData] = useState({ name: '', email: '', password: '' });

  const modules = [
    { id: 'jobs', name: 'Gestão de Vagas', desc: 'Criar e editar anúncios de emprego' },
    { id: 'candidates', name: 'Candidaturas', desc: 'Gerir status de candidatos' },
    { id: 'tests', name: 'Testes Online', desc: 'Configurar provas técnicas' },
    { id: 'interviews', name: 'Entrevistas', desc: 'Acessar agenda e feedbacks' },
    { id: 'reports', name: 'Relatórios', desc: 'Visualizar analytics' },
    { id: 'comms', name: 'Comunicação', desc: 'Enviar e-mails pelo sistema' },
  ];

  const handleToggleModule = (moduleId: string) => {
    if (!editingManager) return;
    
    const currentDisabled = editingManager.restrictions?.disabledModules || [];
    const isCurrentlyDisabled = currentDisabled.includes(moduleId);
    
    const newDisabled = isCurrentlyDisabled 
      ? currentDisabled.filter(id => id !== moduleId)
      : [...currentDisabled, moduleId];
    
    const updatedManager = {
      ...editingManager,
      restrictions: { disabledModules: newDisabled }
    };
    
    setEditingManager(updatedManager);
    onUpdateManagerPermissions(editingManager.id, { disabledModules: newDisabled });
  };

  const handleCreateManager = (e: React.FormEvent) => {
    e.preventDefault();
    onAddManager({ 
      name: newManagerData.name, 
      email: newManagerData.email,
      password: newManagerData.password
    });
    setNewManagerData({ name: '', email: '', password: '' });
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Equipa</h1>
          <p className="text-gray-500">Gerencie contas de acesso e permissões individuais dos recrutadores.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-shadow shadow-lg shadow-green-100"
        >
          <UserPlus size={20} /> Novo Gestor
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-green-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Gestores Ativos</h3>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">{managers.length} Contas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/30">
              <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4">Função</th>
                <th className="px-6 py-4">Restrições Ativas</th>
                <th className="px-6 py-4 text-right">Configurar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {managers.map(manager => (
                <tr key={manager.id} className={`hover:bg-green-50/20 transition-colors ${manager.isBlocked ? 'opacity-60 grayscale' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs ${manager.isBlocked ? 'bg-gray-400' : 'bg-green-700'}`}>
                        {manager.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 block">{manager.name}</span>
                        {manager.isBlocked && <span className="text-[10px] text-red-600 font-bold uppercase">Bloqueado</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{manager.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold uppercase tracking-tight">
                      {manager.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {manager.restrictions?.disabledModules && manager.restrictions.disabledModules.length > 0 ? (
                        manager.restrictions.disabledModules.map(modId => (
                          <span key={modId} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold uppercase">
                            {modId}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">Nenhuma restrição</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => onToggleBlockManager(manager.id)}
                        className={`p-2 rounded-lg transition-all ${manager.isBlocked ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                        title={manager.isBlocked ? "Desbloquear Conta" : "Bloquear Conta"}
                      >
                        {manager.isBlocked ? <Unlock size={18}/> : <Ban size={18}/>}
                      </button>
                      <button 
                        onClick={() => setEditingManager(manager)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title="Configurar Restrições"
                      >
                        <Settings size={18}/>
                      </button>
                      <button
                        onClick={() => {
                          if (!window.confirm(`Pretende eliminar o gestor ${manager.name}?`)) return;
                          onDeleteManager(manager.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar gestor"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Manager Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 bg-green-50/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-700 rounded-2xl">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Novo Gestor</h3>
                  <p className="text-sm text-gray-500">Crie uma nova conta de acesso</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateManager} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Ana Silva"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900"
                    value={newManagerData.name}
                    onChange={e => setNewManagerData({...newManagerData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">E-mail Profissional</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    required 
                    placeholder="ana@empresa.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900"
                    value={newManagerData.email}
                    onChange={e => setNewManagerData({...newManagerData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Senha Temporária</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900"
                    value={newManagerData.password}
                    onChange={e => setNewManagerData({...newManagerData, password: e.target.value})}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 italic">Recomendamos que o gestor altere a senha no primeiro acesso.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-100"
                >
                  Criar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {editingManager && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 bg-green-50/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-700 rounded-2xl">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Restrições de Acesso</h3>
                  <p className="text-sm text-gray-500">Configurando {editingManager.name}</p>
                </div>
              </div>
              <button onClick={() => setEditingManager(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                {modules.map(mod => {
                  const isEnabled = !(editingManager.restrictions?.disabledModules || []).includes(mod.id);
                  return (
                    <div 
                      key={mod.id} 
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        isEnabled ? 'bg-white border-green-100 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'
                      }`}
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-bold text-sm ${isEnabled ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                            {mod.name}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{mod.desc}</p>
                      </div>
                      <button
                        onClick={() => handleToggleModule(mod.id)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isEnabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <p className="text-xs text-gray-500 max-w-[200px]">
                As alterações são salvas automaticamente e refletidas no próximo acesso do gestor.
              </p>
              <button 
                onClick={() => setEditingManager(null)}
                className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-100"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
