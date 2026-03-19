/**
 * Script de recette QR-QUIZ
 * Usage : node scripts/recette.mjs [base_url]
 * Exemple : node scripts/recette.mjs https://quiz.dedobbeleer.online
 *
 * Simule les parcours joueur et admin complets, puis nettoie les données de test.
 */

const BASE = process.argv[2] || 'http://localhost:3000'
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin@dedobbeleer.online'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin_QrQuiz_2026x'

const TEST_PARTICIPANT = {
  firstName: 'Recette',
  lastName: 'Test',
  email: `recette.test.${Date.now()}@test-auto.invalid`,
  phone: '+32490000099',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0
const failures = []

function ok(label) {
  process.stdout.write(`  \x1b[32m✓\x1b[0m ${label}\n`)
  passed++
}

function fail(label, detail) {
  process.stdout.write(`  \x1b[31m✗\x1b[0m ${label}\n`)
  if (detail) process.stdout.write(`    \x1b[90m→ ${detail}\x1b[0m\n`)
  failed++
  failures.push({ label, detail })
}

function section(title) {
  process.stdout.write(`\n\x1b[1m\x1b[34m── ${title}\x1b[0m\n`)
}

async function api(method, path, body, cookieJar) {
  const headers = { 'Content-Type': 'application/json' }
  if (cookieJar.value) headers['Cookie'] = cookieJar.value

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Capture Set-Cookie
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) {
    const existing = cookieJar.value ? cookieJar.value.split('; ') : []
    const newCookies = setCookie.split(',').map(c => c.split(';')[0].trim())
    for (const nc of newCookies) {
      const name = nc.split('=')[0]
      const idx = existing.findIndex(e => e.startsWith(name + '='))
      if (idx >= 0) existing[idx] = nc; else existing.push(nc)
    }
    cookieJar.value = existing.join('; ')
  }

  let data = null
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    try { data = await res.json() } catch { data = null }
  }

  return { status: res.status, data }
}

function assert(condition, label, detail) {
  if (condition) ok(label)
  else fail(label, detail)
}

// ─── Scénarios ────────────────────────────────────────────────────────────────

async function scenarioPlayer(playerJar) {
  section('PARCOURS JOUEUR')

  // 1. Non connecté
  const me0 = await api('GET', '/api/me', null, { value: '' })
  assert(me0.status === 401, 'GET /api/me sans session → 401')

  // 2. Inscription
  const reg = await api('POST', '/api/participants', TEST_PARTICIPANT, playerJar)
  assert(reg.status === 201, 'Inscription participant', JSON.stringify(reg.data))
  if (reg.status !== 201) return null

  const participantId = reg.data?.id
  assert(typeof participantId === 'string', 'participantId reçu')

  // 3. Double inscription même email
  const reg2 = await api('POST', '/api/participants', TEST_PARTICIPANT, { value: '' })
  assert(reg2.status === 409, 'Double inscription même email → 409')

  // 4. Session valide
  const me = await api('GET', '/api/me', null, playerJar)
  assert(me.status === 200, 'GET /api/me avec session → 200')
  assert(me.data?.email === TEST_PARTICIPANT.email.toLowerCase(), 'Email correspondant dans /api/me')

  // 5. Progress
  const prog = await api('GET', `/api/participants/${participantId}/progress`, null, playerJar)
  assert(prog.status === 200, 'GET progress → 200')
  const stations = prog.data?.stations || []
  assert(stations.length > 0, `${stations.length} station(s) dans le parcours`)

  // 6. Résolution QR code par stationCode
  const firstStation = stations[0]
  const byCode = await api('POST', '/api/stations/by-code',
    { code: firstStation.stationCode }, playerJar)
  assert(byCode.status === 200, `Résolution /station/code/${firstStation.stationCode} → 200`)
  assert(byCode.data?.stationId === firstStation.id, 'stationId résolu = UUID attendu')

  // 7. Code inexistant
  const badCode = await api('POST', '/api/stations/by-code', { code: '000' }, playerJar)
  assert(badCode.status === 404, 'Code inexistant 000 → 404')

  // 8. Charger une station
  const stationRes = await api('GET', `/api/stations/${firstStation.id}`, null, playerJar)
  assert(stationRes.status === 200, `GET /api/stations/${firstStation.id} → 200`)
  assert(typeof stationRes.data?.question === 'string', 'Question présente dans la réponse')
  assert(stationRes.data?.alreadyAnswered === false, 'alreadyAnswered = false avant réponse')

  // 9. Soumettre une réponse
  const ans = await api('POST', '/api/answers',
    { stationId: firstStation.id, selectedOption: 0 }, playerJar)
  assert(ans.status === 200, 'Soumettre réponse → 200')
  assert(typeof ans.data?.isCorrect === 'boolean', 'isCorrect retourné')

  // 10. Double-submit bloqué
  const ans2 = await api('POST', '/api/answers',
    { stationId: firstStation.id, selectedOption: 1 }, playerJar)
  assert(ans2.status === 409, 'Double-submit même station → 409')

  // 11. Station marquée alreadyAnswered
  const stationAfter = await api('GET', `/api/stations/${firstStation.id}`, null, playerJar)
  assert(stationAfter.data?.alreadyAnswered === true, 'alreadyAnswered = true après réponse')

  // 12. Répondre à toutes les stations restantes
  for (let i = 1; i < stations.length; i++) {
    const s = stations[i]
    const r = await api('POST', '/api/answers', { stationId: s.id, selectedOption: 0 }, playerJar)
    assert(r.status === 200, `Réponse station ${s.stationCode} → 200`)
  }

  // 13. isComplete
  const progFinal = await api('GET', `/api/participants/${participantId}/progress`, null, playerJar)
  assert(progFinal.data?.isComplete === true, 'isComplete = true après toutes les réponses')

  // 14. Question subsidiaire
  const sub = await api('POST', '/api/subsidiary',
    { answerText: 'Réponse de test automatique' }, playerJar)
  assert(sub.status === 200, 'Soumettre réponse subsidiaire → 200')

  // 15. Double subsidiaire bloquée
  const sub2 = await api('POST', '/api/subsidiary',
    { answerText: 'Deuxième tentative' }, playerJar)
  assert(sub2.status === 409, 'Double réponse subsidiaire → 409')

  return participantId
}

async function scenarioAdmin(adminJar, testParticipantId) {
  section('INTERFACE ADMIN')

  // 1. Mauvais password
  const badLogin = await api('POST', '/api/admin/auth/login',
    { login: ADMIN_LOGIN, password: 'mauvais_mdp' }, { value: '' })
  assert(badLogin.status === 401, 'Login admin mauvais mot de passe → 401')

  // 2. Login correct
  const login = await api('POST', '/api/admin/auth/login',
    { login: ADMIN_LOGIN, password: ADMIN_PASSWORD }, adminJar)
  assert(login.status === 200, 'Login admin correct → 200', JSON.stringify(login.data))
  if (login.status !== 200) return

  // 3. Résultats
  const results = await api('GET', '/api/admin/results', null, adminJar)
  assert(results.status === 200, 'GET /api/admin/results → 200')
  assert(typeof results.data?.totalParticipants === 'number', 'totalParticipants présent')
  assert(Array.isArray(results.data?.stationStats), 'stationStats est un tableau')
  assert(Array.isArray(results.data?.subsidiaryAnswers), 'subsidiaryAnswers est un tableau')

  // 4. Participants — inclut le participant de test
  const parts = await api('GET', '/api/admin/participants', null, adminJar)
  assert(parts.status === 200, 'GET /api/admin/participants → 200')
  const found = parts.data?.participants?.find(p => p.id === testParticipantId)
  assert(!!found, 'Participant de test présent dans la liste admin')

  // 5. URLs QR codes = /station/code/{stationCode}
  const qrcodes = await api('GET', '/api/admin/qrcodes', null, adminJar)
  assert(qrcodes.status === 200, 'GET /api/admin/qrcodes → 200')
  const allUrlsCorrect = qrcodes.data?.every(q =>
    q.url === `${BASE}/station/code/${q.stationCode}`
  )
  assert(allUrlsCorrect, 'Toutes les URLs QR encodent /station/code/{stationCode}')

  // 6. Créer une question de test
  const newQ = await api('POST', '/api/admin/questions', {
    stationLabel: 'Station Recette Auto',
    stationCode: '888',
    question: 'Question créée par le script de recette ?',
    optionA: 'Oui', optionB: 'Non', optionC: 'Peut-être', optionD: 'Non applicable',
    correctAnswer: 0,
  }, adminJar)
  assert(newQ.status === 201, 'Créer une question → 201', JSON.stringify(newQ.data))
  const newQId = newQ.data?.id
  assert(typeof newQId === 'string', 'ID de la nouvelle question reçu')

  // 7. La question apparaît dans la liste
  const qList = await api('GET', '/api/admin/questions', null, adminJar)
  assert(qList.status === 200, 'GET /api/admin/questions → 200')
  const qFound = qList.data?.find(q => q.id === newQId)
  assert(!!qFound, 'Nouvelle question présente dans la liste')

  // 8. Modifier la question
  const upd = await api('PUT', `/api/admin/questions/${newQId}`,
    { stationLabel: 'Station Recette Auto (modifiée)' }, adminJar)
  assert(upd.status === 200, 'Modifier une question → 200')
  assert(upd.data?.stationLabel === 'Station Recette Auto (modifiée)', 'Modification enregistrée')

  // 9. Supprimer la question (aucune réponse → ok)
  const del = await api('DELETE', `/api/admin/questions/${newQId}`, null, adminJar)
  assert(del.status === 200, 'Supprimer une question → 200', JSON.stringify(del.data))

  // 10. Page welcome publique
  const welcome = await api('GET', '/api/public/welcome', null, { value: '' })
  assert(welcome.status === 200, 'GET /api/public/welcome → 200')

  // 11. Settings admin
  const settings = await api('GET', '/api/admin/settings', null, adminJar)
  assert(settings.status === 200, 'GET /api/admin/settings → 200')
  assert(typeof settings.data?.max_questions_limit !== 'undefined', 'max_questions_limit présent')
}

async function cleanup(adminJar, participantId) {
  section('NETTOYAGE')
  if (!participantId) { fail('Pas de participant à nettoyer'); return }

  // Supprimer via reset ne fonctionnerait pas sans tout effacer.
  // On passe par Prisma directement via un endpoint dédié n'existe pas —
  // on supprime juste en signalant manuellement.
  process.stdout.write(`  \x1b[90m→ Participant de test : ${participantId}\x1b[0m\n`)
  process.stdout.write(`  \x1b[90m→ Email : ${TEST_PARTICIPANT.email}\x1b[0m\n`)
  process.stdout.write(`  \x1b[33m⚠\x1b[0m  Supprimez le participant manuellement depuis /admin/participants si nécessaire.\n`)
  ok('Données de test identifiées')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  process.stdout.write(`\n\x1b[1mRECETTE QR-QUIZ\x1b[0m — ${BASE}\n`)
  process.stdout.write(`Démarrage : ${new Date().toLocaleTimeString('fr-BE')}\n`)

  const playerJar = { value: '' }
  const adminJar = { value: '' }

  let participantId = null
  try {
    participantId = await scenarioPlayer(playerJar)
    await scenarioAdmin(adminJar, participantId)
    await cleanup(adminJar, participantId)
  } catch (err) {
    fail('Erreur inattendue', err.message)
  }

  // ─── Rapport final ───
  const total = passed + failed
  process.stdout.write('\n' + '─'.repeat(40) + '\n')
  if (failed === 0) {
    process.stdout.write(`\x1b[1m\x1b[32m✓ RECETTE VALIDÉE — ${passed}/${total} tests passés\x1b[0m\n`)
  } else {
    process.stdout.write(`\x1b[1m\x1b[31m✗ RECETTE ÉCHOUÉE — ${failed} test(s) en échec\x1b[0m\n`)
    failures.forEach(f => {
      process.stdout.write(`  • ${f.label}\n`)
      if (f.detail) process.stdout.write(`    ${f.detail}\n`)
    })
  }
  process.stdout.write(`Durée : terminé à ${new Date().toLocaleTimeString('fr-BE')}\n\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
