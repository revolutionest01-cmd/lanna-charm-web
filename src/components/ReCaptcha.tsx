import { useEffect, useRef } from "react";

declare global {
  interface Window {
    grecaptcha: {
      render: (
        container: HTMLElement,
        parameters: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => number;
      reset: (widgetId: number) => void;
    };
  }
}

interface ReCaptchaProps {
  onVerify: (token: string | null) => void;
  onExpired?: () => void;
  onError?: () => void;
}

const RECAPTCHA_SITE_KEY = "6LfY-RYsAAAAAPhYTxpkcvm4sOwKVyeOYfWKQDoo";

const ReCaptcha = ({ onVerify, onExpired, onError }: ReCaptchaProps) => {
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    const loadRecaptcha = () => {
      if (!recaptchaRef.current || !window.grecaptcha) {
        setTimeout(loadRecaptcha, 100);
        return;
      }

      if (widgetIdRef.current !== null) {
        window.grecaptcha.reset(widgetIdRef.current);
        return;
      }

      widgetIdRef.current = window.grecaptcha.render(recaptchaRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: onVerify,
        "expired-callback": onExpired,
        "error-callback": onError,
      });
    };

    loadRecaptcha();

    return () => {
      if (widgetIdRef.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
    };
  }, [onVerify, onExpired, onError]);

  return <div ref={recaptchaRef} className="flex justify-center" />;
};

export default ReCaptcha;