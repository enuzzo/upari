import { num } from './format';
import type { Dict } from './it';

// العربية.
// Counted nouns follow Arabic agreement: one, two (dual), 3–10 (plural), 11–99 (accusative
// singular), 100 and up (singular). Values arrive formatted with Western digits (ar-u-nu-latn),
// so a formatted count can be read back to choose the form.

const PR = new Intl.PluralRules('ar');
/** [one, two, few (3–10), many (11–99), other (0, 100…)]: one and two are whole phrases, the rest follow the number. */
type Forms = [string, string, string, string, string];
const count = (n: number, s: string, f: Forms) => {
  const k = Number.isFinite(n) ? PR.select(n) : 'other';
  return k === 'one' ? f[0] : k === 'two' ? f[1] : `${s} ${k === 'few' ? f[2] : k === 'many' ? f[3] : f[4]}`;
};
/** A number formatted for the page ("1,234.5") back to a number. */
const read = (s: string) => Number(s.replace(/[^\d.]/g, ''));
/** Counts that arrive formatted: integers agree, decimals take the singular. */
const counted = (s: string, f: Forms) => {
  const n = read(s);
  return Number.isInteger(n) ? count(n, s, f) : `${s} ${f[4]}`;
};
const million = (s: string) => counted(s, [`${s} مليون`, `${s} مليون`, 'ملايين', 'مليون', 'مليون']);
const billion = (s: string) => counted(s, [`${s} مليار`, `${s} مليار`, 'مليارات', 'مليار', 'مليار']);
const km = (s: string) => counted(s, ['كيلومتر واحد', 'كيلومترين', 'كيلومترات', 'كيلومترًا', 'كيلومتر']);
const minutes = (s: string) => counted(s, ['دقيقة واحدة', 'دقيقتين', 'دقائق', 'دقيقة', 'دقيقة']);
/** A signed or symbol-led value kept left to right inside a right-to-left line (+3 °C, ≈ 50%). */
const ltr = (s: string) => `⁦${s}⁩`;

const WDI_NOTE = 'قيم سنوية أصلية، بلا تقديرات يضيفها Upari: البلد الذي لا تتوفر له قيمة في سنة ما يبقى رماديًا. الألوان تنساب من سنة إلى التي تليها؛ أما الأرقام فلا. الحدود هي حدود Natural Earth الحالية، لا حدود تلك الحقبة.';

const ar: Dict = {
  lang: { name: 'العربية', locale: 'ar-u-nu-latn', dir: 'rtl' },

  page: {
    title: 'Upari · الكوكب، الآن',
    description: 'كوكب الأرض كما ترويه بيانات الأقمار الصناعية اليوم: الرياح والتيارات والبحار والمطر والنيران والجليد والأضواء، ومحطة الفضاء الدولية. هذا هو Upari.',
    globe: 'كرة الأرض',
    home: 'العودة إلى البداية',
    stories: 'الحكايات',
    search: 'ابحث عن مكان',
    searchKey: 'ابحث عن مكان (/)',
    searchCredit: 'البحث بواسطة <a href="https://nominatim.org" target="_blank" rel="noopener">Nominatim</a> · البيانات © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    searching: 'جارٍ البحث…',
    noPlace: 'لا يوجد مكان بهذا الاسم.',
    searchDown: 'البحث لا يستجيب. حاول مجددًا بعد قليل.',
    explore: 'استكشف: الطبقات وأدوات التحكم',
    exploreKey: 'استكشف (L)',
    audio: 'الصوت',
    audioKey: 'الصوت (M)',
    audioOn: 'شغّل الصوت',
    audioOff: 'أوقف الصوت',
    credits: 'المصادر والاعتمادات',
    fullscreen: 'ملء الشاشة',
    fullscreenKey: 'ملء الشاشة (F)',
    language: 'اللغة',
    more: 'اعرف المزيد',
    next: (story: string) => `التالي: ${story}`,
    chapters: 'الفصول',
    pause: 'إيقاف مؤقت',
    resume: 'استأنف الحكاية',
    zoomIn: 'تقريب',
    zoomOut: 'تبعيد',
    close: 'إغلاق',
    tileCredit: 'صور <a href="https://cloudless.eox.at" target="_blank" rel="noopener">EOxCloudless 2016</a> من EOX IT Services GmbH · تتضمن بيانات Copernicus Sentinel لعامَي 2016 و2017 بعد تعديلها · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>',
    hint: 'اسحب للتدوير · مرّر العجلة للاقتراب · المس نقطة لتقرأها · L للطبقات · / للبحث · M للصوت',
    intro: 'الكوكب، كما ترويه بياناته اليوم.',
    exploreAlone: 'استكشف بنفسك',
    noWebgl: 'تحتاج إلى متصفح يدعم WebGL 2 لترى الكوكب.',
    clock: (day: string, time: string) => `${day} · ${time} UTC`,
    about: 'لماذا Upari',
  },

  stories: { pianeta: 'الكوكب، الآن', natura: 'الطبيعة', persone: 'البشر' },

  compass: { N: 'ش', S: 'ج', E: 'ق', W: 'غ' },

  units: { km: 'كم', kmh: 'كم/س' },

  when: { today: 'اليوم', yesterday: 'أمس', on: (day: string) => `في ${day}`, recent: 'مؤخرًا' },

  station: {
    name: 'محطة الفضاء',
    panel: 'محطة الفضاء الدولية، الآن',
    title: 'محطة الفضاء · الآن',
    alt: 'الارتفاع',
    speed: 'السرعة',
    below: 'تحتها',
    light: 'على متنها',
    pos: 'الموقع',
    orbit: 'المدار',
    day: 'نهار',
    night: 'ليل',
    sunsetIn: (min: string) => `الغروب بعد ${minutes(min)}`,
    sunriseIn: (min: string) => `الشروق بعد ${minutes(min)}`,
    orbitOfDay: (n: number) => `رقم ${n} اليوم`,
  },

  explore: {
    title: 'استكشف',
    year: 'السنة',
    playYears: 'شغّل السنوات',
    reach: 'انتقل إلى المحطة',
    hour: 'الوقت',
    now: 'الآن',
    backToNow: 'عودة إلى الآن',
    hoursFromNow: 'ساعات من الآن',
    realLight: 'ضوء الشمس الحقيقي',
    clouds: 'الغيوم',
    spin: 'دوران بطيء',
    groups: { planet: 'الكوكب', nature: 'الطبيعة', people: 'البشر' },
    layers: {
      adesso: 'الأرض، الآن', venti: 'الرياح', correnti: 'التيارات', mare: 'حرارة البحر',
      anomalia: 'بحر أدفأ من المعتاد', plancton: 'العوالق النباتية', pioggia: 'المطر، آخر 24 ساعة',
      fuochi: 'الحرائق، آخر 7 أيام', terremoti: 'الزلازل، آخر 7 أيام', ghiaccio: 'الجليد البحري',
      luci: 'أضواء الليل', stazione: 'محطة الفضاء',
      verde: 'الغطاء النباتي، شهرًا بعد شهر', foreste: 'الغابات المفقودة، 2001 – 2024', aria: 'الغبار والدخان في الهواء',
      coralli: 'الحرارة على الشعاب المرجانية',
      popolazione: 'السكان', nascite: 'معدل المواليد', mortalita: 'معدل الوفيات', saldo: 'الزيادة الطبيعية',
      vita: 'متوسط العمر المتوقع', bambini: 'وفيات الأطفال دون الخامسة', elettricita: 'الحصول على الكهرباء',
      disoccupazione: 'البطالة (تقديرات ILO)', asilo: 'طلبات اللجوء',
    },
  },

  credits: {
    title: 'من أين تأتي هذه الصور',
    intro: 'كل ما تراه بيانات حقيقية. لا صورة هنا مختلَقة: حيث لا ترى الأقمار الصناعية، تتلاشى الخريطة.',
    items: [
      ['الأرض نهارًا', 'NASA Blue Marble Next Generation، عبر NASA GIBS'],
      ['الأرض ليلًا', 'NASA Black Marble، VIIRS 2016، عبر NASA GIBS'],
      ['الغيوم', 'NASA Visible Earth، صورة مركّبة للغيوم'],
      ['التضاريس', 'Mapzen Terrain Tiles على AWS: USGS SRTM وGMTED2010، وNOAA ETOPO1، وEU-DEM Copernicus، ونماذج وطنية أخرى'],
      ['عن قرب', 'صور <a href="https://cloudless.eox.at" target="_blank" rel="noopener">EOxCloudless 2016</a> من EOX IT Services GmbH (تتضمن بيانات Copernicus Sentinel لعامَي 2016 و2017 بعد تعديلها)، <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>'],
      ['الرياح', 'NOAA GFS بدقة 0.5°، عبر PacIOOS ERDDAP'],
      ['التيارات', 'OSCAR، ESR / NASA، عبر NOAA CoastWatch ERDDAP'],
      ['البحر وانحرافاته', 'GHRSST MUR، NASA JPL، عبر NASA GIBS'],
      ['الجليد', 'GHRSST GAMSSA، Bureau of Meteorology الأسترالي، عبر NASA GIBS'],
      ['العوالق النباتية', 'NASA PACE OCI، عبر NASA GIBS'],
      ['المطر', 'NASA GPM IMERG، عبر NASA GIBS'],
      ['الغطاء النباتي', 'NASA VIIRS (Suomi NPP)، مؤشر NDVI الشهري، عبر NASA GIBS'],
      ['الغبار والدخان', 'NASA GMAO MERRA-2، السُّمك البصري للهباء الجوي، عبر NASA GIBS'],
      ['الغابات المفقودة', 'Hansen et al. 2013، University of Maryland، عبر Global Forest Watch، CC BY 4.0'],
      ['الشعاب المرجانية', 'NOAA Coral Reef Watch، مؤشر Degree Heating Week بدقة 5 كم، عبر PacIOOS ERDDAP'],
      ['الزلازل', 'USGS Earthquake Hazards Program، موجز الأيام السبعة الأخيرة'],
      ['الحرائق', 'NASA FIRMS، VIIRS NOAA-20'],
      ['محطة الفضاء', 'العناصر المدارية من CelesTrak، وحساب المدار بنموذج SGP4 عبر satellite.js؛ النموذج ثلاثي الأبعاد ISS (B) من NASA 3D Resources، من إنجاز Michael D. Carbajal'],
      ['النجوم', 'Yale Bright Star Catalogue'],
      ['البشر', 'World Bank، World Development Indicators (مع بيانات UN World Population Prospects وUN IGME وILO)، CC BY 4.0؛ طلبات اللجوء من UNHCR Refugee Data Portal، CC BY 4.0؛ الحدود من Natural Earth، ملكية عامة'],
      ['الموسيقى والأصوات', 'أُلِّفت خصيصًا لـUpari باستخدام Magnific (Google Lyria وElevenLabs)'],
      ['البحث عن الأماكن', '<a href="https://nominatim.org" target="_blank" rel="noopener">Nominatim</a>، البيانات © المساهمون في <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>، ODbL'],
      ['الترجمات', 'كُتبت بمساعدة Claude (Anthropic)، انطلاقًا من النص الإيطالي'],
    ],
    foot: 'تُحدَّث بيانات اليوم كل صباح. الصور من خدمات NASA GIBS، التابعة لـNASA ESDIS. الإسنادات والتراخيص كاملةً في <a href="THIRD_PARTY_NOTICES.md" target="_blank" rel="noopener">THIRD_PARTY_NOTICES</a>. أما Upari فمشروع من <a href="https://netmilk.ch" target="_blank" rel="noopener">Netmilk Studio</a>، وهو برمجيات حرة بترخيص Apache 2.0: <a href="https://github.com/enuzzo/upari" target="_blank" rel="noopener">الشيفرة المصدرية</a>.',
  },

  about: {
    kicker: 'لماذا Upari',
    title: 'مجانيٌّ كالمطر.',
    lead: 'هذا هو Upari: الأرض كما هي الآن. رياح اليوم، وبحر الأمس، ونيران هذا الأسبوع وزلازله، ومحطة الفضاء تنساب فوق رأسك وأنت تقرأ هذا السطر. لا شيء هنا مرسوم باليد: ما تراه قاسته الأقمار الصناعية وأجهزة الاستشعار، ثم وضعته بين يدي كل من يرغب في أن ينظر. أما نحن، فكل ما فعلناه أننا تعلّمنا الإصغاء.',
    aims: 'صنعناه لثلاثة أمور، بهذا الترتيب: أن يدهشك، وأن يُطلعك، وأن يوقعك في حب هذه الصخرة الدوّارة المجنونة التي لا نظير لها، حبًّا لا شفاء منه. بهذا الترتيب تحديدًا، لأن أحدًا لم يدافع قطّ عن شيء أصابه بالملل.',
    costTitle: 'كم يكلّف',
    cost: 'لا شيء. إنه مجانيّ كضوء الشمس، مجانيّ كالمطر، مجانيّ كالريح التي عبرت محيطًا هذا الصباح لا لشيء إلا لتبعثر شعرك، ثم لم ترسل إليك فاتورة قط. لا إعلانات، ولا حسابات، ولا أحد يتعقّبك.',
    price: 'ولا نطلب في المقابل إلا أمرًا واحدًا، وليس بالقليل:',
    child: 'انظر إليه بعينَي طفل.',
    warrior: 'ودافع عنه بشجاعة محارب.',
    both: 'والأفضل أن تفعل الاثنين معًا. فالأطفال لا يعرفون الخوف، وكل محارب كان يومًا طفلًا.',
    whoTitle: 'من نحن',
    who: 'نحن Netmilk Studio. نصنع المواقع لنكسب عيشنا، ومن حين لآخر نصنع شيئًا كهذا، لا لسبب سوى الحب. وUpari مفتوح المصدر بترخيص Apache 2.0: فكّكه، وتعلّم منه، واجعله أفضل. ليس لنا سوى كوكب واحد. أما الشيفرة، فيمكن على الأقل استنساخها.',
    visit: 'زُر Netmilk Studio',
    source: 'الشيفرة المصدرية',
    signoff: 'صُنع على الأرض.',
  },

  countries: {
    CD: 'جمهورية الكونغو الديمقراطية', CG: 'جمهورية الكونغو', CYN: 'شمال قبرص', SOL: 'أرض الصومال',
    HK: 'هونغ كونغ', MO: 'ماكاو', PS: 'فلسطين', TL: 'تيمور الشرقية', MM: 'ميانمار', MQ: 'المارتينيك',
  },

  sea: {
    arctic: { in: 'في المحيط المتجمد الشمالي', name: 'المحيط المتجمد الشمالي' },
    southern: { in: 'في المحيط المتجمد الجنوبي', name: 'المحيط المتجمد الجنوبي' },
    med: { in: 'في البحر المتوسط', name: 'البحر المتوسط' },
    red: { in: 'في البحر الأحمر', name: 'البحر الأحمر' },
    persian: { in: 'في الخليج', name: 'الخليج' },
    mexico: { in: 'في خليج المكسيك', name: 'خليج المكسيك' },
    caribbean: { in: 'في البحر الكاريبي', name: 'البحر الكاريبي' },
    southChina: { in: 'في بحر الصين الجنوبي', name: 'بحر الصين الجنوبي' },
    indonesia: { in: 'بين جزر إندونيسيا', name: 'إندونيسيا' },
    indianSouth: { in: 'في جنوب المحيط الهندي', name: 'جنوب المحيط الهندي' },
    indian: { in: 'في المحيط الهندي', name: 'المحيط الهندي' },
    atlanticNorth: { in: 'في شمال المحيط الأطلسي', name: 'شمال المحيط الأطلسي' },
    atlanticTropical: { in: 'في المحيط الأطلسي المداري', name: 'المحيط الأطلسي المداري' },
    atlanticSouth: { in: 'في جنوب المحيط الأطلسي', name: 'جنوب المحيط الأطلسي' },
    atlanticSouthern: { in: 'في المحيط الأطلسي المداري الجنوبي', name: 'المحيط الأطلسي المداري الجنوبي' },
    pacificNorth: { in: 'في شمال المحيط الهادئ', name: 'شمال المحيط الهادئ' },
    pacificTropical: { in: 'في المحيط الهادئ المداري', name: 'المحيط الهادئ المداري' },
    pacificSouth: { in: 'في جنوب المحيط الهادئ', name: 'جنوب المحيط الهادئ' },
    pacificSouthern: { in: 'في المحيط الهادئ المداري الجنوبي', name: 'المحيط الهادئ المداري الجنوبي' },
  },

  quake: {
    distance: (km: string, place: string) => `على بُعد ${km} كم من ${place}`,
    near: (place: string) => `قرب ${place}`,
    region: (place: string) => `في منطقة ${place}`,
    regions: { sandwich: 'جزر ساندويتش الجنوبية', kermadec: 'جزر كيرماديك', ridge: 'حيد وسط الأطلسي' },
  },

  probe: {
    asylum: (n: string) => `طلبات اللجوء: ${n}`,
    noAsylum: 'لا طلبات منشورة',
    noData: 'لا بيانات لهذه السنة',
    directions: ['الشمال', 'الشمال الشرقي', 'الشرق', 'الجنوب الشرقي', 'الجنوب', 'الجنوب الغربي', 'الغرب', 'الشمال الغربي'],
    windFrom: (dir: string) => `رياح من ${dir}`,
    waterTo: (dir: string) => `يجري الماء نحو ${dir}`,
    magnitude: (m: string) => `بقوة ${m} درجة`,
    quake: (place: string, depthKm: string, ago: string) => `${place} · على عمق ${depthKm} كم · ${ago}`,
    lessThanHour: 'منذ أقل من ساعة',
    hoursAgo: (h: number) => `منذ ${count(h, String(h), ['ساعة', 'ساعتين', 'ساعات', 'ساعة', 'ساعة'])}`,
    daysAgo: (d: number) => `منذ ${count(d, String(d), ['يوم', 'يومين', 'أيام', 'يومًا', 'يوم'])}`,
    noQuake: 'لا زلازل هنا',
    noQuakeSub: 'بقوة 2.5 درجة أو أكثر، آخر 7 أيام',
    fires: (n: number, s: string) => count(n, s, ['حريق واحد', 'حريقان', 'حرائق', 'حريقًا', 'حريق']),
    noFire: 'لا حرائق',
    firesSub: 'في نطاق 150 كم، آخر 7 أيام',
    solarDay: 'التوقيت الشمسي · نهار',
    solarNight: 'التوقيت الشمسي · ليل',
    solarDusk: 'التوقيت الشمسي · شفق',
  },

  data: {
    anomaly: (signed: string) => `${ltr(`${signed} °C`)} عن المعدل`,
    rainTrace: 'مطر بالكاد يُلحظ',
    rain: (mm: string) => `مطر بمعدل ${mm} مم في الساعة`,
    ice: (pct: string) => `جليد بنسبة ${pct}%`,
    bare: 'أرض شبه جرداء',
    ndvi: (v: string) => `اخضرار ${v} (NDVI)`,
    noStress: 'لا إجهاد حراري',
    coral: (v: string) => `أسابيع الحرارة: ${v} (°C)`,
    forest: (year: number) => `غابة فُقدت عام ${year}`,
    aerosol: (v: string) => `عتمة الهواء ${v} (AOD)`,
  },

  atlas: {
    population: {
      title: 'السكان', left: '', right: '', source: 'World Bank، World Development Indicators · SP.POP.TOTL (الأمم المتحدة، المكاتب الإحصائية الوطنية، Eurostat)',
      format: (v: number) => (v >= 1e9 ? `${num(v / 1e9, 2)} مليار` : v >= 1e6 ? `${num(v / 1e6, 1)} مليون` : `${num(v)} نسمة`),
    },
    birth: {
      title: 'المواليد لكل ألف نسمة', left: '5', right: '50', source: 'World Bank، World Development Indicators · SP.DYN.CBRT.IN',
      format: (v: number) => `${num(v, 1)} مولود لكل ألف`,
    },
    death: {
      title: 'الوفيات لكل ألف نسمة', left: '2', right: '30', source: 'World Bank، World Development Indicators · SP.DYN.CDRT.IN',
      format: (v: number) => `${num(v, 1)} وفاة لكل ألف`,
    },
    balance: {
      title: 'المواليد ناقص الوفيات، لكل ألف', left: ltr('−10'), right: ltr('+40'), source: 'World Bank، World Development Indicators · معدل المواليد ناقص معدل الوفيات (حساب Upari)',
      format: (v: number) => `${ltr(`${v > 0 ? '+' : v < 0 ? '−' : ''}${num(Math.abs(v), 1)}`)} لكل ألف`,
    },
    life: {
      title: 'متوسط العمر المتوقع عند الولادة', left: '35 سنة', right: '85', source: 'World Bank، World Development Indicators · SP.DYN.LE00.IN',
      format: (v: number) => `${num(v, 1)} سنة`,
    },
    under5: {
      title: 'الأطفال الذين يموتون قبل سن الخامسة، لكل ألف', left: '0', right: '300', source: 'UN IGME عبر World Bank WDI · SH.DYN.MORT',
      format: (v: number) => `${num(v)} لكل ألف مولود حي`,
    },
    electricity: {
      title: 'السكان الذين تصلهم الكهرباء', left: '0%', right: '100%', source: 'World Bank، SDG 7.1.1 · EG.ELC.ACCS.ZS',
      format: (v: number) => `${num(v)}% من السكان`,
    },
    unemployment: {
      title: 'البطالة، تقديرات ILO النموذجية', left: '0%', right: '30%', source: 'ILO، تقديرات نموذجية، عبر World Bank WDI · SL.UEM.TOTL.ZS',
      format: (v: number) => `${num(v, 1)}% من القوة العاملة`,
    },
  },

  legends: {
    wind: { title: 'سرعة الرياح', left: 'سكون', right: '80 كم/س' },
    currents: { title: 'سرعة التيار', left: 'بطيء', right: '4 كم/س' },
    sst: { title: 'حرارة الماء', left: ltr('−2 °C'), right: '34 °C' },
    anomaly: { title: 'الفرق عن المعدل', left: ltr('−3 °C'), right: ltr('+3 °C') },
    chlorophyll: { title: 'الكلوروفيل على السطح', left: 'مياه صافية', right: 'ازدهار' },
    rain: { title: 'شدة المطر', left: 'رذاذ', right: 'وابل' },
    quakes: { title: 'عمق الزلزال', left: 'عند السطح', right: '700 كم' },
    ice: { title: 'بحر متجمّد', left: '15%', right: '100%' },
    asylum: { title: 'طلبات اللجوء، حسب بلد المنشأ', left: 'سوريا · أوكرانيا', right: 'أفغانستان' },
    ndvi: { title: 'مدى اخضرار الأرض (NDVI)', left: 'أرض جرداء', right: 'غابة كثيفة' },
    forest: { title: 'الأشجار المفقودة، حسب السنة', left: 'قبل سنوات', right: 'هذا العام' },
    aerosol: { title: 'كم من الضوء تحجبه الجسيمات (AOD)', left: 'هواء صافٍ', right: 'هواء كثيف' },
    coral: { title: 'الإجهاد الحراري المتراكم', left: '0', right: '20 °C · أسابيع' },
  },

  // ——— الكوكب، الآن ———

  pianeta: {
    title: 'الكوكب', kicker: 'الآن',
    narrate: 'هذه هي الأرض، في هذه اللحظة بالذات. نصفها في النهار، ونصفها في الليل. وخط الظل ينساب فوق خط الاستواء بسرعة 1,670 كيلومترًا في الساعة.',
    facts: [
      ['1,670 كم/س', 'سرعة دوران الأرض عند خط الاستواء'],
      ['8′ 20″', 'الزمن الذي يستغرقه ضوء الشمس ليصل إلينا'],
    ],
    hour: 'الوقت على الكرة التي تراها: الضوء هو الضوء الحقيقي',
    text: 'النهار والليل والشفق محسوبة للحظة الراهنة. تنجرف الغيوم مع رياح اليوم، وتُلقي الجبال ظلالها حين تكون الشمس منخفضة.',
    source: 'NASA Blue Marble · NASA Black Marble · نموذج التضاريس Mapzen/AWS · رياح NOAA GFS',
  },
  respiro: {
    title: 'النَّفَس', kicker: 'رياح اليوم',
    narrate: (p: { where: string; kmh: string }) => `الهواء لا يهدأ أبدًا. هذه رياح اليوم: أنهار خفية تحمل دفء المناطق المدارية نحو القطبين. وأقواها الآن يهبّ ${p.where} بسرعة ${km(p.kmh)} في الساعة.`,
    strongest: (coords: string) => `أقوى رياح في هذه اللحظة، ${coords}`,
    facts: [
      ['10 م', 'الارتفاع عن سطح الأرض الذي تُقاس عنده'],
      [ltr('× 22,000'), 'مقدار تسريع الخطوط، لنراها تتحرك'],
    ],
    text: 'تدور المرتفعات والمنخفضات الجوية في اتجاهين متعاكسين في نصفَي الكرة: فدوران الأرض هو ما يحني مسار الرياح. المس نقطة لتقرأ السرعة والاتجاه.',
    source: (time: string) => `نموذج NOAA GFS بدقة 0.5° · تحليل ${time} UTC`,
    pin: 'أقوى رياح، الآن',
  },
  correnti: {
    title: 'التيارات', kicker: 'أنهار في البحر',
    narrate: 'تحت الأمواج، للبحر أنهاره الخاصة. ينقل تيار الخليج عشرات أضعاف ما تحمله أنهار الأرض كلها مجتمعة، ويحمل شيئًا من المدارات حتى أوروبا.',
    facts: [
      ['30 مليون', 'متر مكعب في الثانية في تيار الخليج، قبالة فلوريدا'],
      ['1.2 مليون', 'متر مكعب في الثانية: أنهار العالم كلها مجتمعة'],
      ['15 م', 'طبقة المياه السطحية المعروضة'],
    ],
    text: 'التيارات المعروضة هي يوم واحد من أيام سبتمبر: تتغير التيارات الكبرى ببطء من عام إلى آخر، بينما تولد الدوّامات على حوافها وتموت في غضون أسابيع.',
    source: 'OSCAR · NOAA CoastWatch ERDDAP · 26 سبتمبر 2014، بدقة 1/3°',
  },
  calore: {
    title: 'دفء البحر', kicker: 'عام من حرارة البحر',
    narrate: (p: { when: string; today: boolean; where: string; temp: string | null }) => `البحر هو المدفأة الكبرى لهذا الكوكب. ${p.when}، ${p.today ? 'تقع' : 'كانت'} أدفأ بقعة فيه ${p.where}: ${p.temp ? `${p.temp} درجة` : 'أكثر من 32 درجة'}. تأمّل المياه الدافئة تصعد شمالًا في الصيف وتعود جنوبًا في الشتاء: عام كامل في بضع ثوانٍ.`,
    hottest: (when: string, coords: string) => `أدفأ مياه ${when}، ${coords}`,
    facts: [
      [ltr('−1.8 °C'), 'درجة الحرارة التي يتجمد عندها ماء البحر'],
      ['1 كم', 'دقة الخريطة الأصلية'],
    ],
    text: 'يمتص المحيط أكثر من 90% من الحرارة الزائدة التي تحبسها غازات الدفيئة. وتظهر التيارات الدافئة ألسنةً برتقالية تمتد نحو القطبين.',
    pin: 'أدفأ مياه',
  },
  febbre: {
    title: 'الحُمّى', kicker: 'عام، مقارنةً بالمعتاد',
    narrate: (p: { when: string; today: boolean; pct: string }) => `بالأحمر البحر الأدفأ من المعتاد، وبالأزرق الأبرد منه، شهرًا بعد شهر على مدى عام. ${p.when}، ${p.today ? 'تبلغ' : 'بلغت'} نسبة المحيطات الأدفأ من المعدل ${p.pct}%.`,
    share: 'من سطح البحر أدفأ من المعدل',
    strongest: (where: string) => `أقوى انحراف، ${where}`,
    over3: `أكثر من ${ltr('+3')}`,
    normal: ['2003–2014', 'الفترة التي تُعدّ «المعتاد»'],
    text: 'يقارن الانحراف حرارة يوم ما بمتوسط اليوم نفسه في سنوات المرجع. وتدوم موجات الحر البحرية أسابيع، فتُرهق المرجان والأسماك والمروج البحرية.',
    source: 'انحرافات GHRSST MUR، NASA JPL',
    pin: 'أقوى انحراف',
  },
  fioritura: {
    title: 'البحر المُزهِر', kicker: 'عام من العوالق النباتية',
    narrate: 'كل وهج أخضر مرجٌ خفيّ: مليارات الطحالب المجهرية، العوالق النباتية. تنتج نحو نصف الأكسجين الذي نتنفسه، وتُزهر حيثما حلّ الربيع، في نصف الكرة أولًا، ثم في النصف الآخر.',
    oxygen: [ltr('≈ 50%'), 'من أكسجين الكوكب مصدره البحر'],
    days: (n: number) => count(n, String(n), ['يوم واحد', 'يومان', 'أيام', 'يومًا', 'يوم']),
    daysLabel: 'من الرصد دُمجت لإزالة الغيوم',
    range: 'ملليغرام من الكلوروفيل لكل متر مكعب، من الأزرق إلى الأخضر',
    text: 'تتبع الإزهارات الفصول والمياه الغنية بالمغذيات: على امتداد السواحل، حيث تصعد المياه العميقة، وفي الربيع عند خطوط العرض العليا. في أكتوبر يكون الربيع في نصف الكرة الجنوبي.',
  },
  pioggia: {
    title: 'المطر', kicker: 'أربع وعشرون ساعة',
    narrate: 'يوم كامل من المطر، في بضع ثوانٍ. على امتداد خط الاستواء يصعد الهواء الدافئ، ويبرد، ثم يردّ إلى البحر الماء الذي أخذته منه الشمس.',
    interval: ['30 دقيقة', 'بين صورة وأخرى من كوكبة أقمار GPM'],
    hours: '24 ساعة',
    since: (time: string) => `منذ ${time} UTC`,
    yearly: [ltr('≈ 1 م'), 'كمية المطر التي تسقط في عام، في المتوسط، على الكوكب كله'],
    text: (last: string) => `كل لقطة تقدير فضائي لكمية المطر؛ والانتقالات بين الصور مُستكمَلة بالاستيفاء. آخر لقطة: ${last} UTC.`,
  },
  fuoco: {
    title: 'النار', kicker: 'الأيام السبعة الأخيرة',
    narrate: (p: { thousands: string; approx: string }) => `كل شرارة حريقٌ يُرى من الفضاء. في سبعة أيام أحصت الأقمار الصناعية أكثر من ${p.approx} منها. ونحن من يُشعل معظمها: لتنظيف الحقول، ولإفساح المجال للرعي.`,
    count: 'بؤر حرارية رُصدت في 7 أيام',
    facts: [
      ['375 م', 'حجم البكسل الذي يرى النار'],
      ['مرتان', 'يوميًا، نهارًا وليلًا، يمرّ القمر NOAA‑20 فوق كل نقطة'],
    ],
    text: 'يتناسب سطوع كل نقطة مع قوة النار؛ وأحدثها أشدها توهجًا. في الجنوب الأفريقي وأمريكا الجنوبية، هذا موسم الحرائق الزراعية.',
    source: (day: string) => `NASA FIRMS · VIIRS NOAA-20 · محدَّث في ${day}`,
  },
  terremoti: {
    title: 'الأرض ترتجف', kicker: 'الأيام السبعة الأخيرة',
    narrate: (p: { count: string; mag: string; where: string }) => `في سبعة أيام ارتجفت الأرض ${counted(p.count, ['مرة واحدة', 'مرتين', 'مرات', 'مرة', 'مرة'])} بقوة 2.5 درجة أو أكثر: الأسبوع كله يمرّ في بضع ثوانٍ. وكان أقواها، بقوة ${p.mag} درجة، ${p.where}. ومعًا ترسم هذه الهزات حدود الصفائح.`,
    count: 'زلازل بقوة 2.5 درجة أو أكثر في آخر 7 أيام',
    strong: 'بقوة 5 درجات أو أكثر',
    deepest: (where: string) => `الأعمق، ${where}`,
    text: 'كل نقطة زلزال، حجمها بقدر قوته ولونها بحسب عمقه: كهرماني عند السطح، وورديّ في الأعماق المتوسطة، وبنفسجي حتى ما دون 300 كيلومتر، حيث تغوص صفيحة تحت أخرى. وخارج الولايات المتحدة، تسجّل شبكة USGS في الغالب الزلازل التي تبلغ قوتها 4 درجات فأكثر.',
    source: (day: string) => `USGS Earthquake Hazards Program · محدَّث في ${day}`,
    pin: (mag: string) => `بقوة ${mag} درجة`,
    pinSub: 'الأقوى هذا الأسبوع',
  },
  ghiaccio: {
    title: 'الجليد', kicker: 'عام عند القطبين',
    narrate: (p: { when: string; today: boolean; area: string }) => `في أعلى العالم يتجمّد البحر. ${p.when}، ${p.today ? 'يغطي' : 'كان يغطي'} الجليد القطبي الشمالي ${million(p.area)} كيلومتر مربع، ويتّسع كل شتاء بمساحة تفوق مساحة أوروبا. هنا يمضي عام كامل: يذوب القطب الشمالي بينما تتجمّد القارة القطبية الجنوبية.`,
    area: (mkm2: string) => `${million(mkm2)} كم²`,
    arctic: (when: string) => `الجليد البحري في القطب الشمالي، ${when}`,
    antarctic: 'الجليد حول القارة القطبية الجنوبية',
    decline: [ltr('−12%'), 'كل عقد: تراجع الحد الأدنى الصيفي للجليد القطبي الشمالي منذ 1979'],
    text: 'المساحة هي مجموع المناطق التي يغطي الجليد 15% منها على الأقل، مرجّحةً بالتركيز. يعكس الجليد ضوء الشمس: وحين ينحسر، يمتص البحر الداكن مزيدًا من الحرارة.',
    source: 'GHRSST GAMSSA، Bureau of Meteorology · تركيز الجليد',
  },
  luci: {
    title: 'الأضواء', kicker: 'الليل، الآن',
    narrate: 'حين يحلّ الليل، يضيء الكوكب. هذه الأضواء أصدق صورة لأماكن عيشنا: على امتداد السواحل والأنهار والطرق.',
    facts: [
      [ltr('≈ 57%'), 'من البشر يعيشون في المدن'],
      ['742 م', 'البكسل الذي يصوّر به القمر الصناعي الأضواء'],
      ['2016', 'عام الفسيفساء الليلية، بلا غيوم ولا قمر'],
    ],
    text: 'نهر الضوء على امتداد النيل، وشبكة أوروبا العنكبوتية، وسواحل اليابان: والأضواء تروي أيضًا ما هو غائب، كالغابات الكبرى والصحارى، شبه المظلمة.',
    source: 'NASA Black Marble · VIIRS 2016',
  },
  lassu: {
    title: 'في الأعالي', kicker: 'محطة الفضاء، الآن',
    narrate: (p: { alt: string; speed: string }) => `وهناك في الأعالي، على ارتفاع ${km(p.alt)}، تدور محطة الفضاء حول كل هذا بسرعة ${km(p.speed)} في الساعة. دورة كاملة كل 92 دقيقة: ستة عشر شروقًا في اليوم.`,
    arrive: (p: { below: string; day: boolean | null; minutes: string }) => `هذا ما يراه الطاقم الآن من النافذة: تحتهم ${p.below}.${p.day === null ? '' : p.day ? ` على متن المحطة نهار: الغروب التالي بعد ${minutes(p.minutes)}.` : ` على متن المحطة ليل: الشروق التالي بعد ${minutes(p.minutes)}.`}`,
    alt: 'ارتفاعها في هذه اللحظة',
    speed: 'نحو 7.7 كيلومتر في كل ثانية',
    dawns: ['16', 'شروقًا وغروبًا في اليوم يراها الطاقم'],
    text: 'يُحسب الموقع الآن من العناصر المدارية التي تنشرها CelesTrak. ويُظهر الخط مدارًا كاملًا: نصف ساعة في الماضي وساعة في المستقبل. ومن قرب، تطير المحطة بوضعيتها الحقيقية: وحداتها في اتجاه الحركة، وعارضتها متعامدة مع المدار.',
    source: 'العناصر المدارية NORAD 25544 · CelesTrak · حساب المدار SGP4 · نموذج ثلاثي الأبعاد من NASA',
  },

  // ——— الطبيعة ———

  verde: {
    title: 'النَّفَس الأخضر', kicker: 'عام من الغطاء النباتي',
    narrate: (p: { hi: string; hiMonth: string; lo: string; loMonth: string }) => `تتنفّس الأرض مع الفصول. بين خطَّي العرض 30 و65 شمالًا، تغطي الأوراق ${p.hi}% من اليابسة في ${p.hiMonth}، ولا تتجاوز ${p.lo}% في ${p.loMonth}. ثم ينتقل الأخضر إلى نصف الكرة الآخر.`,
    dense: (month: string) => `من اليابسة بين 30° و65° شمالًا تكسوها نباتات كثيفة (NDVI أعلى من 0.5)، في ${month}`,
    sparse: (month: string) => `في ${month}`,
    months: (n: number) => count(n, String(n), ['شهر واحد', 'شهران', 'أشهر', 'شهرًا', 'شهر']),
    span: (from: string, to: string) => `من ${from} إلى ${to}`,
    text: 'يقارن مؤشر NDVI الضوء الأحمر، الذي تمتصه الأوراق، بالأشعة تحت الحمراء القريبة، التي تعكسها: كلما ارتفع، كان الغطاء النباتي أكثف وأنشط. كل لقطة متوسط شهر كامل؛ وحيث تحجب الغيوم الشهر كله، تغيب القيمة.',
    source: 'NASA VIIRS (Suomi NPP) · مؤشر NDVI الشهري · GIBS',
  },
  foreste: {
    title: 'الغابات المفقودة', kicker: 'الغطاء الشجري المفقود، 2001 – 2024',
    narrate: (peak: number) => `كل نقطة قطعة من غابة لم تعد موجودة: قُطعت، أو أُحرقت، أو تحوّلت إلى حقل. تتوهّج في العام الذي اختفت فيه، ثم تصير ندبة. وكان عام ${peak} الأسوأ في السلسلة كلها.`,
    peak: 'العام الذي شهد أكبر خسارة منذ 2001',
    recent: (from: number, to: number) => `من خسارة السلسلة كلها وقعت في السنوات الخمس الأخيرة (${from}–${to})`,
    early: (from: number, to: number) => `في السنوات الخمس الأولى (${from}–${to})`,
    text: 'فقدان الغطاء الشجري: أشجار لا يقل طولها عن 5 أمتار اختفت من بكسل طول ضلعه 30 مترًا، بفعل حريق أو قطع أو مرض. لا يميّز بين إزالة الغابات وإدارتها، ولا يحسب إعادة النمو. هنا خُفّضت الدقة إلى نحو 10 كيلومترات لكل نقطة؛ وحصص كل عام محسوبة على هذه الخريطة، مرجّحةً بالشدة.',
    source: 'Hansen et al. 2013، University of Maryland · Global Forest Watch v1.12 · CC BY 4.0',
  },
  aria: {
    title: 'الهواء', kicker: 'عام من الغبار والدخان',
    narrate: (p: { where: string; month: string; worst: string }) => `رمال الصحراء الكبرى فوق الأطلسي، ودخان الحرائق، وضباب المدن الدخاني: الهواء يحمل كل شيء. في العام الأخير كان أكثف الحُجُب فوق ${p.where}، في ${p.month}؛ وكان أشد الشهور عتمةً على الكوكب ${p.worst}.`,
    thickest: (where: string, month: string) => `أعلى سُمك بصري في العام: ${where}، ${month}`,
    worst: 'الشهر الذي امتلأ فيه الهواء بالجسيمات أكثر من غيره، في المتوسط على الكوكب كله',
    wavelength: ['550 نانومتر', 'الطول الموجي للضوء الأخضر الذي يُقاس عنده'],
    text: 'يدل السُّمك البصري للهباء الجوي على مقدار ضوء الشمس الذي تحجبه الجسيمات العالقة في الهواء: 0.1 هواء صافٍ، وفوق 1 تصبح السماء معتمة. هذه تقديرات من إعادة التحليل MERRA-2 التابعة لـNASA، التي تدمج بيانات الأقمار الصناعية مع نموذج للغلاف الجوي؛ وهي وحدها لا تميّز الغبار من الدخان.',
    source: 'NASA GMAO · MERRA-2 · السُّمك البصري للهباء الجوي عند 550 نانومتر، شهريًا · GIBS',
  },
  coralli: {
    title: 'الشعاب المرجانية', kicker: 'عام من الحرارة في البحر',
    narrate: (p: { now: string; peakMonth: string | null; peak: string }) => `حين يبقى البحر شديد الدفء أسابيع متتالية، تطرد المرجانيات الطحالب التي تغذيها فتبيضّ. اليوم، تجاوز ${p.now}% من البحار المدارية العتبة: ${p.peakMonth ? `في العام الأخير بلغت الذروة في ${p.peakMonth}، بنسبة ${p.peak}%` : 'وهي أعلى قيمة في العام الأخير'}.`,
    alert: 'من البحار المدارية (30° ش – 30° ج) فوق 4 °C·أسابيع، حيث يُرجَّح الابيضاض',
    severe: 'فوق 8، حيث يموت كثير من المرجان',
    worst: (pct: string) => `الشهر الأشد حرجًا في العام الأخير (${pct}%)`,
    text: 'تجمع «أسابيع التسخين بالدرجات» (Degree Heating Weeks)، على مدى الأسابيع الاثني عشر الأخيرة، مقدار ما تجاوزت به المياه أعلى حرارة معتادة في ذلك المكان. والمقياس يشمل البحر كله: أما الشعاب المرجانية فلا توجد إلا حيث تكون المياه ضحلة وصافية.',
    source: 'NOAA Coral Reef Watch v3.1 · 5 كم · عبر PacIOOS ERDDAP',
  },

  // ——— البشر ———

  wdiNote: WDI_NOTE,
  popolazione: {
    title: 'ثمانية مليارات', kicker: 'السكان، 1960 – 2025',
    narrate: (p: { then: string; now: string }) => `في عام 1960 كنا ${billion(p.then)}. وفي 2025 صرنا ${billion(p.now)}. كل نقطة ضوء ربع مليون إنسان: تضيء حيث يعيشون، عامًا بعد عام.`,
    billions: (b: string) => billion(b),
    total: 'عدد السكان في 2025، مجموع 217 إقليمًا',
    dot: ['250,000', 'نسمة لكل نقطة ضوء'],
    largest: (people: string) => `البلد الأكثر سكانًا: ${people}`,
    text: 'تتوزع النقاط داخل كل بلد حيث توجد أضواء في الليل (NASA Black Marble): فهي تُظهر أين يعيش الناس، لا عناوين دقيقة. وفي كل عام يضيء منها بقدر ما يلزم لعدّ سكان ذلك العام.',
    borders: 'حدود Natural Earth',
  },
  nascite: {
    title: 'مواليد أقل', kicker: 'معدل المواليد، 1960 – 2024',
    narrate: (p: { then: string; now: string; top: string }) => `في عام 1960 كان يولد ${counted(p.then, ['طفل واحد', 'طفلان', 'أطفال', 'طفلًا', 'طفل'])} لكل ألف نسمة. وفي 2024، ${p.now}. بلغ التراجع كل مكان تقريبًا؛ واليوم أعلى معدل في ${p.top}.`,
    world: 'المواليد لكل ألف نسمة في العالم، 2024 (متوسط مرجّح بعدد السكان)',
    highest: (country: string) => `الأعلى، في ${country}`,
    lowest: (country: string) => `الأدنى، في ${country}`,
    text: 'معدل خام: يتأثر أيضًا بأعمار السكان.',
  },
  vita: {
    title: 'أعمار أطول', kicker: 'متوسط العمر المتوقع، 1960 – 2024',
    narrate: (p: { then: string; now: string }) => `في عام 1960 كان المولود الجديد يتوقع أن يعيش، في المتوسط، ${counted(p.then, ['سنة واحدة', 'سنتين', 'سنوات', 'سنة', 'سنة'])}. واليوم ${counted(p.now, ['سنة واحدة', 'سنتين', 'سنوات', 'سنة', 'سنة'])}. إنه من أعظم إنجازات هذا القرن، ولم ينتهِ بعد.`,
    years: (y: string) => counted(y, ['سنة واحدة', 'سنتان', 'سنوات', 'سنة', 'سنة']),
    world: 'متوسط العمر المتوقع عند الولادة في العالم، 2024 (متوسط مرجّح بعدد السكان)',
    highest: (country: string) => `الأعلى، في ${country}`,
    lowest: (country: string) => `الأدنى، في ${country}`,
    text: 'مقياس فترة: كم سيعيش من يولد اليوم لو بقيت مخاطر الوفاة في كل سن على حالها في ذلك العام. أما الانهيارات المفاجئة فهي حروب ومجاعات وأوبئة.',
  },
  bambini: {
    title: 'الأطفال', kicker: 'وفيات الأطفال دون الخامسة، 1960 – 2024',
    narrate: (p: { many: string; top: string; now: string; then: string | null }) => `في عام 1960، كان أكثر من طفل من كل أربعة يموت قبل سن الخامسة في ${p.many} من بلدان العالم. واليوم أعلى معدل في ${p.top}: ${p.now} لكل ألف${p.then ? `، بعد أن كان ${p.then}` : ''}.`,
    then: 'عدد البلدان التي سجّلت في 1960 ما لا يقل عن 250 وفاة لكل ألف مولود',
    now: 'عدد البلدان التي سجّلت في 2024 ما لا يقل عن 100 لكل ألف',
    goal: ['SDG 3.2', 'هدف الأمم المتحدة: ألا يتجاوز المعدل 25 لكل ألف بحلول 2030'],
    text: 'تقديرات فترة من UN IGME: ليست أعدادًا للوفيات، ولا مصير طفل بعينه؛ والفوارق الصغيرة ليست اختلافات مؤكدة.',
  },
  saldo: {
    title: 'الميزان', kicker: 'المواليد ناقص الوفيات، 1960 – 2024',
    narrate: (n: string) => `المواليد ناقص الوفيات. في ${n} من بلدان العالم، اليوم، يموت من الناس أكثر مما يولد: بالأزرق، في أوروبا وشرق آسيا خصوصًا. وحيث يظهر الكهرماني، ينمو عدد السكان من تلقاء نفسه.`,
    now: 'عدد البلدان التي فاقت فيها الوفيات المواليد في 2024',
    then: 'وكم كان عددها في 1960',
    world: 'الزيادة الطبيعية في العالم، 2024',
    text: 'يحسبه Upari بطرح معدل الوفيات من معدل المواليد، للبلد والسنة نفسيهما، وحيث تتوفر القيمتان فقط. الهجرة غير محسوبة: قد ينمو بلد حتى لو كان ميزانه سالبًا.',
  },
  luce: {
    title: 'النور الكهربائي', kicker: 'الحصول على الكهرباء، 2000 – 2024',
    narrate: (p: { then: string; now: string; without: string }) => `في عام 2000 كانت الكهرباء تصل إلى ${p.then}% من الناس؛ واليوم إلى ${p.now}%. ولا يزال ${million(p.without)} إنسان محرومين منها، في أفريقيا جنوب الصحراء خصوصًا.`,
    world: 'من الناس تصلهم الكهرباء في 2024 (متوسط مرجّح بعدد السكان)',
    millions: (m: string) => million(m),
    first: (country: string) => `محرومون من الكهرباء في ${country}`,
    second: (country: string) => `في ${country}`,
    text: 'الحصول عليها من الشبكة أو من شبكات صغيرة أو من أنظمة مستقلة: لا يقول شيئًا عن انتظامها ولا جودتها ولا سعرها. تبدأ السلسلة في 2000 لأن كثيرًا من البلدان لا قيم لها قبل ذلك.',
  },
  fuga: {
    title: 'الفرار', kicker: 'طلبات اللجوء، 2011 – 2024',
    narrate: (p: { year: number; total: string }) => `من يفرّون من سوريا وأوكرانيا وأفغانستان، والبلد الذي طلبوا فيه اللجوء. تبلغ الحرب السورية ذروتها في ${p.year}: ${counted(p.total, ['طلب واحد', 'طلبان', 'طلبات', 'طلبًا', 'طلب'])} في عام واحد.`,
    peak: (origin: string, year: number) => `طلبات من ${origin}، عام ${year} (عام الذروة)`,
    text: 'طلبات فردية جديدة مقدَّمة إلى السلطات الحكومية، حسب البلد الذي قُدِّمت فيه. ثلاثة بلدان منشأ فقط: ليست هذه كل الهجرات، ولا هي عدد أفراد مختلفين. ومنذ 2022 حصل معظم من غادروا أوكرانيا على الحماية المؤقتة في الاتحاد الأوروبي، وهي غير محسوبة هنا. والأقواس تصل بين العواصم: إنها تخطيطية، لا رحلات مرصودة.',
    source: 'UNHCR، Refugee Data Portal · AsylumApplications، CC BY 4.0',
  },
};

export default ar;
