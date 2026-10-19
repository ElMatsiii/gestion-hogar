import React from 'react';
import { usePWAInstall } from '../../context/PWAInstallContext';
import { Download, X, Smartphone, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const PWAInstallBanner: React.FC = () => {
  const { showBanner, installApp, dismissBanner, isInstalling } = usePWAInstall();
  const { showSuccess } = useNotification();

  if (!showBanner) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      showSuccess('¡HogarSync se instaló en tu dispositivo!');
    }
  };

  return (
    <div
      role="banner"
      aria-label="Instalación de HogarSync"
      style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom, 0px))' }}
      className="fixed left-3 right-3 sm:left-auto sm:right-6 sm:!bottom-6 sm:max-w-md z-50 transition-all duration-300 ease-out"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-emerald-100 ring-1 ring-black/5 flex items-start gap-3">
        {/* App Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
          <Smartphone className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="font-bold text-sm text-slate-900 truncate">
              Instalar HogarSync
            </h4>
            <button
              type="button"
              onClick={dismissBanner}
              disabled={isInstalling}
              aria-label="Cerrar banner de instalación"
              className="text-slate-400 hover:text-slate-600 disabled:opacity-40 p-1 -mr-1 -mt-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">
            Acceso directo en pantalla de inicio, inicio instantáneo y modo sin conexión.
          </p>

          {/* Action buttons */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              {isInstalling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Instalando...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Instalar App</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={dismissBanner}
              disabled={isInstalling}
              className="px-3 py-2 text-slate-500 hover:text-slate-700 disabled:opacity-40 text-xs font-medium rounded-xl hover:bg-slate-100 transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
