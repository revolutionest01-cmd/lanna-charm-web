import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

const VISITOR_KEY = "pp_visitor_id";
const SESSION_KEY = "pp_web_session_id";

const randomId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const getVisitorId = () => {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = randomId("v");
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
};

const getSessionId = () => {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = randomId("ws");
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

const getDeviceType = (ua: string) => {
  const lowered = ua.toLowerCase();
  if (/tablet|ipad/.test(lowered)) return "tablet";
  if (/mobile|iphone|android/.test(lowered)) return "mobile";
  return "desktop";
};

const getDeviceBrand = (ua: string) => {
  const lowered = ua.toLowerCase();
  if (lowered.includes("iphone") || lowered.includes("ipad") || lowered.includes("ios")) return "Apple";
  if (lowered.includes("samsung") || lowered.includes("sm-")) return "Samsung";
  if (lowered.includes("pixel") || lowered.includes("google")) return "Google";
  if (lowered.includes("huawei") || lowered.includes("honor")) return "Huawei/Honor";
  if (lowered.includes("xiaomi") || lowered.includes("redmi") || lowered.includes("poco") || lowered.includes("mi ")) return "Xiaomi";
  if (lowered.includes("oppo") || lowered.includes("cph")) return "OPPO";
  if (lowered.includes("vivo")) return "vivo";
  if (lowered.includes("realme") || lowered.includes("rmx")) return "realme";
  if (lowered.includes("oneplus")) return "OnePlus";
  if (lowered.includes("motorola") || lowered.includes("moto")) return "Motorola";
  if (lowered.includes("sony") || lowered.includes("xperia")) return "Sony";
  return "Other";
};

const getBrowser = (ua: string) => {
  const lowered = ua.toLowerCase();
  if (lowered.includes("edg/")) return "Edge";
  if (lowered.includes("opr/") || lowered.includes("opera")) return "Opera";
  if (lowered.includes("chrome/")) return "Chrome";
  if (lowered.includes("safari/") && !lowered.includes("chrome/")) return "Safari";
  if (lowered.includes("firefox/")) return "Firefox";
  return "Other";
};

const getOS = (ua: string) => {
  const lowered = ua.toLowerCase();
  if (lowered.includes("windows")) return "Windows";
  if (lowered.includes("mac os") || lowered.includes("macintosh")) return "macOS";
  if (lowered.includes("android")) return "Android";
  if (lowered.includes("iphone") || lowered.includes("ipad") || lowered.includes("ios")) return "iOS";
  if (lowered.includes("linux")) return "Linux";
  return "Other";
};

const getUtm = (url: string) => {
  try {
    const parsed = new URL(url);
    return {
      utm_source: parsed.searchParams.get("utm_source"),
      utm_medium: parsed.searchParams.get("utm_medium"),
      utm_campaign: parsed.searchParams.get("utm_campaign"),
      utm_content: parsed.searchParams.get("utm_content"),
      utm_term: parsed.searchParams.get("utm_term"),
    };
  } catch {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    };
  }
};

const safeText = (value: string | null | undefined, max = 180) => {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.slice(0, max);
};

type AnalyticsEventInput = {
  event_name: string;
  event_category?: string;
  page_path?: string;
  current_url?: string;
  referrer?: string | null;
  element_id?: string | null;
  element_text?: string | null;
  element_type?: string | null;
  event_value?: number;
  duration_seconds?: number;
  scroll_depth?: number;
  metadata?: Record<string, unknown>;
};

const sendAnalyticsEvent = async (payload: AnalyticsEventInput) => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const ua = navigator.userAgent || "";
    const url = payload.current_url || window.location.href;

    const event = {
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      user_id: authData.user?.id || null,
      event_name: payload.event_name,
      event_category: payload.event_category || null,
      page_path: payload.page_path || window.location.pathname,
      current_url: url,
      referrer: payload.referrer ?? document.referrer ?? null,
      element_id: payload.element_id || null,
      element_text: payload.element_text || null,
      element_type: payload.element_type || null,
      event_value: payload.event_value ?? null,
      duration_seconds: payload.duration_seconds ?? null,
      scroll_depth: payload.scroll_depth ?? null,
      device_type: getDeviceType(ua),
      device_brand: getDeviceBrand(ua),
      browser: getBrowser(ua),
      os: getOS(ua),
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language || null,
      country_code: null,
      ...getUtm(url),
      metadata: (payload.metadata ?? null) as Json,
    };

    await supabase.from("web_analytics_events").insert(event);
  } catch (error) {
    console.error("web analytics event error:", error);
  }
};

export const trackWebEvent = (payload: AnalyticsEventInput) => {
  void sendAnalyticsEvent(payload);
};

export const useWebAnalyticsTracking = (enabled: boolean) => {
  const location = useLocation();
  const pageStartRef = useRef<number>(Date.now());
  const activeStartRef = useRef<number>(Date.now());
  const activeSecondsRef = useRef<number>(0);
  const heartbeatIntervalRef = useRef<number | null>(null);
  const sentScrollDepthRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    const currentPath = location.pathname + location.search + location.hash;
    pageStartRef.current = Date.now();
    activeStartRef.current = Date.now();
    activeSecondsRef.current = 0;
    sentScrollDepthRef.current = new Set();

    trackWebEvent({
      event_name: "page_view",
      event_category: "navigation",
      page_path: location.pathname,
      current_url: window.location.href,
      metadata: { path: currentPath, title: document.title },
    });

    const onVisibilityChange = () => {
      if (document.hidden) {
        const activeDelta = Math.round((Date.now() - activeStartRef.current) / 1000);
        activeSecondsRef.current += Math.max(activeDelta, 0);
      } else {
        activeStartRef.current = Date.now();
      }
    };

    const emitLeaveEvent = () => {
      const elapsed = Math.round((Date.now() - pageStartRef.current) / 1000);
      const activeDelta = document.hidden ? 0 : Math.round((Date.now() - activeStartRef.current) / 1000);
      const engaged = activeSecondsRef.current + Math.max(activeDelta, 0);

      trackWebEvent({
        event_name: "page_leave",
        event_category: "engagement",
        page_path: location.pathname,
        current_url: window.location.href,
        duration_seconds: elapsed,
        metadata: {
          engaged_time_sec: engaged,
          total_time_sec: elapsed,
        },
      });
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const element = target.closest("button, a, [role='button'], [data-analytics-event]") as HTMLElement | null;
      if (!element) return;

      const elementText = safeText(element.textContent || element.getAttribute("aria-label"), 120);
      const elementId = safeText(element.id || element.getAttribute("data-analytics-id") || null, 120);
      const tagName = element.tagName.toLowerCase();
      const customEventName = safeText(element.getAttribute("data-analytics-event"), 80);

      let eventName = customEventName || "button_click";
      if (tagName === "a") eventName = customEventName || "link_click";
      if ((elementText || "").toLowerCase().includes("จอง") || (elementText || "").toLowerCase().includes("book")) {
        eventName = "booking_cta_click";
      }

      trackWebEvent({
        event_name: eventName,
        event_category: "interaction",
        page_path: location.pathname,
        current_url: window.location.href,
        element_id: elementId,
        element_text: elementText,
        element_type: tagName,
      });
    };

    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height <= 0) return;
      const depth = Math.min(100, Math.round((window.scrollY / height) * 100));
      const marks = [25, 50, 75, 100];
      marks.forEach((mark) => {
        if (depth >= mark && !sentScrollDepthRef.current.has(mark)) {
          sentScrollDepthRef.current.add(mark);
          trackWebEvent({
            event_name: "scroll_depth",
            event_category: "engagement",
            page_path: location.pathname,
            current_url: window.location.href,
            scroll_depth: mark,
          });
        }
      });
    };

    heartbeatIntervalRef.current = window.setInterval(() => {
      if (document.hidden) return;
      trackWebEvent({
        event_name: "engagement_heartbeat",
        event_category: "engagement",
        page_path: location.pathname,
        current_url: window.location.href,
        duration_seconds: 15,
      });
    }, 15000);

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("click", onClick, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", emitLeaveEvent);

    return () => {
      emitLeaveEvent();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", emitLeaveEvent);
      if (heartbeatIntervalRef.current) {
        window.clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [enabled, location]);
};
