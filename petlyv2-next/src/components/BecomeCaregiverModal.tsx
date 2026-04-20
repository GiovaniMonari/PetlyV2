'use client';

import { X, CheckCircle, Upload, MapPin, Smartphone } from 'lucide-react';
import { useState } from 'react';

const BecomeCaregiverModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [formStep, setFormStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    price: '',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 hover:bg-gray-100 rounded-full transition-all"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="grid md:grid-cols-2">
          {/* Left side - Info */}
          <div className="bg-[#FF6B35] p-10 text-white flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-8">
                Comece a ganhar como cuidador
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">
                    Crie seu perfil em 2 minutos
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">
                    Defina seus preços e horários
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">
                    Receba pagamentos seguros
                  </p>
                </div>
              </div>

              <div className="mt-12 pt-6 border-t border-white/30">
                <p className="text-xs font-semibold opacity-80">Sobre Petly</p>
                <p className="text-xl font-bold">1200+ cuidadores</p>
                <p className="text-xs opacity-80 font-medium mt-1">já ganham conosco</p>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="p-10">
            <div>
              {formStep === 0 ? (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Cadastro</h3>
                  <p className="text-gray-600 text-sm mb-8 font-medium">Primeiro, vamos nos conhecer</p>

                  <div className="space-y-5">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition-all text-sm shadow-sm"
                        placeholder="Seu nome"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                        Telefone
                      </label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition-all text-sm shadow-sm"
                          placeholder="(00) 0000-0000"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setFormStep(1)}
                      disabled={!formData.name || !formData.phone}
                      className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 text-sm shadow-md active:scale-95"
                    >
                      Próximo
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Dados Profissionais</h3>
                  <p className="text-gray-600 text-sm mb-8 font-medium">Onde você fica e quanto cobra</p>

                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                          Cidade
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition-all text-sm shadow-sm"
                            placeholder="Sua cidade"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
                          Preço/Dia
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-semibold text-sm">R$</span>
                          <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition-all text-sm shadow-sm"
                            placeholder="00"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Dica</p>
                      <p className="text-sm text-gray-600 font-medium leading-relaxed">
                        Cuidadores experientes cobram R$ 120-200/dia. Comece competitivo!
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setFormStep(0)}
                        className="flex-1 bg-white border border-gray-300 text-gray-900 font-bold py-2.5 rounded-lg transition-all hover:bg-gray-50 active:scale-95 text-sm shadow-sm"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={() => { 
                          alert('Cadastro enviado! Você receberá um email em breve.');
                          onClose();
                        }}
                        disabled={!formData.city || !formData.price}
                        className="flex-1 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-md active:scale-95"
                      >
                        <Upload className="w-4 h-4" />
                        Finalizar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <p className="text-xs text-gray-500 text-center mt-8 font-medium">
              Ao se cadastrar, você concorda com nossos Termos de Uso
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeCaregiverModal;
