import React, { useState } from 'react';
import {
  Refrigerator,
  PlusCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
  Trash2,
  Minus,
  Plus,
  Search,
  Flame,
  ArrowRight,
  PackageOpen,
  ChefHat,
  Calendar,
} from 'lucide-react';
import {
  InventoryItem,
  InventoryCategory,
  InventoryLocation,
  ExpirationStatus,
} from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { RecipeSuggestionsModal } from './RecipeSuggestionsModal';
import { WeeklyMealPlannerModal } from './WeeklyMealPlannerModal';

interface InventoryDashboardProps {
  items: InventoryItem[];
  onRefresh: () => void;
  onNavigateToShopping?: () => void;
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  items,
  onRefresh,
  onNavigateToShopping,
}) => {
  const { showSuccess, showError, showWarning } = useNotification();

  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showPlannerModal, setShowPlannerModal] = useState(false);

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

  // Form State
  const [itemForm, setItemForm] = useState<{
    name: string;
    category: InventoryCategory;
    quantity: number;
    unit: string;
    minThreshold: number;
    expirationDate: string;
    location: InventoryLocation;
    notes: string;
  }>({
    name: '',
    category: 'Despensa y Granos',
    quantity: 1,
    unit: 'unidades',
    minThreshold: 2,
    expirationDate: '',
    location: 'Despensa',
    notes: '',
  });

  const handleAdjustStock = async (id: string, delta: number) => {
    try {
      await api.adjustStock(id, delta);
      onRefresh();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const promptDeleteItem = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar producto de la despensa?',
      message: `¿Estás seguro de eliminar "${name}" del inventario?`,
      onConfirm: async () => {
        try {
          await api.deleteInventoryItem(id);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showSuccess('Producto eliminado del inventario');
          onRefresh();
        } catch (err: any) {
          showError(err.message);
        }
      },
    });
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      showWarning('Por favor ingresa un nombre para el producto');
      return;
    }
    try {
      await api.createInventoryItem({
        name: itemForm.name,
        category: itemForm.category,
        quantity: Number(itemForm.quantity),
        unit: itemForm.unit,
        minThreshold: Number(itemForm.minThreshold),
        expirationDate: itemForm.expirationDate || undefined,
        location: itemForm.location,
        notes: itemForm.notes,
      });
      setShowItemModal(false);
      setItemForm({
        name: '',
        category: 'Despensa y Granos',
        quantity: 1,
        unit: 'unidades',
        minThreshold: 2,
        expirationDate: '',
        location: 'Despensa',
        notes: '',
      });
      showSuccess('Producto agregado a la despensa');
      onRefresh();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // Metrics
  const lowStockItems = items.filter((i) => i.isLowStock);
  const expiringItems = items.filter(
    (i) => i.expirationStatus === 'EXPIRING_SOON' || i.expirationStatus === 'EXPIRED'
  );

  // Filtered list
  const filteredItems = items.filter((item) => {
    if (search.trim() && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedLocation !== 'ALL' && item.location !== selectedLocation) return false;
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (showLowStockOnly && !item.isLowStock) return false;
    return true;
  });

  const getExpirationBadge = (status: ExpirationStatus, days: number | null) => {
    switch (status) {
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            Caducado ({Math.abs(days || 0)}d atrás)
          </span>
        );
      case 'EXPIRING_SOON':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {days === 0 ? 'Vence HOY' : `Vence en ${days} días`}
          </span>
        );
      case 'FRESH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Vence en {days} días
          </span>
        );
      default:
        return (
          <span className="text-xs text-slate-400 font-medium">Sin fecha límite</span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* 1. METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total en Despensa</span>
            <Refrigerator className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{items.length}</div>
          <p className="text-xs text-slate-500 mt-1">Variedad de insumos registrados</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Poco Stock (Comprar)</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{lowStockItems.length}</div>
          <p className="text-xs text-slate-500 mt-1">Bajo el umbral mínimo fijado</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Rotación Urgente</span>
            <Clock className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{expiringItems.length}</div>
          <p className="text-xs text-slate-500 mt-1">Vencen en menos de 3 días o vencidos</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-4 sm:p-5 rounded-2xl text-white shadow-md">
          <div className="flex justify-between items-center opacity-90 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ahorro por Desperdicio Cero</span>
            <Flame className="w-5 h-5 text-amber-300" />
          </div>
          <div className="text-sm font-semibold mt-1">Regla FIFO Activa</div>
          <p className="text-xs opacity-80 mt-1">
            "Lo primero en vencer es lo primero en cocinarse". Evita botar comida a la basura.
          </p>
        </div>
      </div>

      {/* 2. ROTATION ALERTS BANNER (FIFO) */}
      {expiringItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-xs animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-600 shrink-0" />
              <h3 className="font-bold text-amber-950 text-sm sm:text-base">
                Alimentos con Rotación Prioritaria (Consumir Primero):
              </h3>
            </div>
            <button
              onClick={() => setShowRecipeModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>¿Qué cocinamos con esto?</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
            {expiringItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-3 rounded-xl border border-amber-200 flex justify-between items-center shadow-xs"
              >
                <div>
                  <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                  <div className="text-xs text-slate-500">
                    Quedan: <span className="font-semibold text-slate-700">{item.quantity} {item.unit}</span> ({item.location})
                  </div>
                </div>
                <div>{getExpirationBadge(item.expirationStatus, item.daysUntilExpiration)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. INVENTORY CONTROLS & LIST */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Refrigerator className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Inventario de Despensa y Mercadería</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Control exacto de existencia, aviso cuando hay poco y control de rotación de alimentos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowPlannerModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-xs"
              title="Planificador semanal de comidas"
            >
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Menú Semanal</span>
            </button>

            <button
              onClick={() => setShowRecipeModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all"
              title="Sugerir recetas según ingredientes disponibles y por vencer"
            >
              <ChefHat className="w-4 h-4 shrink-0" />
              <span>¿Qué cocinamos hoy?</span>
            </button>

            {onNavigateToShopping && (
              <button
                onClick={onNavigateToShopping}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
              >
                <span>Lista Compras</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            )}

            <button
              onClick={() => setShowItemModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Nuevo Producto</span>
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <PackageOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Tu despensa está vacía</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Agrega los productos y mercadería que tienes en casa para monitorear existencias, saber cuándo comprar y evitar que caduquen.
            </p>
            <button
              onClick={() => setShowItemModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Agregar Primer Producto
            </button>
          </div>
        ) : (
          <>
            {/* Filters and search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-sm">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-emerald-500"
                />
              </div>

              {/* Location filter */}
              <div>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700"
                >
                  <option value="ALL">Todas las ubicaciones</option>
                  <option value="Refrigerador">Refrigerador</option>
                  <option value="Despensa">Despensa</option>
                  <option value="Congelador">Congelador</option>
                  <option value="Lavandería">Lavandería</option>
                </select>
              </div>

              {/* Category filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700"
                >
                  <option value="ALL">Todas las categorías</option>
                  <option value="Lácteos">Lácteos</option>
                  <option value="Carnes y Pescados">Carnes y Pescados</option>
                  <option value="Despensa y Granos">Despensa y Granos</option>
                  <option value="Frutas y Verduras">Frutas y Verduras</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Congelados">Congelados</option>
                  <option value="Limpieza y Aseo">Limpieza y Aseo</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              {/* Low Stock toggle */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={showLowStockOnly}
                    onChange={(e) => setShowLowStockOnly(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>⚠️ Solo poco stock ({lowStockItems.length})</span>
                </label>
              </div>
            </div>

            {/* Inventory Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    item.isLowStock
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Badges Header */}
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.location} · {item.category}
                    </span>
                    <div>{getExpirationBadge(item.expirationStatus, item.daysUntilExpiration)}</div>
                  </div>

                  {/* Title & Notes */}
                  <div className="font-bold text-slate-900 text-base mb-1">{item.name}</div>
                  {item.notes && <p className="text-xs text-slate-500 mb-3">{item.notes}</p>}

                  {/* Stock Status Bar & Quick Actions */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500">Cantidad actual:</div>
                      <div className="text-lg font-black text-slate-800">
                        {item.quantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                      </div>
                      {item.isLowStock && (
                        <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          Poco stock (Mínimo: {item.minThreshold})
                        </div>
                      )}
                    </div>

                    {/* Counter controls */}
                    <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-lg p-1">
                      <button
                        onClick={() => handleAdjustStock(item.id, -1)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                        title="Consumir / Restar 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold px-1 text-slate-700">±</span>
                      <button
                        onClick={() => handleAdjustStock(item.id, 1)}
                        className="p-1 rounded hover:bg-slate-100 text-emerald-600 transition-colors"
                        title="Reponer / Sumar 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                    <span>Vence: {item.expirationDate || 'N/A'}</span>
                    <button
                      onClick={() => promptDeleteItem(item.id, item.name)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Eliminar del inventario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredItems.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400">
                  No se encontraron productos con los filtros seleccionados.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal: New Inventory Item */}
      {showItemModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Agregar Producto a la Despensa</h3>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nombre del Alimento o Insumo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Leche Entera 1L, Huevos de campo, Arroz"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Categoría
                  </label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value as InventoryCategory })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500"
                  >
                    <option value="Despensa y Granos">Despensa y Granos</option>
                    <option value="Lácteos">Lácteos</option>
                    <option value="Carnes y Pescados">Carnes y Pescados</option>
                    <option value="Frutas y Verduras">Frutas y Verduras</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Congelados">Congelados</option>
                    <option value="Limpieza y Aseo">Limpieza y Aseo</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Ubicación en Casa
                  </label>
                  <select
                    value={itemForm.location}
                    onChange={(e) => setItemForm({ ...itemForm, location: e.target.value as InventoryLocation })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500"
                  >
                    <option value="Despensa">Despensa</option>
                    <option value="Refrigerador">Refrigerador</option>
                    <option value="Congelador">Congelador</option>
                    <option value="Lavandería">Lavandería</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Cantidad Actual
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Unidad
                  </label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500"
                  >
                    <option value="unidades">unidades</option>
                    <option value="paquetes">paquetes</option>
                    <option value="kg">kg</option>
                    <option value="litros">litros</option>
                    <option value="latas">latas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Stock Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={itemForm.minThreshold}
                    onChange={(e) => setItemForm({ ...itemForm, minThreshold: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Fecha de Caducidad / Vencimiento (Rotación FIFO)
                </label>
                <input
                  type="date"
                  value={itemForm.expirationDate}
                  onChange={(e) => setItemForm({ ...itemForm, expirationDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Te avisará con prioridad cuando falten 3 días para vencer para consumirlo a tiempo.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Notas / Marca
                </label>
                <input
                  type="text"
                  placeholder="Ej: Marca Colun, sin sal, etc."
                  value={itemForm.notes}
                  onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
                >
                  Guardar en Despensa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipe Suggestions Modal */}
      <RecipeSuggestionsModal
        isOpen={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        inventory={items}
        onRefresh={onRefresh}
      />

      {/* Weekly Meal Planner Modal */}
      <WeeklyMealPlannerModal
        isOpen={showPlannerModal}
        onClose={() => setShowPlannerModal(false)}
        onOpenRecipes={() => {
          setShowPlannerModal(false);
          setShowRecipeModal(true);
        }}
      />
    </div>
  );
};
