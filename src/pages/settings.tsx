import { useState } from "react";
import { Heart, RefreshCw, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCouple } from "@/hooks/use-couple";
import { PageHero } from "@/components/page-hero";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { btnPrimary } from "@/lib/ui";

export function SettingsPage() {
  const { user } = useAuth();
  const { couple, members, updateCouple, updateMyProfile } = useCouple();

  const me = members.find((m) => m.user_id === user?.id);
  const [coupleName, setCoupleName] = useState(couple?.name ?? "");
  const [startDate, setStartDate] = useState(couple?.start_date ?? "");
  const [displayName, setDisplayName] = useState(me?.display_name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      if (couple && (coupleName !== couple.name || startDate !== (couple.start_date ?? ""))) {
        await updateCouple({
          name: coupleName.trim() || "Nosso casal",
          start_date: startDate || null,
        });
      }
      if (me && displayName !== (me.display_name ?? "")) {
        await updateMyProfile({ display_name: displayName.trim() || null });
      }
      toast.success("Salvo");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Personalizar"
        title={
          <>
            Nossos <span className="font-serif italic text-primary">ajustes</span>
          </>
        }
        subtitle="Detalhes do app e da nossa história."
        ambient="rose"
      />

      {/* Couple details */}
      <section className="mb-6 rounded-3xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Heart className="h-3.5 w-3.5 text-primary" fill="currentColor" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Nossa história
          </h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nome do casal</Label>
            <Input
              value={coupleName}
              onChange={(e) => setCoupleName(e.target.value)}
              placeholder="Ex: Nosso casal"
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Data que começamos a namorar
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10"
            />
            <p className="text-[11px] text-muted-foreground/80">
              Usada no contador de dias juntos da home.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Apelido carinhoso</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Como o app deve te chamar"
              className="h-10"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className={btnPrimary}
            >
              {savingProfile ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      </section>

      <AppVersionSection />
    </>
  );
}

function AppVersionSection() {
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const fn = (
        window as unknown as { __organizaiCheckForUpdate?: () => Promise<boolean> }
      ).__organizaiCheckForUpdate;
      if (!fn) {
        toast.info("Atualização automática não está disponível neste contexto.");
        return;
      }
      const hasUpdate = await fn();
      if (hasUpdate) {
        toast.success("Nova versão encontrada! Toque na pílula no canto pra aplicar.");
      } else {
        toast.success("Você já está na versão mais recente.");
      }
    } finally {
      setChecking(false);
    }
  };

  const version =
    (window as unknown as { __organizaiAppVersion?: string }).__organizaiAppVersion ??
    (typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "—");

  return (
    <section className="mb-6 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Smartphone className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          App
        </h3>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-tight">OrganizAI</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground tabular">
            Build {version}
          </p>
        </div>
        <button
          onClick={handleCheck}
          disabled={checking}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-4 py-2 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-primary/[0.04] disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Verificando…" : "Verificar atualização"}
        </button>
      </div>
    </section>
  );
}
