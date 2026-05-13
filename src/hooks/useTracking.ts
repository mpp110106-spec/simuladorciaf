import { useCallback, useEffect, useRef } from "react";
import { analyticsService } from "@/services/analyticsService";

const SESSION_KEY = "ciaf_session_id";

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return "anonymous";
  }
}

function detectDevice(ua: string): string {
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}
function detectBrowser(ua: string): string {
  if (/edg/i.test(ua)) return "Edge";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return "Otro";
}
function detectOS(ua: string): string {
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os|macintosh/i.test(ua)) return "macOS";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ios/i.test(ua)) return "iOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Otro";
}

export function useTracking() {
  const track = useCallback((evento: string, metadata?: Record<string, unknown>) => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    void analyticsService.track({
      evento,
      pagina: typeof window !== "undefined" ? window.location.pathname : null,
      metadata: metadata ?? null,
      dispositivo: detectDevice(ua),
      navegador: detectBrowser(ua),
      sistema_operativo: detectOS(ua),
      session_id: getSessionId(),
    });
  }, []);
  return { track };
}

export function usePageView(evento: string) {
  const { track } = useTracking();
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(evento);
  }, [evento, track]);
}