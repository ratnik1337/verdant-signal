const CURRENCY_CODES = [
  'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT', 'BGN', 'BHD',
  'BIF', 'BMD', 'BND', 'BOB', 'BOV', 'BRL', 'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHE', 'CHF',
  'CHW', 'CLF', 'CLP', 'CNY', 'COP', 'COU', 'CRC', 'CUC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD',
  'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD',
  'HNL', 'HTG', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR',
  'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA',
  'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MXV', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO',
  'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB',
  'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SOS', 'SRD', 'SSP', 'STN', 'SVC', 'SYP',
  'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'USN', 'UYI',
  'UYU', 'UYW', 'UZS', 'VED', 'VES', 'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XOF', 'XPF', 'YER', 'ZAR', 'ZMW', 'ZWG',
];

const SYMBOLS = {
  AED: 'د.إ', AFN: '؋', ALL: 'L', AMD: '֏', ARS: '$', AUD: 'A$', AZN: '₼', BAM: 'KM', BBD: 'Bds$',
  BDT: '৳', BGN: 'лв', BHD: '.د.ب', BND: 'B$', BOB: 'Bs', BRL: 'R$', BYN: 'Br', BZD: 'BZ$', CAD: 'CA$',
  CHF: 'CHF', CLP: '$', CNY: '¥', COP: '$', CRC: '₡', CZK: 'Kč', DKK: 'kr', DOP: 'RD$', EGP: 'E£',
  EUR: '€', GBP: '£', GEL: '₾', GHS: 'GH₵', HKD: 'HK$', HNL: 'L', HRK: 'kn', HUF: 'Ft', IDR: 'Rp',
  ILS: '₪', INR: '₹', IQD: 'ع.د', ISK: 'kr', JMD: 'J$', JOD: 'د.ا', JPY: '¥', KES: 'KSh', KGS: 'с',
  KHR: '៛', KRW: '₩', KWD: 'د.ك', KZT: '₸', LAK: '₭', LBP: 'ل.ل', LKR: 'Rs', MAD: 'د.م.', MDL: 'L',
  MGA: 'Ar', MKD: 'ден', MMK: 'K', MNT: '₮', MOP: 'MOP$', MUR: '₨', MVR: 'Rf', MXN: 'MX$', MYR: 'RM',
  NGN: '₦', NIO: 'C$', NOK: 'kr', NPR: '₨', NZD: 'NZ$', OMR: 'ر.ع.', PEN: 'S/', PHP: '₱', PKR: '₨',
  PLN: 'zł', PYG: '₲', QAR: 'ر.ق', RON: 'lei', RSD: 'дин', RUB: '₽', RWF: 'FRw', SAR: 'ر.س', SEK: 'kr',
  SGD: 'S$', SLE: 'Le', THB: '฿', TJS: 'ЅМ', TMT: 'm', TND: 'د.ت', TRY: '₺', TTD: 'TT$', TWD: 'NT$',
  TZS: 'TSh', UAH: '₴', UGX: 'USh', USD: '$', UYU: '$U', UZS: 'soʻm', VND: '₫', VUV: 'VT', WST: 'WS$',
  XAF: 'FCFA', XCD: 'EC$', XOF: 'CFA', XPF: '₣', YER: '﷼', ZAR: 'R', ZMW: 'ZK', ZWG: 'ZiG',
};

const ZERO_DECIMAL = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']);
const displayNames = new Intl.DisplayNames(['en'], { type: 'currency' });

const CURRENCIES = CURRENCY_CODES.map((code) => ({
  code,
  name: displayNames.of(code) || code,
  symbol: SYMBOLS[code] || code,
  fractionDigits: ZERO_DECIMAL.has(code) ? 0 : 2,
  locale: code === 'RUB' ? 'ru-RU' : code === 'UAH' ? 'uk-UA' : code === 'PLN' ? 'pl-PL' : code === 'EUR' ? 'de-DE' : code === 'JPY' ? 'ja-JP' : 'en-US',
})).sort((a, b) => a.code.localeCompare(b.code));

module.exports = { CURRENCIES };
