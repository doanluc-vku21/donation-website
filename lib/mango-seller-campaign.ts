import type { PortableTextBlock } from "@portabletext/react";
import { locales, type Locale } from "@/lib/i18n";
import { localizeCampaign } from "@/lib/localize-campaign";
import type { RecentDonation } from "@/lib/sample-data";
import type { LocalizedString, SanityCampaign } from "@/sanity/types/campaign";

export const MANGO_SELLER_SLUG = "help-mango-seller";

export const MANGO_SELLER_SEED_DONATIONS: RecentDonation[] = [
  { id: "mango-seed-1", displayName: "Sarah H.", amountUsd: 5000, frequency: "monthly", relativeTime: "18 minutes ago" },
  { id: "mango-seed-2", displayName: "Damon H.", amountUsd: 10000, frequency: "one_time", relativeTime: "42 minutes ago" },
  { id: "mango-seed-3", displayName: "Edwin N.", amountUsd: 2500, frequency: "monthly", relativeTime: "1 hour ago" },
  { id: "mango-seed-4", displayName: "Linda S.", amountUsd: 5000, frequency: "one_time", relativeTime: "2 hours ago" },
  { id: "mango-seed-5", displayName: "Mohammad D.", amountUsd: 2500, frequency: "one_time", relativeTime: "3 hours ago" },
  { id: "mango-seed-6", displayName: "Elizabeth O.", amountUsd: 5000, frequency: "monthly", relativeTime: "4 hours ago" },
  { id: "mango-seed-7", displayName: "Lucas P.", amountUsd: 10000, frequency: "one_time", relativeTime: "5 hours ago" },
  { id: "mango-seed-8", displayName: "Fatima B.", amountUsd: 2500, frequency: "monthly", relativeTime: "6 hours ago" },
  { id: "mango-seed-9", displayName: "Sergio C.", amountUsd: 5000, frequency: "one_time", relativeTime: "7 hours ago" },
  { id: "mango-seed-10", displayName: "Suhaila M.", amountUsd: 2500, frequency: "monthly", relativeTime: "9 hours ago" },
  { id: "mango-seed-11", displayName: "Daniel W.", amountUsd: 10000, frequency: "one_time", relativeTime: "11 hours ago" },
  { id: "mango-seed-12", displayName: "Claire B.", amountUsd: 5000, frequency: "monthly", relativeTime: "13 hours ago" },
  { id: "mango-seed-13", displayName: "Anastasios P.", amountUsd: 5000, frequency: "one_time", relativeTime: "15 hours ago" },
  { id: "mango-seed-14", displayName: "Hannah L.", amountUsd: 2500, frequency: "monthly", relativeTime: "17 hours ago" },
  { id: "mango-seed-15", displayName: "Michael T.", amountUsd: 7500, frequency: "one_time", relativeTime: "19 hours ago" },
  { id: "mango-seed-16", displayName: "Nadia S.", amountUsd: 5000, frequency: "monthly", relativeTime: "21 hours ago" },
  { id: "mango-seed-17", displayName: "Rachel G.", amountUsd: 2500, frequency: "one_time", relativeTime: "1 day ago" },
  { id: "mango-seed-18", displayName: "Thomas H.", amountUsd: 10000, frequency: "one_time", relativeTime: "1 day ago" },
  { id: "mango-seed-19", displayName: "Alisha O.", amountUsd: 2500, frequency: "monthly", relativeTime: "1 day ago" },
  { id: "mango-seed-20", displayName: "Mark V.", amountUsd: 2500, frequency: "one_time", relativeTime: "2 days ago" },
];

export const MANGO_SELLER_BASE_RAISED_USD = MANGO_SELLER_SEED_DONATIONS.reduce(
  (sum, donation) => sum + donation.amountUsd,
  0,
);

type MangoSellerCopy = {
  title: string;
  description: [string, string, string];
  storyEyebrow: string;
  storyHeading: string;
  fundTitle: string;
  fundSubtitle: string;
  fundItems: [string, string][];
};

const copy: Record<Locale, MangoSellerCopy> = {
  en: {
    title: "❤️ He Had So Little, Yet He Chose to Help Us. Now It’s Our Turn to Help Him.",
    description: [
      "Despite living with a disability and working tirelessly to sell mangoes, he showed incredible kindness by helping strangers when he had so little himself. His honesty and generosity touched our hearts.",
      "Now, Meal Support Inc is raising funds with the goal of providing him with $2,500 in monthly support for food, medical care, and essential living expenses.",
      "❤️ Your monthly donation can help give him a more comfortable, secure, and hopeful future.",
    ],
    storyEyebrow: "THE STORY BEHIND OUR MISSION",
    storyHeading: "Why He Deserves Our Support ❤️",
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
    title: "❤️ Il avait si peu, mais il a choisi de nous aider. À notre tour de l’aider.",
    description: [
      "Bien qu’il vive avec un handicap et travaille sans relâche pour vendre des mangues, il a fait preuve d’une incroyable bonté en aidant des inconnus alors qu’il avait lui-même si peu. Son honnêteté et sa générosité nous ont touchés.",
      "Aujourd’hui, Meal Support Inc collecte des fonds dans le but de lui apporter 2 500 dollars américains de soutien mensuel pour l’alimentation, les soins médicaux et les dépenses essentielles.",
      "❤️ Votre don mensuel peut l’aider à vivre un avenir plus confortable, plus sûr et plein d’espoir.",
    ],
    storyEyebrow: "L’HISTOIRE DERRIÈRE NOTRE MISSION",
    storyHeading: "Pourquoi il mérite notre soutien ❤️",
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
    title: "❤️ Er hatte so wenig und entschied sich trotzdem, uns zu helfen. Jetzt sind wir an der Reihe, ihm zu helfen.",
    description: [
      "Obwohl er mit einer Behinderung lebt und unermüdlich Mangos verkauft, zeigte er außergewöhnliche Güte: Er half Fremden, obwohl er selbst so wenig hatte. Seine Ehrlichkeit und Großzügigkeit haben uns berührt.",
      "Meal Support Inc sammelt nun Spenden mit dem Ziel, ihn monatlich mit 2.500 US-Dollar für Lebensmittel, medizinische Versorgung und grundlegende Lebenshaltungskosten zu unterstützen.",
      "❤️ Ihre monatliche Spende kann ihm eine angenehmere, sicherere und hoffnungsvollere Zukunft ermöglichen.",
    ],
    storyEyebrow: "DIE GESCHICHTE HINTER UNSERER MISSION",
    storyHeading: "Warum er unsere Unterstützung verdient ❤️",
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
    title: "❤️ Tenía tan poco y aun así eligió ayudarnos. Ahora nos toca ayudarlo a él.",
    description: [
      "A pesar de vivir con una discapacidad y trabajar incansablemente vendiendo mangos, mostró una bondad increíble al ayudar a desconocidos cuando él mismo tenía tan poco. Su honestidad y generosidad nos conmovieron.",
      "Ahora, Meal Support Inc está recaudando fondos con el objetivo de brindarle 2.500 dólares estadounidenses de apoyo mensual para alimentos, atención médica y gastos básicos de subsistencia.",
      "❤️ Tu donación mensual puede ayudarlo a tener un futuro más cómodo, seguro y lleno de esperanza.",
    ],
    storyEyebrow: "LA HISTORIA DETRÁS DE NUESTRA MISIÓN",
    storyHeading: "Por qué merece nuestro apoyo ❤️",
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
    title: "❤️ لم يكن يملك إلا القليل، ومع ذلك اختار مساعدتنا. والآن حان دورنا لمساعدته.",
    description: [
      "رغم أنه يعيش مع إعاقة ويعمل بلا كلل في بيع المانجو، أظهر طيبة استثنائية بمساعدة الغرباء رغم قلة ما يملكه. لقد لامس صدقه وكرمه قلوبنا.",
      "تجمع Meal Support Inc الآن التبرعات بهدف تقديم دعم شهري له بقيمة 2,500 دولار أمريكي لتغطية الغذاء والرعاية الطبية ونفقات المعيشة الأساسية.",
      "❤️ يمكن لتبرعك الشهري أن يساعده على التمتع بمستقبل أكثر راحة وأمانًا وأملًا.",
    ],
    storyEyebrow: "القصة وراء رسالتنا",
    storyHeading: "لماذا يستحق دعمنا ❤️",
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

function translatedText(select: (value: MangoSellerCopy) => string): LocalizedString {
  return Object.fromEntries(locales.map(locale => [locale, select(copy[locale])]));
}

function storyBlocks(paragraphs: string[]): PortableTextBlock[] {
  return paragraphs.map((text, index) => ({
    _type: "block", _key: `mango-story-${index}`, style: "normal", markDefs: [],
    children: [{ _type: "span", _key: `mango-text-${index}`, text, marks: [] }],
  }));
}

// Page-specific copy follows the existing localization mechanism. The supplied
// description is also the initial full story; no biography has been invented.
// A separately authored CMS story can replace that initial story later.
export function withMangoSellerCopy(content: SanityCampaign): SanityCampaign {
  const hasStory = Array.isArray(content.story) && content.story.length > 0;
  return {
    ...content,
    title: copy.en.title,
    titleI18n: translatedText(value => value.title),
    organizationName: "MEAL SUPPORT INC",
    eyebrow: "",
    eyebrowI18n: translatedText(() => ""),
    summary: copy.en.description.join("\n\n"),
    summaryI18n: translatedText(value => value.description.join("\n\n")),
    storyEyebrow: copy.en.storyEyebrow,
    storyEyebrowI18n: translatedText(value => value.storyEyebrow),
    storyHeading: copy.en.storyHeading,
    storyHeadingI18n: translatedText(value => value.storyHeading),
    story: hasStory ? content.story : storyBlocks(copy.en.description),
    storyI18n: hasStory ? content.storyI18n : Object.fromEntries(locales.map(locale => [locale, storyBlocks(copy[locale].description)])),
    fundUsageTitle: copy.en.fundTitle,
    fundUsageTitleI18n: translatedText(value => value.fundTitle),
    fundUsageSubtitle: copy.en.fundSubtitle,
    fundUsageSubtitleI18n: translatedText(value => value.fundSubtitle),
    fundUsageItems: copy.en.fundItems.map(([title, description], index) => ({
      _key: `mango-fund-${index}`, itemType: "allocation", title, description,
      titleI18n: translatedText(value => value.fundItems[index][0]),
      descriptionI18n: translatedText(value => value.fundItems[index][1]),
    })),
    seoTitle: copy.en.title,
    seoTitleI18n: translatedText(value => value.title),
    seoDescription: copy.en.description.join("\n\n"),
    seoDescriptionI18n: translatedText(value => value.description.join("\n\n")),
  };
}

export function localizeMangoSellerCampaign(content: SanityCampaign, locale: Locale): SanityCampaign {
  return {
    ...localizeCampaign(withMangoSellerCopy(content), locale),
    heroImage: content.heroImage?.asset?.url ? content.heroImage : {
      asset: {
        _id: "mango-seller-portrait",
        url: "/mango-seller.jpg",
        metadata: { dimensions: { width: 725, height: 1280, aspectRatio: 725 / 1280 } },
      },
      alt: copy[locale].title,
    },
  };
}
