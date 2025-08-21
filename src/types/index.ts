export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  steps: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author?: User;
  recipeIngredients?: RecipeIngredient[];
  isFavorite?: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  category: string;
}

export interface RecipeIngredient {
  id: string;
  quantity: string;
  unit?: string;
  ingredient: Ingredient;
}

export interface FridgeItem {
  id: string;
  quantity?: string;
  expiryDate?: Date;
  createdAt: Date;
  ingredient: Ingredient;
}

export interface CreateRecipeData {
  title: string;
  description?: string;
  steps: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients: {
    ingredientId: string;
    quantity: string;
    unit?: string;
  }[];
}

export interface SearchFilters {
  ingredients?: string[];
  maxPrepTime?: number;
  category?: string;
}
