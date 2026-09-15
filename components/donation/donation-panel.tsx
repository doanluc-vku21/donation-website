"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Heart,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import type {
  Campaign,
  DonationFrequency,
} from "@/lib/sample-data";

import {
  calculateFeeContribution,
  formatUsd,
} from "@/lib/money";

type DonationPanelProps = {
  campaign: Campaign;
};

export function DonationPanel({
  campaign,
}: DonationPanelProps) {
  const defaultOption =
    campaign.donationOptions.find(
      (option) => option.featured,
    ) ?? campaign.donationOptions[0];

  const [frequency, setFrequency] =
    useState<DonationFrequency>("one_time");

  const [amount, setAmount] =
    useState(defaultOption.amountUsd);

  const [customAmount, setCustomAmount] =
    useState("");

  const [coverFee, setCoverFee] =
    useState(false);

  const [step, setStep] =
    useState<"amount" | "donor">("amount");

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [displayPublicly, setDisplayPublicly] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const fee = coverFee
    ? calculateFeeContribution(amount)
    : 0;

  const total = amount + fee;

  const selectedImpact =
    campaign.donationOptions.find(
      (option) =>
        option.amountUsd === amount,
    )?.impactText;

  const ctaLabel = useMemo(
    () =>
      `Continue with ${formatUsd(amount)}${
        frequency === "monthly"
          ? " monthly"
          : ""
      }`,
    [amount, frequency],
  );

  function chooseCustom(raw: string) {
    setCustomAmount(raw);

    const dollars =
      Number(raw);

    if (
      Number.isFinite(dollars) &&
      dollars > 0
    ) {
      setAmount(
        Math.round(dollars * 100),
      );
    }
  }

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

    if (
      !Number.isInteger(amount) ||
      amount < 100
    ) {
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

      window.location.href =
        data.url;
    } catch (checkoutError) {
      console.error(
        "Checkout failed:",
        checkoutError,
      );

      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start checkout.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      id="donation-panel"
      className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-[0_24px_70px_rgba(20,43,78,0.12)] sm:p-7"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
            <LockKeyhole
              aria-hidden="true"
              className="size-5"
            />
          </span>

          <div>
            <p className="font-semibold text-[var(--ink)]">
              Secure donation
            </p>

            
          </div>
        </div>

        
      </div>

      {step === "amount" ? (
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
            Choose your gift
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Every amount helps build steady, practical support.
          </p>

          <fieldset className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-[var(--surface)] p-1.5">
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
                  onChange={() =>
                    setFrequency(value)
                  }
                />

                <span className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-[var(--muted)] transition peer-checked:bg-white peer-checked:text-[var(--accent)] peer-checked:shadow-sm peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]">
                  {value === "monthly" && (
                    <Heart
                      aria-hidden="true"
                      className="size-4 fill-current"
                    />
                  )}

                  {value === "one_time"
                    ? "Give once"
                    : "Monthly"}
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className="mt-5 space-y-2.5">
            <legend className="sr-only">
              Donation amount
            </legend>

            {campaign.donationOptions.map(
              (option) => (
                <label
                  key={option.amountUsd}
                  className="block cursor-pointer"
                >
                  <input
                    className="peer sr-only"
                    type="radio"
                    name="amount"
                    checked={
                      amount === option.amountUsd &&
                      customAmount === ""
                    }
                    onChange={() => {
                      setAmount(
                        option.amountUsd,
                      );

                      setCustomAmount("");
                    }}
                  />

                  <span className="flex min-h-[68px] items-center justify-between gap-4 rounded-2xl border border-[var(--border)] px-4 py-3 transition hover:border-[var(--accent)] peer-checked:border-[var(--accent)] peer-checked:bg-[var(--soft-blue)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]">
                    <span>
                      <strong className="block text-base text-[var(--ink)]">
                        {formatUsd(
                          option.amountUsd,
                        ).replace(
                          ".00",
                          "",
                        )}
                      </strong>

                      <small className="text-sm text-[var(--muted)]">
                        {option.impactText}
                      </small>
                    </span>

                    {option.featured && (
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                        Recommended
                      </span>
                    )}
                  </span>
                </label>
              ),
            )}
          </fieldset>

          <label className="mt-3 block">
            <span className="text-sm font-medium text-[var(--ink)]">
              Other amount
            </span>

            <span className="mt-2 flex min-h-12 items-center rounded-2xl border border-[var(--border)] bg-white px-4 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--soft-blue)]">
              <span className="font-semibold text-[var(--muted)]">
                $
              </span>

              <input
                aria-label="Other amount in US dollars"
                inputMode="decimal"
                value={customAmount}
                onChange={(event) =>
                  chooseCustom(
                    event.target.value,
                  )
                }
                className="min-w-0 flex-1 bg-transparent px-2 py-3 outline-none"
                placeholder="Enter amount"
              />

              <span className="text-sm font-medium text-[var(--muted)]">
                USD
              </span>
            </span>
          </label>

          {selectedImpact && (
            <p className="mt-4 rounded-2xl bg-[var(--mint)] px-4 py-3 text-sm leading-6 text-[var(--ink)]">
              <strong>
                Your impact:
              </strong>{" "}
              {selectedImpact}.
            </p>
          )}

          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-5 text-[var(--muted)]">
            <input
              type="checkbox"
              checked={coverFee}
              onChange={(event) =>
                setCoverFee(
                  event.target.checked,
                )
              }
              className="mt-0.5 size-5 rounded border-[var(--border)] accent-[var(--accent)]"
            />

            <span>
              <strong className="text-[var(--ink)]">
                Cover transaction costs
              </strong>

              <br />

              Add an estimated 2.9% + $0.30 so more of your gift supports the campaign.
            </span>
          </label>

          <dl className="mt-5 space-y-2 border-t border-[var(--border)] pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--muted)]">
                Your donation
              </dt>

              <dd className="font-medium text-[var(--ink)]">
                {formatUsd(amount)}
              </dd>
            </div>

            {coverFee && (
              <div className="flex justify-between">
                <dt className="text-[var(--muted)]">
                  Estimated transaction costs
                </dt>

                <dd className="font-medium text-[var(--ink)]">
                  {formatUsd(fee)}
                </dd>
              </div>
            )}

            <div className="flex justify-between text-base">
              <dt className="font-semibold text-[var(--ink)]">
                {frequency === "monthly"
                  ? "Monthly total"
                  : "Total"}
              </dt>

              <dd className="font-semibold text-[var(--ink)]">
                {formatUsd(total)}
                {frequency === "monthly"
                  ? "/month"
                  : ""}
              </dd>
            </div>
          </dl>

          {frequency === "monthly" && (
            <p className="mt-4 rounded-xl bg-[var(--mint)] px-4 py-3 text-sm leading-5 text-[var(--ink)]">
              Your donation will repeat every month until the subscription is canceled.
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setError("");
              setStep("donor");
            }}
            className="mt-6 flex min-h-13 w-full items-center justify-center rounded-2xl bg-[var(--accent)] px-5 py-3.5 font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] transition hover:bg-[var(--accent-dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
          >
            {ctaLabel}
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setError("");
              setStep("amount");
            }}
            className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4"
            />

            Back
          </button>

          <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
            Your information
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            We'll use this information to prepare your secure Stripe checkout and donation receipt.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
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

          <div className="mt-4 space-y-4">
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

          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-5 text-[var(--muted)]">
            <input
              type="checkbox"
              checked={displayPublicly}
              disabled={isLoading}
              onChange={(event) =>
                setDisplayPublicly(
                  event.target.checked,
                )
              }
              className="mt-0.5 size-5 accent-[var(--accent)]"
            />

            <span>
              <strong className="text-[var(--ink)]">
                Display my name publicly
              </strong>

              <br />

              Leave unchecked to appear as Anonymous.
            </span>
          </label>

          <div className="mt-6 rounded-2xl bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-[var(--muted)]">
                {frequency === "monthly"
                  ? "Monthly gift"
                  : "One-time gift"}
              </span>

              <strong className="text-lg text-[var(--ink)]">
                {formatUsd(total)}
                {frequency === "monthly"
                  ? "/month"
                  : ""}
              </strong>
            </div>

            {coverFee && (
              <>
                <div className="mt-2 flex items-center justify-between gap-4 text-xs text-[var(--muted)]">
                  <span>
                    Donation
                  </span>

                  <span>
                    {formatUsd(amount)}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between gap-4 text-xs text-[var(--muted)]">
                  <span>
                    Transaction cost contribution
                  </span>

                  <span>
                    {formatUsd(fee)}
                  </span>
                </div>
              </>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={isLoading}
            className="mt-5 flex min-h-13 w-full items-center justify-center rounded-2xl bg-[var(--accent)] px-5 py-3.5 font-semibold text-white transition hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? "Opening secure checkout..."
              : frequency === "monthly"
                ? "Continue to monthly checkout"
                : "Continue to secure checkout"}
          </button>

          <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-[var(--muted)]">
            <ShieldCheck
              aria-hidden="true"
              className="size-4 text-[var(--success)]"
            />

            Payment will be processed securely by Stripe Sandbox.
          </p>
        </div>
      )}
    </section>
  );
}

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
      <span className="text-sm font-medium text-[var(--ink)]">
        {label}

        {required && (
          <span
            className="ml-1 text-red-500"
            aria-hidden="true"
          >
            *
          </span>
        )}
      </span>

      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--border)] px-4 outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--soft-blue)] disabled:cursor-not-allowed disabled:bg-[var(--surface)] disabled:opacity-70"
      />
    </label>
  );
}