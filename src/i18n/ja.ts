import { num } from './format';
import type { Dict } from './it';

// 日本語.
// ナレーションと解説は常体（だ・である）、画面の操作メッセージは敬体（です・ます）。

const WDI_NOTE = 'Upariによる推計を加えていない、元の年次値。ある年にデータのない国は灰色のまま残る。色は年から年へなめらかに移り変わるが、数値はそうではない。国境は当時のものではなく、現在のNatural Earthによるもの。';

/** 人数を「14億1,200万人」「5,800万人」のように、億と万で書く。 */
const people = (v: number) => {
  if (v >= 1e8) {
    const man = Math.round(v / 1e6) * 100;
    const oku = Math.floor(man / 1e4), rest = man % 1e4;
    return rest ? `${num(oku)}億${num(rest)}万人` : `${num(oku)}億人`;
  }
  return v >= 1e4 ? `${num(Math.round(v / 1e4))}万人` : `${num(v)}人`;
};

/** The callers pass billions and millions already formatted ("8.2", "655"): back to a number, to count in 億 and 万. */
const value = (s: string) => Number(s.replace(/,/g, ''));
const decimals = (s: string) => (s.includes('.') ? s.split('.')[1].length : 0);
/** "8.2" billion → "82億" */
const oku = (b: string) => `${num(value(b) * 10, Math.max(0, decimals(b) - 1))}億`;

const ja: Dict = {
  lang: { name: '日本語', locale: 'ja-JP', dir: 'ltr' },

  page: {
    title: 'Upari · いまの地球',
    description: 'Upari：今日の衛星データが語る地球。風、海流、海、雨、火災、氷、夜の灯り、そして宇宙ステーション。',
    globe: '地球',
    home: '最初に戻る',
    stories: '物語',
    search: '場所を検索',
    searchKey: '場所を検索（/）',
    searchCredit: '検索：<a href="https://nominatim.org" target="_blank" rel="noopener">Nominatim</a> · データ © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    searching: '検索中…',
    noPlace: 'その名前の場所は見つかりません。',
    searchDown: '検索が応答しません。しばらくしてから、もう一度お試しください。',
    explore: '探索：レイヤーと操作',
    exploreKey: '探索（L）',
    audio: 'サウンド',
    audioKey: 'サウンド（M）',
    audioOn: 'サウンドをオンにする',
    audioOff: 'サウンドをオフにする',
    credits: 'データの出典とクレジット',
    fullscreen: '全画面表示',
    fullscreenKey: '全画面表示（F）',
    language: '言語',
    more: 'くわしく見る',
    next: (story: string) => `次へ：${story}`,
    chapters: '章',
    pause: '一時停止',
    resume: '物語を再開',
    zoomIn: '近づく',
    zoomOut: '遠ざかる',
    close: '閉じる',
    tileCredit: '<a href="https://cloudless.eox.at" target="_blank" rel="noopener">EOxCloudless 2016</a>（EOX IT Services GmbH）· 改変されたCopernicus Sentinelデータ（2016年・2017年）を含む · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>',
    hint: 'ドラッグで回転 · スクロールで近づく · タップでその地点を読む · Lでレイヤー · /で検索 · Mでサウンド',
    intro: '今日のデータが語る、この星のいま。',
    exploreAlone: '自由に探索する',
    noWebgl: '地球を表示するには、WebGL 2に対応したブラウザが必要です。',
    clock: (day: string, time: string) => `${day} · ${time} UTC`,
    about: 'なぜUpariなのか',
  },

  stories: { pianeta: 'いまの地球', natura: '自然', persone: '人々' },

  compass: { N: 'N', S: 'S', E: 'E', W: 'W' },

  units: { km: 'km', kmh: 'km/h' },

  when: { today: '今日', yesterday: '昨日', on: (day: string) => `${day}`, recent: '最近' },

  station: {
    name: '宇宙ステーション',
    panel: 'いまの宇宙ステーション',
    title: '宇宙ステーション · 現在',
    alt: '高度',
    speed: '速度',
    below: '眼下',
    light: '船内',
    pos: '位置',
    orbit: '周回',
    day: '昼',
    night: '夜',
    sunsetIn: (min: string) => `${min}分後に日没`,
    sunriseIn: (min: string) => `${min}分後に日の出`,
    orbitOfDay: (n: number) => `今日${n}周目`,
  },

  explore: {
    title: '探索',
    year: '年',
    playYears: '年を再生する',
    reach: '宇宙ステーションへ',
    hour: '時刻',
    now: '現在',
    backToNow: '現在に戻る',
    hoursFromNow: '現在からの時間',
    realLight: '実際の太陽光',
    clouds: '雲',
    spin: 'ゆっくり回転',
    groups: { planet: '地球', nature: '自然', people: '人々' },
    layers: {
      adesso: 'いまの地球', venti: '風', correnti: '海流', mare: '海面水温',
      anomalia: '平年より温かい海', plancton: '植物プランクトン', pioggia: '雨（過去24時間）',
      fuochi: '火災（過去7日間）', terremoti: '地震（過去7日間）', ghiaccio: '海氷',
      luci: '夜の灯り', stazione: '宇宙ステーション',
      verde: '植生（月ごと）', foreste: '失われた森林（2001–2024年）', aria: '大気中の塵と煙',
      coralli: 'サンゴ礁の熱ストレス',
      popolazione: '人口', nascite: '出生率', mortalita: '死亡率', saldo: '自然増減',
      vita: '平均寿命', bambini: '5歳未満児死亡率', elettricita: '電気へのアクセス',
      disoccupazione: '失業率（ILO推計）', asilo: '庇護申請',
    },
  },

  credits: {
    title: 'これらの画像はどこから来たのか',
    intro: 'ここに見えるものは、すべて本物のデータだ。作りものの画像は一枚もない。衛星が見ることのできない場所では、地図は淡く消えていく。',
    items: [
      ['昼の地球', 'NASA Blue Marble Next Generation、NASA GIBS経由'],
      ['夜の地球', 'NASA Black Marble、VIIRS 2016、NASA GIBS経由'],
      ['雲', 'NASA Visible Earth、雲の合成画像'],
      ['起伏', 'AWS上のMapzen Terrain Tiles：USGS SRTMおよびGMTED2010、NOAA ETOPO1、EU-DEM Copernicus、その他各国の標高モデル'],
      ['近景', '<a href="https://cloudless.eox.at" target="_blank" rel="noopener">EOxCloudless 2016</a>、EOX IT Services GmbH作成（改変されたCopernicus Sentinelデータ〔2016年・2017年〕を含む）、<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>'],
      ['風', 'NOAA GFS 0.5°、PacIOOS ERDDAP経由'],
      ['海流', 'OSCAR、ESR / NASA、NOAA CoastWatch ERDDAP経由'],
      ['海面水温と偏差', 'GHRSST MUR、NASA JPL、NASA GIBS経由'],
      ['氷', 'GHRSST GAMSSA、オーストラリア気象局（Bureau of Meteorology）、NASA GIBS経由'],
      ['植物プランクトン', 'NASA PACE OCI、NASA GIBS経由'],
      ['雨', 'NASA GPM IMERG、NASA GIBS経由'],
      ['植生', 'NASA VIIRS（Suomi NPP）、月別NDVI、NASA GIBS経由'],
      ['塵と煙', 'NASA GMAO MERRA-2、エアロゾルの光学的厚さ、NASA GIBS経由'],
      ['失われた森林', 'Hansen et al. 2013、University of Maryland、Global Forest Watch経由、CC BY 4.0'],
      ['サンゴ礁', 'NOAA Coral Reef Watch、Degree Heating Week 5 km、PacIOOS ERDDAP経由'],
      ['地震', 'USGS Earthquake Hazards Program、過去7日間のフィード'],
      ['火災', 'NASA FIRMS、VIIRS NOAA-20'],
      ['宇宙ステーション', 'CelesTrakの軌道要素、satellite.jsによるSGP4伝播計算。3DモデルはNASA 3D Resources「ISS (B)」、Michael D. Carbajal作'],
      ['星', 'Yale Bright Star Catalogue'],
      ['人々', 'World Bank、World Development Indicators（UN World Population Prospects、UN IGME、ILOのデータを含む）、CC BY 4.0。庇護申請はUNHCR Refugee Data Portal、CC BY 4.0。国境はNatural Earth、パブリックドメイン'],
      ['音楽と効果音', 'Magnific（Google Lyria、ElevenLabs）を使い、Upariのために作曲'],
      ['場所の検索', '<a href="https://nominatim.org" target="_blank" rel="noopener">Nominatim</a>、データ © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors、ODbL'],
      ['翻訳', 'イタリア語の原文から、Claude（Anthropic）の助けを借りて執筆'],
    ],
    foot: 'その日のデータは毎朝更新される。画像はNASA ESDISの一部であるNASA GIBSのサービスによる。すべての帰属表示とライセンスは<a href="THIRD_PARTY_NOTICES.md" target="_blank" rel="noopener">THIRD_PARTY_NOTICES</a>に記載。Upariは<a href="https://netmilk.ch" target="_blank" rel="noopener">Netmilk Studio</a>のプロジェクトで、Apache 2.0ライセンスのフリーソフトウェアである：<a href="https://github.com/enuzzo/upari" target="_blank" rel="noopener">ソースコード</a>。',
  },

  about: {
    kicker: 'なぜUpariなのか',
    title: '雨のように、タダで。',
    lead: 'Upariは、いまこの瞬間の地球だ。今日の風、昨日の海、今週の火災と地震。そして、あなたがこの一行を読んでいるあいだにも頭上をすべっていく宇宙ステーション。絵筆で描き足したものは何ひとつない。ここに見えるものは、衛星とセンサーが測り、見ようとする人なら誰にでも手渡してくれたものだ。私たちは、ただ耳を澄ますことを覚えただけ。',
    aims: 'これを作った目的は三つ。この順番で。あなたを驚かせること。あなたに伝えること。そして、このとんでもない、くるくる回る、宇宙にひとつきりの岩のかたまりに、どうしようもなく恋をさせること。この順番なのには理由がある。退屈なものを守ろうとした人など、これまで一人もいないのだから。',
    costTitle: 'お代は',
    cost: '一円もいらない。タダだ。太陽の光がタダであるように。雨がタダであるように。今朝、あなたの髪をくしゃくしゃにするためだけにはるばる海を越えてきて、請求書の一枚もよこさなかったあの風のように。広告なし。アカウントなし。あとをつけてくる者もいない。',
    price: 'そのかわり、お願いがひとつだけある。ただし、安くはない。',
    child: '子どもの目で、見つめてほしい。',
    warrior: '戦士の勇気で、守ってほしい。',
    both: 'できれば、その両方を同時に。子どもは怖いもの知らずだし、どんな戦士もかつては子どもだった。',
    whoTitle: '私たちについて',
    who: '私たちはNetmilk Studio。ウェブサイトを作って生計を立て、ときどき、こういうものを作る。愛のほかに、たいした理由もなく。UpariはApache 2.0ライセンスのオープンソースだ。分解して、そこから学んで、もっと良くしてほしい。惑星はひとつしかない。でもコードなら、少なくともフォークできる。',
    visit: 'Netmilk Studioを訪ねる',
    source: 'ソースコード',
    signoff: '地球でつくりました。',
  },

  countries: {
    CD: 'コンゴ民主共和国', CG: 'コンゴ共和国', CYN: '北キプロス', SOL: 'ソマリランド', HK: '香港', MO: 'マカオ',
    PS: 'パレスチナ', MM: 'ミャンマー', VC: 'セントビンセント・グレナディーン',
  },

  sea: {
    arctic: { in: '北極海で', name: '北極海' },
    southern: { in: '南極海で', name: '南極海' },
    med: { in: '地中海で', name: '地中海' },
    red: { in: '紅海で', name: '紅海' },
    persian: { in: 'ペルシャ湾で', name: 'ペルシャ湾' },
    mexico: { in: 'メキシコ湾で', name: 'メキシコ湾' },
    caribbean: { in: 'カリブ海で', name: 'カリブ海' },
    southChina: { in: '南シナ海で', name: '南シナ海' },
    indonesia: { in: 'インドネシアの島々のあいだで', name: 'インドネシア' },
    indianSouth: { in: 'インド洋南部で', name: 'インド洋南部' },
    indian: { in: 'インド洋で', name: 'インド洋' },
    atlanticNorth: { in: '北大西洋で', name: '北大西洋' },
    atlanticTropical: { in: '熱帯大西洋で', name: '熱帯大西洋' },
    atlanticSouth: { in: '南大西洋で', name: '南大西洋' },
    atlanticSouthern: { in: '熱帯大西洋南部で', name: '熱帯大西洋南部' },
    pacificNorth: { in: '北太平洋で', name: '北太平洋' },
    pacificTropical: { in: '熱帯太平洋で', name: '熱帯太平洋' },
    pacificSouth: { in: '南太平洋で', name: '南太平洋' },
    pacificSouthern: { in: '熱帯太平洋南部で', name: '熱帯太平洋南部' },
  },

  quake: {
    distance: (km: string, place: string) => `${place}から${km}kmの地点`,
    near: (place: string) => `${place}付近`,
    region: (place: string) => `${place}一帯`,
    regions: { sandwich: '南サンドウィッチ諸島', kermadec: 'ケルマデック諸島', ridge: '大西洋中央海嶺' },
  },

  probe: {
    asylum: (n: string) => `庇護申請${n}件`,
    noAsylum: '公表された申請なし',
    noData: 'この年のデータなし',
    directions: ['北', '北東', '東', '南東', '南', '南西', '西', '北西'],
    windFrom: (dir: string) => `${dir}の風`,
    waterTo: (dir: string) => `水は${dir}へ流れる`,
    magnitude: (m: string) => `マグニチュード${m}`,
    quake: (place: string, depthKm: string, ago: string) => `${place} · 深さ${depthKm} km · ${ago}`,
    lessThanHour: '1時間以内',
    hoursAgo: (h: number) => `${h}時間前`,
    daysAgo: (d: number) => `${d}日前`,
    noQuake: 'ここでは地震なし',
    noQuakeSub: 'マグニチュード2.5以上、過去7日間',
    fires: (n: number, s: string) => `火災${s}件`,
    noFire: '火災なし',
    firesSub: '半径150 km以内、過去7日間',
    solarDay: '太陽時 · 昼',
    solarNight: '太陽時 · 夜',
    solarDusk: '太陽時 · 薄明',
  },

  data: {
    anomaly: (signed: string) => `平年比${signed} °C`,
    rainTrace: 'ごく弱い雨',
    rain: (mm: string) => `1時間に${mm} mmの雨`,
    ice: (pct: string) => `海氷${pct}%`,
    bare: 'ほぼ裸地',
    ndvi: (v: string) => `緑の濃さ${v}（NDVI）`,
    noStress: '熱ストレスなし',
    coral: (v: string) => `熱ストレス${v}（°C週）`,
    forest: (year: number) => `${year}年に失われた森林`,
    aerosol: (v: string) => `大気のかすみ${v}（AOD）`,
  },

  atlas: {
    population: {
      title: '人口', left: '', right: '', source: 'World Bank, World Development Indicators · SP.POP.TOTL（国連、各国統計局、Eurostat）',
      format: (v: number) => people(v),
    },
    birth: {
      title: '人口1,000人あたりの出生数', left: '5', right: '50', source: 'World Bank, World Development Indicators · SP.DYN.CBRT.IN',
      format: (v: number) => `1,000人あたり${num(v, 1)}人の出生`,
    },
    death: {
      title: '人口1,000人あたりの死亡数', left: '2', right: '30', source: 'World Bank, World Development Indicators · SP.DYN.CDRT.IN',
      format: (v: number) => `1,000人あたり${num(v, 1)}人の死亡`,
    },
    balance: {
      title: '出生数−死亡数（1,000人あたり）', left: '−10', right: '+40', source: 'World Bank, World Development Indicators · 出生率−死亡率（Upariによる計算）',
      format: (v: number) => `1,000人あたり${v > 0 ? '+' : v < 0 ? '−' : ''}${num(Math.abs(v), 1)}`,
    },
    life: {
      title: '出生時の平均寿命', left: '35歳', right: '85', source: 'World Bank, World Development Indicators · SP.DYN.LE00.IN',
      format: (v: number) => `${num(v, 1)}歳`,
    },
    under5: {
      title: '5歳になる前に亡くなる子ども（1,000人あたり）', left: '0', right: '300', source: 'UN IGME、World Bank WDI経由 · SH.DYN.MORT',
      format: (v: number) => `出生1,000人あたり${num(v)}人`,
    },
    electricity: {
      title: '電気を使える人の割合', left: '0%', right: '100%', source: 'World Bank, SDG 7.1.1 · EG.ELC.ACCS.ZS',
      format: (v: number) => `人口の${num(v)}%`,
    },
    unemployment: {
      title: '失業率（ILOモデル推計）', left: '0%', right: '30%', source: 'ILOモデル推計、World Bank WDI経由 · SL.UEM.TOTL.ZS',
      format: (v: number) => `労働力人口の${num(v, 1)}%`,
    },
  },

  legends: {
    wind: { title: '風速', left: '静穏', right: '80 km/h' },
    currents: { title: '流速', left: 'ゆるやか', right: '4 km/h' },
    sst: { title: '水温', left: '−2 °C', right: '34 °C' },
    anomaly: { title: '平年との差', left: '−3 °C', right: '+3 °C' },
    chlorophyll: { title: '海面のクロロフィル', left: '澄んだ水', right: 'ブルーム' },
    rain: { title: '雨の強さ', left: '霧雨', right: '豪雨' },
    quakes: { title: '震源の深さ', left: '地表付近', right: '700 km' },
    ice: { title: '凍った海', left: '15%', right: '100%' },
    asylum: { title: '庇護申請（出身国別）', left: 'シリア · ウクライナ', right: 'アフガニスタン' },
    ndvi: { title: '大地の緑の濃さ（NDVI）', left: '裸地', right: '深い森' },
    forest: { title: '失われた木々（年別）', left: '数年前', right: '今年' },
    aerosol: { title: '粒子がさえぎる光の量（AOD）', left: '澄んだ空気', right: '濃い大気' },
    coral: { title: '蓄積した熱ストレス', left: '0', right: '20 °C週' },
  },

  // ——— いまの地球 ———

  pianeta: {
    title: '地球', kicker: 'いま',
    narrate: 'これが、いまこの瞬間の地球だ。半分は昼、半分は夜。昼と夜の境目は、赤道の上を時速1,670kmですべっていく。',
    facts: [
      ['1,670 km/h', '赤道での自転の速さ'],
      ['8分20秒', '太陽の光がここに届くまでの時間'],
    ],
    hour: 'いま見ている地球の時刻。光は本物だ',
    text: '昼、夜、薄明は、いまこの瞬間に合わせて計算している。雲は今日の風に乗って流れ、太陽が低くなると山々が影を落とす。',
    source: 'NASA Blue Marble · NASA Black Marble · Mapzen/AWS地形モデル · NOAA GFSの風',
  },
  respiro: {
    title: '息吹', kicker: '今日の風',
    narrate: (p: { where: string; kmh: string }) => `大気は、ひとときも止まらない。これが今日の風だ。熱帯の熱を極へと運ぶ、目に見えない川。いま最も強い風が吹いているのは${p.where}、時速${p.kmh}kmに達している。`,
    strongest: (coords: string) => `いま最も強い風、${coords}`,
    facts: [
      ['10 m', '風を測る地上からの高さ'],
      ['× 22,000', '動きが見えるよう、風の軌跡を早回しにした倍率'],
    ],
    text: '高気圧と低気圧は、北半球と南半球で逆向きに回る。風を曲げているのは地球の自転だ。地点をタップすると、風速と風向が読める。',
    source: (time: string) => `NOAA GFS 0.5°モデル · ${time} UTCの解析`,
    pin: 'いま最も強い風',
  },
  correnti: {
    title: '海流', kicker: '海の中の川',
    narrate: '波の下にも、海には海の川がある。メキシコ湾流は、地球上のすべての川を合わせた何十倍もの水を運び、熱帯のぬくもりを少しだけ、遠くヨーロッパまで届けている。',
    facts: [
      ['毎秒3,000万m³', 'フロリダ沖を流れるメキシコ湾流の水量'],
      ['毎秒120万m³', '世界中の川をすべて合わせた水量'],
      ['15 m', '表示している表層の水の厚さ'],
    ],
    text: 'ここに示した海流は、9月のある一日のものだ。大きな海流は年ごとにゆっくりとしか変わらないが、その縁にできる渦は、数週間のうちに生まれては消えていく。',
    source: 'OSCAR · NOAA CoastWatch ERDDAP · 2014年9月26日、解像度1/3°',
  },
  calore: {
    title: '海の熱', kicker: '海面水温の一年',
    narrate: (p: { when: string; today: boolean; where: string; temp: string | null }) => `海は、この星の巨大な暖房装置だ。${p.when}、いちばん温かい海は${p.where}、水温は${p.temp ? `${p.temp}度` : '32度以上'}${p.today ? 'に達している' : 'に達していた'}。夏には温かい水が北へのぼり、冬には南へ戻っていく。その一年を、わずか数秒で。`,
    hottest: (when: string, coords: string) => `${when}のいちばん温かい海、${coords}`,
    facts: [
      ['−1.8 °C', '海水が凍りはじめる温度'],
      ['1 km', '元の地図の解像度'],
    ],
    text: '温室効果ガスによって生じた余分な熱の90%以上を、海が吸収している。暖流は、極へ向かってのびるオレンジ色の舌のように見える。',
    pin: 'いちばん温かい海',
  },
  febbre: {
    title: '海の発熱', kicker: '一年間、平年との比較',
    narrate: (p: { when: string; today: boolean; pct: string }) => `赤は平年より温かい海、青は冷たい海。ひと月ごとに、一年分。${p.when}、平年より温かい海は、海洋全体の${p.pct}%${p.today ? 'に及んでいる' : 'に及んでいた'}。`,
    share: '平年を上回る海面の割合',
    strongest: (where: string) => `${where}観測された最大の偏差`,
    over3: '+3超',
    normal: ['2003–2014', '「平年」とする基準期間'],
    text: '偏差とは、ある日の水温を、基準期間における同じ日の平均と比べたものだ。海洋熱波は数週間にわたって続き、サンゴや魚、海草の藻場を追いつめる。',
    source: 'GHRSST MUR偏差、NASA JPL',
    pin: '最大の偏差',
  },
  fioritura: {
    title: '花ひらく海', kicker: '植物プランクトンの一年',
    narrate: '緑の輝きのひとつひとつが、目に見えない草原だ。何十億もの微細な藻類、植物プランクトン。私たちが吸う酸素のおよそ半分を生み出し、春が訪れる場所で花ひらく。まず一方の半球で、それからもう一方で。',
    oxygen: ['≈ 50%', '地球の酸素のうち、海から来る割合'],
    days: (n: number) => `${n}日間`,
    daysLabel: '分の観測を重ね合わせ、雲を取り除いている',
    range: '1立方メートルあたりのクロロフィル量（mg）、青から緑へ',
    text: 'ブルームは、季節と栄養豊かな水を追いかける。深層の水がわき上がる沿岸や、春を迎えた高緯度の海で。10月の南半球は春だ。',
  },
  pioggia: {
    title: '雨', kicker: '24時間',
    narrate: '丸一日の雨を、わずか数秒で。赤道に沿って暖かい空気がのぼり、冷やされ、太陽が海から奪った水を、ふたたび海へ返していく。',
    interval: ['30分', 'GPM衛星群の画像の撮影間隔'],
    hours: '24時間',
    since: (time: string) => `${time} UTCから`,
    yearly: ['≈ 1 m', '地球全体に一年間に降る雨の平均'],
    text: (last: string) => `各フレームは衛星による降水量の推定値で、画像と画像のあいだは補間している。最新フレーム：${last} UTC。`,
  },
  fuoco: {
    title: '火', kicker: '過去7日間',
    narrate: (p: { thousands: string; approx: string }) => `火花のひとつひとつが、宇宙から見た火災だ。7日間で、衛星が数えた火は${p.approx}か所を超える。そのほとんどは、私たちがつけた火だ。畑を片づけるため、放牧地を広げるために。`,
    count: '7日間に検出された熱源の数',
    facts: [
      ['375 m', '火をとらえる画素の大きさ'],
      ['1日2回', '昼と夜に、NOAA‑20が地上のあらゆる地点の上を通過する'],
    ],
    text: '各点の明るさは、火の強さに比例している。新しいものほど明るく輝く。アフリカ南部と南アメリカは、いま農地の野焼きの季節だ。',
    source: (day: string) => `NASA FIRMS · VIIRS NOAA-20 · ${day}更新`,
  },
  terremoti: {
    title: '震える地球', kicker: '過去7日間',
    narrate: (p: { count: string; mag: string; where: string }) => `7日間で、地球はマグニチュード2.5以上の揺れに${p.count}回見舞われた。その一週間が、数秒で流れていく。最も強かったのはマグニチュード${p.mag}、${p.where}で起きた。震源をつなぐと、プレートの境界が浮かび上がる。`,
    count: 'マグニチュード2.5以上の地震（過去7日間）',
    strong: 'うちマグニチュード5以上',
    deepest: (where: string) => `最も深い地震、${where}`,
    text: '点のひとつひとつが地震で、大きさはマグニチュードを、色は震源の深さを表す。浅いものは琥珀色、中くらいの深さはピンク、300kmより深いものは紫。そこでは、一枚のプレートがもう一枚の下へ沈み込んでいる。アメリカ合衆国の外では、USGSの観測網が記録するのは主にマグニチュード4以上の地震だ。',
    source: (day: string) => `USGS Earthquake Hazards Program · ${day}更新`,
    pin: (mag: string) => `マグニチュード${mag}`,
    pinSub: '今週最大の地震',
  },
  ghiaccio: {
    title: '氷', kicker: '極地の一年',
    narrate: (p: { when: string; today: boolean; area: string }) => `世界のてっぺんで、海が凍る。${p.when}、北極の海氷は${num(value(p.area) * 100)}万平方キロメートルを${p.today ? '覆っている' : '覆っていた'}。冬が来るたびに、氷はヨーロッパより広い面積を広げる。ここでは一年が流れていく。北極が融けるあいだに、南極は凍っていく。`,
    area: (mkm2: string) => `${num(value(mkm2) * 100)}万km²`,
    arctic: (when: string) => `${when}の北極の海氷`,
    antarctic: '南極大陸をとりまく海氷',
    decline: ['−12%', '10年あたり。1979年以降、北極の夏の最小面積が減ってきた割合'],
    text: '面積は、海氷が15%以上ある海域を、密接度で重みづけして合計したもの。氷は太陽の光を跳ね返す。氷が退くと、暗い海がより多くの熱を吸収する。',
    source: 'GHRSST GAMSSA、Bureau of Meteorology · 海氷密接度',
  },
  luci: {
    title: '灯り', kicker: 'いまの夜',
    narrate: '夜が訪れると、この星に灯がともる。この光は、私たちがどこに暮らしているかを最も正直に描いた肖像だ。海岸に沿って、川に沿って、道に沿って。',
    facts: [
      ['≈ 57%', '都市に暮らす人類の割合'],
      ['742 m', '衛星が夜の光を撮影する画素の大きさ'],
      ['2016', '雲も月明かりもない、夜のモザイク画像の年'],
    ],
    text: 'ナイル川の光の川、ヨーロッパのくもの巣、日本の海岸線。光は、そこにないものも語る。ほとんど真っ暗な大森林や砂漠のように。',
    source: 'NASA Black Marble · VIIRS 2016',
  },
  lassu: {
    title: 'はるか上空', kicker: 'いまの宇宙ステーション',
    narrate: (p: { alt: string; speed: string }) => `そして、はるか上空${p.alt}km。宇宙ステーションが時速${p.speed}kmで、このすべてのまわりを巡っている。92分で一周。一日に16回、日の出を迎える。`,
    arrive: (p: { below: string; day: boolean | null; minutes: string }) => `これが、いま乗組員が窓から見ている景色だ。眼下には${p.below}。${p.day === null ? '' : p.day ? `船内は昼。次の日没まで${p.minutes}分。` : `船内は夜。次の日の出まで${p.minutes}分。`}`,
    alt: 'いまこの瞬間の高度',
    speed: 'およそ秒速7.7km',
    dawns: ['16', '乗組員が一日に迎える日の出と日没の回数'],
    text: '位置は、CelesTrakが公開する軌道要素から、いま計算している。線は一周分の軌道で、30分前から1時間後までを示す。近づくと、ステーションは実際の姿勢で飛んでいる。モジュールは進行方向に沿い、トラスは軌道に対して直角に。',
    source: 'NORAD 25544の軌道要素 · CelesTrak · SGP4伝播計算 · NASA 3Dモデル',
  },

  // ——— 自然 ———

  verde: {
    title: '緑の呼吸', kicker: '植生の一年',
    narrate: (p: { hi: string; hiMonth: string; lo: string; loMonth: string }) => `地球は季節とともに呼吸している。北緯30度から65度のあいだでは、${p.hiMonth}には陸地の${p.hi}%を葉が覆い、${p.loMonth}にはわずか${p.lo}%になる。そして緑は、もう一方の半球へと移っていく。`,
    dense: (month: string) => `${month}、北緯30°～65°の陸地のうち植生が密な割合（NDVI 0.5超）`,
    sparse: (month: string) => `${month}`,
    months: (n: number) => `${n}か月`,
    span: (from: string, to: string) => `${from}から${to}まで`,
    text: 'NDVIは、葉が吸収する赤い光と、葉が反射する近赤外線を比べた指標だ。値が高いほど、植生は密で活発である。各フレームは1か月の平均で、雲がひと月じゅう覆っていた場所では値が欠けている。',
    source: 'NASA VIIRS（Suomi NPP）· 月別NDVI · GIBS',
  },
  foreste: {
    title: '失われた森', kicker: '失われた樹冠被覆、2001–2024年',
    narrate: (peak: number) => `どの点も、もうそこにはない森のかけらだ。伐られ、焼かれ、畑に変えられた。消えた年に光り、やがて傷あとになる。記録のなかで最悪の年は、${peak}年だった。`,
    peak: '2001年以降、損失が最も大きかった年',
    recent: (from: number, to: number) => `記録全体の損失のうち、直近5年間（${from}–${to}年）に起きた割合`,
    early: (from: number, to: number) => `最初の5年間（${from}–${to}年）`,
    text: '樹冠被覆の損失とは、高さ5メートル以上の木が、30メートル四方の画素から消えたこと。原因は火災、伐採、病気などだ。森林破壊と森林管理を区別せず、再生も数えない。ここでは1点あたり約10kmに縮小している。年ごとの割合はこの地図上で、強度で重みづけして計算した。',
    source: 'Hansen et al. 2013, University of Maryland · Global Forest Watch v1.12 · CC BY 4.0',
  },
  aria: {
    title: '大気', kicker: '塵と煙の一年',
    narrate: (p: { where: string; month: string; worst: string }) => `大西洋をわたるサハラの砂、山火事の煙、都市のスモッグ。大気はあらゆるものを運んでいく。この一年でいちばん厚いベールがかかったのは、${p.month}の${p.where}上空。地球全体でいちばん霞んだ月は、${p.worst}だった。`,
    thickest: (where: string, month: string) => `この一年で最大の光学的厚さ：${where}、${month}`,
    worst: '地球全体の平均で、大気が最も濁った月',
    wavelength: ['550 nm', '測定に使う緑色光の波長'],
    text: 'エアロゾルの光学的厚さは、大気中に浮かぶ粒子が太陽の光をどれだけさえぎるかを示す。0.1なら澄んだ空気、1を超えると空は不透明になる。これは衛星観測と大気モデルを融合したNASAの再解析MERRA-2による推定値で、それだけでは塵と煙を見分けられない。',
    source: 'NASA GMAO · MERRA-2 · 波長550 nmのエアロゾル光学的厚さ、月別 · GIBS',
  },
  coralli: {
    title: 'サンゴ礁', kicker: '海の熱の一年',
    narrate: (p: { now: string; peakMonth: string | null; peak: string }) => `海が何週間も温かすぎるままだと、サンゴは自らを養う藻を追い出し、白くなる。いま、熱帯の海の${p.now}%がその閾値を超えている。${p.peakMonth ? `この一年のピークは${p.peakMonth}で、${p.peak}%に達した` : 'この一年で最も高い値だ'}。`,
    alert: '4 °C週を超えた熱帯の海（30° N – 30° S）の割合。白化が起こりやすい',
    severe: '8を超えた割合。多くのサンゴが死ぬ',
    worst: (pct: string) => `この一年で最も深刻だった月（${pct}%）`,
    text: 'ディグリー・ヒーティング・ウィーク（Degree Heating Weeks）は、過去12週間に、海水がその場所のふだんの最高水温をどれだけ上回ったかを積み上げた値だ。この指標は海全体に当てはまるが、サンゴ礁があるのは、水が浅く澄んだ場所だけである。',
    source: 'NOAA Coral Reef Watch v3.1 · 5 km · PacIOOS ERDDAP経由',
  },

  // ——— 人々 ———

  wdiNote: WDI_NOTE,
  popolazione: {
    title: '80億人', kicker: '人口、1960–2025年',
    narrate: (p: { then: string; now: string }) => `1960年、私たちは${oku(p.then)}人だった。2025年のいまは${oku(p.now)}人。光の点ひとつが25万人を表し、人々が暮らす場所に、年を追って灯っていく。`,
    billions: (b: string) => `${oku(b)}人`,
    total: '2025年の人口。217の国と地域の合計',
    dot: ['25万人', '光の点ひとつが表す人数'],
    largest: (people: string) => `最も人口の多い国：${people}`,
    text: '点は、各国のなかで夜に明かりがある場所（NASA Black Marble）に散らしてある。人が暮らす場所を示すもので、正確な住所ではない。年ごとに、その年の人口を数えるのに必要な数だけ点が灯る。',
    borders: 'Natural Earthの国境',
  },
  nascite: {
    title: '減りゆく誕生', kicker: '出生率、1960–2024年',
    narrate: (p: { then: string; now: string; top: string }) => `1960年には、人口1,000人あたり${p.then}人の子どもが生まれていた。2024年には${p.now}人。減少はほぼ世界中に及び、いま最も高いのは${p.top}だ。`,
    world: '2024年の世界の、人口1,000人あたり出生数（人口加重平均）',
    highest: (country: string) => `最も高い国：${country}`,
    lowest: (country: string) => `最も低い国：${country}`,
    text: '粗出生率。人口の年齢構成にも左右される。',
  },
  vita: {
    title: '延びる命', kicker: '平均寿命、1960–2024年',
    narrate: (p: { then: string; now: string }) => `1960年に生まれた子どもは、平均で${p.then}歳まで生きると見込まれていた。いまは${p.now}歳。この時代の大きな達成のひとつであり、まだ終わってはいない。`,
    years: (y: string) => `${y}歳`,
    world: '2024年の世界の、出生時の平均寿命（人口加重平均）',
    highest: (country: string) => `最も長い国：${country}`,
    lowest: (country: string) => `最も短い国：${country}`,
    text: '期間指標。いま生まれた人が、その年の年齢別の死亡リスクが変わらないとした場合に生きる年数である。急な落ち込みは、戦争、飢饉、感染症の流行だ。',
  },
  bambini: {
    title: '子どもたち', kicker: '5歳未満児死亡率、1960–2024年',
    narrate: (p: { many: string; top: string; now: string; then: string | null }) => `1960年、${p.many}か国で、子どもの4人に1人以上が5歳を迎える前に亡くなっていた。いま最も高いのは${p.top}で、1,000人あたり${p.now}人${p.then ? `。1960年には${p.then}人だった` : ''}。`,
    then: '1960年に、出生1,000人あたり250人以上が亡くなっていた国の数',
    now: '2024年に、1,000人あたり100人以上の国の数',
    goal: ['SDG 3.2', '国連の目標：2030年までに1,000人あたり25人以下'],
    text: 'UN IGMEによる期間推計。死亡数の集計でも、ひとりひとりの子どもの運命でもない。小さな差は、確かな違いとは言えない。',
  },
  saldo: {
    title: '差し引き', kicker: '出生数−死亡数、1960–2024年',
    narrate: (n: string) => `出生数から死亡数を引く。いま${n}か国で、生まれる人より亡くなる人のほうが多い。青で示した国々で、多くはヨーロッパと東アジアにある。琥珀色の国では、人口がおのずと増えている。`,
    now: '2024年に死亡数が出生数を上回った国の数',
    then: '1960年には何か国だったか',
    world: '2024年の世界の自然増減',
    text: 'Upariが、同じ国・同じ年の出生率から死亡率を引いて計算した。両方の値がそろう場合に限る。移民は数えていないため、自然増減がマイナスでも人口が増える国はある。',
  },
  luce: {
    title: '電気の灯り', kicker: '電気へのアクセス、2000–2024年',
    narrate: (p: { then: string; now: string; without: string }) => `2000年、電気を使える人は${p.then}%だった。いまは${p.now}%。それでも${people(value(p.without) * 1e6)}が、いまだ電気のない暮らしを送っている。その多くはサハラ以南のアフリカだ。`,
    world: '2024年に電気を使える人の割合（人口加重平均）',
    millions: (m: string) => people(value(m) * 1e6),
    first: (country: string) => `${country}で電気のない人々`,
    second: (country: string) => `${country}`,
    text: '送電網、ミニグリッド、独立型システムによる電気へのアクセス。供給の安定性や質、料金については何も示さない。2000年から始まるのは、それ以前は多くの国で値がないためだ。',
  },
  fuga: {
    title: '逃れる人々', kicker: '庇護申請、2011–2024年',
    narrate: (p: { year: number; total: string }) => `シリア、ウクライナ、アフガニスタンから逃れた人々と、彼らが庇護を求めた国。シリア内戦は${p.year}年に頂点に達する。一年で${p.total}件の申請。`,
    peak: (origin: string, year: number) => `${origin}からの申請、${year}年（ピークの年）`,
    text: '政府当局に新たに提出された個人の申請を、申請先の国ごとに数えたもの。出身国は三つだけで、移住のすべてでも、重複のない人数でもない。2022年以降、ウクライナを離れた人の大半はEUで一時的保護を受けており、ここには含まれていない。弧は首都どうしを結んだ模式的なもので、実際に観測された移動経路ではない。',
    source: 'UNHCR, Refugee Data Portal · AsylumApplications, CC BY 4.0',
  },
};

export default ja;
