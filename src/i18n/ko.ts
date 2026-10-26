import { num } from './format';
import type { Dict } from './it';

// 한국어. 내레이션은 다큐멘터리의 평서체(-다), 시스템 안내는 -습니다.

/** Does the last Hangul syllable end in a consonant? null when the word does not end in Hangul. */
function batchim(word: string): { yes: boolean; rieul: boolean } | null {
  const c = word.replace(/[\s)\]"'’”.,·]+$/u, '').slice(-1).charCodeAt(0) - 0xac00;
  if (!(c >= 0 && c <= 11171)) return null;
  const final = c % 28;
  return { yes: final !== 0, rieul: final === 8 };
}
/** The word with the right form of a particle: after a consonant, after a vowel, or when unknown. */
const josa = (word: string, consonant: string, vowel: string, unknown: string) => {
  const b = batchim(word);
  return word + (b === null ? unknown : b.yes ? consonant : vowel);
};
/** "니제르다", "차드이다". */
const ida = (w: string) => josa(w, '이다', '다', '(이)다');
/** "7월이었다", "2024년이었다". */
const ieotda = (w: string) => josa(w, '이었다', '였다', '(이)었다');

const group = (d: string) => d.replace(/\B(?=(\d{3})+$)/g, ',');
/** A string of digits in Korean units, four places at a time: "8120000000" → "81억 2,000만". */
function koDigits(d: string): string {
  const units = ['', '만', '억', '조'];
  const out: string[] = [];
  let rest = d.replace(/^0+(?=\d)/, '');
  for (let i = 0; rest && i < units.length; i++) {
    const chunk = rest.slice(-4).replace(/^0+/, '');
    rest = rest.slice(0, -4);
    if (chunk) out.unshift(group(chunk) + units[i]);
  }
  return out.join(' ') || '0';
}
/**
 * A number already written by num() ("8.12" billions, "685" millions) moved into 만 and 억:
 * the decimal point only slides to the right, no arithmetic. null if the shape is unexpected.
 */
function shifted(s: string, zeros: number): string | null {
  const m = /^(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d+))?$/.exec(s.trim());
  if (!m || (m[2] ?? '').length > zeros) return null;
  return koDigits(m[1].replace(/,/g, '') + (m[2] ?? '').padEnd(zeros, '0'));
}
/** "8.1" (billions) → "81억". */
const billions = (s: string) => shifted(s, 9) ?? `${s}십억`;
/** "685" (millions) → "6억 8,500만"; "4.3" → "430만". */
const millions = (s: string) => shifted(s, 6) ?? `${s}백만`;

const WDI_NOTE = '원래의 연간 값이며, Upari가 덧붙인 추정치는 없다: 어느 해에 값이 없는 나라는 회색으로 남는다. 색은 한 해에서 다음 해로 부드럽게 흘러가지만, 숫자는 그렇지 않다. 국경은 그 시절의 것이 아니라 오늘날의 Natural Earth 국경이다.';

const ko: Dict = {
  lang: { name: '한국어', locale: 'ko-KR', dir: 'ltr' },

  page: {
    title: 'Upari · 지금, 이 행성',
    description: 'Upari: 오늘의 위성 데이터로 들려주는 지구 이야기. 바람, 해류, 바다, 비, 불, 얼음, 밤의 불빛, 그리고 우주정거장.',
    globe: '지구본',
    home: '처음으로',
    stories: '이야기',
    search: '장소 검색',
    searchKey: '장소 검색 (/)',
    searchCredit: '검색 <a href="https://nominatim.org" target="_blank" rel="noopener">Nominatim</a> · 데이터 © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    searching: '찾는 중…',
    noPlace: '그런 이름의 장소가 없습니다.',
    searchDown: '검색이 응답하지 않습니다. 잠시 후 다시 시도해 주세요.',
    explore: '탐색: 레이어와 조작',
    exploreKey: '탐색 (L)',
    audio: '소리',
    audioKey: '소리 (M)',
    audioOn: '소리 켜기',
    audioOff: '소리 끄기',
    credits: '출처와 크레딧',
    fullscreen: '전체 화면',
    fullscreenKey: '전체 화면 (F)',
    language: '언어',
    more: '더 알아보기',
    next: (story: string) => `다음 이야기: ${story}`,
    chapters: '챕터',
    pause: '일시 정지',
    resume: '이야기 이어 보기',
    zoomIn: '확대',
    zoomOut: '축소',
    close: '닫기',
    tileCredit: '<a href="https://cloudless.eox.at" target="_blank" rel="noopener">EOxCloudless 2016</a>, EOX IT Services GmbH · 수정된 Copernicus Sentinel 2016·2017년 데이터 포함 · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>',
    hint: '드래그해서 돌리기 · 스크롤로 다가가기 · 한 점을 눌러 읽기 · L 레이어 · / 검색 · M 소리',
    intro: '오늘의 데이터로 들려주는, 이 행성의 이야기.',
    exploreAlone: '혼자 둘러보기',
    noWebgl: '행성을 보려면 WebGL 2를 지원하는 브라우저가 필요합니다.',
    clock: (day: string, time: string) => `${day} · ${time} UTC`,
    about: '왜 Upari인가',
  },

  stories: { pianeta: '지금, 이 행성', natura: '자연', persone: '사람들' },

  compass: { N: 'N', S: 'S', E: 'E', W: 'W' },

  units: { km: 'km', kmh: 'km/h' },

  when: { today: '오늘', yesterday: '어제', on: (day: string) => day, recent: '최근' },

  station: {
    name: '우주정거장',
    panel: '우주정거장, 지금',
    title: '우주정거장 · 지금',
    alt: '고도',
    speed: '속도',
    below: '아래',
    light: '선내',
    pos: '위치',
    orbit: '궤도',
    day: '낮',
    night: '밤',
    sunsetIn: (min: string) => `${min}분 뒤 해넘이`,
    sunriseIn: (min: string) => `${min}분 뒤 해돋이`,
    orbitOfDay: (n: number) => `오늘 ${n}번째`,
  },

  explore: {
    title: '탐색',
    year: '연도',
    playYears: '연도 재생',
    reach: '우주정거장으로 가기',
    hour: '시각',
    now: '지금',
    backToNow: '지금으로 돌아가기',
    hoursFromNow: '지금부터의 시간',
    realLight: '실제 햇빛',
    clouds: '구름',
    spin: '천천히 회전',
    groups: { planet: '행성', nature: '자연', people: '사람들' },
    layers: {
      adesso: '지금의 지구', venti: '바람', correnti: '해류', mare: '해수면 온도',
      anomalia: '평소보다 따뜻한 바다', plancton: '식물성 플랑크톤', pioggia: '비, 최근 24시간',
      fuochi: '불, 최근 7일', terremoti: '지진, 최근 7일', ghiaccio: '해빙',
      luci: '밤의 불빛', stazione: '우주정거장',
      verde: '식생, 달마다', foreste: '사라진 숲, 2001 – 2024', aria: '공기 속 먼지와 연기',
      coralli: '산호초에 쌓인 열',
      popolazione: '인구', nascite: '출생률', mortalita: '사망률', saldo: '자연 증감',
      vita: '기대 수명', bambini: '5세 미만 사망률', elettricita: '전기 보급률',
      disoccupazione: '실업률 (ILO 추정)', asilo: '망명 신청',
    },
  },

  credits: {
    title: '이 이미지들은 어디에서 왔을까',
    intro: '여기 보이는 모든 것은 실제 데이터다. 지어낸 이미지는 하나도 없다: 위성이 보지 못하는 곳에서는 지도가 흐려진다.',
    items: [
      ['낮의 지구', 'NASA Blue Marble Next Generation, NASA GIBS 경유'],
      ['밤의 지구', 'NASA Black Marble, VIIRS 2016, NASA GIBS 경유'],
      ['구름', 'NASA Visible Earth, 구름 합성 영상'],
      ['지형', 'AWS의 Mapzen Terrain Tiles: USGS SRTM과 GMTED2010, NOAA ETOPO1, EU-DEM Copernicus 및 여러 나라의 모델'],
      ['가까이에서', '<a href="https://cloudless.eox.at" target="_blank" rel="noopener">EOxCloudless 2016</a>, EOX IT Services GmbH (수정된 Copernicus Sentinel 2016·2017년 데이터 포함), <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>'],
      ['바람', 'NOAA GFS 0.5°, PacIOOS ERDDAP 경유'],
      ['해류', 'OSCAR, ESR / NASA, NOAA CoastWatch ERDDAP 경유'],
      ['바다와 이상 수온', 'GHRSST MUR, NASA JPL, NASA GIBS 경유'],
      ['얼음', 'GHRSST GAMSSA, 호주 Bureau of Meteorology, NASA GIBS 경유'],
      ['식물성 플랑크톤', 'NASA PACE OCI, NASA GIBS 경유'],
      ['비', 'NASA GPM IMERG, NASA GIBS 경유'],
      ['식생', 'NASA VIIRS (Suomi NPP), 월별 NDVI, NASA GIBS 경유'],
      ['먼지와 연기', 'NASA GMAO MERRA-2, 에어로졸 광학 두께, NASA GIBS 경유'],
      ['사라진 숲', 'Hansen et al. 2013, University of Maryland, Global Forest Watch 경유, CC BY 4.0'],
      ['산호초', 'NOAA Coral Reef Watch, Degree Heating Week 5 km, PacIOOS ERDDAP 경유'],
      ['지진', 'USGS Earthquake Hazards Program, 최근 7일 피드'],
      ['불', 'NASA FIRMS, VIIRS NOAA-20'],
      ['우주정거장', 'CelesTrak 궤도 요소, satellite.js의 SGP4 궤도 계산; 3D 모델 NASA 3D Resources, ISS (B), Michael D. Carbajal 제작'],
      ['별', 'Yale Bright Star Catalogue'],
      ['사람들', 'World Bank, World Development Indicators (UN World Population Prospects, UN IGME, ILO 데이터 포함), CC BY 4.0; 망명 신청 UNHCR Refugee Data Portal, CC BY 4.0; Natural Earth 국경, 퍼블릭 도메인'],
      ['음악과 소리', 'Magnific (Google Lyria, ElevenLabs)으로 Upari를 위해 만듦'],
      ['장소 검색', '<a href="https://nominatim.org" target="_blank" rel="noopener">Nominatim</a>, 데이터 © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors, ODbL'],
      ['번역', '이탈리아어 원문을 바탕으로 Claude (Anthropic)의 도움을 받아 씀'],
    ],
    foot: '그날의 데이터는 매일 아침 새로 고쳐진다. 영상은 NASA ESDIS에 속한 NASA GIBS 서비스에서 받았다. 전체 저작자 표시와 라이선스는 <a href="THIRD_PARTY_NOTICES.md" target="_blank" rel="noopener">THIRD_PARTY_NOTICES</a>에 있다. Upari는 <a href="https://netmilk.ch" target="_blank" rel="noopener">Netmilk Studio</a>의 프로젝트이며, Apache 2.0 라이선스를 따르는 자유 소프트웨어다: <a href="https://github.com/enuzzo/upari" target="_blank" rel="noopener">소스 코드</a>.',
  },

  about: {
    kicker: '왜 Upari인가',
    title: '비처럼, 공짜.',
    lead: 'Upari는 지금 이 순간의 지구다. 오늘의 바람, 어제의 바다, 이번 주의 불과 지진, 그리고 이 문장을 읽는 사이 머리 위를 미끄러져 가는 우주정거장. 손으로 그려 넣은 것은 하나도 없다. 여기 보이는 것은 위성과 센서가 재어서, 들여다볼 마음이 있는 누구에게나 건네준 것이다. 우리는 그저 귀 기울이는 법을 배웠을 뿐이다.',
    aims: '우리가 이것을 만든 이유는 세 가지, 순서대로다: 당신을 놀라게 하고, 알려 주고, 이 터무니없고 빙글빙글 도는, 세상에 하나뿐인 돌덩이와 대책 없이 사랑에 빠지게 하는 것. 순서가 중요하다. 지루한 것을 지키겠다고 나선 사람은 아무도 없으니까.',
    costTitle: '값은 얼마인가',
    cost: '없다. 공짜다. 햇빛이 공짜이듯, 비가 공짜이듯. 오늘 아침 오로지 당신 머리를 헝클어뜨리려고 대양을 건너와 놓고는 청구서 한 장 보낸 적 없는 바람처럼. 광고도, 계정도 없고, 당신 뒤를 몰래 따라다니는 누구도 없다.',
    price: '그 대가로 딱 하나만 부탁한다. 결코 싸지는 않다:',
    child: '아이의 눈으로 바라보라.',
    warrior: '전사의 용기로 지켜라.',
    both: '되도록이면 둘 다, 한꺼번에. 아이는 두려움을 모르고, 모든 전사는 한때 아이였다.',
    whoTitle: '우리는 누구인가',
    who: '우리는 Netmilk Studio다. 먹고살려고 웹사이트를 만들고, 가끔은 사랑 말고는 아무 이유 없이 이런 것을 만든다. Upari는 Apache 2.0 라이선스의 오픈 소스다: 뜯어보고, 배우고, 더 낫게 만들어 달라. 행성은 하나뿐이다. 코드라면, 적어도 포크할 수 있다.',
    visit: 'Netmilk Studio 방문하기',
    source: '소스 코드',
    signoff: '지구에서 만듦.',
  },

  countries: {
    CD: '콩고민주공화국', CG: '콩고 공화국', CYN: '북키프로스', SOL: '소말릴란드', HK: '홍콩', MO: '마카오',
    PS: '팔레스타인', VA: '바티칸', CF: '중앙아프리카 공화국',
  },

  // "in": where something happens, ready for a verb ("북대서양에서 분다"); "name": the bare name.
  sea: {
    arctic: { in: '북극해에서', name: '북극해' },
    southern: { in: '남극해에서', name: '남극해' },
    med: { in: '지중해에서', name: '지중해' },
    red: { in: '홍해에서', name: '홍해' },
    persian: { in: '페르시아만에서', name: '페르시아만' },
    mexico: { in: '멕시코만에서', name: '멕시코만' },
    caribbean: { in: '카리브해에서', name: '카리브해' },
    southChina: { in: '남중국해에서', name: '남중국해' },
    indonesia: { in: '인도네시아의 섬들 사이에서', name: '인도네시아' },
    indianSouth: { in: '인도양 남부에서', name: '인도양 남부' },
    indian: { in: '인도양에서', name: '인도양' },
    atlanticNorth: { in: '북대서양에서', name: '북대서양' },
    atlanticTropical: { in: '열대 대서양에서', name: '열대 대서양' },
    atlanticSouth: { in: '남대서양에서', name: '남대서양' },
    atlanticSouthern: { in: '남대서양 열대 해역에서', name: '남대서양 열대 해역' },
    pacificNorth: { in: '북태평양에서', name: '북태평양' },
    pacificTropical: { in: '열대 태평양에서', name: '열대 태평양' },
    pacificSouth: { in: '남태평양에서', name: '남태평양' },
    pacificSouthern: { in: '남태평양 열대 해역에서', name: '남태평양 열대 해역' },
  },

  // Bare places, without a particle: the sentences add "에서" themselves.
  quake: {
    distance: (km: string, place: string) => `${place}에서 ${km} km 떨어진 곳`,
    near: (place: string) => `${place} 부근`,
    region: (place: string) => `${place} 지역`,
    regions: { sandwich: '남샌드위치 제도', kermadec: '케르마데크 제도', ridge: '대서양 중앙 해령' },
  },

  probe: {
    asylum: (n: string) => `망명 신청 ${n}건`,
    noAsylum: '공개된 신청 없음',
    noData: '이해의 데이터 없음',
    directions: ['북', '북동', '동', '남동', '남', '남서', '서', '북서'],
    windFrom: (dir: string) => `${dir}풍`,
    waterTo: (dir: string) => `${dir}쪽으로 흐르는 물`,
    magnitude: (m: string) => `규모 ${m}`,
    quake: (place: string, depthKm: string, ago: string) => `${place} · 깊이 ${depthKm} km · ${ago}`,
    lessThanHour: '1시간 이내',
    hoursAgo: (h: number) => `${h}시간 전`,
    daysAgo: (d: number) => `${d}일 전`,
    noQuake: '이곳엔 지진 없음',
    noQuakeSub: '규모 2.5 이상, 최근 7일',
    fires: (n: number, s: string) => `불 ${s}곳`,
    noFire: '불 없음',
    firesSub: '반경 150 km 안, 최근 7일',
    solarDay: '태양시 · 낮',
    solarNight: '태양시 · 밤',
    solarDusk: '태양시 · 황혼',
  },

  data: {
    anomaly: (signed: string) => `평년보다 ${signed} °C`,
    rainTrace: '느낄 듯 말 듯한 비',
    rain: (mm: string) => `시간당 ${mm} mm의 비`,
    ice: (pct: string) => `얼음 ${pct}%`,
    bare: '거의 맨땅',
    ndvi: (v: string) => `푸르름 ${v} (NDVI)`,
    noStress: '열 스트레스 없음',
    coral: (v: string) => `열 누적 ${v}주 (°C)`,
    forest: (year: number) => `${year}년에 사라진 숲`,
    aerosol: (v: string) => `뿌연 공기 ${v} (AOD)`,
  },

  atlas: {
    population: {
      title: '사람', left: '', right: '', source: 'World Bank, World Development Indicators · SP.POP.TOTL (UN, 각국 통계청, Eurostat)',
      format: (v: number) => (v >= 1e6 ? `${koDigits(`${Math.round(v / 1e4)}0000`)} 명` : `${num(v)}명`),
    },
    birth: {
      title: '인구 1,000명당 출생아 수', left: '5', right: '50', source: 'World Bank, World Development Indicators · SP.DYN.CBRT.IN',
      format: (v: number) => `1,000명당 출생 ${num(v, 1)}명`,
    },
    death: {
      title: '인구 1,000명당 사망자 수', left: '2', right: '30', source: 'World Bank, World Development Indicators · SP.DYN.CDRT.IN',
      format: (v: number) => `1,000명당 사망 ${num(v, 1)}명`,
    },
    balance: {
      title: '출생에서 사망을 뺀 수, 1,000명당', left: '−10', right: '+40', source: 'World Bank, World Development Indicators · 출생률에서 사망률을 뺀 값 (Upari 계산)',
      format: (v: number) => `1,000명당 ${v > 0 ? '+' : v < 0 ? '−' : ''}${num(Math.abs(v), 1)}`,
    },
    life: {
      title: '출생 시 기대 수명', left: '35세', right: '85', source: 'World Bank, World Development Indicators · SP.DYN.LE00.IN',
      format: (v: number) => `${num(v, 1)}세`,
    },
    under5: {
      title: '다섯 살이 되기 전에 숨지는 아이, 1,000명당', left: '0', right: '300', source: 'UN IGME, World Bank WDI 경유 · SH.DYN.MORT',
      format: (v: number) => `출생아 1,000명당 ${num(v)}명`,
    },
    electricity: {
      title: '전기를 쓰는 사람', left: '0%', right: '100%', source: 'World Bank, SDG 7.1.1 · EG.ELC.ACCS.ZS',
      format: (v: number) => `인구의 ${num(v)}%`,
    },
    unemployment: {
      title: '실업률, ILO 모델 추정치', left: '0%', right: '30%', source: 'ILO 모델 추정치, World Bank WDI 경유 · SL.UEM.TOTL.ZS',
      format: (v: number) => `노동력의 ${num(v, 1)}%`,
    },
  },

  legends: {
    wind: { title: '풍속', left: '잔잔함', right: '80 km/h' },
    currents: { title: '해류 속도', left: '느림', right: '4 km/h' },
    sst: { title: '수온', left: '−2 °C', right: '34 °C' },
    anomaly: { title: '평균과의 차이', left: '−3 °C', right: '+3 °C' },
    chlorophyll: { title: '표층 엽록소', left: '맑은 물', right: '대번성' },
    rain: { title: '비의 세기', left: '이슬비', right: '폭우' },
    quakes: { title: '지진의 깊이', left: '지표 부근', right: '700 km' },
    ice: { title: '얼어붙은 바다', left: '15%', right: '100%' },
    asylum: { title: '출신국별 망명 신청', left: '시리아 · 우크라이나', right: '아프가니스탄' },
    ndvi: { title: '땅의 푸르름 (NDVI)', left: '맨땅', right: '울창한 숲' },
    forest: { title: '연도별로 사라진 나무', left: '몇 해 전', right: '올해' },
    aerosol: { title: '입자가 가로막는 빛의 양 (AOD)', left: '맑은 공기', right: '탁한 공기' },
    coral: { title: '누적 열 스트레스', left: '0', right: '20 °C · 주' },
  },

  // ——— 지금, 이 행성 ———

  pianeta: {
    title: '행성', kicker: '지금',
    narrate: '이것이 바로 지금 이 순간의 지구다. 절반은 낮에, 절반은 밤에 잠겨 있다. 그림자의 경계가 적도 위를 시속 1,670킬로미터로 미끄러져 간다.',
    facts: [
      ['1,670 km/h', '적도에서의 자전 속도'],
      ['8′ 20″', '햇빛이 이곳까지 오는 데 걸리는 시간'],
    ],
    hour: '보이는 지구의 시각: 빛은 실제 그대로다',
    text: '낮과 밤, 그리고 박명은 바로 지금 이 순간에 맞춰 계산된다. 구름은 오늘의 바람을 따라 흐르고, 해가 낮게 뜨면 산은 그림자를 드리운다.',
    source: 'NASA Blue Marble · NASA Black Marble · Mapzen/AWS 지형 모델 · NOAA GFS 바람',
  },
  respiro: {
    title: '숨결', kicker: '오늘의 바람',
    narrate: (p: { where: string; kmh: string }) => `공기는 결코 멈추지 않는다. 이것이 오늘의 바람이다: 열대의 온기를 극지방으로 실어 나르는 보이지 않는 강. 지금 가장 강한 바람은 ${p.where} 시속 ${p.kmh} km로 불고 있다.`,
    strongest: (coords: string) => `지금 가장 강한 바람, ${coords}`,
    facts: [
      ['10 m', '바람을 재는 지면 위 높이'],
      ['× 22,000', '움직임이 보이도록 궤적을 빨리 돌린 배율'],
    ],
    text: '고기압과 저기압은 두 반구에서 서로 반대 방향으로 돈다: 바람을 휘게 하는 것은 지구의 자전이다. 한 점을 누르면 풍속과 풍향을 읽을 수 있다.',
    source: (time: string) => `NOAA GFS 0.5° 모델 · ${time} UTC 분석`,
    pin: '지금 가장 강한 바람',
  },
  correnti: {
    title: '해류', kicker: '바다 속의 강',
    narrate: '파도 아래, 바다에는 바다만의 강이 흐른다. 멕시코 만류는 지구의 모든 강을 합친 것보다 수십 배 많은 물을 나르며, 열대의 온기를 유럽까지 실어 온다.',
    facts: [
      ['3,000만 m³', '플로리다 앞바다에서 멕시코 만류가 1초에 나르는 물'],
      ['120만 m³', '세계의 모든 강을 합쳐 1초에 흐르는 물'],
      ['15 m', '여기 표시된 표층수의 두께'],
    ],
    text: '여기 보이는 해류는 9월의 어느 하루다: 거대한 해류는 해마다 천천히 변하지만, 그 가장자리의 소용돌이는 몇 주 만에 생겨났다가 사라진다.',
    source: 'OSCAR · NOAA CoastWatch ERDDAP · 2014년 9월 26일, 해상도 1/3°',
  },
  calore: {
    title: '바다의 온기', kicker: '한 해 동안의 수온',
    narrate: (p: { when: string; today: boolean; where: string; temp: string | null }) => `바다는 이 행성의 거대한 라디에이터다. ${p.when} 가장 따뜻한 바다는 ${p.where} ${p.today ? '관측된다' : '관측되었다'}: ${p.temp ? `${p.temp}도` : '32도 이상'}. 따뜻한 물이 여름이면 북쪽으로 올라가고 겨울이면 남쪽으로 돌아오는 모습을 보라: 몇 초 만에 지나가는 한 해.`,
    hottest: (when: string, coords: string) => `${when} 가장 따뜻한 바다, ${coords}`,
    facts: [
      ['−1.8 °C', '바닷물이 어는 온도'],
      ['1 km', '원본 지도의 해상도'],
    ],
    text: '바다는 온실가스가 가둔 여분의 열 가운데 90% 이상을 흡수한다. 따뜻한 해류는 극지방을 향해 뻗어 가는 주황색 혀처럼 보인다.',
    pin: '가장 따뜻한 바다',
  },
  febbre: {
    title: '열병', kicker: '한 해, 평년과 비교하면',
    narrate: (p: { when: string; today: boolean; pct: string }) => `빨간색은 평소보다 따뜻한 바다, 파란색은 더 차가운 바다다. 한 달 한 달, 한 해 동안. ${p.when} 전 세계 바다의 ${p.pct}%가 평균보다 ${p.today ? '따뜻하다' : '따뜻했다'}.`,
    share: '평균을 넘는 해수면의 비율',
    strongest: (where: string) => `${where} 나타난 가장 큰 이상 수온`,
    over3: '+3 이상',
    normal: ['2003–2014', '“평년”의 기준이 되는 기간'],
    text: '이상 수온은 어느 하루의 수온을 기준 기간 같은 날의 평균과 비교한 값이다. 해양 열파는 몇 주씩 이어지며 산호와 물고기, 바다풀 초원을 괴롭힌다.',
    source: 'GHRSST MUR 이상 수온, NASA JPL',
    pin: '가장 큰 이상 수온',
  },
  fioritura: {
    title: '꽃피는 바다', kicker: '한 해 동안의 식물성 플랑크톤',
    narrate: '초록빛 하나하나가 보이지 않는 초원이다: 수십억에 이르는 미세한 조류, 식물성 플랑크톤. 우리가 숨 쉬는 산소의 절반쯤을 이들이 만들어 내고, 봄이 닿는 곳마다 피어난다. 먼저 한 반구에서, 그다음 다른 반구에서.',
    oxygen: ['≈ 50%', '바다에서 오는 지구 산소의 몫'],
    days: (n: number) => `${n}일`,
    daysLabel: '동안의 관측을 합쳐 구름을 지웠다',
    range: '세제곱미터당 엽록소 밀리그램, 파랑에서 초록까지',
    text: '대번성은 계절과 영양이 풍부한 물을 따라간다: 깊은 물이 솟아오르는 해안을 따라, 그리고 봄을 맞은 고위도에서. 10월, 남반구는 봄이다.',
  },
  pioggia: {
    title: '비', kicker: '스물네 시간',
    narrate: '하루 동안 내린 비를 몇 초 만에. 적도를 따라 따뜻한 공기가 솟아올라 식으면서, 태양이 바다에서 가져갔던 물을 바다에 돌려준다.',
    interval: ['30분', 'GPM 위성군이 찍는 영상과 영상 사이의 간격'],
    hours: '24시간',
    since: (time: string) => `${time} UTC부터`,
    yearly: ['≈ 1 m', '한 해 동안 지구 전체에 평균적으로 내리는 비'],
    text: (last: string) => `프레임 하나하나가 위성으로 추정한 강수량이며, 영상 사이의 전환은 보간한 것이다. 마지막 프레임: ${last} UTC.`,
  },
  fuoco: {
    title: '불', kicker: '지난 이레',
    narrate: (p: { thousands: string; approx: string }) => `불티 하나하나가 우주에서 본 불이다. 이레 동안 위성이 센 불은 ${shifted(p.approx, 0) ?? p.approx}곳이 넘는다. 그 거의 모두를 우리가 놓았다: 밭을 정리하려고, 가축 풀 뜯을 땅을 내려고.`,
    count: '7일 동안 감지된 열점',
    facts: [
      ['375 m', '불을 보는 픽셀의 크기'],
      ['하루 두 번', '낮에 한 번, 밤에 한 번, NOAA‑20이 모든 지점 위를 지나간다'],
    ],
    text: '점의 밝기는 불의 세기에 비례하며, 최근의 불일수록 더 밝게 빛난다. 아프리카 남부와 남아메리카는 지금 농사를 위해 불을 놓는 계절이다.',
    source: (day: string) => `NASA FIRMS · VIIRS NOAA-20 · ${day} 업데이트`,
  },
  terremoti: {
    title: '흔들리는 지구', kicker: '지난 이레',
    narrate: (p: { count: string; mag: string; where: string }) => `이레 동안 지구는 규모 2.5 이상으로 ${p.count}번 흔들렸다: 한 주가 몇 초 만에 흘러간다. 가장 강한 규모 ${p.mag}의 지진은 ${p.where}에서 일어났다. 이 점들이 모여 판의 경계를 그린다.`,
    count: '지난 7일 동안 일어난 규모 2.5 이상의 지진',
    strong: '규모 5 이상',
    deepest: (where: string) => `가장 깊은 지진, ${where}`,
    text: '점 하나하나가 지진이다. 크기는 규모를, 색은 깊이를 나타낸다: 지표 가까이는 호박색, 중간 깊이는 분홍색, 300 km보다 깊은 곳은 보라색이다. 그 깊은 곳에서 한 판이 다른 판 밑으로 파고든다. 미국 밖에서 USGS 관측망은 주로 규모 4 이상의 지진을 기록한다.',
    source: (day: string) => `USGS Earthquake Hazards Program · ${day} 업데이트`,
    pin: (mag: string) => `규모 ${mag}`,
    pinSub: '이번 주 가장 강한 지진',
  },
  ghiaccio: {
    title: '얼음', kicker: '극지방의 한 해',
    narrate: (p: { when: string; today: boolean; area: string }) => `세상의 꼭대기에서 바다가 언다. ${p.when} 북극의 해빙은 ${millions(p.area)} 제곱킬로미터를 ${p.today ? '덮고 있다' : '덮고 있었다'}. 그리고 겨울마다 유럽보다 넓은 면적만큼 불어난다. 여기서는 한 해가 흘러간다: 북극이 녹는 동안 남극은 언다.`,
    area: (mkm2: string) => `${millions(mkm2)} km²`,
    arctic: (when: string) => `북극 해빙, ${when}`,
    antarctic: '남극 대륙을 둘러싼 얼음',
    decline: ['−12%', '10년마다: 1979년 이후 북극 여름 최소 면적의 감소율'],
    text: '면적은 얼음이 15% 이상인 해역의 넓이를 농도로 가중해 더한 값이다. 얼음은 햇빛을 되비춘다: 얼음이 물러나면 어두운 바다가 더 많은 열을 흡수한다.',
    source: 'GHRSST GAMSSA, Bureau of Meteorology · 해빙 농도',
  },
  luci: {
    title: '불빛', kicker: '지금, 밤',
    narrate: '밤이 내리면 행성에 불이 켜진다. 이 불빛은 우리가 어디에 사는지를 가장 정직하게 그린 초상화다: 해안을 따라, 강을 따라, 길을 따라.',
    facts: [
      ['≈ 57%', '도시에 사는 인류의 비율'],
      ['742 m', '위성이 불빛을 찍는 픽셀의 크기'],
      ['2016', '구름도 달빛도 없는 밤 모자이크를 만든 해'],
    ],
    text: '나일강을 따라 흐르는 빛의 강, 유럽의 거미줄, 일본의 해안선. 불빛은 없는 것도 말해 준다: 거의 캄캄한 거대한 숲과 사막처럼.',
    source: 'NASA Black Marble · VIIRS 2016',
  },
  lassu: {
    title: '저 위', kicker: '지금, 우주정거장',
    narrate: (p: { alt: string; speed: string }) => `그리고 저 위, 고도 ${p.alt}킬로미터에서 우주정거장이 이 모든 것을 시속 ${p.speed} km로 돌고 있다. 92분마다 한 바퀴: 하루에 열여섯 번의 해돋이.`,
    arrive: (p: { below: string; day: boolean | null; minutes: string }) => `지금 승무원들이 창밖으로 보는 풍경이다. 그들의 발아래, ${p.below}.${p.day === null ? '' : p.day ? ` 선내는 낮이다: 다음 해넘이까지 ${p.minutes}분.` : ` 선내는 밤이다: 다음 해돋이까지 ${p.minutes}분.`}`,
    alt: '지금 이 순간의 고도',
    speed: '1초에 약 7.7 km',
    dawns: ['16', '승무원이 하루에 맞는 해돋이와 해넘이'],
    text: '위치는 CelesTrak이 공개한 궤도 요소로 지금 이 순간 계산한다. 선은 궤도 한 바퀴를 보여 준다: 30분 전부터 1시간 뒤까지. 가까이에서 보면 정거장은 실제 자세 그대로 난다: 모듈은 나아가는 방향을 따라, 트러스는 궤도와 직각으로.',
    source: 'NORAD 25544 궤도 요소 · CelesTrak · SGP4 궤도 계산 · NASA 3D 모델',
  },

  // ——— 자연 ———

  verde: {
    title: '초록의 숨결', kicker: '한 해 동안의 식생',
    narrate: (p: { hi: string; hiMonth: string; lo: string; loMonth: string }) => `지구는 계절과 함께 숨 쉰다. 북위 30도와 65도 사이, 잎이 땅을 덮는 비율은 ${p.hiMonth}에 ${p.hi}%, ${p.loMonth}에는 고작 ${p.lo}%다. 그러고 나면 초록은 다른 반구로 건너간다.`,
    dense: (month: string) => `${month}, 북위 30°와 65° 사이의 땅 가운데 식생이 울창한 곳 (NDVI 0.5 초과)`,
    sparse: (month: string) => `${month}`,
    months: (n: number) => `${n}개월`,
    span: (from: string, to: string) => `${from}부터 ${to}까지`,
    text: 'NDVI는 잎이 흡수하는 붉은빛과 잎이 반사하는 근적외선을 비교한다: 값이 높을수록 식생이 울창하고 활발하다. 프레임 하나는 한 달의 평균이며, 구름이 한 달 내내 덮은 곳은 값이 비어 있다.',
    source: 'NASA VIIRS (Suomi NPP) · 월별 NDVI · GIBS',
  },
  foreste: {
    title: '사라진 숲', kicker: '사라진 수목 피복, 2001 – 2024',
    narrate: (peak: number) => `점 하나하나가 이제는 없는 숲 한 조각이다: 베이고, 불타고, 밭이 되었다. 사라진 해에 빛나고, 그 뒤로는 흉터가 된다. 전체 기록에서 가장 나빴던 해는 ${peak}년이다.`,
    peak: '2001년 이후 손실이 가장 컸던 해',
    recent: (from: number, to: number) => `전체 기록의 손실 가운데 최근 5년(${from}–${to})에 일어난 몫`,
    early: (from: number, to: number) => `처음 5년(${from}–${to})`,
    text: '수목 피복 손실: 높이 5미터 이상의 나무가 30미터 픽셀에서 사라진 것으로, 원인은 화재, 벌채, 병해 등이다. 산림 파괴와 산림 경영을 구별하지 않고, 다시 자란 나무도 세지 않는다. 여기서는 점 하나가 약 10 km를 나타내며, 연도별 몫은 이 지도에서 강도로 가중해 계산했다.',
    source: 'Hansen et al. 2013, University of Maryland · Global Forest Watch v1.12 · CC BY 4.0',
  },
  aria: {
    title: '공기', kicker: '한 해 동안의 먼지와 연기',
    narrate: (p: { where: string; month: string; worst: string }) => `대서양 위의 사하라 모래, 산불의 연기, 도시의 스모그: 공기는 모든 것을 실어 나른다. 지난 한 해 가장 두꺼운 장막은 ${p.month}, ${p.where} 위에 드리웠다. 행성 전체에서 가장 뿌옜던 달은 ${ieotda(p.worst)}.`,
    thickest: (where: string, month: string) => `한 해 중 가장 높은 광학 두께: ${where}, ${month}`,
    worst: '행성 평균으로 공기가 가장 탁했던 달',
    wavelength: ['550 nm', '측정 기준이 되는 초록빛의 파장'],
    text: '에어로졸 광학 두께는 공기 중 입자가 햇빛을 얼마나 가로막는지를 나타낸다: 0.1이면 맑은 공기, 1을 넘으면 하늘이 불투명하다. 이 값은 위성과 대기 모델을 합친 NASA MERRA-2 재분석의 추정치이며, 그것만으로는 먼지와 연기를 구별하지 못한다.',
    source: 'NASA GMAO · MERRA-2 · 550 nm 에어로졸 광학 두께, 월별 · GIBS',
  },
  coralli: {
    title: '산호초', kicker: '한 해 동안 바다에 쌓인 열',
    narrate: (p: { now: string; peakMonth: string | null; peak: string }) => `바다가 몇 주씩 너무 뜨거우면, 산호는 자신을 먹여 살리는 조류를 내보내고 하얗게 변한다. 오늘 열대 바다의 ${p.now}%가 임계치를 넘었다: ${p.peakMonth ? `지난 한 해의 정점은 ${p.peakMonth}, ${p.peak}%였다` : '지난 한 해 가운데 가장 높은 값이다'}.`,
    alert: '열대 바다(30° N – 30° S) 가운데 4 °C-주를 넘어 백화 가능성이 높은 곳',
    severe: '8 초과: 많은 산호가 죽는 수준',
    worst: (pct: string) => `지난 한 해 가장 심각했던 달 (${pct}%)`,
    text: '가열 주수(Degree Heating Weeks)는 지난 12주 동안 물이 그곳의 평소 최고 수온을 얼마나 넘었는지를 더한 값이다. 이 지표는 바다 전체에 적용되지만, 산호초는 물이 얕고 맑은 곳에만 있다.',
    source: 'NOAA Coral Reef Watch v3.1 · 5 km · PacIOOS ERDDAP 경유',
  },

  // ——— 사람들 ———

  wdiNote: WDI_NOTE,
  popolazione: {
    title: '80억', kicker: '인구, 1960 – 2025',
    narrate: (p: { then: string; now: string }) => `1960년, 우리는 ${billions(p.then)} 명이었다. 2025년, 우리는 ${billions(p.now)} 명이다. 빛의 점 하나가 25만 명이다: 사람들이 사는 곳에, 해마다 불이 켜진다.`,
    billions: (b: string) => `${billions(b)} 명`,
    total: '2025년 인구, 217개 지역의 합계',
    dot: ['25만', '빛의 점 하나에 담긴 사람'],
    largest: (people: string) => `인구가 가장 많은 나라: ${people}`,
    text: '점은 각 나라 안에서 밤에 불빛이 있는 곳(NASA Black Marble)에 흩뿌려진다: 사람들이 사는 곳을 보여 줄 뿐, 정확한 주소는 아니다. 해마다 그해의 인구를 셀 만큼의 점이 켜진다.',
    borders: 'Natural Earth 국경',
  },
  nascite: {
    title: '줄어드는 출생', kicker: '출생률, 1960 – 2024',
    narrate: (p: { then: string; now: string; top: string }) => `1960년에는 인구 천 명당 ${p.then}명의 아이가 태어났다. 2024년에는 ${p.now}명. 감소는 거의 모든 곳에 이르렀다. 오늘 출생률이 가장 높은 곳은 ${ida(p.top)}.`,
    world: '2024년 전 세계 인구 1,000명당 출생아 수 (인구 가중 평균)',
    highest: (country: string) => `가장 높은 곳, ${country}`,
    lowest: (country: string) => `가장 낮은 곳, ${country}`,
    text: '조출생률: 인구의 연령 구성에도 좌우된다.',
  },
  vita: {
    title: '더 긴 삶', kicker: '기대 수명, 1960 – 2024',
    narrate: (p: { then: string; now: string }) => `1960년에 태어난 아이는 평균 ${p.then}년을 살 것으로 기대할 수 있었다. 오늘은 ${p.now}년. 이번 세기의 위대한 성취 가운데 하나이며, 아직 끝나지 않았다.`,
    years: (y: string) => `${y}세`,
    world: '2024년 전 세계 출생 시 기대 수명 (인구 가중 평균)',
    highest: (country: string) => `가장 높은 곳, ${country}`,
    lowest: (country: string) => `가장 낮은 곳, ${country}`,
    text: '기간 지표: 그해의 연령별 사망 위험이 그대로 이어진다면 오늘 태어난 아이가 살게 될 햇수다. 갑작스러운 급락은 전쟁, 기근, 전염병이다.',
  },
  bambini: {
    title: '아이들', kicker: '5세 미만 사망률, 1960 – 2024',
    narrate: (p: { many: string; top: string; now: string; then: string | null }) => `1960년, ${p.many}개 나라에서 아이 넷 가운데 하나 넘게 다섯 살이 되기 전에 세상을 떠났다. 오늘 가장 높은 곳은 ${p.top}: 출생아 천 명당 ${p.now}명${p.then ? `, 1960년에는 ${p.then}명이었다` : '이다'}.`,
    then: '1960년, 출생아 1,000명당 250명 이상이 숨진 나라',
    now: '2024년, 1,000명당 100명 이상인 나라',
    goal: ['SDG 3.2', 'UN 목표: 2030년까지 1,000명당 25명 이하'],
    text: 'UN IGME의 기간 추정치: 실제 사망자 수도, 어느 한 아이의 운명도 아니다. 작은 차이는 확실한 차이가 아니다.',
  },
  saldo: {
    title: '자연 증감', kicker: '출생에서 사망을 뺀 수, 1960 – 2024',
    narrate: (n: string) => `출생에서 사망을 뺀 수. 오늘 ${n}개 나라에서는 태어나는 사람보다 세상을 떠나는 사람이 더 많다: 파란색, 주로 유럽과 동아시아다. 호박색인 곳에서는 인구가 저절로 늘어난다.`,
    now: '2024년 사망이 출생보다 많은 나라',
    then: '1960년에는 몇 나라였나',
    world: '2024년 세계의 자연 증가',
    text: 'Upari가 같은 나라, 같은 해의 출생률에서 사망률을 빼서 계산했으며, 두 값이 모두 있는 곳만 넣었다. 이주는 세지 않는다: 자연 증감이 마이너스여도 인구는 늘 수 있다.',
  },
  luce: {
    title: '전깃불', kicker: '전기 보급, 2000 – 2024',
    narrate: (p: { then: string; now: string; without: string }) => `2000년에는 사람들의 ${p.then}%가 전기를 쓸 수 있었다. 오늘은 ${p.now}%. 아직 ${millions(p.without)} 명이 전기 없이 살고, 그 대부분은 사하라 이남 아프리카에 있다.`,
    world: '2024년 전기를 쓰는 사람의 비율 (인구 가중 평균)',
    millions: (m: string) => `${millions(m)} 명`,
    first: (country: string) => `${country}에서 전기 없이 사는 사람`,
    second: (country: string) => `${country}`,
    text: '전력망, 소규모 전력망, 독립형 시스템을 통한 접근: 공급의 지속성이나 품질, 가격에 대해서는 아무것도 말해 주지 않는다. 2000년부터 시작하는 것은 그 이전에는 값이 없는 나라가 많기 때문이다.',
  },
  fuga: {
    title: '피난', kicker: '망명 신청, 2011 – 2024',
    narrate: (p: { year: number; total: string }) => `시리아, 우크라이나, 아프가니스탄을 떠난 사람들, 그리고 그들이 망명을 신청한 나라. 시리아 전쟁은 ${p.year}년에 정점에 이른다: 한 해에만 신청 ${p.total}건.`,
    peak: (origin: string, year: number) => `${origin}에서 온 신청, ${year}년 (정점)`,
    text: '정부 당국에 새로 접수된 개인 신청을, 신청한 나라별로 센 것이다. 출신지는 셋뿐이다: 모든 이주도, 중복 없는 개인의 수도 아니다. 2022년부터 우크라이나를 떠난 사람 대부분은 유럽연합에서 임시 보호를 받았고, 이는 여기에 포함되지 않는다. 호는 수도와 수도를 잇는 도식일 뿐, 관측된 여정이 아니다.',
    source: 'UNHCR, Refugee Data Portal · AsylumApplications, CC BY 4.0',
  },
};

export default ko;
