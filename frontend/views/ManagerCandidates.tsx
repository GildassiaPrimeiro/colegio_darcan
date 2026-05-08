import React, { useEffect, useMemo, useState } from 'react';
import { Application, ApplicationStatus, DocumentStatus, Job, Notification, User } from '../types';
import { Search, Eye, FileText, Ban, Mail, Phone, Calendar, CheckCircle, XCircle, GraduationCap, User as UserIcon, Trash2, MapPin, Linkedin, Briefcase } from 'lucide-react';

interface ManagerCandidatesProps {
  applications: Application[];
  jobs: Job[];
  candidates: User[];
  onRefreshApplications?: () => Promise<void>;
  onLoadCandidateDocuments: (candidateId: string) => Promise<User['documents']>;
  onUpdateStatus: (appId: string, status: ApplicationStatus, interviewDate?: string) => void;
  onDeleteApplication: (appId: string) => Promise<void>;
  onDeleteCandidate: (candidateId: string) => Promise<void>;
  onNotifyCandidate: (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  onUpdateDocumentStatus: (userId: string, status: DocumentStatus) => void;
  onUpdateApplicationDocumentStatus: (appId: string, status: DocumentStatus) => void;
}

const statusLabel: Record<ApplicationStatus, string> = {
  [ApplicationStatus.PENDING_CV]: 'Candidatura Recebida',
  [ApplicationStatus.PENDING_TEST]: 'Teste Enviado',
  [ApplicationStatus.TEST_IN_PROGRESS]: 'Teste em Curso',
  [ApplicationStatus.PENDING_REVIEW]: 'Em Avaliação',
  [ApplicationStatus.APPROVED_FOR_INTERVIEW]: 'Entrevista Agendada',
  [ApplicationStatus.INTERVIEWED]: 'Entrevistado',
  [ApplicationStatus.REJECTED]: 'Reprovado',
  [ApplicationStatus.HIRED]: 'Contratado',
};

const statusClass: Record<ApplicationStatus, string> = {
  [ApplicationStatus.PENDING_CV]: 'bg-blue-50 text-blue-700 border-blue-100',
  [ApplicationStatus.PENDING_TEST]: 'bg-amber-50 text-amber-700 border-amber-100',
  [ApplicationStatus.TEST_IN_PROGRESS]: 'bg-orange-50 text-orange-700 border-orange-100',
  [ApplicationStatus.PENDING_REVIEW]: 'bg-purple-50 text-purple-700 border-purple-100',
  [ApplicationStatus.APPROVED_FOR_INTERVIEW]: 'bg-green-50 text-green-700 border-green-100',
  [ApplicationStatus.INTERVIEWED]: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  [ApplicationStatus.REJECTED]: 'bg-red-50 text-red-700 border-red-100',
  [ApplicationStatus.HIRED]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

type CandidateQueueItem = {
  id: string;
  application: Application | null;
  candidate: User | null;
  job: Job | null;
  candidateId: string;
  status: ApplicationStatus;
  appliedAt: string;
  isDocumentOnly: boolean;
};

type PreviewDocument = {
  url: string;
  title: string;
  mimeType: string;
  isObjectUrl: boolean;
};

const MANAGER_CANDIDATES_FILTERS_KEY = 'manager_candidates_filters_v1';

const ManagerCandidates: React.FC<ManagerCandidatesProps> = ({
  applications,
  jobs,
  candidates,
  onRefreshApplications,
  onLoadCandidateDocuments,
  onUpdateStatus,
  onDeleteApplication,
  onDeleteCandidate,
  onNotifyCandidate,
  onUpdateDocumentStatus,
  onUpdateApplicationDocumentStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [educationFilter, setEducationFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [skillsFilter, setSkillsFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [scheduleApplicationId, setScheduleApplicationId] = useState<string | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<PreviewDocument | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<User['documents'] | null>(null);

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Sem entrevista agendada';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Data a confirmar' : parsed.toLocaleString();
  };

  useEffect(() => {
    if (!onRefreshApplications) {
      return undefined;
    }

    void onRefreshApplications();
    return undefined;
  }, [onRefreshApplications]);

  useEffect(() => {
    try {
      const rawFilters = window.localStorage.getItem(MANAGER_CANDIDATES_FILTERS_KEY);
      if (!rawFilters) {
        return;
      }

      const savedFilters = JSON.parse(rawFilters) as {
        searchTerm?: string;
        educationFilter?: string;
        experienceFilter?: string;
        skillsFilter?: string;
        statusFilter?: string;
      };

      setSearchTerm(savedFilters.searchTerm || '');
      setEducationFilter(savedFilters.educationFilter || '');
      setExperienceFilter(savedFilters.experienceFilter || '');
      setSkillsFilter(savedFilters.skillsFilter || '');
      setStatusFilter(savedFilters.statusFilter || 'ALL');
    } catch {
      window.localStorage.removeItem(MANAGER_CANDIDATES_FILTERS_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      MANAGER_CANDIDATES_FILTERS_KEY,
      JSON.stringify({
        searchTerm,
        educationFilter,
        experienceFilter,
        skillsFilter,
        statusFilter,
      })
    );
  }, [searchTerm, educationFilter, experienceFilter, skillsFilter, statusFilter]);

  const queueItems = useMemo<CandidateQueueItem[]>(() => {
    const applicationItems = applications.map((application) => ({
      id: application.id,
      application,
      candidate: candidates.find((candidate) => candidate.id === application.candidateId) || null,
      job: jobs.find((job) => job.id === application.jobId) || null,
      candidateId: application.candidateId,
      status: application.status,
      appliedAt: application.appliedAt,
      isDocumentOnly: false,
    }));

    const documentOnlyItems = candidates
      .filter((candidate) => {
        const hasAnyDocument =
          !!candidate.documents?.cvName ||
          !!candidate.documents?.biName ||
          !!candidate.documents?.diplomaName;
        const hasAllRequiredDocuments =
          !!candidate.documents?.cvName &&
          !!candidate.documents?.biName &&
          !!candidate.documents?.diplomaName;
        const isWaitingReview =
          candidate.documentStatus === DocumentStatus.SUBMITTED ||
          candidate.documentStatus === DocumentStatus.APPROVED ||
          candidate.documentStatus === DocumentStatus.REJECTED;

        return (
          hasAnyDocument &&
          (hasAllRequiredDocuments || isWaitingReview) &&
          !applications.some((application) => application.candidateId === candidate.id)
        );
      })
      .map((candidate) => ({
        id: `docs-${candidate.id}`,
        application: null,
        candidate,
        job: null,
        candidateId: candidate.id,
        status: ApplicationStatus.PENDING_CV,
        appliedAt: candidate.lastSeenAt || new Date().toISOString(),
        isDocumentOnly: true,
      }));

    return [...applicationItems, ...documentOnlyItems];
  }, [applications, candidates, jobs]);

  const normalizeText = (value?: string | null) =>
    (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const selectedItem = queueItems.find((item) => item.id === selectedItemId) || null;
  const selectedApplication = selectedItem?.application || null;
  const schedulingApplication = applications.find((application) => application.id === scheduleApplicationId) || null;
  const selectedCandidate = selectedItem?.candidate || null;
  const selectedJob = selectedItem?.job || null;

  useEffect(() => {
    if (!selectedCandidate?.id) {
      setSelectedDocuments(null);
      return undefined;
    }

    let isActive = true;
    setSelectedDocuments(null);

    void onLoadCandidateDocuments(selectedCandidate.id)
      .then((documents) => {
        if (isActive) {
          setSelectedDocuments(documents || null);
        }
      })
      .catch(() => {
        if (isActive) {
          setSelectedDocuments(selectedCandidate.documents || null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [onLoadCandidateDocuments, selectedCandidate?.id]);

  const filteredItems = useMemo(() => {
    return queueItems.filter((item) => {
      const candidate = item.candidate;
      const job = item.job;
      const searchValue = normalizeText(searchTerm);
      const educationValue = normalizeText(educationFilter);
      const experienceValue = normalizeText(experienceFilter);
      const skillsValue = normalizeText(skillsFilter);
      const searchCorpus = normalizeText([
        candidate?.name,
        candidate?.email,
        candidate?.education,
        candidate?.experience,
        candidate?.address,
        job?.title,
        job?.department,
        ...(job?.requirements || []),
        item.candidateId,
        item.isDocumentOnly ? 'documentos submetidos' : '',
      ].join(' '));
      const skillsCorpus = normalizeText([
        candidate?.education,
        candidate?.experience,
        job?.title,
        job?.department,
        ...(job?.requirements || []),
      ].join(' '));

      const matchesSearch = [
        candidate?.name || '',
        candidate?.email || '',
        job?.title || '',
        job?.department || '',
        item.candidateId,
        item.isDocumentOnly ? 'documentos submetidos' : '',
      ]
        .join(' ');
      const matchesGeneralSearch = searchValue === '' || searchCorpus.includes(searchValue) || normalizeText(matchesSearch).includes(searchValue);
      const matchesEducation = educationValue === '' || normalizeText(candidate?.education).includes(educationValue);
      const matchesExperience = experienceValue === '' || normalizeText(candidate?.experience).includes(experienceValue);
      const matchesSkills = skillsValue === '' || skillsCorpus.includes(skillsValue);
      const matchesStatus =
        statusFilter === 'ALL' ||
        item.status === statusFilter ||
        (statusFilter === 'DOCS_SUBMITTED' && candidate?.documentStatus === DocumentStatus.SUBMITTED) ||
        (statusFilter === 'DOCS_APPROVED' && candidate?.documentStatus === DocumentStatus.APPROVED) ||
        (statusFilter === 'DOCS_REJECTED' && candidate?.documentStatus === DocumentStatus.REJECTED);

      return matchesGeneralSearch && matchesEducation && matchesExperience && matchesSkills && matchesStatus;
    });
  }, [queueItems, searchTerm, educationFilter, experienceFilter, skillsFilter, statusFilter]);

  const handleReject = (application: Application) => {
    onUpdateStatus(application.id, ApplicationStatus.REJECTED);
    onNotifyCandidate({
      type: 'INFO',
      title: 'Candidatura atualizada',
      message: `A candidatura ${application.id} foi marcada como reprovada.`,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setEducationFilter('');
    setExperienceFilter('');
    setSkillsFilter('');
    setStatusFilter('ALL');
    window.localStorage.removeItem(MANAGER_CANDIDATES_FILTERS_KEY);
  };

  const handleScheduleInterview = () => {
    if (!schedulingApplication || !interviewDate) return;
    onUpdateStatus(schedulingApplication.id, ApplicationStatus.APPROVED_FOR_INTERVIEW, interviewDate);
    setScheduleApplicationId(null);
    setInterviewDate('');
  };

  const handleDeleteApplication = (application: Application) => {
    const candidate = candidates.find((entry) => entry.id === application.candidateId);
    if (!window.confirm(`Pretende eliminar o candidato ${candidate?.name || application.candidateId} desta candidatura?`)) {
      return;
    }

    void onDeleteApplication(application.id).catch((error) => {
      const message = error instanceof Error ? error.message : 'Não foi possível eliminar a candidatura.';
      setActionMessage(message);
    });
    if (selectedItemId === application.id) {
      setSelectedItemId(null);
    }
  };

  const closePreviewDocument = () => {
    setPreviewDocument((current) => {
      if (current?.isObjectUrl) {
        window.URL.revokeObjectURL(current.url);
      }
      return null;
    });
  };

  const canSendTest = (application: Application, candidate: User | null) =>
    (application.workflowStatus === 'DOCUMENTOS_APROVADOS' ||
      candidate?.documentStatus === DocumentStatus.APPROVED) &&
    !!jobs.find((job) => job.id === application.jobId)?.testId &&
    !!jobs.find((job) => job.id === application.jobId)?.testDate &&
    !!jobs.find((job) => job.id === application.jobId)?.testTime;

  const documentCards = selectedCandidate
    ? [
        { key: 'cv', label: 'Currículo Vitae', value: selectedCandidate.documents?.cvName || 'Não submetido', icon: FileText },
        { key: 'bi', label: 'Bilhete de Identidade', value: selectedCandidate.documents?.biName || 'Não submetido', icon: UserIcon },
        { key: 'diploma', label: 'Certificado ou Diploma', value: selectedCandidate.documents?.diplomaName || 'Não submetido', icon: GraduationCap },
      ]
    : [];

  const documentLinks = selectedCandidate
    ? {
        cv: selectedDocuments?.cvUrl || selectedApplication?.cvUrl || null,
        bi: selectedDocuments?.biUrl || null,
        diploma: selectedDocuments?.diplomaUrl || null,
      }
    : { cv: null, bi: null, diploma: null };

  const profileStatusBadge = selectedCandidate?.documentStatus === DocumentStatus.APPROVED
    ? {
        label: 'Perfil aprovado',
        className: 'border border-green-100 bg-green-50 text-green-700',
      }
    : selectedCandidate?.documentStatus === DocumentStatus.REJECTED
      ? {
          label: 'Perfil reprovado',
          className: 'border border-red-100 bg-red-50 text-red-700',
        }
      : {
          label: 'Perfil pendente de validação',
          className: 'border border-blue-100 bg-blue-50 text-blue-700',
        };

  const professionalCards = selectedCandidate
    ? [
        { label: 'Data de nascimento', value: selectedCandidate.birthDate || 'Não informado' },
        { label: 'Género', value: selectedCandidate.gender || 'Não informado' },
        { label: 'Localidade', value: selectedCandidate.address || 'Não informado' },
      ]
    : [];

  const isDataUrl = (value: string | null) => !!value && value.startsWith('data:');

  const dataUrlToBlob = (dataUrl: string) => {
    const [metadata, base64] = dataUrl.split(',');
    const mimeMatch = metadata.match(/data:(.*?);base64/);
    const mimeType = mimeMatch?.[1] || 'application/pdf';
    const binary = window.atob(base64 || '');
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new Blob([bytes], { type: mimeType });
  };

  useEffect(() => () => {
    if (previewDocument?.isObjectUrl) {
      window.URL.revokeObjectURL(previewDocument.url);
    }
  }, [previewDocument]);

  const handleViewDocument = (documentUrl: string | null, fileName: string) => {
    if (!documentUrl) {
      setActionMessage('Este documento ainda não tem ficheiro disponível para visualização. Peça ao candidato para reenviar o PDF.');
      return;
    }

    if (isDataUrl(documentUrl)) {
      const blob = dataUrlToBlob(documentUrl);
      const objectUrl = window.URL.createObjectURL(blob);
      closePreviewDocument();
      setPreviewDocument({
        url: objectUrl,
        title: fileName,
        mimeType: blob.type || 'application/pdf',
        isObjectUrl: true,
      });
      return;
    }

    closePreviewDocument();
    setPreviewDocument({
      url: documentUrl,
      title: fileName,
      mimeType: fileName.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/) ? 'image/*' : 'application/pdf',
      isObjectUrl: false,
    });
  };

  const handleDownloadDocument = async (documentUrl: string | null, fileName: string) => {
    if (!documentUrl) {
      setActionMessage('Este documento ainda não tem ficheiro disponível para download. Peça ao candidato para reenviar o PDF.');
      return;
    }

    try {
      const blob = isDataUrl(documentUrl)
        ? dataUrlToBlob(documentUrl)
        : await (await fetch(documentUrl)).blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName || 'documento.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(documentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {actionMessage && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {actionMessage}
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidaturas</h1>
          <p className="text-gray-500">Acompanhe candidatos, testes, documentos e entrevistas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-700">
            Encontrados: {filteredItems.length}
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-green-700">
            Total: {queueItems.length}
          </div>
        </div>
      </header>

      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por candidato, e-mail ou vaga..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-2xl bg-gray-50 py-3 pl-12 pr-4 font-medium text-gray-900 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-green-500"
            />
          </div>

          <input
            type="text"
            placeholder="Filtrar por formação"
            value={educationFilter}
            onChange={(event) => setEducationFilter(event.target.value)}
            className="w-full rounded-2xl bg-gray-50 px-4 py-3 font-medium text-gray-900 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-green-500"
          />

          <input
            type="text"
            placeholder="Filtrar por experiência"
            value={experienceFilter}
            onChange={(event) => setExperienceFilter(event.target.value)}
            className="w-full rounded-2xl bg-gray-50 px-4 py-3 font-medium text-gray-900 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-green-500"
          />

          <input
            type="text"
            placeholder="Competências / palavras-chave"
            value={skillsFilter}
            onChange={(event) => setSkillsFilter(event.target.value)}
            className="w-full rounded-2xl bg-gray-50 px-4 py-3 font-medium text-gray-900 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-green-500"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl bg-gray-50 px-6 py-3 font-bold text-gray-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-green-500"
          >
            <option value="ALL">Todos os estados</option>
            <option value="DOCS_SUBMITTED">Documentos submetidos</option>
            <option value="DOCS_APPROVED">Perfil aprovado</option>
            <option value="DOCS_REJECTED">Perfil reprovado</option>
            <option value={ApplicationStatus.PENDING_CV}>Candidatura Recebida</option>
            <option value={ApplicationStatus.PENDING_TEST}>Teste Enviado</option>
            <option value={ApplicationStatus.PENDING_REVIEW}>Em Avaliação</option>
            <option value={ApplicationStatus.APPROVED_FOR_INTERVIEW}>Entrevista Agendada</option>
            <option value={ApplicationStatus.INTERVIEWED}>Entrevistado</option>
            <option value={ApplicationStatus.REJECTED}>Reprovado</option>
            <option value={ApplicationStatus.HIRED}>Contratado</option>
          </select>
        </div>

        <div className="mb-8 flex justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-2xl bg-gray-100 px-5 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-200"
          >
            Limpar filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <th className="pb-4 pl-4">Candidato / Vaga</th>
                <th className="pb-4">Estado</th>
                <th className="pb-4">Teste</th>
                <th className="pb-4">Inscrição</th>
                <th className="pb-4 pr-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-sm font-bold text-gray-700">Nenhuma candidatura encontrada.</p>
                    <p className="mt-1 text-xs text-gray-400">Ajuste os filtros para continuar.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const { application, candidate, job, isDocumentOnly } = item;
                  const reviewText = isDocumentOnly
                    ? candidate?.documentStatus === DocumentStatus.APPROVED
                      ? 'Perfil aprovado'
                      : candidate?.documentStatus === DocumentStatus.REJECTED
                        ? 'Perfil reprovado'
                        : 'Aguardando aprovação'
                    : 'Pendente';
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-green-50/30">
                      <td className="py-5 pl-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
                            <UserIcon size={22} />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{candidate?.name || item.candidateId}</div>
                            <div className="text-xs text-gray-500">{candidate?.email || 'Sem e-mail registado'}</div>
                            <div className="text-xs font-bold uppercase tracking-wider text-green-600">
                              {job?.title || (isDocumentOnly ? 'Documentos submetidos' : 'Vaga indisponível')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5">
                        <div className="space-y-2">
                          <span className={`inline-flex rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${statusClass[item.status]}`}>
                            {isDocumentOnly ? 'Documentos Submetidos' : statusLabel[item.status]}
                          </span>
                          {candidate?.documentStatus && (
                            <div className={`inline-flex rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                              candidate.documentStatus === DocumentStatus.APPROVED
                                ? 'border-green-100 bg-green-50 text-green-700'
                                : candidate.documentStatus === DocumentStatus.REJECTED
                                  ? 'border-red-100 bg-red-50 text-red-700'
                                  : 'border-blue-100 bg-blue-50 text-blue-700'
                            }`}>
                              {candidate.documentStatus === DocumentStatus.APPROVED
                                ? 'Perfil aprovado'
                                : candidate.documentStatus === DocumentStatus.REJECTED
                                  ? 'Perfil reprovado'
                                  : 'Perfil pendente'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-5">
                        {typeof application?.testScore === 'number' ? (
                          <div>
                            <div className={`text-lg font-black ${application.testScore >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                              {application.testScore.toFixed(0)}%
                            </div>
                            <div className="text-[10px] font-bold uppercase text-gray-400">Resultado</div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="block font-bold text-gray-300">{reviewText}</span>
                            {application?.status === ApplicationStatus.PENDING_TEST && application.testScheduledAt && (
                              <div className="space-y-1">
                                <div className="text-[11px] font-bold text-amber-700">
                                  Teste agendado para {formatDateTime(application.testScheduledAt)}
                                </div>
                                <div className={`inline-flex rounded-xl border px-2 py-1 text-[10px] font-black uppercase tracking-widest ${
                                  application.testAvailable
                                    ? 'border-green-100 bg-green-50 text-green-700'
                                    : 'border-amber-100 bg-amber-50 text-amber-700'
                                }`}>
                                  {application.testAvailable ? 'Disponível agora' : 'Aguardando horário'}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-5 text-sm font-medium text-gray-500">
                        {new Date(item.appliedAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-5 pr-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedItemId(item.id)}
                            className="rounded-2xl p-3 text-gray-400 transition-all hover:bg-green-100 hover:text-green-700"
                            title="Ver detalhes"
                          >
                            <Eye size={20} />
                          </button>
                          {application && application.status === ApplicationStatus.PENDING_CV && (
                            <button
                              onClick={() => {
                                if (!canSendTest(application, candidate)) return;
                                onUpdateStatus(application.id, ApplicationStatus.PENDING_TEST);
                              }}
                              className={`rounded-2xl p-3 transition-all ${canSendTest(application, candidate) ? 'text-amber-600 hover:bg-amber-50' : 'cursor-not-allowed text-gray-300'}`}
                              title="Enviar teste"
                            >
                              <FileText size={20} />
                            </button>
                          )}
                          {application && (
                            <>
                              <button
                                onClick={() => handleReject(application)}
                                className="rounded-2xl p-3 text-gray-400 transition-all hover:bg-red-50 hover:text-red-600"
                                title="Reprovar candidatura"
                              >
                                <Ban size={20} />
                              </button>
                              <button
                                onClick={() => handleDeleteApplication(application)}
                                className="rounded-2xl p-3 text-gray-400 transition-all hover:bg-red-50 hover:text-red-700"
                                title="Eliminar candidato"
                              >
                                <Trash2 size={20} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedItemId(null)} />
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/50 p-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedCandidate?.name || selectedItem.candidateId}</h2>
                <p className="mt-1 text-sm font-bold text-green-700">{selectedJob?.title || 'Documentos submetidos para aprovação'}</p>
                <div className={`mt-3 inline-flex rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest ${profileStatusBadge.className}`}>
                  {profileStatusBadge.label}
                </div>
              </div>
              <button onClick={() => setSelectedItemId(null)} className="rounded-2xl p-3 text-gray-400 transition-all hover:bg-white hover:text-gray-900">
                <XCircle size={24} />
              </button>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-8 overflow-y-auto p-8 md:grid-cols-3">
              <div className="space-y-8 md:col-span-2">
                <section>
                  <h3 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-gray-400">Informações de Contacto</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center gap-3">
                        <Mail className="text-green-600" size={18} />
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-400">E-mail</p>
                          <p className="text-sm font-bold text-gray-900">{selectedCandidate?.email || 'Sem e-mail registado'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center gap-3">
                        <Phone className="text-green-600" size={18} />
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-400">Telefone</p>
                          <p className="text-sm font-bold text-gray-900">{selectedCandidate?.phone || 'Sem telefone registado'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="text-green-600" size={18} />
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-400">Localidade</p>
                          <p className="text-sm font-bold text-gray-900">{selectedCandidate?.address || 'Sem morada registada'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2 lg:col-span-3">
                      <div className="flex items-center gap-3">
                        <Linkedin className="text-green-600" size={18} />
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-400">LinkedIn</p>
                          <p className="text-sm font-bold text-gray-900 break-all">{selectedCandidate?.linkedin || 'Sem LinkedIn registado'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-gray-400">Perfil profissional</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {professionalCards.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <p className="text-[10px] font-bold uppercase text-gray-400">{item.label}</p>
                        <p className="mt-2 text-sm font-bold text-gray-900">{item.value}</p>
                      </div>
                    ))}
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="text-green-600" size={18} />
                        <p className="text-[10px] font-bold uppercase text-gray-400">Habilitações literárias</p>
                      </div>
                      <p className="mt-3 text-sm font-bold text-gray-900">{selectedCandidate?.education || 'Não informado'}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
                      <div className="flex items-center gap-2">
                        <Briefcase className="text-green-600" size={18} />
                        <p className="text-[10px] font-bold uppercase text-gray-400">Experiência profissional</p>
                      </div>
                      <p className="mt-3 text-sm font-bold text-gray-900 whitespace-pre-line">{selectedCandidate?.experience || 'Não informado'}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Documentação</h3>
                    {selectedApplication ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onUpdateApplicationDocumentStatus(selectedApplication.id, DocumentStatus.APPROVED)}
                          disabled={selectedApplication.workflowStatus === 'DOCUMENTOS_APROVADOS'}
                          className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase text-white ${selectedApplication.workflowStatus === 'DOCUMENTOS_APROVADOS' ? 'cursor-not-allowed bg-gray-300' : 'bg-green-600'}`}
                        >
                          Aprovar Documentos
                        </button>
                        <button
                          onClick={() => onUpdateApplicationDocumentStatus(selectedApplication.id, DocumentStatus.REJECTED)}
                          disabled={selectedApplication.workflowStatus === 'DOCUMENTOS_REJEITADOS'}
                          className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase text-white ${selectedApplication.workflowStatus === 'DOCUMENTOS_REJEITADOS' ? 'cursor-not-allowed bg-gray-300' : 'bg-red-600'}`}
                        >
                          Rejeitar Documentos
                        </button>
                      </div>
                    ) : selectedCandidate?.documentStatus === DocumentStatus.SUBMITTED && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => selectedCandidate && onUpdateDocumentStatus(selectedCandidate.id, DocumentStatus.APPROVED)}
                          disabled={selectedCandidate.documentStatus === DocumentStatus.APPROVED}
                          className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase text-white ${selectedCandidate.documentStatus === DocumentStatus.APPROVED ? 'cursor-not-allowed bg-gray-300' : 'bg-green-600'}`}
                        >
                          Aprovar Tudo
                        </button>
                        <button
                          onClick={() => selectedCandidate && onUpdateDocumentStatus(selectedCandidate.id, DocumentStatus.REJECTED)}
                          disabled={selectedCandidate.documentStatus === DocumentStatus.REJECTED}
                          className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase text-white ${selectedCandidate.documentStatus === DocumentStatus.REJECTED ? 'cursor-not-allowed bg-gray-300' : 'bg-red-600'}`}
                        >
                          Rejeitar Tudo
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {documentCards.map((document) => {
                      const Icon = document.icon;
                      const documentUrl = document.key === 'cv'
                        ? documentLinks.cv
                        : document.key === 'bi'
                          ? documentLinks.bi
                          : documentLinks.diploma;
                      return (
                        <div key={document.key} className="rounded-2xl border border-gray-100 bg-white p-4">
                          <Icon className="mb-3 text-green-600" size={22} />
                          <p className="mb-1 text-[10px] font-bold uppercase text-gray-400">{document.label}</p>
                          <p className="break-all text-xs font-bold leading-5 text-gray-900">{document.value}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewDocument(documentUrl, typeof document.value === 'string' ? document.value : 'documento.pdf')}
                              disabled={!documentUrl}
                              className={`inline-flex rounded-lg px-3 py-2 text-xs font-bold transition-all ${documentUrl ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'cursor-not-allowed bg-gray-100 text-gray-400'}`}
                            >
                              Visualizar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadDocument(documentUrl, typeof document.value === 'string' ? document.value : 'documento.pdf')}
                              disabled={!documentUrl}
                              className={`inline-flex rounded-lg px-3 py-2 text-xs font-bold transition-all ${documentUrl ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'cursor-not-allowed bg-gray-100 text-gray-400'}`}
                            >
                              Baixar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {selectedApplication && (
                  <section>
                    <h3 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-gray-400">Histórico de Avaliação</h3>
                    <div className="rounded-3xl border border-gray-100 bg-gray-50 p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-900">Resultado do Teste</p>
                          <p className="text-xs text-gray-400">
                            {selectedApplication.testCompletedAt
                              ? `Concluído em ${new Date(selectedApplication.testCompletedAt).toLocaleDateString()}`
                              : 'Teste ainda não concluído'}
                          </p>
                        </div>
                        <div className={`text-xl font-black ${typeof selectedApplication.testScore === 'number' && selectedApplication.testScore >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                          {typeof selectedApplication.testScore === 'number' ? `${selectedApplication.testScore.toFixed(0)}%` : 'Pendente'}
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full ${typeof selectedApplication.testScore === 'number' && selectedApplication.testScore >= 70 ? 'bg-green-500' : 'bg-orange-500'}`}
                          style={{ width: `${typeof selectedApplication.testScore === 'number' ? selectedApplication.testScore : 0}%` }}
                        />
                      </div>
                    </div>
                  </section>
                )}
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl bg-green-700 p-6 text-white">
                  <h4 className="mb-4 flex items-center gap-2 font-bold">
                    <CheckCircle size={18} /> Ações rápidas
                  </h4>
                  <div className="space-y-3">
                    {selectedApplication?.status === ApplicationStatus.PENDING_CV && (
                      <button
                        onClick={() => {
                          if (!canSendTest(selectedApplication, selectedCandidate)) return;
                          onUpdateStatus(selectedApplication.id, ApplicationStatus.PENDING_TEST);
                          setSelectedItemId(null);
                        }}
                        className={`w-full rounded-xl py-3 text-sm font-bold ${canSendTest(selectedApplication, selectedCandidate) ? 'bg-amber-600 text-white' : 'cursor-not-allowed bg-gray-200 text-gray-400'}`}
                      >
                        Enviar teste online
                      </button>
                    )}

                    {selectedApplication?.status === ApplicationStatus.PENDING_REVIEW && (
                      <button
                        onClick={() => {
                          setScheduleApplicationId(selectedApplication.id);
                          setSelectedItemId(null);
                        }}
                        className="w-full rounded-xl bg-white py-3 text-sm font-bold text-green-700"
                      >
                        Agendar entrevista
                      </button>
                    )}

                    {selectedApplication?.status === ApplicationStatus.INTERVIEWED && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            onUpdateStatus(selectedApplication.id, ApplicationStatus.HIRED);
                            setSelectedItemId(null);
                          }}
                          className="rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white"
                        >
                          Contratar
                        </button>
                        <button
                          onClick={() => {
                            onUpdateStatus(selectedApplication.id, ApplicationStatus.REJECTED);
                            setSelectedItemId(null);
                          }}
                          className="rounded-xl bg-red-600 py-3 text-sm font-bold text-white"
                        >
                          Rejeitar
                        </button>
                      </div>
                    )}

                    {selectedApplication ? (
                      <>
                        <button
                          onClick={() => handleDeleteApplication(selectedApplication)}
                          className="w-full rounded-xl bg-red-700 py-3 text-sm font-bold text-white"
                        >
                          Eliminar candidato
                        </button>

                        <button
                          onClick={() => {
                            onUpdateStatus(selectedApplication.id, ApplicationStatus.REJECTED);
                            setSelectedItemId(null);
                          }}
                          className="w-full rounded-xl bg-red-500/20 py-3 text-sm font-bold text-red-100"
                        >
                          Reprovar candidato
                        </button>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            if (!selectedCandidate) return;
                            onUpdateDocumentStatus(selectedCandidate.id, DocumentStatus.APPROVED);
                            setSelectedItemId(null);
                          }}
                          disabled={selectedCandidate?.documentStatus === DocumentStatus.APPROVED}
                          className={`w-full rounded-xl py-3 text-sm font-bold ${selectedCandidate?.documentStatus === DocumentStatus.APPROVED ? 'cursor-not-allowed bg-gray-200 text-gray-400' : 'bg-white text-green-700'}`}
                        >
                          Aprovar perfil
                        </button>
                        <button
                          onClick={() => {
                            if (!selectedCandidate) return;
                            onUpdateDocumentStatus(selectedCandidate.id, DocumentStatus.REJECTED);
                            setSelectedItemId(null);
                          }}
                          disabled={selectedCandidate?.documentStatus === DocumentStatus.REJECTED}
                          className={`w-full rounded-xl py-3 text-sm font-bold ${selectedCandidate?.documentStatus === DocumentStatus.REJECTED ? 'cursor-not-allowed bg-gray-200 text-gray-400' : 'bg-red-600 text-white'}`}
                        >
                          Reprovar perfil
                        </button>
                        <button
                          onClick={() => {
                            if (!selectedCandidate) return;
                            void onDeleteCandidate(selectedCandidate.id).finally(() => {
                              setSelectedItemId(null);
                            });
                          }}
                          className="w-full rounded-xl bg-red-900 py-3 text-sm font-bold text-white"
                        >
                          Eliminar candidato do sistema
                        </button>
                        <div className="rounded-2xl bg-white/10 p-4 text-sm font-medium text-white/85">
                          Este registo corresponde a documentos submetidos. Use os botões acima para validar ou reprovar o perfil e a documentação do candidato.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-6">
                  <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">Estado da candidatura</h4>
                  <div className={`inline-flex rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest ${statusClass[selectedApplication?.status || ApplicationStatus.PENDING_CV]}`}>
                    {selectedApplication
                      ? statusLabel[selectedApplication.status]
                      : selectedCandidate?.documentStatus === DocumentStatus.APPROVED
                        ? 'Perfil aprovado'
                        : selectedCandidate?.documentStatus === DocumentStatus.REJECTED
                          ? 'Perfil reprovado'
                          : 'Documentos Submetidos'}
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      {formatDateTime(selectedApplication?.interviewDate)}
                    </div>
                    {selectedApplication?.status === ApplicationStatus.PENDING_TEST && selectedApplication.testScheduledAt && (
                      <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-amber-800">
                        <div className="text-[10px] font-black uppercase tracking-widest">Teste agendado</div>
                        <div className="mt-1 text-sm font-bold">{formatDateTime(selectedApplication.testScheduledAt)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {schedulingApplication && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setScheduleApplicationId(null)} />
          <div className="relative w-full max-w-md rounded-[2.5rem] bg-white shadow-2xl">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900">Agendar Entrevista</h2>
              <p className="mt-2 text-sm text-gray-500">
                Defina a data e a hora da entrevista para {candidates.find((candidate) => candidate.id === schedulingApplication.candidateId)?.name || schedulingApplication.candidateId}.
              </p>

              <div className="mt-6 space-y-4">
                <input
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(event) => setInterviewDate(event.target.value)}
                  className="w-full rounded-xl bg-gray-50 px-4 py-3 font-medium text-gray-900 outline-none focus:ring-2 focus:ring-green-500"
                />

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleScheduleInterview}
                    disabled={!interviewDate}
                    className="w-full rounded-2xl bg-green-700 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Confirmar Agendamento
                  </button>
                  <button
                    onClick={() => setScheduleApplicationId(null)}
                    className="w-full py-3 font-bold text-gray-400 transition-all hover:text-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewDocument && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePreviewDocument} />
          <div className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Visualização do documento</h3>
                <p className="text-sm text-gray-500">{previewDocument.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDownloadDocument(previewDocument.url, previewDocument.title)}
                  className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition-all hover:bg-blue-100"
                >
                  Baixar
                </button>
                <button
                  type="button"
                  onClick={closePreviewDocument}
                  className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 transition-all hover:bg-gray-200"
                >
                  Fechar
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-100 p-4">
              {previewDocument.mimeType.startsWith('image/') ? (
                <div className="flex h-full items-center justify-center overflow-auto rounded-2xl bg-white p-4">
                  <img src={previewDocument.url} alt={previewDocument.title} className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="h-full overflow-hidden rounded-2xl bg-white">
                  <embed
                    src={previewDocument.url}
                    type={previewDocument.mimeType || 'application/pdf'}
                    className="h-full w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerCandidates;
