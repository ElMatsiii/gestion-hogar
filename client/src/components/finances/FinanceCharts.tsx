import React from 'react';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  Tag,
  Layers,
} from 'lucide-react';
import { FinancialSummaryDTO } from '../../types';

interface FinanceChartsProps {
  summary: FinancialSummaryDTO | null;
}

export const FinanceCharts: React.FC<FinanceChartsProps> = ({ summary }) => {

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);

  const categoryColors: Record<string, string> = {
    VIVIENDA: '#3B82F6', // Blue
    ALIMENTACION: '#10B981', // Emerald
    SERVICIOS: '#F59E0B', // Amber
    TRANSPORTE: '#8B5CF6', // Purple
    SALUD: '#EC4899', // Pink
    EDUCACION: '#06B6D4', // Cyan
    OCIO: '#F97316', // Orange
    SUSCRIPCIONES: '#6366F1', // Indigo
    PERSONAL: '#64748B', // Slate
    OTRO: '#94A3B8',
  };

  const categories = summary?.categoryBreakdown || [];
  const totalSpent = summary?.totalExpenses || 0;

  // Group expenses by member
  const memberExpenses = summary?.memberBreakdown || [];

  return (
    <div className="space-y-6 pb-6">
      {/* Top Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Mayor Centro de Gasto</span>
            <Tag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {categories[0]?.category || 'Sin gastos'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {categories[0]
              ? `${formatCurrency(categories[0].total)} (${categories[0].percentage}% del total)`
              : 'Registra tus gastos para ver el análisis'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gasto Compartido vs Personal</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {totalSpent > 0
              ? `${Math.round(((summary?.totalSharedExpenses || 0) / totalSpent) * 100)}% Hogar`
              : '0%'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {formatCurrency(summary?.totalSharedExpenses || 0)} hogar · {formatCurrency(summary?.totalPersonalExpenses || 0)} personal
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Eficiencia de Ahorro</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-black text-teal-700">
            {summary?.savingsRatePercentage || 0}% de los ingresos
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {formatCurrency(summary?.remainingFamilyPool || 0)} guardados para ahorro o emergencias
          </p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Distribución por Categorías
              </h3>
              <p className="text-xs text-slate-500">¿En qué se está yendo el dinero del hogar?</p>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg text-slate-700">
              Total: {formatCurrency(totalSpent)}
            </span>
          </div>

          {categories.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No hay datos suficientes de gastos para generar el gráfico.
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => {
                const color = categoryColors[cat.category] || '#64748B';
                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        {cat.category}
                      </span>
                      <span className="text-slate-600 font-bold">
                        {formatCurrency(cat.total)}{' '}
                        <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Member Obligations and Contributions Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  Aportes vs Obligaciones Personales
                </h3>
                <p className="text-xs text-slate-500">
                  Comparativa de quién aporta y cuánto gasta cada uno individualmente.
                </p>
              </div>
            </div>

            {memberExpenses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Agrega integrantes para ver la distribución económica por persona.
              </div>
            ) : (
              <div className="space-y-4">
                {memberExpenses.map((m) => {
                  const netContribution = m.monthlyIncome - m.totalPersonalObligations;
                  return (
                    <div key={m.memberId} className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: m.avatarColor }}
                          />
                          <span className="font-bold text-xs text-slate-800">{m.name}</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-700">
                          Ingreso: {formatCurrency(m.monthlyIncome)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 mb-2">
                        <div>
                          Obligaciones personales:{' '}
                          <strong className="text-rose-600">
                            {formatCurrency(m.totalPersonalObligations)}
                          </strong>
                        </div>
                        <div className="text-right">
                          Aporte libre al hogar:{' '}
                          <strong className="text-slate-800">
                            {formatCurrency(netContribution)}
                          </strong>
                        </div>
                      </div>

                      {/* Stacked bar */}
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          title="Aporte libre al hogar"
                          style={{
                            width: `${Math.max(
                              0,
                              m.monthlyIncome > 0
                                ? ((m.monthlyIncome - m.totalPersonalObligations) / m.monthlyIncome) * 100
                                : 0
                            )}%`,
                          }}
                        />
                        <div
                          className="h-full bg-rose-400 transition-all"
                          title="Gastos personales"
                          style={{
                            width: `${Math.min(
                              100,
                              m.monthlyIncome > 0
                                ? (m.totalPersonalObligations / m.monthlyIncome) * 100
                                : 0
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              Aporte libre a la familia
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
              Gastos individuales
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
