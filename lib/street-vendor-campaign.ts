import type { PortableTextBlock } from "@portabletext/react";
import { locales, type Locale } from "@/lib/i18n";
import { localizeCampaign } from "@/lib/localize-campaign";
import type { SanityCampaign } from "@/sanity/types/campaign";

export const STREET_VENDOR_SLUG = "help-street-vendor";
export const STREET_VENDOR_GOAL_USD_CENTS = 250_000;

type StreetVendorCopy = {
  title: string;
  paragraphs: [string, string, string];
  storyEyebrow: string;
  storyHeading: string;
  fundTitle: string;
  fundSubtitle: string;
  fundItems: [string, string][];
};

// Initial draft uses only the supplied headline's facts. A verified biography,
// medical needs and a monthly support target have not been supplied.
const copy: Record<Locale, StreetVendorCopy> = {
  en: {
    title: "❤️ He Works Hard Every Day to Support His Family. Now It’s Our Turn to Help Him.",
    paragraphs: [
      "He works hard every day to support his family. Now, we have an opportunity to stand beside him and offer our support.",
      "Meal Support Inc is bringing people together to help him and his family. Your kindness can make a difference.",
      "❤️ Give once or become a monthly supporter to help him and his family look toward the future with hope.",
    ],
    storyEyebrow: "THE STORY BEHIND OUR MISSION",
    storyHeading: "Why He Deserves Our Support ❤️",
    fundTitle: "How Your Donation Will Help",
    fundSubtitle: "Your kindness can support him and his family.",
    fundItems: [
      ["❤️ Support for His Family", "Contribute to support for him and his family."],
      ["🤝 Ongoing Support", "Choose a monthly gift to continue your support over time."],
    ],
  },
  fr: {
    title: "❤️ Il travaille dur chaque jour pour faire vivre sa famille. À notre tour de l’aider.",
    paragraphs: [
      "Il travaille dur chaque jour pour faire vivre sa famille. Aujourd’hui, nous pouvons être à ses côtés et lui apporter notre soutien.",
      "Meal Support Inc rassemble des personnes pour l’aider, lui et sa famille. Votre générosité peut faire la différence.",
      "❤️ Faites un don ponctuel ou devenez un soutien mensuel pour l’aider, lui et sa famille, à envisager l’avenir avec espoir.",
    ],
    storyEyebrow: "L’HISTOIRE DERRIÈRE NOTRE MISSION",
    storyHeading: "Pourquoi il mérite notre soutien ❤️",
    fundTitle: "Comment votre don aidera",
    fundSubtitle: "Votre générosité peut le soutenir, lui et sa famille.",
    fundItems: [
      ["❤️ Soutien à sa famille", "Contribuez au soutien de cet homme et de sa famille."],
      ["🤝 Un soutien dans la durée", "Choisissez un don mensuel pour poursuivre votre soutien au fil du temps."],
    ],
  },
  de: {
    title: "❤️ Er arbeitet jeden Tag hart, um seine Familie zu versorgen. Jetzt sind wir an der Reihe, ihm zu helfen.",
    paragraphs: [
      "Er arbeitet jeden Tag hart, um seine Familie zu versorgen. Jetzt haben wir die Gelegenheit, ihm zur Seite zu stehen und ihn zu unterstützen.",
      "Meal Support Inc bringt Menschen zusammen, um ihm und seiner Familie zu helfen. Ihre Großzügigkeit kann etwas bewirken.",
      "❤️ Spenden Sie einmalig oder unterstützen Sie ihn monatlich, damit er und seine Familie hoffnungsvoll in die Zukunft blicken können.",
    ],
    storyEyebrow: "DIE GESCHICHTE HINTER UNSERER MISSION",
    storyHeading: "Warum er unsere Unterstützung verdient ❤️",
    fundTitle: "So hilft Ihre Spende",
    fundSubtitle: "Ihre Großzügigkeit kann ihn und seine Familie unterstützen.",
    fundItems: [
      ["❤️ Unterstützung für seine Familie", "Tragen Sie zur Unterstützung dieses Mannes und seiner Familie bei."],
      ["🤝 Dauerhafte Unterstützung", "Wählen Sie eine monatliche Spende, um Ihre Unterstützung fortzusetzen."],
    ],
  },
  es: {
    title: "❤️ Trabaja duro cada día para mantener a su familia. Ahora nos toca ayudarlo a él.",
    paragraphs: [
      "Trabaja duro cada día para mantener a su familia. Ahora tenemos la oportunidad de acompañarlo y ofrecerle nuestro apoyo.",
      "Meal Support Inc reúne a personas para ayudarlo a él y a su familia. Tu generosidad puede marcar la diferencia.",
      "❤️ Haz una donación única o conviértete en colaborador mensual para ayudarlo a él y a su familia a mirar al futuro con esperanza.",
    ],
    storyEyebrow: "LA HISTORIA DETRÁS DE NUESTRA MISIÓN",
    storyHeading: "Por qué merece nuestro apoyo ❤️",
    fundTitle: "Cómo ayudará tu donación",
    fundSubtitle: "Tu generosidad puede apoyarlo a él y a su familia.",
    fundItems: [
      ["❤️ Apoyo para su familia", "Contribuye al apoyo de este hombre y de su familia."],
      ["🤝 Apoyo continuo", "Elige una donación mensual para mantener tu apoyo a lo largo del tiempo."],
    ],
  },
  ar: {
    title: "❤️ يعمل بجد كل يوم لإعالة أسرته. والآن حان دورنا لمساعدته.",
    paragraphs: [
      "يعمل بجد كل يوم لإعالة أسرته. واليوم، لدينا فرصة للوقوف إلى جانبه وتقديم دعمنا له.",
      "تجمع Meal Support Inc الناس لمساعدته هو وأسرته. يمكن لكرمك أن يُحدث فرقًا.",
      "❤️ تبرع لمرة واحدة أو كن داعمًا شهريًا لمساعدته هو وأسرته على التطلع إلى المستقبل بأمل.",
    ],
    storyEyebrow: "القصة وراء رسالتنا",
    storyHeading: "لماذا يستحق دعمنا ❤️",
    fundTitle: "كيف سيساعد تبرعك",
    fundSubtitle: "يمكن لكرمك أن يدعمه هو وأسرته.",
    fundItems: [
      ["❤️ دعم أسرته", "ساهم في دعم هذا الرجل وأسرته."],
      ["🤝 دعم مستمر", "اختر تبرعًا شهريًا لمواصلة دعمك مع مرور الوقت."],
    ],
  },
};

function storyBlocks(paragraphs: string[]): PortableTextBlock[] {
  return paragraphs.map((text, index) => ({
    _type: "block", _key: `street-vendor-story-${index}`, style: "normal", markDefs: [],
    children: [{ _type: "span", _key: `street-vendor-text-${index}`, text, marks: [] }],
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
