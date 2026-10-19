import React, { useState } from 'react';
import {
  Users,
  PlusCircle,
  TrendingUp,
  CreditCard,
  Trash2,
  ShieldCheck,
  Tag,
  DollarSign,
  UserPlus,
  BarChart3,
  ListFilter,
  Camera,
  Edit2,
  Calendar,
} from 'lucide-react';
import {
  FinancialSummaryDTO,
  Member,
  Expense,
  Subscription,
  ExpenseCategory,
  ExpenseType,
} from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { FinanceCharts } from './FinanceCharts';
import { ReceiptScannerModal } from '../common/ReceiptScannerModal';

interface FinanceDashboardProps {
  summary: FinancialSummaryDTO | null;
  members: Member[];
  expenses: Expense[];
  subscriptions: Subscription[];
  onRefresh: () => void;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  summary,
  members,
  expenses,
  subscriptions,
  onRefresh,
}) => {
  const { showSuccess, showError, showWarning } = useNotification();

  // View state: 'table' vs 'analytics'
  const [activeSubView, setActiveSubView] = useState<'table' | 'analytics'>('table');

  // Filter state
  const [expenseFilter, setExpenseFilter] = useState<'ALL' | 'SHARED' | 'PERSONAL'>('ALL');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('ALL');

  // Modals state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // In-App Confirm Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Form states
  const [memberForm, setMemberForm] = useState({ name: '', role: 'Miembro', monthlyIncome: 0, avatarColor: '#3B82F6' });
  const [editingMember, setEditingMember] = useState<{
    id: string;
    name: string;
    role: string;
    monthlyIncome: number;
    avatarColor: string;
  } | null>(null);

  const [expenseForm, setExpenseForm] = useState<{
    title: string;
    amount: number;
    category: ExpenseCategory;
    type: ExpenseType;
    paidById: string;
    assignedToMemberId: string;
    date: string;
    notes: string;
  }>({
    title: '',
    amount: 0,
    category: 'ALIMENTACION',
    type: 'SHARED',
    paidById: '',
    assignedToMemberId: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [subForm, setSubForm] = useState<{
    title: string;
    amount: number;
    billingDay: number;
    type: 'SHARED' | 'PERSONAL';
    assignedToMemberId: string;
    category: string;
  }>({
    title: '',
    amount: 0,
    billingDay: 1,
    type: 'SHARED',
    assignedToMemberId: '',
    category: 'Streaming',
  });

  const [editingIncomeMemberId, setEditingIncomeMemberId] = useState<string | null>(null);
  const [tempIncome, setTempIncome] = useState<number>(0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);

  // Handlers for Members
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim()) {
      showWarning('Por favor ingresa un nombre para el integrante');
      return;
    }
    try {
      await api.createMember(memberForm);
      setShowMemberModal(false);
      setMemberForm({ name: '', role: 'Miembro', monthlyIncome: 0, avatarColor: '#3B82F6' });
      showSuccess('Integrante agregado correctamente al hogar');
      onRefresh();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const openEditMember = (m: Member | { memberId: string; name: string; role: string; monthlyIncome: number; avatarColor: string }) => {
    const id = 'memberId' in m ? m.memberId : m.id;
    setEditingMember({
      id,
      name: m.name,
      role: m.role,
      monthlyIncome: m.monthlyIncome,
      avatarColor: m.avatarColor,
    });
    setShowEditMemberModal(true);
  };

  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember.name.trim()) return;
    try {
      await api.updateMember(editingMember.id, {
        name: editingMember.name,
        role: editingMember.role,
        avatarColor: editingMember.avatarColor,
        monthlyIncome: Number(editingMember.monthlyIncome),
      });
      setShowEditMemberModal(false);
      setEditingMember(null);
      showSuccess('Integrante actualizado exitosamente');
      onRefresh();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const promptDeleteMember = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar integrante del hogar?',
      message: `¿Estás seguro de eliminar a "${name}"? Se mantendrá el historial de gastos compartidos pero se desvinculará este miembro.`,
      onConfirm: async () => {
        try {
          await api.deleteMember(id);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showSuccess('Integrante eliminado');
          onRefresh();
        } catch (err: any) {
          showError(err.message);
        }
      },
    });
  };

  const handleUpdateIncome = async (id: string) => {
    try {
      await api.updateMemberIncome(id, tempIncome);
      setEditingIncomeMemberId(null);
      showSuccess('Ingreso mensual actualizado');
      onRefresh();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const openExpenseModal = () => {
    if (members.length === 0) {
      showWarning('Primero debes registrar al menos un integrante del hogar');
      setShowMemberModal(true);
      return;
    }
    setExpenseForm((prev) => ({
      ...prev,
      paidById: prev.paidById || members[0]?.id || '',
      assignedToMemberId: prev.assignedToMemberId || members[0]?.id || '',
    }));
    setShowExpenseModal(true);
  };

  const openSubModal = () => {
    if (members.length === 0) {
      showWarning('Primero debes registrar al menos un integrante del hogar');
      setShowMemberModal(true);
      return;
    }
    setSubForm((prev) => ({
      ...prev,
      assignedToMemberId: prev.assignedToMemberId || members[0]?.id || '',
    }));
    setShowSubModal(true);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title.trim() || expenseForm.amount <= 0) {
      showWarning('Por favor ingresa un concepto válido y un monto mayor a 0');
      return;
    }
    try {
      await api.createExpense({
        title: expenseForm.title,
        amount: Number(expenseForm.amount),
        category: expenseForm.category,
        type: expenseForm.type,
        paidById: expenseForm.paidById || members[0]?.id,
        assignedToMemberId: expenseForm.type === 'PERSONAL' ? (expenseForm.assignedToMemberId || members[0]?.id) : undefined,
        date: expenseForm.date,
        notes: expenseForm.notes,
      });
      setShowExpenseModal(false);
      setExpenseForm({
        title: '',
        amount: 0,
        category: 'ALIMENTACION',
        type: 'SHARED',
        paidById: members[0]?.id || '',
        assignedToMemberId: members[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      showSuccess('Gasto registrado exitosamente');
      onRefresh();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const promptDeleteExpense = (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar gasto?',
      message: `¿Estás seguro de eliminar el registro "${title}"? Esta acción actualizará los saldos del hogar.`,
      onConfirm: async () => {
        try {
          await api.deleteExpense(id);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showSuccess('Gasto eliminado correctamente');
          onRefresh();
        } catch (err: any) {
          showError(err.message);
        }
      },
    });
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.title.trim() || subForm.amount <= 0) {
      showWarning('Ingresa el nombre del servicio y un costo mayor a 0');
      return;
    }
    try {
      await api.createSubscription({
        title: subForm.title,
        amount: Number(subForm.amount),
        billingDay: Number(subForm.billingDay),
        type: subForm.type,
        assignedToMemberId: subForm.type === 'PERSONAL' ? (subForm.assignedToMemberId || members[0]?.id) : undefined,
        category: subForm.category,
        isActive: true,
      });
      setShowSubModal(false);
      setSubForm({
        title: '',
        amount: 0,
        billingDay: 1,
        type: 'SHARED',
        assignedToMemberId: members[0]?.id || '',
        category: 'Streaming',
      });
      showSuccess('Suscripción agregada al calendario');
      onRefresh();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleToggleSub = async (id: string) => {
    try {
      await api.toggleSubscription(id);
      showSuccess('Estado de suscripción actualizado');
      onRefresh();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const promptDeleteSub = (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar suscripción?',
      message: `¿Estás seguro de eliminar "${title}" de los pagos recurrentes?`,
      onConfirm: async () => {
        try {
          await api.deleteSubscription(id);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showSuccess('Suscripción eliminada');
          onRefresh();
        } catch (err: any) {
          showError(err.message);
        }
      },
    });
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    if (expenseFilter !== 'ALL' && e.type !== expenseFilter) return false;
    if (selectedMemberFilter !== 'ALL') {
      return e.paidById === selectedMemberFilter || e.assignedToMemberId === selectedMemberFilter;
    }
    return true;
  });

  const getMemberName = (id?: string) => {
    if (!id) return 'Hogar';
    const m = members.find((mem) => mem.id === id);
    return m ? m.name : 'Desconocido';
  };

  const getMemberColor = (id?: string) => {
    const m = members.find((mem) => mem.id === id);
    return m ? m.avatarColor : '#64748B';
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. TOP FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Family Income */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ingreso Familiar Total</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(summary?.totalFamilyIncome || 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pozo unificado de {summary?.membersCount || 0} personas
          </p>
        </div>

        {/* Remaining Household Pool */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fondo Común Disponible</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div
            className={`text-2xl font-black ${
              (summary?.remainingFamilyPool || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(summary?.remainingFamilyPool || 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Capacidad de Ahorro / Saldo libre
          </p>
        </div>

        {/* Total Expenses Breakdown */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gastos Totales</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(summary?.totalExpenses || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex justify-between">
            <span>Hogar: {formatCurrency(summary?.totalSharedExpenses || 0)}</span>
            <span>Personal: {formatCurrency(summary?.totalPersonalExpenses || 0)}</span>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tasa de Ahorro Familiar</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-700">
            {summary?.savingsRatePercentage || 0}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, summary?.savingsRatePercentage || 0))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. FAMILY MEMBERS & INDIVIDUAL INCOME TRANSPARENCY */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Sueldos y Obligaciones por Integrante
            </h2>
            <p className="text-sm text-slate-500">
              Transparencia económica: se conoce el ingreso y gastos fijos de cada uno, aportando al pozo familiar común.
            </p>
          </div>
          <button
            onClick={() => setShowMemberModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agregar Integrante</span>
          </button>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Aún no hay integrantes registrados</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Comienza agregando a las personas de tu hogar para registrar sus sueldos y aportes económicos.
            </p>
            <button
              onClick={() => setShowMemberModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Agregar Primer Integrante
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary?.memberBreakdown.map((m) => (
              <div
                key={m.memberId}
                className="border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all bg-slate-50/50 relative overflow-hidden flex flex-col justify-between"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: m.avatarColor }}
                />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                        style={{ backgroundColor: m.avatarColor }}
                      >
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{m.name}</h3>
                        <span className="text-xs text-slate-500 font-medium">{m.role}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">
                      {m.percentageOfFamilyIncome}% del Pozo
                    </span>
                  </div>

                  {/* Income Section */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 mb-3">
                    <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                      <span>Sueldo / Ingreso Mensual:</span>
                      {editingIncomeMemberId !== m.memberId && (
                        <button
                          onClick={() => {
                            setEditingIncomeMemberId(m.memberId);
                            setTempIncome(m.monthlyIncome);
                          }}
                          className="text-emerald-600 hover:underline font-semibold"
                        >
                          Editar rápido
                        </button>
                      )}
                    </div>

                    {editingIncomeMemberId === m.memberId ? (
                      <div className="flex gap-2 items-center mt-1">
                        <input
                          type="number"
                          value={tempIncome}
                          onChange={(e) => setTempIncome(Number(e.target.value))}
                          className="border border-slate-300 rounded px-2 py-1 text-sm w-full font-bold"
                        />
                        <button
                          onClick={() => handleUpdateIncome(m.memberId)}
                          className="bg-emerald-600 text-white px-2 py-1 rounded text-xs font-semibold"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingIncomeMemberId(null)}
                          className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="text-lg font-black text-slate-800">
                        {formatCurrency(m.monthlyIncome)}
                      </div>
                    )}
                  </div>

                  {/* Personal Obligations breakdown */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gastos Personales (este mes):</span>
                      <span className="font-semibold">{formatCurrency(m.personalExpensesTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Suscripciones Personales:</span>
                      <span className="font-semibold">{formatCurrency(m.personalSubscriptionsTotal)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-800 font-bold">
                      <span>Total Obligaciones Personales:</span>
                      <span className="text-rose-600">{formatCurrency(m.totalPersonalObligations)}</span>
                    </div>
                  </div>
                </div>

                {/* Member card footer: Edit and Delete buttons */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <button
                    onClick={() => openEditMember(m)}
                    className="text-slate-500 hover:text-indigo-600 font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar datos</span>
                  </button>

                  <button
                    onClick={() => promptDeleteMember(m.memberId, m.name)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors inline-flex items-center gap-1"
                    title="Eliminar integrante"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. RECURRING SUBSCRIPTIONS & OBLIGATIONS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              Suscripciones y Pagos Fijos Mensuales
            </h2>
            <p className="text-sm text-slate-500">
              Pagos automáticos (Streaming, Gimnasios, Servicios). Asignados a una persona o compartidos por el hogar.
            </p>
          </div>
          <button
            onClick={openSubModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-sm font-semibold border border-teal-200 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Suscripción</span>
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
            No tienes suscripciones registradas aún. Haz clic en "Nueva Suscripción" para agregar Netflix, Spotify, Gimnasio, etc.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className={`p-4 rounded-xl border transition-all ${
                  sub.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {sub.category}
                  </span>
                  <button
                    onClick={() => handleToggleSub(sub.id)}
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      sub.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {sub.isActive ? 'Activa' : 'Pausada'}
                  </button>
                </div>

                <div className="font-bold text-slate-900 text-sm">{sub.title}</div>
                <div className="text-base font-extrabold text-slate-800 my-1">
                  {formatCurrency(sub.amount)}
                  <span className="text-xs font-normal text-slate-500"> /mes</span>
                </div>

                <div className="text-xs text-slate-500 flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                  <span>
                    {sub.type === 'SHARED' ? (
                      <span className="text-emerald-700 font-semibold">Hogar Compartido</span>
                    ) : (
                      <span className="text-slate-600 font-semibold">
                        👤 {getMemberName(sub.assignedToMemberId)}
                      </span>
                    )}
                  </span>
                  <span className="text-slate-400">Día {sub.billingDay}</span>
                  <button
                    onClick={() => promptDeleteSub(sub.id, sub.title)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Eliminar suscripción"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. EXPENSES SECTION WITH SUB-VIEWS (TABLE VS CHARTS) & RECEIPT SCANNER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>Control de Gastos y Analítica</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Registra pagos, escanea tickets de compra o visualiza gráficos de consumo familiar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* View Switcher Button */}
            <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-2 sm:flex text-xs font-bold border border-slate-200 w-full sm:w-auto">
              <button
                onClick={() => setActiveSubView('table')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeSubView === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Lista de Pagos</span>
                <span className="sm:hidden">Lista</span>
              </button>
              <button
                onClick={() => setActiveSubView('analytics')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeSubView === 'analytics' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Gráficos y Estadísticas</span>
                <span className="sm:hidden">Gráficos</span>
              </button>
            </div>

            {/* Smart Receipt Scanner Button */}
            <button
              onClick={() => setShowScannerModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <Camera className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Escanear Boleta</span>
            </button>

            {/* Manual Register */}
            <button
              onClick={openExpenseModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Registrar Gasto</span>
            </button>
          </div>
        </div>

        {/* SUBVIEW 1: CHARTS & ANALYTICS */}
        {activeSubView === 'analytics' && (
          <FinanceCharts summary={summary} expenses={expenses} />
        )}

        {/* SUBVIEW 2: EXPENSES TABLE */}
        {activeSubView === 'table' && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 mb-6 p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs sm:text-sm">
              <span className="text-slate-500 font-medium hidden sm:inline">Filtrar:</span>
              <div className="grid grid-cols-3 sm:flex rounded-lg bg-white border border-slate-200 p-0.5 w-full sm:w-auto">
                <button
                  onClick={() => setExpenseFilter('ALL')}
                  className={`px-2 sm:px-3 py-1 rounded-md text-xs font-semibold text-center transition-colors ${
                    expenseFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                  }`}
                >
                  Todos ({expenses.length})
                </button>
                <button
                  onClick={() => setExpenseFilter('SHARED')}
                  className={`px-2 sm:px-3 py-1 rounded-md text-xs font-semibold text-center transition-colors ${
                    expenseFilter === 'SHARED' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                  }`}
                >
                  <span className="hidden sm:inline">Compartidos Hogar</span>
                  <span className="sm:hidden">Hogar</span>
                </button>
                <button
                  onClick={() => setExpenseFilter('PERSONAL')}
                  className={`px-2 sm:px-3 py-1 rounded-md text-xs font-semibold text-center transition-colors ${
                    expenseFilter === 'PERSONAL' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                  }`}
                >
                  <span className="hidden sm:inline">Personales</span>
                  <span className="sm:hidden">Personal</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                <span className="text-slate-500 text-xs shrink-0">Por integrante:</span>
                <select
                  value={selectedMemberFilter}
                  onChange={(e) => setSelectedMemberFilter(e.target.value)}
                  className="w-full sm:w-auto text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-700"
                >
                  <option value="ALL">Todos los integrantes</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expense Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Pagado Por</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{exp.title}</div>
                        {exp.notes && <div className="text-xs text-slate-400">{exp.notes}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          <Tag className="w-3 h-3 mr-1 text-slate-400" />
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {exp.type === 'SHARED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Compartido (Hogar)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Personal: {getMemberName(exp.assignedToMemberId)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: getMemberColor(exp.paidById) }}
                          />
                          <span className="font-medium text-slate-700">{getMemberName(exp.paidById)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{exp.date}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => promptDeleteExpense(exp.id, exp.title)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Eliminar gasto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                        No hay gastos registrados para este filtro. Haz clic en "Registrar Gasto" o "Escanear Boleta".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* =========================================================================
          IN-APP MODALS
         ========================================================================= */}

      {/* Receipt Scanner Modal */}
      <ReceiptScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        members={members}
        onComplete={onRefresh}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Modal: Add Member */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Agregar Integrante del Hogar</h3>
            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sofía, Andrés, Papá"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Rol / Parentesco
                </label>
                <input
                  type="text"
                  placeholder="Ej: Madre, Hermano, Roommate"
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Sueldo / Ingreso Mensual ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  placeholder="0"
                  value={memberForm.monthlyIncome}
                  onChange={(e) => setMemberForm({ ...memberForm, monthlyIncome: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Color Identificador
                </label>
                <div className="flex gap-2">
                  {['#3B82F6', '#EC4899', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setMemberForm({ ...memberForm, avatarColor: color })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        memberForm.avatarColor === color ? 'border-slate-800 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
                >
                  Guardar Integrante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Member */}
      {showEditMemberModal && editingMember && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Editar Integrante del Hogar</h3>
            <form onSubmit={handleSaveEditMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Rol / Parentesco
                </label>
                <input
                  type="text"
                  value={editingMember.role}
                  onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Sueldo / Ingreso Mensual ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={editingMember.monthlyIncome}
                  onChange={(e) => setEditingMember({ ...editingMember, monthlyIncome: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Color Identificador
                </label>
                <div className="flex gap-2">
                  {['#3B82F6', '#EC4899', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditingMember({ ...editingMember, avatarColor: color })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        editingMember.avatarColor === color ? 'border-slate-800 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditMemberModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Registrar Nuevo Gasto / Pago</h3>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Concepto / Título
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Supermercado Lider, Cuenta de Agua, Farmacia"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Monto ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expenseForm.amount || ''}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-indigo-500"
                  />
                </div>
              </div>

              {/* SHARED VS PERSONAL TOGGLE */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  ¿Para quién es el gasto?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpenseForm({ ...expenseForm, type: 'SHARED' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      expenseForm.type === 'SHARED'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs">🏠 Compartido (Hogar)</div>
                    <div className="text-[11px] text-slate-500">Beneficia a toda la familia</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseForm({ ...expenseForm, type: 'PERSONAL' })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      expenseForm.type === 'PERSONAL'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs">👤 Personal</div>
                    <div className="text-[11px] text-slate-500">Gasto propio de 1 integrante</div>
                  </button>
                </div>
              </div>

              {expenseForm.type === 'PERSONAL' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    ¿A qué integrante pertenece este gasto?
                  </label>
                  <select
                    value={expenseForm.assignedToMemberId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, assignedToMemberId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-indigo-500"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    ¿Quién pagó el dinero?
                  </label>
                  <select
                    value={expenseForm.paidById}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paidById: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-indigo-500"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Categoría
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseCategory })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-indigo-500"
                  >
                    <option value="ALIMENTACION">Alimentación / Super</option>
                    <option value="VIVIENDA">Vivienda / Arriendo</option>
                    <option value="SERVICIOS">Servicios (Luz, Agua, Net)</option>
                    <option value="TRANSPORTE">Transporte / Bencina</option>
                    <option value="SALUD">Salud y Farmacia</option>
                    <option value="EDUCACION">Educación</option>
                    <option value="OCIO">Ocio y Salidas</option>
                    <option value="PERSONAL">Gasto Personal</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Notas / Observaciones (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Transferencia Banco Estado boleta #12"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
                >
                  Registrar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Subscription */}
      {showSubModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Nueva Suscripción Mensual</h3>
            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nombre del Servicio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Spotify Family, Netflix, Gym"
                  value={subForm.title}
                  onChange={(e) => setSubForm({ ...subForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Costo Mensual ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={subForm.amount || ''}
                    onChange={(e) => setSubForm({ ...subForm, amount: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-teal-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Día de Cobro (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={subForm.billingDay}
                    onChange={(e) => setSubForm({ ...subForm, billingDay: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Tipo de Suscripción
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSubForm({ ...subForm, type: 'SHARED' })}
                    className={`p-2 rounded-lg border text-xs font-bold ${
                      subForm.type === 'SHARED'
                        ? 'bg-teal-50 border-teal-500 text-teal-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    🏠 Compartida Hogar
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubForm({ ...subForm, type: 'PERSONAL' })}
                    className={`p-2 rounded-lg border text-xs font-bold ${
                      subForm.type === 'PERSONAL'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    👤 Personal
                  </button>
                </div>
              </div>

              {subForm.type === 'PERSONAL' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Titular / Responsable
                  </label>
                  <select
                    value={subForm.assignedToMemberId}
                    onChange={(e) => setSubForm({ ...subForm, assignedToMemberId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-teal-500"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
