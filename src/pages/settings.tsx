import { useState } from "react";
import { Heart, Copy, Check, UserPlus, Sparkles, RefreshCw, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCouple } from "@/hooks/use-couple";
import { PageHero } from "@/components/page-hero";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { btnPrimary, btnPrimarySm } from "@/lib/ui";
import { cn } from "@/lib/utils";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function SettingsPage() {
  const { user } = useAuth();
  const { couple, members, partner, isSolo, createInvite, redeemInvite, updateCouple, updateMyProfile } =
    useCouple();

  const [code, setCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const me = members.find((m) => m.user_id === user?.id);
  const [coupleName, setCoupleName] = useState(couple?.name ?? "");
  const [startDate, setStartDate] = useState(couple?.start_date ?? "");
  const [displayName, setDisplayName] = useState(me?.display_name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const handleGenerateInvite = async () => {
    setGenerating(true);
    try {
      const c = await createInvite();
      setCode(c);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Código copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    try {
      await redeemInvite(redeemCode);
      toast.success("Conectados! 💞");
      setRedeemCode("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setRedeeming(false);
    }
  };

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
        eyebrow="Casal"
        title={
          <>
            Nosso <span className="font-serif italic text-primary">cantinho</span>
          </>
        }
        subtitle={
          partner
            ? `Você e ${partner.display_name ?? "seu par"} compartilham este espaço.`
            : "Convide seu amor pra dividir o app — em tempo real."
        }
        ambient="rose"
      />

      {/* Members */}
      <section className="mb-6 rounded-3xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Heart className="h-3.5 w-3.5 text-primary" fill="currentColor" />
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Quem está aqui
          </h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => {
            const isMe = m.user_id === user?.id;
            const initial = (m.display_name ?? "?")[0]?.toUpperCase() ?? "?";
            return (
              <div
                key={m.user_id}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/40 p-3"
              >
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full font-serif text-lg font-semibold",
                    isMe ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-muted text-foreground"
                  )}
                >
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold tracking-tight">
                    {m.display_name ?? "Sem nome"} {isMe && <span className="text-[10px] font-medium text-muted-foreground">· você</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Entrou em {formatDate(m.joined_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Invite / Join */}
      {isSolo && (
        <section className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <UserPlus className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Convidar parceiro(a)
              </h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Gere um código e mande pra ela(e). Ao usar, vai entrar no nosso casal e tudo passa a ser compartilhado.
            </p>
            {!code ? (
              <button
                onClick={handleGenerateInvite}
                disabled={generating}
                className={cn(btnPrimary, "w-full")}
              >
                {generating ? "Gerando…" : "Gerar código de convite"}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-3">
                  <Input
                    readOnly
                    value={code}
                    className="h-10 flex-1 border-0 bg-transparent text-center font-serif text-2xl font-semibold tabular tracking-[0.18em] focus-visible:ring-0"
                  />
                  <button
                    onClick={handleCopy}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary transition-all hover:bg-primary/25"
                    aria-label="Copiar"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-center text-[11px] text-muted-foreground">
                  Válido por 14 dias.
                </p>
                <button
                  onClick={handleGenerateInvite}
                  disabled={generating}
                  className="block w-full text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Gerar outro
                </button>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Tem código?
              </h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Cole o código que ela(e) enviou. Seus dados se juntam ao casal automaticamente.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="ABCD1234"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                className="h-11 font-serif text-lg tabular tracking-[0.18em]"
                maxLength={12}
              />
              <button
                onClick={handleRedeem}
                disabled={!redeemCode.trim() || redeeming}
                className={btnPrimarySm}
              >
                {redeeming ? "Entrando…" : "Entrar"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Couple settings */}
      <section className="mb-6 rounded-3xl border border-border bg-card p-5 sm:p-6">
        <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Detalhes
        </h3>

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
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Seu nome no app</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu apelido carinhoso"
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
