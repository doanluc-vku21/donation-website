"use client";

import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  type StripeExpressCheckoutElementConfirmEvent,
} from "@stripe/stripe-js";
import { stripePromise } from "@/lib/stripe/client";
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

type DonationExpressCheckoutProps = {
  enabled?: boolean;
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
        stripePromise
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
  locale,
  onAvailabilityChange,
  onError,
  beforeConfirm,
  onExpressConfirm,
}: {
  enabled: boolean;
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

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const platform = useMemo(() => getWalletPlatform(), []);

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
        onReady={({
          availablePaymentMethods,
        }) => {
          const available =
            Boolean(
              availablePaymentMethods,
            );

          onAvailabilityChange?.(
            available,
          );

          console.log(
            "Express Checkout platform:",
            platform,
          );

          console.log(
            "Express Checkout methods:",
            availablePaymentMethods,
          );
        }}
        onConfirm={
          handleConfirm
        }
      />
    </div>
  );
}
