import React, { useState } from 'react';
import {
  Check,
  Clock,
  Flame,
  Plus,
  X,
  ChefHat,
  CookingPot,
} from 'lucide-react';
import { InventoryItem } from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

interface RecipeSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onRefresh: () => void;
}

interface Recipe {
  id: string;
  title: string;
  time: string;
  difficulty: 'Fácil' | 'Media';
  description: string;
  requiredIngredients: { name: string; quantity: number; unit: string; category: string }[];
}

export const RecipeSuggestionsModal: React.FC<RecipeSuggestionsModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onRefresh,
}) => {
  const { showSuccess, showError } = useNotification();
  const [cookingRecipeId, setCookingRecipeId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Recipe Catalog that maps to common household pantry staples
  const catalog: Recipe[] = [
    {
      id: 'rec-1',
      title: 'Pollo Dorado con Arroz y Especias',
      time: '35 min',
      difficulty: 'Fácil',
      description: 'Plato clásico nutritivo y reconfortante. Ideal para consumir carnes que vencen pronto.',
      requiredIngredients: [
        { name: 'Pollo', quantity: 0.5, unit: 'kg', category: 'Carnes y Pescados' },
        { name: 'Arroz', quantity: 1, unit: 'paquetes', category: 'Despensa y Granos' },
        { name: 'Aceite', quantity: 0.1, unit: 'litros', category: 'Despensa y Granos' },
      ],
    },
    {
      id: 'rec-2',
      title: 'Tortilla Rápida de Huevos y Verduras',
      time: '15 min',
      difficulty: 'Fácil',
      description: 'Cena ligera, alta en proteínas y perfecta para aprovechar huevos y restos de verduras.',
      requiredIngredients: [
        { name: 'Huevos', quantity: 3, unit: 'unidades', category: 'Despensa y Granos' },
        { name: 'Aceite', quantity: 0.05, unit: 'litros', category: 'Despensa y Granos' },
        { name: 'Verduras', quantity: 1, unit: 'unidades', category: 'Frutas y Verduras' },
      ],
    },
    {
      id: 'rec-3',
      title: 'Fideos Salteados Caseros al Ajo',
      time: '20 min',
      difficulty: 'Fácil',
      description: 'Rápido, económico y saciador. Se puede acompañar con carne molida o queso si tienes en stock.',
      requiredIngredients: [
        { name: 'Fideos', quantity: 1, unit: 'paquetes', category: 'Despensa y Granos' },
        { name: 'Aceite', quantity: 0.05, unit: 'litros', category: 'Despensa y Granos' },
        { name: 'Carne', quantity: 0.3, unit: 'kg', category: 'Carnes y Pescados' },
      ],
    },
    {
      id: 'rec-4',
      title: 'Desayuno o Merienda con Lácteos y Frutas',
      time: '5 min',
      difficulty: 'Fácil',
      description: 'Opción refrescante ideal para rotar yogurts o leches antes de su fecha de vencimiento.',
      requiredIngredients: [
        { name: 'Yogurt', quantity: 1, unit: 'unidades', category: 'Lácteos' },
        { name: 'Leche', quantity: 0.25, unit: 'litros', category: 'Lácteos' },
        { name: 'Frutas', quantity: 1, unit: 'unidades', category: 'Frutas y Verduras' },
      ],
    },
  ];

  // Helper to check if ingredient is available in inventory
  const checkIngredientMatch = (reqName: string, reqCategory: string) => {
    return inventory.find(
      (item) =>
        item.quantity > 0 &&
        (item.name.toLowerCase().includes(reqName.toLowerCase()) ||
          item.category.toLowerCase().includes(reqCategory.toLowerCase()))
    );
  };

  // Score recipes by: 1) Has ingredients expiring soon, 2) % of ingredients available
  const scoredRecipes = catalog.map((recipe) => {
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

    const matchPercent = Math.round((availableCount / recipe.requiredIngredients.length) * 100);

    return {
      ...recipe,
      matchPercent,
      availableCount,
      hasExpiringSoonIngredient,
      matchedItems,
    };
  }).sort((a, b) => {
    // Priority: Has expiring items first (FIFO food rotation)
    if (a.hasExpiringSoonIngredient && !b.hasExpiringSoonIngredient) return -1;
    if (!a.hasExpiringSoonIngredient && b.hasExpiringSoonIngredient) return 1;
    return b.matchPercent - a.matchPercent;
  });

  const handleCookRecipe = async (recipe: typeof scoredRecipes[0]) => {
    setCookingRecipeId(recipe.id);
    try {
      // Deduct ingredients from pantry
      let deductedCount = 0;
      for (const item of recipe.matchedItems) {
        if (item.matchedItem) {
          const delta = -Math.min(item.matchedItem.quantity, item.req.quantity);
          await api.adjustStock(item.matchedItem.id, delta);
          deductedCount++;
        }
      }
      showSuccess(`¡Buen provecho! Se descontaron ${deductedCount} ingredientes de tu despensa.`);
      onRefresh();
      onClose();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setCookingRecipeId(null);
    }
  };

  const handleAddMissingToShopping = async (recipe: typeof scoredRecipes[0]) => {
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
    } catch (err: any) {
      showError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-xs">
              <CookingPot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">¿Qué cocinamos hoy?</h3>
              <p className="text-xs text-slate-500">
                Sugerencias inteligentes basadas en lo que tienes en casa, priorizando lo que vence pronto.
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

        {/* Recipe Cards List */}
        <div className="space-y-4">
          {scoredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`p-5 rounded-2xl border transition-all ${
                recipe.hasExpiringSoonIngredient
                  ? 'bg-amber-50/50 border-amber-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  {recipe.hasExpiringSoonIngredient && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 mb-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-600" />
                      Usa ingredientes por vencer (Consumir con prioridad)
                    </span>
                  )}
                  <h4 className="font-extrabold text-slate-900 text-base">{recipe.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{recipe.description}</p>
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
                    {recipe.matchPercent}% disponible
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
                  <span>{cookingRecipeId === recipe.id ? 'Descontando...' : 'Cocinar y Descontar Stock'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
