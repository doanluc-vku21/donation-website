import type { PortableTextBlock } from "@portabletext/react";
import { locales, type Locale } from "@/lib/i18n";
import { localizeCampaign } from "@/lib/localize-campaign";
import type { DonationOption, RecentDonation } from "@/lib/sample-data";
import type { SanityCampaign } from "@/sanity/types/campaign";

export const STREET_VENDOR_SLUG = "help-street-vendor";
export const STREET_VENDOR_GOAL_USD_CENTS = 250_000;
export const STREET_VENDOR_HISTORICAL_DONOR_COUNT = 724;

export function withStreetVendorDonationOptions(options: DonationOption[]): DonationOption[] {
  return options.map(option => option.amountUsd === 2500 ? { ...option, amountUsd: 2000 } : option);
}

export const STREET_VENDOR_SEED_DONATIONS: RecentDonation[] = [
  { id: "street-vendor-seed-1", displayName: "Marcus T.", amountUsd: 5000, frequency: "monthly", relativeTime: "14 minutes ago" },
  { id: "street-vendor-seed-2", displayName: "Elena R.", amountUsd: 7500, frequency: "one_time", relativeTime: "36 minutes ago" },
  { id: "street-vendor-seed-3", displayName: "Omar A.", amountUsd: 2500, frequency: "monthly", relativeTime: "1 hour ago" },
  { id: "street-vendor-seed-4", displayName: "Sophia C.", amountUsd: 5000, frequency: "one_time", relativeTime: "2 hours ago" },
  { id: "street-vendor-seed-5", displayName: "David K.", amountUsd: 2500, frequency: "monthly", relativeTime: "3 hours ago" },
  { id: "street-vendor-seed-6", displayName: "Grace W.", amountUsd: 5000, frequency: "one_time", relativeTime: "4 hours ago" },
  { id: "street-vendor-seed-7", displayName: "Hassan M.", amountUsd: 2500, frequency: "monthly", relativeTime: "5 hours ago" },
  { id: "street-vendor-seed-8", displayName: "Julia B.", amountUsd: 10000, frequency: "one_time", relativeTime: "6 hours ago" },
  { id: "street-vendor-seed-9", displayName: "Kevin L.", amountUsd: 2500, frequency: "one_time", relativeTime: "8 hours ago" },
  { id: "street-vendor-seed-10", displayName: "Amina N.", amountUsd: 5000, frequency: "monthly", relativeTime: "9 hours ago" },
  { id: "street-vendor-seed-11", displayName: "Paul S.", amountUsd: 2500, frequency: "one_time", relativeTime: "11 hours ago" },
  { id: "street-vendor-seed-12", displayName: "Chloe D.", amountUsd: 5000, frequency: "monthly", relativeTime: "13 hours ago" },
  { id: "street-vendor-seed-13", displayName: "Tariq Z.", amountUsd: 2500, frequency: "one_time", relativeTime: "15 hours ago" },
  { id: "street-vendor-seed-14", displayName: "Natalie F.", amountUsd: 5000, frequency: "one_time", relativeTime: "18 hours ago" },
  { id: "street-vendor-seed-15", displayName: "Victor H.", amountUsd: 2500, frequency: "monthly", relativeTime: "20 hours ago" },
  { id: "street-vendor-seed-16", displayName: "Leila K.", amountUsd: 5000, frequency: "monthly", relativeTime: "1 day ago" },
  { id: "street-vendor-seed-17", displayName: "Brian G.", amountUsd: 5000, frequency: "one_time", relativeTime: "1 day ago" },
  { id: "street-vendor-seed-18", displayName: "Yasmine P.", amountUsd: 2500, frequency: "monthly", relativeTime: "2 days ago" },
];

export const STREET_VENDOR_BASE_RAISED_USD = STREET_VENDOR_SEED_DONATIONS.reduce(
  (sum, donation) => sum + donation.amountUsd,
  0,
);

type StreetVendorCopy = {
  title: string;
  paragraphs: [string, string, string, string, string];
  storyEyebrow: string;
  storyHeading: string;
  fundTitle: string;
  fundSubtitle: string;
  fundItems: [string, string][];
};

// Story and monthly support target supplied by the campaign owner. The monthly
// support message is separate from the campaign's fundraising progress goal.
const copy: Record<Locale, StreetVendorCopy> = {
  en: {
    title: "❤️ He Works Hard Every Day to Support His Family. Now It’s Our Turn to Help Him.",
    paragraphs: [
      "Despite living with a physical disability, he continues working hard on the streets to earn a living and provide for his family. Every day brings new challenges, but his determination to keep going is inspiring.",
      "Supporting his family is not easy. From putting food on the table to covering household expenses and essential daily needs, he faces financial struggles that no family should have to endure alone.",
      "❤️ Our Goal: $3,000 in Monthly Support",
      "Meal Support Inc is raising funds with the goal of providing him with $3,000 every month to help cover food, housing, medical care, and essential family expenses.",
      "❤️ Your monthly donation can help ease his financial burden, provide greater stability for his family, and give them hope for a brighter future.",
    ],
    storyEyebrow: "THE STORY BEHIND OUR MISSION",
    storyHeading: "Why He Needs Our Support ❤️",
    fundTitle: "How Your Donation Will Help",
    fundSubtitle: "Your monthly kindness can provide essential care, financial stability, and hope for a better future.",
    fundItems: [
      ["🍚 Food & Daily Essentials", "Help provide meals, clean water, clothing, and everyday necessities."],
      ["❤️ Medical Care & Well-Being", "Support healthcare, treatment, and disability-related needs."],
      ["🏠 Safe & Comfortable Living", "Help improve his living conditions and provide greater security."],
      ["🤝 Long-Term Financial Support", "Help reduce financial struggles and support a more independent future."],
    ],
  },
  fr: {
    title: "❤️ Il travaille dur chaque jour pour faire vivre sa famille. À notre tour de l’aider.",
    paragraphs: [
      "Malgré son handicap physique, il continue de travailler dur dans la rue pour gagner sa vie et subvenir aux besoins de sa famille. Chaque jour apporte de nouveaux défis, mais sa détermination à aller de l’avant est inspirante.",
      "Subvenir aux besoins de sa famille n’est pas facile. Qu’il s’agisse de mettre de la nourriture sur la table, de payer les dépenses du foyer ou de répondre aux besoins essentiels du quotidien, il fait face à des difficultés financières qu’aucune famille ne devrait avoir à affronter seule.",
      "❤️ Notre objectif : 3 000 $ US de soutien mensuel",
      "Meal Support Inc collecte des fonds dans le but de lui apporter 3 000 $ US chaque mois pour contribuer à couvrir la nourriture, le logement, les soins médicaux et les dépenses essentielles de sa famille.",
      "❤️ Votre don mensuel peut alléger sa charge financière, offrir davantage de stabilité à sa famille et lui donner l’espoir d’un avenir meilleur.",
    ],
    storyEyebrow: "L’HISTOIRE DERRIÈRE NOTRE MISSION",
    storyHeading: "Pourquoi il a besoin de notre soutien ❤️",
    fundTitle: "Comment votre don aidera",
    fundSubtitle: "Votre générosité mensuelle peut apporter des soins essentiels, une stabilité financière et l’espoir d’un avenir meilleur.",
    fundItems: [
      ["🍚 Alimentation et besoins quotidiens", "Contribuer aux repas, à l’eau potable, aux vêtements et aux produits de première nécessité."],
      ["❤️ Soins médicaux et bien-être", "Soutenir les soins de santé, les traitements et les besoins liés au handicap."],
      ["🏠 Un logement sûr et confortable", "Contribuer à améliorer ses conditions de vie et à lui apporter davantage de sécurité."],
      ["🤝 Soutien financier à long terme", "Contribuer à réduire ses difficultés financières et à lui permettre de vivre de façon plus indépendante."],
    ],
  },
  de: {
    title: "❤️ Er arbeitet jeden Tag hart, um seine Familie zu versorgen. Jetzt sind wir an der Reihe, ihm zu helfen.",
    paragraphs: [
      "Trotz einer körperlichen Behinderung arbeitet er weiterhin hart auf der Straße, um seinen Lebensunterhalt zu verdienen und seine Familie zu versorgen. Jeder Tag bringt neue Herausforderungen mit sich, doch seine Entschlossenheit, weiterzumachen, ist inspirierend.",
      "Seine Familie zu versorgen, ist nicht einfach. Ob es darum geht, Essen auf den Tisch zu bringen, Haushaltskosten zu decken oder den täglichen Grundbedarf zu sichern: Er steht vor finanziellen Schwierigkeiten, die keine Familie allein bewältigen sollte.",
      "❤️ Unser Ziel: 3.000 US-Dollar monatliche Unterstützung",
      "Meal Support Inc sammelt Spenden mit dem Ziel, ihn jeden Monat mit 3.000 US-Dollar zu unterstützen, um Lebensmittel, Wohnraum, medizinische Versorgung und grundlegende Ausgaben seiner Familie mitzufinanzieren.",
      "❤️ Ihre monatliche Spende kann seine finanzielle Belastung lindern, seiner Familie mehr Stabilität geben und ihr Hoffnung auf eine bessere Zukunft schenken.",
    ],
    storyEyebrow: "DIE GESCHICHTE HINTER UNSERER MISSION",
    storyHeading: "Warum er unsere Unterstützung braucht ❤️",
    fundTitle: "So hilft Ihre Spende",
    fundSubtitle: "Ihre monatliche Großzügigkeit kann grundlegende Versorgung, finanzielle Stabilität und Hoffnung auf eine bessere Zukunft ermöglichen.",
    fundItems: [
      ["🍚 Lebensmittel und Alltagsbedarf", "Helfen Sie, Mahlzeiten, sauberes Wasser, Kleidung und Dinge des täglichen Bedarfs bereitzustellen."],
      ["❤️ Medizinische Versorgung und Wohlbefinden", "Unterstützen Sie Gesundheitsversorgung, Behandlungen und behinderungsbedingte Bedürfnisse."],
      ["🏠 Sicheres und angenehmes Wohnen", "Helfen Sie, seine Lebensbedingungen zu verbessern und ihm mehr Sicherheit zu geben."],
      ["🤝 Langfristige finanzielle Unterstützung", "Helfen Sie, finanzielle Schwierigkeiten zu verringern und eine selbstständigere Zukunft zu ermöglichen."],
    ],
  },
  es: {
    title: "❤️ Trabaja duro cada día para mantener a su familia. Ahora nos toca ayudarlo a él.",
    paragraphs: [
      "A pesar de vivir con una discapacidad física, sigue trabajando duro en la calle para ganarse la vida y mantener a su familia. Cada día trae nuevos desafíos, pero su determinación para seguir adelante es inspiradora.",
      "Mantener a su familia no es fácil. Desde poner comida en la mesa hasta cubrir los gastos del hogar y las necesidades básicas del día a día, se enfrenta a dificultades económicas que ninguna familia debería tener que afrontar sola.",
      "❤️ Nuestro objetivo: 3.000 USD de apoyo mensual",
      "Meal Support Inc está recaudando fondos con el objetivo de proporcionarle 3.000 USD cada mes para ayudar a cubrir alimentos, vivienda, atención médica y gastos esenciales de su familia.",
      "❤️ Tu donación mensual puede aliviar su carga económica, brindar mayor estabilidad a su familia y darles esperanza de un futuro mejor.",
    ],
    storyEyebrow: "LA HISTORIA DETRÁS DE NUESTRA MISIÓN",
    storyHeading: "Por qué necesita nuestro apoyo ❤️",
    fundTitle: "Cómo ayudará tu donación",
    fundSubtitle: "Tu generosidad mensual puede brindar cuidados esenciales, estabilidad económica y esperanza de un futuro mejor.",
    fundItems: [
      ["🍚 Alimentos y necesidades diarias", "Ayuda a proporcionar comidas, agua potable, ropa y artículos de primera necesidad."],
      ["❤️ Atención médica y bienestar", "Apoya la atención sanitaria, los tratamientos y las necesidades relacionadas con la discapacidad."],
      ["🏠 Una vivienda segura y cómoda", "Ayuda a mejorar sus condiciones de vida y a brindarle mayor seguridad."],
      ["🤝 Apoyo económico a largo plazo", "Ayuda a reducir las dificultades económicas y a favorecer un futuro más independiente."],
    ],
  },
  ar: {
    title: "❤️ يعمل بجد كل يوم لإعالة أسرته. والآن حان دورنا لمساعدته.",
    paragraphs: [
      "رغم إعاقته الجسدية، يواصل العمل بجد في الشوارع لكسب رزقه وإعالة أسرته. يحمل كل يوم تحديات جديدة، لكن إصراره على الاستمرار مصدر إلهام.",
      "إعالة أسرته ليست سهلة. فمن توفير الطعام إلى تغطية نفقات المنزل والاحتياجات اليومية الأساسية، يواجه صعوبات مالية لا ينبغي لأي أسرة أن تواجهها وحدها.",
      "❤️ هدفنا: 3,000 دولار أمريكي من الدعم الشهري",
      "تجمع Meal Support Inc التبرعات بهدف تقديم 3,000 دولار أمريكي له كل شهر للمساعدة في تغطية الطعام والسكن والرعاية الطبية ونفقات الأسرة الأساسية.",
      "❤️ يمكن لتبرعك الشهري أن يخفف أعباءه المالية، ويوفر مزيدًا من الاستقرار لأسرته، ويمنحهم الأمل في مستقبل أفضل.",
    ],
    storyEyebrow: "القصة وراء رسالتنا",
    storyHeading: "لماذا يحتاج إلى دعمنا ❤️",
    fundTitle: "كيف سيساعد تبرعك",
    fundSubtitle: "يمكن لعطائك الشهري أن يوفر الرعاية الأساسية والاستقرار المالي والأمل في مستقبل أفضل.",
    fundItems: [
      ["🍚 الغذاء والضروريات اليومية", "المساعدة في توفير الوجبات والمياه النظيفة والملابس والاحتياجات اليومية."],
      ["❤️ الرعاية الطبية والعافية", "دعم الرعاية الصحية والعلاج والاحتياجات المرتبطة بالإعاقة."],
      ["🏠 سكن آمن ومريح", "المساعدة في تحسين ظروف معيشته وتوفير مزيد من الأمان."],
      ["🤝 دعم مالي طويل الأمد", "المساعدة في تخفيف الصعوبات المالية ودعم مستقبل أكثر استقلالية."],
    ],
  },
};

function storyBlocks(paragraphs: string[]): PortableTextBlock[] {
  return paragraphs.map((text, index) => ({
    _type: "block", _key: `street-vendor-story-${index}`, style: "normal", markDefs: [],
    children: [{ _type: "span", _key: `street-vendor-text-${index}`, text, marks: index === 2 ? ["strong"] : [] }],
  }));
}

export function localizeStreetVendorCampaign(content: SanityCampaign, locale: Locale): SanityCampaign {
  const translatedText = (select: (value: StreetVendorCopy) => string) =>
    Object.fromEntries(locales.map(language => [language, select(copy[language])]));
  const hasStory = Boolean(content.story?.length);
  return localizeCampaign({
    ...content,
    organizationName: "MEAL SUPPORT INC",
    title: copy.en.title,
    titleI18n: translatedText(value => value.title),
    eyebrow: "",
    eyebrowI18n: translatedText(() => ""),
    summary: copy.en.paragraphs.join("\n\n"),
    summaryI18n: translatedText(value => value.paragraphs.join("\n\n")),
    storyEyebrow: copy.en.storyEyebrow,
    storyEyebrowI18n: translatedText(value => value.storyEyebrow),
    storyHeading: copy.en.storyHeading,
    storyHeadingI18n: translatedText(value => value.storyHeading),
    story: hasStory ? content.story : storyBlocks(copy.en.paragraphs),
    storyI18n: hasStory ? content.storyI18n : Object.fromEntries(locales.map(language => [language, storyBlocks(copy[language].paragraphs)])),
    fundUsageTitle: copy.en.fundTitle,
    fundUsageTitleI18n: translatedText(value => value.fundTitle),
    fundUsageSubtitle: copy.en.fundSubtitle,
    fundUsageSubtitleI18n: translatedText(value => value.fundSubtitle),
    fundUsageItems: content.fundUsageItems?.length ? content.fundUsageItems : copy.en.fundItems.map(([title, description], index) => ({
      _key: `street-vendor-fund-${index}`, itemType: "allocation", title, description,
      titleI18n: translatedText(value => value.fundItems[index][0]),
      descriptionI18n: translatedText(value => value.fundItems[index][1]),
    })),
    heroImage: content.heroImage?.asset?.url ? content.heroImage : {
      asset: {
        _id: "street-vendor-portrait", url: "/street-vendor.jpg",
        metadata: { dimensions: { width: 589, height: 1280, aspectRatio: 589 / 1280 } },
      },
      alt: copy[locale].title,
    },
    seoTitle: copy.en.title,
    seoTitleI18n: translatedText(value => value.title),
    seoDescription: copy.en.paragraphs[0],
    seoDescriptionI18n: translatedText(value => value.paragraphs[0]),
  }, locale);
}
