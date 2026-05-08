import React, { useEffect, useState } from 'react';
import { User, UserRole, Job, OnlineTest, Application, ApplicationStatus, SystemConfig, Notification, Message, DocumentStatus, AuditLog, ManagerRestrictions } from './types';
import { api, AppState } from './apiClient';
import Sidebar from './components/Sidebar';
import CandidateNavbar from './components/CandidateNavbar';
import NotificationPanel from './components/NotificationPanel';
import LandingPage from './views/LandingPage';
import ManagerDashboard from './views/ManagerDashboard';
import AdminDashboard from './views/AdminDashboard';
import ManagerJobs from './views/ManagerJobs';
import ManagerCandidates from './views/ManagerCandidates';
import ManagerTests from './views/ManagerTests';
import TestReview from './views/TestReview';
import ManagerInterviews from './views/ManagerInterviews';
import AdminSettings from './views/AdminSettings';
import AdminSystemSettings from './views/AdminSystemSettings';
import CandidatePortal from './views/CandidatePortal';
import StaffProfile from './views/StaffProfile';
import AuthPage from './views/AuthPage';
import ManagerCommunication from './views/ManagerCommunication';
import ManagerReports from './views/ManagerReports';
import AdminAuditLogs from './views/AdminAuditLogs';
import { Menu, Search, Bell } from 'lucide-react';

const defaultSystemConfig: SystemConfig = {
  companyName: 'Darcan',
  allowNewRegistrations: true,
  auditLogsEnabled: true,
  notificationEmail: 'rh@darcan.com',
  enableNotifications: true,
  heroImages: [
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800&h=600',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800&h=600',
    'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800&h=600'
  ],
  logoUrl: 'https://picsum.photos/seed/school-logo/100/100',
  aboutUs: 'A Darcan é uma instituição de ensino comprometida com a excelência académica e o desenvolvimento profissional.',
  contactPhone: '+244 923 000 000',
  contactWhatsapp: '+244 923 000 000',
  socialFacebook: 'facebook.com/darcan',
  socialInstagram: 'instagram.com/darcan',
  overviewTitle: 'Visão Geral',
  overviewSubtitle: 'Informações principais da plataforma'
};

const STORAGE_KEYS = {
  userId: 'darcan:userId',
  userRole: 'darcan:userRole',
  activeView: 'darcan:activeView',
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | 'NONE'>('NONE');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tests, setTests] = useState<OnlineTest[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [candidates, setCandidates] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(defaultSystemConfig);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const persistSession = (nextUser: User | null, nextView?: string) => {
    if (typeof window === 'undefined') return;

    if (nextUser) {
      window.localStorage.setItem(STORAGE_KEYS.userId, nextUser.id);
      window.localStorage.setItem(STORAGE_KEYS.userRole, nextUser.role);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.userId);
      window.localStorage.removeItem(STORAGE_KEYS.userRole);
      window.localStorage.removeItem(STORAGE_KEYS.activeView);
    }

    if (nextView) {
      window.localStorage.setItem(STORAGE_KEYS.activeView, nextView);
    }
  };

  const applyRemoteState = (state: AppState, preferredUserId?: string | null) => {
    setAdminUser(state.adminUser);
    setCandidates(state.candidates);
    setManagers(state.managers);
    setJobs(state.jobs);
    setTests(state.tests);
    setApplications(state.applications);
    setAuditLogs(state.auditLogs);
    setNotifications(state.notifications);
    setMessages(state.messages);
    setSystemConfig(state.systemConfig || defaultSystemConfig);

    if (preferredUserId !== undefined) {
      const storedUserId = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.userId) : null;
      if (preferredUserId !== null && storedUserId !== preferredUserId) {
        return;
      }
      const matched = state.users.find((candidateUser) => candidateUser.id === preferredUserId) || null;
      setUser(matched);
      if (!matched) {
        persistSession(null);
      }
    }
  };

  const syncState = async (promise: Promise<AppState>, preferredUserId?: string | null) => {
    const state = await promise;
    applyRemoteState(state, preferredUserId);
    setApiError(null);
    return state;
  };

  useEffect(() => {
    if (!flashMessage) return undefined;
    const timeoutId = window.setTimeout(() => setFlashMessage(null), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [flashMessage]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFlashMessage({ type, text });
  };

  const normalizeDateTime = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    const fallback = new Date(value.includes('T') && value.length === 16 ? `${value}:00` : value);
    return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString();
  };

  const formatDateTime = (value?: string | null) => {
    const normalized = normalizeDateTime(value);
    return normalized ? new Date(normalized).toLocaleString() : 'Data a confirmar';
  };

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoadingData(true);
        const storedUserId = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.userId) : null;
        const storedActiveView = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.activeView) : null;
        if (!storedUserId) {
          const bootstrap = await api.getBootstrap();
          setSystemConfig(bootstrap.systemConfig || defaultSystemConfig);
          setApiError(null);
          return;
        }

        const state = await syncState(api.getState(), storedUserId);

        if (storedUserId) {
          const restoredUser = state.users.find((existingUser) => existingUser.id === storedUserId) || null;
          if (restoredUser) {
            setUser(restoredUser);
            setAuthMode('NONE');
            if (storedActiveView) {
              setActiveView(storedActiveView);
            } else {
              setActiveView(restoredUser.role === UserRole.CANDIDATE ? 'jobs' : 'dashboard');
            }
          }
        }
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Falha ao carregar os dados da plataforma.');
      } finally {
        setIsLoadingData(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void syncState(api.getState(), user.id).catch(() => undefined);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [user?.id]);

  const notificationVisibleToCurrentUser = (notification: Notification) => {
    if (!user) return false;
    if (notification.targetUserId) {
      return notification.targetUserId === user.id;
    }
    if (user.role === UserRole.CANDIDATE) {
      return notification.type === 'NEW_JOB' || notification.senderRole === UserRole.ADMIN || notification.senderRole === UserRole.MANAGER;
    }
    if (user.role === UserRole.MANAGER) {
      return notification.senderRole === UserRole.CANDIDATE || notification.senderRole === UserRole.ADMIN;
    }
    if (user.role === UserRole.ADMIN) {
      return notification.senderRole !== UserRole.ADMIN;
    }
    return true;
  };

  const filteredNotifications = notifications.filter(notificationVisibleToCurrentUser);
  const unreadCount = filteredNotifications.filter((notification) => !notification.read).length;

  const toggleNotifications = async () => {
    const nextShow = !showNotifications;
    if (nextShow && user?.id && unreadCount > 0) {
      await syncState(api.markAllNotificationsRead(user.id), user.id);
    }
    setShowNotifications(nextShow);
  };

  const filteredMessages = messages.filter((message) => {
    if (!user) return false;
    if (user.role === UserRole.CANDIDATE) {
      return (message.senderId === user.id && message.receiverRole === UserRole.MANAGER) ||
             (message.receiverId === user.id && message.senderRole === UserRole.MANAGER);
    }
    if (user.role === UserRole.MANAGER) {
      return (message.senderId === user.id && (message.receiverRole === UserRole.CANDIDATE || message.receiverRole === UserRole.ADMIN)) ||
             (message.receiverId === user.id && (message.senderRole === UserRole.CANDIDATE || message.senderRole === UserRole.ADMIN));
    }
    if (user.role === UserRole.ADMIN) {
      return (message.senderId === user.id && message.receiverRole === UserRole.MANAGER) ||
             (message.receiverId === user.id && message.senderRole === UserRole.MANAGER);
    }
    return true;
  });

  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    await syncState(
      api.createNotification({
        ...notification,
        senderRole: notification.senderRole || user?.role
      }),
      user?.id
    );
  };

  const notifyUser = async (targetUserId: string, title: string, message: string, type: Notification['type'] = 'INFO') => {
    await addNotification({
      type,
      title,
      message,
      targetUserId,
      senderRole: user?.role
    });
  };

  const notifyAdministrators = async (title: string, message: string, type: Notification['type'] = 'INFO') => {
    if (!adminUser?.id) return;
    await notifyUser(adminUser.id, title, message, type);
  };

  const addMessage = async (message: Omit<Message, 'id' | 'timestamp' | 'read'>) => {
    await syncState(
      api.sendMessage({
        ...message,
        senderId: message.senderId || user?.id || 'system',
        senderRole: message.senderRole || user?.role || UserRole.MANAGER
      }),
      user?.id
    );

    if (message.receiverId) {
      await addNotification({
        type: 'INFO',
        title: 'Nova mensagem',
        message: `${message.senderName} enviou-lhe uma nova mensagem.`,
        targetUserId: message.receiverId,
        senderRole: message.senderRole || user?.role || UserRole.MANAGER
      });
    }
  };

  const handleAuth = async ({ mode, role, name, email, password }: { mode: 'LOGIN' | 'REGISTER'; role: UserRole; name: string; email: string; password: string }) => {
    try {
      const state = await syncState(
        mode === 'REGISTER'
          ? api.register({ name, email, password, role })
          : api.login({ email, password })
      );

      const normalizedEmail = email.trim().toLowerCase();
      const loggedUser = state.users.find((existingUser) => existingUser.email.toLowerCase() === normalizedEmail) || null;
      setUser(loggedUser);
      const nextView = (loggedUser?.role || role) === UserRole.CANDIDATE ? 'jobs' : 'dashboard';
      setActiveView(nextView);
      persistSession(loggedUser, nextView);
      setAuthMode('NONE');
      setApiError(null);
      showFeedback('success', mode === 'LOGIN' ? 'Sessão iniciada com sucesso.' : 'Conta criada com sucesso.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha na autenticação.';
      setApiError(message);
      showFeedback('error', message);
    }
  };

  const handleLogout = () => {
    if (user) {
      void api.logout(user.id).catch(() => undefined);
    }
    setUser(null);
    setAuthMode('NONE');
    setActiveView('landing');
    setIsSidebarOpen(false);
    setShowNotifications(false);
    setSelectedNotification(null);
    setApiError(null);
    persistSession(null);
  };

  useEffect(() => {
    if (!user) return;
    persistSession(user, activeView);
  }, [user, activeView]);

  const handleUpdateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    await syncState(api.updateUserProfile(user.id, updates), user.id);
    if (user.role !== UserRole.ADMIN) {
      await notifyAdministrators('Perfil atualizado', `${user.name} atualizou os dados do perfil.`);
    }
  };

  const applyToJob = async (jobId: string, cvUrl: string) => {
    if (!user) return;
    const job = jobs.find((entry) => entry.id === jobId);
    try {
      await syncState(api.createApplication({
        jobId,
        candidateId: user.id,
        status: ApplicationStatus.PENDING_CV,
        appliedAt: new Date().toISOString(),
        cvUrl
      }), user.id);

      await addNotification({
        type: 'INFO',
        title: 'Candidatura Enviada',
        message: `A sua candidatura para ${job?.title} foi recebida com sucesso.`,
        targetUserId: user.id
      });

      await notifyAdministrators('Nova candidatura', `${user.name} candidatou-se para a vaga ${job?.title || jobId}.`, 'NEW_APPLICATION');

      await addMessage({
        senderName: 'Recrutamento Darcan',
        subject: `Confirmação de Candidatura: ${job?.title}`,
        content: `Olá ${user.name},\n\nConfirmamos a receção da sua candidatura para a vaga de ${job?.title}.\n\nA nossa equipa irá analisar o seu perfil e entraremos em contacto em breve.\n\nAtenciosamente,\nEquipa de Recrutamento`,
        receiverId: user.id,
        receiverRole: UserRole.CANDIDATE
      });
      showFeedback('success', 'Candidatura enviada com sucesso.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível concluir a candidatura.';
      setApiError(message);
      showFeedback('error', message);
    }
  };

  const finishTest = async (appId: string, score: number) => {
    const app = applications.find((application) => application.id === appId);
    const job = jobs.find((entry) => entry.id === app?.jobId);

    await syncState(api.updateApplicationStatus(appId, {
      status: ApplicationStatus.PENDING_REVIEW,
      testScore: score,
      testCompletedAt: new Date().toISOString()
    }), user?.id);

    await addNotification({
      type: 'TEST_COMPLETED',
      title: 'Teste Concluído',
      message: `Candidato ${app?.candidateId} finalizou o teste de ${job?.title} com ${score.toFixed(0)}%`
    });
    await notifyAdministrators('Teste concluído', `${app?.candidateId} concluiu o teste de ${job?.title || job?.id || ''} com ${score.toFixed(0)}%.`, 'TEST_COMPLETED');
  };

  const handleSaveTest = async (test: OnlineTest) => {
    const exists = tests.some((entry) => entry.id === test.id);
    await syncState(api.saveTest(test), user?.id);
    await notifyAdministrators(
      exists ? 'Teste atualizado' : 'Novo teste criado',
      `${user?.name || 'Sistema'} ${exists ? 'atualizou' : 'criou'} o teste "${test.title}".`
    );
  };

  const handleDeleteTest = async (testId: string) => {
    const test = tests.find((entry) => entry.id === testId);
    await syncState(api.deleteTest(testId), user?.id);
    await notifyAdministrators('Teste removido', `${user?.name || 'Sistema'} eliminou o teste "${test?.title || testId}".`);
  };

  const handleSubmitDocuments = async (userId: string, documents: { cvName: string; cvUrl?: string; biName: string; biUrl?: string; diplomaName: string; diplomaUrl?: string }) => {
    try {
      await syncState(api.submitDocuments(userId, documents), userId);
      showFeedback('success', 'Documentos submetidos com sucesso.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível submeter os documentos.';
      setApiError(message);
      showFeedback('error', message);
    }
  };

  const handleUpdateDocumentStatus = async (userId: string, status: DocumentStatus) => {
    try {
      await syncState(api.updateDocumentStatus(userId, status), user?.id);
      await notifyAdministrators('Validação documental', `${user?.name || 'Sistema'} atualizou o estado documental para ${status}.`);
      showFeedback('success', `Estado documental atualizado para ${status}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível atualizar o estado documental.';
      setApiError(message);
      showFeedback('error', message);
    }
  };

  const handleUpdateApplicationDocumentStatus = async (appId: string, status: DocumentStatus) => {
    try {
      await syncState(api.updateApplicationDocumentStatus(appId, status), user?.id);
      showFeedback('success', status === DocumentStatus.APPROVED ? 'Documentos da candidatura aprovados.' : 'Documentos da candidatura rejeitados.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível atualizar os documentos da candidatura.';
      setApiError(message);
      showFeedback('error', message);
    }
  };

  const updateApplicationStatus = async (appId: string, status: ApplicationStatus, interviewDate?: string) => {
    const application = applications.find((item) => item.id === appId);
    const job = jobs.find((item) => item.id === application?.jobId);
    const resolvedInterviewDate = status === ApplicationStatus.APPROVED_FOR_INTERVIEW
      ? (normalizeDateTime(interviewDate) || normalizeDateTime(application?.interviewDate) || new Date(Date.now() + 86400000 * 2).toISOString())
      : application?.interviewDate;

    await syncState(api.updateApplicationStatus(appId, {
      status,
      interviewDate: resolvedInterviewDate || undefined,
      testScore: application?.testScore,
      testCompletedAt: application?.testCompletedAt,
      feedback: application?.feedback,
      interviewLocation: application?.interviewLocation,
      interviewNotes: application?.interviewNotes,
      blockedUntil: application?.blockedUntil,
      evaluation: application?.evaluation
    }), user?.id);

    await notifyAdministrators('Atualização de candidatura', `A candidatura ${application?.id || appId} foi atualizada para ${status}.`);

    if (status === ApplicationStatus.APPROVED_FOR_INTERVIEW && application?.candidateId) {
      await notifyUser(
        application.candidateId,
        'Entrevista Agendada!',
        `A candidatura para ${job?.title} avançou para a fase de entrevista. Data: ${formatDateTime(resolvedInterviewDate)}`,
        'INTERVIEW_SCHEDULED'
      );
      return;
    }

    if (status === ApplicationStatus.APPROVED_FOR_INTERVIEW) {
      if (application?.candidateId) {
        await notifyUser(
          application.candidateId,
          'Entrevista Agendada!',
          `A sua candidatura para ${job?.title} avançou para a fase de entrevista. Data: ${new Date(interviewDate || '').toLocaleString()}`,
          'INTERVIEW_SCHEDULED'
        );
      }
    } else if (status === ApplicationStatus.REJECTED) {
      if (application?.candidateId) {
        await notifyUser(
          application.candidateId,
          'Atualização de Candidatura',
          `Infelizmente a sua candidatura para ${job?.title} não foi selecionada para a próxima fase.`
        );
      }
    } else if (status === ApplicationStatus.HIRED) {
      if (application?.candidateId) {
        await notifyUser(
          application.candidateId,
          'Parabéns! Foi Contratado',
          `Temos o prazer de informar que foi selecionado para a vaga de ${job?.title}. Bem-vindo à equipa!`
        );
      }
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    const application = applications.find((item) => item.id === appId);
    const job = jobs.find((item) => item.id === application?.jobId);
    await syncState(api.deleteApplication(appId), user?.id);
    await notifyAdministrators('Candidatura removida', `${user?.name || 'Sistema'} eliminou a candidatura de ${application?.candidateId || 'candidato'} para ${job?.title || application?.jobId || 'vaga'}.`);
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    const candidate = candidates.find((item) => item.id === candidateId);
    await syncState(api.deleteCandidate(candidateId), user?.id);
    await notifyAdministrators('Candidato removido', `${user?.name || 'Sistema'} eliminou o candidato ${candidate?.name || candidateId} do sistema.`);
  };

  const handleToggleBlockManager = async (id: string) => {
    const manager = managers.find((entry) => entry.id === id);
    await syncState(api.toggleManagerBlock(id, !manager?.isBlocked), user?.id);
    await notifyAdministrators(
      manager?.isBlocked ? 'Gestor desbloqueado' : 'Gestor bloqueado',
      `${user?.name || 'Sistema'} ${manager?.isBlocked ? 'desbloqueou' : 'bloqueou'} o gestor ${manager?.name || id}.`
    );
  };

  const handleSendReport = async (reportContent: string) => {
    if (!user || !adminUser) return;
    await addMessage({
      senderName: user.name,
      receiverId: adminUser.id,
      receiverRole: UserRole.ADMIN,
      subject: 'Relatório Executivo',
      content: reportContent,
    });
    showFeedback('success', 'Relatório enviado ao administrador.');
  };

  const staffUsers = [...managers, ...candidates, ...(adminUser ? [adminUser] : [])];

  if (isLoadingData) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">A carregar dados da plataforma...</div>;
  }

  if (!user && authMode === 'NONE') {
    return (
      <LandingPage
        onLogin={() => setAuthMode('LOGIN')}
        onRegister={() => setAuthMode('REGISTER')}
        onExploreJobs={() => setAuthMode('LOGIN')}
        heroImages={systemConfig.heroImages}
        logoUrl={systemConfig.logoUrl}
        systemConfig={systemConfig}
      />
    );
  }

  if (authMode !== 'NONE') {
    return (
      <AuthPage
        initialMode={authMode === 'REGISTER' ? 'REGISTER' : 'LOGIN'}
        onAuth={handleAuth}
        onBack={() => setAuthMode('NONE')}
        companyName={systemConfig.companyName}
      />
    );
  }

  return (
    <div className="min-h-screen bg-green-50/20">
      {apiError && (
        <div className="bg-red-50 text-red-700 border-b border-red-100 px-4 py-3 text-sm font-medium">
          {apiError}
        </div>
      )}
      {flashMessage && (
        <div className={`border-b px-4 py-3 text-sm font-medium ${flashMessage.type === 'success' ? 'border-green-100 bg-green-50 text-green-700' : 'border-red-100 bg-red-50 text-red-700'}`}>
          {flashMessage.text}
        </div>
      )}
      {user?.role === UserRole.CANDIDATE ? (
        <div className="flex flex-col h-screen overflow-auto">
          <CandidateNavbar
            userName={user.name}
            onLogout={handleLogout}
            activeTab={activeView}
            setActiveTab={setActiveView}
            logoUrl={systemConfig.logoUrl}
            notifications={filteredNotifications}
            unreadCount={unreadCount}
            showNotifications={showNotifications}
            setShowNotifications={async (show) => {
              setShowNotifications(show);
            }}
            onMarkAsRead={async (id) => {
              const notification = notifications.find((item) => item.id === id) || null;
              await syncState(api.markNotificationRead(id), user.id);
              if (notification) setSelectedNotification(notification);
            }}
            onMarkAllAsRead={async () => {
              await syncState(api.markAllNotificationsRead(user.id), user.id);
            }}
            onViewDetail={(notification) => setSelectedNotification(notification)}
          />
          <main className="flex-1">
            <CandidatePortal
              user={user}
              applications={applications}
              jobs={jobs}
              tests={tests}
              messages={filteredMessages}
              managers={managers}
              onApply={applyToJob}
              onFinishTest={finishTest}
              activeTab={activeView}
              setActiveTab={setActiveView}
              onMarkMessageRead={() => undefined}
              onSendMessage={(receiverId, text) => {
                const receiver = managers.find((manager) => manager.id === receiverId);
                void addMessage({
                  senderName: user.name,
                  receiverId,
                  receiverRole: receiver?.role || UserRole.MANAGER,
                  subject: 'Resposta à mensagem',
                  content: text
                });
              }}
              onSubmitDocuments={(documents) => handleSubmitDocuments(user.id, documents)}
              onUpdateProfile={handleUpdateProfile}
            />
          </main>
        </div>
      ) : (
        <div className="flex min-h-screen">
          <Sidebar
            role={user!.role}
            activeView={activeView}
            setActiveView={setActiveView}
            onLogout={handleLogout}
            restrictions={user?.restrictions}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            logoUrl={systemConfig.logoUrl}
          />
          <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:ml-64">
            <header className="bg-white border-b border-green-50 h-16 flex items-center justify-between px-6 sticky top-0 z-40">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg hover:bg-green-50 lg:hidden text-green-700">
                  <Menu size={24} />
                </button>
                <div className="hidden sm:flex items-center bg-gray-50 px-4 py-2 rounded-xl w-64 lg:w-96 border border-gray-100">
                  <Search size={16} className="text-gray-400 mr-2" />
                  <input type="text" placeholder="Pesquisar no portal..." className="bg-transparent outline-none text-sm w-full" />
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-6">
                <div className="relative">
                  <button onClick={() => { void toggleNotifications(); }} className="p-2.5 bg-gray-50 rounded-xl text-gray-500 hover:bg-green-50 hover:text-green-600 transition-all relative">
                    <Bell size={20} />
                    {systemConfig.enableNotifications && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <NotificationPanel
                      notifications={filteredNotifications}
                      onMarkAsRead={async (id) => {
                        await syncState(api.markNotificationRead(id), user.id);
                      }}
                      onMarkAllAsRead={async () => {
                        await syncState(api.markAllNotificationsRead(user.id), user.id);
                      }}
                      onClose={() => setShowNotifications(false)}
                      onViewDetail={(notification) => {
                        setSelectedNotification(notification);
                        setShowNotifications(false);
                      }}
                    />
                  )}
                </div>

                <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-bold text-gray-900 leading-none">{user?.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                      {user?.role === UserRole.ADMIN ? 'Administrador' : 'Gestor de RH'}
                    </p>
                  </div>
                  <button onClick={() => setActiveView('profile')} className={`w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold shadow-lg shadow-green-100 transition-transform overflow-hidden active:scale-95 ${user?.role === UserRole.ADMIN ? 'bg-slate-900' : 'bg-green-700'}`}>
                    {user?.avatar ? (
                      <img src={user.avatar} className="w-full h-full object-cover" alt="User Avatar" />
                    ) : (
                      user?.name.charAt(0)
                    )}
                  </button>
                </div>
              </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
              {activeView === 'dashboard' && (
                user?.role === UserRole.ADMIN
                  ? <AdminDashboard managers={managers} candidates={candidates} jobs={jobs} applications={applications} auditLogs={auditLogs} />
                  : <ManagerDashboard jobs={jobs} applications={applications} auditLogs={auditLogs} />
              )}
              {activeView === 'profile' && user && (
                <StaffProfile user={user} onUpdateUser={handleUpdateProfile} />
              )}
              {activeView === 'jobs' && (
                <ManagerJobs
                  jobs={jobs}
                  tests={tests}
                  onAddJob={async (job) => {
                    await syncState(api.saveJob({ ...job, id: `job-${Date.now()}` }), user.id);
                    await notifyAdministrators('Nova vaga criada', `${user.name} publicou a vaga "${job.title}".`);
                  }}
                  onUpdateJob={async (id, updates) => {
                    await syncState(api.updateJob(id, updates), user.id);
                    await notifyAdministrators('Vaga atualizada', `${user.name} atualizou a vaga ${id}.`);
                  }}
                  onDeleteJob={async (id) => {
                    await syncState(api.deleteJob(id), user.id);
                    await notifyAdministrators('Vaga removida', `${user.name} eliminou a vaga ${id}.`);
                  }}
                  onNotifyCandidate={(notification) => {
                    void addNotification(notification);
                  }}
                />
              )}
              {activeView === 'candidates' && (
                <ManagerCandidates
                  applications={applications}
                  jobs={jobs}
                  candidates={candidates}
                  onRefreshApplications={async () => {
                    await syncState(api.getState(), user.id);
                  }}
                  onLoadCandidateDocuments={(candidateId) => api.getUserDocuments(candidateId)}
                  onUpdateStatus={(appId, status, interviewDate) => {
                    void updateApplicationStatus(appId, status, interviewDate);
                  }}
                  onDeleteApplication={handleDeleteApplication}
                  onDeleteCandidate={handleDeleteCandidate}
                  onNotifyCandidate={(notification) => {
                    void addNotification(notification as Omit<Notification, 'id' | 'timestamp' | 'read'>);
                  }}
                  onUpdateDocumentStatus={(userId, status) => {
                    void handleUpdateDocumentStatus(userId, status);
                  }}
                  onUpdateApplicationDocumentStatus={(appId, status) => {
                    void handleUpdateApplicationDocumentStatus(appId, status);
                  }}
                />
              )}
              {activeView === 'tests' && <ManagerTests tests={tests} onAddTest={handleSaveTest} onDeleteTest={handleDeleteTest} />}
              {activeView === 'test-review' && <TestReview applications={applications} jobs={jobs} tests={tests} onUpdateStatus={(appId, status, interviewDate) => { void updateApplicationStatus(appId, status, interviewDate); }} />}
              {activeView === 'interviews' && <ManagerInterviews applications={applications} jobs={jobs} onUpdateStatus={(appId, status) => { void updateApplicationStatus(appId, status); }} />}
              {activeView === 'comms' && user && (
                <ManagerCommunication
                  currentUser={user}
                  staffUsers={staffUsers}
                  applications={applications}
                  messages={filteredMessages}
                  onSendMessage={(receiverId, receiverRole, text) => {
                    void addMessage({
                      senderName: user.name,
                      receiverId,
                      receiverRole,
                      subject: 'Mensagem interna',
                      content: text
                    });
                  }}
                />
              )}
              {activeView === 'reports' && user && (
                <ManagerReports
                  applications={applications}
                  jobs={jobs}
                  candidates={candidates}
                  currentUser={user}
                  onSendReport={(reportContent) => {
                    void handleSendReport(reportContent);
                  }}
                />
              )}
              {activeView === 'audit' && <AdminAuditLogs logs={auditLogs} />}
              {activeView === 'admin' && (
                <AdminSettings
                  managers={managers}
                  onUpdateManagerPermissions={(id, restrictions: ManagerRestrictions) => {
                    void (async () => {
                      await syncState(api.updateManagerPermissions(id, restrictions), user.id);
                      const manager = managers.find((entry) => entry.id === id);
                      await notifyAdministrators('Permissões atualizadas', `${user.name} atualizou as permissões do gestor ${manager?.name || id}.`);
                    })();
                  }}
                  onAddManager={(manager) => {
                    void (async () => {
                      await syncState(api.addManager(manager), user.id);
                      await notifyAdministrators('Novo gestor registado', `${user.name} criou a conta do gestor ${manager.name || manager.email}.`);
                    })();
                  }}
                  onToggleBlockManager={(id) => {
                    void handleToggleBlockManager(id);
                  }}
                  onDeleteManager={(id) => {
                    void (async () => {
                      const manager = managers.find((entry) => entry.id === id);
                      await syncState(api.deleteManager(id), user.id);
                      await notifyAdministrators('Gestor removido', `${user.name} eliminou a conta do gestor ${manager?.name || id}.`);
                    })();
                  }}
                />
              )}
              {activeView === 'settings' && (
                <AdminSystemSettings
                  systemConfig={systemConfig}
                  onUpdateSystemConfig={(config) => {
                    setSystemConfig(config);
                    void (async () => {
                      await syncState(api.updateSystemConfig(config), user.id);
                      await notifyAdministrators('Configuração alterada', `${user.name} atualizou as definições gerais do sistema.`);
                    })();
                  }}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {selectedNotification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedNotification(null)} />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                <Bell size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedNotification.title}</h2>
              <p className="text-gray-500 mb-6 text-sm leading-relaxed">{selectedNotification.message}</p>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-8">
                Recebida em: {new Date(selectedNotification.timestamp).toLocaleString()}
              </div>
              <button onClick={() => setSelectedNotification(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-200">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
