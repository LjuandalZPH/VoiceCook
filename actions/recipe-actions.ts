"use server";

import dns from "node:dns";
import { z } from "zod";
import { Recipe } from "@/types/recipe";

dns.setDefaultResultOrder("ipv4first");
// Some routers (e.g. bbrouter) hijack DNS and fail to resolve Google APIs.
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const FETCH_TIMEOUT_MS = 120_000;
const FETCH_RETRIES = 2;
// gemini-2.0-flash was shut down June 2026; try current models with free-tier quota.
const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash",
] as const;

const GeneratedStepSchema = z.object({
  numero: z.number().int().positive(),
  texto: z.string().min(5),
  ingredientesDelPaso: z.array(z.string().min(1)).min(1),
  tieneTemporizador: z.boolean(),
  tiempoSegundos: z.number().int().nonnegative(),
});

const GeneratedRecipeSchema = z.object({
  nombre: z.string().min(3),
  categoria: z.string().min(3),
  descripcion: z.string().min(10),
  tiempoTotal: z.string().min(3),
  ingredientesTotales: z.array(z.string().min(1)).min(3),
  pasos: z.array(GeneratedStepSchema).min(3),
});

const InspireRecipeSchema = z.object({
  prompt: z.string().min(3, "El prompt debe tener al menos 3 caracteres"),
  preferredTime: z.string().optional(),
  category: z.string().optional(),
});

const SaveRecipeSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1),
  categoria: z.string().min(1),
  descripcion: z.string().min(1),
  tiempoTotal: z.string().min(1),
  ingredientesTotales: z.array(z.string()),
  pasos: z.array(
    z.object({
      numero: z.number(),
      texto: z.string(),
      ingredientesDelPaso: z.array(z.string()),
      tieneTemporizador: z.boolean(),
      tiempoSegundos: z.number(),
    })
  ),
});

type InspireRecipeInput = z.infer<typeof InspireRecipeSchema>;

interface ServerActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
    code?: number;
    status?: string;
  };
}

const RECIPE_SYSTEM_PROMPT = `Eres un chef experto para una app llamada VoiceCook.
Devuelve SOLO JSON válido (sin markdown, sin comentarios, sin texto adicional) con esta estructura exacta:
{
  "nombre": "string",
  "categoria": "string",
  "descripcion": "string",
  "tiempoTotal": "string",
  "ingredientesTotales": ["string"],
  "pasos": [
    {
      "numero": 1,
      "texto": "string",
      "ingredientesDelPaso": ["string"],
      "tieneTemporizador": true,
      "tiempoSegundos": 300
    }
  ]
}
Reglas:
- Responde en español.
- Incluye entre 3 y 7 pasos.
- Si un paso no requiere temporizador usa tieneTemporizador=false y tiempoSegundos=0.
- No inventes campos extra.`;

const RECIPE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    nombre: { type: "string" },
    categoria: { type: "string" },
    descripcion: { type: "string" },
    tiempoTotal: { type: "string" },
    ingredientesTotales: {
      type: "array",
      items: { type: "string" },
    },
    pasos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          numero: { type: "integer" },
          texto: { type: "string" },
          ingredientesDelPaso: {
            type: "array",
            items: { type: "string" },
          },
          tieneTemporizador: { type: "boolean" },
          tiempoSegundos: { type: "integer" },
        },
        required: ["numero", "texto", "ingredientesDelPaso", "tieneTemporizador", "tiempoSegundos"],
      },
    },
  },
  required: ["nombre", "categoria", "descripcion", "tiempoTotal", "ingredientesTotales", "pasos"],
};

function slugifyRecipeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractJsonObject(rawText: string): string {
  const trimmed = rawText.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fencedJsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedJsonMatch?.[1]) {
    return fencedJsonMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("La IA no devolvió un JSON de receta válido.");
}

function sanitizeJsonText(jsonText: string): string {
  return jsonText
    .replace(/^\uFEFF/, "")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, "$1");
}

function normalizeRecipeFromAI(parsed: z.infer<typeof GeneratedRecipeSchema>): Recipe {
  const steps = parsed.pasos.map((step, index) => ({
    numero: index + 1,
    texto: step.texto.trim(),
    ingredientesDelPaso: step.ingredientesDelPaso.map((item) => item.trim()),
    tieneTemporizador: step.tieneTemporizador,
    tiempoSegundos: step.tieneTemporizador ? Math.max(0, step.tiempoSegundos) : 0,
  }));

  const slug = slugifyRecipeName(parsed.nombre);
  const suffix = Date.now().toString(36);

  return {
    id: `${slug || "receta"}-${suffix}`,
    nombre: parsed.nombre.trim(),
    categoria: parsed.categoria.trim(),
    descripcion: parsed.descripcion.trim(),
    tiempoTotal: parsed.tiempoTotal.trim(),
    ingredientesTotales: parsed.ingredientesTotales.map((item) => item.trim()),
    pasos: steps,
  };
}

function buildUserPrompt(input: InspireRecipeInput): string {
  return [
    `Ingredientes o idea principal: ${input.prompt}`,
    input.preferredTime ? `Tiempo objetivo: ${input.preferredTime}` : "",
    input.category ? `Categoría preferida: ${input.category}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function parseRecipeFromModelText(modelText: string): Recipe {
  const jsonText = sanitizeJsonText(extractJsonObject(modelText));

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("La IA devolvió JSON mal formado (posible respuesta truncada).");
  }

  try {
    const validatedRecipe = GeneratedRecipeSchema.parse(parsed);
    return normalizeRecipeFromAI(validatedRecipe);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `La receta generada no cumple el formato esperado: ${error.issues.map((issue) => issue.message).join(", ")}`
      );
    }
    throw error;
  }
}

function isRecipeParseError(error: unknown): boolean {
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return true;
  }

  if (error instanceof Error) {
    return /JSON|receta válida|formato esperado|mal formado|no devolvió/i.test(error.message);
  }

  return false;
}

function getNetworkErrorCause(error: Error): string | undefined {
  const cause = error.cause as NodeJS.ErrnoException | undefined;
  return cause?.code ?? cause?.message;
}

function formatNetworkError(error: unknown, provider: string): Error {
  if (!(error instanceof Error)) {
    return new Error(`No se pudo conectar con ${provider}. Revisa tu conexión e intenta de nuevo.`);
  }

  if (error.message !== "fetch failed") {
    return error;
  }

  const cause = getNetworkErrorCause(error);
  if (cause === "ENOTFOUND") {
    return new Error(
      `No se pudo resolver el servidor de ${provider}. Tu router puede estar bloqueando el DNS: cambia el DNS de Windows a 8.8.8.8 o reinicia el router.`
    );
  }

  if (cause === "ECONNREFUSED" || cause === "ECONNRESET" || cause === "ETIMEDOUT") {
    return new Error(
      `La conexión con ${provider} se interrumpió (${cause}). Verifica firewall/VPN e intenta otra vez.`
    );
  }

  return new Error(
    `Falló la conexión de red con ${provider}. Revisa internet, reinicia el servidor y vuelve a intentar.`
  );
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  provider: string
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt += 1) {
    try {
      return await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (error) {
      lastError = error;
      if (attempt < FETCH_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw formatNetworkError(lastError, provider);
}

function isGeminiQuotaError(message: string): boolean {
  return /429|RESOURCE_EXHAUSTED|quota exceeded|limit:\s*0/i.test(message);
}

function formatGeminiError(error: unknown, model?: string): Error {
  if (error instanceof Error && error.message === "fetch failed") {
    return formatNetworkError(error, "Gemini");
  }

  const message = error instanceof Error ? error.message : String(error);
  if (/api.?key|401|403|PERMISSION_DENIED|API_KEY_INVALID|leaked|blocked/i.test(message)) {
    return new Error(
      "Gemini rechazó la clave API. Crea una nueva en https://aistudio.google.com/apikey, actualiza GEMINI_API_KEY en .env y reinicia el servidor (npm run dev)."
    );
  }

  if (isGeminiQuotaError(message)) {
    const modelHint = model ? ` (modelo: ${model})` : "";
    return new Error(
      `Gemini sin cuota disponible${modelHint}. gemini-2.0-flash ya no funciona. Vincula facturación en Google Cloud (no cobra hasta superar el free tier) o revisa límites en https://aistudio.google.com/apikey`
    );
  }

  return error instanceof Error ? error : new Error(message);
}

function getGeminiModels(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  if (preferred) {
    return [preferred, ...GEMINI_MODEL_FALLBACKS.filter((model) => model !== preferred)];
  }
  return [...GEMINI_MODEL_FALLBACKS];
}

async function generateRecipeWithGemini(input: InspireRecipeInput): Promise<Recipe> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Falta GEMINI_API_KEY en variables de entorno.");
  }

  const models = getGeminiModels();
  const modelErrors: string[] = [];

  for (const model of models) {
    try {
      const response = await fetchWithRetry(
        `${GEMINI_API_BASE}/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: RECIPE_SYSTEM_PROMPT }],
            },
            contents: [
              {
                role: "user",
                parts: [{ text: buildUserPrompt(input) }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 4096,
              responseMimeType: "application/json",
              responseSchema: RECIPE_RESPONSE_SCHEMA,
            },
          }),
        },
        "Gemini"
      );

      const details = await response.text();
      if (!response.ok) {
        throw new Error(details || `Gemini respondió con error (${response.status}).`);
      }

      const payload = JSON.parse(details) as GeminiGenerateContentResponse;
      const modelText = payload.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!modelText) {
        const apiMessage = payload.error?.message;
        throw new Error(apiMessage || "Gemini no devolvió contenido de receta.");
      }

      return parseRecipeFromModelText(modelText);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isGeminiQuotaError(message)) {
        modelErrors.push(`${model}: sin cuota`);
        continue;
      }
      if (isRecipeParseError(error)) {
        modelErrors.push(`${model}: ${message}`);
        continue;
      }
      throw formatGeminiError(error, model);
    }
  }

  throw new Error(
    `Gemini no pudo generar una receta válida (${models.join(", ")}). ` +
      "Detalle: " +
      modelErrors.join("; ")
  );
}

async function generateRecipe(input: InspireRecipeInput): Promise<Recipe> {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim());

  if (!hasGemini) {
    throw new Error(
      "Configura GEMINI_API_KEY en .env y reinicia el servidor de desarrollo."
    );
  }

  return generateRecipeWithGemini(input);
}

export async function inspireRecipeAction(
  rawInput: InspireRecipeInput
): Promise<ServerActionResponse<Recipe>> {
  try {
    const validated = InspireRecipeSchema.parse(rawInput);
    const generatedRecipe = await generateRecipe(validated);

    return {
      success: true,
      data: generatedRecipe,
    };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Error de validación: ${error.issues.map((issue) => issue.message).join(", ")}`,
      };
    }

    const message = error instanceof Error ? error.message : "Ocurrió un error inesperado al inspirar la receta";

    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server Action stub for saving a recipe (e.g. adding it to user's favorites or catalog).
 */
export async function saveRecipeAction(
  rawInput: unknown
): Promise<ServerActionResponse<{ id: string }>> {
  try {
    const validated = SaveRecipeSchema.parse(rawInput);

    // Simulate DB operation
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      data: { id: validated.id },
    };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Error de validación en la receta: ${error.issues.map((issue) => issue.message).join(", ")}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Ocurrió un error al guardar la receta",
    };
  }
}
