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
