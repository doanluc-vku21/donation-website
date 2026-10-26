"use client";

import { metaCheckoutFetch } from "@/lib/meta/client";
import { getExpressCheckoutKey } from "@/lib/stripe/express-checkout-key";
import { beginWalletTiming, currentWalletTiming, recordWalletTiming } from "@/lib/stripe/wallet-diagnostics";
import { WalletDiagnostics } from "./wallet-diagnostics";



import {

  useEffect,
  useEffectEvent,

  useMemo,

  useRef,

  useState,

} from "react";



import {

  usePathname,

} from "next/navigation";



import {
  ArrowLeft,
  ArrowRight,
  CalendarHeart,
  Check,
  CircleDollarSign,
  CreditCard,
  Gift,
  Heart,
  Landmark,
  LockKeyhole,
  ShieldCheck,
  Users,
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



const MIN_CUSTOM_DONATION_USD_CENTS =

  2000;






type DonationStep =

  | "amount"

  | "one_time_offer"

  | "donor"

  | "payment";



export type ExpressPrefetchResult = {
  invalidated?: boolean;

  clientSecret:

    string;


  sessionId:

    string;

};



export type ExpressPrefetch = {

  key:

    string;



  promise:

    Promise<ExpressPrefetchResult>;

};



type DonationFlowProps = {

  campaign: Campaign;



  locale: Locale;



  currency: Currency;



  exchangeRate: number;



  prefetchedExpress?: Partial<

    Record<

      DonationFrequency,

      ExpressPrefetch

    >

  >;



  embedded?: boolean;

  // A modal can initialize its wallet while closed without preloading cards.
  active?: boolean;



  onStepChange?: (

    step: DonationStep,

  ) => void;

};

function isCheckoutAbortError(

  error: unknown,

) {

  return (

    error instanceof

      DOMException &&

    error.name ===

      "AbortError"

  );

}

export function DonationFlow({

  campaign,

  locale,

  currency,

  exchangeRate,

  prefetchedExpress,

  embedded = false,

  active = true,

  onStepChange,

}: DonationFlowProps) {

  const t =

    getUiTranslations(

      locale,

    );



  const pathname =

    usePathname();



  const isHostedCheckoutPage =

    pathname ===

      "/akram-shake-1" ||

    pathname ===

      "/gaza-help" ||

    pathname ===

      "/child-health";


  const isChildHealthUpsellPage =

    pathname ===

      "/child-health-1";


  const isAkramShakeUpsellPage =

    pathname ===

      "/akram-shake-2";


  const isOneTimeUpsellPage =

    isChildHealthUpsellPage ||

    isAkramShakeUpsellPage;


  const keepExpressVisible =

    isAkramShakeUpsellPage;




  const defaultFrequency:

    DonationFrequency =

    "monthly";



  const defaultFrequencyOptions =

    campaign.donationOptions.filter(

      (

        option,

      ) =>

        option.frequency ===

        defaultFrequency,

    );



  const defaultDonationOptions =

    defaultFrequencyOptions.length >

    0

      ? defaultFrequencyOptions

      : campaign.donationOptions;



  const defaultDonationOptionUsd =

    defaultDonationOptions.find(

      (

        option,

      ) =>

        option.featured,

    )?.amountUsd ??

    defaultDonationOptions[0]

      ?.amountUsd ??

    1000;



  const [

    frequency,

    setFrequency,

  ] =

    useState<DonationFrequency>(

      defaultFrequency,

    );


  const suppressExpressForOneTimeOffer =

    isChildHealthUpsellPage &&

    frequency ===

      "one_time";


  const isMonthlyInformationOptional =

    isChildHealthUpsellPage &&

    frequency ===

      "monthly";



  const [

    amount,

    setAmount,

  ] =

    useState(

      () =>

        convertUsdToCurrencyMinor(

          defaultDonationOptionUsd,

          exchangeRate,

        ),

    );



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

    >(

      defaultDonationOptionUsd,

    );



  const coverFee =

    false;



  const isAnonymous =

    false;



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


  const donationAttemptIdRef =

    useRef<

      string | null

    >(null);



  const donationAttemptKeyRef =

    useRef("");



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



  const embeddedCheckoutKeyRef =

    useRef("");



  const embeddedCheckoutPromiseRef =

    useRef<

      Promise<{

        clientSecret:

          string;



        sessionId:

          string;



        totalAmountMinor:

          number;



        currency:

          string;

      }> | null

    >(null);

  const embeddedCheckoutAbortControllerRef =

  useRef<

    AbortController | null

  >(null);

  const paymentReadyRef =

    useRef(false);



  const [

    isPaymentReady,

    setIsPaymentReady,

  ] =

    useState(false);



  const paymentReadyResolversRef =

    useRef<

      Array<

        () => void

      >

    >([]);



  type ExpressRenderedSession = {
    updating?: boolean;
    reuseKey: string;
    prefetchResult?: ExpressPrefetchResult;
    ready: boolean;

    key:

      string;



    clientSecret:

      string;



    sessionId:

      string;



    available:

      boolean;

  };

  const pendingExpressLoadRef = useRef<(() => void) | null>(null);
  const amountUpdatersRef = useRef(new Map<string, (amountCents: number) => Promise<void>>());
  const amountMutationRef = useRef<string | null>(null);
  const failedAmountKeyRef = useRef("");
  const mountedExpressRef = useRef(true);
  useEffect(() => {
    mountedExpressRef.current = true;
    return () => { mountedExpressRef.current = false; };
  }, []);



  const [

    expressSessions,

    setExpressSessions,

  ] =

    useState<

      ExpressRenderedSession[]

    >([]);



  const [

    previousActiveExpressKey,

    setActiveExpressKey,

  ] =

    useState(

      "",

    );



  const [

    previousExpressAvailable,

    setExpressAvailable,

  ] =

    useState(

      false,

    );



  const [

    isExpressRequestLoading,

    setExpressLoading,

  ] =

    useState(

      false,

    );



  const minimumCustomAmount =

    convertUsdToCurrencyMinor(

      MIN_CUSTOM_DONATION_USD_CENTS,

      exchangeRate,

    );



  const isCustomAmount =

    selectedPreset ===

      null &&

    customAmount.trim() !==

      "";



  const customAmountBelowMinimum =

    isCustomAmount &&

    amount >

      0 &&

    amount <

      minimumCustomAmount;



  const hasValidAmount =

    Number.isInteger(

      amount,

    ) &&

    amount >=

      100 &&

    (

      !isCustomAmount ||

      amount >=

        minimumCustomAmount

    );



  const minimumCustomAmountLabel =

    formatMoney(

      minimumCustomAmount,

      currency,

      locale,

      {

        hideZeroDecimals:

          true,

      },

    );



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


  const suggestedMonthlyAmount =

    Math.max(

      100,

      Math.round(

        amount * 0.4,

      ),

    );



  const oneTimeOfferCopy =

    getChildHealthOneTimeOfferCopy(

      locale,

      formatMoney(

        suggestedMonthlyAmount,

        currency,

        locale,

        {

          hideZeroDecimals:

            true,

        },

      ),

      formatMoney(

        amount,

        currency,

        locale,

        {

          hideZeroDecimals:

            true,

        },

      ),

    );



  const currencySymbol =

    getCurrencySymbol(

      currency,

      locale,

    );



  const donationOptions =

    useMemo(() => {

      const frequencyOptions =

        campaign.donationOptions.filter(

          (

            option,

          ) =>

            option.frequency ===

            frequency,

        );



      const availableOptions =

        frequencyOptions.length >

        0

          ? frequencyOptions

          : campaign.donationOptions;



      return [

        ...availableOptions,

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

      frequency,

    ]);



  const desiredExpressKey = getExpressCheckoutKey({
    campaignId: campaign.id,
    campaignPath: pathname,
    frequency,
    amount,
    currency,
    coverFee,
    displayPublicly: !isAnonymous,
    locale,
  });

  // All immutable Session fields must match before only its amount can change.
  const expressReuseKey = getExpressCheckoutKey({
    campaignId: campaign.id, campaignPath: pathname, frequency, amount: 0,
    currency, coverFee, displayPublicly: !isAnonymous, locale,
  });
  // Cache readiness already describes the selected wallet. Derive the UI from
  // it instead of synchronously copying that data into state from an effect.
  const desiredExpressSession = expressSessions.find((session) => session.key === desiredExpressKey && !session.updating);
  const activeExpressKey = desiredExpressSession?.ready
    ? (desiredExpressSession.available ? desiredExpressKey : "")
    : previousActiveExpressKey;
  const expressAvailable = desiredExpressSession?.ready ? desiredExpressSession.available : previousExpressAvailable;
  const expressLoading = desiredExpressSession ? !desiredExpressSession.ready : isExpressRequestLoading;
  useEffect(() => { beginWalletTiming(desiredExpressKey, hasValidAmount); }, [desiredExpressKey, hasValidAmount]);
  useEffect(() => {
    if (hasValidAmount && desiredExpressSession?.ready && desiredExpressSession.available) {
      recordWalletTiming("selection_ready");
    }
  }, [desiredExpressKey, hasValidAmount, desiredExpressSession?.ready, desiredExpressSession?.available]);




  function resetExpressCheckout() {

    /*

     * Keep the currently visible Express Checkout mounted.

     * The next valid configuration will load in the background.

     *

     * This prevents Apple Pay / Google Pay from disappearing

     * every time the donor changes amount, fee, frequency,

     * or anonymity.

     */

    setExpressLoading(

      true,

    );

  }



  useEffect(() => {

    /*

     * IMPORTANT UX RULE

     * ------------------

     * Never remove the currently visible Express Checkout

     * while a new amount/session is loading.

     *

     * Example:

     * $50 is visible

     * -> donor clicks $100

     * -> $50 wallet buttons stay visually in place

     * -> pointer interaction is blocked

     * -> $100 Stripe session loads invisibly

     * -> once $100 wallet is ready, switch instantly

     *

     * So the donor never sees the wallet area disappear,

     * but Stripe still charges the correct selected amount.

     */

    const shouldLoadExpress =

      step ===

        "amount" ||

      (

        keepExpressVisible &&

        (

          step ===

            "one_time_offer" ||

          step ===

            "donor" ||

          step ===

            "payment"

        )

      );



    if (

      isHostedCheckoutPage ||

      suppressExpressForOneTimeOffer ||

      !shouldLoadExpress ||

      !hasValidAmount

    ) {

      return;

    }



    const existing =

      expressSessions.find(

        (

          session,

        ) =>

          session.key ===

          desiredExpressKey,

      );



    if ((existing && !existing.updating) || amountMutationRef.current) {
      return;
    }



    let cancelled =

      false;



    const controller =

      new AbortController();



    const loadExpressSession = async () => {
          const timingTrace = currentWalletTiming();

          try {
            // Cancelling a fetch cannot cancel a write already received by Stripe.
            // Finish it, record its actual amount, then synchronize the latest input.
            if (amountMutationRef.current) return;
            const reusable = customAmount.trim() ? expressSessions.find((session) =>
              session.reuseKey === expressReuseKey && session.ready && session.available &&
              amountUpdatersRef.current.has(session.sessionId)) : undefined;
            if (reusable) {
              amountMutationRef.current = reusable.sessionId;
              setExpressSessions((current) => current.map((session) => session.sessionId === reusable.sessionId
                ? { ...session, updating: true } : session));
              if (reusable.prefetchResult) reusable.prefetchResult.invalidated = true;
              try {
                await amountUpdatersRef.current.get(reusable.sessionId)!(amount);
                if (mountedExpressRef.current) {
                  setExpressSessions((current) => current.map((session) => session.sessionId === reusable.sessionId
                    ? { ...session, key: desiredExpressKey, updating: false } : session));
                }
              } catch {
                // A failed response/SDK refresh may follow a successful server
                // write. Discard the ambiguous Session and create a fresh one.
                amountUpdatersRef.current.delete(reusable.sessionId);
                recordWalletTiming("amount_sync_failed", timingTrace);
                failedAmountKeyRef.current = desiredExpressKey;
                if (mountedExpressRef.current) {
                  setExpressSessions((current) => current.filter((session) => session.sessionId !== reusable.sessionId));
                }
              } finally {
                amountMutationRef.current = null;
              }
              return;
            }
            recordWalletTiming("session_start", timingTrace);
            setExpressLoading(

              true,

            );



            const prefetched =

              prefetchedExpress?.[

                frequency

              ];



            let data:

              ExpressPrefetchResult | undefined;



            if (

              prefetched &&

              prefetched.key ===

                desiredExpressKey

            ) {

              data =

                await prefetched.promise.catch(() => undefined);

              if (cancelled || (!active && !data)) return;
              // Never reuse a mutated warm-up under its original amount key.
              if (data?.invalidated) data = undefined;

            }

            // A failed warm-up must not leave the wallet permanently loading.
            if (!data) {

              const response =

                await metaCheckoutFetch(

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



                          campaignPath:

                            pathname,



                          amountCents:

                            amount,



                          currency,



                          coverFee,



                          frequency,



                          locale,



                          displayPublicly:

                            !isAnonymous,

                        },

                      ),

                  },

                );



              const responseData =

                await response.json();



              if (

                !response.ok ||

                !responseData.clientSecret ||

                !responseData.sessionId

              ) {

                throw new Error(

                  responseData.error ??

                    "Unable to load express checkout.",

                );

              }



              data = {

                clientSecret:

                  responseData.clientSecret,


                sessionId:

                  responseData.sessionId,

              };

            }



            if (

              cancelled

            ) {

              return;

            }



            recordWalletTiming("session_received", timingTrace);
            setExpressSessions(

              (

                current,

              ) => {

                if (

                  current.some(

                    (

                      session,

                    ) =>

                      session.key ===

                      desiredExpressKey,

                  )

                ) {

                  return current;

                }



                /*

                 * Keep a small cache of already-mounted sessions.

                 * This makes switching back to a previous amount

                 * instant as well.

                 */

                const next = [

                  ...current,

                  {

                    key:

                      desiredExpressKey,



                    clientSecret:

                      data.clientSecret,



                    sessionId:

                      data.sessionId,



                    available:

                      false,
                    ready: false,
                    reuseKey: expressReuseKey,
                    prefetchResult: data,
                  },

                ];



                return next.slice(

                  -6,

                );

              },

            );

          } catch (

            expressError

          ) {

            if (

              cancelled ||

              (

                expressError instanceof

                  DOMException &&

                expressError.name ===

                  "AbortError"

              )

            ) {

              return;

            }



            recordWalletTiming("session_failed", timingTrace);
            console.error(

              "Express checkout session failed:",

              expressError,

            );



            setExpressLoading(

              false,

            );

          }

    };

    let pending = true;
    function startExpressLoad() {
      if (!pending || cancelled) return;
      pending = false;
      if (pendingExpressLoadRef.current === startExpressLoad) pendingExpressLoadRef.current = null;
      void loadExpressSession();
    }
    pendingExpressLoadRef.current = startExpressLoad;
    const timeout = window.setTimeout(startExpressLoad,
      customAmount.trim() && failedAmountKeyRef.current !== desiredExpressKey ? 200 : 0);



    return () => {
      pending = false;
      if (pendingExpressLoadRef.current === startExpressLoad) pendingExpressLoadRef.current = null;

      cancelled =

        true;



      window.clearTimeout(

        timeout,

      );



      controller.abort();

    };

  }, [

    active,

    amount,

    campaign.id,

    campaign.slug,

    coverFee,

    currency,

    customAmount,

    desiredExpressKey,

    expressReuseKey,

    expressSessions,

    frequency,

    hasValidAmount,

    isAnonymous,

    isHostedCheckoutPage,

    keepExpressVisible,

    locale,

    prefetchedExpress,

    pathname,

    step,

    suppressExpressForOneTimeOffer,

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



  embeddedCheckoutAbortControllerRef.current

    ?.abort();



  embeddedCheckoutAbortControllerRef.current =

    null;



  embeddedCheckoutKeyRef.current =

    "";



  embeddedCheckoutPromiseRef.current =

    null;



  paymentReadyRef.current =

    false;



  setIsPaymentReady(

    false,

  );



  paymentReadyResolversRef.current =

    [];

}



  function markPaymentReady() {

    if (

      paymentReadyRef.current

    ) {

      return;

    }



    paymentReadyRef.current =

      true;



    setIsPaymentReady(

      true,

    );



    const resolvers =

      paymentReadyResolversRef.current;



    paymentReadyResolversRef.current =

      [];



    for (

      const resolve

      of resolvers

    ) {

      resolve();

    }

  }



  function getEmbeddedCheckoutKey() {

    return [

      campaign.id,

      frequency,

      amount,

      currency,

      coverFee

        ? "fee"

        : "no-fee",

      locale,

      isAnonymous

        ? "anonymous"

        : "public",

      pathname,

    ].join(

      ":",

    );

  }



  async function ensureEmbeddedCheckoutSession() {

  if (

    isHostedCheckoutPage

  ) {

    throw new Error(

      "Embedded checkout is disabled for this route.",

    );

  }



  const key =

    getEmbeddedCheckoutKey();



  if (

    embeddedCheckoutKeyRef.current ===

      key &&

    clientSecret &&

    sessionId &&

    checkoutTotalMinor !=

      null

  ) {

    return {

      clientSecret,

      sessionId,

      totalAmountMinor:

        checkoutTotalMinor,

      currency,

    };

  }



  if (

    embeddedCheckoutKeyRef.current ===

      key &&

    embeddedCheckoutPromiseRef.current

  ) {

    return embeddedCheckoutPromiseRef.current;

  }



  embeddedCheckoutAbortControllerRef.current

    ?.abort();



  const controller =

    new AbortController();



  embeddedCheckoutAbortControllerRef.current =

    controller;



  paymentReadyRef.current =

    false;



  paymentReadyResolversRef.current =

    [];



  embeddedCheckoutKeyRef.current =

    key;



  setIsPaymentReady(

    false,

  );



  const promise =

    metaCheckoutFetch(

      "/api/stripe/checkout",

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



              campaignPath:

                pathname,



              amountCents:

                amount,



              currency,



              coverFee,



              frequency,



              locale,



              displayPublicly:

                !isAnonymous,

            },

          ),

      },

    )

      .then(

        async (

          response,

        ) => {

          const data =

            await response.json();



          if (

            !response.ok ||

            !data.clientSecret ||

            !data.sessionId ||

            !Number.isInteger(

              data.totalAmountMinor,

            ) ||

            typeof data.currency !==

              "string"

          ) {

            throw new Error(

              data.error ??

                t.errorCheckout,

            );

          }



          if (

            embeddedCheckoutKeyRef.current !==

            key

          ) {

            throw new DOMException(

              "Checkout configuration changed.",

              "AbortError",

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



          if (

            embeddedCheckoutAbortControllerRef.current ===

            controller

          ) {

            embeddedCheckoutAbortControllerRef.current =

              null;

          }



          return {

            clientSecret:

              data.clientSecret as string,



            sessionId:

              data.sessionId as string,



            totalAmountMinor:

              data.totalAmountMinor as number,



            currency:

              data.currency as string,

          };

        },

      )

      .catch(

        (

          checkoutError,

        ) => {

          if (

            embeddedCheckoutKeyRef.current ===

            key

          ) {

            embeddedCheckoutPromiseRef.current =

              null;

          }



          if (

            embeddedCheckoutAbortControllerRef.current ===

            controller

          ) {

            embeddedCheckoutAbortControllerRef.current =

              null;

          }



          throw checkoutError;

        },

      );



  embeddedCheckoutPromiseRef.current =

    promise;



  return promise;

}



  const preloadEmbeddedCheckout = useEffectEvent(() => {
    void ensureEmbeddedCheckoutSession().catch((preloadError) => {
      console.error("Embedded checkout preload failed:", preloadError);
    });
  });

  useEffect(() => {

    if (

      !active ||

      isHostedCheckoutPage ||

      (

        step !==

          "amount" &&

        step !==

          "donor"

      ) ||

      !hasValidAmount

    ) {

      return;

    }



    const timeout =

      window.setTimeout(

        () => {

          preloadEmbeddedCheckout();

        },

        customAmount.trim()

          ? 450

          : 120,

      );



    return () => {

      window.clearTimeout(

        timeout,

      );

    };

  }, [

    active,

    amount,

    campaign.id,

    campaign.slug,

    coverFee,

    currency,

    customAmount,

    frequency,

    hasValidAmount,

    isAnonymous,

    isHostedCheckoutPage,

    locale,

    pathname,

    step,

  ]);



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



  function getDonationAttemptKey() {

    return [

      campaign.id,

      campaign.slug,

      pathname,

      email

        .trim()

        .toLowerCase(),

      amount,

      currency,

      frequency,

    ].join(

      ":",

    );

  }



  async function ensureDonationAttempt() {

    const normalizedEmail =

      email

        .trim()

        .toLowerCase();



    if (

      !normalizedEmail

    ) {

      return null;

    }



    const key =

      getDonationAttemptKey();



    if (

      donationAttemptIdRef.current &&

      donationAttemptKeyRef.current ===

        key

    ) {

      return donationAttemptIdRef.current;

    }



    const response =

      await fetch(

        "/api/donation-attempt",

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

                campaignPath:

                  pathname,

                email:

                  normalizedEmail,

                firstName:

                  firstName.trim(),

                lastName:

                  lastName.trim(),

                amountCents:

                  amount,

                currency,

                frequency,

              },

            ),

        },

      );



    const data =

      await response.json();



    if (

      !response.ok ||

      !data.attemptId

    ) {

      throw new Error(

        data.error ??

          "Unable to save donation attempt.",

      );

    }



    donationAttemptIdRef.current =

      data.attemptId;



    donationAttemptKeyRef.current =

      key;



    return data.attemptId as string;

  }



  async function attachDonationAttemptToCheckoutSession(

    donationAttemptId:

      string | null,

    stripeCheckoutSessionId:

      string,

  ) {

    if (

      !donationAttemptId

    ) {

      return;

    }



    const response =

      await fetch(

        "/api/donation-attempt",

        {

          method:

            "PATCH",

          headers: {

            "Content-Type":

              "application/json",

          },

          body:

            JSON.stringify(

              {

                attemptId:

                  donationAttemptId,

                stripeCheckoutSessionId,

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

          "Unable to attach donation attempt to checkout.",

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



    if (

      isOneTimeUpsellPage &&

      frequency ===

        "one_time"

    ) {

      goToStep(

        "one_time_offer",

      );



      return;

    }



    goToStep(

      "donor",

    );



    if (

      !isHostedCheckoutPage

    ) {

      void ensureEmbeddedCheckoutSession().catch(

  (

    preloadError,

  ) => {

    if (

      isCheckoutAbortError(

        preloadError,

      )

    ) {

      return;

    }



    console.error(

      "Embedded checkout preload failed:",

      preloadError,

    );

  },

);

    }

  }



  async function handleCheckout() {

    setError(

      "",

    );



    const emailPattern =

      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



    if (

      !isMonthlyInformationOptional

    ) {

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

    } else if (

      email.trim() &&

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



      if (

        isHostedCheckoutPage

      ) {

        const donationAttemptId =

          await ensureDonationAttempt();



        const response =

          await metaCheckoutFetch(

            "/api/stripe/hosted-checkout",

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



                    campaignPath:

                      pathname,



                    donationAttemptId,



                    amountCents:

                      amount,



                    currency,



                    coverFee,



                    frequency,



                    locale,



                    displayPublicly:

                      !isAnonymous,



                    donor: {

                      firstName:

                        firstName.trim(),



                      lastName:

                        lastName.trim(),



                      email:

                        email.trim(),



                      displayPublicly:

                        !isAnonymous,

                    },

                  },

                ),

            },

          );



        const data =

          await response.json();



        if (

          !response.ok ||

          !data.url ||

          !data.sessionId ||

          !Number.isInteger(

            data.totalAmountMinor,

          ) ||

          typeof data.currency !==

            "string"

        ) {

          throw new Error(

            data.error ??

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



        window.location.assign(

          data.url,

        );



        return;

      }



      const data =

        await ensureEmbeddedCheckoutSession();



      /*
       * The embedded Stripe Payment Element is preloaded while the
       * donor is filling in their information. Do not make the donor
       * wait for Supabase / Stripe metadata bookkeeping after clicking
       * Continue.
       *
       * The Continue button is disabled until markPaymentReady() fires,
       * so this guard should only protect against an unexpected race.
       */
      if (

        !paymentReadyRef.current

      ) {

        throw new Error(

          "Secure payment is still preparing. Please try again.",

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



      /*
       * Switch to the payment step immediately.
       * From the donor's perspective, Continue now opens Card Payment
       * without waiting for donation_attempt creation/attachment.
       */
      goToStep(

        "payment",

      );



      setIsLoading(

        false,

      );



      /*
       * Abandoned-donation bookkeeping is intentionally non-blocking.
       *
       * This keeps the existing abandoned-email flow, but database and
       * Stripe metadata work no longer delays the payment UI.
       */
      void ensureDonationAttempt()

        .then(

          async (

            donationAttemptId,

          ) => {

            await attachDonationAttemptToCheckoutSession(

              donationAttemptId,

              data.sessionId,

            );

          },

        )

        .catch(

          (

            attemptError,

          ) => {

            console.error(

              "Unable to attach donation attempt in background:",

              attemptError,

            );

          },

        );



      return;

    } catch (

  checkoutError

) {

  if (

    isCheckoutAbortError(

      checkoutError,

    )

  ) {

    setIsLoading(

      false,

    );



    return;

  }



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



  function renderExpressCheckout(

    showDivider = true,

  ) {

    if (

      isHostedCheckoutPage ||

      suppressExpressForOneTimeOffer

    ) {

      return null;

    }



    return (

          <div
            aria-hidden={!hasValidAmount}
            inert={!hasValidAmount}
            className={`mt-4 ${hasValidAmount ? "" : "h-0 overflow-hidden opacity-0 pointer-events-none"}`}

          >

            <div
              aria-busy={hasValidAmount && expressLoading}

              className="

                relative

                min-h-[48px]

              "

            >

              {expressSessions.map(

                (

                  session,

                ) => {

                  const isActive =

                    session.key ===

                    activeExpressKey;



                  const isTarget =

                    session.key ===

                    desiredExpressKey;

                  const canPay = hasValidAmount && isActive && isTarget && session.ready && session.available && !session.updating;



                  return (

                    <div
                      inert={!canPay}
                      aria-hidden={!canPay}

                      key={

                        session.clientSecret

                      }

                      className={`

                        ${

                          canPay

                            ? "relative z-[2] opacity-100"

                            : isTarget

                              ? "absolute inset-0 z-[1] opacity-0 pointer-events-none"

                              : "absolute inset-0 z-0 opacity-0 pointer-events-none"

                        }

                      `}

                    >

                      <DonationExpressCheckout
                        enabled={canPay}
                        onAmountUpdater={(update) => { amountUpdatersRef.current.set(session.sessionId, update); }}

                        clientSecret={

                          session.clientSecret

                        }

                        locale={

                          locale

                        }

                        onExpressConfirm={

                          () => {

                            if (

                              typeof window ===

                                "undefined" ||

                              typeof window.fbq !==

                                "function"

                            ) {

                              return;

                            }



                            const storageKey =

                              `meta-initiate-checkout-${session.sessionId}`;



                            if (

                              window.sessionStorage.getItem(

                                storageKey,

                              )

                            ) {

                              return;

                            }



                            window.fbq(

                              "track",

                              "InitiateCheckout",

                              {

                                value:

                                  total /

                                  100,



                                currency,



                                content_name:

                                  "Donation",



                                content_category:

                                  frequency ===

                                  "monthly"

                                    ? "Monthly donation"

                                    : "One-time donation",



                                checkout_method:

                                  "express",

                              },

                            );



                            window.sessionStorage.setItem(

                              storageKey,

                              "1",

                            );

                          }

                        }



                        beforeConfirm={

                          async () => {

                            /*
                             * Express Checkout can be used directly
                             * from the Amount step, before our own
                             * donor-information form has an email.
                             *
                             * In that case Stripe/Apple Pay/Google Pay
                             * will collect the contact email itself, so
                             * skip abandoned-attempt bookkeeping here.
                             */
                            const normalizedEmail =

                              email
                                .trim()
                                .toLowerCase();



                            const emailPattern =

                              /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;



                            if (

                              !normalizedEmail ||

                              !emailPattern.test(

                                normalizedEmail,

                              )

                            ) {

                              return;

                            }



                            const attemptId =

                              await ensureDonationAttempt();



                            await attachDonationAttemptToCheckoutSession(

                              attemptId,

                              session.sessionId,

                            );

                          }

                        }

                        onAvailabilityChange={(

                          available,

                        ) => {

                          setExpressSessions(

                            (

                              current,

                            ) =>

                              current.map(

                                (

                                  item,

                                ) =>

                                  item.key ===

                                  session.key

                                    ? {

                                        ...item,

                                        available,
                                        ready: true,

                                      }

                                    : item,

                              ),

                          );



                          if (

                            available &&

                            session.key ===

                              desiredExpressKey

                          ) {

                            setActiveExpressKey(

                              session.key,

                            );



                            setExpressAvailable(

                              true,

                            );



                            setExpressLoading(

                              false,

                            );

                          }

                        }}

                        onError={(

                          message,

                        ) => {

                          setError(

                            message,

                          );

                        }}

                      />

                    </div>

                  );

                },

              )}



              {hasValidAmount && expressLoading && (
                <div role="status" aria-live="polite" className="absolute inset-0 z-[20] flex items-center justify-center gap-2 rounded-[12px] bg-[#eef1ed] px-3 text-sm text-[#45534b]">
                  <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-[#b8c5bc] border-t-[#24543d]" />
                  {previousActiveExpressKey ? t.walletAmountUpdating : t.walletPreparing}
                </div>
              )}
            </div>



            <WalletDiagnostics />

            {showDivider &&

              expressAvailable && (

              <div

                dir="ltr"

                className="

                  my-4

                  flex

                  items-center

                  gap-2

                "

              >

                <span

                  className="

                    h-px

                    min-w-0

                    flex-1

                    bg-[#dfe4e0]

                  "

                />



                <span

                  className="

                    shrink-0

                    text-[12px]

                    font-medium

                    lowercase

                    text-[#68726c]

                  "

                >

                  or

                </span>



                <div

                  className="

                    flex

                    shrink-0

                    items-center

                    divide-x

                    divide-[#d9dedb]

                    text-[#5f6964]

                  "

                >

                  <span

                    className="

                      inline-flex

                      items-center

                      gap-1.5

                      px-2

                      text-[12px]

                      font-medium

                    "

                  >

                    <CreditCard

                      aria-hidden="true"

                      className="size-4"

                    />

                    Card

                  </span>


                  {!keepExpressVisible && (

                    <>



                  <span

                    className="

                      inline-flex

                      items-center

                      gap-1.5

                      px-2

                      text-[12px]

                      font-medium

                    "

                  >

                    <CircleDollarSign

                      aria-hidden="true"

                      className="size-4"

                    />

                    Crypto

                  </span>



                  <span

                    className="

                      inline-flex

                      items-center

                      gap-1.5

                      px-2

                      text-[12px]

                      font-medium

                    "

                  >

                    <Landmark

                      aria-hidden="true"

                      className="size-4"

                    />

                    Bank

                  </span>

                    </>

                  )}

                </div>



                <span

                  className="

                    h-px

                    min-w-0

                    flex-1

                    bg-[#dfe4e0]

                  "

                />

              </div>

            )}

          </div>
    );

  }



  // =========================================================

  // ONE-TIME -> MONTHLY OFFER

  // =========================================================



  if (

    step ===

      "one_time_offer"

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

        <button

          type="button"

          onClick={() => {

            setError(

              "",

            );



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



        <div className="mt-2">

          <h3

            className="

              text-[18px]

              font-bold

              leading-[1.25]

              tracking-[-0.02em]

              text-[#12233d]

            "

          >

            {

              oneTimeOfferCopy.heading

            }

          </h3>



          <p

            className="

              mt-1.5

              text-[13px]

              leading-5

              text-[#68736d]

            "

          >

            {

              oneTimeOfferCopy.intro

            }

          </p>

        </div>



        {keepExpressVisible && (

          <div

            className="

              mt-4

            "

          >

            <p

              className="

                mb-2

                text-[11px]

                font-medium

                leading-4

                text-[#68736d]

              "

            >

              {locale === "fr"

                ? `Ou finalisez maintenant votre don unique de ${formatMoney(

                    amount,

                    currency,

                    locale,

                    {

                      hideZeroDecimals:

                        true,

                    },

                  )}`

                : locale === "de"

                  ? `Oder schließen Sie jetzt Ihre einmalige Spende von ${formatMoney(

                      amount,

                      currency,

                      locale,

                      {

                        hideZeroDecimals:

                          true,

                      },

                    )} ab`

                  : locale === "es"

                    ? `O completa ahora tu donación única de ${formatMoney(

                        amount,

                        currency,

                        locale,

                        {

                          hideZeroDecimals:

                            true,

                        },

                      )}`

                    : locale === "ar"

                      ? `أو أكمل الآن تبرعك لمرة واحدة بقيمة ${formatMoney(

                          amount,

                          currency,

                          locale,

                          {

                            hideZeroDecimals:

                              true,

                          },

                        )}`

                      : `Or complete your ${formatMoney(

                          amount,

                          currency,

                          locale,

                          {

                            hideZeroDecimals:

                              true,

                          },

                        )} one-time gift now`}

            </p>



            {renderExpressCheckout()}

          </div>

        )}



        <button

          type="button"

          onClick={() => {

            setFrequency(

              "monthly",

            );



            setAmount(

              suggestedMonthlyAmount,

            );



            setSelectedPreset(

              null,

            );



            setCustomAmount(

              "",

            );



            resetCheckoutSession();

            resetExpressCheckout();



            setError(

              "",

            );



            goToStep(

              "donor",

            );

          }}

          className="

            relative

            mt-5

            flex

            w-full

            items-center

            gap-3

            rounded-[18px]

            border-2

            border-[#1f6a47]

            bg-[#f4faef]

            px-4

            py-4

            text-left

            shadow-[0_8px_22px_rgba(31,106,71,.08)]

            transition

            hover:bg-[#eef8e8]

            active:scale-[0.995]

          "

        >

          <span

            className="

              absolute

              -top-3

              right-3

              rounded-full

              bg-[#1f6a47]

              px-3

              py-1

              text-[10px]

              font-extrabold

              uppercase

              tracking-[0.04em]

              text-white

            "

          >

            {

              oneTimeOfferCopy.recommended

            }

          </span>



          <span

            className="

              grid

              size-12

              shrink-0

              place-items-center

              rounded-[14px]

              bg-white

              text-[#1f6a47]

              shadow-sm

            "

          >

            <CalendarHeart

              aria-hidden="true"

              className="size-7"

            />

          </span>



          <span className="min-w-0 flex-1">

            <strong

              className="

                block

                text-[18px]

                font-extrabold

                leading-[1.15]

                text-[#1f5f42]

              "

            >

              {

                oneTimeOfferCopy.monthlyTitle

              }

            </strong>



            <span

              className="

                mt-1

                block

                text-[12px]

                leading-4

                text-[#68766e]

              "

            >

              {

                oneTimeOfferCopy.monthlyDescription

              }

            </span>

          </span>



          <span

            className="

              grid

              size-10

              shrink-0

              place-items-center

              rounded-full

              bg-[#1f6a47]

              text-white

            "

          >

            <ArrowRight

              aria-hidden="true"

              className="size-5"

            />

          </span>

        </button>



        <button

          type="button"

          onClick={() => {

            setError(

              "",

            );



            goToStep(

              "donor",

            );

          }}

          className="

            mt-3

            flex

            w-full

            items-center

            gap-3

            rounded-[18px]

            border

            border-[#dfe4de]

            bg-white

            px-4

            py-4

            text-left

            transition

            hover:border-[#b9c4bc]

            hover:bg-[#fbfcfa]

            active:scale-[0.995]

          "

        >

          <span

            className="

              grid

              size-12

              shrink-0

              place-items-center

              rounded-[14px]

              bg-[#f7f7f4]

              text-[#202a25]

            "

          >

            <Gift

              aria-hidden="true"

              className="size-7"

            />

          </span>



          <span className="min-w-0 flex-1">

            <strong

              className="

                block

                text-[17px]

                font-extrabold

                leading-[1.15]

                text-[#12233d]

              "

            >

              {

                oneTimeOfferCopy.oneTimeTitle

              }

            </strong>



            <span

              className="

                mt-1

                block

                text-[12px]

                leading-4

                text-[#68736d]

              "

            >

              {

                oneTimeOfferCopy.oneTimeDescription

              }

            </span>

          </span>



          <span

            className="

              grid

              size-10

              shrink-0

              place-items-center

              rounded-full

              bg-[#f7f7f4]

              text-[#17231d]

            "

          >

            <ArrowRight

              aria-hidden="true"

              className="size-5"

            />

          </span>

        </button>



        <div

          className="

            mt-5

            grid

            grid-cols-3

            divide-x

            divide-[#e5e9e5]

            border-y

            border-[#edf0ed]

            py-4

          "

        >

          <div

            className="

              px-2

              text-center

            "

          >

            <Users

              aria-hidden="true"

              className="mx-auto size-5 text-[#1f6a47]"

            />



            <p

              className="

                mt-1.5

                text-[10px]

                leading-3.5

                text-[#68736d]

              "

            >

              {

                oneTimeOfferCopy.benefitOne

              }

            </p>

          </div>



          <div

            className="

              px-2

              text-center

            "

          >

            <Heart

              aria-hidden="true"

              className="mx-auto size-5 text-[#1f6a47]"

            />



            <p

              className="

                mt-1.5

                text-[10px]

                leading-3.5

                text-[#68736d]

              "

            >

              {

                oneTimeOfferCopy.benefitTwo

              }

            </p>

          </div>



          <div

            className="

              px-2

              text-center

            "

          >

            <ShieldCheck

              aria-hidden="true"

              className="mx-auto size-5 text-[#1f6a47]"

            />



            <p

              className="

                mt-1.5

                text-[10px]

                leading-3.5

                text-[#68736d]

              "

            >

              {

                oneTimeOfferCopy.benefitThree

              }

            </p>

          </div>

        </div>



        <div

          className="

            mt-4

            flex

            items-center

            justify-center

            gap-2

            rounded-[12px]

            bg-[#f8f9f7]

            px-3

            py-3

            text-center

            text-[10px]

            leading-4

            text-[#68736d]

          "

        >

          <LockKeyhole

            aria-hidden="true"

            className="size-3.5 shrink-0 text-[#177052]"

          />



          <span>

            {

              oneTimeOfferCopy.secure

            }

          </span>

        </div>

      </section>

    );

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

      <section

        dir={

          locale ===

          "ar"

            ? "rtl"

            : "ltr"

        }

      >

        {keepExpressVisible &&

          renderExpressCheckout()}



        <DonationPayment

          key={

            sessionId

          }

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

          onReady={

            markPaymentReady

          }

          onBack={() => {

            setError(

              "",

            );



            goToStep(

              "donor",

            );

          }}

        />

      </section>

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

              "monthly",

              "one_time",

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



                    const nextFrequencyOptions =

                      campaign.donationOptions.filter(

                        (

                          option,

                        ) =>

                          option.frequency ===

                          value,

                      );



                    const nextAvailableOptions =

                      nextFrequencyOptions.length >

                      0

                        ? nextFrequencyOptions

                        : campaign.donationOptions;



                    const nextDefaultOption =

                      nextAvailableOptions.find(

                        (

                          option,

                        ) =>

                          option.featured,

                      ) ??

                      nextAvailableOptions[0];



                    if (

                      nextDefaultOption

                    ) {

                      setAmount(

                        convertUsdToCurrencyMinor(

                          nextDefaultOption.amountUsd,

                          exchangeRate,

                        ),

                      );



                      setSelectedPreset(

                        nextDefaultOption.amountUsd,

                      );



                      setCustomAmount(

                        "",

                      );

                    }



                    resetCheckoutSession();

                    resetExpressCheckout();



                    setError(

                      "",

                    );

                  }}

                />



                <span

                  className={`

                    flex

                    min-h-[42px]

                    items-center

                    justify-center

                    gap-2

                    rounded-[10px]

                    px-3

                    text-[13px]

                    font-semibold

                    transition



                    ${

                      frequency ===

                      value

                        ? "bg-white text-[#173e2a] shadow-sm"

                        : "text-[#6d766f]"

                    }

                  `}

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

            min={

              minimumCustomAmount /

              100

            }

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

            onBlur={() => pendingExpressLoadRef.current?.()}

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



        <p

          className={`

            mt-1.5

            text-[11px]

            leading-4



            ${

              customAmountBelowMinimum

                ? "text-red-600"

                : "text-[#7c8580]"

            }

          `}

        >

          {getMinimumCustomAmountText(

            locale,

            minimumCustomAmountLabel,

          )}

        </p>



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



        {renderExpressCheckout()}




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

        {!isHostedCheckoutPage &&

          clientSecret &&

          sessionId &&

          checkoutTotalMinor != null && (

            <DonationPayment

              key={

                sessionId

              }

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

              onReady={

                markPaymentReady

              }

              onBack={() => {}}

              preloadOnly

            />

          )}



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

          {isMonthlyInformationOptional

            ? getMonthlyOptionalInformationText(

                locale,

              )

            : t.enterDetails}

        </p>

      </div>



      {keepExpressVisible &&

        renderExpressCheckout()}



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

          required={

            !isMonthlyInformationOptional

          }

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

          required={

            !isMonthlyInformationOptional

          }

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

          required={

            !isMonthlyInformationOptional

          }

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

          isLoading ||

          (

            !isHostedCheckoutPage &&

            !isPaymentReady

          )

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

        {isHostedCheckoutPage &&

        isLoading

          ? t.openingCheckout

          : t.continueSecureCheckout}

      </button>



      <SecureText>

        {

          t.paymentProcessedStripe

        }

      </SecureText>



      {!isHostedCheckoutPage &&

        clientSecret &&

        sessionId &&

        checkoutTotalMinor != null && (

          <DonationPayment

            key={

              sessionId

            }

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

            onReady={

              markPaymentReady

            }

            onBack={() => {}}

            preloadOnly

          />

        )}

    </section>

  );

}



function getMonthlyOptionalInformationText(

  locale: Locale,

) {

  switch (

    locale

  ) {

    case "fr":

      return "Facultatif pour les dons mensuels — vous pouvez continuer sans renseigner ces informations.";



    case "de":

      return "Bei monatlichen Spenden optional — Sie können fortfahren, ohne diese Angaben auszufüllen.";



    case "es":

      return "Opcional para donaciones mensuales — puedes continuar sin completar estos datos.";



    case "ar":

      return "اختياري للتبرعات الشهرية — يمكنك المتابعة دون إدخال هذه المعلومات.";



    default:

      return "Optional for monthly donations — you can continue without filling in these details.";

  }

}





function getChildHealthOneTimeOfferCopy(

  locale: Locale,

  monthlyAmountLabel: string,

  oneTimeAmountLabel: string,

) {

  switch (

    locale

  ) {

    case "fr":

      return {

        heading:

          "Faites encore plus avec votre don",

        intro:

          "Votre don unique peut aider aujourd’hui. Envisageriez-vous de le transformer en don mensuel pour aider encore plus de personnes ?",

        recommended:

          "Recommandé",

        monthlyTitle:

          `Donnez ${monthlyAmountLabel} chaque mois`,

        monthlyDescription:

          "Apportez un soutien régulier aux enfants et aux familles qui ont besoin de soins essentiels.",

        oneTimeTitle:

          `Conserver mon don unique de ${oneTimeAmountLabel}`,

        oneTimeDescription:

          "Faites une différence aujourd’hui.",

        benefitOne:

          "Un soutien continu pour davantage de familles",

        benefitTwo:

          "Des soins et une aide essentiels plus réguliers",

        benefitThree:

          "Vous pouvez annuler à tout moment",

        secure:

          "Votre don sera traité de manière sécurisée par Stripe.",

      };



    case "de":

      return {

        heading:

          "Machen Sie mit Ihrer Spende noch mehr möglich",

        intro:

          "Ihre einmalige Spende hilft heute. Möchten Sie daraus eine monatliche Spende machen und damit noch mehr Menschen unterstützen?",

        recommended:

          "Empfohlen",

        monthlyTitle:

          `${monthlyAmountLabel} monatlich spenden`,

        monthlyDescription:

          "Unterstützen Sie Kinder und Familien Monat für Monat mit verlässlicher Hilfe.",

        oneTimeTitle:

          `Meine einmalige Spende von ${oneTimeAmountLabel} beibehalten`,

        oneTimeDescription:

          "Helfen Sie noch heute.",

        benefitOne:

          "Kontinuierliche Hilfe für mehr Familien",

        benefitTwo:

          "Mehr regelmäßige Versorgung und Unterstützung",

        benefitThree:

          "Jederzeit kündbar",

        secure:

          "Ihre Spende wird sicher über Stripe verarbeitet.",

      };



    case "es":

      return {

        heading:

          "Haz que tu donación llegue aún más lejos",

        intro:

          "Tu donación única puede ayudar hoy. ¿Considerarías convertirla en una donación mensual para ayudar a aún más personas?",

        recommended:

          "Recomendado",

        monthlyTitle:

          `Dona ${monthlyAmountLabel} al mes`,

        monthlyDescription:

          "Brinda apoyo constante a niños y familias que necesitan cuidados esenciales.",

        oneTimeTitle:

          `Mantener mi donación única de ${oneTimeAmountLabel}`,

        oneTimeDescription:

          "Marca una diferencia hoy.",

        benefitOne:

          "Apoyo continuo para más familias",

        benefitTwo:

          "Más atención y ayuda esencial",

        benefitThree:

          "Puedes cancelar en cualquier momento",

        secure:

          "Tu donación será procesada de forma segura por Stripe.",

      };



    case "ar":

      return {

        heading:

          "اجعل تبرعك يحدث أثرًا أكبر",

        intro:

          "يمكن لتبرعك لمرة واحدة أن يساعد اليوم. هل ترغب في تحويله إلى تبرع شهري لمساعدة عدد أكبر من الأشخاص؟",

        recommended:

          "موصى به",

        monthlyTitle:

          `تبرع بـ ${monthlyAmountLabel} شهريًا`,

        monthlyDescription:

          "قدّم دعمًا مستمرًا للأطفال والأسر التي تحتاج إلى الرعاية الأساسية.",

        oneTimeTitle:

          `الاحتفاظ بتبرعي لمرة واحدة بقيمة ${oneTimeAmountLabel}`,

        oneTimeDescription:

          "اصنع فرقًا اليوم.",

        benefitOne:

          "دعم مستمر لعدد أكبر من الأسر",

        benefitTwo:

          "المزيد من الرعاية والمساعدة الأساسية",

        benefitThree:

          "يمكنك الإلغاء في أي وقت",

        secure:

          "ستتم معالجة تبرعك بأمان عبر Stripe.",

      };



    default:

      return {

        heading:

          "Make your gift go even further",

        intro:

          "Your one-time gift can help today. Would you consider making it monthly to help even more people?",

        recommended:

          "Recommended",

        monthlyTitle:

          `Give ${monthlyAmountLabel} Monthly`,

        monthlyDescription:

          "Provide steady support for children and families who need essential care.",

        oneTimeTitle:

          `Keep my ${oneTimeAmountLabel} one-time gift`,

        oneTimeDescription:

          "Make a difference today.",

        benefitOne:

          "Ongoing support for more families",

        benefitTwo:

          "More consistent care and essential support",

        benefitThree:

          "You can cancel anytime",

        secure:

          "Your donation will be processed securely by Stripe.",

      };

  }

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

// MINIMUM CUSTOM AMOUNT TEXT

// =========================================================



function getMinimumCustomAmountText(

  locale: Locale,

  amountLabel: string,

) {

  switch (

    locale

  ) {

    case "fr":

      return `Montant personnalisé minimum : ${amountLabel}`;



    case "de":

      return `Mindestbetrag für einen eigenen Betrag: ${amountLabel}`;



    case "es":

      return `Importe personalizado mínimo: ${amountLabel}`;



    case "ar":

      return `الحد الأدنى للمبلغ المخصص: ${amountLabel}`;



    default:

      return `❤️ Every donation starts at just ${amountLabel}`;

  }

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
