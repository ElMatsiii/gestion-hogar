import React from 'react';
import {
  Wallet,
  Refrigerator,
  ShoppingCart,
  LayoutDashboard,
  PiggyBank,
  Download,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { usePWAInstall } from '../context/PWAInstallContext';
import { useNotification } from '../context/NotificationContext';

export type ActiveTab = 'summary' | 'finances' | 'inventory' | 'shopping';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  remainingPool?: number;
  lowStockCount?: number;
  expiringCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  remainingPool = 0,
  lowStockCount = 0,
  expiringCount = 0,
}) => {
  const { canInstall, installApp, isInstalling } = usePWAInstall();
  const { showSuccess } = useNotification();

  const handleNavbarInstall = async () => {
    const installed = await installApp();
    if (installed) {
      showSuccess('¡HogarSync se instaló en tu dispositivo!');
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);

  return (
    <>
      {/* 1. TOP HEADER (Brand & Desktop Navigation) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16 items-center">
            {/* Logo & Brand */}
            <div
              className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer shrink-0"
              onClick={() => setActiveTab('summary')}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex items-center">
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  HogarSync
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Finanzas & Despensa
                </span>
              </div>
            </div>

            {/* Quick Stats Pill (Desktop Only) */}
            <div className="hidden md:flex items-center space-x-3 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-medium">
              <span className="text-slate-500">Pozo Familiar Disponible:</span>
              <span className={`font-bold ${remainingPool >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(remainingPool)}
              </span>
              {(lowStockCount > 0 || expiringCount > 0) && (
                <span className="flex items-center space-x-1 pl-2 border-l border-slate-200 text-amber-600 font-semibold">
                  <span className="inline-flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
                    {lowStockCount} por comprar
                  </span>
                  {expiringCount > 0 && <span>· {expiringCount} por vencer</span>}
                </span>
              )}
            </div>

            {/* Mobile Header Right: Quick Install Button (if available) or Quick Pool Pill */}
            <div className="flex md:hidden items-center space-x-2">
              {canInstall ? (
                <button
                  type="button"
                  onClick={handleNavbarInstall}
                  disabled={isInstalling}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white shadow-xs transition-colors shrink-0"
                  title="Instalar HogarSync en tu celular"
                  aria-label="Instalar HogarSync en tu celular"
                >
                  {isInstalling ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{isInstalling ? 'Instalando...' : 'Instalar'}</span>
                </button>
              ) : (
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Fondo Libre</div>
                  <div className={`text-xs font-extrabold leading-tight ${remainingPool >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(remainingPool)}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Tab Navigation (Hidden on mobile to eliminate sidescroll) */}
            <nav className="hidden md:flex items-center space-x-1.5 lg:space-x-2">
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'summary'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Resumen</span>
              </button>

              <button
                onClick={() => setActiveTab('finances')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'finances'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>Finanzas</span>
              </button>

              <button
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'inventory'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Refrigerator className="w-4 h-4" />
                <span>Despensa</span>
                {expiringCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('shopping')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'shopping'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Compras</span>
                {lowStockCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white text-[11px] font-bold rounded-full">
                    {lowStockCount}
                  </span>
                )}
              </button>

              {canInstall && (
                <button
                  type="button"
                  onClick={handleNavbarInstall}
                  disabled={isInstalling}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white shadow-xs transition-colors shrink-0 ml-1"
                  title="Instalar HogarSync en tu dispositivo"
                  aria-label="Instalar HogarSync en tu dispositivo"
                >
                  {isInstalling ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{isInstalling ? 'Instalando...' : 'Instalar'}</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* 2. MOBILE BOTTOM NAVIGATION BAR (Native App Feel, Zero Horizontal Overflow) */}
      <nav
        aria-label="Navegación móvil"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid grid-cols-4 h-16 items-center px-1">
          {/* Tab 1: Resumen */}
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`flex flex-col items-center justify-center h-full py-1 rounded-xl transition-all ${
              activeTab === 'summary'
                ? 'text-emerald-600 font-bold'
                : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'summary' ? 'bg-emerald-50 text-emerald-600' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[11px] tracking-tight mt-0.5">Resumen</span>
          </button>

          {/* Tab 2: Finanzas */}
          <button
            type="button"
            onClick={() => setActiveTab('finances')}
            className={`flex flex-col items-center justify-center h-full py-1 rounded-xl transition-all ${
              activeTab === 'finances'
                ? 'text-emerald-600 font-bold'
                : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'finances' ? 'bg-emerald-50 text-emerald-600' : ''}`}>
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[11px] tracking-tight mt-0.5">Finanzas</span>
          </button>

          {/* Tab 3: Despensa */}
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`relative flex flex-col items-center justify-center h-full py-1 rounded-xl transition-all ${
              activeTab === 'inventory'
                ? 'text-emerald-600 font-bold'
                : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg relative ${activeTab === 'inventory' ? 'bg-emerald-50 text-emerald-600' : ''}`}>
              <Refrigerator className="w-5 h-5" />
              {expiringCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </div>
            <span className="text-[11px] tracking-tight mt-0.5">Despensa</span>
          </button>

          {/* Tab 4: Compras */}
          <button
            type="button"
            onClick={() => setActiveTab('shopping')}
            className={`relative flex flex-col items-center justify-center h-full py-1 rounded-xl transition-all ${
              activeTab === 'shopping'
                ? 'text-emerald-600 font-bold'
                : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg relative ${activeTab === 'shopping' ? 'bg-emerald-50 text-emerald-600' : ''}`}>
              <ShoppingCart className="w-5 h-5" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-black rounded-full ring-2 ring-white">
                  {lowStockCount}
                </span>
              )}
            </div>
            <span className="text-[11px] tracking-tight mt-0.5">Compras</span>
          </button>
        </div>
      </nav>
    </>
  );
};
