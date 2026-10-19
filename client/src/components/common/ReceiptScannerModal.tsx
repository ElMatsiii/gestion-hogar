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
  Key,
  ExternalLink,
  AlertCircle,
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

  // Gemini API Key management
  const [geminiKey, setGeminiKey] = useState<string>(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem('hogar_gemini_key') : '') || '';
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState(geminiKey);

  // Form states from scanned receipt
  const [storeName, setStoreName] = useState('Supermercado');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidById, setPaidById] = useState(members[0]?.id || '');
  const [scannedItems, setScannedItems] = useState<DetectedItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    const clean = tempKey.trim();
    setGeminiKey(clean);
    if (typeof window !== 'undefined') {
      if (clean) {
        localStorage.setItem('hogar_gemini_key', clean);
        showSuccess('Clave de Gemini guardada en tu navegador');
      } else {
        localStorage.removeItem('hogar_gemini_key');
        showSuccess('Se utilizará la clave configurada en el servidor (Render)');
      }
    }
    setShowKeyInput(false);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStep('scanning');
      const base64Data = await compressImage(file);
      setImagePreview(base64Data);
      processReceiptWithGemini(base64Data);
    } catch (err: any) {
      showError(err.message || 'Error al cargar la imagen');
      setStep('upload');
    } finally {
      e.target.value = '';
    }
  };

  const processReceiptWithGemini = async (base64Image: string) => {
    setStep('scanning');

    try {
      const result = await api.scanReceipt(base64Image, geminiKey || undefined);

      const items: DetectedItem[] = (result.items || []).map((item) => ({
        id: Math.random().toString(),
        name: item.name,
        quantity: item.quantity,
        unit: item.unit || 'unidades',
        price: item.price || 0,
        category: item.category || 'Despensa y Granos',
        location: item.location || 'Despensa',
      }));

      const sum = result.totalAmount || items.reduce((acc, i) => acc + i.price, 0);

      setScannedItems(items);
      setTotalAmount(sum);
      if (result.storeName) setStoreName(result.storeName);
      if (result.date) setReceiptDate(result.date);

      setStep('review');
      showSuccess(`¡Boleta procesada con Gemini Vision! (${items.length} productos detectados)`);
    } catch (err: any) {
      console.error('Error scanning receipt with Gemini:', err);
      showError(err.message || 'Error al procesar la boleta con Gemini');
      setStep('upload');

      // If missing API key, open key configuration accordion automatically
      if (err.message && err.message.toLowerCase().includes('gemini_api_key')) {
        setShowKeyInput(true);
      }
    }
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
        notes: `Escaneado inteligente con Gemini Vision (${scannedItems.length} productos)`,
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

      showSuccess(`¡Gasto de $${totalAmount.toLocaleString('es-CL')} registrado y ${scannedItems.length} productos ingresados a tu despensa!`);
      onComplete();
      onClose();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Escáner Inteligente con IA</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-700">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  Gemini Vision
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Extrae productos, cantidades y precios reales para cargar despensa y finanzas a la vez.
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

        {/* Gemini Key Config Banner */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Key className="w-4 h-4 text-indigo-600" />
              <span>
                {geminiKey ? 'Clave de Gemini API configurada' : 'API Key de Gemini (Google AI Studio)'}
              </span>
            </div>
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="text-indigo-600 hover:text-indigo-800 font-bold text-xs"
            >
              {showKeyInput ? 'Ocultar' : geminiKey ? 'Modificar' : 'Configurar Clave'}
            </button>
          </div>

          {showKeyInput && (
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
              <p className="text-[11px] text-slate-500">
                Puedes colocar tu API Key de Gemini aquí (se guarda localmente en tu navegador) o definirla en Render como <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code>.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Guardar
                </button>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline pt-1"
              >
                <span>Obtener una Gemini API Key gratis en Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* STEP 1: UPLOAD / CAMERA */}
        {step === 'upload' && (
          <div className="py-6 space-y-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-3xl p-8 text-center cursor-pointer transition-all bg-indigo-50/40 hover:bg-indigo-50/70"
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <Camera className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-1">
                Toma una foto o sube la boleta del supermercado
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                La visión multimodal de Google Gemini reconocerá automáticamente los productos, marcas, cantidades y valores de tu ticket.
              </p>
              <button
                type="button"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Seleccionar o Tomar Foto</span>
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

            {imagePreview && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-12 h-12 object-cover rounded-xl border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800">Última imagen cargada</div>
                  <div className="text-[11px] text-slate-500">Haz clic abajo para volver a procesar con Gemini</div>
                </div>
                <button
                  type="button"
                  onClick={() => processReceiptWithGemini(imagePreview)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                >
                  Procesar
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: SCANNING ANIMATION */}
        {step === 'scanning' && (
          <div className="py-16 text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
              <Sparkles className="w-8 h-8 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Analizando ticket con Gemini Vision...</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              La IA está extrayendo los productos, unidades, precios de compra y asignando las categorías adecuadas para tu despensa...
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
                  Productos Detectados por Gemini ({scannedItems.length})
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
                {scannedItems.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 border border-dashed rounded-xl">
                    No se detectaron productos legibles en la imagen. Puedes agregar productos manualmente con el botón superior.
                  </div>
                ) : (
                  scannedItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-2xs hover:border-slate-300"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                            className="font-bold text-slate-800 text-xs w-full bg-transparent focus:underline"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="sm:hidden text-slate-300 hover:text-rose-600 p-1 shrink-0"
                            title="Quitar de la lista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] text-slate-500 mt-1">
                          <select
                            value={item.category}
                            onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                            className="bg-slate-100 rounded px-1.5 py-0.5 text-[10px]"
                          >
                            <option value="Lácteos">Lácteos</option>
                            <option value="Carnes y Pescados">Carnes y Pescados</option>
                            <option value="Despensa y Granos">Despensa y Granos</option>
                            <option value="Frutas y Verduras">Frutas y Verduras</option>
                            <option value="Bebidas y Jugos">Bebidas y Jugos</option>
                            <option value="Snacks y Dulces">Snacks y Dulces</option>
                            <option value="Limpieza y Aseo">Limpieza y Aseo</option>
                            <option value="Cuidado Personal">Cuidado Personal</option>
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

                      <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
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
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="hidden sm:inline-block text-slate-300 hover:text-rose-600 p-1"
                          title="Quitar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
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
