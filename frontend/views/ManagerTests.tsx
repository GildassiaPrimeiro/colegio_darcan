
import React, { useState } from 'react';
import { OnlineTest, Question } from '../types';
import { Plus, HelpCircle, Clock, Award, MoreVertical, Search, FileEdit, X, Trash2, CheckCircle } from 'lucide-react';

interface ManagerTestsProps {
  tests: OnlineTest[];
  onAddTest: (test: OnlineTest) => Promise<void>;
  onDeleteTest: (testId: string) => Promise<void>;
}

const ManagerTests: React.FC<ManagerTestsProps> = ({ tests, onAddTest, onDeleteTest }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [menuOpenTestId, setMenuOpenTestId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // New Test State using internal hours/minutes/seconds for the UI
  const [testTime, setTestTime] = useState({ hours: 0, minutes: 30, seconds: 0 });
  const [newTest, setNewTest] = useState<{
    title: string;
    minPassScore: number;
    questions: Partial<Question>[];
  }>({
    title: '',
    minPassScore: 70,
    questions: []
  });

  const handleOpenNewTest = () => {
    setEditingTestId(null);
    setFormError(null);
    setNewTest({
      title: '',
      minPassScore: 70,
      questions: []
    });
    setTestTime({ hours: 0, minutes: 30, seconds: 0 });
    setShowModal(true);
  };

  const handleOpenDetails = (test: OnlineTest) => {
    setEditingTestId(test.id);
    setFormError(null);
    setNewTest({
      title: test.title,
      minPassScore: test.minPassScore,
      questions: [...test.questions]
    });
    setTestTime({ 
      hours: Math.floor(test.timeLimitMinutes / 60), 
      minutes: test.timeLimitMinutes % 60,
      seconds: test.timeLimitSeconds || 0
    });
    setShowModal(true);
  };

  const handleAddQuestion = () => {
    const newQ: Partial<Question> = {
      id: `q-${Date.now()}`,
      text: '',
      type: 'TRUE_FALSE', // Default to TRUE_FALSE (American System)
      correctAnswer: '',
      points: 10
    };
    setNewTest(prev => ({
      ...prev,
      questions: [...prev.questions, newQ]
    }));
  };

  const handleRemoveQuestion = (index: number) => {
    setNewTest(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateQuestion = (index: number, updates: Partial<Question>) => {
    setNewTest(prev => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
      return { ...prev, questions: updatedQuestions };
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    setNewTest(prev => {
      const updatedQuestions = [...prev.questions];
      const question = { ...updatedQuestions[qIndex] };
      const options = [...(question.options || [])];
      options[optIndex] = value;
      question.options = options;
      updatedQuestions[qIndex] = question;
      return { ...prev, questions: updatedQuestions };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalMinutes = (testTime.hours * 60) + testTime.minutes;
    const totalSeconds = testTime.seconds;

    if (totalMinutes <= 0 && totalSeconds <= 0) {
      setFormError('Defina um tempo limite válido para o teste.');
      return;
    }

    if (newTest.questions.length === 0) {
      setFormError('Adicione pelo menos uma questão ao teste.');
      return;
    }

    const testToSave: OnlineTest = {
      id: editingTestId || `test-${Date.now()}`,
      title: newTest.title,
      timeLimitMinutes: totalMinutes,
      timeLimitSeconds: totalSeconds,
      minPassScore: newTest.minPassScore,
      questions: newTest.questions as Question[]
    };

    try {
      setIsSaving(true);
      await onAddTest(testToSave);
      setFormError(null);
      setFeedback(editingTestId ? 'Teste atualizado com sucesso.' : 'Novo teste criado com sucesso.');
      setShowModal(false);
      setEditingTestId(null);
      setTimeout(() => setFeedback(null), 2500);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível guardar o teste.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (totalMinutes: number, totalSeconds?: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const s = totalSeconds || 0;
    
    let parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}min`);
    if (s > 0) parts.push(`${s}s`);
    
    return parts.length > 0 ? parts.join(' ') : '0s';
  };

  const filteredTests = tests.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuração de Testes</h1>
          <p className="text-gray-500">Gerencie avaliações objetivas (Sistema Americano V/F).</p>
        </div>
        <button 
          onClick={handleOpenNewTest}
          className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-shadow shadow-lg shadow-green-100"
        >
          <Plus size={20} /> Novo Teste
        </button>
      </div>

      {feedback && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          onClick={handleOpenNewTest}
          className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm flex flex-col items-center justify-center text-center group cursor-pointer hover:border-green-500 transition-colors border-dashed py-10"
        >
          <div className="p-4 bg-green-50 rounded-full text-green-600 mb-4 group-hover:scale-110 transition-transform">
            <Plus size={32} />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Criar Novo Teste</h3>
          <p className="text-gray-500 text-sm mt-1">Configurar avaliação V/F</p>
        </div>

        {filteredTests.map(test => (
          <div key={test.id} className="bg-white p-6 rounded-2xl border border-green-50 shadow-sm relative overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute top-0 right-0 p-4">
              <button
                onClick={() => setMenuOpenTestId((current) => current === test.id ? null : test.id)}
                className="p-1 text-gray-300 hover:text-gray-600"
              >
                <MoreVertical size={20} />
              </button>
              {menuOpenTestId === test.id && (
                <div className="absolute right-0 top-10 z-20 w-40 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
                  <button
                    onClick={() => {
                      setMenuOpenTestId(null);
                      handleOpenDetails(test);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-green-50 hover:text-green-700"
                  >
                    <FileEdit size={16} />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpenTestId(null);
                      if (!window.confirm(`Pretende eliminar o teste "${test.title}"?`)) return;
                      void (async () => {
                        try {
                          await onDeleteTest(test.id);
                          setFeedback('Teste eliminado com sucesso.');
                          setTimeout(() => setFeedback(null), 2500);
                        } catch (error) {
                          setFormError(error instanceof Error ? error.message : 'Não foi possível eliminar o teste.');
                        }
                      })();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
            
            <div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
                <HelpCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{test.title}</h3>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock size={14} /> {formatTime(test.timeLimitMinutes, test.timeLimitSeconds)}
                </div>
                <div className="flex items-center gap-1">
                  <Award size={14} /> {test.minPassScore}% mín.
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {test.questions.length} Questões V/F
              </span>
              <button 
                onClick={() => handleOpenDetails(test)}
                className="flex items-center gap-1 text-green-700 font-bold text-sm hover:underline"
              >
                <FileEdit size={16} /> Detalhes
              </button>
            </div>
          </div>
        ))}

        {filteredTests.length === 0 && (
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center md:col-span-2 lg:col-span-2 min-h-[220px]">
            <HelpCircle size={36} className="text-gray-200 mb-3" />
            <p className="text-sm font-bold text-gray-700">Nenhum teste encontrado.</p>
            <p className="mt-1 text-xs text-gray-400">Ajuste a pesquisa ou crie um novo teste.</p>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar Teste */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-700 rounded-2xl">
                  {editingTestId ? <FileEdit size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{editingTestId ? 'Editar Detalhes do Teste' : 'Novo Teste Americano (V/F)'}</h3>
                  <p className="text-sm text-gray-500">
                    {editingTestId ? 'Modifique os parâmetros e questões do teste.' : 'Avaliação rápida com foco em assertividade.'}
                  </p>
                </div>
              </div>
              <button onClick={() => { setShowModal(false); setFormError(null); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {formError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {formError}
                </div>
              )}

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Título do Teste</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Teste de Aptidão V/F"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900"
                    value={newTest.title}
                    onChange={e => setNewTest({...newTest, title: e.target.value})}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Tempo Limite</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-gray-200 bg-white px-3 py-3 shadow-sm">
                      <input 
                        type="number" 
                        required 
                        min="0"
                        placeholder="HH"
                        className="w-full bg-transparent border-none outline-none text-center text-xl font-black text-gray-900"
                        value={testTime.hours || ''}
                        onChange={e => setTestTime({...testTime, hours: parseInt(e.target.value) || 0})}
                      />
                      <span className="text-[10px] text-gray-500 font-bold uppercase block text-center mt-1">Horas</span>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white px-3 py-3 shadow-sm">
                      <input 
                        type="number" 
                        required 
                        min="0"
                        max="59"
                        placeholder="MM"
                        className="w-full bg-transparent border-none outline-none text-center text-xl font-black text-gray-900"
                        value={testTime.minutes || ''}
                        onChange={e => setTestTime({...testTime, minutes: Math.min(59, parseInt(e.target.value) || 0)})}
                      />
                      <span className="text-[10px] text-gray-500 font-bold uppercase block text-center mt-1">Minutos</span>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white px-3 py-3 shadow-sm">
                      <input 
                        type="number" 
                        required 
                        min="0"
                        max="59"
                        placeholder="SS"
                        className="w-full bg-transparent border-none outline-none text-center text-xl font-black text-gray-900"
                        value={testTime.seconds || ''}
                        onChange={e => setTestTime({...testTime, seconds: Math.min(59, parseInt(e.target.value) || 0)})}
                      />
                      <span className="text-[10px] text-gray-500 font-bold uppercase block text-center mt-1">Segundos</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Aprovação (%)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    max="100"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-900"
                    value={newTest.minPassScore}
                    onChange={e => setNewTest({...newTest, minPassScore: parseInt(e.target.value)})}
                  />
                  <span className="text-[10px] text-gray-400 font-bold uppercase block text-center mt-1">Nota Mín.</span>
                </div>
              </div>

              {/* Questões */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Questões V/F ({newTest.questions.length})</h4>
                  <button 
                    type="button"
                    onClick={handleAddQuestion}
                    className="flex items-center gap-2 text-green-600 font-bold text-sm hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={16} /> Adicionar Afirmação
                  </button>
                </div>

                {newTest.questions.length === 0 && (
                  <div className="py-12 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center">
                    <HelpCircle size={40} className="text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm">Nenhuma afirmação adicionada ainda.</p>
                  </div>
                )}

                <div className="space-y-6">
                  {newTest.questions.map((q, idx) => (
                    <div key={q.id} className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-4 relative hover:border-green-200 transition-colors">
                      <button 
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Afirmação {idx + 1}</label>
                          <textarea 
                            required
                            placeholder="Digite a afirmação que o candidato deve julgar..."
                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900 min-h-[80px]"
                            value={q.text}
                            onChange={e => handleUpdateQuestion(idx, { text: e.target.value })}
                          />
                        </div>
                        <div className="sm:w-48 space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-black uppercase">Tipo</label>
                            <select 
                              className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-bold text-black"
                              value={q.type}
                              onChange={e => handleUpdateQuestion(idx, { type: e.target.value as any })}
                            >
                              <option value="TRUE_FALSE">Verdadeiro ou Falso</option>
                              <option value="MULTIPLE_CHOICE">Escolha Múltipla</option>
                              <option value="DISCURSIVE">Dissertativa</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-black uppercase">Pontuação</label>
                            <input 
                              type="number" 
                              required
                              className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm text-black"
                              value={q.points}
                              onChange={e => handleUpdateQuestion(idx, { points: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                      </div>

                      {q.type === 'TRUE_FALSE' && (
                        <div className="flex gap-4">
                          {['TRUE', 'FALSE'].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleUpdateQuestion(idx, { correctAnswer: val })}
                              className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                                q.correctAnswer === val 
                                ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-200' 
                                : 'border-gray-100 text-gray-400 hover:border-green-200 bg-gray-50'
                              }`}
                            >
                              {q.correctAnswer === val && <CheckCircle size={18} />}
                              {val === 'TRUE' ? 'Verdadeiro' : 'Falso'}
                            </button>
                          ))}
                        </div>
                      )}

                      {q.type === 'MULTIPLE_CHOICE' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {q.options?.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input 
                                type="radio" 
                                name={`correct-${q.id}`} 
                                checked={q.correctAnswer === opt && opt !== ''}
                                onChange={() => handleUpdateQuestion(idx, { correctAnswer: opt })}
                                className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                              />
                              <input 
                                type="text" 
                                required
                                placeholder={`Opção ${optIdx + 1}`}
                                className={`flex-1 px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm ${q.correctAnswer === opt && opt !== '' ? 'bg-green-50 text-green-900 font-bold' : ''}`}
                                value={opt}
                                onChange={e => handleUpdateOption(idx, optIdx, e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <p className="text-xs text-gray-500 italic max-w-sm">
                Nota: O Sistema Americano (V/F) é ideal para triagens técnicas rápidas.
              </p>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => { setShowModal(false); setFormError(null); }}
                  className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="px-10 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'A guardar...' : (editingTestId ? 'Guardar Alterações' : 'Publicar Teste')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerTests;
