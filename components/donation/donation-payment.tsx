"use client";

import {
  useState,
} from "react";

import {
  ArrowLeft,
  LockKeyhole,
} from "lucide-react";

import {
  loadStripe,
} from "@stripe/stripe-js";

import {
  CheckoutElementsProvider,
  PaymentElement,
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

const paymentLabels = {
  en: {
    back:
      "Back",

    heading:
      "Payment",

    description:
      "Complete your donation securely.",

    pay:
      "Donate",

    processing:
      "Processing payment...",

    secure:
      "Payment processed securely by Stripe",

    error:
      "Unable to process payment. Please try again.",

    loading:
      "Loading secure payment...",
  },

  fr: {
    back:
      "Retour",

    heading:
      "Paiement",

    description:
      "Finalisez votre don en toute sécurité.",

    pay:
      "Faire un don",

    processing:
      "Traitement du paiement...",

    secure:
      "Paiement sécurisé par Stripe",

    error:
      "Impossible de traiter le paiement. Veuillez réessayer.",

    loading:
      "Chargement du paiement sécurisé...",
  },

  de: {
    back:
      "Zurück",

    heading:
      "Zahlung",

    description:
      "Schließen Sie Ihre Spende sicher ab.",

    pay:
      "Spenden",

    processing:
      "Zahlung wird verarbeitet...",

    secure:
      "Sichere Zahlungsabwicklung durch Stripe",

    error:
      "Die Zahlung konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.",

    loading:
      "Sichere Zahlung wird geladen...",
  },

  es: {
    back:
      "Atrás",

    heading:
      "Pago",

    description:
      "Complete su donación de forma segura.",

    pay:
      "Donar",

    processing:
      "Procesando el pago...",

    secure:
      "Pago procesado de forma segura por Stripe",

    error:
      "No se pudo procesar el pago. Inténtelo de nuevo.",

    loading:
      "Cargando pago seguro...",
  },

  ar: {
    back:
      "رجوع",

    heading:
      "الدفع",

    description:
      "أكمل تبرعك بأمان.",

    pay:
      "تبرع",

    processing:
      "جارٍ معالجة الدفع...",

    secure:
      "تتم معالجة الدفع بأمان بواسطة Stripe",

    error:
      "تعذر معالجة الدفع. يرجى المحاولة مرة أخرى.",

    loading:
      "جارٍ تحميل الدفع الآمن...",
  },
} satisfies Record<
  Locale,
  Record<
    string,
    string
  >
>;

type DonationPaymentProps = {
  clientSecret:
    string;

  locale:
    Locale;

  amountLabel:
    string;

  onBack:
    () => void;
};

export function DonationPayment({
  clientSecret,
  locale,
  amountLabel,
  onBack,
}: DonationPaymentProps) {
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
      <PaymentForm
        locale={
          locale
        }
        amountLabel={
          amountLabel
        }
        onBack={
          onBack
        }
      />
    </CheckoutElementsProvider>
  );
}

function PaymentForm({
  locale,
  amountLabel,
  onBack,
}: {
  locale:
    Locale;

  amountLabel:
    string;

  onBack:
    () => void;
}) {
  const checkoutResult =
    useCheckoutElements();

  const labels =
    paymentLabels[
      locale
    ];

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState(
      "",
    );

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(
      "",
    );

    if (
      checkoutResult.type !==
      "success"
    ) {
      return;
    }

    try {
      setIsSubmitting(
        true,
      );

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
            labels.error,
        );
      }
    } catch (
      paymentError
    ) {
      console.error(
        "Payment confirmation failed:",
        paymentError,
      );

      setError(
        paymentError instanceof
          Error
          ? paymentError.message
          : labels.error,
      );

      setIsSubmitting(
        false,
      );
    }
  }

  if (
    checkoutResult.type ===
      "error"
  ) {
    return (
      <div
        className="
          rounded-xl
          bg-red-50
          px-4
          py-3
          text-sm
          text-red-700
        "
      >
        {
          checkoutResult
            .error
            .message
        }
      </div>
    );
  }

  if (
    checkoutResult.type ===
      "loading"
  ) {
    return (
      <div
        className="
          flex
          min-h-[220px]
          items-center
          justify-center
          text-sm
          text-[#66736b]
        "
      >
        {
          labels.loading
        }
      </div>
    );
  }

  return (
    <section
      dir={
        locale ===
        "ar"
          ? "rtl"
          : "ltr"
      }
    >
      <button
        type="button"
        disabled={
          isSubmitting
        }
        onClick={
          onBack
        }
        className="
          inline-flex
          min-h-[30px]
          items-center
          gap-1.5
          text-[13px]
          font-medium
          text-[#56675e]

          disabled:opacity-50
        "
      >
        <ArrowLeft
          aria-hidden="true"
          className="size-3.5"
        />

        {
          labels.back
        }
      </button>

      <div className="mt-1">
        <h2
          className="
            text-[22px]
            font-bold
            tracking-[-0.025em]
            text-[#161616]
          "
        >
          {
            labels.heading
          }
        </h2>

        <p
          className="
            mt-1
            text-[12px]
            leading-4
            text-[#66736b]
          "
        >
          {
            labels.description
          }
        </p>
      </div>

      <form
        onSubmit={
          handleSubmit
        }
        className="mt-4"
      >
        <div
          dir="ltr"
          className="
            rounded-[14px]
            bg-white
          "
        >
          <PaymentElement />
        </div>

        {error && (
          <p
            role="alert"
            className="
              mt-3
              rounded-lg
              bg-red-50
              px-3
              py-2
              text-[12px]
              text-red-700
            "
          >
            {
              error
            }
          </p>
        )}

        <button
          type="submit"
          disabled={
            isSubmitting
          }
          className="
            mt-4
            flex
            min-h-[50px]
            w-full
            items-center
            justify-center
            rounded-[14px]
            bg-[#24543d]
            px-4
            text-[14px]
            font-bold
            text-white
            shadow-[0_7px_18px_rgba(36,84,61,.16)]
            transition

            hover:bg-[#1f4d38]

            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {isSubmitting
            ? labels.processing
            : `${labels.pay} ${amountLabel}`}
        </button>

        <p
          className="
            mt-2
            flex
            items-center
            justify-center
            gap-1.5
            text-[10px]
            text-[#65736b]
          "
        >
          <LockKeyhole
            aria-hidden="true"
            className="
              size-3
              text-[#177052]
            "
          />

          {
            labels.secure
          }
        </p>
      </form>
    </section>
  );
}
