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

const fetchToggles = async (): Promise<FeatureToggleState> => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const cacheTime = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < CACHE_DURATION) {
      return JSON.parse(cached);
    }
  } catch {}

  const { data, error } = await supabase
    .from("feature_toggles")
    .select("feature_key, is_enabled");

  const result: FeatureToggleState = {};
  if (!error && data) {
    data.forEach((f) => {
      result[f.feature_key] = f.is_enabled;
    });
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
      localStorage.setItem(CACHE_EXPIRY_KEY, Date.now().toString());
    } catch {}
  }
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
    if (globalToggles) {
      setToggles(globalToggles);
      setIsLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetchToggles();
    }

    fetchPromise.then((data) => {
      globalToggles = data;
      setToggles(data);
      setIsLoading(false);
      fetchPromise = null;
    });
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
      ? "ฟีเจอร์พิเศษยังไม่เปิดใช้งาน"
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
