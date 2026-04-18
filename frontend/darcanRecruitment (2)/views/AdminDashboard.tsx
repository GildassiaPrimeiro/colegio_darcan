import React from 'react';
import { ShieldCheck, Users, Activity, HardDrive } from 'lucide-react';
import { Application, AuditLog, Job, User } from '../types';

interface AdminDashboardProps {
  managers: User[];
  candidates: User[];
  jobs: Job[];
  applications: Application[];
  auditLogs: AuditLog[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ managers, candidates, jobs, applications, auditLogs }) => {
  const activeManagers = managers.filter((manager) => !manager.isBlocked).length;
  const registrationsToday = [...candidates, ...managers].filter((person) => {
    const relatedApplications = applications.filter((application) => application.candidateId === person.id);
    const referenceDate = relatedApplications[0]?.appliedAt;
    return referenceDate ? new Date(referenceDate).toDateString() === new Date().toDateString() : false;
  }).length;
  const recentActivity = auditLogs.filter((log) => {
    const diff = Date.now() - new Date(log.timestamp).getTime();
    return diff <= 24 * 60 * 60 * 1000;
  }).length;
  const documentCount = candidates.reduce((total, candidate) => total + Object.values(candidate.documents || {}).filter(Boolean).length, 0);

  const alerts = auditLogs.slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Consola de Administração</h1>
        <p className="text-slate-500">Monitorização global do ecossistema Darcan.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <ShieldCheck size={24} />
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">ATIVO</span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Gestores Ativos</h3>
          <p className="text-3xl font-bold text-slate-900 mt-1">{activeManagers}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Users size={24} />
            </div>
            <span className="text-xs font-bold text-blue-600">Hoje: {registrationsToday}</span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Total de Candidatos</h3>
          <p className="text-3xl font-bold text-slate-900 mt-1">{candidates.length}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
              <Activity size={24} />
            </div>
            <span className="text-xs font-bold text-slate-400">24h</span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Atividades Recentes</h3>
          <p className="text-3xl font-bold text-slate-900 mt-1">{recentActivity}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <HardDrive size={24} />
            </div>
            <span className="text-xs font-bold text-amber-600">{jobs.length} vagas</span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium">Documentos Anexados</h3>
          <p className="text-3xl font-bold text-slate-900 mt-1">{documentCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Atividade recente</h3>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-500">Ainda não existem registos suficientes.</p>
            ) : (
              alerts.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-4">
                  <h4 className="font-bold text-sm text-slate-900">{item.action}</h4>
                  <p className="mt-1 text-xs text-slate-500">{item.userName} · {item.module}</p>
                  <span className="mt-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Equipa de gestão</h3>
          <div className="space-y-4">
            {managers.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum gestor registado.</p>
            ) : (
              managers.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{member.name}</h4>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${member.isBlocked ? 'text-red-500' : 'text-emerald-600'}`}>
                    {member.isBlocked ? 'Bloqueado' : 'Ativo'}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="mt-8 text-emerald-600 font-bold text-sm">Candidaturas registadas: {applications.length}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
