import { useRef, useState } from "react";
import {
  Heart,
  RefreshCw,
  Smartphone,
  Bell,
  BellOff,
  Share,
  ImagePlus,
  Trash2,
  Loader2,
  Palette,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCouple } from "@/hooks/use-couple";
import { usePush } from "@/hooks/use-push";
import { PageHero } from "@/components/page-hero";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { btnPrimary } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { uploadCoupleLogo, deleteCoupleLogo } from "@/lib/logo-upload";

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

      <LogoSection />
      <AccentColorSection />

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

      <NotificationsSection />
      <AppVersionSection />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Accent color picker                                                        */
/* -------------------------------------------------------------------------- */

interface AccentSwatch {
  name: string;
  hue: number; // OKLCH hue
}

const ACCENT_SWATCHES: AccentSwatch[] = [
  { name: "Coral", hue: 22 },
  { name: "Pêssego", hue: 45 },
  { name: "Âmbar", hue: 70 },
  { name: "Esmeralda", hue: 160 },
  { name: "Ciano", hue: 200 },
  { name: "Azul", hue: 240 },
  { name: "Violeta", hue: 270 },
  { name: "Lavanda", hue: 300 },
  { name: "Magenta", hue: 320 },
  { name: "Rosé", hue: 350 },
];

function AccentColorSection() {
  const { couple, updateCouple } = useCouple();
  const [pending, setPending] = useState<number | null | "default">(null);

  const currentHue = couple?.accent_hue ?? null;

  const handlePick = async (hue: number | null) => {
    if (!couple) return;
    setPending(hue ?? "default");
    try {
      await updateCouple({ accent_hue: hue });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar cor");
    } finally {
      setPending(null);
    }
  };

  return (
    <section className="mb-6 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Palette className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Cor de destaque
        </h3>
      </div>

      <p className="mb-4 text-[13px] text-muted-foreground">
        Vai pintar botões, links, ícones ativos e a barra lateral. Aparece nos
        dois celulares.
      </p>

      <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
        {ACCENT_SWATCHES.map((s) => {
          const active = currentHue === s.hue;
          const isLoading = pending === s.hue;
          return (
            <button
              key={s.hue}
              type="button"
              onClick={() => handlePick(s.hue)}
              disabled={pending !== null}
              aria-label={`${s.name}${active ? " (atual)" : ""}`}
              title={s.name}
              className={cn(
                "relative aspect-square w-full rounded-full transition-all",
                "ring-2 ring-offset-2 ring-offset-card",
                active
                  ? "ring-foreground scale-105 shadow-lg"
                  : "ring-transparent hover:ring-foreground/30 hover:scale-105",
                pending !== null && !isLoading && "opacity-40"
              )}
              style={{
                backgroundColor: `oklch(0.78 0.155 ${s.hue})`,
              }}
            >
              {active && (
                <Check
                  className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow"
                  strokeWidth={3}
                />
              )}
              {isLoading && (
                <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" />
              )}
            </button>
          );
        })}
      </div>

      {currentHue !== null && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border/60 bg-background/40 p-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Atual
            </p>
            <p className="mt-0.5 text-sm font-semibold tracking-tight">
              {ACCENT_SWATCHES.find((s) => s.hue === currentHue)?.name ?? "Personalizada"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handlePick(null)}
            disabled={pending !== null}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
          >
            {pending === "default" ? "Voltando…" : "Voltar pro padrão"}
          </button>
        </div>
      )}
    </section>
  );
}

function LogoSection() {
  const { couple, updateCouple } = useCouple();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!couple) return;
    setUploading(true);
    try {
      const previous = couple.logo_url;
      const url = await uploadCoupleLogo(file, couple.id);
      await updateCouple({ logo_url: url });
      // Best-effort cleanup of the previous logo
      if (previous) deleteCoupleLogo(previous).catch(() => void 0);
      toast.success("Logo atualizada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!couple || !couple.logo_url) return;
    setUploading(true);
    try {
      const previous = couple.logo_url;
      await updateCouple({ logo_url: null });
      if (previous) deleteCoupleLogo(previous).catch(() => void 0);
      toast.success("Voltamos pra logo padrão");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="mb-6 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <ImagePlus className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Logo do casal
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20">
            {couple?.logo_url ? (
              <img
                src={couple.logo_url}
                alt="Logo do casal"
                className="h-full w-full object-cover"
              />
            ) : (
              <Heart
                className="h-9 w-9 text-primary"
                fill="currentColor"
                strokeWidth={0}
              />
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold tracking-tight">
            {couple?.logo_url ? "Logo personalizada" : "Coração padrão"}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Aparece no app, no login e nas notificações que vocês recebem.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePick}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-4 py-2 text-xs font-semibold transition-all hover:border-primary/40 hover:bg-primary/[0.04] disabled:opacity-50"
          >
            <ImagePlus className="h-3 w-3" />
            {couple?.logo_url ? "Trocar" : "Enviar"}
          </button>
          {couple?.logo_url && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              aria-label="Remover logo"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/80">
        ⚠️ O ícone na <span className="font-semibold">tela de início do iPhone</span>{" "}
        é fixo (limitação do iOS) — só atualiza se vocês reinstalarem o atalho.
        O resto (login, sidebar, home, notificações) muda na hora.
      </p>
    </section>
  );
}

function NotificationsSection() {
  const {
    supported,
    needsIOSInstall,
    permission,
    isSubscribed,
    loading,
    enable,
    disable,
  } = usePush();
  const [busy, setBusy] = useState(false);

  const handleToggle = async () => {
    setBusy(true);
    try {
      if (isSubscribed) {
        await disable();
        toast.success("Notificações desativadas");
      } else {
        await enable();
        toast.success("Notificações ligadas");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao alternar");
    } finally {
      setBusy(false);
    }
  };

  // Estados especiais
  if (!supported) {
    return (
      <section className="mb-6 rounded-3xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <BellOff className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Notificações
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Este navegador não suporta notificações push.
        </p>
      </section>
    );
  }

  if (needsIOSInstall) {
    return (
      <section className="mb-6 rounded-3xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Notificações
          </h3>
        </div>
        <p className="text-sm font-medium text-foreground">
          Instale o app primeiro
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          No iPhone, notificações só funcionam quando o OrganizAI tá instalado
          na tela de início.
        </p>
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border/60 bg-background/40 p-3 text-[12px] text-muted-foreground">
          <Share className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.25} />
          <p>
            No Safari, toque no botão de <span className="font-semibold text-foreground">Compartilhar</span> →{" "}
            <span className="font-semibold text-foreground">Adicionar à Tela de Início</span>.
            Depois abra o app pelo ícone e volte aqui.
          </p>
        </div>
      </section>
    );
  }

  const blocked = permission === "denied";

  return (
    <section className="mb-6 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Notificações
        </h3>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold tracking-tight">
            Avisar quando ela adicionar algo
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {blocked
              ? "Permissão bloqueada. Habilite nas configurações do navegador."
              : isSubscribed
              ? "Você vai receber um toque pra cada novo filme, mimo, foto, cartinha…"
              : "Toque pra autorizar e nunca mais perder o que ela posta"}
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={busy || loading || blocked}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50",
            isSubscribed
              ? "border border-border bg-background/50 text-foreground hover:bg-background"
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {busy || loading ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              Processando…
            </>
          ) : isSubscribed ? (
            <>
              <BellOff className="h-3 w-3" />
              Desativar
            </>
          ) : (
            <>
              <Bell className="h-3 w-3" />
              Ativar
            </>
          )}
        </button>
      </div>
    </section>
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
