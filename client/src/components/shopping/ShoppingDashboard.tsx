import React, { useState } from 'react';
import {
  ShoppingCart,
  CheckCircle2,
  Circle,
  PlusCircle,
  Trash2,
  Sparkles,
  PackageCheck,
} from 'lucide-react';
import { ShoppingItem } from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { ConfirmModal } from '../common/ConfirmModal';

interface ShoppingDashboardProps {
  items: ShoppingItem[];
  onRefresh: () => void;
}

export const ShoppingDashboard: React.FC<ShoppingDashboardProps> = ({ items, onRefresh }) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    quantity: 1,
    unit: 'unidades',
    category: 'Supermercado',
  });

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

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showWarning('Por favor ingresa un nombre para el artículo');
      return;
    }
    try {
      await api.createShoppingItem({
        name: form.name,
        quantity: Number(form.quantity),
        unit: form.unit,
        category: form.category,
      });
      setShowModal(false);
      setForm({ name: '', quantity: 1, unit: 'unidades', category: 'Supermercado' });
      showSuccess('Artículo agregado a la lista');
      onRefresh();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleToggle = async (id: string, wasPurchased: boolean) => {
    try {
      await api.toggleShoppingItem(id, true);
      if (!wasPurchased) {
        showSuccess('Comprado: Se reabasteció automáticamente el inventario de tu despensa');
      }
      onRefresh();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const promptDeleteItem = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar de la lista?',
      message: `¿Estás seguro de quitar "${name}" de la lista de compras?`,
      onConfirm: async () => {
        try {
          await api.deleteShoppingItem(id);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showSuccess('Artículo quitado de la lista');
          onRefresh();
        } catch (err: any) {
          showError(err.message);
        }
      },
    });
  };

  const promptClearPurchased = () => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Limpiar artículos comprados?',
      message: 'Se borrarán de la lista todos los productos que ya fueron marcados como comprados.',
      onConfirm: async () => {
        try {
          const res = await api.clearPurchasedShopping();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showSuccess(res.message || 'Lista limpiada correctamente');
          onRefresh();
        } catch (err: any) {
          showError(err.message);
        }
      },
    });
  };

  const pendingItems = items.filter((i) => !i.isPurchased);
  const purchasedItems = items.filter((i) => i.isPurchased);

  return (
    <div className="space-y-6 pb-12">
      {/* In-App Confirm Dialog */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Lista de Compras Inteligente</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Generada automáticamente cuando un producto baja de su stock mínimo en la despensa.
              ¡Al marcarlo como comprado, se reabastece en tu inventario automáticamente!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {purchasedItems.length > 0 && (
              <button
                onClick={promptClearPurchased}
                className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>Limpiar Comprados ({purchasedItems.length})</span>
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Agregar Artículo</span>
            </button>
          </div>
        </div>
      </div>

      {/* PENDING ITEMS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs">
        <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
          <span>Por Comprar</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
            {pendingItems.length}
          </span>
        </h3>

        <div className="divide-y divide-slate-100">
          {pendingItems.map((item) => (
            <div
              key={item.id}
              className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
            >
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => handleToggle(item.id, false)}
              >
                <button
                  type="button"
                  className="text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  <Circle className="w-5 h-5" />
                </button>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>
                      Cantidad a comprar: <strong className="text-slate-700">{item.quantity} {item.unit}</strong>
                    </span>
                    {item.inventoryItemId && (
                      <span className="inline-flex items-center text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200">
                        <Sparkles className="w-3 h-3 mr-0.5" /> Vinculado a Despensa
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {item.category || 'Varios'}
                </span>
                <button
                  onClick={() => promptDeleteItem(item.id, item.name)}
                  className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                  title="Quitar de la lista"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {pendingItems.length === 0 && (
            <div className="py-8 text-center text-slate-400">
              <PackageCheck className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-80" />
              <p className="font-medium text-slate-600">¡Todo abastecido!</p>
              <p className="text-xs text-slate-400">
                No tienes productos con stock bajo pendientes de compra.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PURCHASED ITEMS */}
      {purchasedItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs opacity-85">
          <h3 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
            <span>Comprados en esta salida</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {purchasedItems.length}
            </span>
          </h3>

          <div className="divide-y divide-slate-100">
            {purchasedItems.map((item) => (
              <div
                key={item.id}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg"
              >
                <div
                  className="flex items-center space-x-3 cursor-pointer line-through text-slate-400"
                  onClick={() => handleToggle(item.id, true)}
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium">
                    {item.name} ({item.quantity} {item.unit})
                  </span>
                </div>

                <button
                  onClick={() => promptDeleteItem(item.id, item.name)}
                  className="text-slate-300 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Item */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Agregar a la Lista de Compras</h3>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Artículo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pan de molde, Detergente, Manzanas"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Unidad
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500"
                  >
                    <option value="unidades">unidades</option>
                    <option value="paquetes">paquetes</option>
                    <option value="kg">kg</option>
                    <option value="litros">litros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
                >
                  Agregar a la Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
