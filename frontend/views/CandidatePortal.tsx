
import React, { useState, useEffect, useRef } from 'react';
import { Job, Application, ApplicationStatus, OnlineTest, Question, Message, User, UserRole, DocumentStatus } from '../types';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Send, 
  Upload, 
  Info, 
  Briefcase, 
  CalendarCheck, 
  AlertTriangle,
  User as UserIcon,
  Mail,
  Linkedin,
  FileText,
  Save,
  Camera,
  MapPin,
  GraduationCap,
  MessageSquare,
  ChevronRight,
  UserCheck,
  Search,
  Filter,
  X,
  Calendar,
  List
} from 'lucide-react';

interface CandidatePortalProps {
  user: User;
  applications: Application[];
  jobs: Job[];
  tests: OnlineTest[];
  messages: Message[];
  managers: User[];
  onApply: (jobId: string, cvUrl: string) => void;
  onFinishTest: (appId: string, score: number) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onMarkMessageRead: (id: string) => void;
  onSendMessage?: (receiverId: string, text: string) => void;
  onSubmitDocuments?: (docs: { cvName: string; cvUrl?: string; biName: string; biUrl?: string; diplomaName: string; diplomaUrl?: string }) => void;
  onUpdateProfile?: (updates: Partial<User>) => void;
}

const CandidatePortal: React.FC<CandidatePortalProps> = ({ 
  user, 
  applications, 
  jobs,
  tests,
  messages,
  managers,
  onApply, 
  onFinishTest,
  activeTab,
  setActiveTab,
  onMarkMessageRead,
  onSendMessage,
  onSubmitDocuments,
  onUpdateProfile
}) => {
  const [takingTest, setTakingTest] = useState<{ test: OnlineTest; appId: string } | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [fileError, setFileError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [replyText, setReplyText] = useState('');
  const candidateApplications = applications.filter((application) => application.candidateId === user.id);
  
  // Profile State
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const biInputRef = useRef<HTMLInputElement>(null);
  const diplomaInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState({
    name: user.name || 'Candidato Darcan',
    email: user.email || 'candidato@email.com',
    phone: user.phone || '(+244) 923 000 000',
    location: user.address || 'Luanda, Angola',
    linkedin: user.linkedin || 'linkedin.com/in/candidato',
    education: user.education || 'Licenciatura em Gestão de Recursos Humanos',
    experience: user.experience || '3 anos de experiência em recrutamento e seleção em Angola',
    birthDate: user.birthDate || '',
    gender: user.gender || '',
    cvName: user.documents?.cvName || 'curriculo_v1_2024.pdf',
    cvUrl: user.documents?.cvUrl || '',
    biName: user.documents?.biName || '',
    biUrl: user.documents?.biUrl || '',
    diplomaName: user.documents?.diplomaName || '',
    diplomaUrl: user.documents?.diplomaUrl || ''
  });

  useEffect(() => {
    setCandidateProfile((current) => ({
      ...current,
      name: user.name || current.name,
      email: user.email || current.email,
      phone: user.phone || current.phone,
      location: user.address || current.location,
      linkedin: user.linkedin || current.linkedin,
      education: user.education || current.education,
      experience: user.experience || current.experience,
      birthDate: user.birthDate || current.birthDate,
      gender: user.gender || current.gender,
      cvName: user.documents?.cvName || current.cvName,
      cvUrl: user.documents?.cvUrl || current.cvUrl,
      biName: user.documents?.biName || current.biName,
      biUrl: user.documents?.biUrl || current.biUrl,
      diplomaName: user.documents?.diplomaName || current.diplomaName,
      diplomaUrl: user.documents?.diplomaUrl || current.diplomaUrl,
    }));
  }, [user]);

  const handleSaveProfile = () => {
    if (onUpdateProfile) {
      onUpdateProfile({
        name: candidateProfile.name,
        email: candidateProfile.email,
        phone: candidateProfile.phone,
        address: candidateProfile.location,
        linkedin: candidateProfile.linkedin,
        education: candidateProfile.education,
        experience: candidateProfile.experience,
        birthDate: candidateProfile.birthDate,
        gender: candidateProfile.gender,
      });
    }
    setIsEditing(false);
    setFeedbackMessage('Perfil atualizado com sucesso.');
  };

  const isProfileComplete = !!(
    candidateProfile.name && 
    candidateProfile.email && 
    candidateProfile.phone && 
    candidateProfile.location && 
    candidateProfile.birthDate && 
    candidateProfile.gender && 
    candidateProfile.education && 
    candidateProfile.experience
  );

  const hasRequiredDocuments = !!(
    user.documents?.cvName &&
    user.documents?.biName &&
    user.documents?.diplomaName
  );

  const canUpload = !user.documentStatus || user.documentStatus === DocumentStatus.NOT_SUBMITTED || user.documentStatus === DocumentStatus.REJECTED;
  const isPendingApproval = user.documentStatus === DocumentStatus.SUBMITTED;
  const isApproved = user.documentStatus === DocumentStatus.APPROVED;
  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Data a confirmar';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Data a confirmar' : parsed.toLocaleString();
  };
  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Não foi possível ler o ficheiro selecionado.'));
    reader.readAsDataURL(file);
  });

  const canApply = (job: Job) => {
    const isDeadlinePassed = !!job.deadline && new Date(`${job.deadline}T23:59:59`).getTime() < Date.now();

    if (job.status !== 'OPEN') {
      setFileError('Esta vaga já não está disponível para novas candidaturas.');
      return false;
    }

    if (isDeadlinePassed) {
      setFileError('O prazo de inscrição desta vaga já terminou.');
      return false;
    }

    if (!isProfileComplete) {
      setFileError('Complete o seu perfil (data de nascimento e outros dados) antes de se candidatar.');
      return false;
    }

    if (!hasRequiredDocuments) {
      setFileError('Submeta CV, BI e Certificado/Diploma antes de se candidatar.');
      return false;
    }

    if (user.documentStatus !== DocumentStatus.APPROVED) {
      setFileError('Aguarde a validação do seu perfil e dos documentos pelo gestor ou administrador antes de se candidatar.');
      return false;
    }

    if (candidateApplications.some((application) => application.jobId === job.id)) {
      setFileError('Já existe uma candidatura sua para esta vaga.');
      return false;
    }

    if ((job.candidateLimit || 0) > 0 && (job.currentCandidates || 0) >= (job.candidateLimit || 0)) {
      setFileError('Esta vaga já atingiu o limite máximo de candidatos.');
      return false;
    }

    setFileError(null);
    return true;
  };

  const getApplyButton = (job: Job) => {
    const hasApplied = candidateApplications.some(a => a.jobId === job.id);
    const isFull = (job.candidateLimit || 0) > 0 && (job.currentCandidates || 0) >= (job.candidateLimit || 0);
    const isDeadlinePassed = !!job.deadline && new Date(`${job.deadline}T23:59:59`).getTime() < Date.now();
    const disabledLabel = job.status !== 'OPEN'
      ? 'Vaga indisponível'
      : isDeadlinePassed
        ? 'Prazo de inscrição encerrado'
        : !isProfileComplete
      ? 'Complete o perfil antes de concorrer'
      : !hasRequiredDocuments
        ? 'Envie os documentos obrigatórios'
        : user.documentStatus === DocumentStatus.SUBMITTED
          ? 'Aguardando validação do perfil'
          : user.documentStatus === DocumentStatus.REJECTED
            ? 'Corrija os documentos rejeitados'
            : 'Concorrer indisponível';
    
    if (hasApplied) {
      return (
        <div className="flex items-center gap-2 text-green-600 font-bold py-4 justify-center bg-green-50 rounded-2xl border border-green-100 w-full">
          <CheckCircle size={18} /> Inscrito
        </div>
      );
    }

    if (isFull) {
      return (
        <div className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 border border-red-100 cursor-not-allowed opacity-90">
          <AlertTriangle size={18} /> Limite de candidatos atingido
        </div>
      );
    }

    if (isProfileComplete && hasRequiredDocuments && user.documentStatus === DocumentStatus.APPROVED) {
      return (
        <button 
          onClick={() => {
            if (!canApply(job)) return;
            onApply(job.id, candidateProfile.cvUrl || candidateProfile.cvName || 'cv-pendente');
          }}
          className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-100"
        >
          Candidatar-se <Upload size={18} />
        </button>
      );
    }

    return (
      <button
        type="button"
        disabled
        className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-bold flex items-center justify-center gap-2 border border-gray-200 cursor-not-allowed"
      >
        <UserIcon size={18} /> {disabledLabel}
      </button>
    );
  };

  const isJobDeadlinePassed = (job: Job) => !!job.deadline && new Date(`${job.deadline}T23:59:59`).getTime() < Date.now();

  const formatJobAvailabilityMessage = (job: Job) => {
    if (job.status !== 'OPEN') {
      return 'Esta vaga já não está disponível para novas candidaturas.';
    }

    if (isJobDeadlinePassed(job)) {
      return `Inscrições encerradas em ${new Date(job.deadline).toLocaleDateString()}.`;
    }

    if ((job.candidateLimit || 0) > 0 && (job.currentCandidates || 0) >= (job.candidateLimit || 0)) {
      return 'Esta vaga já atingiu o limite máximo de candidatos.';
    }

    return null;
  };

  useEffect(() => {
    if (takingTest && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (takingTest && timeLeft === 0) {
      handleCompleteTest();
    }
  }, [takingTest, timeLeft]);

  const handleStartTest = (app: Application) => {
    if (!app.testAvailable) {
      setFeedbackMessage('Teste ainda não disponível. Aguarde a data e hora definidas.');
      return;
    }
    const job = jobs.find(j => j.id === app.jobId);
    const test = tests.find(t => t.id === job?.testId);
    if (test) {
      setTakingTest({ test, appId: app.id });
      const totalSeconds = ((test.timeLimitHours || 0) * 3600) + (test.timeLimitMinutes * 60) + (test.timeLimitSeconds || 0);
      setTimeLeft(totalSeconds);
      setCurrentQuestionIndex(0);
      setAnswers({});
    }
  };

  const handleCompleteTest = () => {
    if (!takingTest) return;
    let score = 0;
    takingTest.test.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        score += q.points;
      }
    });
    
    const maxScore = takingTest.test.questions.reduce((acc, q) => acc + q.points, 0);
    const percentScore = (score / maxScore) * 100;
    
    onFinishTest(takingTest.appId, percentScore);
    setTakingTest(null);
  };

  const getJobStatusBadge = (status: ApplicationStatus) => {
    const config: Record<string, { label: string; class: string }> = {
      [ApplicationStatus.PENDING_CV]: { label: 'Candidatura Recebida', class: 'bg-blue-100 text-blue-800' },
      [ApplicationStatus.PENDING_TEST]: { label: 'Aguardando Teste', class: 'bg-amber-100 text-amber-800' },
      [ApplicationStatus.TEST_IN_PROGRESS]: { label: 'Teste em Curso', class: 'bg-orange-100 text-orange-800' },
      [ApplicationStatus.PENDING_REVIEW]: { label: 'Em Avaliação', class: 'bg-purple-100 text-purple-800' },
      [ApplicationStatus.APPROVED_FOR_INTERVIEW]: { label: 'Entrevista Agendada', class: 'bg-green-100 text-green-800' },
      [ApplicationStatus.REJECTED]: { label: 'Não Selecionado', class: 'bg-red-100 text-red-800' },
      [ApplicationStatus.HIRED]: { label: 'Contratado!', class: 'bg-emerald-100 text-emerald-800' },
    };
    const c = config[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.class}`}>{c.label}</span>;
  };

  const StatusTracker = ({ status }: { status: ApplicationStatus }) => {
    const steps = [
      { id: 'applied', label: 'Inscrição', statuses: [ApplicationStatus.PENDING_CV, ApplicationStatus.PENDING_TEST, ApplicationStatus.TEST_IN_PROGRESS, ApplicationStatus.PENDING_REVIEW, ApplicationStatus.APPROVED_FOR_INTERVIEW] },
      { id: 'test', label: 'Avaliação', statuses: [ApplicationStatus.PENDING_TEST, ApplicationStatus.TEST_IN_PROGRESS, ApplicationStatus.PENDING_REVIEW, ApplicationStatus.APPROVED_FOR_INTERVIEW] },
      { id: 'review', label: 'Revisão', statuses: [ApplicationStatus.PENDING_REVIEW, ApplicationStatus.APPROVED_FOR_INTERVIEW] },
      { id: 'interview', label: 'Entrevista', statuses: [ApplicationStatus.APPROVED_FOR_INTERVIEW] },
    ];

    const getStepStatus = (stepStatuses: ApplicationStatus[]) => {
      if (status === ApplicationStatus.REJECTED) return 'rejected';
      if (stepStatuses.includes(status)) {
        // If it's the current active step
        const isCurrent = stepStatuses[0] === status || (status === ApplicationStatus.TEST_IN_PROGRESS && stepStatuses[0] === ApplicationStatus.PENDING_TEST);
        return isCurrent ? 'active' : 'completed';
      }
      return 'pending';
    };

    return (
      <div className="mt-6 pt-6 border-t border-gray-50">
        <div className="flex justify-between items-start">
          {steps.map((step, index) => {
            const stepStatus = getStepStatus(step.statuses);
            return (
              <div key={step.id} className="flex flex-col items-center flex-1 relative">
                {/* Line */}
                {index < steps.length - 1 && (
                  <div className={`absolute top-4 left-1/2 w-full h-0.5 ${
                    getStepStatus(steps[index + 1].statuses) !== 'pending' ? 'bg-green-500' : 'bg-gray-100'
                  }`} />
                )}
                
                {/* Circle */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                  stepStatus === 'completed' ? 'bg-green-600 text-white' :
                  stepStatus === 'active' ? 'bg-white border-4 border-green-600 text-green-600 animate-pulse' :
                  stepStatus === 'rejected' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {stepStatus === 'completed' ? <CheckCircle size={16} /> : 
                   stepStatus === 'rejected' ? <XCircle size={16} /> :
                   <span className="text-[10px] font-bold">{index + 1}</span>}
                </div>
                
                {/* Label */}
                <span className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
                  stepStatus === 'active' ? 'text-green-700' : 
                  stepStatus === 'completed' ? 'text-gray-900' : 
                  'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (takingTest) {
    const currentQuestion = takingTest.test.questions[currentQuestionIndex];
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-green-100">
          <div className="bg-green-700 p-6 flex justify-between items-center text-white">
            <div>
              <h2 className="text-xl font-bold">{takingTest.test.title}</h2>
              <p className="text-xs text-green-200 mt-1 uppercase tracking-widest font-bold">Sistema Americano V/F</p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xl bg-black/20 px-4 py-2 rounded-2xl border border-white/10">
              <Clock size={20} className="text-green-300" />
              {Math.floor(timeLeft / 3600).toString().padStart(2, '0')}:
              {Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0')}:
              {(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
          
          <div className="p-10">
            <div className="mb-8 flex gap-2">
              {takingTest.test.questions.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= currentQuestionIndex ? 'bg-green-600' : 'bg-gray-100'}`} />
              ))}
            </div>

            <div className="mb-10 text-center sm:text-left">
              <span className="inline-block px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold mb-4">
                Questão {currentQuestionIndex + 1} de {takingTest.test.questions.length}
              </span>
              <h3 className="text-2xl font-bold text-gray-900 leading-tight">{currentQuestion.text}</h3>
              <p className="text-gray-400 text-sm mt-3 flex items-center gap-1">
                <AlertTriangle size={14} className="text-amber-500" /> Julgue a afirmação acima como verdadeira ou falsa.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: 'TRUE' }))}
                className={`flex flex-col items-center justify-center p-8 rounded-3xl border-4 transition-all group ${
                  answers[currentQuestion.id] === 'TRUE' 
                    ? 'border-green-600 bg-green-50 shadow-xl shadow-green-100' 
                    : 'border-gray-100 hover:border-green-200 hover:bg-green-50/10'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                  answers[currentQuestion.id] === 'TRUE' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-green-100 group-hover:text-green-600'
                }`}>
                  <CheckCircle size={32} />
                </div>
                <span className={`text-xl font-black uppercase tracking-widest ${
                  answers[currentQuestion.id] === 'TRUE' ? 'text-green-700' : 'text-gray-400'
                }`}>Verdadeiro</span>
              </button>

              <button
                onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: 'FALSE' }))}
                className={`flex flex-col items-center justify-center p-8 rounded-3xl border-4 transition-all group ${
                  answers[currentQuestion.id] === 'FALSE' 
                    ? 'border-red-600 bg-red-50 shadow-xl shadow-red-100' 
                    : 'border-gray-100 hover:border-red-200 hover:bg-red-50/10'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                  answers[currentQuestion.id] === 'FALSE' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-red-100 group-hover:text-red-600'
                }`}>
                  <XCircle size={32} />
                </div>
                <span className={`text-xl font-black uppercase tracking-widest ${
                  answers[currentQuestion.id] === 'FALSE' ? 'text-red-700' : 'text-gray-400'
                }`}>Falso</span>
              </button>
            </div>

            <div className="mt-16 flex justify-between items-center">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="px-6 py-2 text-gray-400 font-bold hover:text-gray-600 disabled:opacity-30 transition-colors"
              >
                ← Voltar
              </button>
              
              <div className="flex gap-4">
                {currentQuestionIndex < takingTest.test.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="px-10 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center gap-2"
                  >
                    Próxima Questão
                  </button>
                ) : (
                  <button
                    onClick={handleCompleteTest}
                    className="px-10 py-4 bg-green-800 text-white rounded-2xl font-bold hover:bg-green-900 transition-all shadow-lg shadow-green-200 flex items-center gap-2"
                  >
                    Finalizar Avaliação <Send size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex gap-8 border-b border-gray-100 mb-8">
        {[
          { id: 'jobs', label: 'Vagas Disponíveis' },
          { id: 'applications', label: 'Minhas Candidaturas' },
          { id: 'messages', label: 'Mensagens' },
          { id: 'profile', label: 'Meu Perfil' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 text-sm font-bold transition-colors border-b-2 ${activeTab === tab.id ? 'border-green-500 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
          >
            {tab.label}
            {tab.id === 'messages' && messages.some(m => !m.read) && (
              <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block" />
            )}
          </button>
        ))}
      </div>

      {feedbackMessage && (
        <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {feedbackMessage}
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {fileError && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700">
              <AlertTriangle size={20} />
              <p className="text-sm font-bold">{fileError}</p>
              <button onClick={() => setFileError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <X size={18} />
              </button>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white p-6 rounded-[2rem] border border-green-50 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar por cargo ou descrição..." 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-green-600 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select 
                  className="pl-12 pr-10 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-green-600 transition-all text-sm appearance-none cursor-pointer font-medium"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="ALL">Todos os Departamentos</option>
                  {Array.from(new Set(jobs.map(j => j.department))).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Vagas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs
              .filter(j => j.status === 'OPEN')
              .filter(j => departmentFilter === 'ALL' || j.department === departmentFilter)
              .filter(j => 
                j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                j.description.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(job => {
                return (
                  <div key={job.id} className="bg-white p-6 rounded-3xl shadow-sm border border-green-50 flex flex-col justify-between hover:shadow-md transition-shadow group">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-lg uppercase tracking-widest">{job.department}</span>
                        <span className="text-[10px] text-gray-300 font-bold uppercase">{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">{job.title}</h3>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-3 leading-relaxed">{job.description}</p>
                    </div>
                    <div className="space-y-3">
                      <button 
                        onClick={() => setSelectedJob(job)}
                        className="w-full py-3 text-sm font-bold text-green-700 hover:bg-green-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        Ver Detalhes <ChevronRight size={16} />
                      </button>
                      {getApplyButton(job)}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Empty State */}
          {jobs.filter(j => j.status === 'OPEN').filter(j => departmentFilter === 'ALL' || j.department === departmentFilter).filter(j => j.title.toLowerCase().includes(searchTerm.toLowerCase()) || j.description.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Search className="text-gray-300" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma vaga encontrada</h3>
              <p className="text-gray-500">Tente ajustar os seus filtros ou termo de pesquisa.</p>
              <button 
                onClick={() => {setSearchTerm(''); setDepartmentFilter('ALL');}}
                className="mt-6 text-green-700 font-black uppercase text-xs tracking-widest hover:underline"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalhes da Vaga */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedJob(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
              <div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-lg uppercase tracking-widest mb-3 inline-block">
                  {selectedJob.department}
                </span>
                <h2 className="text-3xl font-bold text-gray-900">{selectedJob.title}</h2>
              </div>
              <button 
                onClick={() => setSelectedJob(null)}
                className="p-2 bg-white text-gray-400 hover:text-gray-600 rounded-xl shadow-sm transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-100">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-green-800 uppercase tracking-widest">Publicada em</p>
                    <p className="text-sm font-bold text-green-900">{new Date(selectedJob.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Prazo Limite</p>
                    <p className="text-sm font-bold text-amber-900">{new Date(selectedJob.deadline).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Limite da Vaga</p>
                    <p className="text-sm font-bold text-blue-900">{selectedJob.candidateLimit || 1} candidatos</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">Teste Previsto</p>
                    <p className="text-sm font-bold text-indigo-900">
                      {selectedJob.testDate ? `${selectedJob.testDate} ${selectedJob.testTime || ''}` : 'A definir'}
                    </p>
                  </div>
                </div>
              </div>

              {formatJobAvailabilityMessage(selectedJob) && (
                <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                  {formatJobAvailabilityMessage(selectedJob)}
                </div>
              )}

              <div className="space-y-8">
                <section>
                  <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                    <Info size={20} className="text-green-600" /> Descrição da Função
                  </h4>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {selectedJob.description}
                  </p>
                </section>

                <section>
                  <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                    <List size={20} className="text-green-600" /> Requisitos e Qualificações
                  </h4>
                  <ul className="space-y-3">
                    {selectedJob.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-600">
                        <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle size={12} />
                        </div>
                        <span className="text-sm font-medium">{req}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>

            <div className="p-8 border-t border-gray-50 bg-gray-50/50">
              {getApplyButton(selectedJob)}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {candidateApplications.length === 0 ? (
            <div className="text-center py-24 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Info className="text-gray-300" size={32} />
              </div>
              <p className="text-gray-500 font-medium">Você ainda não iniciou nenhuma jornada de recrutamento.</p>
              <button onClick={() => setActiveTab('jobs')} className="text-green-600 font-black mt-4 hover:underline uppercase text-xs tracking-widest">Ver Vagas Disponíveis</button>
            </div>
          ) : (
            candidateApplications.map(app => {
              const job = jobs.find(j => j.id === app.jobId);
              return (
                <div key={app.id} className="bg-white p-6 rounded-3xl shadow-sm border border-green-50 flex flex-col gap-6 hover:border-green-200 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex gap-5 items-center">
                      <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
                        <Briefcase size={28} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{job?.title}</h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-gray-400 font-medium">Aplicado em: {new Date(app.appliedAt).toLocaleDateString()}</span>
                          {getJobStatusBadge(app.status)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {app.status === ApplicationStatus.PENDING_CV && (
                        app.workflowStatus === 'DOCUMENTOS_REJEITADOS' ? (
                          <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                            <AlertTriangle size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Documentos rejeitados para esta vaga</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                            <Clock size={16} className="animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              {app.workflowStatus === 'DOCUMENTOS_APROVADOS' ? 'Documentos validados. Aguarde o teste.' : 'Aguardando validação dos documentos'}
                            </span>
                          </div>
                        )
                      )}
                      {app.status === ApplicationStatus.PENDING_TEST && (
                        app.testAvailable ? (
                          <button 
                            onClick={() => handleStartTest(app)}
                            className="px-8 py-3 bg-green-700 text-white rounded-2xl font-bold hover:bg-green-800 transition-all shadow-lg shadow-green-100 flex items-center gap-2"
                          >
                            Iniciar Teste V/F <Send size={16} />
                          </button>
                        ) : (
                          <div className="bg-amber-50 px-5 py-3 rounded-2xl border border-amber-100">
                            <p className="text-[10px] font-black text-amber-800 uppercase mb-1 tracking-widest">Teste disponível em</p>
                            <p className="text-sm text-amber-700 font-bold">
                              {app.testScheduledAt ? formatDateTime(app.testScheduledAt) : 'Aguarde a agenda do gestor'}
                            </p>
                          </div>
                        )
                      )}
                      {app.status === ApplicationStatus.APPROVED_FOR_INTERVIEW && (
                        <div className="bg-green-50 px-5 py-3 rounded-2xl border border-green-100">
                          <p className="text-[10px] font-black text-green-800 uppercase mb-1 tracking-widest">Entrevista Agendada</p>
                          <p className="text-sm text-green-700 flex items-center gap-2 font-bold">
                            <CalendarCheck size={14} /> {formatDateTime(app.interviewDate)}
                          </p>
                        </div>
                      )}
                      {app.status === ApplicationStatus.REJECTED && app.workflowStatus === 'TESTE_EXPIRADO' && (
                        <div className="bg-red-50 px-5 py-3 rounded-2xl border border-red-100">
                          <p className="text-[10px] font-black text-red-800 uppercase mb-1 tracking-widest">Prazo do teste expirado</p>
                          <p className="text-sm text-red-700 font-bold">
                            Já não poderá realizar este teste porque a data e a hora definidas já passaram.
                          </p>
                        </div>
                      )}
                      <button className="p-3 text-gray-300 hover:text-green-600 transition-colors">
                        <Info size={24} />
                      </button>
                    </div>
                  </div>

                  <StatusTracker status={app.status} />
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="lg:col-span-1 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
              <MessageSquare className="text-green-700" size={20} />
              <h3 className="font-bold text-gray-900">Caixa de Entrada</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="p-12 text-center text-gray-400">Nenhuma mensagem.</div>
              ) : (
                messages.map(msg => (
                  <button
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      onMarkMessageRead(msg.id);
                    }}
                    className={`w-full text-left p-6 border-b border-gray-50 transition-colors hover:bg-green-50/30 flex items-start gap-4 ${selectedMessage?.id === msg.id ? 'bg-green-50' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${msg.read ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-600'}`}>
                      <Mail size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm truncate ${msg.read ? 'text-gray-600' : 'font-bold text-gray-900'}`}>{msg.senderName}</h4>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{new Date(msg.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className={`text-xs truncate ${msg.read ? 'text-gray-400' : 'text-gray-600 font-medium'}`}>{msg.subject}</p>
                    </div>
                    {!msg.read && <div className="w-2 h-2 bg-green-600 rounded-full mt-2" />}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
            {selectedMessage ? (
              <div className="flex flex-col h-full animate-in fade-in duration-300">
                <div className="p-8 border-b border-gray-50">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedMessage.subject}</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-bold text-green-700">{selectedMessage.senderName}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-400">{new Date(selectedMessage.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                      <Mail size={24} />
                    </div>
                  </div>
                </div>
                <div className="p-8 flex-1 overflow-y-auto text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.content}
                </div>
                <div className="p-8 border-t border-gray-50 bg-gray-50/30">
                  <div className="flex flex-col gap-4">
                    <textarea 
                      placeholder="Escreve a tua resposta aqui..."
                      className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-green-600 outline-none transition-all resize-none"
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={() => {
                          if (replyText.trim() && onSendMessage) {
                            onSendMessage(selectedMessage.senderId, replyText);
                            setReplyText('');
                            setFeedbackMessage('Mensagem enviada com sucesso.');
                          }
                        }}
                        disabled={!replyText.trim()}
                        className="px-8 py-3 bg-green-700 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-green-800 transition-all shadow-lg shadow-green-100 disabled:opacity-50"
                      >
                        Enviar Resposta <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 text-gray-200">
                  <MessageSquare size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Selecione uma mensagem</h3>
                <p className="text-gray-400 max-w-xs">Escolha uma mensagem da lista ao lado para ler o conteúdo completo.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Perfil Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] border border-green-100 overflow-hidden shadow-sm">
              <div className="h-24 bg-green-700" />
              <div className="px-6 pb-8 -mt-12 text-center">
                <div className="relative inline-block mx-auto">
                  <div className="w-24 h-24 rounded-3xl border-4 border-white overflow-hidden shadow-lg bg-green-600 text-white flex items-center justify-center text-4xl font-bold">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      candidateProfile.name.charAt(0)
                    )}
                  </div>
                  <button 
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2.5 bg-green-700 text-white rounded-xl shadow-lg border-2 border-white hover:scale-110 transition-transform"
                  >
                    <Camera size={16} />
                  </button>
                  <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" />
                </div>
                
                <h3 className="mt-4 text-xl font-bold text-gray-900">{candidateProfile.name}</h3>
                <p className="text-gray-500 text-sm">{candidateProfile.email}</p>
                
                <div className="mt-6 space-y-3">
                   <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                      <MapPin size={16} className="text-green-600" />
                      <span className="text-black font-medium">{candidateProfile.location}</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                      <Linkedin size={16} className="text-green-600" />
                      <span className="truncate text-black font-medium">{candidateProfile.linkedin}</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-green-100 p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-bold flex items-center gap-2 text-green-700">
                  <FileText size={20} /> Documentação (PDF)
                </h4>
                {user.documentStatus && (
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                    user.documentStatus === DocumentStatus.APPROVED ? 'bg-green-100 text-green-700' :
                    user.documentStatus === DocumentStatus.REJECTED ? 'bg-red-100 text-red-700' :
                    user.documentStatus === DocumentStatus.SUBMITTED ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {user.documentStatus === DocumentStatus.APPROVED ? 'Aprovado' :
                     user.documentStatus === DocumentStatus.REJECTED ? 'Rejeitado' :
                     user.documentStatus === DocumentStatus.SUBMITTED ? 'Em Análise' :
                     'Pendente'}
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Currículo */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Currículo Vitae</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold truncate text-gray-700">{candidateProfile.cvName || 'Não inserido'}</span>
                    {canUpload && (
                      <button 
                        onClick={() => cvInputRef.current?.click()}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <Upload size={14} />
                      </button>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={cvInputRef} 
                    className="hidden" 
                    accept=".pdf" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type !== 'application/pdf') {
                          setFileError('Apenas documentos em formato PDF são permitidos.');
                          return;
                        }
                        setFileError(null);
                        const cvUrl = await readFileAsDataUrl(file);
                        setCandidateProfile(prev => ({ ...prev, cvName: file.name, cvUrl }));
                      }
                    }}
                  />
                </div>

                {/* Bilhete de Identidade */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Bilhete de Identidade (BI)</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold truncate text-gray-700">{candidateProfile.biName || 'Não inserido'}</span>
                    {canUpload && (
                      <button 
                        onClick={() => biInputRef.current?.click()}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <Upload size={14} />
                      </button>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={biInputRef} 
                    className="hidden" 
                    accept=".pdf" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type !== 'application/pdf') {
                          setFileError('Apenas documentos em formato PDF são permitidos.');
                          return;
                        }
                        setFileError(null);
                        const biUrl = await readFileAsDataUrl(file);
                        setCandidateProfile(prev => ({ ...prev, biName: file.name, biUrl }));
                      }
                    }}
                  />
                </div>

                {/* Certificado ou Diploma */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Certificado ou Diploma</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold truncate text-gray-700">{candidateProfile.diplomaName || 'Não inserido'}</span>
                    {canUpload && (
                      <button 
                        onClick={() => diplomaInputRef.current?.click()}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <Upload size={14} />
                      </button>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={diplomaInputRef} 
                    className="hidden" 
                    accept=".pdf" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type !== 'application/pdf') {
                          setFileError('Apenas documentos em formato PDF são permitidos.');
                          return;
                        }
                        setFileError(null);
                        const diplomaUrl = await readFileAsDataUrl(file);
                        setCandidateProfile(prev => ({ ...prev, diplomaName: file.name, diplomaUrl }));
                      }
                    }}
                  />
                </div>

                {canUpload && candidateProfile.cvName && candidateProfile.biName && candidateProfile.diplomaName && (
                  <button
                    onClick={() => {
                      if (onSubmitDocuments) {
                        onSubmitDocuments({
                          cvName: candidateProfile.cvName,
                          cvUrl: candidateProfile.cvUrl,
                          biName: candidateProfile.biName,
                          biUrl: candidateProfile.biUrl,
                          diplomaName: candidateProfile.diplomaName,
                          diplomaUrl: candidateProfile.diplomaUrl
                        });
                      }
                    }}
                    className="w-full py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2 mt-4"
                  >
                    Submeter Documentos <Send size={16} />
                  </button>
                )}

                {isPendingApproval && (
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                    <Clock size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Documentos submetidos com sucesso. Aguarde a validação por parte de um gestor. Enquanto estiverem em análise, não poderá fazer alterações.
                    </p>
                  </div>
                )}

                {isApproved && (
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-start gap-3">
                    <CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-green-700 leading-relaxed">
                      Documentação aprovada! O seu perfil está completo e validado.
                    </p>
                  </div>
                )}

                {user.documentStatus === DocumentStatus.REJECTED && (
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 leading-relaxed">
                      A sua documentação foi rejeitada. Por favor, verifique os ficheiros e submeta novamente documentos válidos.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dados do Perfil */}
          <div className="lg:col-span-2 space-y-6">
            {fileError && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={20} />
                <p className="text-sm font-bold">{fileError}</p>
                <button onClick={() => setFileError(null)} className="ml-auto text-red-400 hover:text-red-600">
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <UserIcon className="text-green-700" size={20} />
                  <h3 className="font-bold text-gray-900">Dados do Candidato</h3>
                </div>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-green-700 hover:underline">Editar Dados</button>
                ) : (
                  <button onClick={() => setIsEditing(false)} className="text-sm font-bold text-gray-400">Cancelar</button>
                )}
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                     <label className="text-xs font-black text-black uppercase tracking-widest">Nome Completo</label>
                     <input 
                       disabled={!isEditing}
                       type="text" 
                       value={candidateProfile.name}
                       onChange={e => setCandidateProfile({...candidateProfile, name: e.target.value})}
                       className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-black disabled:opacity-80"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-black text-black uppercase tracking-widest">Email</label>
                     <input 
                       disabled={true}
                       type="email" 
                       value={candidateProfile.email}
                       className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none font-medium text-gray-400 cursor-not-allowed"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-black text-black uppercase tracking-widest">Data de Nascimento</label>
                     <input 
                       disabled={!isEditing}
                       type="date" 
                       value={candidateProfile.birthDate}
                       onChange={e => setCandidateProfile({...candidateProfile, birthDate: e.target.value})}
                       className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-black disabled:opacity-80"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-black text-black uppercase tracking-widest">Género</label>
                     <select 
                       disabled={!isEditing}
                       value={candidateProfile.gender}
                       onChange={e => setCandidateProfile({...candidateProfile, gender: e.target.value})}
                       className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-black disabled:opacity-80"
                     >
                       <option value="">Selecionar...</option>
                       <option value="Masculino">Masculino</option>
                       <option value="Feminino">Feminino</option>
                       <option value="Outro">Outro</option>
                     </select>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-black text-black uppercase tracking-widest">Telefone</label>
                     <input 
                       disabled={!isEditing}
                       type="text" 
                       value={candidateProfile.phone}
                       onChange={e => setCandidateProfile({...candidateProfile, phone: e.target.value})}
                       className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-black disabled:opacity-80"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-black text-black uppercase tracking-widest">Localidade / Endereço</label>
                     <div className="relative">
                       <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                       <input 
                         disabled={!isEditing}
                         type="text" 
                         value={candidateProfile.location}
                         onChange={e => setCandidateProfile({...candidateProfile, location: e.target.value})}
                         className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-black disabled:opacity-80"
                       />
                     </div>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-black text-black uppercase tracking-widest">Habilitações Literárias</label>
                     <div className="relative">
                       <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                       <input 
                         disabled={!isEditing}
                         type="text" 
                         value={candidateProfile.education}
                         onChange={e => setCandidateProfile({...candidateProfile, education: e.target.value})}
                         className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-black disabled:opacity-80"
                       />
                     </div>
                   </div>
                 </div>

                <div className="space-y-1.5">
                   <label className="text-xs font-black text-black uppercase tracking-widest">Experiência Profissional</label>
                   <textarea 
                     disabled={!isEditing}
                     rows={4}
                     value={candidateProfile.experience}
                     onChange={e => setCandidateProfile({...candidateProfile, experience: e.target.value})}
                     placeholder="Descreva brevemente a sua experiência profissional..."
                     className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-black disabled:opacity-80 resize-none"
                   />
                </div>

                {isEditing && (
                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={handleSaveProfile}
                      className="px-10 py-3 bg-green-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-100 hover:bg-green-800 transition-all"
                    >
                      <Save size={18} /> Salvar Perfil
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 flex gap-4">
               <div className="p-3 bg-white rounded-2xl text-amber-600 shadow-sm shrink-0 h-fit">
                 <AlertTriangle size={20} />
               </div>
               <div>
                 <h4 className="font-bold text-amber-900 text-sm">Dica de Sucesso</h4>
                 <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                   Mantenha o seu perfil atualizado. Candidatos com informações completas e currículos recentes têm uma taxa de resposta 40% superior. 
                   Não se esqueça de verificar o seu e-mail regularmente para notificações de entrevistas.
                 </p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidatePortal;
