const NAMES_BY_REGION = {
  latam: {
    firstNames: ['Carlos', 'Juan', 'Luis', 'Miguel', 'José', 'Pedro', 'Diego', 'Alejandro', 'Fernando', 'Ricardo', 'María', 'Ana', 'Carmen', 'Rosa', 'Lucia', 'Sofia', 'Valentina', 'Isabella', 'Camila', 'Gabriela'],
    suffixes: ['_mx', '_br', '_ar', '_co', '_pe', '_cl', '_ve', '_ec', '_gt', '_hn'],
    countries: ['MX', 'BR', 'AR', 'CO', 'PE', 'CL', 'VE', 'EC', 'GT', 'HN', 'SV', 'NI', 'CR', 'PA', 'DO', 'CU', 'PR', 'UY', 'PY', 'BO'],
  },
  africa: {
    firstNames: ['Kwame', 'Kofi', 'Ama', 'Adaeze', 'Chidi', 'Emeka', 'Fatima', 'Amara', 'Zainab', 'Ibrahim', 'Youssef', 'Ahmed', 'Omar', 'Aisha', 'Mariam', 'Nadia', 'Musa', 'Hassan', 'Moussa', 'Amadou'],
    suffixes: ['_ng', '_za', '_ke', '_gh', '_eg', '_ma', '_dz', '_tz', '_et', '_cm'],
    countries: ['NG', 'ZA', 'KE', 'GH', 'EG', 'MA', 'DZ', 'TZ', 'ET', 'CM', 'CI', 'SN', 'UG', 'AO', 'MZ', 'ZW', 'TN', 'LY', 'SD', 'RW'],
  },
  europe_west: {
    firstNames: ['James', 'John', 'Michael', 'David', 'Thomas', 'Sophie', 'Emma', 'Olivia', 'Pierre', 'Jean', 'Marie', 'Hans', 'Klaus', 'Anna', 'Lisa', 'Marco', 'Luca', 'Pablo', 'Antonio', 'Elena'],
    suffixes: ['_uk', '_de', '_fr', '_it', '_es', '_nl', '_be', '_at', '_ch', '_pt'],
    countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'PT', 'IE', 'SE', 'NO', 'DK', 'FI', 'GR', 'LU', 'MC', 'AD', 'MT'],
  },
  europe_east: {
    firstNames: ['Ivan', 'Dmitri', 'Alexei', 'Sergei', 'Nikolai', 'Andrei', 'Viktor', 'Maxim', 'Olga', 'Natasha', 'Katya', 'Anna', 'Maria', 'Elena', 'Piotr', 'Jakub', 'Marek', 'Tomas', 'Jan', 'Eva'],
    suffixes: ['_ru', '_pl', '_ua', '_cz', '_ro', '_hu', '_bg', '_sk', '_hr', '_rs'],
    countries: ['RU', 'PL', 'UA', 'CZ', 'RO', 'HU', 'BG', 'SK', 'HR', 'RS', 'BY', 'MD', 'LT', 'LV', 'EE', 'SI', 'BA', 'MK', 'AL', 'ME'],
  },
  asia: {
    firstNames: ['Wei', 'Ming', 'Hiroshi', 'Yuki', 'Kenji', 'Sakura', 'Raj', 'Amit', 'Priya', 'Arun', 'Kim', 'Park', 'Lee', 'Chen', 'Wang', 'Nguyen', 'Tran', 'Ali', 'Mohammad', 'Fatima'],
    suffixes: ['_cn', '_jp', '_kr', '_in', '_th', '_vn', '_id', '_my', '_ph', '_sg'],
    countries: ['CN', 'JP', 'KR', 'IN', 'TH', 'VN', 'ID', 'MY', 'PH', 'SG', 'TW', 'HK', 'PK', 'BD', 'LK', 'NP', 'MM', 'KH', 'LA', 'MN'],
  },
  mena: {
    firstNames: ['Mohammed', 'Ahmed', 'Ali', 'Omar', 'Youssef', 'Khalid', 'Hassan', 'Ibrahim', 'Fatima', 'Aisha', 'Mariam', 'Nour', 'Layla', 'Sara', 'Zainab', 'Rania', 'Dina', 'Hana', 'Salma', 'Yasmin'],
    suffixes: ['_ae', '_sa', '_qa', '_kw', '_bh', '_om', '_jo', '_lb', '_sy', '_iq'],
    countries: ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'SY', 'IQ', 'YE', 'PS', 'IL', 'TR', 'IR', 'AF'],
  },
  oceania: {
    firstNames: ['Jack', 'William', 'Oliver', 'James', 'Noah', 'Charlotte', 'Amelia', 'Mia', 'Ava', 'Isla', 'Liam', 'Mason', 'Ethan', 'Lucas', 'Harper', 'Ella', 'Grace', 'Chloe', 'Zoe', 'Ruby'],
    suffixes: ['_au', '_nz', '_fj', '_pg', '_ws'],
    countries: ['AU', 'NZ', 'FJ', 'PG', 'WS', 'TO', 'VU', 'SB', 'NC', 'GU'],
  },
};

function getRegionForCountry(countryCode) {
  if (!countryCode) return 'europe_west';
  const code = countryCode.toUpperCase();
  for (const [region, data] of Object.entries(NAMES_BY_REGION)) {
    if (data.countries.includes(code)) return region;
  }
  return 'europe_west';
}

function generateFakeNickname(countryCode, seed = Date.now()) {
  const region = getRegionForCountry(countryCode);
  const data = NAMES_BY_REGION[region];
  const nameIndex = seed % data.firstNames.length;
  const suffixIndex = (seed >> 4) % data.suffixes.length;
  const number = ((seed >> 8) % 9000) + 1000;
  const useNumber = (seed % 3) !== 0;
  const useSuffix = (seed % 5) !== 0;
  const name = data.firstNames[nameIndex];
  let nickname = name;
  if (useSuffix) nickname += data.suffixes[suffixIndex];
  if (useNumber) nickname += number;
  return nickname;
}

function generateFakePlayers(countryCode, count = 8, baseSeed = Date.now()) {
  const players = [];
  const region = getRegionForCountry(countryCode);
  const regionData = NAMES_BY_REGION[region];
  const countryName = countryCode ? regionData.countries.includes(countryCode.toUpperCase()) ? countryCode.toUpperCase() : regionData.countries[0] : regionData.countries[0];

  for (let i = 0; i < count; i++) {
    const seed = baseSeed + i * 7919;
    const nickname = generateFakeNickname(countryCode, seed);
    const lastSeenMinutes = (seed % 15) + 1;
    players.push({
      nickname,
      countryCode: countryName,
      countryName: null,
      lastSeenAt: new Date(Date.now() - lastSeenMinutes * 60 * 1000).toISOString(),
      isFake: true,
    });
  }
  return players;
}

module.exports = { NAMES_BY_REGION, getRegionForCountry, generateFakeNickname, generateFakePlayers };
