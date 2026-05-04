/**
 * Web Push utilities — manage browser subscription + sync com Supabase.
 *
 * Fluxo:
 *   1. `isPushSupported()` — checa capabilities (PushManager, Notification, SW)
 *   2. `getPermission()` — granted | denied | default
 *   3. `subscribe(userId, coupleId)` — pede permissão (se default), chama
 *      pushManager.subscribe(), grava em `push_subscriptions`
 *   4. `unsubscribe(userId)` — desinscreve do browser + remove do DB
 */
import { supabase } from "@/lib/supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** iOS PWA: o push só funciona instalado na home. */
export function isIOSStandaloneRequired(): boolean {
  if (typeof window === "undefined") return false;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!isIOS) return false;
  // Standalone mode (instalado como PWA) — Apple flag
  const standalone =
    (
      window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches
    ) ||
    // legacy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true;
  return !standalone;
}

export function getPermission(): NotificationPermission {
  if (!isPushSupported()) return "denied";
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}

function detectDeviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPad/.test(ua)) return "iPad";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return "Outro dispositivo";
}

async function getOrCreateRegistration(): Promise<ServiceWorkerRegistration> {
  const reg =
    (await navigator.serviceWorker.getRegistration()) ??
    (await navigator.serviceWorker.ready);
  return reg;
}

/**
 * Pede permissão (se ainda não foi pedida), assina no PushManager, e grava
 * a subscription no Supabase. Retorna o id da subscription criada.
 */
export async function subscribe(
  userId: string,
  coupleId: string | null
): Promise<{ subscriptionId: string }> {
  if (!isPushSupported()) {
    throw new Error("Notificações não são suportadas neste dispositivo");
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error("VAPID público não configurado (VITE_VAPID_PUBLIC_KEY)");
  }
  if (isIOSStandaloneRequired()) {
    throw new Error(
      "No iPhone, instale o app na tela de início primeiro (Compartilhar → Adicionar à Tela de Início)"
    );
  }

  // 1. Permissão
  if (Notification.permission === "default") {
    const result = await Notification.requestPermission();
    if (result !== "granted") {
      throw new Error("Permissão negada");
    }
  } else if (Notification.permission === "denied") {
    throw new Error(
      "Permissão de notificações foi bloqueada. Habilite nas configurações do navegador."
    );
  }

  // 2. PushManager
  const reg = await getOrCreateRegistration();
  const existing = await reg.pushManager.getSubscription();
  let sub = existing;
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const p256dh = arrayBufferToBase64(sub.getKey("p256dh"));
  const authKey = arrayBufferToBase64(sub.getKey("auth"));

  // 3. Grava no Supabase (upsert por endpoint)
  const { data, error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: userId,
        couple_id: coupleId,
        endpoint: sub.endpoint,
        p256dh,
        auth: authKey,
        device_label: detectDeviceLabel(),
        user_agent: navigator.userAgent.slice(0, 200),
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "user_id,endpoint" }
    )
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { subscriptionId: data!.id as string };
}

/** Desinscreve do PushManager e remove do banco. */
export async function unsubscribe(userId: string): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  const endpoint = sub?.endpoint ?? null;

  if (sub) {
    try {
      await sub.unsubscribe();
    } catch (err) {
      console.warn("[push] unsubscribe failed", err);
    }
  }

  if (endpoint) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", endpoint);
  }
}

/** Existe uma subscription ativa pra este browser? */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}
