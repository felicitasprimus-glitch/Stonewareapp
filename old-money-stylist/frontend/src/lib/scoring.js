// Old-Money Stil-Bewertung – Browser-Version (Port von backend/scoring.py).
// Läuft komplett im Browser, ohne Server.

export const PALETTE = {
  creme: ['creme', 'crème', 'cream', 'ecru', 'ivory', 'elfenbein', 'off-white', 'offwhite'],
  weiss: ['weiss', 'weiß', 'white', 'blanc', 'optic white'],
  camel: ['camel', 'kamel', 'tan', 'cognac'],
  beige: ['beige', 'sand', 'stone', 'nude', 'taupe', 'greige', 'khaki hell', 'oat'],
  navy: ['navy', 'marine', 'marineblau', 'dunkelblau', 'midnight'],
  schwarz: ['schwarz', 'black', 'noir', 'nero'],
  braun: ['braun', 'brown', 'chocolate', 'schoko', 'mocha', 'espresso', 'walnut', 'hazel'],
  gold: ['gold', 'golden', 'champagne', 'champagner', 'messing', 'brass'],
  grau: ['grau', 'grey', 'gray', 'anthrazit', 'charcoal', 'silber', 'silver'],
}

const OFF_PALETTE = [
  'neon', 'pink', 'magenta', 'knallrot', 'lila grell', 'türkis', 'tuerkis',
  'limette', 'lime', 'orange grell', 'glitzer', 'glitter', 'leopard print bunt',
]

const LUX_MATERIALS = [
  'kaschmir', 'cashmere', 'seide', 'silk', 'soie', 'wolle', 'wool', 'merino',
  'leinen', 'linen', 'leder', 'leather', 'cuir', 'satin', 'twill', 'tweed',
  'popeline', 'poplin', 'baumwolle', 'cotton', 'viskose', 'viscose',
  'alpaka', 'alpaca', 'mohair', 'gabardine', 'crepe', 'krepp',
]
const LUX_WORDS = [
  'tailored', 'tailoring', 'structured', 'premium', 'luxe', 'luxury', 'fine',
  'handgefertigt', 'handmade', 'manufaktur', 'edel', 'hochwertig', 'klassisch',
  'classic', 'timeless', 'zeitlos', 'heritage', 'signature', 'icon', 'gold-tone',
]
const ELEGANT_WORDS = [
  'blazer', 'mantel', 'coat', 'trenchcoat', 'trench', 'kostüm', 'kostuem',
  'bluse', 'blouse', 'hemd', 'shirt', 'midi', 'maxi', 'plisse', 'plissee',
  'pleated', 'wickel', 'wrap', 'kleid', 'dress', 'robe', 'pumps', 'loafer',
  'ballerina', 'slingback', 'mokassin', 'perlen', 'pearl', 'seidentuch',
  'carre', 'carré', 'etui', 'anzug', 'suit', 'pencil', 'a-linie', 'a-line',
  'kaschmirpullover', 'rollkragen', 'turtleneck', 'feinstrick',
]
const SEXY_ELEGANT_WORDS = [
  'schulterfrei', 'off-shoulder', 'off the shoulder', 'rückenfrei', 'rueckenfrei',
  'open back', 'backless', 'figurbetont', 'bodycon', 'fitted', 'schlitz', 'slit',
  'cut-out', 'cutout', 'satinkleid', 'seidenkleid', 'slip dress', 'slipdress',
  'korsage', 'bustier', 'neckholder', 'halter', 'tief ausgeschnitten', 'v-ausschnitt',
  'v-neck', 'deep v', 'bandeau', 'trägerlos', 'traegerlos', 'strapless',
  'high heels', 'stiletto', 'sandalette', 'absatz', 'heeled',
]
const CHEAP_SIGNALS = [
  'party', 'clubwear', 'festival', 'rave', 'pailletten bunt', 'neon',
  'fast fashion', 'polyester glanz', 'billig', 'cheap', 'y2k',
  'mesh durchsichtig', 'micro mini', 'minirock ultra', 'logo all over',
  'plüsch', 'pluesch fun', 'kostüm karneval', 'fasching',
]
const EVERYDAY_WORDS = [
  't-shirt', 'tshirt', 'strick', 'knit', 'pullover', 'sweater', 'cardigan',
  'hose', 'trousers', 'pants', 'jeans', 'chino', 'rock', 'skirt', 'loafer',
  'ballerina', 'sneaker', 'flats', 'tasche', 'bag', 'shirt', 'top', 'basic',
  'everyday', 'alltag', 'bluse',
]

const CATEGORY_KEYWORDS = {
  dress: ['kleid', 'dress', 'robe', 'kostüm', 'kostuem', 'jumpsuit', 'overall', 'gown'],
  top: ['top', 'bluse', 'blouse', 'hemd', 'shirt', 't-shirt', 'tshirt', 'pullover',
    'pulli', 'sweater', 'strickpullover', 'rollkragen', 'turtleneck', 'bustier',
    'korsage', 'body', 'cami', 'tank', 'feinstrick', 'twinset', 'weste oben'],
  bottom: ['hose', 'trousers', 'pants', 'jeans', 'chino', 'rock', 'skirt', 'shorts',
    'leggings', 'culotte', 'marlene', 'palazzo', 'bermuda', 'midirock', 'maxirock'],
  outerwear: ['blazer', 'mantel', 'coat', 'trench', 'trenchcoat', 'jacke', 'jacket',
    'cardigan', 'cape', 'weste', 'blouson', 'steppjacke', 'wollmantel'],
  shoes: ['schuh', 'shoe', 'pumps', 'loafer', 'mokassin', 'ballerina', 'sandale',
    'sandalette', 'sneaker', 'stiefel', 'boots', 'slingback', 'heel', 'absatz',
    'espadrille', 'mule', 'flats', 'ballerinas'],
  bag: ['tasche', 'bag', 'handtasche', 'shopper', 'clutch', 'schultertasche',
    'umhängetasche', 'umhaengetasche', 'tote', 'crossbody', 'beuteltasche',
    'henkeltasche', 'pouch', 'bucket bag'],
  jewelry: ['kette', 'necklace', 'ohrring', 'earring', 'ohrstecker', 'creole', 'armband',
    'bracelet', 'ring', 'schmuck', 'jewel', 'anhänger', 'anhaenger', 'perlen',
    'pearl', 'uhr', 'watch', 'brosche', 'seidentuch', 'carre', 'carré', 'schal',
    'tuch', 'guertel', 'gürtel', 'belt', 'sonnenbrille', 'sunglasses'],
}
const CATEGORY_ORDER = ['dress', 'outerwear', 'shoes', 'bag', 'jewelry', 'bottom', 'top']

export function detectColor(text) {
  const t = (text || '').toLowerCase()
  for (const [canonical, variants] of Object.entries(PALETTE)) {
    for (const v of variants) if (t.includes(v)) return canonical
  }
  return null
}

export function detectCategory(text) {
  const t = (text || '').toLowerCase()
  for (const cat of CATEGORY_ORDER) {
    for (const kw of CATEGORY_KEYWORDS[cat]) {
      if (t.includes(kw)) return cat
    }
  }
  return 'other'
}

const count = (text, words) => words.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0)
const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)))

export function scoreProduct(name, category, color, extra = '') {
  const text = [name || '', category || '', color || '', extra || ''].join(' ').toLowerCase()
  const colorNorm = PALETTE[color] ? color : detectColor(text)
  const inPalette = !!PALETTE[colorNorm]
  const offPalette = OFF_PALETTE.some((c) => text.includes(c))

  const mat = count(text, LUX_MATERIALS)
  const lux = count(text, LUX_WORDS)
  const eleg = count(text, ELEGANT_WORDS)
  const sexy = count(text, SEXY_ELEGANT_WORDS)
  const every = count(text, EVERYDAY_WORDS)
  const cheap = count(text, CHEAP_SIGNALS)
  const base = 45

  let luxury = base + mat * 16 + lux * 12 + (inPalette ? 10 : 0) - cheap * 22
  if (offPalette) luxury -= 18

  let elegant = base + eleg * 12 + mat * 8 + (inPalette ? 12 : 0) - cheap * 20
  if (offPalette) elegant -= 15

  let oldmoney = base + (inPalette ? 18 : -10) + mat * 12 + lux * 10 + eleg * 6
  oldmoney -= cheap * 26
  if (offPalette) oldmoney -= 30
  if (text.includes('logo') || text.includes('all over print')) oldmoney -= 12

  let sexyScore = base + sexy * 18 + (inPalette ? 8 : 0) - cheap * 14
  if (sexy && mat) sexyScore += 10

  let everyday = base + every * 12 + (inPalette ? 8 : 0)
  if (sexy > 1) everyday -= 10
  if (text.includes('abendkleid') || text.includes('gown') || text.includes('maxikleid abend')) everyday -= 18

  const scores = {
    oldmoney: clamp(oldmoney),
    elegant: clamp(elegant),
    luxury: clamp(luxury),
    sexy: clamp(sexyScore),
    everyday: clamp(everyday),
  }
  scores.overall = clamp(
    0.34 * scores.oldmoney + 0.26 * scores.elegant + 0.24 * scores.luxury + 0.16 * scores.everyday
  )

  const tags = []
  if (inPalette) tags.push(`Palette: ${colorNorm}`)
  if (mat) tags.push('edles Material')
  if (scores.oldmoney >= 70) tags.push('Old Money')
  if (scores.sexy >= 65) tags.push('elegant-sexy')
  if (cheap || offPalette) tags.push('⚠ Stil-Check')

  return { scores, tags, color: colorNorm }
}
