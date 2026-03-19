/**
 * Seed 9 questions cuisine via l'API admin
 * Usage : node scripts/seed-questions.mjs [base_url]
 */

const BASE = process.argv[2] || 'https://quiz.dedobbeleer.online'
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin@dedobbeleer.online'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin_QrQuiz_2026x'

const QUESTIONS = [
  {
    stationLabel: 'Chocolat — Tempérage',
    stationCode: '201',
    question: "À quelle température finale doit-on stabiliser un chocolat noir lors du tempérage pour obtenir un brillant optimal ?",
    optionA: "24–25 °C",
    optionB: "28–29 °C",
    optionC: "31–32 °C",
    optionD: "36–38 °C",
    correctAnswer: 2,
    explanation: "Le tempérage suit trois étapes : fonte à 50–55 °C, descente à 27–28 °C, remontée à 31–32 °C. Cette dernière stabilise les cristaux bêta du beurre de cacao, responsables du brillant et du claquant.",
  },
  {
    stationLabel: 'Chocolat — Réglementation',
    stationCode: '202',
    question: "Quel pourcentage minimum de cacao total doit contenir un chocolat pour être qualifié de « chocolat noir » selon la réglementation européenne ?",
    optionA: "25 %",
    optionB: "35 %",
    optionC: "50 %",
    optionD: "60 %",
    correctAnswer: 1,
    explanation: "La directive européenne 2000/36/CE exige un minimum de 35 % de cacao total (dont 18 % de beurre de cacao et 14 % de cacao sec dégraissé) pour qu'un produit soit appelé « chocolat noir ».",
  },
  {
    stationLabel: 'Fromage — AOP',
    stationCode: '203',
    question: "Quel fromage français a obtenu la première appellation d'origine contrôlée en 1925 ?",
    optionA: "Camembert de Normandie",
    optionB: "Comté",
    optionC: "Brie de Meaux",
    optionD: "Roquefort",
    correctAnswer: 3,
    explanation: "Le Roquefort est le premier fromage au monde à avoir obtenu une AOC, en 1925. Fabriqué à partir de lait cru de brebis Lacaune, il est affiné dans les caves naturelles de Combalou à Roquefort-sur-Soulzon.",
  },
  {
    stationLabel: 'Fromage — Pasta filata',
    stationCode: '204',
    question: "La technique qui consiste à étirer et plier une pâte de fromage dans de l'eau chaude s'appelle :",
    optionA: "L'affinage en morge",
    optionB: "La pasta filata",
    optionC: "La coagulation enzymatique",
    optionD: "Le moulage par pression",
    correctAnswer: 1,
    explanation: "La pasta filata (« pâte filée ») est utilisée pour la mozzarella, la burrata ou le provolone. Le caillé est plongé dans de l'eau à 80–90 °C puis étiré et replié jusqu'à obtenir une texture lisse et élastique.",
  },
  {
    stationLabel: 'Miel — Conservation',
    stationCode: '205',
    question: "Quelle est la teneur en eau maximale d'un miel pour éviter toute fermentation ?",
    optionA: "25 %",
    optionB: "22 %",
    optionC: "20 %",
    optionD: "18 %",
    correctAnswer: 3,
    explanation: "Au-delà de 18 % d'eau, des levures osmophiles peuvent se développer et provoquer la fermentation. En dessous de ce seuil, la pression osmotique est trop élevée pour permettre toute activité microbienne.",
  },
  {
    stationLabel: 'Sauce — Sauces mères',
    stationCode: '206',
    question: "Laquelle de ces sauces fait partie des cinq sauces mères codifiées par Auguste Escoffier ?",
    optionA: "Sauce béarnaise",
    optionB: "Sauce gribiche",
    optionC: "Sauce velouté",
    optionD: "Sauce ravigote",
    correctAnswer: 2,
    explanation: "Escoffier a défini cinq sauces mères : béchamel, velouté, espagnole, tomate et hollandaise. La béarnaise est dérivée de la hollandaise ; la gribiche et la ravigote sont des sauces froides dérivées.",
  },
  {
    stationLabel: 'Sauce — Liaison par réduction',
    stationCode: '207',
    question: "Quel est le principe d'une liaison de sauce par réduction ?",
    optionA: "Ajouter de la fécule de maïs diluée dans de l'eau froide",
    optionB: "Incorporer du beurre froid en petits morceaux hors du feu",
    optionC: "Ajouter un jaune d'oeuf battu en filet",
    optionD: "Évaporer l'eau par ébullition pour concentrer les sucs et épaissir naturellement",
    correctAnswer: 3,
    explanation: "La réduction consiste à maintenir un liquide à ébullition pour en évaporer l'eau. La concentration en protéines, sucres et collagènes augmente, épaississant la sauce et intensifiant ses arômes sans épaississant ajouté.",
  },
  {
    stationLabel: 'Technique — Beurre clarifié',
    stationCode: '208',
    question: "La clarification du beurre consiste à :",
    optionA: "Fouetter le beurre fondu pour incorporer de l'air",
    optionB: "Éliminer les protéines du lait et l'eau par fonte douce",
    optionC: "Congeler le beurre puis le râper finement",
    optionD: "Mélanger le beurre avec du sel et des herbes fraîches",
    correctAnswer: 1,
    explanation: "Le beurre clarifié (ghee) est obtenu en faisant fondre le beurre à feu doux, puis en écumant les caséines en surface et en retirant les résidus au fond. Son point de fumée monte à ~250 °C (contre ~150 °C) et sa conservation est bien supérieure.",
  },
  {
    stationLabel: 'Technique — Sous-vide',
    stationCode: '209',
    question: "Quel avantage principal la cuisson sous-vide offre-t-elle par rapport à une cuisson traditionnelle ?",
    optionA: "Elle produit une croûte dorée et croustillante directement",
    optionB: "Elle réduit fortement les temps de cuisson",
    optionC: "Elle permet une cuisson précise et homogène à basse température en préservant les jus",
    optionD: "Elle caramélise les sucres en surface de l'aliment",
    correctAnswer: 2,
    explanation: "La cuisson sous-vide consiste à placer l'aliment dans un sac hermétique dans un bain-marie à température précise (55–85 °C). La cuisson est parfaitement homogène, les jus et arômes sont préservés, sans risque de surcuisson.",
  },
]

async function main() {
  // Login
  const jar = { value: '' }
  const loginRes = await fetch(`${BASE}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: ADMIN_LOGIN, password: ADMIN_PASSWORD }),
  })
  const setCookie = loginRes.headers.get('set-cookie')
  if (setCookie) jar.value = setCookie.split(',').map(c => c.split(';')[0].trim()).join('; ')
  if (!loginRes.ok) { console.error('Login échoué'); process.exit(1) }

  // Récupérer les codes existants
  const existing = await fetch(`${BASE}/api/admin/qrcodes`, {
    headers: { Cookie: jar.value },
  }).then(r => r.json())
  const existingCodes = new Set(existing.map(q => q.stationCode))

  let inserted = 0, skipped = 0
  for (const q of QUESTIONS) {
    if (existingCodes.has(q.stationCode)) {
      console.log(`  ⏭  ${q.stationCode} ${q.stationLabel} — déjà présent, ignoré`)
      skipped++
      continue
    }

    const res = await fetch(`${BASE}/api/admin/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: jar.value },
      body: JSON.stringify(q),
    })
    const data = await res.json()
    if (res.status === 201) {
      console.log(`  ✓  ${q.stationCode} ${q.stationLabel}`)
      inserted++
    } else {
      console.log(`  ✗  ${q.stationCode} ${q.stationLabel} — ${data.error || res.status}`)
    }
  }

  console.log(`\nTerminé : ${inserted} insérées, ${skipped} ignorées.`)
}

main()
