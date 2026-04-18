
import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, Search, ShieldCheck, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

interface LandingPageProps {
  onRegister: () => void;
  onLogin: () => void;
  onExploreJobs: () => void;
  heroImages: string[];
  logoUrl: string;
  systemConfig: any; // Using any for simplicity or I could import SystemConfig
}

const LandingPage: React.FC<LandingPageProps> = ({ onRegister, onLogin, onExploreJobs, heroImages, logoUrl, systemConfig }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const safeHeroImages = heroImages.length > 0
    ? heroImages
    : ['https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800&h=600'];

  useEffect(() => {
    if (safeHeroImages.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % safeHeroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [safeHeroImages.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % safeHeroImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + safeHeroImages.length) % safeHeroImages.length);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <nav className="border-b border-green-50 sticky top-0 bg-white z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-20 items-center">
          <div className="flex items-center gap-3">
            <img 
              src={logoUrl} 
              alt="Logo Darcan" 
              className="w-10 h-10 object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
            <div className="text-2xl font-bold text-green-700">{systemConfig.companyName}</div>
          </div>
          
          <div className="hidden md:flex gap-4">
            <button onClick={onLogin} className="px-5 py-2 text-green-700 font-medium hover:text-green-800">Entrar</button>
            <button onClick={onRegister} className="px-6 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-100">Registrar-se</button>
          </div>

          <button 
            className="md:hidden p-2 text-green-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-green-50 shadow-xl p-6 flex flex-col gap-4 animate-in slide-in-from-top duration-300">
            <button onClick={() => { onLogin(); setIsMenuOpen(false); }} className="w-full py-4 text-green-700 font-bold text-center bg-green-50 rounded-xl">Entrar</button>
            <button onClick={() => { onRegister(); setIsMenuOpen(false); }} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-center">Registrar-se</button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="py-12 lg:py-24 bg-green-50/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Sua carreira de <span className="text-green-600">sucesso</span> começa aqui na {systemConfig.companyName}.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
              Simplificamos o processo de recrutamento para que você encontre a vaga ideal e mostre seu potencial através de nossos testes de nivelamento.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button onClick={onExploreJobs} className="px-8 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-xl shadow-green-200 flex items-center justify-center gap-2">
                Explorar Vagas <ArrowRight size={20} />
              </button>
              <button onClick={onRegister} className="px-8 py-4 bg-white text-green-700 border-2 border-green-100 rounded-xl font-bold text-lg hover:bg-green-50 transition-all flex items-center justify-center gap-2">
                Crie seu Perfil
              </button>
            </div>
          </div>
          
          <div className="flex-1 relative group w-full max-w-2xl mx-auto order-1 lg:order-2">
            <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden rounded-3xl shadow-2xl border-4 sm:border-8 border-white bg-white">
              <div 
                className="flex h-full transition-transform duration-700 ease-in-out" 
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {safeHeroImages.map((src, i) => (
                  <img 
                    key={i} 
                    src={src} 
                    alt={`Slide ${i + 1}`} 
                    className="w-full h-full flex-shrink-0 object-cover"
                  />
                ))}
              </div>

              {/* Navigation Arrows (visible only on hover in large screens) */}
              <button 
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-green-700 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-green-700 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronRight size={20} />
              </button>

              {/* Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
                {safeHeroImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2 rounded-full transition-all ${
                      currentSlide === i ? 'bg-green-600 w-4 sm:w-6' : 'bg-gray-300 w-2'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="absolute -bottom-4 sm:-bottom-6 -left-2 sm:-left-6 bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-green-50 z-10 hidden sm:block">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg text-green-600">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Processo Transparente</p>
                  <p className="text-xs text-gray-500">Feedback em cada etapa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Quem Somos</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                {systemConfig.aboutUs}
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <div className="aspect-video rounded-3xl overflow-hidden shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800" 
                  alt="Team" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits / Overview Section */}
      <section className="py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl font-bold text-gray-900">{systemConfig.overviewTitle}</h2>
            <p className="text-gray-500 mt-2">{systemConfig.overviewSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {[
              { icon: <Search className="text-green-600" size={32} />, title: "Candidatura Simples", desc: "Encontre a vaga ideal para o seu perfil e envie seu currículo em poucos cliques." },
              { icon: <ShieldCheck className="text-green-600" size={32} />, title: "Testes Online", desc: "Realize avaliações técnicas cronometradas para validar suas competências." },
              { icon: <ArrowRight className="text-green-600" size={32} />, title: "Acompanhamento", desc: "Acompanhe em tempo real o status do seu processo e receba feedbacks." },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 sm:p-8 rounded-2xl border border-green-50 hover:border-green-200 transition-colors group text-center sm:text-left shadow-sm">
                <div className="mx-auto sm:mx-0 mb-6 p-4 bg-green-50 rounded-2xl w-fit group-hover:bg-green-100 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer / Contacts */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img 
                  src={logoUrl} 
                  alt="Logo Darcan" 
                  className="w-10 h-10 object-contain rounded-lg bg-white p-1"
                />
                <span className="text-2xl font-bold">{systemConfig.companyName}</span>
              </div>
              <p className="text-gray-400 max-w-md mb-8">
                Transformando o futuro através da educação e conectando talentos às melhores oportunidades.
              </p>
              <div className="flex gap-4">
                {systemConfig.socialFacebook && (
                  <a href={`https://${systemConfig.socialFacebook}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                    <span className="sr-only">Facebook</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                {systemConfig.socialInstagram && (
                  <a href={`https://${systemConfig.socialInstagram}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                    <span className="sr-only">Instagram</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-6">Contactos</h4>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-center gap-3">
                  <span className="text-green-500 font-bold">T:</span> {systemConfig.contactPhone}
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 font-bold">W:</span> {systemConfig.contactWhatsapp}
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 font-bold">E:</span> {systemConfig.notificationEmail}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-6">Links Rápidos</h4>
              <ul className="space-y-4 text-gray-400">
                <li><button onClick={onLogin} className="hover:text-green-500 transition-colors">Entrar</button></li>
                <li><button onClick={onRegister} className="hover:text-green-500 transition-colors">Registrar-se</button></li>
                <li><button onClick={onExploreJobs} className="hover:text-green-500 transition-colors">Vagas</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-16 pt-8 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} {systemConfig.companyName}. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
