import { useCallback, useEffect, useState } from "react";
import {
  getCurrentSubscription,
  getPermission,
  isIOSStandaloneRequired,
  isPushSupported,
  subscribe as subscribeToPush,
  unsubscribe as unsubscribeFromPush,
} from "@/lib/push";
import { useAuth } from "@/hooks/use-auth";
import { useCouple } from "@/hooks/use-couple";

interface UsePushReturn {
  /** Browser tem PushManager + Notification + SW. */
  supported: boolean;
  /** iOS Safari NÃO instalado como PWA — precisa instalar primeiro. */
  needsIOSInstall: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  loading: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  /** Re-checa estado (útil depois de mudar permissão nas configs do browser). */
  refresh: () => Promise<void>;
}

export function usePush(): UsePushReturn {
  const { user } = useAuth();
  const { couple } = useCouple();

  const supported = isPushSupported();
  const needsIOSInstall = isIOSStandaloneRequired();

  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? getPermission() : "denied"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supported) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setPermission(getPermission());
      const sub = await getCurrentSubscription();
      setIsSubscribed(!!sub);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!user) throw new Error("Não autenticado");
    if (!couple) throw new Error("Casal não carregado ainda");
    setLoading(true);
    try {
      await subscribeToPush(user.id, couple.id);
      setIsSubscribed(true);
      setPermission(getPermission());
    } finally {
      setLoading(false);
    }
  }, [user, couple]);

  const disable = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      await unsubscribeFromPush(user.id);
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    supported,
    needsIOSInstall,
    permission,
    isSubscribed,
    loading,
    enable,
    disable,
    refresh,
  };
}
