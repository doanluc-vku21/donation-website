"use client";

import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  type StripeExpressCheckoutElementConfirmEvent,
  type StripeExpressCheckoutElementAvailablePaymentMethodsChangeEvent,
  type StripeExpressCheckoutElementReadyEvent,
} from "@stripe/stripe-js";
import { getStripePromise } from "@/lib/stripe/client";
import { getWalletPlatform } from "@/lib/stripe/wallet-platform";

import {
  CheckoutElementsProvider,
  ExpressCheckoutElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";

import type {
  Locale,
} from "@/lib/i18n";
import { getUiTranslations } from "@/lib/ui-translations";
import { metaCheckoutFetch } from "@/lib/meta/client";
import { currentWalletTiming, recordWalletTiming } from "@/lib/stripe/wallet-diagnostics";

export type ExpressAmountUpdater = (amountCents: number) => Promise<void>;

type DonationExpressCheckoutProps = {
  enabled?: boolean;
  updateContext?: string;
  onAmountUpdater?: (update: ExpressAmountUpdater) => void;
  clientSecret:
    string;

  locale:
    Locale;

  onAvailabilityChange?:
    (
      available:
        boolean,
    ) => void;

  onError?:
    (
      message:
        string,
    ) => void;

  beforeConfirm?:
    () =>
      Promise<void>;

  onExpressConfirm?:
    () => void;
};

export function DonationExpressCheckout({
  enabled = true,
  updateContext,
  onAmountUpdater,
  clientSecret,
  locale,
  onAvailabilityChange,
  onError,
  beforeConfirm,
  onExpressConfirm,
}: DonationExpressCheckoutProps) {
  return (
    <CheckoutElementsProvider
      stripe={
        getStripePromise()
      }
      options={{
        clientSecret,

        elementsOptions: {
          appearance: {
            theme:
              "stripe",

            variables: {
              colorPrimary:
                "#24543d",

              colorText:
                "#182136",

              colorDanger:
                "#dc2626",

              borderRadius:
                "11px",

              fontFamily:
                "Arial, Helvetica, sans-serif",
            },
          },
        },
      }}
    >
      <ExpressCheckoutForm
        enabled={enabled}
        updateContext={updateContext}
        clientSecret={clientSecret}
        onAmountUpdater={onAmountUpdater}
        locale={
          locale
        }
        onAvailabilityChange={
          onAvailabilityChange
        }
        onError={
          onError
        }
        beforeConfirm={
          beforeConfirm
        }
        onExpressConfirm={
          onExpressConfirm
        }
      />
    </CheckoutElementsProvider>
  );
}

function ExpressCheckoutForm({
  enabled,
  updateContext,
  clientSecret,
  onAmountUpdater,
  locale,
  onAvailabilityChange,
  onError,
  beforeConfirm,
  onExpressConfirm,
}: {
  enabled: boolean;
  updateContext?: string;
  clientSecret: string;
  onAmountUpdater?: (update: ExpressAmountUpdater) => void;
  locale:
    Locale;

  onAvailabilityChange?:
    (
      available:
        boolean,
    ) => void;

  onError?:
    (
      message:
        string,
    ) => void;

  beforeConfirm?:
    () =>
      Promise<void>;

  onExpressConfirm?:
    () => void;
}) {
  const checkoutResult =
    useCheckoutElements();
  const confirmationInFlight = useRef(false);
  // `ready` lists potentially supported methods. The change event describes
  // buttons actually rendered, including changes after hidden modal warm-up.
  const renderedAvailability = useRef<boolean | undefined>(undefined);
  const initialTimingTrace = useRef(currentWalletTiming());
  useEffect(() => {
    recordWalletTiming(checkoutResult.type === "loading" ? "sdk_loading" :
      checkoutResult.type === "success" ? "sdk_ready" : "wallet_unavailable", initialTimingTrace.current);
  }, [checkoutResult.type]);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const platform = useMemo(() => getWalletPlatform(), []);

  async function updateAmount(amountCents: number) {
    if (checkoutResult.type !== "success" || confirmationInFlight.current) {
      throw new Error("Wallet is not ready for an amount update.");
    }
    const checkout = checkoutResult.checkout;
    const trace = currentWalletTiming();
    recordWalletTiming("amount_sync_start", trace);
    let expectedTotal: number | undefined;
    const result = await checkout.runServerUpdate(async () => {
      recordWalletTiming("amount_api_start", trace);
      const response = await metaCheckoutFetch("/api/stripe/express-checkout/amount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: checkout.id, clientSecret, amountCents,
          ...(updateContext ? { updateContext } : {}) }),
      });
      const data = await response.json();
      if (!response.ok || !Number.isSafeInteger(data.totalAmountMinor)) {
        throw new Error("Unable to synchronize wallet amount.");
      }
      expectedTotal = data.totalAmountMinor;
      recordWalletTiming("amount_api_end", trace);
    });
    if (result.type === "error" || expectedTotal === undefined ||
        result.session.total.total.minorUnitsAmount !== expectedTotal) {
      throw new Error("Wallet amount synchronization failed.");
    }
    recordWalletTiming("amount_sync_end", trace);
  }

  function reportAvailability(available: boolean) {
    recordWalletTiming(available ? "wallet_ready" : "wallet_unavailable", initialTimingTrace.current);
    onAvailabilityChange?.(available);
    if (available) onAmountUpdater?.(updateAmount);
  }

  function handleReady({ availablePaymentMethods }: StripeExpressCheckoutElementReadyEvent) {
    reportAvailability(renderedAvailability.current ??
      Object.values(availablePaymentMethods ?? {}).some((available) => available === true));
  }

  function handleAvailabilityChange({ paymentMethods }: StripeExpressCheckoutElementAvailablePaymentMethodsChangeEvent) {
    const available = Object.values(paymentMethods ?? {}).some((method) => method?.available === true);
    renderedAvailability.current = available;
    reportAvailability(available);
  }

  const reportSdkError = useEffectEvent((message: string) => {
    reportAvailability(false);
    onError?.(message);
  });
  const sdkError = checkoutResult.type === "error" ? checkoutResult.error.message : undefined;
  useEffect(() => {
    if (sdkError) reportSdkError(sdkError);
  }, [sdkError]);

  async function handleConfirm(
    event:
      StripeExpressCheckoutElementConfirmEvent,
  ) {
    if (
      confirmationInFlight.current ||
      submitting ||
      checkoutResult.type !==
        "success"
    ) {
      return;
    }

    if (!enabled) {
      event.paymentFailed?.({ reason: "fail", message: getUiTranslations(locale).walletAmountUpdating });
      return;
    }

    // React batches state updates; also lock duplicate wallet events that arrive
    // before the submitting state has rerendered.
    confirmationInFlight.current = true;

    try {
      setSubmitting(
        true,
      );

      /*
       * Stripe calls onConfirm after the buyer authorizes
       * Apple Pay / Google Pay / another supported wallet.
       *
       * This is the reliable point for Meta InitiateCheckout
       * with the CheckoutElementsProvider architecture.
       */
      try {
        onExpressConfirm?.();
      } catch {
        // Safari can deny sessionStorage access. Analytics is optional and
        // must not prevent the authorized wallet event reaching Stripe.
        console.warn("Express checkout analytics callback failed.");
      }

      /*
       * IMPORTANT:
       * Never block Apple Pay / Google Pay confirmation on
       * donation-attempt bookkeeping.
       *
       * Stripe expects checkout.confirm() to run immediately
       * after the wallet authorizes the payment. Waiting for
       * Supabase / Stripe metadata requests here can leave the
       * wallet spinning on "Processing" and eventually show
       * "Payment Not Completed".
       *
       * Run bookkeeping in the background instead. A failure
       * there must never prevent the actual wallet payment.
       */
      if (
        beforeConfirm
      ) {
        try {
          void beforeConfirm().catch(() => {
            console.warn("Express checkout background bookkeeping failed.");
          });
        } catch {
          console.warn("Express checkout background bookkeeping could not start.");
        }
      }

      const result =
        await checkoutResult
          .checkout
          .confirm({
            expressCheckoutConfirmEvent:
              event,
          });

      if (
        result &&
        "type" in result &&
        result.type ===
          "error"
      ) {
        throw new Error(
          result.error
            ?.message ??
            "Unable to process express checkout.",
        );
      }
    } catch (
      error
    ) {
      confirmationInFlight.current = false;
      console.error(
        "Express checkout failed:",
        error,
      );

      onError?.(
        error instanceof
          Error
          ? error.message
          : "Unable to process express checkout.",
      );

      setSubmitting(
        false,
      );
    }
  }

  if (
    checkoutResult.type ===
      "error"
  ) {
    return null;
  }

  if (
    checkoutResult.type ===
      "loading"
  ) {
    return (
      <div
        className="
          h-[48px]
          w-full
          animate-pulse
          rounded-[12px]
          bg-[#eef1ed]
        "
      />
    );
  }

  const isIOS =
    platform ===
    "ios";

  const isAndroid =
    platform ===
    "android";

  return (
    <div
      dir="ltr"
      aria-busy={
        submitting
      }
    >
      <ExpressCheckoutElement
        options={{
          buttonHeight:
            48,

          buttonTheme: {
            applePay:
              "black",

            googlePay:
              "black",
          },

          buttonType: {
            applePay:
              "plain",

            googlePay:
              "plain",
          },

          layout: {
            maxColumns:
              isIOS ||
              isAndroid
                ? 1
                : 2,

            maxRows:
              1,

            overflow:
              "auto",
          },

          paymentMethodOrder:
            isIOS
              ? [
                  "applePay",
                ]
              : isAndroid
                ? [
                    "googlePay",
                  ]
                : [
                    "googlePay",
                    "applePay",
                    "link",
                  ],

          paymentMethods: {
            applePay:
              isAndroid
                ? "never"
                : "always",

            googlePay:
              isIOS
                ? "never"
                : "always",
          },
        }}
        onReady={handleReady}
        onAvailablePaymentMethodsChange={handleAvailabilityChange}
        onLoadError={({ error }) => {
          reportAvailability(false);
          onError?.(error.message ?? "Unable to load express checkout.");
        }}
        onConfirm={
          handleConfirm
        }
      />
    </div>
  );
}
