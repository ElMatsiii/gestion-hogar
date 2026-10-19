import {
  IReceiptScannerService,
  ScannedReceiptResultDTO,
  ScannedItemDTO,
} from '../../domain/interfaces/IReceiptScannerService';

export class GeminiReceiptScannerService implements IReceiptScannerService {
  public async scanReceipt(imageBase64: string, customApiKey?: string): Promise<ScannedReceiptResultDTO> {
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'No se ha configurado la GEMINI_API_KEY. Configúrala en Render como variable de entorno o ingrésala en la aplicación.'
      );
    }

    // Extract mime type and clean base64 data
    let mimeType = 'image/jpeg';
    let cleanBase64 = imageBase64;

    const dataUrlMatch = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1];
      cleanBase64 = dataUrlMatch[2];
    }

    const systemPrompt = `
Eres un asistente de inteligencia artificial experto en visión y lectura de boletas y facturas de supermercado (especialmente de Chile y Latinoamérica, ej: Lider, Jumbo, Santa Isabel, Unimarc, Tottus, Walmart, Carrefour, etc.).

Tu tarea es analizar la imagen de la boleta y extraer con la mayor exactitud posible los siguientes campos:
1. "storeName": Nombre del supermercado o comercio (ej: "Lider", "Jumbo", "Santa Isabel", etc.). Si no aparece claro, usa "Supermercado".
2. "date": Fecha de la compra en formato "YYYY-MM-DD". Si no se ve con claridad, usa la fecha actual.
3. "totalAmount": Monto total pagado en la boleta como número entero (sin puntos ni signos de moneda).
4. "items": Lista detallada de los productos comprados. Cada producto debe contener:
   - "name": Nombre limpio y legible del producto (desabreviando nombres típicos de boleta si es posible, ej: "LECHE ENT" -> "Leche Entera").
   - "quantity": Cantidad comprada como número (ej: 1, 2, 0.5, etc. Por defecto 1 si no se especifica).
   - "unit": Unidad de medida correspondiente. Debe ser una de: "unidades", "kg", "litros", "paquetes", "gramos".
   - "price": Precio total pagado por ese ítem como número entero.
   - "category": Una de las siguientes categorías exactas:
     ["Despensa y Granos", "Lácteos", "Carnes y Pescados", "Frutas y Verduras", "Bebidas y Jugos", "Congelados", "Snacks y Dulces", "Limpieza y Aseo", "Cuidado Personal", "Otros"]
   - "location": Una de las siguientes ubicaciones sugeridas exactas:
     ["Refrigerador", "Despensa", "Congelador", "Lavandería"]

Si un ítem no tiene precio claro o es un descuento o vuelto, no lo agregues a items, pero asegúrate de que totalAmount refleje el total final pagado.
Debes responder ÚNICAMENTE con el objeto JSON según la estructura requerida.
`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: systemPrompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.1,
      },
    };

    // 1. Discover models supported by this specific API key via ListModels
    let modelsToTry: string[] = [];

    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const listRes = await fetch(listUrl);
      if (listRes.ok) {
        const listData: any = await listRes.json();
        const available: string[] = (listData.models || [])
          .filter((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
          .map((m: any) => String(m.name).replace(/^models\//, ''));

        // Prioritize: high-quota Lite models -> Flash 2.5 -> other Flash -> general Gemini
        const flashLite = available.filter((m) => m.includes('lite'));
        const flash25 = available.filter((m) => m.includes('2.5') && m.includes('flash') && !m.includes('lite'));
        const otherFlash = available.filter((m) => m.includes('flash') && !m.includes('lite') && !m.includes('2.5'));
        const geminiGeneral = available.filter((m) => m.startsWith('gemini-') && !m.includes('flash'));

        modelsToTry = [...flashLite, ...flash25, ...otherFlash, ...geminiGeneral];
      }
    } catch (err) {
      console.warn('Could not query ListModels, using fallback model list:', err);
    }

    if (modelsToTry.length === 0) {
      modelsToTry = [
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash-8b',
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
          const errorJson: any = await response.json().catch(() => ({}));
          const errMsg = errorJson.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          lastError = errMsg;
          // If 404 (model not found), 400 (unsupported), or 429 (quota/rate limit reached), try next model candidate!
          if (response.status === 404 || response.status === 400 || response.status === 429) {
            continue;
          }
          throw new Error(`Error en API de Gemini (${model}): ${errMsg}`);
        }

        const data: any = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
          throw new Error('La API de Gemini no retornó ningún contenido para la imagen proporcionada.');
        }

        // Clean possible markdown code fences just in case
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : rawText;
        const parsed = JSON.parse(jsonString.trim());

        const items: ScannedItemDTO[] = Array.isArray(parsed.items)
          ? parsed.items.map((item: any) => ({
              name: String(item.name || 'Producto').trim(),
              quantity: Number(item.quantity) || 1,
              unit: String(item.unit || 'unidades'),
              price: Number(item.price) || 0,
              category: String(item.category || 'Despensa y Granos'),
              location: String(item.location || 'Despensa'),
            }))
          : [];

        const calculatedTotal = items.reduce((acc, i) => acc + i.price, 0);

        return {
          storeName: String(parsed.storeName || 'Supermercado'),
          date: String(parsed.date || new Date().toISOString().split('T')[0]),
          totalAmount: Number(parsed.totalAmount) || calculatedTotal,
          items,
        };
      } catch (err: any) {
        if (modelsToTry.indexOf(model) === modelsToTry.length - 1) {
          throw err;
        }
      }
    }

    throw new Error(`No se pudo procesar la boleta con Gemini: ${lastError}`);
  }
}
