import { Suspense } from 'react';
import ResetPasswordPage from '@/components/ResetPassword';

export default function Page() {
  return (
    <Suspense fallback={<div className="text-white">Carregando...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}