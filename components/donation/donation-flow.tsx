"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  Heart,
  LockKeyhole,
} from "lucide-react";

import type {
  Campaign,
  DonationFrequency,
} from "@/lib/sample-data";

import {
  calculateFeeContribution,
  formatUsd,
} from "@/lib/money";

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

type DonationFlowProps = {
  campaign: Campaign;
};

export function DonationFlow({
  campaign,
}: DonationFlowProps) {
  // ============================================
  // STATE
  // ============================================

  const [frequency, setFrequency] =
    useState<DonationFrequency>(
      "one_time",
    );

  const [amount, setAmount] =
    useState(0);

  const [
    customAmount,
    setCustomAmount,
  ] = useState("");

  const [showCustom, setShowCustom] =
    useState(false);

  const [coverFee, setCoverFee] =
    useState(false);

  const [step, setStep] =
    useState<
      "amount" | "donor"
    >("amount");

  const [
    firstName,
    setFirstName,
  ] = useState("");

  const [
    lastName,
    setLastName,
  ] = useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [
    displayPublicly,
    setDisplayPublicly,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  // ============================================
  // MONEY
  // ============================================

  const hasValidAmount =
    Number.isInteger(amount) &&
    amount >= 100;

  const fee =
    hasValidAmount &&
    coverFee
      ? calculateFeeContribution(
          amount,
        )
      : 0;

  const total =
    hasValidAmount
      ? amount + fee
      : 0;

  // ============================================
  // SORT OPTIONS
  // ============================================

  const donationOptions =
    useMemo(() => {
      return [
        ...campaign.donationOptions,
      ].sort(
        (a, b) =>
          b.amountUsd -
          a.amountUsd,
      );
    }, [
      campaign.donationOptions,
    ]);

  // ============================================
  // SELECT AMOUNT
  // ============================================

  function selectAmount(
    amountCents: number,
  ) {
    setAmount(amountCents);

    setCustomAmount("");

    setShowCustom(false);

    setError("");
  }

  function chooseCustom(
    raw: string,
  ) {
    setCustomAmount(raw);

    if (
      raw.trim() === ""
    ) {
      setAmount(0);
      return;
    }

    const dollars =
      Number(raw);

    if (
      Number.isFinite(
        dollars,
      ) &&
      dollars > 0
    ) {
      setAmount(
        Math.round(
          dollars * 100,
        ),
      );
    } else {
      setAmount(0);
    }
  }

  // ============================================
  // CONTINUE
  // ============================================

  function continueToDonor() {
    setError("");

    if (!hasValidAmount) {
      setError(
        "Please select a donation amount.",
      );

      return;
    }

    setStep("donor");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ============================================
  // CHECKOUT
  // ============================================

  async function handleCheckout() {
    setError("");

    if (!firstName.trim()) {
      setError(
        "Please enter your first name.",
      );
      return;
    }

    if (!lastName.trim()) {
      setError(
        "Please enter your last name.",
      );
      return;
    }

    if (!email.trim()) {
      setError(
        "Please enter your email address.",
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
        "Please enter a valid email address.",
      );
      return;
    }

    if (!hasValidAmount) {
      setError(
        "Please choose a valid donation amount.",
      );
      return;
    }

    try {
      setIsLoading(true);

      const response =
        await fetch(
          "/api/stripe/checkout",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              campaignId:
                campaign.id,

              amountCents:
                amount,

              coverFee,

              frequency,

              donor: {
                firstName:
                  firstName.trim(),

                lastName:
                  lastName.trim(),

                email:
                  email.trim(),

                phone:
                  phone.trim(),

                displayPublicly,
              },
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to start checkout.",
        );
      }

      if (!data.url) {
        throw new Error(
          "Stripe checkout URL was not returned.",
        );
      }

      // ========================================
      // META PIXEL
      // ========================================

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
              total / 100,

            currency:
              "USD",

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

      window.setTimeout(() => {
        window.location.href =
          data.url;
      }, 150);
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
          : "Unable to start checkout.",
      );

      setIsLoading(false);
    }
  }

  // ============================================
  // AMOUNT STEP
  // ============================================

  if (step === "amount") {
    return (
      <section>
        {/* FREQUENCY */}

        <fieldset
          className="
            grid
            grid-cols-2
            gap-1
            rounded-[14px]
            bg-[#eef1ea]
            p-1
          "
        >
          <legend className="sr-only">
            Donation frequency
          </legend>

          {(
            [
              "one_time",
              "monthly",
            ] as const
          ).map((value) => (
            <label
              key={value}
              className="cursor-pointer"
            >
              <input
                className="peer sr-only"
                type="radio"
                name="frequency"
                value={value}
                checked={
                  frequency === value
                }
                onChange={() => {
                  setFrequency(value);
                }}
              />

              <span
                className="
                  flex
                  min-h-[44px]
                  items-center
                  justify-center
                  gap-2
                  rounded-[11px]
                  px-4
                  text-sm
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
                      size-4
                      fill-current
                    "
                  />
                )}

                {value ===
                "one_time"
                  ? "Give once"
                  : "Monthly"}
              </span>
            </label>
          ))}
        </fieldset>

        {/* TITLE */}

        <h2
          className="
            mt-7
            text-left
            text-[17px]
            font-bold
            text-[#171717]
          "
        >
          Choose your gift
        </h2>

        {/* OPTIONS */}

        <fieldset
          className="
            mt-4
            grid
            grid-cols-2
            gap-3
          "
        >
          <legend className="sr-only">
            Donation amount
          </legend>

          {donationOptions.map(
            (option) => {
              const selected =
                amount ===
                  option.amountUsd &&
                !showCustom;

              return (
                <label
                  key={
                    option.amountUsd
                  }
                  className="
                    cursor-pointer
                  "
                >
                  <input
                    type="radio"
                    name="amount"
                    className="peer sr-only"
                    checked={selected}
                    onChange={() =>
                      selectAmount(
                        option.amountUsd,
                      )
                    }
                  />

                  <span
                    className="
                      relative
                      flex
                      min-h-[66px]
                      items-center
                      justify-center
                      rounded-[12px]
                      border
                      border-[#d5d8d2]
                      bg-white
                      px-3
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
                          text-[19px]
                          font-extrabold
                          leading-none
                          text-[#161616]
                        "
                      >
                        {formatUsd(
                          option.amountUsd,
                        ).replace(
                          ".00",
                          "",
                        )}
                      </strong>

                      {option.featured && (
                        <small
                          className="
                            mt-1
                            block
                            text-[10px]
                            font-bold
                            leading-none
                            text-[#1d6b46]
                          "
                        >
                          Recommended
                        </small>
                      )}
                    </span>

                    {selected && (
                      <span
                        className="
                          absolute
                          right-2
                          top-2
                          grid
                          size-4
                          place-items-center
                          rounded-full
                          bg-[#1f6a47]
                          text-white
                        "
                      >
                        <Check
                          aria-hidden="true"
                          className="size-3"
                        />
                      </span>
                    )}
                  </span>
                </label>
              );
            },
          )}
        </fieldset>

        {/* CUSTOM */}

        <div
          className="
            mt-5
            text-center
          "
        >
          {!showCustom ? (
            <button
              type="button"
              onClick={() => {
                setShowCustom(
                  true,
                );

                setAmount(0);

                setCustomAmount("");
              }}
              className="
                text-sm
                font-medium
                text-[#17593c]
                underline
                underline-offset-2
              "
            >
              Other amounts
            </button>
          ) : (
            <div
              className="
                mx-auto
                max-w-[360px]
              "
            >
              <label
                className="
                  flex
                  min-h-[52px]
                  items-center
                  rounded-[12px]
                  border
                  border-[#cfd5cf]
                  bg-white
                  px-4

                  focus-within:border-[#1e6c49]
                  focus-within:ring-1
                  focus-within:ring-[#1e6c49]
                "
              >
                <span
                  className="
                    font-semibold
                    text-[#546159]
                  "
                >
                  $
                </span>

                <input
                  autoFocus
                  type="number"
                  min="1"
                  step="1"
                  inputMode="decimal"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(event) =>
                    chooseCustom(
                      event.target
                        .value,
                    )
                  }
                  className="
                    min-w-0
                    flex-1
                    bg-transparent
                    px-3
                    py-3
                    outline-none
                  "
                />

                <span
                  className="
                    text-sm
                    text-[#6a766f]
                  "
                >
                  USD
                </span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowCustom(
                    false,
                  );

                  setCustomAmount("");
                  setAmount(0);
                }}
                className="
                  mt-3
                  text-xs
                  text-[#68736c]
                  underline
                "
              >
                Back to suggested amounts
              </button>
            </div>
          )}
        </div>

        {/* ERROR */}

        {error && (
          <p
            role="alert"
            className="
              mt-5
              rounded-xl
              bg-red-50
              px-4
              py-3
              text-center
              text-sm
              text-red-700
            "
          >
            {error}
          </p>
        )}

        {/* CONTINUE */}

        <button
          type="button"
          disabled={
            !hasValidAmount
          }
          onClick={
            continueToDonor
          }
          className="
            mt-6
            flex
            min-h-[52px]
            w-full
            items-center
            justify-center
            rounded-[12px]
            bg-[#1f5b3d]
            px-5
            font-semibold
            text-white
            transition

            hover:bg-[#184c33]

            disabled:cursor-not-allowed
            disabled:bg-[#edf0f3]
            disabled:text-[#9ca4af]
          "
        >
          {hasValidAmount
            ? `Continue with ${formatUsd(
                amount,
              ).replace(
                ".00",
                "",
              )}`
            : "Select an amount to continue"}
        </button>

        {/* SMALL SECURE */}

        <p
          className="
            mt-4
            flex
            items-center
            justify-center
            gap-1.5
            text-[11px]
            text-[#65736b]
          "
        >
          <LockKeyhole
            aria-hidden="true"
            className="
              size-3.5
              text-[#177052]
            "
          />

          Secure payment by Stripe
        </p>
      </section>
    );
  }

  // ============================================
  // DONOR STEP
  // ============================================

  return (
    <section>
      {/* BACK */}

      <button
        type="button"
        disabled={isLoading}
        onClick={() => {
          setError("");
          setStep("amount");
        }}
        className="
          inline-flex
          min-h-10
          items-center
          gap-2
          text-sm
          font-semibold
          text-[#56675e]

          disabled:opacity-50
        "
      >
        <ArrowLeft
          aria-hidden="true"
          className="size-4"
        />

        Back
      </button>

      {/* TITLE */}

      <h2
        className="
          mt-3
          text-[24px]
          font-bold
          tracking-[-0.02em]
          text-[#161616]
        "
      >
        Your information
      </h2>

      <p
        className="
          mt-2
          text-sm
          leading-6
          text-[#66736b]
        "
      >
        Enter your details before
        continuing to our secure
        Stripe checkout.
      </p>

      {/* NAME */}

      <div
        className="
          mt-6
          grid
          gap-4

          sm:grid-cols-2
        "
      >
        <FormField
          label="First name"
          name="firstName"
          autoComplete="given-name"
          value={firstName}
          onChange={setFirstName}
          disabled={isLoading}
          required
        />

        <FormField
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          value={lastName}
          onChange={setLastName}
          disabled={isLoading}
          required
        />
      </div>

      {/* EMAIL + PHONE */}

      <div
        className="
          mt-4
          space-y-4
        "
      >
        <FormField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          disabled={isLoading}
          required
        />

        <FormField
          label="Phone number (optional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={setPhone}
          disabled={isLoading}
        />
      </div>

      {/* PUBLIC */}

      <label
        className="
          mt-5
          flex
          cursor-pointer
          items-start
          gap-3
          text-sm
          leading-5
          text-[#66736b]
        "
      >
        <input
          type="checkbox"
          checked={
            displayPublicly
          }
          disabled={isLoading}
          onChange={(event) =>
            setDisplayPublicly(
              event.target.checked,
            )
          }
          className="
            mt-0.5
            size-4
            accent-[#1f6a47]
          "
        />

        <span>
          <strong
            className="
              text-[#222]
            "
          >
            Display my name publicly
          </strong>

          <br />

          Leave unchecked to
          appear as Anonymous.
        </span>
      </label>

      {/* COVER FEE */}

      <label
        className="
          mt-4
          flex
          cursor-pointer
          items-start
          gap-3
          text-sm
          leading-5
          text-[#66736b]
        "
      >
        <input
          type="checkbox"
          checked={coverFee}
          disabled={isLoading}
          onChange={(event) =>
            setCoverFee(
              event.target.checked,
            )
          }
          className="
            mt-0.5
            size-4
            accent-[#1f6a47]
          "
        />

        <span>
          <strong
            className="
              text-[#222]
            "
          >
            Cover transaction costs
          </strong>

          <br />

          Add an estimated 2.9% +
          $0.30 so more of your
          gift supports the
          campaign.
        </span>
      </label>

      {/* SUMMARY */}

      <div
        className="
          mt-6
          rounded-[14px]
          border
          border-[#d9ddd7]
          bg-white
          p-4
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <span
            className="
              text-sm
              text-[#68746d]
            "
          >
            {frequency ===
            "monthly"
              ? "Monthly gift"
              : "One-time gift"}
          </span>

          <strong
            className="
              text-lg
              text-[#171717]
            "
          >
            {formatUsd(total)}

            {frequency ===
              "monthly" &&
              "/month"}
          </strong>
        </div>

        {coverFee && (
          <>
            <div
              className="
                mt-3
                flex
                justify-between
                text-xs
                text-[#748078]
              "
            >
              <span>
                Donation
              </span>

              <span>
                {formatUsd(amount)}
              </span>
            </div>

            <div
              className="
                mt-1.5
                flex
                justify-between
                text-xs
                text-[#748078]
              "
            >
              <span>
                Transaction costs
              </span>

              <span>
                {formatUsd(fee)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ERROR */}

      {error && (
        <p
          role="alert"
          className="
            mt-4
            rounded-xl
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
          "
        >
          {error}
        </p>
      )}

      {/* CHECKOUT */}

      <button
        type="button"
        disabled={isLoading}
        onClick={
          handleCheckout
        }
        className="
          mt-5
          flex
          min-h-[52px]
          w-full
          items-center
          justify-center
          rounded-[12px]
          bg-[#1f5b3d]
          px-5
          font-semibold
          text-white
          transition

          hover:bg-[#184c33]

          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        {isLoading
          ? "Opening secure checkout..."
          : frequency ===
              "monthly"
            ? "Continue to monthly checkout"
            : "Continue to secure checkout"}
      </button>

      <p
        className="
          mt-4
          flex
          items-center
          justify-center
          gap-1.5
          text-[11px]
          text-[#65736b]
        "
      >
        <LockKeyhole
          aria-hidden="true"
          className="
            size-3.5
            text-[#177052]
          "
        />

        Payment will be processed
        securely by Stripe.
      </p>
    </section>
  );
}

// ==============================================
// FORM FIELD
// ==============================================

type FormFieldProps = {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  value: string;

  onChange: (
    value: string,
  ) => void;

  disabled?: boolean;
  required?: boolean;
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
    <label className="block">
      <span
        className="
          text-sm
          font-medium
          text-[#252525]
        "
      >
        {label}

        {required && (
          <span
            className="
              ml-1
              text-red-500
            "
          >
            *
          </span>
        )}
      </span>

      <input
        name={name}
        type={type}
        autoComplete={
          autoComplete
        }
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="
          mt-2
          min-h-[50px]
          w-full
          rounded-[12px]
          border
          border-[#d4d9d4]
          bg-white
          px-4
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