export interface Movie {
  id: string;
  user_id: string;
  tmdb_id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_year: number;
  genres: string[];
  tmdb_score: number;
  director: string | null;
  cast: string[];
  status: "want_to_watch" | "watching" | "watched";
  personal_rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface Series {
  id: string;
  user_id: string;
  tmdb_id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_year: number;
  genres: string[];
  tmdb_score: number;
  director: string | null;
  cast: string[];
  status: "want_to_watch" | "watching" | "watched";
  current_season: number | null;
  current_episode: number | null;
  personal_rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface DateIdea {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  date_time: string | null;
  expected_weather: "sunny" | "rainy" | "snowy" | "cloudy" | null;
  maps_link: string | null;
  place_name: string | null;
  place_photos: string[];
  status: "idea" | "scheduled" | "done";
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: "income" | "expense";
  created_at: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  created_at: string;
  updated_at: string;
}

export type WeatherIcon = "sunny" | "rainy" | "snowy" | "cloudy";

export const WEATHER_EMOJI: Record<WeatherIcon, string> = {
  sunny: "\u2600\uFE0F",
  rainy: "\uD83C\uDF27\uFE0F",
  snowy: "\u2744\uFE0F",
  cloudy: "\uD83C\uDF24\uFE0F",
};

export const EXPENSE_CATEGORIES = [
  "Alimentacao",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saude",
  "Educacao",
  "Compras",
  "Viagem",
  "Outros",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

// =============================================================================
// MIMOS
// =============================================================================

// Category is now a free-form string (built-in defaults + user-created customs).
// The DB no longer enforces a CHECK constraint — validation is app-side.
export type MimoCategory = string;

export interface MimoCategoryDef {
  value: MimoCategory;
  label: string;
  emoji: string;
  custom?: boolean;
}

export interface MimoCustomCategoryRow {
  id: string;
  user_id: string;
  value: string;
  label: string;
  emoji: string;
  created_at: string;
}

export interface Mimo {
  id: string;
  user_id: string;
  category: MimoCategory;
  brand: string;
  name: string;
  link: string | null;
  image_url: string | null;
  owned: boolean;
  finished: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_MIMO_CATEGORIES: MimoCategoryDef[] = [
  { value: "olhos", label: "Olhos", emoji: "👁️" },
  { value: "iluminador", label: "Iluminador", emoji: "✨" },
  { value: "rosto", label: "Rosto", emoji: "💆" },
  { value: "blush", label: "Blush", emoji: "🌸" },
  { value: "boca", label: "Boca", emoji: "💋" },
  { value: "skin_care", label: "Skin Care", emoji: "🧴" },
  { value: "corpo", label: "Corpo", emoji: "🫧" },
  { value: "acessorios", label: "Acessorios", emoji: "👜" },
  { value: "piercings", label: "Piercings", emoji: "💎" },
];

export const DEFAULT_MIMO_CATEGORY_MAP: Record<string, MimoCategoryDef> = Object.fromEntries(
  DEFAULT_MIMO_CATEGORIES.map((c) => [c.value, c])
);

// Fallback used when a category value is unknown (e.g. legacy row for a deleted custom cat).
export const UNKNOWN_MIMO_CATEGORY: MimoCategoryDef = {
  value: "__unknown__",
  label: "Outros",
  emoji: "✨",
};

/** Slug helper: "Cílios postiços!" → "cilios_posticos" */
export function slugifyCategory(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}
