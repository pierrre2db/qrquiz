/**
 * Simulation de démonstration QR-QUIZ
 * Génère N joueurs avec des profils de performance variés (0% → 100%)
 * Usage : node scripts/demo.mjs [base_url] [nb_joueurs]
 */

const BASE = process.argv[2] || 'https://quiz.dedobbeleer.online'
const NB_JOUEURS = parseInt(process.argv[3] || '10')
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin@dedobbeleer.online'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin_QrQuiz_2026x'
const RUN_ID = Date.now()

// Profils de joueurs — probabilité de donner la bonne réponse
const PROFILES = [
  { name: 'Expert',    correctRate: 1.00 },
  { name: 'Expert',    correctRate: 1.00 },
  { name: 'Bon',       correctRate: 0.80 },
  { name: 'Bon',       correctRate: 0.70 },
  { name: 'Moyen',     correctRate: 0.50 },
  { name: 'Moyen',     correctRate: 0.40 },
  { name: 'Faible',    correctRate: 0.25 },
  { name: 'Faible',    correctRate: 0.20 },
  { name: 'Nul',       correctRate: 0.10 },
  { name: 'Nul',       correctRate: 0.00 },
]

const FIRST_NAMES = ['Alice', 'Baptiste', 'Clara', 'David', 'Emma', 'François', 'Giulia', 'Hugo', 'Inès', 'Jules']
const LAST_NAMES  = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Simon']

function randomWrongOption(correct) {
  const options = [0, 1, 2, 3].filter(o => o !== correct)
  return options[Math.floor(Math.random() * options.length)]
}

async function apiAs(method, path, body, jar) {
  const headers = { 'Content-Type': 'application/json' }
  if (jar?.value) headers['Cookie'] = jar.value
  const res = await fetch(`${BASE}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  })
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

async function main() {
  process.stdout.write(`\n\x1b[1mSIMULATION DÉMO QR-QUIZ\x1b[0m — ${BASE}\n`)
  process.stdout.write(`${NB_JOUEURS} joueurs · profils variés\n`)

  // ── 1. Login admin ──
  const adminJar = { value: '' }
  const login = await apiAs('POST', '/api/admin/auth/login',
    { login: ADMIN_LOGIN, password: ADMIN_PASSWORD }, adminJar)
  if (!login.data?.success) { process.stdout.write('\x1b[31mLogin admin échoué\x1b[0m\n'); process.exit(1) }

  // ── 2. Reset du jeu ──
  process.stdout.write('\n\x1b[90mReset du jeu…\x1b[0m\n')
  const reset = await apiAs('POST', '/api/admin/reset', { password: ADMIN_PASSWORD }, adminJar)
  if (!reset.data?.success) { process.stdout.write('\x1b[31mReset échoué\x1b[0m\n'); process.exit(1) }
  process.stdout.write('\x1b[32m✓\x1b[0m Jeu réinitialisé\n')

  // ── 3. Récupérer les questions avec bonnes réponses ──
  const qRes = await apiAs('GET', '/api/admin/questions', null, adminJar)
  const questions = qRes.data || []
  if (questions.length === 0) { process.stdout.write('\x1b[31mAucune question trouvée\x1b[0m\n'); process.exit(1) }
  process.stdout.write(`\x1b[32m✓\x1b[0m ${questions.length} questions chargées\n\n`)

  // ── 4. Simuler les joueurs en parallèle ──
  process.stdout.write('\x1b[1m\x1b[34m── SIMULATION DES JOUEURS\x1b[0m\n')

  const profiles = PROFILES.slice(0, NB_JOUEURS)

  const results = await Promise.all(profiles.map(async (profile, i) => {
    const jar = { value: '' }
    const firstName = FIRST_NAMES[i] || `Joueur${i+1}`
    const lastName  = LAST_NAMES[i]  || `Demo${i+1}`
    const email = `demo.${RUN_ID}.${i}@demo.invalid`

    // Inscription
    const reg = await apiAs('POST', '/api/participants', {
      firstName, lastName, email,
      phone: `+3249${String(i + 1).padStart(7, '0')}`,
    }, jar)
    if (reg.status !== 201) return { firstName, lastName, profile, score: 0, total: 0, error: `Inscription échouée (${reg.status})` }

    const participantId = reg.data.id

    // Répondre à chaque question selon le profil
    let correct = 0
    for (const q of questions) {
      const giveCorrect = Math.random() < profile.correctRate
      const selectedOption = giveCorrect
        ? q.correctAnswer
        : randomWrongOption(q.correctAnswer)

      await apiAs('POST', '/api/answers', { stationId: q.id, selectedOption }, jar)
      if (giveCorrect) correct++
    }

    // Réponse subsidiaire
    await apiAs('POST', '/api/subsidiary', { answerText: `${firstName} — réponse de démo` }, jar)

    const pct = Math.round((correct / questions.length) * 100)
    return { firstName, lastName, profile, score: correct, total: questions.length, pct, participantId }
  }))

  // ── 5. Rapport ──
  process.stdout.write('\n')
  for (const r of results) {
    if (r.error) {
      process.stdout.write(`  \x1b[31m✗\x1b[0m ${r.firstName} ${r.lastName} (${r.profile.name}) — ${r.error}\n`)
      continue
    }
    const bar = '█'.repeat(Math.round(r.pct / 10)) + '░'.repeat(10 - Math.round(r.pct / 10))
    const color = r.pct >= 70 ? '\x1b[32m' : r.pct >= 40 ? '\x1b[33m' : '\x1b[31m'
    process.stdout.write(`  ${color}${bar}\x1b[0m  ${String(r.pct).padStart(3)}%  ${r.firstName} ${r.lastName} \x1b[90m(${r.profile.name} · ${r.score}/${r.total})\x1b[0m\n`)
  }

  const success = results.filter(r => !r.error).length
  process.stdout.write(`\n${'─'.repeat(40)}\n`)
  process.stdout.write(`\x1b[1m\x1b[32m✓ ${success}/${NB_JOUEURS} joueurs simulés\x1b[0m\n`)
  process.stdout.write(`Résultats visibles sur ${BASE}/admin/results\n\n`)
}

main()
