import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { LoginPage } from "@/pages/login";
import { AppLayout } from "@/components/layout/app-layout";
import { MoviesPage } from "@/pages/movies";
import { SeriesPage } from "@/pages/series";
import { DatesPage } from "@/pages/dates";
import { ExpensesPage } from "@/pages/expenses";
import { GoalsPage } from "@/pages/goals";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
