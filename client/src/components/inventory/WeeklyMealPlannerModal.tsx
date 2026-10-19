import React, { useState } from 'react';
import {
  Calendar,
  X,
  Save,
  Sparkles,
  Utensils,
  Sun,
  Moon,
  RotateCcw,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface DayPlan {
  lunch: string;
  dinner: string;
}

type WeekPlan = Record<string, DayPlan>;

interface WeeklyMealPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRecipes: () => void;
}

const DAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

const DEFAULT_PLAN: WeekPlan = {
  Lunes: { lunch: '', dinner: '' },
  Martes: { lunch: '', dinner: '' },
  Miércoles: { lunch: '', dinner: '' },
  Jueves: { lunch: '', dinner: '' },
  Viernes: { lunch: '', dinner: '' },
  Sábado: { lunch: '', dinner: '' },
  Domingo: { lunch: '', dinner: '' },
};

export const WeeklyMealPlannerModal: React.FC<WeeklyMealPlannerModalProps> = ({
  isOpen,
  onClose,
  onOpenRecipes,
}) => {
  const { showSuccess } = useNotification();
  const [plan, setPlan] = useState<WeekPlan>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hogar_weekly_meal_plan');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return DEFAULT_PLAN;
  });

  if (!isOpen) return null;

  const handleDayChange = (day: string, mealType: 'lunch' | 'dinner', value: string) => {
    setPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: value,
      },
    }));
  };

  const handleSave = () => {
    localStorage.setItem('hogar_weekly_meal_plan', JSON.stringify(plan));
    showSuccess('¡Menú semanal guardado correctamente!');
    onClose();
  };

  const handleReset = () => {
    if (confirm('¿Vaciar el planificador de comidas de esta semana?')) {
      setPlan(DEFAULT_PLAN);
      localStorage.removeItem('hogar_weekly_meal_plan');
      showSuccess('Planificador reiniciado');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 shadow-xs">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Planificador Semanal de Menú Familiar</h3>
              <p className="text-xs text-slate-500">
                Organiza qué cocinará la casa cada día para optimizar compras y evitar desperdicio.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenRecipes}
              className="text-xs px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-bold border border-amber-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Ideas de Recetas</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {DAYS.map((day) => {
            const current = plan[day] || { lunch: '', dinner: '' };
            return (
              <div
                key={day}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3"
              >
                <div className="font-bold text-sm text-slate-900 flex justify-between items-center border-b border-slate-200/80 pb-2">
                  <span>{day}</span>
                  <Utensils className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Almuerzo */}
                <div>
                  <label className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mb-1">
                    <Sun className="w-3 h-3" />
                    Almuerzo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Pollo con arroz y ensalada"
                    value={current.lunch}
                    onChange={(e) => handleDayChange(day, 'lunch', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-teal-500"
                  />
                </div>

                {/* Cena */}
                <div>
                  <label className="text-[11px] font-bold text-indigo-700 flex items-center gap-1 mb-1">
                    <Moon className="w-3 h-3" />
                    Cena
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Tortilla de verduras o sopa"
                    value={current.dinner}
                    onChange={(e) => handleDayChange(day, 'dinner', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-teal-500"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-6">
          <button
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-rose-600 inline-flex items-center gap-1 font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Vaciar Semana</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cerrar
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Plan Semanal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
