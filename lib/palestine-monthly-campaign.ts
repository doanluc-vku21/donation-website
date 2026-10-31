import type { PortableTextBlock } from "@portabletext/react";
import { locales, type Locale } from "@/lib/i18n";
import { localizeCampaign } from "@/lib/localize-campaign";
import type { SanityCampaign } from "@/sanity/types/campaign";

type MonthlyCampaignCopy = {
  title: string;
  storyEyebrow: string;
  storyHeading: string;
  paragraphs: string[];
};

const copy: Record<Locale, MonthlyCampaignCopy> = {
  en: {
    title: "🇵🇸 ❤️ Bring Hope and Relief to Palestine",
    storyEyebrow: "Why this matters",
    storyHeading: "🇵🇸 ❤️ Every Life Matters. Every Act of Kindness Brings Hope.",
    paragraphs: [
      "Every day, countless people in Palestine struggle to survive without enough food, clean drinking water, medical treatment, and essential care.",
      "Children, elderly people, and those living with serious injuries face unimaginable hardships, uncertain of what tomorrow will bring.",
      "Your monthly kindness can help provide life-saving assistance, restore hope, and bring comfort to people who need it most.",
      "❤️ Just $25 a month can make a meaningful difference.",
      "Because helping one person matters. But together, we can help many more.",
      "🇵🇸 Become a monthly supporter today. Give hope. Change lives.",
    ],
  },
  fr: {
    title: "🇵🇸 ❤️ Apportez espoir et secours à la Palestine",
    storyEyebrow: "Pourquoi c’est important",
    storyHeading: "🇵🇸 ❤️ Chaque vie compte. Chaque geste de bonté apporte de l’espoir.",
    paragraphs: [
      "Chaque jour, d’innombrables personnes en Palestine luttent pour survivre sans suffisamment de nourriture, d’eau potable, de traitements médicaux et de soins essentiels.",
      "Les enfants, les personnes âgées et les personnes gravement blessées vivent des épreuves inimaginables, sans savoir ce que demain leur réserve.",
      "Votre générosité mensuelle peut contribuer à fournir une aide vitale, à redonner espoir et à apporter du réconfort aux personnes qui en ont le plus besoin.",
      "❤️ Seulement 25 $ par mois peuvent faire une réelle différence.",
      "Parce qu’aider une personne compte. Mais ensemble, nous pouvons en aider bien davantage.",
      "🇵🇸 Devenez un soutien mensuel dès aujourd’hui. Donnez de l’espoir. Changez des vies.",
    ],
  },
  de: {
    title: "🇵🇸 ❤️ Bringen Sie Hoffnung und Hilfe nach Palästina",
    storyEyebrow: "Warum das wichtig ist",
    storyHeading: "🇵🇸 ❤️ Jedes Leben zählt. Jede gute Tat schenkt Hoffnung.",
    paragraphs: [
      "Jeden Tag kämpfen unzählige Menschen in Palästina ums Überleben, ohne ausreichend Nahrung, sauberes Trinkwasser, medizinische Behandlung und grundlegende Versorgung.",
      "Kinder, ältere Menschen und Menschen mit schweren Verletzungen erleben unvorstellbare Not und wissen nicht, was der nächste Tag bringt.",
      "Ihre monatliche Unterstützung kann lebensrettende Hilfe ermöglichen, Hoffnung zurückgeben und den Menschen Trost spenden, die ihn am dringendsten brauchen.",
      "❤️ Schon 25 US-Dollar im Monat können viel bewirken.",
      "Denn einem Menschen zu helfen zählt. Gemeinsam können wir jedoch noch vielen mehr helfen.",
      "🇵🇸 Unterstützen Sie uns ab heute monatlich. Schenken Sie Hoffnung. Verändern Sie Leben.",
    ],
  },
  es: {
    title: "🇵🇸 ❤️ Lleva esperanza y ayuda a Palestina",
    storyEyebrow: "Por qué es importante",
    storyHeading: "🇵🇸 ❤️ Cada vida importa. Cada acto de bondad trae esperanza.",
    paragraphs: [
      "Cada día, innumerables personas en Palestina luchan por sobrevivir sin suficientes alimentos, agua potable, tratamiento médico y cuidados esenciales.",
      "Los niños, las personas mayores y quienes viven con lesiones graves afrontan dificultades inimaginables, sin saber qué les deparará el mañana.",
      "Tu generosidad mensual puede ayudar a proporcionar asistencia vital, devolver la esperanza y brindar consuelo a quienes más lo necesitan.",
      "❤️ Solo 25 dólares al mes pueden marcar una diferencia significativa.",
      "Porque ayudar a una persona importa. Pero juntos podemos ayudar a muchas más.",
      "🇵🇸 Conviértete hoy en colaborador mensual. Da esperanza. Cambia vidas.",
    ],
  },
  ar: {
    title: "🇵🇸 ❤️ امنح الأمل والإغاثة لفلسطين",
    storyEyebrow: "لماذا يهم هذا الأمر",
    storyHeading: "🇵🇸 ❤️ كل حياة مهمة. وكل عمل خير يمنح الأمل.",
    paragraphs: [
      "كل يوم، يكافح عدد لا يحصى من الناس في فلسطين للبقاء على قيد الحياة دون ما يكفي من الغذاء ومياه الشرب النظيفة والعلاج الطبي والرعاية الأساسية.",
      "يواجه الأطفال وكبار السن والمصابون بإصابات خطيرة صعوبات لا يمكن تصورها، ولا يعرفون ما الذي سيحمله الغد.",
      "يمكن لعطائك الشهري أن يساعد في توفير مساعدات تنقذ الأرواح، ويعيد الأمل، ويمنح الراحة لمن هم في أمسّ الحاجة إليها.",
      "❤️ يمكن لمبلغ 25 دولارًا فقط شهريًا أن يُحدث فرقًا حقيقيًا.",
      "لأن مساعدة شخص واحد أمر مهم. ولكن معًا، يمكننا مساعدة الكثيرين.",
      "🇵🇸 كن داعمًا شهريًا اليوم. امنح الأمل. غيّر حياة الناس.",
    ],
  },
};

function storyBlocks(paragraphs: string[]): PortableTextBlock[] {
  return paragraphs.map((text, index) => ({
    _type: "block",
    _key: `monthly-story-${index}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `text-${index}`, text, marks: index === 3 ? ["strong"] : [] }],
  }));
}

// Override these entry pages in code without mutating the shared CMS document.
// Keep the normal localization mechanism so existing English translations
// cannot take precedence over the requested copy.
export function localizePalestineMonthlyCampaign(content: SanityCampaign, locale: Locale): SanityCampaign {
  const titleI18n = Object.fromEntries(locales.map((language) => [language, copy[language].title]));
  const summaryI18n = Object.fromEntries(locales.map((language) => [language, copy[language].paragraphs[0]]));

  return localizeCampaign({
    ...content,
    titleI18n,
    summaryI18n,
    seoTitleI18n: titleI18n,
    seoDescriptionI18n: summaryI18n,
    storyEyebrowI18n: Object.fromEntries(locales.map((language) => [language, copy[language].storyEyebrow])),
    storyHeadingI18n: Object.fromEntries(locales.map((language) => [language, copy[language].storyHeading])),
    storyI18n: Object.fromEntries(locales.map((language) => [language, storyBlocks(copy[language].paragraphs)])),
  }, locale);
}
