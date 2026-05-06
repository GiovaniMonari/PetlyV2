'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PawPrint, Mail, Lock, User, MapPin, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { searchLocation } from '@/utils/location';
import { useDebounce } from '@/hooks/useDebounce';
import { apiRegister } from '@/utils/api';

export default function CadastroPage() {
  const [accountType, setAccountType] = useState<'tutor' | 'cuidador'>('tutor');
  
  // Shared & Tutor State
  const [name, setName] = useState('');
  
  // Caregiver State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    cpf: '',
    location: '',
  });

  const [errors, setErrors] = useState({
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
  const debouncedLocation = useDebounce(formData.location, 500);
  const isDebouncing = formData.location !== debouncedLocation && formData.location.length > 2;
  const showLoading = isSearching || isDebouncing;

  // Color variables depending on account type
  const primaryColor = accountType === 'tutor' ? 'text-[#06A77D]' : 'text-[#FF6B35]';
  const primaryBg = accountType === 'tutor' ? 'bg-[#06A77D]' : 'bg-[#FF6B35]';
  const primaryHoverBg = accountType === 'tutor' ? 'hover:bg-[#058b68]' : 'hover:bg-[#E55A2B]';
  const primaryRing = accountType === 'tutor' ? 'focus:ring-[#06A77D]/50' : 'focus:ring-[#FF6B35]/50';
  const primaryBorder = accountType === 'tutor' ? 'focus:border-[#06A77D]/50' : 'focus:border-[#FF6B35]/50';

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedLocation.length > 2 && showSuggestions && accountType === 'cuidador') {
        setIsSearching(true);
        const results = await searchLocation(debouncedLocation);
        setSuggestions(results);
        setIsSearching(false);
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [debouncedLocation, showSuggestions, accountType]);

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
    switch (name) {
      case 'email':
        if (!value) error = 'Email é obrigatório';
        else if (!isValidEmail(value)) error = 'Email inválido';
        break;
      case 'cpf':
        if (!value) error = 'CPF é obrigatório';
        else if (!isValidCPF(value)) error = 'CPF inválido';
        break;
      case 'location':
        if (!value) error = 'Localização é obrigatória';
        break;
      case 'password':
        if (!value) error = 'Senha é obrigatória';
        else if (value.length < 6) error = 'A senha deve ter pelo menos 6 caracteres';
        break;
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    
    if (!name.trim()) {
      setApiError('Preencha o seu nome completo');
      return;
    }

    if (accountType === 'cuidador') {
      const isEmailValid = validateField('email', formData.email);
      const isCpfValid = validateField('cpf', formData.cpf);
      const isLocationValid = validateField('location', formData.location);
      const isPasswordValid = validateField('password', formData.password);

      setTouched({ email: true, cpf: true, location: true, password: true });

      if (!(isEmailValid && isCpfValid && isLocationValid && isPasswordValid)) {
        return;
      }
    } else {
      // Tutor validation
      if (!formData.email || !formData.password) {
        setApiError('Preencha todos os campos');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (accountType === 'tutor') {
        await apiRegister({
          name,
          email: formData.email,
          password: formData.password,
          role: 'tutor',
        });
      } else {
        await apiRegister({
          name: name.trim(),
          email: formData.email,
          password: formData.password,
          cpf: formData.cpf.replace(/\D/g, ''),
          location: formData.location,
          role: 'caregiver',
        });
      }
      router.push('/');
    } catch (err: any) {
      setApiError(err.message || 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className={`absolute top-0 right-1/2 translate-x-1/2 w-[800px] h-[400px] ${accountType === 'tutor' ? 'bg-[#06A77D]/10' : 'bg-[#FF6B35]/10'} blur-[120px] rounded-full pointer-events-none transition-colors duration-700`}></div>
      <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] ${accountType === 'tutor' ? 'bg-[#FF6B35]/10' : 'bg-[#06A77D]/10'} blur-[120px] rounded-full pointer-events-none transition-colors duration-700`}></div>

      <div className="w-full max-w-md relative z-10 py-8">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className={`${accountType === 'tutor' ? 'bg-[#06A77D]/10 group-hover:bg-[#06A77D]/20' : 'bg-[#FF6B35]/10 group-hover:bg-[#FF6B35]/20'} p-3 rounded-2xl transition-colors duration-500`}>
              <PawPrint className={`w-8 h-8 ${primaryColor} transition-colors duration-500`} />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">Petly</span>
          </Link>
          <h1 className="text-2xl font-semibold text-white mb-2 text-center">Crie sua conta</h1>
          <p className="text-gray-400 text-center">Junte-se à Petly e encontre o que precisa para o seu amigão.</p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-visible">
          {/* Shine effect on card */}
          <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent ${accountType === 'tutor' ? 'via-[#06A77D]/50' : 'via-[#FF6B35]/50'} to-transparent transition-colors duration-500`}></div>

          {apiError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium text-center">
              {apiError}
            </div>
          )}

          {/* Account Type Selector */}
          <div className="flex bg-black/40 rounded-xl p-1 mb-8">
            <button
              onClick={() => setAccountType('tutor')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                accountType === 'tutor' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Sou Tutor
            </button>
            <button
              onClick={() => setAccountType('cuidador')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                accountType === 'cuidador' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Sou Cuidador
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2 animate-in fade-in duration-300">
                <label className="text-sm font-medium text-gray-300 ml-1">Nome Completo</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className={`h-5 w-5 text-gray-500 group-focus-within:${primaryColor} transition-colors`} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full bg-black/40 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 outline-none ${primaryBorder} ${primaryRing} focus:ring-1 transition-all placeholder:text-gray-600`}
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

            <div className="space-y-2 animate-in fade-in duration-300">
              <label className="text-sm font-medium text-gray-300 ml-1">E-mail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 text-gray-500 group-focus-within:${primaryColor} transition-colors`} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-black/40 border ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : `border-white/10 ${primaryBorder} ${primaryRing}`
                  } text-white rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-1 transition-all placeholder:text-gray-600`}
                  placeholder="seu@email.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500 font-medium ml-1">{errors.email}</p>}
            </div>

            {accountType === 'cuidador' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-300">
                <label className="text-sm font-medium text-gray-300 ml-1">CPF</label>
                <div className="relative group">
                  <input
                    type="text"
                    name="cpf"
                    required
                    value={formData.cpf}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={`w-full bg-black/40 border ${
                      errors.cpf ? 'border-red-500 focus:ring-red-500' : `border-white/10 ${primaryBorder} ${primaryRing}`
                    } text-white rounded-xl py-3 px-4 outline-none focus:ring-1 transition-all placeholder:text-gray-600`}
                  />
                </div>
                {errors.cpf && <p className="mt-1 text-xs text-red-500 font-medium ml-1">{errors.cpf}</p>}
              </div>
            )}

            {accountType === 'cuidador' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-300 relative">
                <label className="text-sm font-medium text-gray-300 ml-1">Localização</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className={`h-5 w-5 text-gray-500 group-focus-within:${primaryColor} transition-colors`} />
                  </div>
                  <input
                    type="text"
                    name="location"
                    required
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
                    className={`w-full bg-black/40 border ${
                      errors.location ? 'border-red-500 focus:ring-red-500' : `border-white/10 ${primaryBorder} ${primaryRing}`
                    } text-white rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-1 transition-all placeholder:text-gray-600`}
                    autoComplete="off"
                  />

                  {/* Autocomplete Dropdown */}
                  {showSuggestions && (suggestions.length > 0 || isSearching) && (
                    <div className="absolute z-50 w-full mt-2 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      {showLoading ? (
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
                            className={`px-4 py-3 text-sm text-gray-300 hover:bg-white/10 cursor-pointer transition-colors ${idx !== suggestions.length -1 ? 'border-b border-white/5' : ''}`}
                          >
                            {sug}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {errors.location && <p className="mt-1 text-xs text-red-500 font-medium ml-1">{errors.location}</p>}
              </div>
            )}

            <div className="space-y-2 animate-in fade-in duration-300">
              <label className="text-sm font-medium text-gray-300 ml-1">Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 text-gray-500 group-focus-within:${primaryColor} transition-colors`} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full bg-black/40 border ${
                    errors.password ? 'border-red-500 focus:ring-red-500' : `border-white/10 ${primaryBorder} ${primaryRing}`
                  } text-white rounded-xl py-3 pl-11 pr-11 outline-none focus:ring-1 transition-all placeholder:text-gray-600`}
                  placeholder={accountType === 'tutor' ? "Crie uma senha forte" : "Mínimo 6 caracteres"}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password.length > 0 && (
                <div className="mt-2 flex items-center gap-2 ml-1">
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
              {errors.password && <p className="mt-1 text-xs text-red-500 font-medium ml-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full relative group overflow-hidden ${primaryBg} text-white font-semibold rounded-xl py-3 px-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-6`}
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <span className="inline-block animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span>
                ) : (
                  <>
                    Criar Conta <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-4">
            <p className="text-gray-400 text-sm">
              Já possui uma conta?{' '}
              <Link href="/login" className={`${primaryColor} font-semibold hover:text-white transition-colors`}>
                Faça login
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
