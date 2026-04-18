
import React from 'react';
import { User, UserRole, Job, OnlineTest, Application, ApplicationStatus } from './types';

export const ADMIN_USER: User = {
  id: 'admin-001',
  name: 'Administrador Darcan',
  email: 'admin@darcan.com',
  role: UserRole.ADMIN,
  avatar: 'https://picsum.photos/seed/admin/200'
};

export const INITIAL_JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'Professor de Matemática',
    department: 'Área Pedagógica',
    description: 'Buscamos profissional dedicado para lecionar ensino médio.',
    requirements: ['Licenciatura em Matemática', '3 anos de experiência'],
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    deadline: '2023-12-31',
    testId: 'test-1'
  },
  {
    id: 'job-2',
    title: 'Analista de RH',
    department: 'Administração e Finanças',
    description: 'Gestão de benefícios e processos seletivos.',
    requirements: ['Psicologia ou Gestão de RH', 'Inglês Intermediário'],
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    deadline: '2023-12-15',
    testId: 'test-2'
  }
];

export const INITIAL_TESTS: OnlineTest[] = [
  {
    id: 'test-1',
    title: 'Avaliação de Conhecimentos Pedagógicos',
    timeLimitHours: 0,
    timeLimitMinutes: 15,
    timeLimitSeconds: 30,
    minPassScore: 70,
    questions: [
      {
        id: 'q1',
        text: 'A derivada da função f(x) = x² é igual a 2x?',
        type: 'TRUE_FALSE',
        correctAnswer: 'TRUE',
        points: 50
      },
      {
        id: 'q2',
        text: 'A soma dos ângulos internos de um triângulo equilátero é sempre 180 graus?',
        type: 'TRUE_FALSE',
        correctAnswer: 'TRUE',
        points: 50
      }
    ]
  },
  {
    id: 'test-2',
    title: 'Raciocínio Lógico e Normas Internas',
    timeLimitHours: 1,
    timeLimitMinutes: 10,
    timeLimitSeconds: 45,
    minPassScore: 60,
    questions: [
      {
        id: 'q3',
        text: 'A sigla CLT refere-se à Consolidação das Leis do Trabalho?',
        type: 'TRUE_FALSE',
        correctAnswer: 'TRUE',
        points: 100
      }
    ]
  }
];

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    candidateId: 'cand-1',
    jobId: 'job-1',
    status: ApplicationStatus.PENDING_CV,
    appliedAt: new Date().toISOString(),
    cvUrl: '#'
  }
];
