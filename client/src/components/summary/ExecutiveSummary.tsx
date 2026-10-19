import React from 'react';
import {
  Wallet,
  Refrigerator,
  ShoppingCart,
  TrendingUp,
  Clock,
  ArrowRight,
  PiggyBank,
  CheckCircle2,
} from 'lucide-react';
import { FinancialSummaryDTO, InventoryItem, ShoppingItem } from '../../types';
import { ActiveTab } from '../Navbar';

interface ExecutiveSummaryProps {
  summary: FinancialSummaryDTO | null;
  inventory: InventoryItem[];
  shopping: ShoppingItem[];
  setActiveTab: (tab: ActiveTab) => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  summary,
  inventory,
  shopping,
  setActiveTab,
}) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);

  const expiringItems = inventory.filter(
    (i) => i.expirationStatus === 'EXPIRING_SOON' || i.expirationStatus === 'EXPIRED'
  );
  const pendingShopping = shopping.filter((i) => !i.isPurchased);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome & Savings Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-5 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 sm:mb-4 border border-emerald-500/30">
            <PiggyBank className="w-4 h-4" />
            Control Financiero & Desperdicio Cero
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2 sm:mb-3">
            Gestión Inteligente del Hogar
          </h1>
          <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
            Todos los ingresos de la familia unidos en un solo pozo común transparente, con seguimiento de gastos personales y control riguroso de la despensa para ahorrar al máximo.
          </p>

          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-2.5 sm:gap-4">
            <button
              onClick={() => setActiveTab('finances')}
              className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Ver Finanzas Familiares</span>
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all backdrop-blur-xs flex items-center gap-2 border border-white/10"
            >
              <Refrigerator className="w-4 h-4" />
              <span>Revisar Despensa ({inventory.length} items)</span>
            </button>
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Pozo Familiar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Ahorro y Fondo Común</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
              {formatCurrency(summary?.remainingFamilyPool || 0)}
            </div>
            <p className="text-xs text-slate-500">
              Saldo libre luego de descontar gastos compartidos y personales.
            </p>
          </div>

          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">Tasa de Ahorro:</span>
            <span className="text-emerald-600 font-extrabold text-sm">
              {summary?.savingsRatePercentage || 0}% de los ingresos
            </span>
          </div>
        </div>

        {/* Card 2: Rotación de Alimentos */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Rotación de Alimentos</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
              {expiringItems.length}
            </div>
            <p className="text-xs text-slate-500">
              Alimentos que vencen pronto o requieren ser consumidos de inmediato.
            </p>
          </div>

          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-rose-600 hover:underline font-bold flex items-center gap-1"
            >
              <span>Ver qué cocinar hoy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Lista de Compras */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Compras Pendientes</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
              {pendingShopping.length}
            </div>
            <p className="text-xs text-slate-500">
              Artículos con stock insuficiente para abastecer la casa.
            </p>
          </div>

          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setActiveTab('shopping')}
              className="text-amber-700 hover:underline font-bold flex items-center gap-1"
            >
              <span>Abrir lista para el supermercado</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Two columns: Finance distribution + Food Rotation urgency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Family Incomes and Contributions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">Distribución del Ingreso Familiar ({formatCurrency(summary?.totalFamilyIncome || 0)})</span>
            </h3>
            <button
              onClick={() => setActiveTab('finances')}
              className="text-xs text-emerald-600 hover:underline font-bold"
            >
              Ver Detalle
            </button>
          </div>

          <div className="space-y-4">
            {(!summary?.memberBreakdown || summary.memberBreakdown.length === 0) ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Aún no has registrado integrantes. Haz clic en "Ver Detalle" para comenzar a configurar tu hogar.
              </div>
            ) : (
              summary.memberBreakdown.map((m) => (
                <div key={m.memberId}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-800">
                      {m.name} ({m.role})
                    </span>
                    <span className="text-slate-500 font-bold">
                      {formatCurrency(m.monthlyIncome)} ({m.percentageOfFamilyIncome}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${m.percentageOfFamilyIncome}%`,
                        backgroundColor: m.avatarColor,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Priority Consumption list (FIFO) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600" />
              Prioridad en la Cocina (Rotación de Alimentos)
            </h3>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs text-rose-600 hover:underline font-bold"
            >
              Gestionar
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {expiringItems.slice(0, 4).map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                  <span className="text-slate-500">
                    {item.quantity} {item.unit} en {item.location}
                  </span>
                </div>
                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full border border-rose-200">
                  {item.daysUntilExpiration !== null && item.daysUntilExpiration <= 0
                    ? '¡Vencido!'
                    : `Vence en ${item.daysUntilExpiration} días`}
                </span>
              </div>
            ))}

            {expiringItems.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
                No hay alimentos con vencimiento crítico próximo. ¡Excelente rotación!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
