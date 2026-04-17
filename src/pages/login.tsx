import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ArrowRight, Loader2, RefreshCw, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { clearAuthStorage } from "@/lib/auth-storage";
import { DiagnosticsDialog } from "@/components/diagnostics-dialog";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagOpen, setDiagOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error);
        return;
      }
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-6 py-16">
      {/* Atmosfera */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[15%] top-[20%] h-[420px] w-[420px] rounded-full bg-[oklch(0.68_0.22_340)] opacity-30 blur-[140px]" />
        <div className="absolute right-[12%] bottom-[15%] h-[380px] w-[380px] rounded-full bg-[oklch(0.78_0.16_22)] opacity-25 blur-[140px]" />
        <div className="absolute left-[45%] top-[60%] h-[260px] w-[260px] rounded-full bg-[oklch(0.55_0.22_300)] opacity-20 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/30 to-background" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-primary/30 blur-2xl" />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card/70 ring-1 ring-border backdrop-blur-md">
              <Heart className="h-6 w-6 text-primary" fill="currentColor" />
            </div>
          </div>

          <h1 className="mt-8 text-center text-[40px] font-semibold leading-[1.05] tracking-tight sm:text-[44px]">
            Bem-vindos <br />
            <span className="font-serif italic text-primary">de volta</span>
          </h1>
          <p className="mt-3 max-w-[16rem] text-center text-sm text-muted-foreground">
            Organizem a vida a dois com cuidado.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-12 space-y-6">
          <FloatingInput
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />
          <FloatingInput
            id="password"
            label="Senha"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            minLength={6}
            required
          />

          <button
            type="submit"
            disabled={loading || !email || !password}
            className={cn(
              "group relative mt-4 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-200",
              "hover:shadow-[0_0_30px_-5px_oklch(0.78_0.155_22/0.65)] hover:-translate-y-px",
              "active:translate-y-0",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando…
              </>
            ) : (
              <>
                Entrar
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-10 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">
          OrganizAI · Vida a dois
        </p>

        <div className="mt-5 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setDiagOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-[11.5px] font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <Stethoscope className="h-3 w-3" />
            Login travou? Rodar diagnóstico
          </button>
          <button
            type="button"
            onClick={() => {
              clearAuthStorage();
              toast.success("Dados locais limpos. Tente entrar novamente.");
              setTimeout(() => window.location.reload(), 600);
            }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            Limpar dados locais
          </button>
        </div>

        <DiagnosticsDialog open={diagOpen} onClose={() => setDiagOpen(false)} />
      </motion.div>
    </div>
  );
}

interface FloatingInputProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
}

function FloatingInput({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  minLength,
  required,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const active = focused || !!value;

  return (
    <div className="group relative">
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-0 origin-left transition-all duration-200",
          active
            ? "top-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary"
            : "top-3.5 text-sm text-muted-foreground"
        )}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        className={cn(
          "h-12 w-full border-0 border-b bg-transparent pb-2 pt-5 text-[15px] text-foreground outline-none transition-colors",
          "border-border focus:border-primary",
          "autofill:bg-transparent"
        )}
      />
    </div>
  );
}
