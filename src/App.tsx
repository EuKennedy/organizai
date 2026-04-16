import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { LoginPage } from "@/pages/login";
import { AppLayout } from "@/components/layout/app-layout";
import { MoviesPage } from "@/pages/movies";
import { SeriesPage } from "@/pages/series";
import { DatesPage } from "@/pages/dates";
import { ExpensesPage } from "@/pages/expenses";
import { GoalsPage } from "@/pages/goals";
import { MimosPage } from "@/pages/mimos";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="relative flex h-dvh items-center justify-center overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl" />
        </div>
        <div className="relative flex flex-col items-center gap-4">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Carregando
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/movies" replace />} />
                <Route path="/movies" element={<MoviesPage />} />
                <Route path="/series" element={<SeriesPage />} />
                <Route path="/dates" element={<DatesPage />} />
                <Route path="/mimos" element={<MimosPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/finance" element={<Navigate to="/expenses" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
