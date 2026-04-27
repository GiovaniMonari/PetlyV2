'use client';

import { X, CheckCircle, Mail, MapPin, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { searchLocation } from '@/utils/location';
import { apiRegister } from '@/utils/api';
import { useRouter } from 'next/navigation';

const BecomeCaregiverModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    location: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    location: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const router = useRouter();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', email: '', password: '', cpf: '', location: '' });
      setErrors({ name: '', email: '', password: '', cpf: '', location: '' });
      setTouched({});
      setShowPassword(false);
      setSuggestions([]);
      setShowSuggestions(false);
      setApiError('');
    }
  }, [isOpen]);

  // Debounce API location search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.location.length > 2 && showSuggestions) {
        setIsSearching(true);
        const results = await searchLocation(formData.location);
        setSuggestions(results);
        setIsSearching(false);
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.location, showSuggestions]);

  if (!isOpen) return null;

  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidCPF = (cpf: string) => {
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    // Basic validation to avoid simple repeated digits
    if (/^(\d)\1+$/.test(clean)) return false;
    return true;
  };

  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { score: 0, label: '', color: 'bg-white/10' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[a-zA-Z]/.test(pass) && /\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score, label: 'Fraca', color: 'bg-red-500' };
    if (score === 2) return { score, label: 'Razoável', color: 'bg-yellow-500' };
    if (score >= 3) return { score, label: 'Forte', color: 'bg-green-500' };
    
    return { score: 0, label: '', color: 'bg-white/10' };
  };

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'name') {
      if (!value.trim()) error = 'Nome completo é obrigatório';
    } else if (name === 'email') {
      if (!value) error = 'Email é obrigatório';
      else if (!isValidEmail(value)) error = 'Email inválido';
    } else if (name === 'cpf') {
      if (!value) error = 'CPF é obrigatório';
      else if (!isValidCPF(value)) error = 'CPF inválido';
    } else if (name === 'location') {
      if (!value) error = 'Localização é obrigatória';
    } else if (name === 'password') {
      if (!value) error = 'Senha é obrigatória';
      else if (value.length < 6) error = 'A senha deve ter pelo menos 6 caracteres';
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'cpf') {
      finalValue = maskCPF(value);
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    
    if (touched[name]) {
      validateField(name, finalValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    
    const isNameValid = validateField('name', formData.name);
    const isEmailValid = validateField('email', formData.email);
    const isCpfValid = validateField('cpf', formData.cpf);
    const isLocationValid = validateField('location', formData.location);
    const isPasswordValid = validateField('password', formData.password);

    setTouched({ name: true, email: true, cpf: true, location: true, password: true });

    if (!(isNameValid && isEmailValid && isCpfValid && isLocationValid && isPasswordValid)) {
      return;
    }

    setIsLoading(true);

    try {
      await apiRegister({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        cpf: formData.cpf.replace(/\D/g, ''),
        location: formData.location,
        role: 'caregiver',
      });
      onClose();
      // Optionally redirect or show success state
      // router.push('/dashboard'); 
    } catch (err: any) {
      setApiError(err.message || 'Erro ao criar conta de cuidador');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      />
      <div className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto md:overflow-hidden shadow-2xl flex flex-col md:flex-row transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left side - Info & Motivation */}
        <div className="bg-gradient-to-br from-[#FF6B35] to-[#E55A2B] p-8 md:p-12 text-white md:w-2/5 flex flex-col justify-between relative overflow-hidden shrink-0">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-black opacity-10 blur-2xl pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-6 leading-tight">
                Sua jornada como cuidador começa aqui.
              </h2>
              <div className="space-y-6 mt-8">
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-2 rounded-lg shrink-0">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Processo Rápido</h4>
                    <p className="text-white/80 text-sm mt-1">
                      Leva menos de 1 minuto para criar sua conta.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-2 rounded-lg shrink-0">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Perfil Flexível</h4>
                    <p className="text-white/80 text-sm mt-1">
                      Configure seus serviços e preços posteriormente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative z-10 mt-12 pt-8 border-t border-white/20">
              <p className="text-white/80 text-sm font-medium">Junte-se a mais de</p>
              <p className="text-2xl font-bold mt-1">1.200 cuidadores</p>
              <p className="text-white/80 text-sm mt-1">ganhando dinheiro com a Petly.</p>
            </div>
          </div>

        {/* Right side - Form */}
        <div className="p-8 md:p-12 md:w-3/5 bg-transparent relative overflow-visible md:overflow-y-auto">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-w-md mx-auto">
              <div className="mb-8 pr-6">
                <h3 className="text-2xl font-bold text-white">Criar conta</h3>
                <p className="text-gray-400 mt-2 text-sm">
                  Preencha os dados essenciais
                </p>
                {apiError && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium">
                    {apiError}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 pb-4">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">Nome completo</label>
                  <div className="relative group">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full bg-black/40 border ${errors.name && touched.name ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#FF6B35]/50'} text-white rounded-xl py-3 px-4 outline-none transition-all placeholder:text-gray-600`}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  {errors.name && touched.name && <p className="text-red-400 text-xs ml-1 font-medium">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="seu@email.com"
                      className={`block w-full pl-10 pr-3 py-2.5 border ${
                        errors.email ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-[#FF6B35]'
                      } rounded-lg shadow-sm bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    />
                  </div>
                  {errors.email && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email}</p>}
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                    CPF
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className={`block w-full px-3 py-2.5 border ${
                        errors.cpf ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-[#FF6B35]'
                      } rounded-lg shadow-sm bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    />
                  </div>
                  {errors.cpf && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.cpf}</p>}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                    Localização
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={(e) => {
                        handleChange(e);
                        setShowSuggestions(true);
                      }}
                      onBlur={(e) => {
                        setTimeout(() => {
                          setShowSuggestions(false);
                          handleBlur(e);
                        }, 200);
                      }}
                      placeholder="Sua cidade / Estado"
                      className={`block w-full pl-10 pr-3 py-2.5 border ${
                        errors.location ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-[#FF6B35]'
                      } rounded-lg shadow-sm bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                      autoComplete="off"
                    />
                    
                    {/* Autocomplete Dropdown */}
                    {showSuggestions && (suggestions.length > 0 || isSearching) && (
                      <div className="absolute z-50 w-full mt-1 bg-[#252525] border border-white/10 rounded-lg shadow-lg overflow-hidden">
                        {isSearching ? (
                          <div className="px-4 py-3 text-sm text-gray-400">Buscando...</div>
                        ) : (
                          suggestions.map((sug, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, location: sug }));
                                setShowSuggestions(false);
                                validateField('location', sug);
                              }}
                              className="px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 cursor-pointer transition-colors"
                            >
                              {sug}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {errors.location && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.location}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Mínimo 6 caracteres"
                      className={`block w-full pl-10 pr-10 py-2.5 border ${
                        errors.password ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:ring-[#FF6B35]'
                      } rounded-lg shadow-sm bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.password.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 flex gap-1 h-1.5">
                        <div className={`flex-1 rounded-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-white/10'} transition-colors duration-300`} />
                        <div className={`flex-1 rounded-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-white/10'} transition-colors duration-300`} />
                        <div className={`flex-1 rounded-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-white/10'} transition-colors duration-300`} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        passwordStrength.score <= 1 ? 'text-red-500' : 
                        passwordStrength.score === 2 ? 'text-yellow-500' : 'text-green-500'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                  {errors.password && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.password}</p>}
                </div>

                {/* Info about completing profile later */}
                <div className="bg-[#2E86AB]/10 border border-[#2E86AB]/30 rounded-lg p-3.5 mt-2">
                  <p className="text-xs text-[#89CFF0] leading-relaxed font-medium">
                    <span className="font-bold">Nota:</span> O restante do seu perfil (serviços, preços, especialidades e biografia) poderá ser configurado com calma após a criação da conta.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-[#FF6B35] hover:bg-[#E55A2B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B35] transition-all active:scale-[0.98] mb-2 disabled:opacity-70"
                >
                  {isLoading ? 'Criando conta...' : 'Criar conta'}
                </button>
              </form>
            </div>
          </div>
      </div>
    </div>
  );
};

export default BecomeCaregiverModal;
