
import React, { useState } from 'react';
import { Application, ApplicationStatus, Job, OnlineTest } from '../types';
import { 
  ClipboardCheck, 
  CheckCircle, 
  XCircle, 
  User as UserIcon, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  FileText, 
  Target, 
  X, 
  MessageSquare,
  BarChart,
  Calendar as CalendarIcon
} from 'lucide-react';

interface TestReviewProps {
  applications: Application[];
  jobs: Job[];
  tests: OnlineTest[];
  onUpdateStatus: (appId: string, status: ApplicationStatus, interviewDate?: string) => void;
}

const TestReview: React.FC<TestReviewProps> = ({ applications, jobs, tests, onUpdateStatus }) => {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [feedback, setFeedback] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  
  const pendingReviews = applications.filter(app => app.status === ApplicationStatus.PENDING_REVIEW);

  const handleOpenReview = (app: Application) => {
    setSelectedApp(app);
    setFeedback(app.feedback || '');
  };

  const handleCloseReview = () => {
    setSelectedApp(null);
    setFeedback('');
    setInterviewDate('');
  };

  const handleFinalize = (status: ApplicationStatus, date?: string) => {
    if (selectedApp) {
      onUpdateStatus(selectedApp.id, status, date);
      handleCloseReview();
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Avaliação de Testes</h1>
        <p className="text-gray-500">Analise detalhadamente o desempenho dos candidatos e valide competências técnicas.</p>
      </header>

      {pendingReviews.length === 0 ? (
        <div className="bg-white py-24 rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center text-green-200 mb-6 shadow-sm">
            <ClipboardCheck size={48} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Tudo em dia!</h3>
          <p className="text-gray-500 mt-2 max-w-sm">
            Não há testes pendentes de avaliação neste momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingReviews.map(app => {
            const job = jobs.find(j => j.id === app.jobId);
            const isPassing = (app.testScore || 0) >= 70;

            return (
              <div 
                key={app.id} 
                onClick={() => handleOpenReview(app)}
                className="bg-white p-6 rounded-3xl border border-green-50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-green-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors shrink-0">
                    <UserIcon size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Candidato: {app.candidateId}</h3>
                    <p className="text-green-700 font-bold text-sm mb-1">{job?.title}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Clock size={14}/> Submetido em {new Date(app.testCompletedAt!).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end px-8 md:border-r border-gray-50 h-full">
                  <span className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-tighter">Pontuação Obtida</span>
                  <div className={`text-4xl font-black ${isPassing ? 'text-green-600' : 'text-amber-500'}`}>
                    {app.testScore}%
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`hidden sm:flex px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${isPassing ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {isPassing ? 'Acima do Mínimo' : 'Abaixo do Mínimo'}
                  </div>
                  <ChevronRight size={24} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Revisão Detalhada */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header do Modal */}
            <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-green-700 text-white rounded-2xl shadow-lg shadow-green-100">
                  <Target size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 leading-none">Análise de Performance</h3>
                  <p className="text-gray-500 mt-1 font-medium">Revisão do teste para a vaga de <span className="text-green-700 font-bold">{jobs.find(j => j.id === selectedApp.jobId)?.title}</span></p>
                </div>
              </div>
              <button 
                onClick={handleCloseReview}
                className="p-3 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-all"
              >
                <X size={28} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lado Esquerdo: Resumo do Candidato */}
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-3xl p-6 border border-green-100">
                    <h4 className="text-[10px] font-black text-green-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <BarChart size={14} /> Resumo de Desempenho
                    </h4>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-5xl font-black text-green-700">{selectedApp.testScore}%</span>
                      <span className="text-green-600/50 font-bold mb-1">Score Total</span>
                    </div>
                    <div className="w-full bg-white rounded-full h-3 mb-4 overflow-hidden">
                      <div 
                        className="bg-green-600 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${selectedApp.testScore}%` }} 
                      />
                    </div>
                    <p className="text-xs text-green-800/70 font-medium">
                      {selectedApp.testScore! >= 70 
                        ? "Este candidato atingiu a nota mínima exigida para a vaga." 
                        : "A pontuação está abaixo do limite de 70% recomendado pelo sistema."}
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalhes do Candidato</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-bold">
                        {selectedApp.candidateId.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">ID: {selectedApp.candidateId}</p>
                        <p className="text-xs text-gray-500">Inscrito em {new Date(selectedApp.appliedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                      <FileText size={16} /> Ver Currículo Completo
                    </button>
                  </div>
                </div>

                {/* Lado Direito: Listagem de Questões e Respostas */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                      <ClipboardCheck size={18} className="text-green-700" /> Detalhe das Questões (V/F)
                    </h4>
                    
                    <div className="space-y-4">
                      {/* Pegamos o teste real para comparar as questões */}
                      {tests.find(t => t.id === jobs.find(j => j.id === selectedApp.jobId)?.testId)?.questions.map((q, idx) => (
                        <div key={q.id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex gap-4">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-xs shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 leading-tight">{q.text}</p>
                            <div className="mt-3 flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Gabarito:</span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${q.correctAnswer === 'TRUE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {q.correctAnswer === 'TRUE' ? 'Verdadeiro' : 'Falso'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Acertos:</span>
                                <span className="text-[10px] font-bold text-green-600">{q.points} Pontos</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={16} className="text-green-700" /> Observações do Recrutador (Opcional)
                    </label>
                    <textarea 
                      rows={3}
                      placeholder="Adicione anotações sobre o perfil técnico deste candidato..."
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-600 outline-none font-medium text-black text-sm resize-none"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer do Modal: Ações Finais */}
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col lg:flex-row justify-between items-end lg:items-center gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto">
                <div className="flex items-center gap-3 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 h-fit">
                  <AlertCircle size={18} />
                  <span className="text-xs font-bold uppercase tracking-tight">Decisão Irreversível</span>
                </div>

                <div className="flex-1 min-w-[200px] space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <CalendarIcon size={14} className="text-green-700" /> Agendar Entrevista
                  </label>
                  <input 
                    type="datetime-local" 
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-green-600 transition-all"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                <button 
                  onClick={() => handleFinalize(ApplicationStatus.REJECTED)}
                  className="flex-1 lg:flex-none px-6 py-4 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-black text-xs hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle size={18} /> Reprovar
                </button>
                <button 
                  onClick={() => handleFinalize(ApplicationStatus.APPROVED_FOR_INTERVIEW)}
                  className="flex-1 lg:flex-none px-6 py-4 bg-white border-2 border-green-100 text-green-700 rounded-2xl font-black text-xs hover:bg-green-50 hover:border-green-200 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> Aprovar
                </button>
                <button 
                  onClick={() => handleFinalize(ApplicationStatus.APPROVED_FOR_INTERVIEW, interviewDate)}
                  disabled={!interviewDate}
                  className={`flex-1 lg:flex-none px-8 py-4 rounded-2xl font-black text-xs transition-all shadow-xl flex items-center justify-center gap-2 ${
                    interviewDate 
                    ? 'bg-green-700 text-white hover:bg-green-800 shadow-green-100' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <CalendarIcon size={18} /> Marcar Entrevista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex gap-5">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest">Dica de Avaliação</h4>
          <p className="text-xs text-blue-700/80 leading-relaxed mt-1 font-medium">
            O Sistema Americano Darcan (V/F) prioriza a assertividade. Recomendamos que você analise não apenas o score final, 
            mas as questões específicas onde o candidato falhou. No caso de empate técnico, a biografia e o currículo devem ser o fator de desempate.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestReview;
