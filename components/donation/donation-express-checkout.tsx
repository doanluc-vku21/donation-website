"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  loadStripe,
} from "@stripe/stripe-js";

import {
  CheckoutElementsProvider,
  ExpressCheckoutElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";

import type {
  Locale,
} from "@/lib/i18n";

const publishableKey =
  process.env
    .NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  );
}

const stripePromise =
  loadStripe(
    publishableKey,
  );

type DonationExpressCheckoutProps = {
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
};

export function DonationExpressCheckout({
  clientSecret,
  locale,
  onAvailabilityChange,
  onError,
  beforeConfirm,
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
      />
    </CheckoutElementsProvider>
  );
}

function ExpressCheckoutForm({
  locale,
  onAvailabilityChange,
  onError,
  beforeConfirm,
}: {
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
}) {
  const checkoutResult =
    useCheckoutElements();

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const platform =
    useMemo(() => {
      if (
        typeof navigator ===
        "undefined"
      ) {
        return "desktop";
      }

      const ua =
        navigator.userAgent;

      const platformName =
        navigator.platform;

      const maxTouchPoints =
        navigator.maxTouchPoints ??
        0;

      const isIOS =
        /iPhone|iPad|iPod/i.test(
          ua,
        ) ||
        (
          platformName ===
            "MacIntel" &&
          maxTouchPoints >
            1
        );

      if (isIOS) {
        return "ios";
      }

      const isAndroid =
        /Android/i.test(
          ua,
        );

      if (isAndroid) {
        return "android";
      }

      return "desktop";
    }, []);

  async function handleConfirm() {
    if (
      submitting ||
      checkoutResult.type !==
        "success"
    ) {
      return;
    }

    try {
      setSubmitting(
        true,
      );

      if (
        beforeConfirm
      ) {
        await beforeConfirm();
      }

      const result =
        await checkoutResult
          .checkout
          .confirm();

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
