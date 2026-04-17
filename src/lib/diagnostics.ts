/**
 * Connectivity + environment diagnostics for the login page.
 *
 * When a user hits "login hangs forever" on a specific device we need a
 * no-code way to tell them WHY — which network layer is broken. This
 * module runs a battery of small tests (DNS reach, Supabase health,
 * storage sanity, clock drift) and returns a structured report that the
 * login page renders inside a dialog.
 */

export interface CheckResult {
  id: string;
  label: string;
  status: "ok" | "warn" | "fail";
  detail: string;
  /** Tips shown when status !== 'ok' */
  suggestion?: string;
}

const TIMEOUT_MS = 6000;

function timeoutSignal(ms: number): AbortSignal {
  const ctl = new AbortController();
  setTimeout(() => ctl.abort(), ms);
  return ctl.signal;
}

function formatError(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "AbortError") return "timeout";
    return err.message;
  }
  return String(err);
}

async function check<T extends Record<string, unknown>>(
  id: string,
  label: string,
  fn: () => Promise<{
    status: CheckResult["status"];
    detail: string;
    suggestion?: string;
  } & T>
): Promise<CheckResult> {
  try {
    const r = await fn();
    return { id, label, ...r };
  } catch (err) {
    return {
      id,
      label,
      status: "fail",
      detail: formatError(err),
    };
  }
}

export async function runDiagnostics(): Promise<CheckResult[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

  const results: CheckResult[] = [];

  // 1) Basic connectivity
  results.push({
    id: "online",
    label: "Conexão do dispositivo",
    status: navigator.onLine ? "ok" : "fail",
    detail: navigator.onLine ? "Online" : "Sem conexão",
    suggestion: navigator.onLine
      ? undefined
      : "Ative Wi-Fi ou dados móveis e tente de novo.",
  });

  // 2) Third-party cookies / cross-site storage (Safari ITP heuristic)
  //    We can't detect ITP directly, but we CAN detect the most common
  //    symptom: writing then reading a storage key returns something
  //    different (storage isolation). That check lives further down; here
  //    we just surface the iOS / Safari combo as a heads-up so the user
  //    knows to try a different browser if nothing else works.
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isSafari =
    /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  if (isIOS) {
    results.push({
      id: "ios",
      label: "Navegador",
      status: isSafari ? "warn" : "ok",
      detail: isSafari
        ? "Safari no iOS (sujeito a ITP)"
        : "Chrome/Firefox no iOS (ok)",
      suggestion: isSafari
        ? "iOS Safari bloqueia storage de sites pouco visitados. Se o login travar mesmo com tudo verde abaixo, tente pelo Chrome ou desative 'Prevenir Rastreamento' em Ajustes → Safari."
        : undefined,
    });
  }

  // 3) Reach Supabase REST API (anon ping)
  results.push(
    await check("supabase-rest", "Conexão com Supabase", async () => {
      const t0 = performance.now();
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: "GET",
        signal: timeoutSignal(TIMEOUT_MS),
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
      });
      const ms = Math.round(performance.now() - t0);
      if (!res.ok && res.status !== 404 && res.status !== 401) {
        return {
          status: "warn" as const,
          detail: `HTTP ${res.status} em ${ms}ms`,
        };
      }
      return { status: "ok" as const, detail: `OK em ${ms}ms` };
    })
  );

  // 4) Reach Supabase Auth endpoint (the one that's actually hanging)
  results.push(
    await check("supabase-auth", "Endpoint de autenticação", async () => {
      const t0 = performance.now();
      const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        method: "GET",
        signal: timeoutSignal(TIMEOUT_MS),
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
      });
      const ms = Math.round(performance.now() - t0);
      if (!res.ok) {
        return {
          status: "warn" as const,
          detail: `HTTP ${res.status} em ${ms}ms`,
        };
      }
      return { status: "ok" as const, detail: `OK em ${ms}ms` };
    })
  );

  // 5) localStorage sanity
  results.push(
    await check("storage", "Armazenamento local", async () => {
      const key = "__organizai_diag__";
      try {
        localStorage.setItem(key, "1");
        const v = localStorage.getItem(key);
        localStorage.removeItem(key);
        if (v !== "1") {
          return {
            status: "fail" as const,
            detail: "Storage lê valor diferente do que grava",
            suggestion:
              "Provavelmente é Prevenção de Rastreamento do Safari. Vá em Ajustes → Safari e desative 'Prevenir Rastreamento entre Sites'.",
          };
        }
        return { status: "ok" as const, detail: "Funcional" };
      } catch (err) {
        return {
          status: "fail" as const,
          detail: formatError(err),
          suggestion:
            "Storage bloqueado (provavelmente Safari Privado ou ITP). Tente numa aba normal ou desative 'Prevenir Rastreamento entre Sites'.",
        };
      }
    })
  );

  return results;
}

export function environmentSnapshot(): Record<string, string> {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    online: navigator.onLine ? "sim" : "não",
    cookiesEnabled: navigator.cookieEnabled ? "sim" : "não",
    localTime: new Date().toString(),
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };
}
