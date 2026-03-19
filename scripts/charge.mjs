/**
 * Test de charge QR-QUIZ — N joueurs simultanés
 * Usage : node scripts/charge.mjs [base_url] [nb_joueurs]
 * Exemple : node scripts/charge.mjs https://quiz.dedobbeleer.online 10
 */

const BASE = process.argv[2] || 'http://localhost:3000'
const NB_JOUEURS = parseInt(process.argv[3] || '10')
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin@dedobbeleer.online'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin_QrQuiz_2026x'
const RUN_ID = Date.now()

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timings = {}   // { endpoint: [ms, ms, ...] }

function recordTiming(endpoint, ms) {
  if (!timings[endpoint]) timings[endpoint] = []
  timings[endpoint].push(ms)
}

async function api(method, path, body, cookieJar, label) {
  const headers = { 'Content-Type': 'application/json' }
  if (cookieJar.value) headers['Cookie'] = cookieJar.value

  const t0 = Date.now()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const elapsed = Date.now() - t0

  if (label) recordTiming(label, elapsed)

  const setCookie = res.headers.get('set-cookie')
  if (setCookie) {
    const existing = cookieJar.value ? cookieJar.value.split('; ') : []
    for (const nc of setCookie.split(',').map(c => c.split(';')[0].trim())) {
      const name = nc.split('=')[0]
      const idx = existing.findIndex(e => e.startsWith(name + '='))
      if (idx >= 0) existing[idx] = nc; else existing.push(nc)
    }
    cookieJar.value = existing.join('; ')
  }

  let data = null
  if ((res.headers.get('content-type') || '').includes('application/json')) {
    try { data = await res.json() } catch { data = null }
  }
  return { status: res.status, data, elapsed }
}

function pct(arr, p) {
  if (!arr || arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  return sorted[Math.ceil((p / 100) * sorted.length) - 1]
}

function avg(arr) {
  if (!arr || arr.length === 0) return 0
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
}

// ─── Parcours d'un joueur ─────────────────────────────────────────────────────

async function runPlayer(index) {
  const jar = { value: '' }
  const email = `charge.${RUN_ID}.joueur${index}@test-auto.invalid`
  const errors = []
  const t0 = Date.now()

  // Inscription
  const reg = await api('POST', '/api/participants', {
    firstName: `Joueur`, lastName: `${String(index).padStart(2, '0')}`,
    email, phone: `+3249${String(index).padStart(7, '0')}`,
  }, jar, 'POST /api/participants')

  if (reg.status !== 201) {
    errors.push(`Inscription échouée (${reg.status}): ${JSON.stringify(reg.data)}`)
    return { index, participantId: null, success: false, errors, elapsed: Date.now() - t0 }
  }

  const participantId = reg.data.id

  // Progress
  const prog = await api('GET', `/api/participants/${participantId}/progress`, null, jar, 'GET /progress')
  if (prog.status !== 200) {
    errors.push(`Progress échouée (${prog.status})`)
    return { index, participantId, success: false, errors, elapsed: Date.now() - t0 }
  }

  const stations = prog.data.stations || []
  if (stations.length === 0) {
    errors.push('Aucune station dans le parcours')
    return { index, participantId, success: false, errors, elapsed: Date.now() - t0 }
  }

  // Répondre à chaque station
  for (const station of stations) {
    const ans = await api('POST', '/api/answers',
      { stationId: station.id, selectedOption: index % 4 },
      jar, 'POST /api/answers')
    if (ans.status !== 200) {
      errors.push(`Réponse station ${station.stationCode} échouée (${ans.status})`)
    }
  }

  // Vérifier isComplete
  const progFinal = await api('GET', `/api/participants/${participantId}/progress`, null, jar, 'GET /progress')
  if (!progFinal.data?.isComplete) {
    errors.push('isComplete = false à la fin du parcours')
  }

  // Question subsidiaire
  const sub = await api('POST', '/api/subsidiary',
    { answerText: `Réponse charge joueur ${index}` }, jar, 'POST /api/subsidiary')
  if (sub.status !== 200) {
    errors.push(`Subsidiaire échouée (${sub.status})`)
  }

  return {
    index,
    participantId,
    success: errors.length === 0,
    errors,
    elapsed: Date.now() - t0,
  }
}

// ─── Nettoyage via reset admin ────────────────────────────────────────────────

async function cleanupViaAdmin(participantIds) {
  // On ne peut pas supprimer individuellement (pas d'endpoint DELETE /participant).
  // On liste les IDs pour info seulement.
  process.stdout.write(`\n  ${participantIds.length} participant(s) de test créés (emails *@test-auto.invalid).\n`)
  process.stdout.write(`  Supprimez-les depuis /admin/participants ou via un reset.\n`)
}

// ─── Race condition test ───────────────────────────────────────────────────────

async function testRaceCondition() {
  process.stdout.write(`\n\x1b[1m\x1b[34m── RACE CONDITIONS\x1b[0m\n`)

  // Test : 5 inscriptions simultanées avec le même email → 1 seul doit passer
  const sameEmail = `race.${RUN_ID}@test-auto.invalid`
  const attempts = 5
  const results = await Promise.all(
    Array.from({ length: attempts }, (_, i) =>
      api('POST', '/api/participants', {
        firstName: 'Race', lastName: `User${i}`,
        email: sameEmail, phone: `+3249${String(i + 10).padStart(7, '0')}`,
      }, { value: '' }, null)
    )
  )

  const successes = results.filter(r => r.status === 201)
  const blocked = results.filter(r => r.status === 409 || r.status === 500)
  const unexpected = results.filter(r => r.status !== 201 && r.status !== 409 && r.status !== 500)

  if (successes.length === 1 && blocked.length === attempts - 1 && unexpected.length === 0) {
    process.stdout.write(`  \x1b[32m✓\x1b[0m ${attempts} inscriptions simultanées même email → 1 acceptée, ${blocked.length} refusées\n`)
  } else if (successes.length === 1 && unexpected.length === 0) {
    process.stdout.write(`  \x1b[33m⚠\x1b[0m  1 acceptée, ${blocked.filter(r=>r.status===409).length}×409, ${blocked.filter(r=>r.status===500).length}×500 — corrigez le catch P2002 dans /api/participants\n`)
  } else {
    process.stdout.write(`  \x1b[31m✗\x1b[0m Race condition critique : ${successes.length} inscriptions acceptées pour le même email !\n`)
  }

  // Nettoyage du participant race
  // (sera dans la liste des test-auto.invalid)
  return successes.length === 1 ? successes[0].data?.id : null
}

// ─── Rapport timings ──────────────────────────────────────────────────────────

function printTimings() {
  process.stdout.write(`\n\x1b[1m\x1b[34m── TEMPS DE RÉPONSE (${NB_JOUEURS} joueurs simultanés)\x1b[0m\n`)

  const rows = [
    ['Endpoint', 'N', 'Moy', 'p50', 'p95', 'Max'],
    ['─────────────────────────', '──', '────', '────', '────', '────'],
  ]

  for (const [ep, times] of Object.entries(timings)) {
    rows.push([
      ep,
      String(times.length),
      `${avg(times)}ms`,
      `${pct(times, 50)}ms`,
      `${pct(times, 95)}ms`,
      `${Math.max(...times)}ms`,
    ])
  }

  const cols = rows[0].map((_, i) => Math.max(...rows.map(r => r[i].length)))
  for (const row of rows) {
    process.stdout.write('  ' + row.map((cell, i) => cell.padEnd(cols[i])).join('  ') + '\n')
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  process.stdout.write(`\n\x1b[1mTEST DE CHARGE QR-QUIZ\x1b[0m — ${BASE}\n`)
  process.stdout.write(`${NB_JOUEURS} joueurs simultanés · ${new Date().toLocaleTimeString('fr-BE')}\n`)

  // ── Charge principale ──
  process.stdout.write(`\n\x1b[1m\x1b[34m── PARCOURS SIMULTANÉS\x1b[0m\n`)
  process.stdout.write(`  Lancement de ${NB_JOUEURS} joueurs en parallèle…\n\n`)

  const globalStart = Date.now()
  const results = await Promise.all(
    Array.from({ length: NB_JOUEURS }, (_, i) => runPlayer(i + 1))
  )
  const globalElapsed = Date.now() - globalStart

  // Résumé par joueur
  let allSuccess = true
  for (const r of results) {
    const icon = r.success ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'
    process.stdout.write(`  ${icon} Joueur ${String(r.index).padStart(2)} — ${r.elapsed}ms`)
    if (!r.success) {
      allSuccess = false
      process.stdout.write(` → ${r.errors.join(', ')}`)
    }
    process.stdout.write('\n')
  }

  // ── Race conditions ──
  const raceId = await testRaceCondition()

  // ── Timings ──
  printTimings()

  // ── Nettoyage ──
  const participantIds = results.filter(r => r.participantId).map(r => r.participantId)
  if (raceId) participantIds.push(raceId)
  await cleanupViaAdmin(participantIds)

  // ── Verdict ──
  const successCount = results.filter(r => r.success).length
  process.stdout.write('\n' + '─'.repeat(40) + '\n')
  process.stdout.write(`Durée totale : ${globalElapsed}ms pour ${NB_JOUEURS} parcours complets\n`)
  if (allSuccess) {
    process.stdout.write(`\x1b[1m\x1b[32m✓ CHARGE OK — ${successCount}/${NB_JOUEURS} joueurs ont complété le parcours\x1b[0m\n\n`)
  } else {
    process.stdout.write(`\x1b[1m\x1b[31m✗ CHARGE KO — ${successCount}/${NB_JOUEURS} joueurs ont complété le parcours\x1b[0m\n\n`)
  }

  process.exit(allSuccess ? 0 : 1)
}

main()
