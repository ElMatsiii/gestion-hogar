import React, { useState } from 'react';
import {
  Check,
  Clock,
  Flame,
  Plus,
  Minus,
  X,
  ChefHat,
  CookingPot,
  Sparkles,
  Users,
  Calendar,
  Loader2,
  Key,
  ListChecks,
} from 'lucide-react';
import { InventoryItem } from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

interface RecipeSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  membersCount?: number;
  onRefresh: () => void;
}

interface Recipe {
  id: string;
  title: string;
  time: string;
  difficulty: 'Fácil' | 'Media';
  portions: number;
  daysLasting: number;
  description: string;
  steps?: string[];
  isAiGenerated?: boolean;
  requiredIngredients: { name: string; quantity: number; unit: string; category: string }[];
}

export const RecipeSuggestionsModal: React.FC<RecipeSuggestionsModalProps> = ({
  isOpen,
  onClose,
  inventory,
  membersCount = 2,
  onRefresh,
}) => {
  const { showSuccess, showError } = useNotification();
  const [cookingRecipeId, setCookingRecipeId] = useState<string | null>(null);

  // Batch cooking portion controls (default: family members count, cooking once for 2 days)
  const initialMembers = membersCount > 0 ? membersCount : 2;
  const [customMembers, setCustomMembers] = useState<number | null>(null);
  const effectiveMembers = customMembers !== null ? customMembers : initialMembers;
  const [daysCount, setDaysCount] = useState<number>(2);

  const totalPortions = effectiveMembers * daysCount;
  // Scale factor relative to a base of 4 portions
  const scaleFactor = totalPortions / 4;

  // Gemini AI state
  const [customPreference, setCustomPreference] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiRecipes, setAiRecipes] = useState<Recipe[] | null>(null);
  const [showApiKeyBox, setShowApiKeyBox] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('hogar_gemini_key') || '' : '';
  });

  if (!isOpen) return null;

  const roundQty = (val: number) => Math.max(0.1, Math.round(val * 100) / 100);

  // Base Chilean household catalog scaled dynamically to totalPortions
  const baseChileanCatalog: Recipe[] = [
    {
      id: 'cl-rec-1',
      title: 'Pollo Arvejado con Arroz Graneado',
      time: '40 min',
      difficulty: 'Fácil',
      portions: totalPortions,
      daysLasting: daysCount,
      description: `Clásico almuerzo casero chileno pensado para ${totalPortions} porciones (${effectiveMembers} personas por ${daysCount} días). Se conserva excelente en olla o tupper refrigerado para recalentar al día siguiente.`,
      steps: [
        'Dorar las presas o trozos de pollo con cebolla, zanahoria y ajo en una olla amplia.',
        'Agregar caldo o agua caliente, condimentar con orégano, comino y laurel, y cocinar 25 minutos.',
        'Incorporar las arvejas en los últimos 5 minutos y acompañar con arroz blanco graneado.',
      ],
      requiredIngredients: [
        { name: 'Pollo', quantity: roundQty(0.8 * scaleFactor), unit: 'kg', category: 'Carnes y Pescados' },
        { name: 'Arroz', quantity: roundQty(0.4 * scaleFactor), unit: 'kg', category: 'Despensa y Granos' },
        { name: 'Aceite', quantity: roundQty(0.05 * scaleFactor), unit: 'litros', category: 'Despensa y Granos' },
      ],
    },
    {
      id: 'cl-rec-2',
      title: 'Charquicán Casero de Olla',
      time: '35 min',
      difficulty: 'Fácil',
      portions: totalPortions,
      daysLasting: daysCount,
      description: `Guiso tradicional chileno rendidor y nutritivo (${totalPortions} porciones). Al segundo día toma aún mejor sabor; basta con calentar a fuego suave y coronar con huevo frito.`,
      steps: [
        'Hervir papas y zapallo en cubos en agua con sal hasta que estén blandos.',
        'Preparar un pino en sartén con cebolla picada, carne molida o picada, ají de color, orégano y comino.',
        'Moler rústicamente las papas y zapallo, mezclar con el pino y verduras, y servir caliente.',
      ],
      requiredIngredients: [
        { name: 'Carne', quantity: roundQty(0.5 * scaleFactor), unit: 'kg', category: 'Carnes y Pescados' },
        { name: 'Papas', quantity: roundQty(1 * scaleFactor), unit: 'kg', category: 'Frutas y Verduras' },
        { name: 'Huevos', quantity: Math.max(1, Math.round(4 * scaleFactor)), unit: 'unidades', category: 'Despensa y Granos' },
      ],
    },
    {
      id: 'cl-rec-3',
      title: 'Tallarines con Salsa Boloñesa Casera',
      time: '25 min',
      difficulty: 'Fácil',
      portions: totalPortions,
      daysLasting: daysCount,
      description: `Favorito en toda casa chilena, calculado para ${totalPortions} porciones. Guarda la salsa y los fideos para tener el almuerzo listo en 3 minutos al día siguiente.`,
      steps: [
        'Sofreír cebolla, zanahoria rallada y carne con orégano, ajo y salsa de tomates.',
        'Cocinar a fuego bajo por 15 minutos para concentrar el sabor casero.',
        'Cocer los fideos al dente en abundante agua con sal y servir con la salsa caliente.',
      ],
      requiredIngredients: [
        { name: 'Fideos', quantity: Math.max(1, Math.round(1 * scaleFactor)), unit: 'paquetes', category: 'Despensa y Granos' },
        { name: 'Carne', quantity: roundQty(0.5 * scaleFactor), unit: 'kg', category: 'Carnes y Pescados' },
        { name: 'Aceite', quantity: roundQty(0.05 * scaleFactor), unit: 'litros', category: 'Despensa y Granos' },
      ],
    },
    {
      id: 'cl-rec-4',
      title: 'Carbonada Casera Reconfortante',
      time: '40 min',
      difficulty: 'Fácil',
      portions: totalPortions,
      daysLasting: daysCount,
      description: `Sopa-guiso típica chilena ideal para aprovechar verduras y carne picada, rindiendo ${totalPortions} platos abundantes para ${daysCount} días.`,
      steps: [
        'Dorar la carne cortada en cubitos pequeños con cebolla, ajo, pimentón y ají de color.',
        'Agregar papas, zanahoria y zapallo en cubos pequeños junto con agua hervida o caldo.',
        'Añadir arroz en los últimos 12 minutos de cocción y espolvorear cilantro o perejil al servir.',
      ],
      requiredIngredients: [
        { name: 'Carne', quantity: roundQty(0.4 * scaleFactor), unit: 'kg', category: 'Carnes y Pescados' },
        { name: 'Verduras', quantity: Math.max(1, Math.round(2 * scaleFactor)), unit: 'unidades', category: 'Frutas y Verduras' },
        { name: 'Arroz', quantity: roundQty(0.15 * scaleFactor), unit: 'kg', category: 'Despensa y Granos' },
      ],
    },
  ];

  const activeCatalog = aiRecipes && aiRecipes.length > 0 ? aiRecipes : baseChileanCatalog;

  // Helper to check if ingredient is available in inventory
  const checkIngredientMatch = (reqName: string, reqCategory: string) => {
    return inventory.find(
      (item) =>
        item.quantity > 0 &&
        (item.name.toLowerCase().includes(reqName.toLowerCase()) ||
          reqName.toLowerCase().includes(item.name.toLowerCase()) ||
          item.category.toLowerCase().includes(reqCategory.toLowerCase()))
    );
  };

  // Score recipes by: 1) AI generated first if present, 2) Has ingredients expiring soon, 3) % of ingredients available
  const scoredRecipes = activeCatalog
    .map((recipe) => {
      let availableCount = 0;
      let hasExpiringSoonIngredient = false;
      const matchedItems: { req: Recipe['requiredIngredients'][number]; matchedItem?: InventoryItem }[] = [];

      recipe.requiredIngredients.forEach((req) => {
        const match = checkIngredientMatch(req.name, req.category);
        if (match) {
          availableCount++;
          if (match.expirationStatus === 'EXPIRING_SOON' || match.expirationStatus === 'EXPIRED') {
            hasExpiringSoonIngredient = true;
          }
          matchedItems.push({ req, matchedItem: match });
        } else {
          matchedItems.push({ req });
        }
      });

      const matchPercent =
        recipe.requiredIngredients.length > 0
          ? Math.round((availableCount / recipe.requiredIngredients.length) * 100)
          : 100;

      return {
        ...recipe,
        matchPercent,
        availableCount,
        hasExpiringSoonIngredient,
        matchedItems,
      };
    })
    .sort((a, b) => {
      if (a.hasExpiringSoonIngredient && !b.hasExpiringSoonIngredient) return -1;
      if (!a.hasExpiringSoonIngredient && b.hasExpiringSoonIngredient) return 1;
      return b.matchPercent - a.matchPercent;
    });

  const handleGenerateWithGemini = async () => {
    setIsGeneratingAi(true);
    try {
      if (geminiApiKey.trim() && typeof window !== 'undefined') {
        localStorage.setItem('hogar_gemini_key', geminiApiKey.trim());
      }

      const generated = await api.suggestRecipes(
        {
          inventory: inventory.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            category: i.category,
            expirationStatus: i.expirationStatus,
            daysUntilExpiration: i.daysUntilExpiration,
          })),
          membersCount: effectiveMembers,
          daysCount,
          customPreference: customPreference.trim() || undefined,
        },
        geminiApiKey.trim() || undefined
      );

      setAiRecipes(
        generated.map((r) => ({
          ...r,
          isAiGenerated: true,
        }))
      );
      showSuccess(
        `Gemini generó ${generated.length} recetas chilenas pensadas para ${totalPortions} porciones (${effectiveMembers} personas x ${daysCount} días).`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar recetas con Gemini';
      showError(msg);
      if (msg.toLowerCase().includes('api_key') || msg.toLowerCase().includes('key')) {
        setShowApiKeyBox(true);
      }
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCookRecipe = async (recipe: (typeof scoredRecipes)[0]) => {
    setCookingRecipeId(recipe.id);
    try {
      let deductedCount = 0;
      for (const item of recipe.matchedItems) {
        if (item.matchedItem) {
          const delta = -Math.min(item.matchedItem.quantity, item.req.quantity);
          await api.adjustStock(item.matchedItem.id, delta);
          deductedCount++;
        }
      }
      showSuccess(
        `¡A cocinar! Se descontaron ${deductedCount} ingredientes de tu despensa (${recipe.portions} porciones).`
      );
      onRefresh();
      onClose();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error al descontar stock');
    } finally {
      setCookingRecipeId(null);
    }
  };

  const handleAddMissingToShopping = async (recipe: (typeof scoredRecipes)[0]) => {
    try {
      let added = 0;
      for (const item of recipe.matchedItems) {
        if (!item.matchedItem) {
          await api.createShoppingItem({
            name: `${item.req.name} (para ${recipe.title})`,
            quantity: item.req.quantity,
            unit: item.req.unit,
            category: item.req.category,
          });
          added++;
        }
      }
      showSuccess(`Se agregaron ${added} ingredientes faltantes a tu Lista de Compras.`);
      onRefresh();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error al agregar a lista de compras');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-start gap-3 pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-xs shrink-0">
              <CookingPot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">¿Qué cocinamos hoy?</h3>
              <p className="text-xs text-slate-500">
                Cocina casera chilena pensada para cocinar una vez y que alcance para varios días.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Batch Cooking Portion Calculator + Gemini AI Generator */}
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Planificación Familiar Inteligente
              </span>
              <h4 className="font-bold text-sm sm:text-base text-white">
                Rendimiento total: {totalPortions} porciones ({effectiveMembers}{' '}
                {effectiveMembers === 1 ? 'integrante' : 'integrantes'} × {daysCount}{' '}
                {daysCount === 1 ? 'día' : 'días'})
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Las cantidades de cada receta se ajustan automáticamente para que cocines una vez y rinda {daysCount}{' '}
                {daysCount === 1 ? 'día' : 'días'}.
              </p>
            </div>

            {/* Adjusters for Members & Days */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2">
                <div className="text-[10px] text-emerald-200 font-semibold flex items-center gap-1 mb-1">
                  <Users className="w-3 h-3" />
                  <span>Personas</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomMembers(Math.max(1, effectiveMembers - 1))}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-black w-5 text-center">{effectiveMembers}</span>
                  <button
                    type="button"
                    onClick={() => setCustomMembers(effectiveMembers + 1)}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2">
                <div className="text-[10px] text-emerald-200 font-semibold flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" />
                  <span>Días</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDaysCount(Math.max(1, daysCount - 1))}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-black w-5 text-center">{daysCount}</span>
                  <button
                    type="button"
                    onClick={() => setDaysCount(Math.min(5, daysCount + 1))}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Gemini Custom Prompt & Generate Trigger */}
          <div className="mt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={customPreference}
                onChange={(e) => setCustomPreference(e.target.value)}
                placeholder="Opcional: ¿Algún antojo hoy? Ej: Algo calentito de olla, legumbres, con pollo..."
                className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-emerald-400"
              />
              <button
                type="button"
                onClick={handleGenerateWithGemini}
                disabled={isGeneratingAi}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-sm inline-flex items-center justify-center gap-2 shrink-0"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Pensando recetas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generar Ideas con Gemini IA</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>
                Analiza los {inventory.length} productos de tu despensa y arma menú chileno para {totalPortions}{' '}
                porciones.
              </span>
              <button
                type="button"
                onClick={() => setShowApiKeyBox(!showApiKeyBox)}
                className="inline-flex items-center gap-1 text-emerald-300 hover:underline shrink-0 ml-2"
              >
                <Key className="w-3 h-3" />
                <span>API Key</span>
              </button>
            </div>

            {showApiKeyBox && (
              <div className="pt-2">
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Pega tu Gemini API Key (AIzaSy...) si no está en Render"
                  className="w-full bg-slate-950/80 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Recipe Cards List */}
        <div className="space-y-4">
          {scoredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`p-5 rounded-2xl border transition-all ${
                recipe.hasExpiringSoonIngredient
                  ? 'bg-amber-50/50 border-amber-300 shadow-xs'
                  : recipe.isAiGenerated
                  ? 'bg-emerald-50/30 border-emerald-200 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    {recipe.isAiGenerated && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        Sugerida por Gemini IA
                      </span>
                    )}
                    {recipe.hasExpiringSoonIngredient && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                        Aprovecha ingredientes por vencer
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Users className="w-3 h-3" />
                      {recipe.portions} porciones ({recipe.daysLasting}{' '}
                      {recipe.daysLasting === 1 ? 'día' : 'días'})
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">{recipe.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{recipe.description}</p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black ${
                      recipe.matchPercent === 100
                        ? 'bg-emerald-100 text-emerald-800'
                        : recipe.matchPercent >= 60
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {recipe.matchPercent}% en casa
                  </span>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{recipe.time}</span>
                  </div>
                </div>
              </div>

              {/* Ingredients match checklist */}
              <div className="my-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                {recipe.matchedItems.map((item, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium text-[11px] ${
                      item.matchedItem
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 line-through'
                    }`}
                  >
                    {item.matchedItem ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>
                      {item.req.name} ({item.req.quantity} {item.req.unit})
                    </span>
                  </span>
                ))}
              </div>

              {/* Preparation steps if available */}
              {recipe.steps && recipe.steps.length > 0 && (
                <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600">
                  <div className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Preparación paso a paso:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1">
                    {recipe.steps.map((step, sIdx) => (
                      <li key={sIdx} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                {recipe.availableCount < recipe.requiredIngredients.length ? (
                  <button
                    onClick={() => handleAddMissingToShopping(recipe)}
                    className="text-xs text-slate-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Agregar faltantes a compras</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    ¡Tienes todo listo en casa!
                  </span>
                )}

                <button
                  onClick={() => handleCookRecipe(recipe)}
                  disabled={cookingRecipeId === recipe.id}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 ml-auto"
                >
                  <ChefHat className="w-4 h-4" />
                  <span>
                    {cookingRecipeId === recipe.id
                      ? 'Descontando...'
                      : `Cocinar (${recipe.portions} porciones) y Descontar`}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
