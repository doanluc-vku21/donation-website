// Download only the vendor SDK before hydration on Apple mobile devices.
// The pure loader discovers this script and still owns the single Stripe
// instance. No Session, wallet iframe, or payment is created by this bootstrap.
export const applePayBootstrapScript = `(() => {
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!ios || ["/akram-shake-1", "/gaza-help", "/child-health"].includes(window.location.pathname) ||
      window.Stripe || document.querySelector('script[src^="https://js.stripe.com/"]')) return;
  const script = document.createElement("script");
  script.src = "https://js.stripe.com/endive/stripe.js";
  script.async = true;
  script.addEventListener("error", () => script.remove(), { once: true });
  document.head.appendChild(script);
})();`;
