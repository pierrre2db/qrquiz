/**
 * Live demo — 25 joueurs échelonnés sur ~5 minutes
 * Usage : node scripts/live-demo.mjs [base_url] [nb_joueurs]
 */

const BASE = process.argv[2] || 'https://quiz.dedobbeleer.online'
const NB = Math.min(parseInt(process.argv[3] || '25'), 25)
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin@dedobbeleer.online'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin_QrQuiz_2026x'
const RUN_ID = Date.now()
const STAGGER_S = 7   // secondes entre chaque départ
const MIN_DELAY = 4000 // ms entre deux réponses (min)
const MAX_DELAY = 10000 // ms entre deux réponses (max)

const PLAYERS = [
  { firstName: 'Alice',     lastName: 'Martin',    correctRate: 1.00 },
  { firstName: 'Baptiste',  lastName: 'Bernard',   correctRate: 0.90 },
  { firstName: 'Clara',     lastName: 'Dubois',    correctRate: 0.90 },
  { firstName: 'David',     lastName: 'Thomas',    correctRate: 0.80 },
  { firstName: 'Emma',      lastName: 'Robert',    correctRate: 0.80 },
  { firstName: 'François',  lastName: 'Richard',   correctRate: 0.70 },
  { firstName: 'Giulia',    lastName: 'Petit',     correctRate: 0.70 },
  { firstName: 'Hugo',      lastName: 'Durand',    correctRate: 0.60 },
  { firstName: 'Inès',      lastName: 'Leroy',     correctRate: 0.60 },
  { firstName: 'Jules',     lastName: 'Simon',     correctRate: 0.50 },
  { firstName: 'Karim',     lastName: 'Laurent',   correctRate: 0.50 },
  { firstName: 'Laura',     lastName: 'Michel',    correctRate: 0.50 },
  { firstName: 'Maxime',    lastName: 'Garcia',    correctRate: 0.40 },
  { firstName: 'Nina',      lastName: 'David',     correctRate: 0.40 },
  { firstName: 'Oscar',     lastName: 'Roux',      correctRate: 0.40 },
  { firstName: 'Pauline',   lastName: 'Vincent',   correctRate: 0.30 },
  { firstName: 'Quentin',   lastName: 'Fournier',  correctRate: 0.30 },
  { firstName: 'Romain',    lastName: 'Morel',     correctRate: 0.30 },
  { firstName: 'Sophie',    lastName: 'Girard',    correctRate: 0.20 },
  { firstName: 'Thomas',    lastName: 'André',     correctRate: 0.20 },
  { firstName: 'Ugo',       lastName: 'Lefebvre',  correctRate: 0.10 },
  { firstName: 'Vanessa',   lastName: 'Mercier',   correctRate: 0.10 },
  { firstName: 'William',   lastName: 'Dupont',    correctRate: 0.80 },
  { firstName: 'Xénia',     lastName: 'Bonnet',    correctRate: 0.60 },
  { firstName: 'Yann',      lastName: 'Lambert',   correctRate: 1.00 },
]

const delay = (min, max) => new Promise(r => setTimeout(r, min + Math.random() * (max - min)))
const sleep = ms => new Promise(r => setTimeout(r, ms))
const randomWrong = correct => { const o = [0,1,2,3].filter(x => x !== correct); return o[Math.floor(Math.random()*o.length)] }

async function api(method, path, body, jar) {
  const headers = { 'Content-Type': 'application/json' }
  if (jar?.value) headers['Cookie'] = jar.value
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const setCookie = res.headers.get('set-cookie')
  if (setCookie && jar) {
    const existing = jar.value ? jar.value.split('; ') : []
    for (const nc of setCookie.split(',').map(c => c.split(';')[0].trim())) {
      const name = nc.split('=')[0]
      const idx = existing.findIndex(e => e.startsWith(name + '='))
      if (idx >= 0) existing[idx] = nc; else existing.push(nc)
    }
    jar.value = existing.join('; ')
  }
  let data = null
  if ((res.headers.get('content-type') || '').includes('application/json'))
    try { data = await res.json() } catch { data = null }
  return { status: res.status, data }
}

const C = { reset:'\x1b[0m', bold:'\x1b[1m', green:'\x1b[32m', yellow:'\x1b[33m', red:'\x1b[31m', cyan:'\x1b[36m', gray:'\x1b[90m', magenta:'\x1b[35m', blue:'\x1b[34m' }
const COLORS = [C.cyan, C.yellow, C.magenta, C.blue, C.green, '\x1b[96m', '\x1b[93m', '\x1b[95m']
const col = i => COLORS[i % COLORS.length]
const log = msg => process.stdout.write(msg + '\n')

async function runPlayer(player, questions, idx) {
  await sleep(idx * STAGGER_S * 1000)
  const jar = { value: '' }
  const tag = `${col(idx)}[${(player.firstName).padEnd(8)}]${C.reset}`

  const reg = await api('POST', '/api/participants', {
    firstName: player.firstName,
    lastName: player.lastName,
    email: `live.${RUN_ID}.${idx}@demo.invalid`,
    phone: `+32490${String(idx + 1).padStart(6, '0')}`,
  }, jar)

  if (reg.status !== 201) {
    log(`${tag} ${C.red}✗ Inscription échouée (${reg.status})${C.reset}`)
    return { error: true }
  }
  log(`${tag} ${C.green}✓ Inscrit${C.reset}`)

  let correct = 0
  for (let i = 0; i < questions.length; i++) {
    await delay(MIN_DELAY, MAX_DELAY)
    const q = questions[i]
    const ok = Math.random() < player.correctRate
    const selected = ok ? q.correctAnswer : randomWrong(q.correctAnswer)
    const res = await api('POST', '/api/answers', { stationId: q.id, selectedOption: selected }, jar)
    if (res.status === 200 || res.status === 201) {
      if (ok) correct++
      const filled = Math.round(((i + 1) / questions.length) * 10)
      const bar = '█'.repeat(filled) + '░'.repeat(10 - filled)
      log(`${tag} ${ok ? C.green+'✓' : C.red+'✗'}${C.reset} ${q.stationLabel.slice(0,18).padEnd(18)} ${C.gray}[${bar}]${C.reset}`)
    }
  }

  await delay(2000, 5000)
  await api('POST', '/api/subsidiary', { answerText: `${player.firstName} — démo` }, jar)

  const pct = Math.round((correct / questions.length) * 100)
  const sc = pct >= 80 ? C.green : pct >= 50 ? C.yellow : C.red
  log(`${tag} ${C.bold}FIN ${sc}${correct}/${questions.length} · ${pct}%${C.reset}`)
  return { correct, total: questions.length, pct }
}

async function main() {
  const players = PLAYERS.slice(0, NB)
  const estimatedEnd = Math.round((NB - 1) * STAGGER_S + questions_placeholder * ((MIN_DELAY + MAX_DELAY) / 2 / 1000))

  log(`\n${C.bold}LIVE DEMO QR-QUIZ${C.reset} — ${BASE}`)
  log(`${NB} joueurs · départ toutes les ${STAGGER_S}s · durée estimée ~${Math.round(estimatedEnd / 60)} min\n`)

  // Login admin
  const adminJar = { value: '' }
  const login = await api('POST', '/api/admin/auth/login', { login: ADMIN_LOGIN, password: ADMIN_PASSWORD }, adminJar)
  if (!login.data?.success) { log(`${C.red}Login admin échoué${C.reset}`); process.exit(1) }

  // Reset
  process.stdout.write(`${C.gray}Réinitialisation…${C.reset} `)
  const reset = await api('POST', '/api/admin/reset', { password: ADMIN_PASSWORD }, adminJar)
  if (!reset.data?.success) { log(`${C.red}échoué${C.reset}`); process.exit(1) }
  log(`${C.green}✓${C.reset}`)

  // Questions
  const qRes = await api('GET', '/api/admin/questions', null, adminJar)
  const questions = qRes.data || []
  if (!questions.length) { log(`${C.red}Aucune question${C.reset}`); process.exit(1) }

  const estimated = Math.round(((NB - 1) * STAGGER_S + questions.length * ((MIN_DELAY + MAX_DELAY) / 2 / 1000)) / 60 * 10) / 10
  log(`${C.green}✓${C.reset} ${questions.length} questions chargées`)
  log(`\n${C.bold}Ouvrez ${BASE}/welcome dans votre navigateur !${C.reset}`)
  log(`Durée estimée : ~${estimated} min\n`)
  log(`${C.gray}${'─'.repeat(50)}${C.reset}`)

  const start = Date.now()
  const results = await Promise.all(players.map((p, i) => runPlayer(p, questions, i)))

  const elapsed = Math.round((Date.now() - start) / 1000)
  const ok = results.filter(r => !r.error)
  log(`\n${C.gray}${'─'.repeat(50)}${C.reset}`)
  log(`${C.bold}${C.green}✓ ${ok.length}/${NB} joueurs terminés en ${elapsed}s${C.reset}`)

  // Mini podium
  const sorted = ok.sort((a, b) => b.pct - a.pct).slice(0, 5)
  log('')
  sorted.forEach((r, i) => {
    const medals = ['🥇','🥈','🥉','  ','  ']
    const sc = r.pct >= 80 ? C.green : r.pct >= 50 ? C.yellow : C.red
    const bar = '█'.repeat(Math.round(r.pct/10)) + '░'.repeat(10 - Math.round(r.pct/10))
    log(`  ${medals[i]} ${sc}${bar}${C.reset} ${r.pct}%`)
  })
  log(`\n${C.gray}Résultats complets : ${BASE}/admin/results${C.reset}\n`)
}

// Fix: placeholder référencé avant init
const questions_placeholder = 10
main()
