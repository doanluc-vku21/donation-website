import type { PortableTextBlock } from "@portabletext/react";
import { locales, type Locale } from "@/lib/i18n";
import { localizeCampaign } from "@/lib/localize-campaign";
import type { SanityCampaign } from "@/sanity/types/campaign";

export const STREET_VENDOR_SLUG = "help-street-vendor";
export const STREET_VENDOR_GOAL_USD_CENTS = 250_000;

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
    fundSubtitle: "Your kindness can support him and his family.",
    fundItems: [
      ["❤️ Support for His Family", "Contribute to support for him and his family."],
      ["🤝 Ongoing Support", "Choose a monthly gift to continue your support over time."],
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
    fundSubtitle: "Votre générosité peut le soutenir, lui et sa famille.",
    fundItems: [
      ["❤️ Soutien à sa famille", "Contribuez au soutien de cet homme et de sa famille."],
      ["🤝 Un soutien dans la durée", "Choisissez un don mensuel pour poursuivre votre soutien au fil du temps."],
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
    fundSubtitle: "Ihre Großzügigkeit kann ihn und seine Familie unterstützen.",
    fundItems: [
      ["❤️ Unterstützung für seine Familie", "Tragen Sie zur Unterstützung dieses Mannes und seiner Familie bei."],
      ["🤝 Dauerhafte Unterstützung", "Wählen Sie eine monatliche Spende, um Ihre Unterstützung fortzusetzen."],
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
    fundSubtitle: "Tu generosidad puede apoyarlo a él y a su familia.",
    fundItems: [
      ["❤️ Apoyo para su familia", "Contribuye al apoyo de este hombre y de su familia."],
      ["🤝 Apoyo continuo", "Elige una donación mensual para mantener tu apoyo a lo largo del tiempo."],
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
