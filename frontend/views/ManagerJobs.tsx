
import React, { useState } from 'react';
import { Job, OnlineTest, Notification } from '../types';
import { Plus, Edit3, Play, Pause, Trash2, Search, X } from 'lucide-react';

interface ManagerJobsProps {
  jobs: Job[];
  tests: OnlineTest[];
  onAddJob: (job: Partial<Job>) => Promise<void>;
  onUpdateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  onDeleteJob: (id: string) => Promise<void>;
  onNotifyCandidate: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
}

const ManagerJobs: React.FC<ManagerJobsProps> = ({ jobs, tests, onAddJob, onUpdateJob, onDeleteJob, onNotifyCandidate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Job>>({
    title: '',
    department: '',
    description: '',
    requirements: [],
    testId: tests[0]?.id || '',
    candidateLimit: 1,
    testDate: '',
    testTime: '',
    deadline: '',
    minExperience: '',
    workLocation: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      department: '',
      description: '',
      requirements: [],
      testId: tests[0]?.id || '',
      candidateLimit: 1,
      testDate: '',
      testTime: '',
      deadline: '',
      minExperience: '',
      workLocation: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingJob) {
        await onUpdateJob(editingJob.id, formData);
        setFeedback('Vaga atualizada com sucesso.');
      } else {
        await onAddJob({ ...formData, status: 'OPEN', createdAt: new Date().toISOString() });
        onNotifyCandidate({
          type: 'NEW_JOB',
          title: 'Nova Vaga Disponível!',
          message: `Uma nova oportunidade para "${formData.title}" foi publicada. Candidate-se agora!`
        });
        setFeedback('Nova vaga publicada com sucesso.');
      }

      setShowModal(false);
      setEditingJob(null);
      resetForm();
      setTimeout(() => setFeedback(null), 2500);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível guardar a vaga.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    j.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Vagas</h1>
          <p className="text-gray-500">Crie e gerencie as oportunidades de carreira.</p>
        </div>
        <button 
          onClick={() => { setEditingJob(null); setFormError(null); resetForm(); setShowModal(true); }}
          className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-100 transition-all active:scale-95"
        >
          <Plus size={20} /> Nova Vaga
        </button>
      </div>

      {feedback && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {feedback}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-green-50">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar vagas..." 
            className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:border-green-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                <th className="pb-4 pl-4 min-w-[150px]">Vaga</th>
                <th className="pb-4 min-w-[120px]">Departamento</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Criada em</th>
                <th className="pb-4 pr-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-sm font-bold text-gray-700">Nenhuma vaga encontrada.</p>
                    <p className="mt-1 text-xs text-gray-400">Ajuste a pesquisa ou publique uma nova vaga.</p>
                  </td>
                </tr>
              ) : filteredJobs.map(job => (
                <tr key={job.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 pl-4">
                    <div className="font-bold text-gray-900">{job.title}</div>
                    <div className="text-xs text-gray-400">ID: {job.id}</div>
                  </td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">{job.department}</span>
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      job.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 
                      job.status === 'PAUSED' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {job.status === 'OPEN' ? 'Aberta' : job.status === 'PAUSED' ? 'Pausada' : 'Arquivada'}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-gray-500">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => { setEditingJob(job); setFormData(job); setShowModal(true); }}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                        Editar
                      </button>
                      {job.status === 'OPEN' ? (
                        <button
                          onClick={() => onUpdateJob(job.id, { status: 'PAUSED' })}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                        >
                          <Pause size={16} />
                          Fechar vaga
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateJob(job.id, { status: 'OPEN' })}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                        >
                          <Play size={16} />
                          Abrir vaga
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (!window.confirm(`Pretende eliminar a vaga "${job.title}"?`)) return;
                          void (async () => {
                            try {
                              await onDeleteJob(job.id);
                              setFeedback('Vaga eliminada com sucesso.');
                              setTimeout(() => setFeedback(null), 2500);
                            } catch (error) {
                              setFormError(error instanceof Error ? error.message : 'Não foi possível eliminar a vaga.');
                            }
                          })();
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-[95%] sm:w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{editingJob ? 'Editar Vaga' : 'Criar Nova Vaga'}</h3>
                <p className="text-xs text-gray-500 mt-1">Preencha os detalhes da oportunidade de emprego.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              {formError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Título da Vaga</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Engenheiro de Software"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900 transition-all"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Departamento</label>
                  <select 
                    required 
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900 transition-all appearance-none cursor-pointer"
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                  >
                    <option value="">Selecione um departamento...</option>
                    <option value="Direção">Direção</option>
                    <option value="Área Pedagógica">Área Pedagógica</option>
                    <option value="Secretaria Escolar">Secretaria Escolar</option>
                    <option value="Administração e Finanças">Administração e Finanças</option>
                    <option value="Apoio ao Estudante">Apoio ao Estudante</option>
                    <option value="Serviços Gerais">Serviços Gerais</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição da Oportunidade</label>
                <textarea 
                  rows={4} 
                  required
                  placeholder="Descreva as responsabilidades e o que a vaga oferece..."
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900 transition-all resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Experiência Mínima</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 2 anos"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900 transition-all"
                    value={formData.minExperience}
                    onChange={e => setFormData({...formData, minExperience: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Local de Trabalho</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Luanda, Angola"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900 transition-all"
                    value={formData.workLocation}
                    onChange={e => setFormData({...formData, workLocation: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Teste Online Vinculado</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900 transition-all appearance-none cursor-pointer"
                    value={formData.testId}
                    onChange={e => setFormData({...formData, testId: e.target.value})}
                  >
                    <option value="">Selecione um teste...</option>
                    {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data Limite de Inscrição</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900 transition-all cursor-pointer"
                    value={formData.deadline}
                    onChange={e => setFormData({...formData, deadline: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Limite de Candidatos</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900 transition-all"
                    value={formData.candidateLimit ?? 1}
                    onChange={e => setFormData({...formData, candidateLimit: Math.max(1, Number(e.target.value) || 1)})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data do Teste</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900 transition-all"
                    value={formData.testDate || ''}
                    onChange={e => setFormData({...formData, testDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hora do Teste</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900 transition-all"
                    value={formData.testTime || ''}
                    onChange={e => setFormData({...formData, testTime: e.target.value})}
                  />
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="w-full sm:w-auto px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSubmit}
                type="button"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-10 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'A guardar...' : (editingJob ? 'Salvar Alterações' : 'Publicar Vaga')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerJobs;
