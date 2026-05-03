'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { apiUploadAvatar } from '@/utils/api';
import toast from 'react-hot-toast';

interface ProfilePhotoUploadProps {
  currentAvatar?: string;
  userName: string;
  onUploadSuccess: (newAvatarUrl: string) => void;
}

export default function ProfilePhotoUpload({ currentAvatar, userName, onUploadSuccess }: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }

    try {
      setIsUploading(true);
      const response = await apiUploadAvatar(file);
      onUploadSuccess(response.avatar);
      toast.success('Foto de perfil atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Erro ao fazer upload da foto.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative group">
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-800 border-4 border-white/10 flex items-center justify-center overflow-hidden relative">
        {currentAvatar ? (
          <img src={currentAvatar} alt={userName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl md:text-4xl font-bold text-gray-500 uppercase">{userName.charAt(0)}</span>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="absolute bottom-0 right-0 p-2 bg-[#FF6B35] text-white rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
        title="Alterar foto"
      >
        <Camera className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
