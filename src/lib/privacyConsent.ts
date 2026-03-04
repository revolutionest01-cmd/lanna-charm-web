import { supabase } from "@/integrations/supabase/client";

export const PRIVACY_POLICY_VERSION = "2026-03-04";
const CONSENT_STORAGE_KEY = "pp_privacy_consent_v1";
const VISITOR_KEY = "pp_visitor_id";
const SESSION_KEY = "pp_web_session_id";

export type PrivacyConsentStatus = "pending" | "accepted" | "rejected";

export interface PrivacyConsentState {
  status: PrivacyConsentStatus;
  analyticsAllowed: boolean;
  policyVersion: string;
  updatedAt: string | null;
}

const randomId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const ensureVisitorId = () => {
  let value = localStorage.getItem(VISITOR_KEY);
  if (!value) {
    value = randomId("v");
    localStorage.setItem(VISITOR_KEY, value);
  }
  return value;
};

const ensureSessionId = () => {
  let value = sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = randomId("ws");
    sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
};

export const getPrivacyConsentState = (): PrivacyConsentState => {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) {
      return {
        status: "pending",
        analyticsAllowed: false,
        policyVersion: PRIVACY_POLICY_VERSION,
        updatedAt: null,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PrivacyConsentState>;
    if (parsed.status !== "accepted" && parsed.status !== "rejected") {
      return {
        status: "pending",
        analyticsAllowed: false,
        policyVersion: PRIVACY_POLICY_VERSION,
        updatedAt: null,
      };
    }
    return {
      status: parsed.status,
      analyticsAllowed: Boolean(parsed.analyticsAllowed),
      policyVersion: typeof parsed.policyVersion === "string" ? parsed.policyVersion : PRIVACY_POLICY_VERSION,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    };
  } catch {
    return {
      status: "pending",
      analyticsAllowed: false,
      policyVersion: PRIVACY_POLICY_VERSION,
      updatedAt: null,
    };
  }
};

export const setPrivacyConsentState = (status: Exclude<PrivacyConsentStatus, "pending">, analyticsAllowed: boolean) => {
  const next: PrivacyConsentState = {
    status,
    analyticsAllowed,
    policyVersion: PRIVACY_POLICY_VERSION,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("privacy-consent-updated", { detail: next }));
  return next;
};

export const savePrivacyConsentLog = async (
  status: Exclude<PrivacyConsentStatus, "pending">,
  analyticsAllowed: boolean,
  locale: string,
  source: string
) => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    await supabase.from("privacy_consent_logs").insert({
      user_id: authData.user?.id || null,
      visitor_id: ensureVisitorId(),
      session_id: ensureSessionId(),
      consent_status: status,
      analytics_allowed: analyticsAllowed,
      policy_version: PRIVACY_POLICY_VERSION,
      locale,
      source,
      current_url: window.location.href,
      user_agent: navigator.userAgent,
      metadata: {
        browser_language: navigator.language,
        platform: navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    });
  } catch (error) {
    console.warn("[privacyConsent] log insert failed", error);
  }
};