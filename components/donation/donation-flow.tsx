"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  LockKeyhole,
} from "lucide-react";

import type {
  Campaign,
  DonationFrequency,
} from "@/lib/sample-data";

import type {
  Locale,
} from "@/lib/i18n";

import {
  getUiTranslations,
} from "@/lib/ui-translations";

import {
  calculateFeeContribution,
  convertUsdToCurrencyMinor,
  formatMoney,
} from "@/lib/money";

import {
  DonationPayment,
} from "./donation-payment";

import {
  DonationExpressCheckout,
} from "./donation-express-checkout";

import type {
  Currency,
} from "@/lib/currency";

declare global {
  interface Window {
    fbq?: (
      action: string,
      event: string,
      params?: Record<
        string,
        unknown
      >,
    ) => void;
  }
}

type DonationStep =
  | "amount"
  | "donor"
  | "payment";

type DonationFlowProps = {
  campaign: Campaign;

  locale: Locale;

  currency: Currency;

  exchangeRate: number;

  embedded?: boolean;

  onStepChange?: (
    step: DonationStep,
  ) => void;
};

export function DonationFlow({
  campaign,
  locale,
  currency,
  exchangeRate,
  embedded = false,
  onStepChange,
}: DonationFlowProps) {
  const t =
    getUiTranslations(
      locale,
    );

  const [
    frequency,
    setFrequency,
  ] =
    useState<DonationFrequency>(
      "one_time",
    );

  const [
    amount,
    setAmount,
  ] =
    useState(0);

  const [
    customAmount,
    setCustomAmount,
  ] =
    useState("");

  const [
    selectedPreset,
    setSelectedPreset,
  ] =
    useState<
      number | null
    >(null);

  const [
    coverFee,
    setCoverFee,
  ] =
    useState(false);

  const [
    displayPublicly,
    setDisplayPublicly,
  ] =
    useState(false);

  const [
    step,
    setStep,
  ] =
    useState<DonationStep>(
      "amount",
    );

  const [
    firstName,
    setFirstName,
  ] =
    useState("");

  const [
    lastName,
    setLastName,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    clientSecret,
    setClientSecret,
  ] =
    useState<
      string | null
    >(null);

  const [
    sessionId,
    setSessionId,
  ] =
    useState<
      string | null
    >(null);

  const [
    checkoutTotalMinor,
    setCheckoutTotalMinor,
  ] =
    useState<
      number | null
    >(null);

  const [
    expressClientSecret,
    setExpressClientSecret,
  ] =
    useState<
      string | null
    >(null);

  const [
    expressSessionKey,
    setExpressSessionKey,
  ] =
    useState(
      "",
    );

  const [
    expressAvailable,
    setExpressAvailable,
  ] =
    useState(
      false,
    );

  const [
    expressLoading,
    setExpressLoading,
  ] =
    useState(
      false,
    );

  const hasValidAmount =
    Number.isInteger(
      amount,
    ) &&
    amount >= 100;

  // `amount`, `fee`, `total` từ đây là LOCAL CURRENCY minor units.
  // Ví dụ GBP: 100 = £1.00.
  const fee =
    hasValidAmount &&
    coverFee
      ? calculateFeeContribution(
          amount,
          exchangeRate,
        )
      : 0;

  const total =
    hasValidAmount
      ? amount +
        fee
      : 0;

  const currencySymbol =
    getCurrencySymbol(
      currency,
      locale,
    );

  const donationOptions =
    useMemo(() => {
      return [
        ...campaign
          .donationOptions,
      ].sort(
        (
          a,
          b,
        ) =>
          a.amountUsd -
          b.amountUsd,
      );
    }, [
      campaign
        .donationOptions,
    ]);

  function resetExpressCheckout() {
    setExpressClientSecret(
      null,
    );

    setExpressSessionKey(
      "",
    );

    setExpressAvailable(
      false,
    );
  }

  useEffect(() => {
    /*
     * Fast wallet checkout is intentionally one-time only.
     *
     * We create a lightweight Checkout Session as soon as
     * the amount step has a valid one-time amount.
     *
     * A short debounce avoids creating a Stripe session for
     * every keystroke in the custom amount field.
     */
    if (
      step !==
        "amount" ||
      frequency !==
        "one_time" ||
      !hasValidAmount
    ) {
      resetExpressCheckout();

      return;
    }

    const key = [
      campaign.id,
      amount,
      currency,
      coverFee
        ? "fee"
        : "no-fee",
      displayPublicly
        ? "public"
        : "anonymous",
      locale,
    ].join(
      ":",
    );

    if (
      expressSessionKey ===
        key &&
      expressClientSecret
    ) {
      return;
    }

    const controller =
      new AbortController();

    const timeout =
      window.setTimeout(
        async () => {
          try {
            setExpressLoading(
              true,
            );

            setExpressAvailable(
              false,
            );

            const response =
              await fetch(
                "/api/stripe/express-checkout",
                {
                  method:
                    "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  signal:
                    controller.signal,

                  body:
                    JSON.stringify(
                      {
                        campaignId:
                          campaign.id,

                        campaignSlug:
                          campaign.slug,

                        amountCents:
                          amount,

                        currency,

                        coverFee,

                        locale,

                        displayPublicly,
                      },
                    ),
                },
              );

            const data =
              await response.json();

            if (
              !response.ok ||
              !data.clientSecret
            ) {
              throw new Error(
                data.error ??
                  "Unable to load express checkout.",
              );
            }

            setExpressClientSecret(
              data.clientSecret,
            );

            setExpressSessionKey(
              key,
            );
          } catch (
            expressError
          ) {
            if (
              expressError instanceof
                DOMException &&
              expressError.name ===
                "AbortError"
            ) {
              return;
            }

            console.error(
              "Express checkout session failed:",
              expressError,
            );

            resetExpressCheckout();
          } finally {
            setExpressLoading(
              false,
            );
          }
        },
        450,
      );

    return () => {
      window.clearTimeout(
        timeout,
      );

      controller.abort();
    };
  }, [
    amount,
    campaign.id,
    campaign.slug,
    coverFee,
    currency,
    displayPublicly,
    expressClientSecret,
    expressSessionKey,
    frequency,
    hasValidAmount,
    locale,
    step,
  ]);

  function goToStep(
    nextStep:
      DonationStep,
  ) {
    setStep(
      nextStep,
    );

    onStepChange?.(
      nextStep,
    );

    if (!embedded) {
      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    }
  }

  function resetCheckoutSession() {
    setClientSecret(
      null,
    );

    setSessionId(
      null,
    );

    setCheckoutTotalMinor(
      null,
    );
  }

  function selectAmount(
    amountUsdCents:
      number,
  ) {
    setAmount(
      convertUsdToCurrencyMinor(
        amountUsdCents,
        exchangeRate,
      ),
    );

    setSelectedPreset(
      amountUsdCents,
    );

    setCustomAmount(
      "",
    );

    resetCheckoutSession();
    resetExpressCheckout();

    setError(
      "",
    );
  }

  function chooseCustom(
    raw: string,
  ) {
    setCustomAmount(
      raw,
    );

    setSelectedPreset(
      null,
    );

    resetCheckoutSession();
    resetExpressCheckout();

    if (
      raw.trim() ===
      ""
    ) {
      setAmount(
        0,
      );

      setError(
        "",
      );

      return;
    }

    const localAmount =
      Number(
        raw,
      );

    if (
      Number.isFinite(
        localAmount,
      ) &&
      localAmount > 0
    ) {
      setAmount(
        Math.round(
          localAmount *
            100,
        ),
      );

      setError(
        "",
      );
    } else {
      setAmount(
        0,
      );
    }
  }

  function continueToDonor() {
    setError(
      "",
    );

    if (
      !hasValidAmount
    ) {
      setError(
        t.errorSelectAmount,
      );

      return;
    }

    goToStep(
      "donor",
    );
  }

  async function handleCheckout() {
    setError(
      "",
    );

    if (
      !firstName.trim()
    ) {
      setError(
        t.errorFirstName,
      );

      return;
    }

    if (
      !lastName.trim()
    ) {
      setError(
        t.errorLastName,
      );

      return;
    }

    if (
      !email.trim()
    ) {
      setError(
        t.errorEmail,
      );

      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(
        email.trim(),
      )
    ) {
      setError(
        t.errorValidEmail,
      );

      return;
    }

    if (
      !hasValidAmount
    ) {
      setError(
        t.errorValidAmount,
      );

      return;
    }

    try {
      setIsLoading(
        true,
      );

      resetCheckoutSession();

      const response =
        await fetch(
          "/api/stripe/checkout",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  campaignId:
                    campaign.id,

                  campaignSlug:
                    campaign.slug,

                  amountCents:
                    amount,

                  currency,

                  coverFee,

                  frequency,

                  locale,

                  donor: {
                    firstName:
                      firstName.trim(),

                    lastName:
                      lastName.trim(),

                    email:
                      email.trim(),

                    displayPublicly,
                  },
                },
              ),
          },
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ??
            t.errorCheckout,
        );
      }

      if (
        !data.clientSecret ||
        !data.sessionId ||
        !Number.isInteger(
          data.totalAmountMinor,
        ) ||
        typeof data.currency !==
          "string"
      ) {
        throw new Error(
          t.errorCheckout,
        );
      }

      if (
        typeof window !==
          "undefined" &&
        typeof window.fbq ===
          "function"
      ) {
        window.fbq(
          "track",
          "InitiateCheckout",
          {
            value:
              data.totalAmountMinor /
              100,

            currency:
              data.currency,

            content_name:
              "Donation",

            content_category:
              frequency ===
              "monthly"
                ? "Monthly donation"
                : "One-time donation",
          },
        );
      }

      setClientSecret(
        data.clientSecret,
      );

      setSessionId(
        data.sessionId,
      );

      setCheckoutTotalMinor(
        data.totalAmountMinor,
      );

      goToStep(
        "payment",
      );

      setIsLoading(
        false,
      );
    } catch (
      checkoutError
    ) {
      console.error(
        "Checkout failed:",
        checkoutError,
      );

      setError(
        checkoutError instanceof
          Error
          ? checkoutError.message
          : t.errorCheckout,
      );

      setIsLoading(
        false,
      );
    }
  }

  // =========================================================
  // PAYMENT STEP
  // =========================================================

  if (
    step ===
      "payment" &&
    clientSecret &&
    sessionId &&
    checkoutTotalMinor != null
  ) {
    return (
      <DonationPayment
        clientSecret={
          clientSecret
        }
        locale={
          locale
        }
        amountLabel={
          formatMoney(
            checkoutTotalMinor,
            currency,
            locale,
          )
        }
        onBack={() => {
          resetCheckoutSession();

          setError(
            "",
          );

          goToStep(
            "donor",
          );
        }}
      />
    );
  }

  // =========================================================
  // AMOUNT STEP
  // =========================================================

  if (
    step ===
    "amount"
  ) {
    return (
      <section
        dir={
          locale ===
          "ar"
            ? "rtl"
            : "ltr"
        }
      >
        <fieldset
          className="
            grid
            grid-cols-2
            gap-1
            rounded-[13px]
            bg-[#eef1ea]
            p-1
          "
        >
          <legend className="sr-only">
            {
              t.donationFrequency
            }
          </legend>

          {(
            [
              "one_time",
              "monthly",
            ] as const
          ).map(
            (
              value,
            ) => (
              <label
                key={
                  value
                }
                className="
                  cursor-pointer
                "
              >
                <input
                  className="
                    peer
                    sr-only
                  "
                  type="radio"
                  name="frequency"
                  value={
                    value
                  }
                  checked={
                    frequency ===
                    value
                  }
                  onChange={() => {
                    setFrequency(
                      value,
                    );

                    resetCheckoutSession();
                    resetExpressCheckout();

                    setError(
                      "",
                    );
                  }}
                />

                <span
                  className="
                    flex
                    min-h-[42px]
                    items-center
                    justify-center
                    gap-2
                    rounded-[10px]
                    px-3
                    text-[13px]
                    font-semibold
                    text-[#6d766f]
                    transition

                    peer-checked:bg-white
                    peer-checked:text-[#173e2a]
                    peer-checked:shadow-sm
                  "
                >
                  {value ===
                    "monthly" && (
                    <Heart
                      aria-hidden="true"
                      className="
                        size-3.5
                        fill-current
                      "
                    />
                  )}

                  {value ===
                  "one_time"
                    ? t.giveOnce
                    : t.monthly}
                </span>
              </label>
            ),
          )}
        </fieldset>

        <h2
          className="
            mt-4
            text-[16px]
            font-bold
            text-[#171717]
          "
        >
          {
            t.chooseYourGift
          }
        </h2>

        <fieldset
          className="
            mt-3
            grid
            grid-cols-3
            gap-2
          "
        >
          <legend className="sr-only">
            {
              t.donationAmount
            }
          </legend>

          {donationOptions.map(
            (
              option,
            ) => {
              const selected =
                selectedPreset ===
                option.amountUsd;

              return (
                <label
                  key={
                    option
                      .amountUsd
                  }
                  className="
                    min-w-0
                    cursor-pointer
                  "
                >
                  <input
                    type="radio"
                    name="amount"
                    className="
                      peer
                      sr-only
                    "
                    checked={
                      selected
                    }
                    onChange={() =>
                      selectAmount(
                        option
                          .amountUsd,
                      )
                    }
                  />

                  <span
                    className="
                      relative
                      flex
                      min-h-[56px]
                      items-center
                      justify-center
                      rounded-[12px]
                      border
                      border-[#d5d8d2]
                      bg-white
                      px-1
                      text-center
                      transition

                      hover:border-[#78947f]

                      peer-checked:border-[#1f6a47]
                      peer-checked:bg-[#f4faef]
                      peer-checked:ring-1
                      peer-checked:ring-[#1f6a47]
                    "
                  >
                    <span>
                      <strong
                        className="
                          block
                          whitespace-nowrap
                          text-[18px]
                          font-extrabold
                          leading-none
                          text-[#161616]
                        "
                      >
                        {formatMoney(
                          convertUsdToCurrencyMinor(
                            option
                              .amountUsd,
                            exchangeRate,
                          ),
                          currency,
                          locale,
                          {
                            hideZeroDecimals:
                              true,
                          },
                        )}
                      </strong>

                      {option
                        .featured && (
                        <small
                          className="
                            mt-1
                            block
                            whitespace-nowrap
                            text-[8px]
                            font-bold
                            leading-none
                            text-[#1d6b46]
                          "
                        >
                          {
                            t.recommended
                          }
                        </small>
                      )}
                    </span>

                    {selected && (
                      <span
                        className="
                          absolute
                          right-1.5
                          top-1.5
                          grid
                          size-[14px]
                          place-items-center
                          rounded-full
                          bg-[#1f6a47]
                          text-white
                        "
                      >
                        <Check
                          aria-hidden="true"
                          className="size-[9px]"
                        />
                      </span>
                    )}
                  </span>
                </label>
              );
            },
          )}
        </fieldset>

        <label
          className="
            mt-3
            flex
            min-h-[48px]
            items-center
            rounded-[12px]
            border
            border-[#cfd5cf]
            bg-white
            px-3
            transition

            focus-within:border-[#1f6a47]
            focus-within:ring-1
            focus-within:ring-[#1f6a47]
          "
        >
          <span
            className="
              font-semibold
              text-[#657069]
            "
          >
            {
              currencySymbol
            }
          </span>

          <input
            type="number"
            min="1"
            step="1"
            inputMode="decimal"
            placeholder={
              t.enterAmount
            }
            value={
              customAmount
            }
            onChange={(
              event,
            ) =>
              chooseCustom(
                event.target
                  .value,
              )
            }
            className="
              min-w-0
              flex-1
              bg-transparent
              px-2.5
              py-2
              text-[14px]
              text-[#182136]
              outline-none

              placeholder:text-[#9aa29d]
            "
          />

          <span
            className="
              shrink-0
              text-[11px]
              font-medium
              text-[#7c8580]
            "
          >
            {
              currency
            }
          </span>
        </label>

        <div
          className="
            mt-3
            space-y-1
          "
        >
          <CompactCheck
            checked={
              displayPublicly
            }
            onChange={(
              checked,
            ) => {
              setDisplayPublicly(
                checked,
              );

              resetExpressCheckout();
            }}
          >
            {
              t.displayNamePublicly
            }
          </CompactCheck>

          <CompactCheck
            checked={
              coverFee
            }
            onChange={(
              checked,
            ) => {
              setCoverFee(
                checked,
              );

              resetCheckoutSession();
              resetExpressCheckout();

              setError(
                "",
              );
            }}
          >
            {hasValidAmount
              ? `${t.addFeePrefix} ${formatMoney(
                  calculateFeeContribution(
                    amount,
                    exchangeRate,
                  ),
                  currency,
                  locale,
                )} ${t.addFeeSuffix}`
              : t.coverProcessingFees}
          </CompactCheck>
        </div>

        {hasValidAmount && (
          <div
            className="
              mt-3
              flex
              items-center
              justify-between
              border-t
              border-[#e7eae6]
              pt-3
            "
          >
            <span
              className="
                text-[13px]
                font-semibold
                text-[#4f5d55]
              "
            >
              {frequency ===
              "monthly"
                ? t.totalPerMonth
                : t.total}
            </span>

            <strong
              className="
                text-[15px]
                text-[#12233d]
              "
            >
              {formatMoney(
                total,
                currency,
                locale,
              )}
            </strong>
          </div>
        )}

        {frequency ===
          "one_time" &&
          hasValidAmount && (
          <div
            className="
              mt-4
            "
          >
            {expressClientSecret ? (
              <>
                <DonationExpressCheckout
                  key={
                    expressSessionKey
                  }
                  clientSecret={
                    expressClientSecret
                  }
                  locale={
                    locale
                  }
                  onAvailabilityChange={
                    setExpressAvailable
                  }
                  onError={(
                    message,
                  ) => {
                    setError(
                      message,
                    );
                  }}
                />

                {expressAvailable && (
                  <div
                    dir="ltr"
                    className="
                      my-4
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <span
                      className="
                        h-px
                        flex-1
                        bg-[#e2e7e3]
                      "
                    />

                    <span
                      className="
                        shrink-0
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.08em]
                        text-[#89918c]
                      "
                    >
                      OR
                    </span>

                    <span
                      className="
                        h-px
                        flex-1
                        bg-[#e2e7e3]
                      "
                    />
                  </div>
                )}
              </>
            ) : expressLoading ? (
              <div
                className="
                  h-[48px]
                  w-full
                  animate-pulse
                  rounded-[12px]
                  bg-[#eef1ed]
                "
              />
            ) : null}
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="
              mt-2
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
          type="button"
          disabled={
            !hasValidAmount
          }
          onClick={
            continueToDonor
          }
          className="
            group
            mt-3
            flex
            min-h-[50px]
            w-full
            items-center
            justify-center
            gap-2
            rounded-[14px]
            bg-[#24543d]
            px-4
            text-[15px]
            font-bold
            text-white
            shadow-[0_7px_18px_rgba(36,84,61,.18)]
            transition

            hover:bg-[#1f4d38]

            disabled:cursor-not-allowed
            disabled:bg-[#eef1ed]
            disabled:text-[#a0a8a2]
            disabled:shadow-none
          "
        >
          {hasValidAmount
            ? `${t.continueWith} ${formatMoney(
                total,
                currency,
                locale,
                {
                  hideZeroDecimals:
                    true,
                },
              )}`
            : t.selectAmountToContinue}

          {hasValidAmount && (
            <ArrowRight
              aria-hidden="true"
              className="size-4"
            />
          )}
        </button>

        <SecureText>
          {
            t.securePaymentByStripe
          }
        </SecureText>
      </section>
    );
  }

  // =========================================================
  // DONOR STEP
  // =========================================================

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
          isLoading
        }
        onClick={() => {
          setError(
            "",
          );

          resetCheckoutSession();

          goToStep(
            "amount",
          );
        }}
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
          t.back
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
            t.yourInformation
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
            t.enterDetails
          }
        </p>
      </div>

      <div
        className="
          mt-4
          grid
          grid-cols-2
          gap-2.5
        "
      >
        <FormField
          label={
            t.firstName
          }
          name="firstName"
          autoComplete="given-name"
          value={
            firstName
          }
          onChange={
            setFirstName
          }
          disabled={
            isLoading
          }
          required
        />

        <FormField
          label={
            t.lastName
          }
          name="lastName"
          autoComplete="family-name"
          value={
            lastName
          }
          onChange={
            setLastName
          }
          disabled={
            isLoading
          }
          required
        />
      </div>

      <div className="mt-3">
        <FormField
          label={
            t.emailAddress
          }
          name="email"
          type="email"
          autoComplete="email"
          value={
            email
          }
          onChange={
            setEmail
          }
          disabled={
            isLoading
          }
          required
        />
      </div>

      <div
        className="
          mt-4
          flex
          min-h-[48px]
          items-center
          justify-between
          gap-3
          rounded-[12px]
          border
          border-[#dfe4de]
          bg-[#fbfcf9]
          px-3
        "
      >
        <div
          className="
            min-w-0
          "
        >
          <p
            className="
              text-[11px]
              text-[#778079]
            "
          >
            {frequency ===
            "monthly"
              ? t.monthlyGift
              : t.oneTimeGift}
          </p>

          {coverFee && (
            <p
              className="
                text-[10px]
                text-[#859087]
              "
            >
              {
                t.includes
              }{" "}

              {formatMoney(
                fee,
                currency,
                locale,
              )}{" "}

              {
                t.fee
              }
            </p>
          )}
        </div>

        <strong
          className="
            shrink-0
            text-[16px]
            text-[#182136]
          "
        >
          {formatMoney(
            total,
            currency,
            locale,
          )}

          {frequency ===
            "monthly" &&
            "/mo"}
        </strong>
      </div>

      {error && (
        <p
          role="alert"
          className="
            mt-2
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
        type="button"
        disabled={
          isLoading
        }
        onClick={
          handleCheckout
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
        {isLoading
          ? t.openingCheckout
          : t.continueSecureCheckout}
      </button>

      <SecureText>
        {
          t.paymentProcessedStripe
        }
      </SecureText>
    </section>
  );
}

// =========================================================
// CURRENCY SYMBOL
// =========================================================

function getCurrencySymbol(
  currency: Currency,
  locale: Locale,
) {
  const localeMap:
    Record<
      Locale,
      string
    > = {
    en: "en-US",
    fr: "fr-FR",
    de: "de-DE",
    es: "es-ES",
    ar: "ar-AE",
  };

  const parts =
    new Intl.NumberFormat(
      localeMap[
        locale
      ],
      {
        style:
          "currency",
        currency,
        currencyDisplay:
          "narrowSymbol",
      },
    ).formatToParts(
      0,
    );

  return (
    parts.find(
      (
        part,
      ) =>
        part.type ===
        "currency",
    )?.value ??
    currency
  );
}

// =========================================================
// COMPACT CHECK
// =========================================================

function CompactCheck({
  checked,
  onChange,
  children,
}: {
  checked:
    boolean;

  onChange: (
    checked:
      boolean,
  ) => void;

  children:
    React.ReactNode;
}) {
  return (
    <label
      className="
        flex
        min-h-[28px]
        cursor-pointer
        items-center
        gap-2
      "
    >
      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .checked,
          )
        }
        className="
          size-[16px]
          shrink-0
          cursor-pointer
          accent-[#24543d]
        "
      />

      <span
        className="
          text-[12px]
          font-medium
          leading-4
          text-[#46534b]
        "
      >
        {
          children
        }
      </span>
    </label>
  );
}

// =========================================================
// SECURE TEXT
// =========================================================

function SecureText({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
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
        children
      }
    </p>
  );
}

// =========================================================
// FORM FIELD
// =========================================================

type FormFieldProps = {
  label:
    string;

  name:
    string;

  type?:
    string;

  autoComplete:
    string;

  value:
    string;

  onChange: (
    value:
      string,
  ) => void;

  disabled?:
    boolean;

  required?:
    boolean;
};

function FormField({
  label,
  name,
  type = "text",
  autoComplete,
  value,
  onChange,
  disabled = false,
  required = false,
}: FormFieldProps) {
  return (
    <label
      className="
        block
        min-w-0
      "
    >
      <span
        className="
          block
          truncate
          text-[12px]
          font-medium
          text-[#252525]
        "
      >
        {
          label
        }

        {required && (
          <span
            className="
              ml-0.5
              text-red-500
            "
          >
            *
          </span>
        )}
      </span>

      <input
        name={
          name
        }
        type={
          type
        }
        autoComplete={
          autoComplete
        }
        value={
          value
        }
        required={
          required
        }
        disabled={
          disabled
        }
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .value,
          )
        }
        className="
          mt-1.5
          h-[44px]
          w-full
          rounded-[11px]
          border
          border-[#d4d9d4]
          bg-white
          px-3
          text-[14px]
          outline-none
          transition

          focus:border-[#1f6a47]
          focus:ring-1
          focus:ring-[#1f6a47]

          disabled:bg-[#f1f2f1]
          disabled:opacity-70
        "
      />
    </label>
  );
}