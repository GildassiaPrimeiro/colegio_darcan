import React, { useState } from 'react';
import { Application, ApplicationStatus, Job } from '../types';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, Award } from 'lucide-react';

interface ManagerInterviewsProps {
  applications: Application[];
  jobs: Job[];
  onUpdateStatus: (appId: string, status: ApplicationStatus) => void;
}

const ManagerInterviews: React.FC<ManagerInterviewsProps> = ({ applications, jobs, onUpdateStatus }) => {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'conducted'>('upcoming');

  const upcomingInterviews = applications.filter((application) => application.status === ApplicationStatus.APPROVED_FOR_INTERVIEW);
  const conductedInterviews = applications.filter((application) => application.status === ApplicationStatus.INTERVIEWED);
  const displayInterviews = activeTab === 'upcoming' ? upcomingInterviews : conductedInterviews;

  const handleFinalDecision = (appId: string, status: ApplicationStatus) => {
    onUpdateStatus(appId, status);
    setSelectedApp(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Entrevistas</h1>
          <p className="text-gray-500">Coordene os encontros presenciais e decisões finais sem blocos auxiliares desnecessários.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('upcoming')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            Próximas ({upcomingInterviews.length})
          </button>
          <button onClick={() => setActiveTab('conducted')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'conducted' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            Realizadas ({conductedInterviews.length})
          </button>
        </div>
      </header>

      <div className="space-y-4">
        {displayInterviews.length === 0 ? (
          <div className="bg-white p-16 rounded-[2.5rem] border border-gray-100 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 text-gray-200">
              <Calendar size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {activeTab === 'upcoming' ? 'Sem entrevistas agendadas' : 'Nenhuma entrevista realizada'}
            </h3>
            <p className="text-gray-400 max-w-xs">
              {activeTab === 'upcoming' ? 'Nenhum candidato está atualmente aguardando entrevista.' : 'Ainda não foram concluídas entrevistas para análise final.'}
            </p>
          </div>
        ) : (
          displayInterviews.map((app) => {
            const job = jobs.find((jobItem) => jobItem.id === app.jobId);
            const isInterviewed = app.status === ApplicationStatus.INTERVIEWED;

            return (
              <div key={app.id} className={`bg-white p-6 rounded-3xl border transition-all ${isInterviewed ? 'border-indigo-100' : 'border-gray-100 hover:border-green-200 shadow-sm hover:shadow-md'}`}>
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                  <div className="flex gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isInterviewed ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-700'}`}>
                      <User size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 text-lg">Candidato {app.candidateId}</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-lg ${isInterviewed ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                          {isInterviewed ? 'Aguardando Decisão' : 'Confirmada'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-green-600 uppercase tracking-wider">{job?.title}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" /> {app.interviewDate ? new Date(app.interviewDate).toLocaleDateString() : 'Data não definida'}</span>
                        <span className="flex items-center gap-1.5"><Clock size={14} className="text-gray-400" /> {app.interviewDate ? new Date(app.interviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                        <span className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400" /> {app.interviewLocation || 'Local não definido'}</span>
                      </div>
                    </div>
                  </div>

                  {!isInterviewed ? (
                    <button onClick={() => onUpdateStatus(app.id, ApplicationStatus.INTERVIEWED)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                      Concluir Entrevista <CheckCircle size={16} />
                    </button>
                  ) : (
                    <button onClick={() => setSelectedApp(app)} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
                      Decisão Final <Award size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedApp(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Award size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Decisão de Contratação</h2>
              <p className="text-gray-500 mb-8">Após a entrevista, qual é o veredito final para o Candidato {selectedApp.candidateId}?</p>
              <div className="grid grid-cols-1 gap-4">
                <button onClick={() => handleFinalDecision(selectedApp.id, ApplicationStatus.HIRED)} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-100">
                  <CheckCircle size={20} /> Contratar Candidato
                </button>
                <button onClick={() => handleFinalDecision(selectedApp.id, ApplicationStatus.REJECTED)} className="w-full py-4 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-3">
                  <XCircle size={20} /> Rejeitar Candidato
                </button>
                <button onClick={() => setSelectedApp(null)} className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-all">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerInterviews;
