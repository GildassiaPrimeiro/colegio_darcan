
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CANDIDATE = 'CANDIDATE'
}

export enum ApplicationStatus {
  PENDING_CV = 'PENDING_CV',
  PENDING_TEST = 'PENDING_TEST',
  TEST_IN_PROGRESS = 'TEST_IN_PROGRESS',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED_FOR_INTERVIEW = 'APPROVED_FOR_INTERVIEW',
  INTERVIEWED = 'INTERVIEWED',
  REJECTED = 'REJECTED',
  HIRED = 'HIRED'
}

export enum DocumentStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface ManagerRestrictions {
  disabledModules: string[];
}

export interface SystemConfig {
  companyName: string;
  allowNewRegistrations: boolean;
  auditLogsEnabled: boolean;
  notificationEmail: string;
  enableNotifications: boolean;
  heroImages: string[];
  logoUrl: string;
  // New fields
  aboutUs: string;
  contactPhone: string;
  contactWhatsapp: string;
  socialFacebook: string;
  socialInstagram: string;
  overviewTitle: string;
  overviewSubtitle: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  linkedin?: string;
  restrictions?: ManagerRestrictions;
  documentStatus?: DocumentStatus;
  documents?: {
    cvName?: string;
    cvUrl?: string;
    biName?: string;
    biUrl?: string;
    diplomaName?: string;
    diplomaUrl?: string;
  };
  // Expanded Profile Fields
  birthDate?: string;
  gender?: string;
  address?: string;
  phone?: string;
  education?: string;
  experience?: string;
  interestArea?: string;
  profileComplete?: boolean;
  isBlocked?: boolean;
  isOnline?: boolean;
  lastSeenAt?: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: string[];
  status: 'OPEN' | 'PAUSED' | 'ARCHIVED';
  createdAt: string;
  deadline: string;
  testId?: string;
  candidateLimit?: number;
  currentCandidates?: number;
  filled?: boolean;
  testDate?: string;
  testTime?: string;
  // New fields
  minExperience?: string;
  workLocation?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'DISCURSIVE';
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export interface OnlineTest {
  id: string;
  title: string;
  questions: Question[];
  timeLimitHours?: number;
  timeLimitMinutes: number;
  timeLimitSeconds?: number;
  minPassScore: number;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  status: ApplicationStatus;
  workflowStatus?: string;
  appliedAt: string;
  cvUrl: string;
  testScheduledAt?: string;
  testAvailable?: boolean;
  testScore?: number;
  testCompletedAt?: string;
  interviewDate?: string;
  interviewLocation?: string;
  interviewNotes?: string;
  feedback?: string;
  blockedUntil?: string; 
  // Interview Evaluation
  evaluation?: {
    communication: number;
    experience: number;
    motivation: number;
    general: number;
    comments: string;
  };
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  timestamp: string;
  ipAddress: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'NEW_APPLICATION' | 'TEST_COMPLETED' | 'INFO' | 'DOCS_ACCEPTED' | 'DOCS_REJECTED' | 'DOCS_MISSING' | 'INTERVIEW_SCHEDULED' | 'NEW_JOB' | 'DOCS_SUBMITTED';
  targetUserId?: string;
  senderRole?: UserRole;
}

export interface Message {
  id: string;
  senderId?: string;
  senderName: string;
  senderRole?: UserRole;
  receiverId?: string;
  receiverRole?: UserRole;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
}
