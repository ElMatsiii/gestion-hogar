import {
  IRecipeSuggestionService,
  SuggestRecipesInputDTO,
  SuggestedRecipeDTO,
  RequiredIngredientDTO,
} from '../../domain/interfaces/IRecipeSuggestionService';

export class GeminiRecipeSuggestionService implements IRecipeSuggestionService {
  public async suggestRecipes(input: SuggestRecipesInputDTO): Promise<SuggestedRecipeDTO[]> {
    const apiKey = input.customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'No se ha configurado la GEMINI_API_KEY. Configúrala en Render o ingrésala directamente en la ventana de recetas.'
      );
    }

    const membersCount = Math.max(1, Number(input.membersCount) || 2);
    const daysCount = Math.max(1, Number(input.daysCount) || 2);
    const totalPortions = membersCount * daysCount;

    const pantryList =
      input.inventory.length > 0
        ? input.inventory
            .map((item) => {
              const expNote =
                item.expirationStatus === 'EXPIRED'
                  ? ' [VENCIDO / CONSUMIR YA]'
                  : item.expirationStatus === 'EXPIRING_SOON'
                  ? ` [POR VENCER en ${item.daysUntilExpiration ?? 2} dias - PRIORIDAD ALTA]`
                  : '';
              return `- ${item.name}: ${item.quantity} ${item.unit} (Categoria: ${item.category})${expNote}`;
            })
            .join('\n')
        : 'La despensa registrada esta vacia actualmente; sugiere platos chilenos economicos y cotidianos.';

    const preferenceNote = input.customPreference?.trim()
      ? `\nPreferencia especial indicada por la familia hoy: "${input.customPreference.trim()}".`
      : '';

    const systemPrompt = `
Eres un chef experto en cocina casera chilena y planificacion familiar (batch cooking).
Tu objetivo es sugerir 3 recetas chilenas caseras, ricas, realistas y cotidianas en un hogar de Chile (por ejemplo: Charquican, Cazuela de pollo o vacuno, Carbonada, Pollo arvejado con arroz graneado, Lentejas o Porotos con riendas, Tallarines con salsa boloñesa casera, Budin de verduras, Pastel de papas, Carne mechada con pure, Tortilla de verduras con arroz primavera, Guiso de zapallo italiano, etc.).

DATOS DEL HOGAR Y RENDIMIENTO:
- Integrantes de la familia: ${membersCount} personas.
- Dias que debe durar la comida (cocinar una sola vez para varios dias): ${daysCount} dias.
- TOTAL DE PORCIONES A CALCULAR: ${totalPortions} porciones exactas (${membersCount} integrantes x ${daysCount} dias).
${preferenceNote}

INVENTARIO ACTUAL EN CASA (Despensa y Refrigerador):
${pantryList}

REGLAS OBLIGATORIAS:
1. Prioriza usar los ingredientes que ya estan en el inventario de la casa, especialmente los marcados con [POR VENCER] para evitar desperdicio de comida.
2. Calcula todas las cantidades en "requiredIngredients" exactamente para ${totalPortions} porciones, de modo que cocinando una sola vez alcance para los ${membersCount} integrantes durante ${daysCount} dias.
3. En "requiredIngredients", cuando uses un ingrediente que ya existe en el inventario del usuario, escribe el campo "name" usando el mismo nombre clave del producto en su inventario (por ejemplo, si tiene "Pollo Entero" o "Arroz Grado 2", usa ese nombre o palabra clave) y la misma unidad ("kg", "unidades", "litros", "paquetes") para que el sistema pueda descontar el stock automaticamente.
4. En "description", explica brevemente por que esta receta aprovecha lo que tienen en casa y da un consejo corto de como conservarla/recalentarla para el dia ${daysCount}.
5. No utilices ningun emoji en los textos.
6. Responde UNICAMENTE con un objeto JSON valido con la siguiente estructura exacta:
{
  "recipes": [
    {
      "id": "gemini-rec-1",
      "title": "Nombre del plato chileno casero",
      "time": "40 min",
      "difficulty": "Fácil",
      "portions": ${totalPortions},
      "daysLasting": ${daysCount},
      "description": "Descripcion apetitosa y tip de conservacion para ${daysCount} dias.",
      "steps": [
        "Paso 1 claro y conciso",
        "Paso 2 claro y conciso",
        "Paso 3 claro y conciso"
      ],
      "requiredIngredients": [
        {
          "name": "Nombre del ingrediente",
          "quantity": 1,
          "unit": "kg",
          "category": "Carnes y Pescados"
        }
      ]
    }
  ]
}
`;

    const requestBody = {
      contents: [
        {
          parts: [{ text: systemPrompt }],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.4,
      },
    };

    let modelsToTry: string[] = [];

    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const listRes = await fetch(listUrl);
      if (listRes.ok) {
        const listData = (await listRes.json()) as {
          models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
        };
        const available: string[] = (listData.models || [])
          .filter(
            (m) =>
              Array.isArray(m.supportedGenerationMethods) &&
              m.supportedGenerationMethods.includes('generateContent')
          )
          .map((m) => String(m.name).replace(/^models\//, ''));

        const flashLite = available.filter((m) => m.includes('lite'));
        const flash25 = available.filter(
          (m) => m.includes('2.5') && m.includes('flash') && !m.includes('lite')
        );
        const otherFlash = available.filter(
          (m) => m.includes('flash') && !m.includes('lite') && !m.includes('2.5')
        );
        const geminiGeneral = available.filter(
          (m) => m.startsWith('gemini-') && !m.includes('flash')
        );

        modelsToTry = [...flashLite, ...flash25, ...otherFlash, ...geminiGeneral];
      }
    } catch (err) {
      console.warn('Could not query ListModels for recipes, using fallback list:', err);
    }

    if (modelsToTry.length === 0) {
      modelsToTry = [
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
      ];
    }

    let lastError = '';

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorJson = (await response.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          const errMsg =
            errorJson.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          lastError = errMsg;
          if (response.status === 404 || response.status === 400 || response.status === 429) {
            continue;
          }
          throw new Error(`Error en API de Gemini (${model}): ${errMsg}`);
        }

        const data = (await response.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
          throw new Error('La API de Gemini no retorno sugerencias de recetas.');
        }

        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : rawText;
        const parsed = JSON.parse(jsonString.trim()) as {
          recipes?: Array<Record<string, unknown>>;
        };

        const rawRecipes = Array.isArray(parsed.recipes) ? parsed.recipes : [];
        if (rawRecipes.length === 0) {
          throw new Error('Gemini no genero recetas validas.');
        }

        return rawRecipes.map((rec, index) => {
          const rawIngs = Array.isArray(rec.requiredIngredients) ? rec.requiredIngredients : [];
          const requiredIngredients: RequiredIngredientDTO[] = rawIngs.map((ing) => {
            const i = ing as Record<string, unknown>;
            return {
              name: String(i.name || 'Ingrediente').trim(),
              quantity: Math.round((Number(i.quantity) || 1) * 100) / 100,
              unit: String(i.unit || 'unidades'),
              category: String(i.category || 'Despensa y Granos'),
            };
          });

          const rawSteps = Array.isArray(rec.steps) ? rec.steps : [];
          const steps = rawSteps.map((s) => String(s).trim()).filter(Boolean);

          const difficulty: 'Fácil' | 'Media' =
            rec.difficulty === 'Media' ? 'Media' : 'Fácil';

          return {
            id: String(rec.id || `gemini-rec-${Date.now()}-${index}`),
            title: String(rec.title || 'Receta Casera Chilena'),
            time: String(rec.time || '35 min'),
            difficulty,
            portions: Number(rec.portions) || totalPortions,
            daysLasting: Number(rec.daysLasting) || daysCount,
            description: String(rec.description || ''),
            steps,
            requiredIngredients,
          };
        });
      } catch (err) {
        if (modelsToTry.indexOf(model) === modelsToTry.length - 1) {
          throw err;
        }
      }
    }

    throw new Error(`No se pudieron generar las recetas con Gemini: ${lastError}`);
  }
}
