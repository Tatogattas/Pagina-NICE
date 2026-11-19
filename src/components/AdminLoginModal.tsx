import {Eye, EyeOff, X} from 'lucide-react';
import {useEffect, useState, type FormEvent} from 'react';
import {
  OFFICIAL_LOGO_URL,
  verifyAdminCredentials,
} from '../data/siteConfig';
import {BrandLogo} from './BrandLogo';

interface AdminLoginModalProps {
  isOpen: boolean;
  logoUrl?: string;
  brandName?: string;
  onClose: () => void;
  onSuccess: (username: string) => void;
}

export function AdminLoginModal({
  isOpen,
  logoUrl = OFFICIAL_LOGO_URL,
  brandName = 'Academia/Clínica NICE',
  onClose,
  onSuccess,
}: AdminLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setUsername('');
      setPassword('');
      setError(null);
      setShowPassword(false);
      return;
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const valid = await verifyAdminCredentials(username, password);
      if (!valid) {
        setError('Usuario o contraseña incorrectos.');
        setSubmitting(false);
        return;
      }
      onSuccess(username.trim());
      onClose();
    } catch {
      setError('No se pudo verificar el acceso. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo
              src={logoUrl}
              alt={`Logo oficial de ${brandName}`}
              sizeClass="h-10 w-10"
            />
            <div>
              <h2
                id="admin-login-title"
                className="text-lg font-semibold tracking-tight text-[#07090E]"
              >
                Acceso de administrador
              </h2>
              <p className="text-xs text-slate-500">
                Solo el administrador autorizado puede editar el sitio.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar acceso"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#07090E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-username"
              className="block text-xs font-semibold text-[#07090E]"
            >
              Nombre de usuario
            </label>
            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#07090E] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-[#07090E]"
            >
              Contraseña
            </label>
            <div className="relative mt-1.5">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 py-2.5 pr-11 pl-3.5 text-sm text-[#07090E] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                className="absolute top-1/2 right-2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-[#07090E]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#07090E]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              {submitting ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
