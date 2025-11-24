/// <reference types="vite/client" />

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
