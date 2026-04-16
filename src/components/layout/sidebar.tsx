import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Film,
  Tv,
  Heart,
  Receipt,
  Target,
  Sparkles,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";

const NAV_ITEMS = [
  { to: "/movies", label: "Filmes", icon: Film },
  { to: "/series", label: "Séries", icon: Tv },
  { to: "/dates", label: "Dates", icon: Heart },
  { to: "/mimos", label: "Mimos", icon: Sparkles },
  { to: "/expenses", label: "Despesas", icon: Receipt },
  { to: "/goals", label: "Metas", icon: Target },
] as const;

const CURRENT_LABEL: Record<string, string> = {
  "/movies": "Filmes",
  "/series": "Séries",
  "/dates": "Dates",
  "/mimos": "Mimos",
  "/expenses": "Despesas",
  "/goals": "Metas",
};

export function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const currentLabel = CURRENT_LABEL[location.pathname] ?? "OrganizAI";

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border/40 bg-background/80 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
        <button
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted/60"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            OrganizAI
          </span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          <span className="text-sm font-semibold tracking-tight">{currentLabel}</span>
        </div>
        <button
          onClick={toggleTheme}
          aria-label="Alternar tema"
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted/60"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar transition-transform duration-300 ease-out",
          "lg:static lg:z-auto lg:w-[220px] lg:translate-x-0 lg:border-r lg:border-sidebar-border/60",
          open ? "translate-x-0 shadow-[0_0_60px_-10px_rgba(0,0,0,0.5)]" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 px-5 pt-[env(safe-area-inset-top)]">
          <div className="relative">
            <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-primary/40 blur-lg" />
            <Heart className="h-5 w-5 text-primary" fill="currentColor" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
            OrganizAI
          </span>
        </div>

        <div className="px-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
            Navegar
          </p>
        </div>

        {/* Nav */}
        <nav className="mt-2 flex-1 space-y-0.5 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                  isActive
                    ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <Icon
                    className={cn(
                      "h-[17px] w-[17px] transition-colors",
                      isActive ? "text-primary" : "text-sidebar-foreground/55"
                    )}
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="space-y-0.5 border-t border-sidebar-border/60 p-3">
          <button
            onClick={toggleTheme}
            className="hidden w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground lg:flex"
          >
            {theme === "dark" ? (
              <Sun className="h-[17px] w-[17px]" strokeWidth={1.75} />
            ) : (
              <Moon className="h-[17px] w-[17px]" strokeWidth={1.75} />
            )}
            {theme === "dark" ? "Modo claro" : "Modo escuro"}
          </button>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <LogOut className="h-[17px] w-[17px]" strokeWidth={1.75} />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
