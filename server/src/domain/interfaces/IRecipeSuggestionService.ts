export interface RecipeIngredientInputDTO {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expirationStatus?: string;
  daysUntilExpiration?: number | null;
}

export interface RequiredIngredientDTO {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

export interface SuggestedRecipeDTO {
  id: string;
  title: string;
  time: string;
  difficulty: 'Fácil' | 'Media';
  portions: number;
  daysLasting: number;
  description: string;
  steps: string[];
  requiredIngredients: RequiredIngredientDTO[];
}

export interface SuggestRecipesInputDTO {
  inventory: RecipeIngredientInputDTO[];
  membersCount: number;
  daysCount: number;
  customPreference?: string;
  customApiKey?: string;
}

export interface IRecipeSuggestionService {
  suggestRecipes(input: SuggestRecipesInputDTO): Promise<SuggestedRecipeDTO[]>;
}
