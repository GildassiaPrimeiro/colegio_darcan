import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Briefcase, FileCheck, CalendarCheck } from 'lucide-react';
import { Application, ApplicationStatus, AuditLog, Job } from '../types';

interface ManagerDashboardProps {
  jobs: Job[];
  applications: Application[];
  auditLogs: AuditLog[];
}

const StatCard = ({ title, value, icon: Icon, trend }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-green-50">
    <div className="flex justify-between items-start">
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
      </div>
      <div className="p-2 bg-green-50 rounded-lg text-green-600 shrink-0">
        <Icon size={24} />
      </div>
    </div>
    {trend && (
      <p className={`text-xs mt-3 ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
        {trend.positive ? '↑' : '↓'} {trend.value}
      </p>
    )}
  </div>
);

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ jobs, applications, auditLogs }) => {
  const uniqueCandidates = new Set(applications.map((application) => application.candidateId)).size;
  const interviewsToday = applications.filter((application) => {
    if (!application.interviewDate) return false;
    return new Date(application.interviewDate).toDateString() === new Date().toDateString();
  }).length;
  const testsAvailableNow = applications.filter(
    (application) => application.status === ApplicationStatus.PENDING_TEST && application.testAvailable
  ).length;

  const data = [
    { name: 'Triagem', value: applications.filter((app) => app.status === ApplicationStatus.PENDING_CV).length, color: '#10b981' },
    { name: 'Testes', value: applications.filter((app) => app.status === ApplicationStatus.PENDING_TEST || app.status === ApplicationStatus.TEST_IN_PROGRESS).length, color: '#34d399' },
    { name: 'Entrevista', value: applications.filter((app) => app.status === ApplicationStatus.APPROVED_FOR_INTERVIEW || app.status === ApplicationStatus.INTERVIEWED).length, color: '#6ee7b7' },
    { name: 'Aprovados', value: applications.filter((app) => app.status === ApplicationStatus.HIRED).length, color: '#059669' },
  ];

  const recentActivities = auditLogs.slice(0, 4).map((log) => ({
    text: `${log.userName}: ${log.action}`,
    time: new Date(log.timestamp).toLocaleString(),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Recrutamento</h1>
        <p className="text-gray-500 text-sm sm:text-base">Resumo operacional calculado a partir dos dados reais da plataforma.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Vagas Abertas" value={jobs.filter((job) => job.status === 'OPEN').length} icon={Briefcase} />
        <StatCard title="Total Candidatos" value={uniqueCandidates} icon={Users} />
        <StatCard title="Testes Pendentes" value={data[1].value} icon={FileCheck} />
        <StatCard title="Entrevistas Hoje" value={interviewsToday} icon={CalendarCheck} />
      </div>

      <div className="rounded-2xl border border-green-100 bg-green-50 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-widest text-green-700">Testes disponíveis agora</p>
        <p className="mt-2 text-2xl font-black text-green-900">{testsAvailableNow}</p>
        <p className="mt-1 text-sm font-medium text-green-800">Candidatos que já podem realizar o teste neste momento.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-green-50 overflow-hidden">
          <h3 className="text-lg font-semibold mb-6">Candidatos por Fase</h3>
          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-green-50">
          <h3 className="text-lg font-semibold mb-4">Resumo Operacional</h3>
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Vagas abertas</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{jobs.filter((job) => job.status === 'OPEN').length}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Aguardando revisão</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{applications.filter((application) => application.status === ApplicationStatus.PENDING_REVIEW).length}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Testes disponíveis agora</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{testsAvailableNow}</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Últimos registos</p>
              {recentActivities.length === 0 ? (
                <p className="mt-1 text-sm text-gray-500">Sem atividades registadas.</p>
              ) : (
                <div className="mt-2 space-y-3">
                  {recentActivities.slice(0, 3).map((activity, index) => (
                    <div key={index} className="border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                      <p className="text-sm text-gray-800 leading-tight">{activity.text}</p>
                      <span className="text-xs text-gray-400 block mt-1">{activity.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
