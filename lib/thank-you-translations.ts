import type {
  Locale,
} from "@/lib/i18n";

type ThankYouTranslations = {
  sessionNotFound:
    string;

  sessionNotFoundText:
    string;

  returnToCampaign:
    string;

  paymentConfirmed:
    string;

  thankYou:
    string;

  successMessage:
    string;

  yourDonation:
    string;

  donation:
    string;

  transactionCost:
    string;

  totalPaid:
    string;

  paymentSuccessful:
    string;

  paymentStatus:
    string;

  confirmationSent:
    string;

  donationType:
    string;

  monthly:
    string;

  oneTime:
    string;

  currency:
    string;

  donateAgain:
    string;

  shareCampaign:
    string;

  securePayment:
    string;

  verifyError:
    string;

  verifyErrorText:
    string;
};

const translations:
  Record<
    Locale,
    ThankYouTranslations
  > = {
  en: {
    sessionNotFound:
      "Payment session not found",

    sessionNotFoundText:
      "We couldn't find the Stripe Checkout session for this donation.",

    returnToCampaign:
      "Return to campaign",

    paymentConfirmed:
      "Payment confirmed",

    thankYou:
      "Thank you",

    successMessage:
      "Your donation has been processed successfully through Stripe.",

    yourDonation:
      "Your donation",

    donation:
      "Donation",

    transactionCost:
      "Transaction cost contribution",

    totalPaid:
      "Total paid",

    paymentSuccessful:
      "Payment successful",

    paymentStatus:
      "Payment status",

    confirmationSent:
      "Confirmation sent to",

    donationType:
      "Donation type",

    monthly:
      "Monthly",

    oneTime:
      "One-time",

    currency:
      "Currency",

    donateAgain:
      "Donate again",

    shareCampaign:
      "Share campaign",

    securePayment:
      "Secure payment processed by Stripe.",

    verifyError:
      "Unable to verify donation",

    verifyErrorText:
      "We couldn't retrieve this payment from Stripe. Please return to the campaign and try again.",
  },

  fr: {
    sessionNotFound:
      "Session de paiement introuvable",

    sessionNotFoundText:
      "Nous n'avons pas pu trouver la session Stripe Checkout pour ce don.",

    returnToCampaign:
      "Retour à la campagne",

    paymentConfirmed:
      "Paiement confirmé",

    thankYou:
      "Merci",

    successMessage:
      "Votre don a été traité avec succès via Stripe.",

    yourDonation:
      "Votre don",

    donation:
      "Don",

    transactionCost:
      "Contribution aux frais de transaction",

    totalPaid:
      "Total payé",

    paymentSuccessful:
      "Paiement réussi",

    paymentStatus:
      "Statut du paiement",

    confirmationSent:
      "Confirmation envoyée à",

    donationType:
      "Type de don",

    monthly:
      "Mensuel",

    oneTime:
      "Don unique",

    currency:
      "Devise",

    donateAgain:
      "Faire un nouveau don",

    shareCampaign:
      "Partager la campagne",

    securePayment:
      "Paiement traité en toute sécurité par Stripe.",

    verifyError:
      "Impossible de vérifier le don",

    verifyErrorText:
      "Nous n'avons pas pu récupérer ce paiement depuis Stripe. Veuillez revenir à la campagne et réessayer.",
  },

  de: {
    sessionNotFound:
      "Zahlungssitzung nicht gefunden",

    sessionNotFoundText:
      "Die Stripe-Checkout-Sitzung für diese Spende konnte nicht gefunden werden.",

    returnToCampaign:
      "Zur Kampagne zurückkehren",

    paymentConfirmed:
      "Zahlung bestätigt",

    thankYou:
      "Vielen Dank",

    successMessage:
      "Ihre Spende wurde erfolgreich über Stripe verarbeitet.",

    yourDonation:
      "Ihre Spende",

    donation:
      "Spende",

    transactionCost:
      "Beitrag zu den Transaktionskosten",

    totalPaid:
      "Gesamt bezahlt",

    paymentSuccessful:
      "Zahlung erfolgreich",

    paymentStatus:
      "Zahlungsstatus",

    confirmationSent:
      "Bestätigung gesendet an",

    donationType:
      "Spendenart",

    monthly:
      "Monatlich",

    oneTime:
      "Einmalig",

    currency:
      "Währung",

    donateAgain:
      "Erneut spenden",

    shareCampaign:
      "Kampagne teilen",

    securePayment:
      "Sichere Zahlungsabwicklung durch Stripe.",

    verifyError:
      "Spende konnte nicht bestätigt werden",

    verifyErrorText:
      "Diese Zahlung konnte nicht von Stripe abgerufen werden. Bitte kehren Sie zur Kampagne zurück und versuchen Sie es erneut.",
  },

  es: {
    sessionNotFound:
      "Sesión de pago no encontrada",

    sessionNotFoundText:
      "No pudimos encontrar la sesión de Stripe Checkout para esta donación.",

    returnToCampaign:
      "Volver a la campaña",

    paymentConfirmed:
      "Pago confirmado",

    thankYou:
      "Gracias",

    successMessage:
      "Tu donación se procesó correctamente mediante Stripe.",

    yourDonation:
      "Tu donación",

    donation:
      "Donación",

    transactionCost:
      "Contribución a los gastos de transacción",

    totalPaid:
      "Total pagado",

    paymentSuccessful:
      "Pago realizado correctamente",

    paymentStatus:
      "Estado del pago",

    confirmationSent:
      "Confirmación enviada a",

    donationType:
      "Tipo de donación",

    monthly:
      "Mensual",

    oneTime:
      "Una vez",

    currency:
      "Moneda",

    donateAgain:
      "Donar de nuevo",

    shareCampaign:
      "Compartir campaña",

    securePayment:
      "Pago procesado de forma segura por Stripe.",

    verifyError:
      "No se pudo verificar la donación",

    verifyErrorText:
      "No pudimos recuperar este pago desde Stripe. Vuelve a la campaña e inténtalo de nuevo.",
  },

  ar: {
    sessionNotFound:
      "لم يتم العثور على جلسة الدفع",

    sessionNotFoundText:
      "تعذر العثور على جلسة Stripe Checkout الخاصة بهذا التبرع.",

    returnToCampaign:
      "العودة إلى الحملة",

    paymentConfirmed:
      "تم تأكيد الدفع",

    thankYou:
      "شكرًا لك",

    successMessage:
      "تمت معالجة تبرعك بنجاح عبر Stripe.",

    yourDonation:
      "تبرعك",

    donation:
      "التبرع",

    transactionCost:
      "المساهمة في رسوم المعاملة",

    totalPaid:
      "إجمالي المبلغ المدفوع",

    paymentSuccessful:
      "تم الدفع بنجاح",

    paymentStatus:
      "حالة الدفع",

    confirmationSent:
      "تم إرسال التأكيد إلى",

    donationType:
      "نوع التبرع",

    monthly:
      "شهري",

    oneTime:
      "مرة واحدة",

    currency:
      "العملة",

    donateAgain:
      "تبرع مرة أخرى",

    shareCampaign:
      "مشاركة الحملة",

    securePayment:
      "تمت معالجة الدفع بأمان عبر Stripe.",

    verifyError:
      "تعذر التحقق من التبرع",

    verifyErrorText:
      "تعذر استرداد بيانات هذا الدفع من Stripe. يرجى العودة إلى الحملة والمحاولة مرة أخرى.",
  },
};

export function getThankYouTranslations(
  locale: Locale,
) {
  return (
    translations[
      locale
    ] ??
    translations.en
  );
}