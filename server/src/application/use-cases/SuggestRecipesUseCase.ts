import {
  IRecipeSuggestionService,
  SuggestRecipesInputDTO,
  SuggestedRecipeDTO,
} from '../../domain/interfaces/IRecipeSuggestionService';

export class SuggestRecipesUseCase {
  constructor(private readonly recipeService: IRecipeSuggestionService) {}

  public async execute(input: SuggestRecipesInputDTO): Promise<SuggestedRecipeDTO[]> {
    return this.recipeService.suggestRecipes({
      inventory: Array.isArray(input.inventory) ? input.inventory : [],
      membersCount: Math.max(1, Number(input.membersCount) || 2),
      daysCount: Math.max(1, Number(input.daysCount) || 2),
      customPreference: input.customPreference,
      customApiKey: input.customApiKey,
    });
  }
}
