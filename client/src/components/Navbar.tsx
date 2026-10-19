import React from 'react';
import {
  Wallet,
  Refrigerator,
  ShoppingCart,
  LayoutDashboard,
  Cloud,
  PiggyBank,
} from 'lucide-react';

export type ActiveTab = 'summary' | 'finances' | 'inventory' | 'shopping' | 'cloud';

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
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('summary')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                HogarSync
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Finanzas & Despensa
              </span>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden md:flex items-center space-x-3 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-medium">
            <span className="text-slate-500">Pozo Familiar Disponible:</span>
            <span className={`font-bold ${remainingPool >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(remainingPool)}
            </span>
            {(lowStockCount > 0 || expiringCount > 0) && (
              <span className="flex items-center space-x-1 pl-2 border-l border-slate-200 text-amber-600 font-semibold">
                <span>⚠️ {lowStockCount} por comprar</span>
                {expiringCount > 0 && <span>· {expiringCount} por vencer</span>}
              </span>
            )}
          </div>

          {/* Tab Navigation */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Resumen</span>
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

            <button
              onClick={() => setActiveTab('cloud')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'cloud'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Cloud className="w-4 h-4 text-sky-500" />
              <span className="hidden md:inline">Nube & BD</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
