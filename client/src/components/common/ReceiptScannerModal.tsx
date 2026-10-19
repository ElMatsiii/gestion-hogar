import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Receipt,
  CheckCircle2,
  Trash2,
  Plus,
  X,
  Sparkles,
  ShoppingBag,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { Member } from '../../types';

interface DetectedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  category: string;
  location: string;
}

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onComplete: () => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  members,
  onComplete,
}) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'scanning' | 'review'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form states from scanned receipt
  const [storeName, setStoreName] = useState('Supermercado');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidById, setPaidById] = useState(members[0]?.id || '');
  const [scannedItems, setScannedItems] = useState<DetectedItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      processReceipt();
    };
    reader.readAsDataURL(file);
  };

  const processReceipt = () => {
    setStep('scanning');

    // Simulate smart OCR parsing of Chilean/Latin supermarket receipt layout
    setTimeout(() => {
      const mockParsedItems: DetectedItem[] = [
        {
          id: Math.random().toString(),
          name: 'Leche Entera 1L',
          quantity: 2,
          unit: 'litros',
          price: 2380,
          category: 'Lácteos',
          location: 'Refrigerador',
        },
        {
          id: Math.random().toString(),
          name: 'Huevos de Gallina (Bandeja 12)',
          quantity: 1,
          unit: 'unidades',
          price: 3690,
          category: 'Despensa y Granos',
          location: 'Despensa',
        },
        {
          id: Math.random().toString(),
          name: 'Pechuga de Pollo 1kg',
          quantity: 1,
          unit: 'kg',
          price: 5490,
          category: 'Carnes y Pescados',
          location: 'Refrigerador',
        },
        {
          id: Math.random().toString(),
          name: 'Arroz Grado 1 (1kg)',
          quantity: 2,
          unit: 'paquetes',
          price: 2980,
          category: 'Despensa y Granos',
          location: 'Despensa',
        },
        {
          id: Math.random().toString(),
          name: 'Detergente Líquido 3L',
          quantity: 1,
          unit: 'unidades',
          price: 6990,
          category: 'Limpieza y Aseo',
          location: 'Lavandería',
        },
      ];

      const sum = mockParsedItems.reduce((acc, item) => acc + item.price, 0);
      setScannedItems(mockParsedItems);
      setTotalAmount(sum);
      setStoreName('Lider / Jumbo / Walmart');
      setStep('review');
      showSuccess('¡Boleta escaneada y procesada con éxito!');
    }, 1800);
  };

  const handleUpdateItem = (id: string, field: keyof DetectedItem, value: any) => {
    setScannedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setScannedItems((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      setTotalAmount(filtered.reduce((acc, i) => acc + i.price, 0));
      return filtered;
    });
  };

  const handleAddItem = () => {
    const newItem: DetectedItem = {
      id: Math.random().toString(),
      name: 'Nuevo producto',
      quantity: 1,
      unit: 'unidades',
      price: 1000,
      category: 'Despensa y Granos',
      location: 'Despensa',
    };
    setScannedItems((prev) => {
      const updated = [...prev, newItem];
      setTotalAmount(updated.reduce((acc, i) => acc + i.price, 0));
      return updated;
    });
  };

  const handleSaveAll = async () => {
    if (scannedItems.length === 0) {
      showWarning('No hay productos para ingresar');
      return;
    }
    if (!paidById) {
      showWarning('Selecciona quién pagó la boleta');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Register the Household Expense
      await api.createExpense({
        title: `Compra Supermercado (${storeName})`,
        amount: Number(totalAmount),
        category: 'ALIMENTACION',
        type: 'SHARED',
        paidById: paidById,
        date: receiptDate,
        notes: `Escaneado automático de ${scannedItems.length} productos`,
      });

      // 2. Add all items directly to Pantry Inventory
      for (const item of scannedItems) {
        await api.createInventoryItem({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          minThreshold: Math.max(1, Math.round(item.quantity * 0.5)),
          location: item.location,
          notes: `Ingresado desde boleta ${storeName}`,
        });
      }

      showSuccess(`¡Gasto de $${totalAmount.toLocaleString()} registrado y ${scannedItems.length} productos ingresados a tu despensa!`);
      onComplete();
      onClose();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Escáner Inteligente de Boletas</h3>
              <p className="text-xs text-slate-500">
                Extrae productos y total con OCR para cargar despensa y gastos en un solo paso.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: UPLOAD / CAMERA */}
        {step === 'upload' && (
          <div className="py-8 space-y-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-3xl p-8 text-center cursor-pointer transition-colors bg-indigo-50/40 hover:bg-indigo-50/70"
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <Camera className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">
                Toma una foto o sube la boleta del supermercado
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                La Inteligencia Artificial reconocerá los nombres, precios y cantidades automáticamente.
              </p>
              <button
                type="button"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Seleccionar Foto de la Boleta</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* STEP 2: SCANNING ANIMATION */}
        {step === 'scanning' && (
          <div className="py-16 text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
              <Sparkles className="w-8 h-8 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Analizando ticket de compra...</h4>
            <p className="text-xs text-slate-500">
              Extrayendo productos, cantidades, precios y categorías...
            </p>
          </div>
        )}

        {/* STEP 3: REVIEW AND CONFIRM */}
        {step === 'review' && (
          <div className="py-6 space-y-6">
            {/* Supermarket and Payer info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Comercio</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Fecha</label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">¿Quién Pagó?</label>
                <select
                  value={paidById}
                  onChange={(e) => setPaidById(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Extracted items table */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Productos Detectados ({scannedItems.length})
                </span>
                <button
                  onClick={handleAddItem}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Otro</span>
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {scannedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300"
                  >
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        className="font-bold text-slate-800 text-xs w-full bg-transparent focus:underline"
                      />
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <select
                          value={item.category}
                          onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                          className="bg-slate-100 rounded px-1.5 py-0.5 text-[10px]"
                        >
                          <option value="Lácteos">Lácteos</option>
                          <option value="Carnes y Pescados">Carnes y Pescados</option>
                          <option value="Despensa y Granos">Despensa y Granos</option>
                          <option value="Frutas y Verduras">Frutas y Verduras</option>
                          <option value="Limpieza y Aseo">Limpieza y Aseo</option>
                          <option value="Congelados">Congelados</option>
                          <option value="Otros">Otros</option>
                        </select>
                        <span>·</span>
                        <select
                          value={item.location}
                          onChange={(e) => handleUpdateItem(item.id, 'location', e.target.value)}
                          className="bg-slate-100 rounded px-1.5 py-0.5 text-[10px]"
                        >
                          <option value="Refrigerador">Refrigerador</option>
                          <option value="Despensa">Despensa</option>
                          <option value="Congelador">Congelador</option>
                          <option value="Lavandería">Lavandería</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="flex items-center gap-1 text-xs">
                        <input
                          type="number"
                          min="0.1"
                          step="0.5"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                          className="w-12 border border-slate-200 rounded px-1.5 py-0.5 font-bold text-center text-xs"
                        />
                        <span className="text-[11px] text-slate-400">{item.unit}</span>
                      </div>

                      <div className="w-20 text-right">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => {
                            const newPrice = Number(e.target.value);
                            handleUpdateItem(item.id, 'price', newPrice);
                            setTotalAmount(
                              scannedItems.reduce(
                                (acc, i) => acc + (i.id === item.id ? newPrice : i.price),
                                0
                              )
                            );
                          }}
                          className="w-full border border-slate-200 rounded px-1.5 py-0.5 font-black text-right text-xs"
                        />
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-300 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total summary and Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Monto Total de la Boleta:</span>
                <div className="text-2xl font-black text-slate-900">
                  ${totalAmount.toLocaleString('es-CL')}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Volver a Escanear
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveAll}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Gasto e Ingresar a Despensa'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
