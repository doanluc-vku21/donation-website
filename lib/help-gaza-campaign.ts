import type { PortableTextBlock } from "@portabletext/react";
import { locales, type Locale } from "@/lib/i18n";
import { localizeCampaign } from "@/lib/localize-campaign";
import type { DonationOption } from "@/lib/sample-data";
import type { SanityCampaign } from "@/sanity/types/campaign";

export const HELP_GAZA_PATH = "/help-gaza";
export const HELP_GAZA_CAMPAIGN_SLUG = "give-a-child-a-brighter-tomorrow";

export const HELP_GAZA_ONE_TIME_DONATION_OPTIONS: DonationOption[] = [2500, 5000, 7500].map(amountUsd => ({
  amountUsd,
  frequency: "one_time",
  featured: amountUsd === 5000,
  impactText: "",
}));

type HelpGazaSpan = {
  text: string;
  strong?: boolean;
};

type HelpGazaCopy = {
  title: string;
  storyEyebrow: string;
  storyHeading: string;
  paragraphs: HelpGazaSpan[][];
};

const copy: Record<Locale, HelpGazaCopy> = {
  en: {
    title: "❤️ Help Feed Families in Gaza, Palestine 🇵🇸",
    storyEyebrow: "Why this matters",
    storyHeading: "❤️ Help Feed Families in Gaza, Palestine 🇵🇸",
    paragraphs: [
      [{ text: "Your kindness can bring food, hope, and comfort to families in need.", strong: true }],
      [{ text: "Every day, families in Gaza face the challenge of finding enough food for their loved ones. Your generous donation can help provide warm meals, essential nourishment, and much-needed relief." }],
      [
        { text: "❤️ Every meal matters.", strong: true },
        { text: " Your support can bring comfort to children, parents, and families facing difficult times." },
      ],
      [
        { text: "🍽️ A meal is more than food.", strong: true },
        { text: " It is a symbol of compassion, dignity, and hope for a brighter tomorrow." },
      ],
      [
        { text: "🤲 Be the reason someone eats today.", strong: true },
        { text: " Whether you give once or monthly, your generosity can make a meaningful difference." },
      ],
      [{ text: "Donate today and help bring hope to families in Gaza. ❤️🇵🇸", strong: true }],
    ],
  },
  fr: {
    title: "❤️ Aidez à nourrir les familles à Gaza, en Palestine 🇵🇸",
    storyEyebrow: "Pourquoi c’est important",
    storyHeading: "❤️ Aidez à nourrir les familles à Gaza, en Palestine 🇵🇸",
    paragraphs: [
      [{ text: "Votre générosité peut apporter de la nourriture, de l’espoir et du réconfort aux familles dans le besoin.", strong: true }],
      [{ text: "Chaque jour, les familles à Gaza font face au défi de trouver suffisamment de nourriture pour leurs proches. Votre don généreux peut aider à fournir des repas chauds, une alimentation essentielle et un soulagement indispensable." }],
      [
        { text: "❤️ Chaque repas compte.", strong: true },
        { text: " Votre soutien peut apporter du réconfort aux enfants, aux parents et aux familles qui traversent des moments difficiles." },
      ],
      [
        { text: "🍽️ Un repas est bien plus que de la nourriture.", strong: true },
        { text: " C’est un symbole de compassion, de dignité et d’espoir pour un avenir meilleur." },
      ],
      [
        { text: "🤲 Soyez la raison pour laquelle quelqu’un mange aujourd’hui.", strong: true },
        { text: " Que vous donniez une fois ou chaque mois, votre générosité peut faire une réelle différence." },
      ],
      [{ text: "Faites un don aujourd’hui et aidez à redonner espoir aux familles à Gaza. ❤️🇵🇸", strong: true }],
    ],
  },
  de: {
    title: "❤️ Helfen Sie, Familien in Gaza, Palästina zu ernähren 🇵🇸",
    storyEyebrow: "Warum das wichtig ist",
    storyHeading: "❤️ Helfen Sie, Familien in Gaza, Palästina zu ernähren 🇵🇸",
    paragraphs: [
      [{ text: "Ihre Güte kann Familien in Not Nahrung, Hoffnung und Trost spenden.", strong: true }],
      [{ text: "Jeden Tag stehen Familien in Gaza vor der Herausforderung, genügend Nahrung für ihre Angehörigen zu finden. Ihre großzügige Spende kann helfen, warme Mahlzeiten, wichtige Nährstoffe und dringend benötigte Hilfe bereitzustellen." }],
      [
        { text: "❤️ Jede Mahlzeit zählt.", strong: true },
        { text: " Ihre Unterstützung kann Kindern, Eltern und Familien in schweren Zeiten Trost spenden." },
      ],
      [
        { text: "🍽️ Eine Mahlzeit ist mehr als nur Essen.", strong: true },
        { text: " Sie ist ein Zeichen für Mitgefühl, Würde und Hoffnung auf eine bessere Zukunft." },
      ],
      [
        { text: "🤲 Seien Sie der Grund, warum heute jemand zu essen hat.", strong: true },
        { text: " Ob einmalig oder monatlich – Ihre Großzügigkeit kann einen bedeutsamen Unterschied machen." },
      ],
      [{ text: "Spenden Sie heute und schenken Sie Familien in Gaza Hoffnung. ❤️🇵🇸", strong: true }],
    ],
  },
  es: {
    title: "❤️ Ayuda a alimentar a las familias en Gaza, Palestina 🇵🇸",
    storyEyebrow: "Por qué es importante",
    storyHeading: "❤️ Ayuda a alimentar a las familias en Gaza, Palestina 🇵🇸",
    paragraphs: [
      [{ text: "Tu bondad puede llevar alimento, esperanza y consuelo a las familias necesitadas.", strong: true }],
      [{ text: "Cada día, las familias en Gaza enfrentan el desafío de encontrar suficiente comida para sus seres queridos. Tu generosa donación puede ayudar a proporcionar comidas calientes, nutrición esencial y un alivio muy necesario." }],
      [
        { text: "❤️ Cada comida importa.", strong: true },
        { text: " Tu apoyo puede brindar consuelo a niños, padres y familias que atraviesan momentos difíciles." },
      ],
      [
        { text: "🍽️ Una comida es más que alimento.", strong: true },
        { text: " Es un símbolo de compasión, dignidad y esperanza en un mañana mejor." },
      ],
      [
        { text: "🤲 Sé la razón por la que alguien coma hoy.", strong: true },
        { text: " Ya sea que dones una vez o mensualmente, tu generosidad puede marcar una diferencia significativa." },
      ],
      [{ text: "Dona hoy y ayuda a llevar esperanza a las familias en Gaza. ❤️🇵🇸", strong: true }],
    ],
  },
  ar: {
    title: "❤️ ساعد في إطعام العائلات في غزة، فلسطين 🇵🇸",
    storyEyebrow: "لماذا يهم هذا الأمر",
    storyHeading: "❤️ ساعد في إطعام العائلات في غزة، فلسطين 🇵🇸",
    paragraphs: [
      [{ text: "يمكن لعطائك أن يجلب الغذاء والأمل والراحة للعائلات المحتاجة.", strong: true }],
      [{ text: "في كل يوم، تواجه العائلات في غزة تحدي العثور على ما يكفي من الطعام لأحبائها. يمكن لتبرعك السخي أن يساعد في توفير وجبات دافئة وتغذية أساسية وإغاثة هم في أمسّ الحاجة إليها." }],
      [
        { text: "❤️ كل وجبة تصنع فرقًا.", strong: true },
        { text: " يمكن لدعمك أن يمنح الطمأنينة للأطفال والآباء والعائلات التي تمر بأوقات عصيبة." },
      ],
      [
        { text: "🍽️ الوجبة أكثر من مجرد طعام.", strong: true },
        { text: " إنها رمز للتراحم والكرامة والأمل في غدٍ أفضل." },
      ],
      [
        { text: "🤲 كن سببًا في إطعام شخص اليوم.", strong: true },
        { text: " سواء تبرعت مرة واحدة أو شهريًا، فإن كرمك يمكن أن يُحدث فرقًا حقيقيًا." },
      ],
      [{ text: "تبرع اليوم وساعد في منح الأمل للعائلات في غزة. ❤️🇵🇸", strong: true }],
    ],
  },
};

function paragraphsToPlainText(paragraphs: HelpGazaSpan[][]): string {
  return paragraphs.map(spans => spans.map(span => span.text).join("")).join("\n\n");
}

function storyBlocks(paragraphs: HelpGazaSpan[][]): PortableTextBlock[] {
  return paragraphs.map((spans, blockIndex) => ({
    _type: "block",
    _key: `help-gaza-story-${blockIndex}`,
    style: "normal",
    markDefs: [],
    children: spans.map((span, spanIndex) => ({
      _type: "span",
      _key: `help-gaza-span-${blockIndex}-${spanIndex}`,
      text: span.text,
      marks: span.strong ? ["strong"] : [],
    })),
  }));
}

export function localizeHelpGazaCampaign(content: SanityCampaign, locale: Locale): SanityCampaign {
  const translatedText = (select: (value: HelpGazaCopy) => string) =>
    Object.fromEntries(locales.map(language => [language, select(copy[language])]));

  return localizeCampaign({
    ...content,
    organizationName: "MEAL SUPPORT INC",
    title: copy.en.title,
    titleI18n: translatedText(value => value.title),
    eyebrow: "",
    eyebrowI18n: translatedText(() => ""),
    summary: paragraphsToPlainText(copy.en.paragraphs),
    summaryI18n: translatedText(value => paragraphsToPlainText(value.paragraphs)),
    storyEyebrow: copy.en.storyEyebrow,
    storyEyebrowI18n: translatedText(value => value.storyEyebrow),
    storyHeading: copy.en.storyHeading,
    storyHeadingI18n: translatedText(value => value.storyHeading),
    story: storyBlocks(copy.en.paragraphs),
    storyI18n: Object.fromEntries(locales.map(language => [language, storyBlocks(copy[language].paragraphs)])),
    heroImage: {
      asset: {
        _id: "help-gaza-hero",
        url: "/help-gaza.jpg",
        metadata: { dimensions: { width: 1024, height: 576, aspectRatio: 1024 / 576 } },
      },
      alt: copy[locale].title,
    },
    seoTitle: copy.en.title,
    seoTitleI18n: translatedText(value => value.title),
    seoDescription: copy.en.paragraphs[1].map(span => span.text).join(""),
    seoDescriptionI18n: translatedText(value => value.paragraphs[1].map(span => span.text).join("")),
  }, locale);
}
