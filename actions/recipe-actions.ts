"use server";

import { z } from "zod";
import { Recipe } from "@/types/recipe";

// Schema for inspiring a new recipe
export const InspireRecipeSchema = z.object({
  prompt: z.string().min(3, "El prompt debe tener al menos 3 caracteres"),
  preferredTime: z.string().optional(),
  category: z.string().optional(),
});

// Schema for saving a recipe
export const SaveRecipeSchema = z.object({
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

export type InspireRecipeInput = z.infer<typeof InspireRecipeSchema>;

interface ServerActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action stub for inspiring/generating a new recipe via AI.
 * Simulates a delay and then returns a new recipe structure based on user prompts.
 */
export async function inspireRecipeAction(
  rawInput: InspireRecipeInput
): Promise<ServerActionResponse<Recipe>> {
  try {
    // Validate inputs with Zod
    const validated = InspireRecipeSchema.parse(rawInput);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate a creative recipe response stub based on prompt
    const lowercasePrompt = validated.prompt.toLowerCase();
    let generatedRecipe: Recipe;

    if (lowercasePrompt.includes("taco") || lowercasePrompt.includes("mexican")) {
      generatedRecipe = {
        id: "tacos-al-pastor-express",
        nombre: "Tacos al Pastor Express",
        categoria: "Cena Rápida",
        descripcion: `Una versión rápida inspirada en tu búsqueda: "${validated.prompt}". Jugosa carne de cerdo marinada con piña asada y cilantro fresco.`,
        tiempoTotal: "25 min",
        ingredientesTotales: [
          "300g de carne de cerdo picada",
          "1/2 taza de adobo de achiote y chipotle",
          "1/2 piña fresca cortada en cubos pequeños",
          "10 tortillas de maíz pequeñas",
          "1/2 cebolla picada fina",
          "1 manojo de cilantro fresco",
          "Limones para servir"
        ],
        pasos: [
          {
            numero: 1,
            texto: "Marina la carne de cerdo en el adobo de achiote durante 5 minutos mientras calientas un sartén a fuego alto.",
            ingredientesDelPaso: ["300g de carne de cerdo picada", "1/2 taza de adobo"],
            tieneTemporizador: true,
            tiempoSegundos: 300,
          },
          {
            numero: 2,
            texto: "Cocina la carne en el sartén caliente hasta que esté bien dorada y crujiente en los bordes, aproximadamente 8 minutos.",
            ingredientesDelPaso: ["Carne de cerdo marinada"],
            tieneTemporizador: true,
            tiempoSegundos: 480,
          },
          {
            numero: 3,
            texto: "En el mismo sartén, a un lado, saltea los cubos de piña hasta que se caramelicen ligeramente.",
            ingredientesDelPaso: ["1/2 piña fresca en cubos"],
            tieneTemporizador: false,
            tiempoSegundos: 0,
          },
          {
            numero: 4,
            texto: "Calienta las tortillas de maíz, arma los tacos con la carne, la piña asada, cebolla, cilantro y un toque de limón.",
            ingredientesDelPaso: ["Tortillas", "Cebolla", "Cilantro", "Limones"],
            tieneTemporizador: false,
            tiempoSegundos: 0,
          }
        ]
      };
    } else {
      // Default dynamic mock recipe
      generatedRecipe = {
        id: `recipe-${Date.now()}`,
        nombre: `Plato de Chef Inspirado en: ${validated.prompt.substring(0, 30)}...`,
        categoria: validated.category || "Fusión Creativa",
        descripcion: `Un plato exclusivo diseñado para complacer tu antojo de "${validated.prompt}". Equilibrado, sabroso y fácil de seguir.`,
        tiempoTotal: validated.preferredTime || "30 min",
        ingredientesTotales: [
          "Ingrediente principal premium",
          "Especias seleccionadas",
          "Hierbas frescas para decorar",
          "Base aromática (cebolla y ajo)",
          "Elemento líquido crujiente",
          "Toque de acidez (vinagre o limón)"
        ],
        pasos: [
          {
            numero: 1,
            texto: "Prepara y mide todos tus ingredientes sobre la mesa. Calienta un sartén con aceite de oliva a fuego medio.",
            ingredientesDelPaso: ["Base aromática", "Aceite de oliva"],
            tieneTemporizador: false,
            tiempoSegundos: 0,
          },
          {
            numero: 2,
            texto: "Agrega el ingrediente principal premium y las especias. Cocina uniformemente moviendo suavemente por 10 minutos.",
            ingredientesDelPaso: ["Ingrediente principal", "Especias seleccionadas"],
            tieneTemporizador: true,
            tiempoSegundos: 600,
          },
          {
            numero: 3,
            texto: "Incorpora el elemento líquido y reduce el fuego. Deja hervir a fuego lento durante 5 minutos para concentrar sabores.",
            ingredientesDelPaso: ["Elemento líquido crujiente"],
            tieneTemporizador: true,
            tiempoSegundos: 300,
          },
          {
            numero: 4,
            texto: "Apaga el fuego, decora con hierbas frescas y agrega el toque de acidez antes de servir de inmediato.",
            ingredientesDelPaso: ["Hierbas frescas", "Toque de acidez"],
            tieneTemporizador: false,
            tiempoSegundos: 0,
          }
        ]
      };
    }

    return {
      success: true,
      data: generatedRecipe,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error instanceof z.ZodError 
        ? `Error de validación: ${error.errors.map(e => e.message).join(", ")}`
        : error?.message || "Ocurrió un error inesperado al inspirar la receta",
    };
  }
}

/**
 * Server Action stub for saving a recipe (e.g. adding it to user's favorites or catalog).
 */
export async function saveRecipeAction(
  rawInput: any
): Promise<ServerActionResponse<{ id: string }>> {
  try {
    const validated = SaveRecipeSchema.parse(rawInput);
    
    // Simulate DB operation
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      data: { id: validated.id },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error instanceof z.ZodError
        ? `Error de validación en la receta: ${error.errors.map(e => e.message).join(", ")}`
        : error?.message || "Ocurrió un error al guardar la receta",
    };
  }
}
