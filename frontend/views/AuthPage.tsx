
import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, ChevronLeft, CheckCircle2, ShieldCheck, Briefcase, Settings, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../types';

interface AuthPageProps {
  initialMode: 'LOGIN' | 'REGISTER';
  onAuth: (payload: { mode: 'LOGIN' | 'REGISTER'; role: UserRole; name: string; email: string; password: string }) => void;
  onBack: () => void;
  companyName: string;
}

const AuthPage: React.FC<AuthPageProps> = ({ initialMode, onAuth, onBack, companyName }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(initialMode);
  const [role, setRole] = useState<UserRole>(UserRole.CANDIDATE);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    Promise.resolve(
      onAuth({
        mode,
        role,
        name,
        email,
        password,
      })
    ).finally(() => setIsLoading(false));
  };

  // Cores dinâmicas com base no papel selecionado
  const getThemeClasses = () => {
    switch (role) {
      case UserRole.ADMIN:
        return {
          accent: 'text-slate-900',
          button: 'bg-slate-900 hover:bg-slate-800',
          focus: 'focus:border-slate-900',
          shadow: 'shadow-slate-200',
          bg: 'bg-slate-50'
        };
      case UserRole.MANAGER:
        return {
          accent: 'text-green-700',
          button: 'bg-green-700 hover:bg-green-800',
          focus: 'focus:border-green-700',
          shadow: 'shadow-green-100',
          bg: 'bg-green-50'
        };
      default:
        return {
          accent: 'text-green-600',
          button: 'bg-green-600 hover:bg-green-700',
          focus: 'focus:border-green-600',
          shadow: 'shadow-green-100',
          bg: 'bg-green-50'
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row animate-in fade-in duration-500">
      {/* Coluna de Branding/Promoção (Esquerda) */}
      <div className={`hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden transition-colors duration-500 ${role === UserRole.ADMIN ? 'bg-slate-900' : 'bg-green-700'}`}>
        <div className="relative z-10">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-bold mb-12"
          >
            <ChevronLeft size={20} /> Voltar ao início
          </button>
          
          <div className="space-y-6">
            <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
              {role === UserRole.ADMIN ? (
                <>Gestão centralizada e <span className="text-emerald-400">controlo total</span>.</>
              ) : (
                <>A porta de entrada para os melhores talentos e as maiores oportunidades <span className="text-emerald-400">Só aqui no Sistema Darcan</span>.</>
              )}
            </h2>
            <p className="text-white/80 text-lg max-w-md">
              {role === UserRole.ADMIN 
                ? 'Aceda às ferramentas administrativas para configurar o sistema, gerir a equipa e monitorizar o ecossistema Darcan.'
                : 'Junte-se a milhares de profissionais que já transformaram suas carreiras através da plataforma de recrutamento mais avançada do país.'}
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex gap-4 items-start">
            <div className={`p-3 rounded-2xl border ${role === UserRole.ADMIN ? 'bg-slate-800 border-slate-700' : 'bg-green-600/50 border-green-500/30'}`}>
              <CheckCircle2 className="text-emerald-400" size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold">{role === UserRole.ADMIN ? 'Auditoria Completa' : 'Feedback em Tempo Real'}</h4>
              <p className="text-white/60 text-sm">{role === UserRole.ADMIN ? 'Monitorize cada ação realizada no portal.' : 'Saiba o status da sua candidatura em cada etapa.'}</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className={`p-3 rounded-2xl border ${role === UserRole.ADMIN ? 'bg-slate-800 border-slate-700' : 'bg-green-600/50 border-green-500/30'}`}>
              <ShieldCheck className="text-emerald-400" size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold">Segurança Robusta</h4>
              <p className="text-white/60 text-sm">Proteção de dados em conformidade com os mais altos padrões.</p>
            </div>
          </div>
        </div>

        {/* Elementos Decorativos de Fundo */}
        <div className={`absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full blur-[100px] opacity-50 transition-colors duration-500 ${role === UserRole.ADMIN ? 'bg-slate-800' : 'bg-green-600'}`} />
        <div className={`absolute bottom-[-5%] left-[-5%] w-64 h-64 rounded-full blur-[80px] opacity-30 transition-colors duration-500 ${role === UserRole.ADMIN ? 'bg-emerald-900' : 'bg-emerald-500'}`} />
      </div>

      {/* Coluna de Formulário (Direita) */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-12 lg:p-20 bg-white">
        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="lg:hidden flex justify-between items-center mb-4">
            <span className={`text-2xl font-bold ${role === UserRole.ADMIN ? 'text-slate-900' : 'text-green-700'}`}>{companyName}</span>
            <button onClick={onBack} className="text-gray-400"><ChevronLeft size={24} /></button>
          </div>

          <header>
            <div className="flex items-center gap-2 mb-2">
               {role === UserRole.ADMIN && <Settings className="text-slate-900" size={20} />}
               {role === UserRole.MANAGER && <Briefcase className="text-green-700" size={20} />}
               <span className={`text-xs font-black uppercase tracking-[0.2em] ${theme.accent}`}>
                 {role === UserRole.ADMIN ? 'Área Administrativa' : role === UserRole.MANAGER ? 'Portal do Gestor' : 'Portal do Candidato'}
               </span>
            </div>
            <h1 className="text-3xl font-black text-black tracking-tight">
              {mode === 'LOGIN' ? 'Autenticação' : (role === UserRole.ADMIN ? 'Cadastro de Administrador' : 'Crie sua conta gratuita')}
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              {mode === 'LOGIN' 
                ? 'Insira as suas credenciais para aceder ao sistema.' 
                : (role === UserRole.ADMIN 
                   ? 'Configure o seu acesso mestre para a plataforma Darcan.' 
                   : 'Comece hoje mesmo a sua jornada profissional na Darcan.')}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'REGISTER' && (
              <div className="space-y-2">
                <label className="text-xs font-black text-black uppercase tracking-widest">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input 
                    type="text" 
                    required
                    placeholder="Como devemos lhe chamar?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white outline-none transition-all font-medium text-black ${theme.focus}`}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-black uppercase tracking-widest">Endereço de E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  type="email" 
                  required
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white outline-none transition-all font-medium text-black ${theme.focus}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-black uppercase tracking-widest">Palavra-passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white outline-none transition-all font-medium text-black ${theme.focus}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-700"
                  aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {mode === 'LOGIN' && (
              <div className="flex justify-end">
                <button type="button" className={`text-sm font-bold hover:underline ${theme.accent}`}>Esqueceu a senha?</button>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${
                isLoading ? 'bg-gray-100 text-gray-400' : `${theme.button} text-white active:scale-[0.98] ${theme.shadow}`
              }`}
            >
              {isLoading ? (
                <div className={`w-6 h-6 border-4 border-gray-300 rounded-full animate-spin ${role === UserRole.ADMIN ? 'border-t-slate-900' : 'border-t-green-600'}`} />
              ) : (
                <>
                  {mode === 'LOGIN' ? 'Entrar no Sistema' : (role === UserRole.ADMIN ? 'Criar Conta Admin' : 'Criar meu Perfil')}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="hidden">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-gray-400 font-bold tracking-widest">Alterar Perfil de Acesso</span></div>
          </div>

          <div className="hidden grid grid-cols-3 gap-3">
            <button 
              onClick={() => { setRole(UserRole.CANDIDATE); setMode('LOGIN'); }}
              className={`py-3 px-2 border-2 rounded-xl text-[10px] font-black uppercase tracking-tighter flex flex-col items-center gap-2 transition-all ${
                role === UserRole.CANDIDATE ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-50 text-gray-400 hover:border-gray-200'
              }`}
            >
              <UserIcon size={16} /> Candidato
            </button>
            <button 
              onClick={() => { setRole(UserRole.MANAGER); setMode('LOGIN'); }}
              className={`py-3 px-2 border-2 rounded-xl text-[10px] font-black uppercase tracking-tighter flex flex-col items-center gap-2 transition-all ${
                role === UserRole.MANAGER ? 'border-green-700 bg-green-50 text-green-800' : 'border-gray-50 text-gray-400 hover:border-gray-200'
              }`}
            >
              <Briefcase size={16} /> Gestor
            </button>
            <button 
              onClick={() => { setRole(UserRole.ADMIN); setMode('LOGIN'); }}
              className={`py-3 px-2 border-2 rounded-xl text-[10px] font-black uppercase tracking-tighter flex flex-col items-center gap-2 transition-all ${
                role === UserRole.ADMIN ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-gray-50 text-gray-400 hover:border-gray-200'
              }`}
            >
              <ShieldCheck size={16} /> Admin
            </button>
          </div>

          <footer className="text-center pt-4">
            {role === UserRole.CANDIDATE || role === UserRole.ADMIN ? (
              <p className="text-gray-500 font-medium">
                {mode === 'LOGIN' ? 'Não possui uma conta?' : 'Já tem uma conta?'}
                <button 
                  onClick={() => setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                  className={`ml-2 font-black hover:underline ${theme.accent}`}
                >
                  {mode === 'LOGIN' ? (role === UserRole.ADMIN ? 'Cadastrar Administrador' : 'Cadastre-se agora') : 'Faça login'}
                </button>
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">
                Acessos de gestão são geridos centralizadamente pela administração Darcan.
              </p>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
