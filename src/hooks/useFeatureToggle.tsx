import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import sweetAlert from "@/lib/sweetAlert";

interface FeatureToggleState {
  [key: string]: boolean;
}

const CACHE_KEY = "feature-toggles-cache";
const CACHE_EXPIRY_KEY = "feature-toggles-cache-time";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let globalToggles: FeatureToggleState | null = null;
let fetchPromise: Promise<FeatureToggleState> | null = null;
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
const subscribers = new Set<(next: FeatureToggleState) => void>();

const writeCache = (next: FeatureToggleState) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
    localStorage.setItem(CACHE_EXPIRY_KEY, Date.now().toString());
  } catch {
    // Ignore cache write failures (private mode / storage quota)
  }
};

const updateGlobalToggles = (next: FeatureToggleState) => {
  globalToggles = next;
  writeCache(next);
  subscribers.forEach((notify) => notify(next));
};

const fetchTogglesFromServer = async (): Promise<FeatureToggleState> => {
  const { data, error } = await supabase
    .from("feature_toggles")
    .select("feature_key, is_enabled");

  const result: FeatureToggleState = {};
  if (!error && data) {
    data.forEach((f) => {
      result[f.feature_key] = f.is_enabled;
    });
  }
  return result;
};

const refreshTogglesNow = async () => {
  const fresh = await fetchTogglesFromServer();
  updateGlobalToggles(fresh);
  return fresh;
};

const ensureRealtimeSubscription = () => {
  if (realtimeChannel) return;

  realtimeChannel = supabase
    .channel("feature-toggles-global-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "feature_toggles" },
      () => {
        void refreshTogglesNow();
      }
    )
    .subscribe();
};

const cleanupRealtimeSubscription = () => {
  if (!realtimeChannel) return;
  supabase.removeChannel(realtimeChannel);
  realtimeChannel = null;
};

const fetchToggles = async (): Promise<FeatureToggleState> => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const cacheTime = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < CACHE_DURATION) {
      return JSON.parse(cached);
    }
  } catch {
    // Ignore cache read failures and fetch from server instead
  }

  const result = await fetchTogglesFromServer();
  writeCache(result);
  return result;
};

/**
 * Hook to check if a feature is enabled.
 * Returns { isEnabled, isLoading, checkFeature }
 */
export const useFeatureToggle = () => {
  const [toggles, setToggles] = useState<FeatureToggleState>(globalToggles || {});
  const [isLoading, setIsLoading] = useState(!globalToggles);

  useEffect(() => {
    subscribers.add(setToggles);
    ensureRealtimeSubscription();

    const refreshImmediately = async () => {
      try {
        await refreshTogglesNow();
      } finally {
        setIsLoading(false);
      }
    };

    const handleVisibilityOrFocus = () => {
      void refreshTogglesNow();
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    if (globalToggles) {
      setToggles(globalToggles);
      void refreshImmediately();
    } else {
      if (!fetchPromise) {
        fetchPromise = fetchToggles();
      }

      fetchPromise.then((data) => {
        updateGlobalToggles(data);
        fetchPromise = null;
        void refreshImmediately();
      }).catch(() => {
        fetchPromise = null;
        setIsLoading(false);
      });
    }

    return () => {
      subscribers.delete(setToggles);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      if (subscribers.size === 0) {
        cleanupRealtimeSubscription();
      }
    };
  }, []);

  const isFeatureEnabled = (key: string): boolean => {
    // Default to enabled if not found
    return toggles[key] !== false;
  };

  return { toggles, isLoading, isFeatureEnabled };
};

/**
 * Show SweetAlert when a disabled feature is accessed
 */
export const showFeatureDisabledAlert = (language: string) => {
  sweetAlert.warning(
    language === "th"
      ? "ขณะนี้ระบบไม่พร้อมใช้งานค่ะ"
      : "This feature is not yet enabled",
    language === "th"
      ? "โปรดติดต่อผู้พัฒนาเพื่อเปิดใช้งาน"
      : "Please contact the developer to enable it"
  );
};

export const clearFeatureToggleCache = () => {
  globalToggles = null;
  fetchPromise = null;
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_EXPIRY_KEY);
};
