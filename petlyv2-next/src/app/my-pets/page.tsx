'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Dog, 
  Cat, 
  Bird, 
  PawPrint, 
  Camera,
  X,
  Loader2,
  Calendar,
  Ruler,
  Heart,
  Sparkles,
  Shield,
  AlertCircle,
  FileText,
  Lock
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  getUser, 
  apiGetMyPets, 
  apiCreatePet, 
  apiUpdatePet, 
  apiDeletePet,
  apiUploadPetAvatar 
} from '@/utils/api';
import { toast } from 'react-hot-toast';

// Enums baseados no schema
enum PetType {
  DOG = 'dog',
  CAT = 'cat',
  BIRD = 'bird',
  OTHER = 'other',
}

enum PetSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

// Interface baseada no Pet Schema
interface Pet {
  _id: string;
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  type: PetType;
  size: PetSize;
  age: number;
  breed: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// DTO baseado no CreatePetDto
interface CreatePetFormData {
  name: string;
  avatar?: string;
  type: PetType;
  size: PetSize;
  age: number | undefined;
  breed: string;
  notes?: string;
}

const PET_TYPES = [
  { value: PetType.DOG, label: 'Cachorro', icon: Dog, color: '#FF6B35' },
  { value: PetType.CAT, label: 'Gato', icon: Cat, color: '#06A77D' },
  { value: PetType.BIRD, label: 'Pássaro', icon: Bird, color: '#7C3AED' },
  { value: PetType.OTHER, label: 'Outro', icon: PawPrint, color: '#F59E0B' },
] as const;

const PET_SIZES = [
  { 
    value: PetSize.SMALL, 
    label: 'Pequeno', 
    description: 'Até 10kg',
    examples: 'Ex: Shih Tzu, Pinscher, Yorkshire'
  },
  { 
    value: PetSize.MEDIUM, 
    label: 'Médio', 
    description: '10kg - 25kg',
    examples: 'Ex: Beagle, Bulldog, Cocker Spaniel'
  },
  { 
    value: PetSize.LARGE, 
    label: 'Grande', 
    description: 'Acima de 25kg',
    examples: 'Ex: Golden Retriever, Pastor Alemão, Labrador'
  },
] as const;

const emptyFormData: CreatePetFormData = {
  name: '',
  avatar: undefined,
  type: PetType.DOG,
  size: PetSize.SMALL,
  age: undefined,
  breed: '',
  notes: '',
};

export default function MyPetsPage() {
  const router = useRouter();
  const user = getUser();
  
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState<CreatePetFormData>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Verificar se o tipo selecionado é cachorro
  const isDog = formData.type === PetType.DOG;
  
  // Verificar se deve mostrar o campo de porte (apenas para cachorros)
  const shouldShowSize = isDog;

  useEffect(() => {
    if (!user) {
      toast.error('Faça login para gerenciar seus pets');
      router.push('/login');
      return;
    }

    if (user.role !== 'tutor') {
      toast.error('Apenas tutores podem gerenciar pets');
      router.push('/');
      return;
    }

    fetchPets();
  }, [user, router]);

  // Efeito para resetar o porte quando não for cachorro
  useEffect(() => {
    if (!isDog) {
      setFormData(prev => ({ ...prev, size: PetSize.SMALL }));
    }
  }, [formData.type, isDog]);

  const fetchPets = async () => {
    try {
      const data = await apiGetMyPets();
      setPets(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar pets:', error);
      toast.error(error?.message || 'Erro ao carregar seus pets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPet(null);
    setFormData(emptyFormData);
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (pet: Pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      avatar: pet.avatar,
      type: pet.type,
      size: pet.size,
      age: pet.age,
      breed: pet.breed,
      notes: pet.notes || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPet(null);
    setFormData(emptyFormData);
    setFormErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Limpar erro do campo quando começar a digitar
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? undefined : Number(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: numValue,
    }));
    
    // Limpar erro do campo
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome do pet é obrigatório';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (formData.name.trim().length > 50) {
      errors.name = 'Nome deve ter no máximo 50 caracteres';
    }

    if (!formData.breed.trim()) {
      errors.breed = 'Raça é obrigatória';
    } else if (formData.breed.trim().length < 2) {
      errors.breed = 'Raça deve ter pelo menos 2 caracteres';
    }

    if (formData.age === undefined || formData.age === null) {
      errors.age = 'Idade é obrigatória';
    } else if (formData.age < 0) {
      errors.age = 'Idade não pode ser negativa';
    } else if (formData.age > 30) {
      errors.age = 'Idade máxima é 30 anos';
    } else if (!Number.isInteger(formData.age)) {
      errors.age = 'Idade deve ser um número inteiro';
    }

    // Validar porte apenas se for cachorro
    if (isDog && !formData.size) {
      errors.size = 'Porte é obrigatório para cachorros';
    }

    if (formData.notes && formData.notes.length > 500) {
      errors.notes = 'Observações devem ter no máximo 500 caracteres';
    }

    setFormErrors(errors);
    
    // Mostrar primeiro erro como toast
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        size: formData.size,
        age: formData.age!,
        breed: formData.breed.trim(),
        ...(formData.notes?.trim() && { notes: formData.notes.trim() }),
      };

      if (editingPet) {
        const petId = editingPet._id || editingPet.id;
        await apiUpdatePet(petId, payload);
        toast.success(`${formData.name} foi atualizado com sucesso! ✨`);
      } else {
        await apiCreatePet(payload);
        toast.success(`${formData.name} foi cadastrado com sucesso! 🎉`);
      }
      
      await fetchPets();
      handleCloseModal();
    } catch (error: any) {
      console.error('Erro ao salvar pet:', error);
      const message = error?.message || 'Erro ao salvar pet. Tente novamente.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (pet: Pet) => {
    const petId = pet._id || pet.id;
    setDeleteTarget({ id: petId, name: pet.name });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await apiDeletePet(deleteTarget.id);
      toast.success(`${deleteTarget.name} foi removido com sucesso`);
      setPets(prev => prev.filter(p => (p._id || p.id) !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error: any) {
      console.error('Erro ao deletar pet:', error);
      toast.error(error?.message || 'Erro ao remover pet. Tente novamente.');
    }
  };

  const handleAvatarUpload = async (petId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    try {
      const updatedPet = await apiUploadPetAvatar(petId, file);
      setPets(prev => 
        prev.map(p => 
          (p._id || p.id) === petId 
            ? { ...p, avatar: updatedPet.avatar }
            : p
        )
      );
      toast.success('Foto atualizada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error(error?.message || 'Erro ao atualizar foto. Tente novamente.');
    }
  };

  const getPetIcon = (type: PetType) => {
    const petType = PET_TYPES.find(t => t.value === type);
    return petType?.icon || PawPrint;
  };

  const getPetColor = (type: PetType) => {
    const petType = PET_TYPES.find(t => t.value === type);
    return petType?.color || '#FF6B35';
  };

  const getSizeLabel = (size: PetSize) => {
    const petSize = PET_SIZES.find(s => s.value === size);
    return petSize?.label || size;
  };

  const getSizeDescription = (size: PetSize) => {
    const petSize = PET_SIZES.find(s => s.value === size);
    return petSize?.description || '';
  };

  if (!user || user.role !== 'tutor') {
    return null;
  }

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-[#FF6B35] rounded-full shadow-[0_0_10px_rgba(255,107,53,0.8)]"></div>
                  <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Meus Pets</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  Seus companheiros
                </h1>
                <p className="text-lg text-gray-400 font-medium">
                  Gerencie os pets que você cadastrou para encontrar o cuidador ideal
                </p>
              </div>
              
              <button
                onClick={handleOpenCreate}
                className="bg-[#FF6B35] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#E55A2B] active:scale-95 transition-all shadow-lg shadow-[#FF6B35]/20 flex items-center gap-2 whitespace-nowrap w-full sm:w-auto justify-center"
              >
                <Plus className="w-5 h-5" />
                Novo Pet
              </button>
            </div>

            {/* Info Banner */}
            <div className="bg-[#FF6B35]/5 border border-[#FF6B35]/20 rounded-xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#FF6B35] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-300 font-medium">
                  Dica importante
                </p>
                <p className="text-sm text-gray-400">
                  Preencha todos os campos obrigatórios (nome, tipo, idade e raça) para que os cuidadores 
                  possam oferecer o melhor serviço para seu pet. O porte é obrigatório apenas para cachorros.
                </p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400">Carregando seus pets...</p>
            </div>
          ) : pets.length === 0 ? (
            /* Empty State */
            <div className="py-20 text-center bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="mb-6 inline-flex p-6 bg-white/5 rounded-full">
                <PawPrint className="w-12 h-12 text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Nenhum pet cadastrado
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Cadastre seus pets com informações detalhadas para encontrar o cuidador perfeito
              </p>
              <button
                onClick={handleOpenCreate}
                className="px-8 py-3 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-[#E55A2B] active:scale-95 transition-all shadow-md inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Cadastrar primeiro pet
              </button>
            </div>
          ) : (
            /* Pets Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.map((pet) => {
                const PetIcon = getPetIcon(pet.type);
                const petColor = getPetColor(pet.type);
                const petId = pet._id || pet.id;
                
                return (
                  <div
                    key={petId}
                    className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden transition-all hover:shadow-xl hover:shadow-[#FF6B35]/10 hover:border-[#FF6B35]/50 group"
                  >
                    {/* Pet Avatar */}
                    <div className="relative h-48 overflow-hidden bg-black/40 flex items-center justify-center">
                      {pet.avatar ? (
                        <>
                          <Image
                            src={pet.avatar}
                            alt={pet.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <PetIcon className="w-16 h-16 transition-colors" style={{ color: petColor }} />
                        </div>
                      )}
                      
                      {/* Type Badge */}
                      <div 
                        className="absolute top-3 right-3 px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 backdrop-blur-md"
                        style={{ 
                          backgroundColor: `${petColor}30`,
                          borderColor: `${petColor}50`,
                          color: petColor 
                        }}
                      >
                        <PetIcon className="w-3.5 h-3.5" />
                        {PET_TYPES.find(t => t.value === pet.type)?.label}
                      </div>

                      {/* Upload Avatar Button */}
                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleAvatarUpload(petId, file);
                          };
                          input.click();
                        }}
                        className="absolute bottom-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110"
                        title="Alterar foto"
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          {pet.name}
                          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                        </h3>
                        {pet.createdAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(pet.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                      
                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/5 rounded-lg p-2.5">
                          <p className="text-xs text-gray-500 mb-1">Raça</p>
                          <p className="text-sm text-white font-medium truncate">{pet.breed}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2.5">
                          <p className="text-xs text-gray-500 mb-1">Idade</p>
                          <div className="flex items-center gap-1.5 text-sm text-white">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {pet.age} {pet.age === 1 ? 'ano' : 'anos'}
                          </div>
                        </div>
                        {/* Mostrar porte apenas para cachorros */}
                        {pet.type === PetType.DOG && (
                          <div className="bg-white/5 rounded-lg p-2.5">
                            <p className="text-xs text-gray-500 mb-1">Porte</p>
                            <div className="flex items-center gap-1.5 text-sm text-white">
                              <Ruler className="w-3.5 h-3.5 text-gray-400" />
                              {getSizeLabel(pet.size)}
                            </div>
                          </div>
                        )}
                        {pet.type === PetType.DOG && (
                          <div className="bg-white/5 rounded-lg p-2.5">
                            <p className="text-xs text-gray-500 mb-1">Peso ref.</p>
                            <p className="text-sm text-white">{getSizeDescription(pet.size)}</p>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {pet.notes && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <FileText className="w-3 h-3" />
                            Observações
                          </p>
                          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                            {pet.notes}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-white/10">
                        <button
                          onClick={() => handleOpenEdit(pet)}
                          className="flex-1 px-4 py-2.5 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteClick(pet)}
                          className="px-4 py-2.5 bg-red-500/10 text-red-400 font-medium rounded-lg hover:bg-red-500/20 border border-red-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                          title="Remover pet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-white/10 p-6 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FF6B35]" />
                {editingPet ? `Editar: ${editingPet.name}` : 'Novo Pet'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Campos obrigatórios */}
              <div className="bg-[#FF6B35]/5 border border-[#FF6B35]/20 rounded-lg p-3 mb-2">
                <p className="text-xs text-[#FF6B35] font-medium">
                  * Campos obrigatórios
                </p>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Nome do pet <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Thor, Luna, Mingau..."
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-all ${
                    formErrors.name ? 'border-red-400' : 'border-white/10'
                  }`}
                  required
                  minLength={2}
                  maxLength={50}
                />
                {formErrors.name && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Tipo de pet <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PET_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.type === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                        className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35] shadow-lg shadow-[#FF6B35]/10'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <Icon className={`w-5 h-5 transition-transform ${isSelected ? 'scale-110' : ''}`} />
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tamanho/Porte - Visível apenas para cachorros */}
              {shouldShowSize ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Porte <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PET_SIZES.map((size) => {
                      const isSelected = formData.size === size.value;
                      return (
                        <button
                          key={size.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, size: size.value }))}
                          className={`p-3 rounded-xl border transition-all text-left ${
                            isSelected
                              ? 'border-[#FF6B35] bg-[#FF6B35]/10 shadow-lg shadow-[#FF6B35]/10'
                              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg"><Dog className="w-5 h-5" /></span>
                            <span className={`text-sm font-semibold ${isSelected ? 'text-[#FF6B35]' : 'text-white'}`}>
                              {size.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{size.description}</p>
                          <p className="text-[10px] text-gray-600 mt-1">{size.examples}</p>
                        </button>
                      );
                    })}
                  </div>
                  {formErrors.size && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.size}</p>
                  )}
                </div>
              ) : (
                /* Porte bloqueado para não-cachorros */
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Porte
                  </label>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-800 rounded-lg">
                          <Lock className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">Pequeno</p>
                          <p className="text-xs text-gray-500">
                            {formData.type === PetType.CAT && 'Gatos são considerados porte pequeno'}
                            {formData.type === PetType.BIRD && 'Pássaros são considerados porte pequeno'}
                            {formData.type === PetType.OTHER && 'Definido automaticamente como porte pequeno'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg">
                        Automático
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Idade */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Idade (anos) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age ?? ''}
                  onChange={handleNumberInput}
                  min="0"
                  max="30"
                  step="1"
                  placeholder="Ex: 3"
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    formErrors.age ? 'border-red-400' : 'border-white/10'
                  }`}
                  required
                />
                {formErrors.age && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.age}</p>
                )}
              </div>

              {/* Raça */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Raça <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleInputChange}
                  placeholder="Ex: Golden Retriever, Siamês, Calopsita..."
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35] transition-all ${
                    formErrors.breed ? 'border-red-400' : 'border-white/10'
                  }`}
                  required
                  maxLength={50}
                />
                {formErrors.breed && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.breed}</p>
                )}
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  placeholder="Informações adicionais sobre seu pet (comportamento, saúde, preferências...)"
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35] transition-all resize-none ${
                    formErrors.notes ? 'border-red-400' : 'border-white/10'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {formErrors.notes && (
                    <p className="text-red-400 text-xs">{formErrors.notes}</p>
                  )}
                  <p className="text-xs text-gray-500 ml-auto">
                    {(formData.notes || '').length}/500
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-[#E55A2B] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B35]/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingPet ? 'Salvar alterações' : 'Cadastrar pet'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-md p-6 animate-in">
            <div className="text-center mb-6">
              <div className="inline-flex p-4 bg-red-500/10 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Remover {deleteTarget.name}?
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Esta ação não pode ser desfeita. Todas as informações deste pet serão permanentemente removidas.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-6 py-3 bg-white/5 text-gray-300 font-semibold rounded-xl hover:bg-white/10 transition-all border border-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}