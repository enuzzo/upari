import { t, lang } from './index';

// Country names in the language of the page. ISO 3166 alpha-3 (Natural Earth and World Bank
// codes) to alpha-2, which Intl.DisplayNames knows: five letters per country.
const ISO = 'ABWAWAFGAFAGOAOALBALANDADAREAEARGARARMAMASMASATAAQATFTFATGAGAUSAUAUTATAZEAZBDIBIBELBEBENBJBFABFBGDBDBGRBGBHRBHBHSBSBIHBABLRBYBLZBZBMUBMBOLBOBRABRBRBBBBRNBNBTNBTBWABWCAFCFCANCACHECHCHIJGCHLCLCHNCNCIVCICMRCMCODCDCOGCGCOLCOCOMKMCPVCVCRICRCUBCUCUWCWCYMKYCYPCYCZECZDEUDEDJIDJDMADMDNKDKDOMDODZADZECUECEGYEGERIERESPESESTEEETHETFINFIFJIFJFLKFKFRAFRFROFOFSMFMGABGAGBRGBGEOGEGHAGHGIBGIGINGNGMBGMGNBGWGNQGQGRCGRGRDGDGRLGLGTMGTGUMGUGUYGYHKGHKHNDHNHRVHRHTIHTHUNHUIDNIDIMNIMINDINIRLIEIRNIRIRQIQISLISISRILITAITJAMJMJORJOJPNJPKAZKZKENKEKGZKGKHMKHKIRKIKNAKNKORKRKOSXKKWTKWLAOLALBNLBLBRLRLBYLYLCALCLIELILKALKLSOLSLTULTLUXLULVALVMACMOMAFMFMARMAMCOMCMDAMDMDGMGMDVMVMEXMXMHLMHMKDMKMLIMLMLTMTMMRMMMNEMEMNGMNMNPMPMOZMZMRTMRMUSMUMWIMWMYSMYNAMNANCLNCNERNENGANGNICNINLDNLNORNONPLNPNRUNRNZLNZOMNOMPAKPKPANPAPERPEPHLPHPLWPWPNGPGPOLPLPRIPRPRKKPPRTPTPRYPYPSEPSPSXPSPYFPFQATQAROURORUSRURWARWSAHEHSAUSASDNSDSDSSSSENSNSGPSGSLBSBSLESLSLVSVSMRSMSOMSOSRBRSSSDSSSTPSTSURSRSVKSKSVNSISWESESWZSZSXMSXSYCSCSYRSYTCATCTCDTDTGOTGTHATHTJKTJTKMTMTLSTLTONTOTTOTTTUNTNTURTRTUVTVTWNTWTZATZUGAUGUKRUAURYUYUSAUSUZBUZVCTVCVENVEVGBVGVIRVIVNMVNVUTVUWSMWSXKXXKYEMYEZAFZAZMBZMZWEZW';
const ALPHA2 = new Map<string, string>();
for (let i = 0; i < ISO.length; i += 5) ALPHA2.set(ISO.slice(i, i + 3), ISO.slice(i + 3, i + 5));

let names: Intl.DisplayNames | null = null;
let namesLang = '';

/** The name of a country from its code; the Italian Natural Earth name is the fallback. */
export function countryName(code: string, italian: string): string {
  const own = (t.countries as Record<string, string>)[code];
  if (own) return own;
  if (lang === 'it') return italian;
  const a2 = ALPHA2.get(code);
  if (!a2) return italian;
  if (namesLang !== lang) { names = new Intl.DisplayNames([t.lang.locale], { type: 'region', fallback: 'none' }); namesLang = lang; }
  const name = (t.countries as Record<string, string>)[a2] ?? names!.of(a2);
  // "Myanmar (Burma)": the short name reads better in a sentence.
  return name ? name.replace(/\s*\([^)]*\)$/, '') : italian;
}

/** A region name as USGS writes it, in the language of the page. */
const USGS: Record<string, string> = {
  China: 'CN', Japan: 'JP', Philippines: 'PH', Peru: 'PE', Mexico: 'MX', Turkey: 'TR', Türkiye: 'TR', Greece: 'GR', Italy: 'IT',
  'Papua New Guinea': 'PG', 'New Zealand': 'NZ', Fiji: 'FJ', 'Solomon Islands': 'SB', Taiwan: 'TW', Chile: 'CL', Ecuador: 'EC',
  Colombia: 'CO', Guatemala: 'GT', 'Timor Leste': 'TL', 'East Timor': 'TL', Russia: 'RU', Iran: 'IR', Afghanistan: 'AF',
  Pakistan: 'PK', India: 'IN', Nepal: 'NP', Myanmar: 'MM', 'Northern Mariana Islands': 'MP', 'Puerto Rico': 'PR',
  'Dominican Republic': 'DO', 'El Salvador': 'SV', Nicaragua: 'NI', 'Costa Rica': 'CR', Panama: 'PA', Argentina: 'AR',
  Bolivia: 'BO', Vanuatu: 'VU', Tonga: 'TO', Samoa: 'WS', Iceland: 'IS', Portugal: 'PT', Spain: 'ES', Albania: 'AL',
  Croatia: 'HR', Cyprus: 'CY', Algeria: 'DZ', Morocco: 'MA', Ethiopia: 'ET', Kenya: 'KE', Tanzania: 'TZ', Tajikistan: 'TJ',
  Kyrgyzstan: 'KG', Kazakhstan: 'KZ', Indonesia: 'ID', 'Fiji region': 'FJ', 'Tonga region': 'TO', 'Vanuatu region': 'VU',
  Alaska: 'US', California: 'US', Hawaii: 'US', 'U.S. Virgin Islands': 'VI', Greenland: 'GL', Canada: 'CA', Australia: 'AU',
};
const SPECIAL: Record<string, keyof typeof t.quake.regions> = {
  'South Sandwich Islands region': 'sandwich', 'Kermadec Islands region': 'kermadec', 'Mid-Atlantic Ridge': 'ridge',
};

export function regionName(region: string): string {
  const special = SPECIAL[region];
  if (special) return t.quake.regions[special];
  const a2 = USGS[region];
  // US states stay as USGS writes them: they are names, not countries.
  if (!a2 || /^(Alaska|California|Hawaii)$/.test(region)) return region;
  if (namesLang !== lang) { names = new Intl.DisplayNames([t.lang.locale], { type: 'region', fallback: 'none' }); namesLang = lang; }
  return ((t.countries as Record<string, string>)[a2] ?? names!.of(a2) ?? region).replace(/\s*\([^)]*\)$/, '');
}
