import { Application, AuditLog, Job, ManagerRestrictions, Message, Notification, OnlineTest, SystemConfig, User, UserRole, DocumentStatus } from './types';

export interface AppState {
  users: User[];
  adminUser: User | null;
  candidates: User[];
  managers: User[];
  jobs: Job[];
  tests: OnlineTest[];
  applications: Application[];
  notifications: Notification[];
  messages: Message[];
  auditLogs: AuditLog[];
  systemConfig: SystemConfig;
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

const resolveApiBase = () => {
  const configuredBase = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL;
  if (configuredBase) {
    return configuredBase;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:8000/api`;
    }
  }

  return '/api';
};

const API_BASE = resolveApiBase();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isStartupSensitive = path === '/state' || path.startsWith('/auth/');
  const maxAttempts = isStartupSensitive ? 150 : 4;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });

      const rawPayload = await response.text();
      let payload: any = null;

      if (rawPayload) {
        try {
          payload = JSON.parse(rawPayload);
        } catch {
          const preview = rawPayload.slice(0, 180).replace(/\s+/g, ' ').trim();
          const isRetryableHtml = isStartupSensitive && [502, 503, 504].includes(response.status);
          if (isRetryableHtml && attempt < maxAttempts) {
            await sleep(1000);
            continue;
          }
          throw new Error(preview || `Resposta inválida da API (${response.status}).`);
        }
      }

      if (!response.ok || !payload?.ok) {
        const retryableStatus = isStartupSensitive && [502, 503, 504].includes(response.status) && attempt < maxAttempts;
        if (retryableStatus) {
          await sleep(1000);
          continue;
        }
        throw new Error(payload?.message || `Falha na API (${response.status}).`);
      }

      return payload.data as T;
    } catch (error) {
      const fallbackError = error instanceof Error
        ? error
        : new Error('Falha na comunicacao com a API.');
      lastError = fallbackError;
      const isNetworkError = error instanceof TypeError;
      const shouldRetry = isStartupSensitive && isNetworkError && attempt < maxAttempts;
      if (!shouldRetry) {
        throw new Error(lastError.message || 'Falha na comunicacao com a API.');
      }
      await sleep(1000);
    }
  }

  throw lastError ?? new Error('Falha na comunicacao com a API.');
}

export const api = {
  getState: () => request<AppState>('/state'),
  login: (data: { email: string; password: string }) => request<AppState>('/auth/login', { method: 'POST', body: data }),
  logout: (userId?: string) => request<AppState>('/auth/logout', { method: 'POST', body: { userId } }),
  register: (data: { name: string; email: string; password: string; role?: UserRole }) => request<AppState>('/auth/register', { method: 'POST', body: data }),
  saveJob: (job: Partial<Job>) => request<AppState>('/jobs', { method: 'POST', body: job }),
  updateJob: (id: string, updates: Partial<Job>) => request<AppState>(`/jobs/${id}`, { method: 'PUT', body: updates }),
  deleteJob: (id: string) => request<AppState>(`/jobs/${id}`, { method: 'DELETE' }),
  saveTest: (test: OnlineTest) => request<AppState>('/tests', { method: 'POST', body: test }),
  deleteTest: (id: string) => request<AppState>(`/tests/${id}`, { method: 'DELETE' }),
  createApplication: (application: Partial<Application>) => request<AppState>('/applications', { method: 'POST', body: application }),
  deleteApplication: (id: string) => request<AppState>(`/applications/${id}`, { method: 'DELETE' }),
  deleteCandidate: (id: string) => request<AppState>(`/candidates/${id}`, { method: 'DELETE' }),
  updateApplicationStatus: (id: string, payload: Partial<Application> & { status: string }) => request<AppState>(`/applications/${id}/status`, { method: 'PUT', body: payload }),
  updateUserProfile: (id: string, updates: Partial<User>) => request<AppState>(`/users/${id}/profile`, { method: 'PUT', body: updates }),
  submitDocuments: (id: string, documents: { cvName: string; cvUrl?: string; biName: string; biUrl?: string; diplomaName: string; diplomaUrl?: string }) => request<AppState>(`/users/${id}/documents`, { method: 'PUT', body: documents }),
  updateDocumentStatus: (id: string, status: DocumentStatus) => request<AppState>(`/users/${id}/document-status`, { method: 'PUT', body: { status } }),
  updateApplicationDocumentStatus: (id: string, status: DocumentStatus) => request<AppState>(`/applications/${id}/document-status`, { method: 'PUT', body: { status } }),
  sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'read'> & { senderRole?: UserRole }) => request<AppState>('/messages', { method: 'POST', body: message }),
  createNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => request<AppState>('/notifications', { method: 'POST', body: notification }),
  markNotificationRead: (id: string) => request<AppState>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: (targetUserId?: string) => request<AppState>('/notifications/read-all', { method: 'PUT', body: { targetUserId } }),
  updateSystemConfig: (config: SystemConfig) => request<AppState>('/system-config', { method: 'PUT', body: config }),
  addManager: (manager: Partial<User> & { password?: string }) => request<AppState>('/managers', { method: 'POST', body: manager }),
  deleteManager: (managerId: string) => request<AppState>(`/managers/${managerId}`, { method: 'DELETE' }),
  updateManagerPermissions: (managerId: string, restrictions: ManagerRestrictions) => request<AppState>(`/managers/${managerId}/permissions`, { method: 'PUT', body: restrictions }),
  toggleManagerBlock: (managerId: string, isBlocked: boolean) => request<AppState>(`/managers/${managerId}/block`, { method: 'PUT', body: { isBlocked } }),
};
