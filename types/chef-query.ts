export interface ChefQueryStepContext {
  numero: number;
  texto: string;
}

export interface RecipeContextPayload {
  recipeName: string;
  recipeDescription?: string;
  tiempoTotal?: string;
  ingredientsTotal: string[];
  allSteps: ChefQueryStepContext[];
  currentStepNumber: number;
  currentStepText: string;
  currentStepIngredients?: string[];
}

export interface ChefQueryRequest {
  question: string;
  recipeContext: RecipeContextPayload;
}

export type ChefQueryPhase =
  | "capture"
  | "verify"
  | "confirm"
  | "loading"
  | "answer"
  | "error";
