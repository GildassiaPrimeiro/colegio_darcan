import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Target, Clock, Calendar, ChevronDown, FileText, Send, PenSquare } from 'lucide-react';
import { Application, ApplicationStatus, Job, User, UserRole } from '../types';

interface ManagerReportsProps {
  applications: Application[];
  jobs: Job[];
  candidates: User[];
  currentUser: User;
  onSendReport: (reportContent: string) => void;
}

const StatCard = ({ title, value, subValue, icon: Icon, colorClass }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
    <h3 className="text-gray-500 text-xs font-black uppercase tracking-widest">{title}</h3>
    <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
    <p className="text-xs text-gray-400 mt-2 font-medium">{subValue}</p>
  </div>
);

const ManagerReports: React.FC<ManagerReportsProps> = ({ applications, jobs, candidates, currentUser, onSendReport }) => {
  const [period, setPeriod] = useState('30d');
  const [showComposer, setShowComposer] = useState(false);
  const [signerName, setSignerName] = useState(currentUser.name);
  const [reportTitle, setReportTitle] = useState('Relatório Executivo de Recrutamento');
  const canCreateReport = currentUser.role === UserRole.MANAGER;
  const hiredCount = applications.filter((application) => application.status === ApplicationStatus.HIRED).length;
  const testsCompleted = applications.filter((application) => application.testScore !== undefined && application.testScore !== null);
  const averageScore = testsCompleted.length > 0
    ? Math.round(testsCompleted.reduce((total, application) => total + (application.testScore || 0), 0) / testsCompleted.length)
    : 0;
  const interviewCount = applications.filter((application) =>
    application.status === ApplicationStatus.APPROVED_FOR_INTERVIEW || application.status === ApplicationStatus.INTERVIEWED
  ).length;

  const areaData = jobs.slice(0, 7).map((job) => ({
    vaga: job.title.slice(0, 18),
    candidaturas: applications.filter((application) => application.jobId === job.id).length,
    contratados: applications.filter((application) => application.jobId === job.id && application.status === ApplicationStatus.HIRED).length,
  }));

  const departmentData = jobs.reduce((accumulator: Record<string, number>, job) => {
    accumulator[job.department] = (accumulator[job.department] || 0) + 1;
    return accumulator;
  }, {});

  const deptData = Object.entries(departmentData).map(([name, value], index) => ({
    name,
    value,
    color: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'][index % 5]
  }));

  const conversionRate = applications.length > 0 ? ((hiredCount / applications.length) * 100).toFixed(1) : '0.0';
  const approvedProfiles = candidates.filter((candidate) => candidate.documentStatus === 'APPROVED').length;
  const pendingProfiles = candidates.filter((candidate) => candidate.documentStatus === 'SUBMITTED').length;
  const rejectedProfiles = candidates.filter((candidate) => candidate.documentStatus === 'REJECTED').length;
  const openJobs = jobs.filter((job) => job.status === 'OPEN').length;

  const reportContent = useMemo(() => {
    const today = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    const topJobs = jobs
      .map((job) => ({
        title: job.title,
        total: applications.filter((application) => application.jobId === job.id).length,
      }))
      .sort((left, right) => right.total - left.total)
      .slice(0, 3)
      .map((job, index) => `${index + 1}. ${job.title}: ${job.total} candidatura(s)`)
      .join('\n');

    return [
      reportTitle,
      `Período analisado: ${period === '7d' ? 'Últimos 7 dias' : period === '12m' ? 'Último ano' : 'Últimos 30 dias'}`,
      `Data de emissão: ${today}`,
      '',
      'Resumo executivo',
      `Foram registadas ${applications.length} candidatura(s) no sistema, com ${openJobs} vaga(s) aberta(s) e taxa de conversão de ${conversionRate}%.`,
      `Até ao momento, ${interviewCount} entrevista(s) foram agendada(s) e ${hiredCount} candidato(s) avançaram para contratação.`,
      '',
      'Validação de perfis e documentos',
      `${approvedProfiles} perfil(is) estão aprovados para candidatura.`,
      `${pendingProfiles} perfil(is) aguardam validação documental.`,
      `${rejectedProfiles} perfil(is) exigem correção ou nova submissão documental.`,
      '',
      'Desempenho operacional',
      `Foram concluídos ${testsCompleted.length} teste(s), com média geral de ${averageScore}%.`,
      topJobs ? `Vagas com maior volume:\n${topJobs}` : 'Ainda não existem vagas com volume suficiente para destaque.',
      '',
      'Conclusão',
      'Recomenda-se continuidade na validação célere dos perfis pendentes e priorização das vagas com maior procura para acelerar o funil de recrutamento.',
      '',
      `Assinatura: ${signerName || currentUser.name}`,
    ].join('\n');
  }, [applications, jobs, averageScore, conversionRate, currentUser.name, hiredCount, interviewCount, openJobs, pendingProfiles, period, reportTitle, signerName, approvedProfiles, rejectedProfiles, testsCompleted.length]);

  const handleSendReport = () => {
    onSendReport(reportContent);
    setShowComposer(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Relatórios</h1>
          <p className="text-gray-500 font-medium">Indicadores calculados apenas com dados reais do sistema.</p>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
          {canCreateReport && (
            <button
              type="button"
              onClick={() => setShowComposer(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-green-100 transition-all hover:bg-green-800"
            >
              <PenSquare size={18} />
              Criar relatório
            </button>
          )}
          <div className="relative w-full md:w-auto">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none bg-white border border-gray-100 px-6 py-3 pr-12 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-green-500 shadow-sm w-full"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="12m">Último ano</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>
      </header>

      <div className="rounded-[2rem] border border-green-100 bg-green-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-black text-gray-900">
              <FileText className="text-green-700" size={20} />
              Relatório profissional
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {canCreateReport
                ? 'Gere um relatório com dados reais do sistema, personalize a assinatura e envie diretamente para o administrador.'
                : 'Visualização consolidada dos relatórios e indicadores reais do sistema.'}
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm">
            Assinatura atual: {signerName || currentUser.name}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Inscritos" value={candidates.length} subValue="Candidatos únicos registados" icon={Users} colorClass="bg-blue-50 text-blue-600" />
        <StatCard title="Taxa de Conversão" value={`${conversionRate}%`} subValue="Contratados vs candidaturas" icon={Target} colorClass="bg-emerald-50 text-emerald-600" />
        <StatCard title="Entrevistas" value={interviewCount} subValue={`Testes concluídos: ${testsCompleted.length} | média ${averageScore}%`} icon={Clock} colorClass="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-8">
            <TrendingUp className="text-green-600" size={20} /> Evolução por vaga
          </h3>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="vaga" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="candidaturas" stroke="#059669" strokeWidth={4} fillOpacity={1} fill="url(#colorApps)" />
                <Area type="monotone" dataKey="contratados" stroke="#94a3b8" strokeWidth={2} fillOpacity={0} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-900 mb-8 flex items-center gap-2">
            <Calendar className="text-green-600" size={20} /> Por departamento
          </h3>

          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deptData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 space-y-4 flex-1">
            {deptData.length === 0 ? (
              <p className="text-sm text-gray-500">Sem departamentos suficientes para análise.</p>
            ) : (
              deptData.map((item) => (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-bold text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-gray-900">{item.value}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showComposer && canCreateReport && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowComposer(false)} />
          <div className="relative w-full max-w-4xl rounded-[2.5rem] bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-8 py-6">
              <h2 className="text-2xl font-black text-gray-900">Criar relatório</h2>
              <p className="mt-1 text-sm text-gray-500">Revise o conteúdo gerado automaticamente, personalize o título e a assinatura, depois envie.</p>
            </div>

            <div className="grid gap-6 p-8 lg:grid-cols-[1fr_1.4fr]">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Título do relatório</label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Nome para assinatura</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 font-medium text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                  O relatório será enviado em mensagem interna para o administrador com o conteúdo abaixo.
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400">Pré-visualização</label>
                <textarea
                  value={reportContent}
                  onChange={() => undefined}
                  readOnly
                  rows={18}
                  className="w-full rounded-[2rem] border border-gray-100 bg-gray-50 px-5 py-4 font-medium text-gray-800 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 px-8 py-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="rounded-2xl bg-gray-100 px-5 py-3 text-sm font-bold text-gray-600 transition-all hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendReport}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-green-100 transition-all hover:bg-green-800"
              >
                <Send size={18} />
                Enviar relatório
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerReports;
