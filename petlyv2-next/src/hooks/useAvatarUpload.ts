'use client';

/**
 * useAvatarUpload — hook para upload assíncrono de avatar com UI otimista.
 *
 * Estratégia:
 * 1. O usuário seleciona o arquivo → exibimos o preview local imediatamente
 *    via URL.createObjectURL(), sem esperar o Cloudinary.
 * 2. Enviamos o arquivo para a fila (202 Accepted, ~5 ms).
 * 3. Fazemos polling do perfil em background até o avatar remoto mudar.
 * 4. Substituímos o preview local pela URL definitiva do Cloudinary.
 *
 * Isso garante feedback visual instantâneo enquanto o processamento ocorre
 * de forma assíncrona no servidor.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  apiUploadAvatar,
  apiUploadPetAvatar,
  pollAvatarReady,
  pollPetAvatarReady,
} from '@/utils/api';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface UseAvatarUploadOptions {
  /** URL atual do avatar (antes do upload) — usada como referência para detectar mudança */
  currentAvatar?: string | null;
  /** Chamado quando o avatar remoto estiver disponível */
  onSuccess?: (newAvatarUrl: string) => void;
  /** Chamado em caso de erro */
  onError?: (error: Error) => void;
}

interface UseAvatarUploadReturn {
  /** URL de preview — local (blob) durante o processamento, remota após conclusão */
  previewUrl: string | null;
  status: UploadStatus;
  errorMessage: string | null;
  /** Inicia o upload do avatar do usuário logado */
  uploadUserAvatar: (userId: string, file: File) => Promise<void>;
  /** Inicia o upload do avatar de um pet específico */
  uploadPetAvatar: (petId: string, file: File) => Promise<void>;
  /** Limpa o estado (útil ao fechar um modal) */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAvatarUpload(
  options: UseAvatarUploadOptions = {},
): UseAvatarUploadReturn {
  const { currentAvatar, onSuccess, onError } = options;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mantém referência ao blob URL para revogá-lo quando não for mais necessário
  const blobUrlRef = useRef<string | null>(null);

  const revokeBlobUrl = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  };

  const handleError = useCallback(
    (err: unknown) => {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      revokeBlobUrl();
      setPreviewUrl(null);
      setStatus('error');
      setErrorMessage(error.message);
      onError?.(error);
    },
    [onError],
  );

  const handleSuccess = useCallback(
    (newAvatarUrl: string) => {
      revokeBlobUrl();
      setPreviewUrl(newAvatarUrl);
      setStatus('done');
      setErrorMessage(null);
      onSuccess?.(newAvatarUrl);
    },
    [onSuccess],
  );

  // Lógica compartilhada entre usuário e pet
  const startUpload = useCallback(
    async (
      file: File,
      enqueueFn: () => Promise<{ jobId: string; message: string }>,
      pollFn: () => Promise<string | null>,
    ) => {
      // 1. Preview local imediato (UI otimista)
      revokeBlobUrl();
      const blobUrl = URL.createObjectURL(file);
      blobUrlRef.current = blobUrl;
      setPreviewUrl(blobUrl);
      setStatus('uploading');
      setErrorMessage(null);

      try {
        // 2. Enfileira o upload — retorna em ~5 ms com 202 Accepted
        await enqueueFn();
        setStatus('processing');

        setStatus('done');

        void pollFn()
          .then((newUrl) => {
            if (newUrl) handleSuccess(newUrl);
          })
          .catch(() => {
            // O preview local continua visível; a próxima leitura do perfil traz a URL final.
          });
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [handleSuccess, handleError],
  );

  const uploadUserAvatar = useCallback(
    async (userId: string, file: File) => {
      await startUpload(
        file,
        () => apiUploadAvatar(userId, file),
        () => pollAvatarReady(currentAvatar),
      );
    },
    [startUpload, currentAvatar],
  );

  const uploadPetAvatar = useCallback(
    async (petId: string, file: File) => {
      await startUpload(
        file,
        () => apiUploadPetAvatar(petId, file),
        () => pollPetAvatarReady(petId, currentAvatar),
      );
    },
    [startUpload, currentAvatar],
  );

  const reset = useCallback(() => {
    revokeBlobUrl();
    setPreviewUrl(null);
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  useEffect(() => () => revokeBlobUrl(), []);

  return {
    previewUrl,
    status,
    errorMessage,
    uploadUserAvatar,
    uploadPetAvatar,
    reset,
  };
}
