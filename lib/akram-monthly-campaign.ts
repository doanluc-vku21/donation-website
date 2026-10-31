import type { PortableTextBlock } from "@portabletext/react";
import { locales, type Locale } from "@/lib/i18n";
import { localizeCampaign } from "@/lib/localize-campaign";
import type { SanityCampaign } from "@/sanity/types/campaign";

type AkramMonthlyCopy = {
  title: string;
  storyEyebrow: string;
  storyHeading: string;
  story: string[];
  fundTitle: string;
  fundIntro: string;
  fundItems: [string, string][];
  fundClosing: string;
  fundCallToAction: string;
};

const copy: Record<Locale, AkramMonthlyCopy> = {
  en: {
    title: "❤️ Help More People Like Akram Build a Better Future",
    storyEyebrow: "Why this matters",
    storyHeading: "❤️ Together, We Can Help More People Like Akram",
    story: [
      "Akram's story is just one of many. Every day, countless people living with disabilities, serious injuries, and life-changing medical conditions struggle to afford food, medical care, and the basic necessities of life.",
      "Many are unable to work, support their families, or live independently. Behind every struggle is a person with dreams, hopes, and loved ones depending on them.",
      "At **Meal Support Inc**, our mission goes beyond helping just one person. We want to reach many more people like Akram who deserve care, dignity, and a chance for a better future.",
      "❤️ Your Monthly Support Makes a Difference",
      "By becoming a monthly supporter, you can help us provide ongoing assistance and reach more individuals and families facing similar hardships.",
      "Even **$25 a month** can make a meaningful difference. Your continued kindness helps us plan ahead, respond to urgent needs, and support more people month after month.",
      "🙏 One Person's Story Can Inspire Us. Together, We Can Change Many Lives.",
      "Become a monthly supporter today and join our growing community of compassionate people who believe everyone deserves hope, care, and a better tomorrow.",
      "**❤️ Give Monthly. Help More Lives. Make a Lasting Difference.**",
    ],
    fundTitle: "❤️ How the Funds Will Be Used",
    fundIntro: "At Meal Support Inc, our mission goes beyond helping just one person. We aim to bring hope, care, and essential support to many more people like Akram who are living with disabilities, serious injuries, and life-changing medical conditions.\n\nYour generous monthly contributions will help us provide:",
    fundItems: [
      ["❤️ Food & Daily Essentials", "Helping people who struggle to afford nutritious meals and basic necessities."],
      ["🏥 Medical Care & Treatment", "Supporting access to essential medications, medical treatment, and rehabilitation services."],
      ["🤝 Disability & Family Support", "Assisting individuals who are unable to work or provide for their families due to physical disabilities or serious health challenges."],
      ["🌍 Long-Term Assistance", "Helping us plan sustainable support and reach more people facing similar hardships, month after month."],
    ],
    fundClosing: "Your monthly gift isn't just about helping one person. It's about creating lasting hope for many people who need kindness, dignity, and a chance for a better future.",
    fundCallToAction: "🙏 Together, we can change more lives, one month at a time. ❤️",
  },
  fr: {
    title: "❤️ Aidez davantage de personnes comme Akram à bâtir un avenir meilleur",
    storyEyebrow: "Pourquoi c’est important",
    storyHeading: "❤️ Ensemble, nous pouvons aider davantage de personnes comme Akram",
    story: [
      "L’histoire d’Akram n’est qu’une histoire parmi tant d’autres. Chaque jour, d’innombrables personnes en situation de handicap, gravement blessées ou atteintes de maladies qui bouleversent leur vie peinent à financer leur alimentation, leurs soins médicaux et leurs besoins essentiels.",
      "Beaucoup ne peuvent pas travailler, subvenir aux besoins de leur famille ou vivre de manière autonome. Derrière chaque difficulté se trouve une personne qui a des rêves, des espoirs et des proches qui comptent sur elle.",
      "Chez **Meal Support Inc**, notre mission va au-delà de l’aide à une seule personne. Nous voulons soutenir bien d’autres personnes comme Akram, qui méritent des soins, de la dignité et la possibilité d’un avenir meilleur.",
      "❤️ Votre soutien mensuel fait la différence",
      "En devenant un soutien mensuel, vous nous aidez à fournir une aide continue et à accompagner davantage de personnes et de familles confrontées à des difficultés similaires.",
      "Même **25 $ par mois** peuvent faire une réelle différence. Votre générosité régulière nous aide à anticiper, à répondre aux urgences et à soutenir davantage de personnes, mois après mois.",
      "🙏 L’histoire d’une personne peut nous inspirer. Ensemble, nous pouvons changer de nombreuses vies.",
      "Devenez un soutien mensuel dès aujourd’hui et rejoignez notre communauté grandissante de personnes solidaires qui croient que chacun mérite espoir, soins et un avenir meilleur.",
      "**❤️ Donnez chaque mois. Aidez davantage de personnes. Faites une différence durable.**",
    ],
    fundTitle: "❤️ Comment les fonds seront utilisés",
    fundIntro: "Chez Meal Support Inc, notre mission va au-delà de l’aide à une seule personne. Nous voulons apporter espoir, soins et soutien essentiel à bien d’autres personnes comme Akram, en situation de handicap, gravement blessées ou atteintes de maladies qui bouleversent leur vie.\n\nVos généreux dons mensuels contribueront à fournir :",
    fundItems: [
      ["❤️ Alimentation et besoins quotidiens", "Aider les personnes qui peinent à financer des repas nutritifs et les produits de première nécessité."],
      ["🏥 Soins et traitements médicaux", "Faciliter l’accès aux médicaments essentiels, aux traitements médicaux et aux services de rééducation."],
      ["🤝 Soutien aux personnes handicapées et à leur famille", "Accompagner les personnes qui ne peuvent pas travailler ou subvenir aux besoins de leur famille en raison d’un handicap physique ou de graves problèmes de santé."],
      ["🌍 Aide à long terme", "Nous aider à planifier un soutien durable et à accompagner davantage de personnes confrontées à des difficultés similaires, mois après mois."],
    ],
    fundClosing: "Votre don mensuel ne se limite pas à aider une personne. Il contribue à créer un espoir durable pour de nombreuses personnes qui ont besoin de bienveillance, de dignité et d’une chance de vivre un avenir meilleur.",
    fundCallToAction: "🙏 Ensemble, nous pouvons changer davantage de vies, un mois à la fois. ❤️",
  },
  de: {
    title: "❤️ Helfen Sie mehr Menschen wie Akram, eine bessere Zukunft aufzubauen",
    storyEyebrow: "Warum das wichtig ist",
    storyHeading: "❤️ Gemeinsam können wir mehr Menschen wie Akram helfen",
    story: [
      "Akrams Geschichte ist nur eine von vielen. Jeden Tag kämpfen unzählige Menschen mit Behinderungen, schweren Verletzungen und lebensverändernden Erkrankungen darum, Nahrung, medizinische Versorgung und die grundlegenden Dinge des Lebens bezahlen zu können.",
      "Viele können nicht arbeiten, ihre Familien versorgen oder selbstständig leben. Hinter jedem Schicksal steht ein Mensch mit Träumen, Hoffnungen und Angehörigen, die auf ihn angewiesen sind.",
      "Bei **Meal Support Inc** geht unsere Mission über die Hilfe für einen einzelnen Menschen hinaus. Wir möchten viele weitere Menschen wie Akram erreichen, die Fürsorge, Würde und die Chance auf eine bessere Zukunft verdienen.",
      "❤️ Ihre monatliche Unterstützung macht einen Unterschied",
      "Mit einer monatlichen Spende helfen Sie uns, dauerhaft Unterstützung zu leisten und mehr Menschen und Familien in ähnlichen Notlagen zu erreichen.",
      "Schon **25 US-Dollar im Monat** können viel bewirken. Ihre anhaltende Großzügigkeit hilft uns, vorauszuplanen, auf dringende Bedürfnisse zu reagieren und Monat für Monat mehr Menschen zu unterstützen.",
      "🙏 Die Geschichte eines Menschen kann uns inspirieren. Gemeinsam können wir viele Leben verändern.",
      "Werden Sie noch heute monatlicher Unterstützer und schließen Sie sich unserer wachsenden Gemeinschaft mitfühlender Menschen an, die daran glauben, dass jeder Hoffnung, Fürsorge und eine bessere Zukunft verdient.",
      "**❤️ Spenden Sie monatlich. Helfen Sie mehr Menschen. Bewirken Sie dauerhaft etwas.**",
    ],
    fundTitle: "❤️ So werden die Mittel verwendet",
    fundIntro: "Bei Meal Support Inc geht unsere Mission über die Hilfe für einen einzelnen Menschen hinaus. Wir möchten vielen weiteren Menschen wie Akram, die mit Behinderungen, schweren Verletzungen und lebensverändernden Erkrankungen leben, Hoffnung, Fürsorge und grundlegende Unterstützung geben.\n\nIhre großzügigen monatlichen Spenden helfen uns bei:",
    fundItems: [
      ["❤️ Nahrung und Dinge des täglichen Bedarfs", "Hilfe für Menschen, die sich nahrhafte Mahlzeiten und grundlegende Dinge des Lebens kaum leisten können."],
      ["🏥 Medizinische Versorgung und Behandlung", "Unterstützung beim Zugang zu wichtigen Medikamenten, medizinischer Behandlung und Rehabilitation."],
      ["🤝 Unterstützung bei Behinderung und für Familien", "Hilfe für Menschen, die aufgrund körperlicher Behinderungen oder schwerer gesundheitlicher Probleme nicht arbeiten oder ihre Familien versorgen können."],
      ["🌍 Langfristige Hilfe", "Planung nachhaltiger Unterstützung, um Monat für Monat mehr Menschen in ähnlichen Notlagen zu erreichen."],
    ],
    fundClosing: "Ihre monatliche Spende hilft nicht nur einem Menschen. Sie schafft dauerhafte Hoffnung für viele Menschen, die Mitgefühl, Würde und die Chance auf eine bessere Zukunft brauchen.",
    fundCallToAction: "🙏 Gemeinsam können wir mehr Leben verändern, Monat für Monat. ❤️",
  },
  es: {
    title: "❤️ Ayuda a más personas como Akram a construir un futuro mejor",
    storyEyebrow: "Por qué es importante",
    storyHeading: "❤️ Juntos podemos ayudar a más personas como Akram",
    story: [
      "La historia de Akram es solo una entre muchas. Cada día, innumerables personas con discapacidades, lesiones graves y enfermedades que transforman sus vidas luchan por pagar alimentos, atención médica y las necesidades básicas de la vida.",
      "Muchas no pueden trabajar, mantener a sus familias o vivir de forma independiente. Detrás de cada dificultad hay una persona con sueños, esperanzas y seres queridos que dependen de ella.",
      "En **Meal Support Inc**, nuestra misión va más allá de ayudar a una sola persona. Queremos llegar a muchas más personas como Akram, que merecen cuidados, dignidad y la oportunidad de un futuro mejor.",
      "❤️ Tu apoyo mensual marca la diferencia",
      "Al convertirte en colaborador mensual, puedes ayudarnos a ofrecer asistencia continua y a llegar a más personas y familias que afrontan dificultades similares.",
      "Incluso **25 dólares al mes** pueden marcar una diferencia significativa. Tu generosidad constante nos ayuda a planificar, responder a necesidades urgentes y apoyar a más personas mes tras mes.",
      "🙏 La historia de una persona puede inspirarnos. Juntos podemos cambiar muchas vidas.",
      "Conviértete hoy en colaborador mensual y únete a nuestra creciente comunidad de personas solidarias que creen que todos merecen esperanza, cuidados y un mañana mejor.",
      "**❤️ Dona cada mes. Ayuda a más personas. Crea un impacto duradero.**",
    ],
    fundTitle: "❤️ Cómo se utilizarán los fondos",
    fundIntro: "En Meal Support Inc, nuestra misión va más allá de ayudar a una sola persona. Queremos llevar esperanza, cuidados y apoyo esencial a muchas más personas como Akram que viven con discapacidades, lesiones graves y enfermedades que transforman sus vidas.\n\nTus generosas contribuciones mensuales nos ayudarán a proporcionar:",
    fundItems: [
      ["❤️ Alimentos y necesidades diarias", "Ayuda para quienes tienen dificultades para pagar comidas nutritivas y productos de primera necesidad."],
      ["🏥 Atención y tratamiento médico", "Apoyo al acceso a medicamentos esenciales, tratamientos médicos y servicios de rehabilitación."],
      ["🤝 Apoyo a personas con discapacidad y sus familias", "Asistencia para quienes no pueden trabajar o mantener a sus familias debido a discapacidades físicas o problemas graves de salud."],
      ["🌍 Ayuda a largo plazo", "Planificación de un apoyo sostenible para llegar a más personas que afrontan dificultades similares, mes tras mes."],
    ],
    fundClosing: "Tu donación mensual no se limita a ayudar a una persona. Crea una esperanza duradera para muchas personas que necesitan bondad, dignidad y la oportunidad de un futuro mejor.",
    fundCallToAction: "🙏 Juntos podemos cambiar más vidas, un mes a la vez. ❤️",
  },
  ar: {
    title: "❤️ ساعد المزيد من الأشخاص مثل أكرم على بناء مستقبل أفضل",
    storyEyebrow: "لماذا يهم هذا الأمر",
    storyHeading: "❤️ معًا، يمكننا مساعدة المزيد من الأشخاص مثل أكرم",
    story: [
      "قصة أكرم ليست سوى واحدة من قصص كثيرة. كل يوم، يكافح عدد لا يحصى من الأشخاص ذوي الإعاقة والمصابين بإصابات خطيرة وحالات طبية تغيّر حياتهم لتأمين الغذاء والرعاية الطبية وضروريات الحياة الأساسية.",
      "لا يستطيع كثيرون العمل أو إعالة أسرهم أو العيش باستقلالية. وخلف كل معاناة إنسان لديه أحلام وآمال وأحباء يعتمدون عليه.",
      "في **Meal Support Inc**، تتجاوز رسالتنا مساعدة شخص واحد. نريد الوصول إلى المزيد من الأشخاص مثل أكرم، ممن يستحقون الرعاية والكرامة وفرصة لمستقبل أفضل.",
      "❤️ دعمك الشهري يُحدث فرقًا",
      "عندما تصبح داعمًا شهريًا، يمكنك مساعدتنا على تقديم دعم مستمر والوصول إلى المزيد من الأفراد والأسر الذين يواجهون صعوبات مماثلة.",
      "حتى **25 دولارًا شهريًا** يمكن أن تُحدث فرقًا حقيقيًا. يساعدنا عطاؤك المستمر على التخطيط المسبق والاستجابة للاحتياجات العاجلة ودعم المزيد من الأشخاص شهرًا بعد شهر.",
      "🙏 قد تلهمنا قصة شخص واحد. ومعًا، يمكننا تغيير حياة الكثيرين.",
      "كن داعمًا شهريًا اليوم وانضم إلى مجتمعنا المتنامي من الأشخاص المتعاطفين الذين يؤمنون بأن الجميع يستحق الأمل والرعاية وغدًا أفضل.",
      "**❤️ تبرّع شهريًا. ساعد المزيد من الناس. واصنع أثرًا يدوم.**",
    ],
    fundTitle: "❤️ كيف ستُستخدم الأموال",
    fundIntro: "في Meal Support Inc، تتجاوز رسالتنا مساعدة شخص واحد. نسعى إلى منح الأمل والرعاية والدعم الأساسي للمزيد من الأشخاص مثل أكرم، ممن يعيشون مع إعاقات أو إصابات خطيرة أو حالات طبية تغيّر حياتهم.\n\nستساعدنا مساهماتكم الشهرية السخية على توفير:",
    fundItems: [
      ["❤️ الغذاء والضروريات اليومية", "مساعدة الأشخاص الذين يجدون صعوبة في تأمين الوجبات المغذية والاحتياجات الأساسية."],
      ["🏥 الرعاية والعلاج الطبي", "دعم الوصول إلى الأدوية الأساسية والعلاج الطبي وخدمات إعادة التأهيل."],
      ["🤝 دعم ذوي الإعاقة والأسر", "مساندة الأفراد غير القادرين على العمل أو إعالة أسرهم بسبب إعاقات جسدية أو تحديات صحية خطيرة."],
      ["🌍 المساعدة طويلة الأمد", "مساعدتنا على التخطيط لدعم مستدام والوصول إلى المزيد من الأشخاص الذين يواجهون صعوبات مماثلة، شهرًا بعد شهر."],
    ],
    fundClosing: "عطاؤك الشهري لا يقتصر على مساعدة شخص واحد. إنه يصنع أملًا يدوم للكثيرين ممن يحتاجون إلى الرحمة والكرامة وفرصة لمستقبل أفضل.",
    fundCallToAction: "🙏 معًا، يمكننا تغيير حياة المزيد من الناس، شهرًا بعد شهر. ❤️",
  },
};

function storyBlocks(paragraphs: string[]): PortableTextBlock[] {
  return paragraphs.map((text, index) => ({
    _type: "block", _key: `akram-story-${index}`, style: index === 3 || index === 6 ? "h3" : "normal", markDefs: [],
    children: text.split(/(\*\*.*?\*\*)/g).filter(Boolean).map((part, span) => ({
      _type: "span", _key: `span-${span}`,
      text: part.startsWith("**") ? part.slice(2, -2) : part,
      marks: part.startsWith("**") ? ["strong"] : [],
    })),
  }));
}

// This copy belongs only to /akram-shake-3. The original campaign and Gaza
// entry pages continue using their existing CMS/page-specific content.
export function localizeAkramMonthlyCampaign(content: SanityCampaign, locale: Locale): SanityCampaign {
  const titleI18n = Object.fromEntries(locales.map((language) => [language, copy[language].title]));
  const summaryI18n = Object.fromEntries(locales.map((language) => [language, copy[language].story[0]]));
  const selected = copy[locale];
  return localizeCampaign({
    ...content, titleI18n, summaryI18n, seoTitleI18n: titleI18n, seoDescriptionI18n: summaryI18n,
    storyEyebrowI18n: Object.fromEntries(locales.map((language) => [language, copy[language].storyEyebrow])),
    storyHeadingI18n: Object.fromEntries(locales.map((language) => [language, copy[language].storyHeading])),
    storyI18n: Object.fromEntries(locales.map((language) => [language, storyBlocks(copy[language].story)])),
    fundUsageTitle: selected.fundTitle, fundUsageTitleI18n: {},
    fundUsageSubtitle: "", fundUsageSubtitleI18n: {},
    fundUsageItems: [
      { _key: "akram-fund-intro", itemType: "text", content: selected.fundIntro },
      ...selected.fundItems.map(([title, text], index) => ({
        _key: `akram-fund-${index}`, itemType: "text" as const, title, content: text,
      })),
      { _key: "akram-fund-closing", itemType: "text", title: selected.fundClosing, content: selected.fundCallToAction },
    ],
  }, locale);
}
