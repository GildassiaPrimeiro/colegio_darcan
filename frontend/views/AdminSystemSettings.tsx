
import React from 'react';
import { SystemConfig } from '../types';
import { Settings, Globe, Monitor, Bell, Save, Info } from 'lucide-react';

interface AdminSystemSettingsProps {
  systemConfig: SystemConfig;
  onUpdateSystemConfig: (config: SystemConfig) => void;
}

const AdminSystemSettings: React.FC<AdminSystemSettingsProps> = ({ systemConfig, onUpdateSystemConfig }) => {
  const handleUpdateSystem = (field: keyof SystemConfig, value: any) => {
    onUpdateSystemConfig({
      ...systemConfig,
      [field]: value
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Definições do Sistema</h1>
        <p className="text-gray-500">Configure os parâmetros globais e o branding do portal Darcan.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          {/* Branding & Info */}
          <div className="bg-white rounded-3xl border border-green-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-green-50/10 flex items-center gap-3">
              <Globe className="text-green-600" size={20} />
              <h3 className="font-bold text-gray-900">Branding e Identidade</h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Logotipo da Instituição</label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden p-2">
                      <img src={systemConfig.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <label className="block">
                        <span className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-green-700 transition-all shadow-lg shadow-green-100">
                          Alterar Logotipo
                        </span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                handleUpdateSystem('logoUrl', reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <p className="text-[10px] text-gray-400">Recomendado: PNG ou JPG quadrado, mín. 200x200px.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome da Instituição</label>
                  <input 
                    type="text" 
                    value={systemConfig.companyName}
                    onChange={(e) => handleUpdateSystem('companyName', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">E-mail de Suporte/RH</label>
                  <input 
                    type="email" 
                    value={systemConfig.notificationEmail}
                    onChange={(e) => handleUpdateSystem('notificationEmail', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quem Somos & Visão Geral */}
          <div className="bg-white rounded-3xl border border-green-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-green-50/10 flex items-center gap-3">
              <Info className="text-green-600" size={20} />
              <h3 className="font-bold text-gray-900">Quem Somos e Visão Geral</h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Título da Secção (Visão Geral)</label>
                  <input 
                    type="text" 
                    value={systemConfig.overviewTitle}
                    onChange={(e) => handleUpdateSystem('overviewTitle', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subtítulo da Secção (Visão Geral)</label>
                  <input 
                    type="text" 
                    value={systemConfig.overviewSubtitle}
                    onChange={(e) => handleUpdateSystem('overviewSubtitle', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Texto "Quem Somos"</label>
                  <textarea 
                    rows={4}
                    value={systemConfig.aboutUs}
                    onChange={(e) => handleUpdateSystem('aboutUs', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900 resize-none"
                    placeholder="Descreva a instituição..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contactos e Redes Sociais */}
          <div className="bg-white rounded-3xl border border-green-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-green-50/10 flex items-center gap-3">
              <Bell className="text-green-600" size={20} />
              <h3 className="font-bold text-gray-900">Contactos e Redes Sociais</h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Linha de Atendimento</label>
                  <input 
                    type="text" 
                    value={systemConfig.contactPhone}
                    onChange={(e) => handleUpdateSystem('contactPhone', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">WhatsApp</label>
                  <input 
                    type="text" 
                    value={systemConfig.contactWhatsapp}
                    onChange={(e) => handleUpdateSystem('contactWhatsapp', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Facebook</label>
                  <input 
                    type="text" 
                    value={systemConfig.socialFacebook}
                    onChange={(e) => handleUpdateSystem('socialFacebook', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Instagram</label>
                  <input 
                    type="text" 
                    value={systemConfig.socialInstagram}
                    onChange={(e) => handleUpdateSystem('socialInstagram', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hero Images Management */}
          <div className="bg-white rounded-3xl border border-green-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-green-50/10 flex items-center gap-3">
              <Monitor className="text-green-600" size={20} />
              <h3 className="font-bold text-gray-900">Imagens do Carrossel (Hero)</h3>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-sm text-gray-500">Insira as URLs das imagens que deseja exibir no carrossel da página inicial.</p>
              <div className="space-y-4">
                {systemConfig.heroImages.map((url, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden bg-gray-200 shrink-0 border border-gray-200">
                      {url ? (
                        <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Monitor size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">URL da Imagem {index + 1}</label>
                        <input 
                          type="text" 
                          value={url}
                          onChange={(e) => {
                            const newImages = [...systemConfig.heroImages];
                            newImages[index] = e.target.value;
                            handleUpdateSystem('heroImages', newImages);
                          }}
                          placeholder="https://exemplo.com/imagem.jpg"
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-900 text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        <label className="flex-1">
                          <span className="block w-full py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-center text-[10px] font-bold uppercase cursor-pointer hover:bg-gray-50 transition-colors">
                            Carregar do Dispositivo
                          </span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const newImages = [...systemConfig.heroImages];
                                  newImages[index] = reader.result as string;
                                  handleUpdateSystem('heroImages', newImages);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <button 
                          onClick={() => {
                            const newImages = systemConfig.heroImages.filter((_, i) => i !== index);
                            handleUpdateSystem('heroImages', newImages);
                          }}
                          className="px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        >
                          <Save size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => handleUpdateSystem('heroImages', [...systemConfig.heroImages, ''])}
                  className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl font-bold text-sm hover:border-green-300 hover:text-green-600 transition-all"
                >
                  + Adicionar Nova Imagem
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-green-700 text-white p-8 rounded-3xl shadow-xl shadow-green-100 flex flex-col justify-between aspect-square">
            <div>
              <Settings size={40} className="mb-6 opacity-80" />
              <h3 className="text-2xl font-bold mb-2">Resumo Global</h3>
              <p className="text-green-100 text-sm">Controle total sobre o ambiente de recrutamento da {systemConfig.companyName}.</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Status</span>
                <span className="font-bold">Configurado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemSettings;
