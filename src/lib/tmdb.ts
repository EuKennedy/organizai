const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p";

function getApiKey(): string {
  const key = import.meta.env.VITE_TMDB_API_KEY as string;
  if (!key) throw new Error("Missing VITE_TMDB_API_KEY in environment");
  return key;
}

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
}

export interface TMDBSeries {
  id: number;
  name: string;
  original_name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  genre_ids: number[];
  vote_average: number;
}

interface TMDBSearchResponse<T> {
  results: T[];
  total_results: number;
}

const MOVIE_GENRES: Record<number, string> = {
  28: "Acao", 12: "Aventura", 16: "Animacao", 35: "Comedia",
  80: "Crime", 99: "Documentario", 18: "Drama", 10751: "Familia",
  14: "Fantasia", 36: "Historia", 27: "Terror", 10402: "Musica",
  9648: "Misterio", 10749: "Romance", 878: "Ficcao Cientifica",
  10770: "Cinema TV", 53: "Suspense", 10752: "Guerra", 37: "Faroeste",
};

const TV_GENRES: Record<number, string> = {
  10759: "Acao e Aventura", 16: "Animacao", 35: "Comedia", 80: "Crime",
  99: "Documentario", 18: "Drama", 10751: "Familia", 10762: "Infantil",
  9648: "Misterio", 10763: "Noticias", 10764: "Reality", 10765: "Sci-Fi e Fantasia",
  10766: "Novela", 10767: "Talk Show", 10768: "Guerra e Politica", 37: "Faroeste",
};

export function resolveMovieGenres(ids: number[]): string[] {
  return ids.map((id) => MOVIE_GENRES[id] ?? "Outro").filter(Boolean);
}

export function resolveTVGenres(ids: number[]): string[] {
  return ids.map((id) => TV_GENRES[id] ?? "Outro").filter(Boolean);
}

export function posterUrl(path: string | null, size: "w185" | "w342" | "w500" = "w342"): string {
  if (!path) return "";
  return `${TMDB_IMAGE}/${size}${path}`;
}

export function backdropUrl(path: string | null, size: "w780" | "w1280" = "w780"): string {
  if (!path) return "";
  return `${TMDB_IMAGE}/${size}${path}`;
}

export interface TMDBCredits {
  director: string | null;
  cast: string[];
}

export async function getMovieCredits(movieId: number): Promise<TMDBCredits> {
  const url = `${TMDB_BASE}/movie/${movieId}/credits?api_key=${getApiKey()}&language=pt-BR`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { director: null, cast: [] };
    const data = (await res.json()) as {
      crew: { job: string; name: string }[];
      cast: { name: string; order: number }[];
    };
    const director = data.crew.find((c) => c.job === "Director")?.name ?? null;
    const cast = data.cast
      .sort((a, b) => a.order - b.order)
      .slice(0, 5)
      .map((c) => c.name);
    return { director, cast };
  } catch {
    return { director: null, cast: [] };
  }
}

export async function getSeriesCredits(seriesId: number): Promise<TMDBCredits> {
  const url = `${TMDB_BASE}/tv/${seriesId}/credits?api_key=${getApiKey()}&language=pt-BR`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { director: null, cast: [] };
    const data = (await res.json()) as {
      crew: { job: string; name: string }[];
      cast: { name: string; order: number }[];
    };
    const creator = data.crew.find((c) => c.job === "Executive Producer" || c.job === "Creator")?.name ?? null;
    const cast = data.cast
      .sort((a, b) => a.order - b.order)
      .slice(0, 5)
      .map((c) => c.name);
    return { director: creator, cast };
  } catch {
    return { director: null, cast: [] };
  }
}

export async function searchMovies(query: string): Promise<TMDBMovie[]> {
  if (!query.trim()) return [];
  const url = `${TMDB_BASE}/search/movie?api_key=${getApiKey()}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("TMDB search failed");
  const data = (await res.json()) as TMDBSearchResponse<TMDBMovie>;
  return data.results.slice(0, 10);
}

export async function searchSeries(query: string): Promise<TMDBSeries[]> {
  if (!query.trim()) return [];
  const url = `${TMDB_BASE}/search/tv?api_key=${getApiKey()}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("TMDB search failed");
  const data = (await res.json()) as TMDBSearchResponse<TMDBSeries>;
  return data.results.slice(0, 10);
}
