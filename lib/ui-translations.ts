import type {
  Locale,
} from "@/lib/i18n";

export type UiTranslations = {
  organizedBy: string;

  raised: string;
  of: string;
  donated: string;

  donate: string;
  share: string;

  securePaymentThroughStripe:
    string;

  showMore: string;
  showLess: string;

  communitySupport: string;
  contributions: string;
  contribution: string;

  recentSupport: string;
  seeAllContributions: string;

  browseLatestDonations: string;

  closeContributions: string;

  sortBy: string;
  mostRecent: string;
  highestAmount: string;

  monthly: string;

  spreadTheWord: string;
  shareThisCampaign: string;
  closeShareDialog: string;

  email: string;

  copyLink: string;
  linkCopied: string;

  scanToOpen: string;
  scanDescription: string;

  makeYourDonation: string;
  everyGiftWorks: string;
  closeDonationForm: string;

  giveOnce: string;

  chooseYourGift: string;
  donationFrequency: string;
  donationAmount: string;

  recommended: string;

  enterAmount: string;

  displayNamePublicly: string;

  coverProcessingFees: string;

  addFeePrefix: string;
  addFeeSuffix: string;

  total: string;
  totalPerMonth: string;

  continueWith: string;
  selectAmountToContinue: string;

  securePaymentByStripe: string;

  back: string;

  yourInformation: string;

  enterDetails: string;

  firstName: string;
  lastName: string;
  emailAddress: string;

  monthlyGift: string;
  oneTimeGift: string;

  includes: string;
  fee: string;

  openingCheckout: string;
  continueSecureCheckout: string;

  paymentProcessedStripe: string;

  errorSelectAmount: string;
  errorFirstName: string;
  errorLastName: string;
  errorEmail: string;
  errorValidEmail: string;
  errorValidAmount: string;
  errorCheckout: string;

  justNow: string;

  minuteAgo: (
    count: number,
  ) => string;

  hourAgo: (
    count: number,
  ) => string;

  dayAgo: (
    count: number,
  ) => string;
};

const en: UiTranslations = {
  organizedBy:
    "Organized by",

  raised:
    "raised",

  of:
    "of",

  donated:
    "donated",

  donate:
    "Donate",

  share:
    "Share",

  securePaymentThroughStripe:
    "Secure payment through Stripe",

  showMore:
    "Show more",

  showLess:
    "Show less",

  communitySupport:
    "Community support",

  contributions:
    "Contributions",

  contribution:
    "contribution",

  recentSupport:
    "Recent support from people helping move this campaign forward.",

  seeAllContributions:
    "See all contributions",

  browseLatestDonations:
    "Browse the latest donations made to this campaign.",

  closeContributions:
    "Close contributions",

  sortBy:
    "Sort by",

  mostRecent:
    "Most recent",

  highestAmount:
    "Highest amount",

  monthly:
    "Monthly",

  spreadTheWord:
    "Spread the word",

  shareThisCampaign:
    "Share this campaign",

  closeShareDialog:
    "Close share dialog",

  email:
    "Email",

  copyLink:
    "Copy link",

  linkCopied:
    "Link copied",

  scanToOpen:
    "Scan to open this campaign",

  scanDescription:
    "Use your phone camera to share the campaign in person.",

  makeYourDonation:
    "Make your donation",

  everyGiftWorks:
    "Every gift goes to work right away.",

  closeDonationForm:
    "Close donation form",

  giveOnce:
    "Give once",

  chooseYourGift:
    "Choose your gift",

  donationFrequency:
    "Donation frequency",

  donationAmount:
    "Donation amount",

  recommended:
    "Recommended",

  enterAmount:
    "Enter amount",

  displayNamePublicly:
    "Display my name publicly",

  coverProcessingFees:
    "Cover processing fees",

  addFeePrefix:
    "Add",

  addFeeSuffix:
    "to cover processing fees",

  total:
    "Total",

  totalPerMonth:
    "Total per month",

  continueWith:
    "Continue with",

  selectAmountToContinue:
    "Select an amount to continue",

  securePaymentByStripe:
    "Secure payment by Stripe",

  back:
    "Back",

  yourInformation:
    "Your information",

  enterDetails:
    "Enter your details to continue to secure checkout.",

  firstName:
    "First name",

  lastName:
    "Last name",

  emailAddress:
    "Email address",

  monthlyGift:
    "Monthly gift",

  oneTimeGift:
    "One-time gift",

  includes:
    "Includes",

  fee:
    "fee",

  openingCheckout:
    "Opening checkout...",

  continueSecureCheckout:
    "Continue to secure checkout",

  paymentProcessedStripe:
    "Payment processed securely by Stripe",

  errorSelectAmount:
    "Please select or enter a donation amount.",

  errorFirstName:
    "Please enter your first name.",

  errorLastName:
    "Please enter your last name.",

  errorEmail:
    "Please enter your email address.",

  errorValidEmail:
    "Please enter a valid email address.",

  errorValidAmount:
    "Please choose a valid donation amount.",

  errorCheckout:
    "Unable to start checkout.",

  justNow:
    "Just now",

  minuteAgo: (
    count,
  ) =>
    `${count} ${
      count === 1
        ? "minute"
        : "minutes"
    } ago`,

  hourAgo: (
    count,
  ) =>
    `${count} ${
      count === 1
        ? "hour"
        : "hours"
    } ago`,

  dayAgo: (
    count,
  ) =>
    `${count} ${
      count === 1
        ? "day"
        : "days"
    } ago`,
};

const fr: UiTranslations = {
  ...en,

  organizedBy:
    "Organisé par",

  raised:
    "collectés",

  of:
    "sur",

  donated:
    "a fait un don de",

  donate:
    "Faire un don",

  share:
    "Partager",

  securePaymentThroughStripe:
    "Paiement sécurisé via Stripe",

  showMore:
    "Afficher plus",

  showLess:
    "Afficher moins",

  communitySupport:
    "Soutien de la communauté",

  contributions:
    "Contributions",

  contribution:
    "contribution",

  recentSupport:
    "Les derniers soutiens qui font avancer cette campagne.",

  seeAllContributions:
    "Voir toutes les contributions",

  browseLatestDonations:
    "Consultez les derniers dons faits à cette campagne.",

  closeContributions:
    "Fermer les contributions",

  sortBy:
    "Trier par",

  mostRecent:
    "Plus récent",

  highestAmount:
    "Montant le plus élevé",

  monthly:
    "Mensuel",

  spreadTheWord:
    "Faites passer le message",

  shareThisCampaign:
    "Partager cette campagne",

  closeShareDialog:
    "Fermer le partage",

  email:
    "E-mail",

  copyLink:
    "Copier le lien",

  linkCopied:
    "Lien copié",

  scanToOpen:
    "Scannez pour ouvrir cette campagne",

  scanDescription:
    "Utilisez l'appareil photo de votre téléphone pour partager cette campagne.",

  makeYourDonation:
    "Faites votre don",

  everyGiftWorks:
    "Chaque don peut agir immédiatement.",

  closeDonationForm:
    "Fermer le formulaire de don",

  giveOnce:
    "Don unique",

  chooseYourGift:
    "Choisissez votre don",

  donationFrequency:
    "Fréquence du don",

  donationAmount:
    "Montant du don",

  recommended:
    "Recommandé",

  enterAmount:
    "Saisir un montant",

  displayNamePublicly:
    "Afficher mon nom publiquement",

  coverProcessingFees:
    "Couvrir les frais de traitement",

  addFeePrefix:
    "Ajouter",

  addFeeSuffix:
    "pour couvrir les frais de traitement",

  total:
    "Total",

  totalPerMonth:
    "Total par mois",

  continueWith:
    "Continuer avec",

  selectAmountToContinue:
    "Sélectionnez un montant pour continuer",

  securePaymentByStripe:
    "Paiement sécurisé par Stripe",

  back:
    "Retour",

  yourInformation:
    "Vos informations",

  enterDetails:
    "Saisissez vos informations pour continuer vers le paiement sécurisé.",

  firstName:
    "Prénom",

  lastName:
    "Nom",

  emailAddress:
    "Adresse e-mail",

  monthlyGift:
    "Don mensuel",

  oneTimeGift:
    "Don unique",

  includes:
    "Inclut",

  fee:
    "de frais",

  openingCheckout:
    "Ouverture du paiement...",

  continueSecureCheckout:
    "Continuer vers le paiement sécurisé",

  paymentProcessedStripe:
    "Paiement traité en toute sécurité par Stripe",

  errorSelectAmount:
    "Veuillez sélectionner ou saisir un montant.",

  errorFirstName:
    "Veuillez saisir votre prénom.",

  errorLastName:
    "Veuillez saisir votre nom.",

  errorEmail:
    "Veuillez saisir votre adresse e-mail.",

  errorValidEmail:
    "Veuillez saisir une adresse e-mail valide.",

  errorValidAmount:
    "Veuillez choisir un montant valide.",

  errorCheckout:
    "Impossible de démarrer le paiement.",

  justNow:
    "À l'instant",

  minuteAgo: (
    count,
  ) =>
    `Il y a ${count} minute${
      count > 1 ? "s" : ""
    }`,

  hourAgo: (
    count,
  ) =>
    `Il y a ${count} heure${
      count > 1 ? "s" : ""
    }`,

  dayAgo: (
    count,
  ) =>
    `Il y a ${count} jour${
      count > 1 ? "s" : ""
    }`,
};

const de: UiTranslations = {
  ...en,

  organizedBy:
    "Organisiert von",

  raised:
    "gesammelt",

  of:
    "von",

  donated:
    "spendete",

  donate:
    "Spenden",

  share:
    "Teilen",

  securePaymentThroughStripe:
    "Sichere Zahlung über Stripe",

  showMore:
    "Mehr anzeigen",

  showLess:
    "Weniger anzeigen",

  communitySupport:
    "Unterstützung der Gemeinschaft",

  contributions:
    "Beiträge",

  contribution:
    "Beitrag",

  recentSupport:
    "Aktuelle Unterstützung von Menschen, die diese Kampagne voranbringen.",

  seeAllContributions:
    "Alle Beiträge anzeigen",

  browseLatestDonations:
    "Sehen Sie die neuesten Spenden für diese Kampagne.",

  closeContributions:
    "Beiträge schließen",

  sortBy:
    "Sortieren nach",

  mostRecent:
    "Neueste",

  highestAmount:
    "Höchster Betrag",

  monthly:
    "Monatlich",

  spreadTheWord:
    "Weitersagen",

  shareThisCampaign:
    "Diese Kampagne teilen",

  closeShareDialog:
    "Teilen schließen",

  email:
    "E-Mail",

  copyLink:
    "Link kopieren",

  linkCopied:
    "Link kopiert",

  scanToOpen:
    "Scannen, um diese Kampagne zu öffnen",

  scanDescription:
    "Verwenden Sie Ihre Handykamera, um die Kampagne zu teilen.",

  makeYourDonation:
    "Ihre Spende",

  everyGiftWorks:
    "Jede Spende hilft sofort.",

  closeDonationForm:
    "Spendenformular schließen",

  giveOnce:
    "Einmalig",

  chooseYourGift:
    "Wählen Sie Ihre Spende",

  donationFrequency:
    "Spendenhäufigkeit",

  donationAmount:
    "Spendenbetrag",

  recommended:
    "Empfohlen",

  enterAmount:
    "Betrag eingeben",

  displayNamePublicly:
    "Meinen Namen öffentlich anzeigen",

  coverProcessingFees:
    "Bearbeitungsgebühren übernehmen",

  addFeePrefix:
    "Zusätzlich",

  addFeeSuffix:
    "für Bearbeitungsgebühren",

  total:
    "Gesamt",

  totalPerMonth:
    "Gesamt pro Monat",

  continueWith:
    "Weiter mit",

  selectAmountToContinue:
    "Betrag auswählen, um fortzufahren",

  securePaymentByStripe:
    "Sichere Zahlung über Stripe",

  back:
    "Zurück",

  yourInformation:
    "Ihre Informationen",

  enterDetails:
    "Geben Sie Ihre Daten ein, um zur sicheren Zahlung fortzufahren.",

  firstName:
    "Vorname",

  lastName:
    "Nachname",

  emailAddress:
    "E-Mail-Adresse",

  monthlyGift:
    "Monatliche Spende",

  oneTimeGift:
    "Einmalige Spende",

  includes:
    "Enthält",

  fee:
    "Gebühr",

  openingCheckout:
    "Zahlung wird geöffnet...",

  continueSecureCheckout:
    "Weiter zur sicheren Zahlung",

  paymentProcessedStripe:
    "Zahlung wird sicher von Stripe verarbeitet",

  errorSelectAmount:
    "Bitte wählen Sie einen Spendenbetrag aus oder geben Sie ihn ein.",

  errorFirstName:
    "Bitte geben Sie Ihren Vornamen ein.",

  errorLastName:
    "Bitte geben Sie Ihren Nachnamen ein.",

  errorEmail:
    "Bitte geben Sie Ihre E-Mail-Adresse ein.",

  errorValidEmail:
    "Bitte geben Sie eine gültige E-Mail-Adresse ein.",

  errorValidAmount:
    "Bitte wählen Sie einen gültigen Spendenbetrag.",

  errorCheckout:
    "Zahlung konnte nicht gestartet werden.",

  justNow:
    "Gerade eben",

  minuteAgo: (
    count,
  ) =>
    `Vor ${count} Minute${
      count === 1 ? "" : "n"
    }`,

  hourAgo: (
    count,
  ) =>
    `Vor ${count} Stunde${
      count === 1 ? "" : "n"
    }`,

  dayAgo: (
    count,
  ) =>
    `Vor ${count} Tag${
      count === 1 ? "" : "en"
    }`,
};

const es: UiTranslations = {
  ...en,

  organizedBy:
    "Organizado por",

  raised:
    "recaudados",

  of:
    "de",

  donated:
    "donó",

  donate:
    "Donar",

  share:
    "Compartir",

  securePaymentThroughStripe:
    "Pago seguro mediante Stripe",

  showMore:
    "Mostrar más",

  showLess:
    "Mostrar menos",

  communitySupport:
    "Apoyo de la comunidad",

  contributions:
    "Contribuciones",

  contribution:
    "contribución",

  recentSupport:
    "Apoyo reciente de personas que ayudan a impulsar esta campaña.",

  seeAllContributions:
    "Ver todas las contribuciones",

  browseLatestDonations:
    "Consulta las últimas donaciones realizadas a esta campaña.",

  closeContributions:
    "Cerrar contribuciones",

  sortBy:
    "Ordenar por",

  mostRecent:
    "Más recientes",

  highestAmount:
    "Mayor cantidad",

  monthly:
    "Mensual",

  spreadTheWord:
    "Comparte la campaña",

  shareThisCampaign:
    "Compartir esta campaña",

  closeShareDialog:
    "Cerrar compartir",

  email:
    "Correo electrónico",

  copyLink:
    "Copiar enlace",

  linkCopied:
    "Enlace copiado",

  scanToOpen:
    "Escanea para abrir esta campaña",

  scanDescription:
    "Usa la cámara de tu teléfono para compartir esta campaña.",

  makeYourDonation:
    "Haz tu donación",

  everyGiftWorks:
    "Cada donación comienza a ayudar de inmediato.",

  closeDonationForm:
    "Cerrar formulario de donación",

  giveOnce:
    "Una vez",

  chooseYourGift:
    "Elige tu donación",

  donationFrequency:
    "Frecuencia de la donación",

  donationAmount:
    "Cantidad de la donación",

  recommended:
    "Recomendado",

  enterAmount:
    "Ingresar cantidad",

  displayNamePublicly:
    "Mostrar mi nombre públicamente",

  coverProcessingFees:
    "Cubrir gastos de procesamiento",

  addFeePrefix:
    "Añadir",

  addFeeSuffix:
    "para cubrir los gastos de procesamiento",

  total:
    "Total",

  totalPerMonth:
    "Total por mes",

  continueWith:
    "Continuar con",

  selectAmountToContinue:
    "Selecciona una cantidad para continuar",

  securePaymentByStripe:
    "Pago seguro mediante Stripe",

  back:
    "Atrás",

  yourInformation:
    "Tu información",

  enterDetails:
    "Ingresa tus datos para continuar al pago seguro.",

  firstName:
    "Nombre",

  lastName:
    "Apellido",

  emailAddress:
    "Correo electrónico",

  monthlyGift:
    "Donación mensual",

  oneTimeGift:
    "Donación única",

  includes:
    "Incluye",

  fee:
    "de comisión",

  openingCheckout:
    "Abriendo pago...",

  continueSecureCheckout:
    "Continuar al pago seguro",

  paymentProcessedStripe:
    "Pago procesado de forma segura por Stripe",

  errorSelectAmount:
    "Selecciona o introduce una cantidad.",

  errorFirstName:
    "Introduce tu nombre.",

  errorLastName:
    "Introduce tu apellido.",

  errorEmail:
    "Introduce tu correo electrónico.",

  errorValidEmail:
    "Introduce un correo electrónico válido.",

  errorValidAmount:
    "Elige una cantidad válida.",

  errorCheckout:
    "No se pudo iniciar el pago.",

  justNow:
    "Ahora mismo",

  minuteAgo: (
    count,
  ) =>
    `Hace ${count} minuto${
      count === 1 ? "" : "s"
    }`,

  hourAgo: (
    count,
  ) =>
    `Hace ${count} hora${
      count === 1 ? "" : "s"
    }`,

  dayAgo: (
    count,
  ) =>
    `Hace ${count} día${
      count === 1 ? "" : "s"
    }`,
};

const ar: UiTranslations = {
  ...en,

  organizedBy:
    "تنظيم",

  raised:
    "تم جمعها",

  of:
    "من أصل",

  donated:
    "تبرع بمبلغ",

  donate:
    "تبرع",

  share:
    "مشاركة",

  securePaymentThroughStripe:
    "دفع آمن عبر Stripe",

  showMore:
    "عرض المزيد",

  showLess:
    "عرض أقل",

  communitySupport:
    "دعم المجتمع",

  contributions:
    "المساهمات",

  contribution:
    "مساهمة",

  recentSupport:
    "أحدث المساهمات من الأشخاص الذين يدعمون هذه الحملة.",

  seeAllContributions:
    "عرض جميع المساهمات",

  browseLatestDonations:
    "استعرض أحدث التبرعات المقدمة لهذه الحملة.",

  closeContributions:
    "إغلاق المساهمات",

  sortBy:
    "ترتيب حسب",

  mostRecent:
    "الأحدث",

  highestAmount:
    "أعلى مبلغ",

  monthly:
    "شهري",

  spreadTheWord:
    "انشر الخبر",

  shareThisCampaign:
    "شارك هذه الحملة",

  closeShareDialog:
    "إغلاق نافذة المشاركة",

  email:
    "البريد الإلكتروني",

  copyLink:
    "نسخ الرابط",

  linkCopied:
    "تم نسخ الرابط",

  scanToOpen:
    "امسح الرمز لفتح هذه الحملة",

  scanDescription:
    "استخدم كاميرا هاتفك لمشاركة هذه الحملة.",

  makeYourDonation:
    "قدم تبرعك",

  everyGiftWorks:
    "كل تبرع يبدأ في إحداث أثر فورًا.",

  closeDonationForm:
    "إغلاق نموذج التبرع",

  giveOnce:
    "تبرع مرة واحدة",

  chooseYourGift:
    "اختر مبلغ التبرع",

  donationFrequency:
    "تكرار التبرع",

  donationAmount:
    "مبلغ التبرع",

  recommended:
    "موصى به",

  enterAmount:
    "أدخل المبلغ",

  displayNamePublicly:
    "إظهار اسمي علنًا",

  coverProcessingFees:
    "تغطية رسوم المعالجة",

  addFeePrefix:
    "أضف",

  addFeeSuffix:
    "لتغطية رسوم المعالجة",

  total:
    "الإجمالي",

  totalPerMonth:
    "الإجمالي شهريًا",

  continueWith:
    "متابعة بمبلغ",

  selectAmountToContinue:
    "اختر مبلغًا للمتابعة",

  securePaymentByStripe:
    "دفع آمن عبر Stripe",

  back:
    "رجوع",

  yourInformation:
    "معلوماتك",

  enterDetails:
    "أدخل بياناتك للمتابعة إلى الدفع الآمن.",

  firstName:
    "الاسم الأول",

  lastName:
    "اسم العائلة",

  emailAddress:
    "البريد الإلكتروني",

  monthlyGift:
    "تبرع شهري",

  oneTimeGift:
    "تبرع لمرة واحدة",

  includes:
    "يشمل",

  fee:
    "رسوم",

  openingCheckout:
    "جارٍ فتح صفحة الدفع...",

  continueSecureCheckout:
    "المتابعة إلى الدفع الآمن",

  paymentProcessedStripe:
    "تتم معالجة الدفع بأمان عبر Stripe",

  errorSelectAmount:
    "يرجى اختيار مبلغ التبرع أو إدخاله.",

  errorFirstName:
    "يرجى إدخال الاسم الأول.",

  errorLastName:
    "يرجى إدخال اسم العائلة.",

  errorEmail:
    "يرجى إدخال البريد الإلكتروني.",

  errorValidEmail:
    "يرجى إدخال بريد إلكتروني صالح.",

  errorValidAmount:
    "يرجى اختيار مبلغ تبرع صالح.",

  errorCheckout:
    "تعذر بدء عملية الدفع.",

  justNow:
    "الآن",

  minuteAgo: (
    count,
  ) =>
    `منذ ${count} دقيقة`,

  hourAgo: (
    count,
  ) =>
    `منذ ${count} ساعة`,

  dayAgo: (
    count,
  ) =>
    `منذ ${count} يوم`,
};

export const uiTranslations:
  Record<
    Locale,
    UiTranslations
  > = {
  en,
  fr,
  de,
  es,
  ar,
};

export function getUiTranslations(
  locale: Locale,
) {
  return (
    uiTranslations[
      locale
    ] ?? en
  );
}

export function translateRelativeTime(
  value: string,
  locale: Locale,
) {
  const t =
    getUiTranslations(
      locale,
    );

  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    normalized ===
    "just now"
  ) {
    return t.justNow;
  }

  const match =
    normalized.match(
      /^(\d+)\s+(minute|minutes|hour|hours|day|days)\s+ago$/,
    );

  if (!match) {
    return value;
  }

  const count =
    Number(
      match[1],
    );

  const unit =
    match[2];

  if (
    unit.startsWith(
      "minute",
    )
  ) {
    return t.minuteAgo(
      count,
    );
  }

  if (
    unit.startsWith(
      "hour",
    )
  ) {
    return t.hourAgo(
      count,
    );
  }

  return t.dayAgo(
    count,
  );
}