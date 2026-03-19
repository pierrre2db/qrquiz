/**
 * Test fenêtre glissante — 2 vagues séparées de 2+ minutes
 * Vague 1 : 5 joueurs forts → terminent → apparaissent dans classement
 * Attente : 2 min (fenêtre expire)
 * Vague 2 : 5 nouveaux joueurs → apparaissent, vague 1 disparaît
 */

const BASE = process.argv[2] || 'https://quiz.dedobbeleer.online'
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin@dedobbeleer.online'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin_QrQuiz_2026x'
const RUN_ID = Date.now()
const WAIT_MS = 2 * 60 * 1000 + 10000 // 2min10s pour être sûr

const WAVE1 = [
  { firstName: 'Arnaud',   lastName: 'Blanc',    correctRate: 1.00 },
  { firstName: 'Béatrice', lastName: 'Colin',    correctRate: 0.90 },
  { firstName: 'Cédric',   lastName: 'Faure',    correctRate: 0.80 },
  { firstName: 'Delphine', lastName: 'Garnier',  correctRate: 0.70 },
  { firstName: 'Etienne',  lastName: 'Hamon',    correctRate: 0.60 },
]
const WAVE2 = [
  { firstName: 'Fabrice',  lastName: 'Imbert',   correctRate: 0.50 },
  { firstName: 'Gaëlle',   lastName: 'Joubert',  correctRate: 0.90 },
  { firstName: 'Henri',    lastName: 'Klein',    correctRate: 1.00 },
  { firstName: 'Isabelle', lastName: 'Lopez',    correctRate: 0.80 },
  { firstName: 'Jérôme',   lastName: 'Marchand', correctRate: 0.70 },
]

const sleep = ms => new Promise(r => setTimeout(r, ms))
const delay = (min, max) => new Promise(r => setTimeout(r, min + Math.random() * (max - min)))
const randomWrong = c => { const o = [0,1,2,3].filter(x => x !== c); return o[Math.floor(Math.random()*o.length)] }

async function api(method, path, body, jar) {
  const headers = { 'Content-Type': 'application/json' }
  if (jar?.value) headers['Cookie'] = jar.value
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const sc = res.headers.get('set-cookie')
  if (sc && jar) {
    const ex = jar.value ? jar.value.split('; ') : []
    for (const nc of sc.split(',').map(c => c.split(';')[0].trim())) {
      const name = nc.split('=')[0]
      const idx = ex.findIndex(e => e.startsWith(name + '='))
      if (idx >= 0) ex[idx] = nc; else ex.push(nc)
    }
    jar.value = ex.join('; ')
  }
  let data = null
  if ((res.headers.get('content-type') || '').includes('application/json'))
    try { data = await res.json() } catch { data = null }
  return { status: res.status, data }
}

const C = { reset:'\x1b[0m', bold:'\x1b[1m', green:'\x1b[32m', yellow:'\x1b[33m', red:'\x1b[31m', cyan:'\x1b[36m', gray:'\x1b[90m', magenta:'\x1b[35m', blue:'\x1b[34m', white:'\x1b[37m' }
const log = msg => process.stdout.write(msg + '\n')
const hr = () => log(`${C.gray}${'─'.repeat(52)}${C.reset}`)

async function runPlayer(player, questions, idx, waveColor) {
  const jar = { value: '' }
  const tag = `${waveColor}[${player.firstName.padEnd(9)}]${C.reset}`

  const reg = await api('POST', '/api/participants', {
    firstName: player.firstName, lastName: player.lastName,
    email: `wtest.${RUN_ID}.${idx}@demo.invalid`,
    phone: `+32491${String(idx + 1).padStart(6, '0')}`,
  }, jar)

  if (reg.status !== 201) { log(`${tag} ${C.red}✗ échec inscription${C.reset}`); return null }
  log(`${tag} ${C.green}✓ inscrit${C.reset}`)

  let correct = 0
  for (const q of questions) {
    await delay(3000, 7000)
    const ok = Math.random() < player.correctRate
    const selected = ok ? q.correctAnswer : randomWrong(q.correctAnswer)
    await api('POST', '/api/answers', { stationId: q.id, selectedOption: selected }, jar)
    if (ok) correct++
  }
  await delay(1000, 3000)
  await api('POST', '/api/subsidiary', { answerText: `${player.firstName} — test fenêtre` }, jar)

  const pct = Math.round((correct / questions.length) * 100)
  const sc = pct >= 80 ? C.green : pct >= 50 ? C.yellow : C.red
  log(`${tag} ${C.bold}FIN ${sc}${correct}/${questions.length} · ${pct}%${C.reset}`)
  return pct
}

async function countdown(ms) {
  const steps = 6
  const stepMs = ms / steps
  for (let i = steps; i >= 1; i--) {
    const remaining = Math.round((i * stepMs) / 1000)
    process.stdout.write(`\r${C.yellow}⏳ Fenêtre expire dans ${remaining}s … (regardez /welcome)   ${C.reset}`)
    await sleep(stepMs)
  }
  process.stdout.write('\r' + ' '.repeat(60) + '\r')
}

async function main() {
  log(`\n${C.bold}TEST FENÊTRE GLISSANTE${C.reset} — ${BASE}`)
  log(`Fenêtre active : ${C.yellow}2 minutes${C.reset} (mode test)\n`)

  // Login admin
  const adminJar = { value: '' }
  const login = await api('POST', '/api/admin/auth/login', { login: ADMIN_LOGIN, password: ADMIN_PASSWORD }, adminJar)
  if (!login.data?.success) { log(`${C.red}Login admin échoué${C.reset}`); process.exit(1) }

  // Reset
  process.stdout.write(`${C.gray}Réinitialisation…${C.reset} `)
  const reset = await api('POST', '/api/admin/reset', { password: ADMIN_PASSWORD }, adminJar)
  if (!reset.data?.success) { log(`${C.red}échoué${C.reset}`); process.exit(1) }
  log(`${C.green}✓${C.reset}`)

  const qRes = await api('GET', '/api/admin/questions', null, adminJar)
  const questions = qRes.data || []
  if (!questions.length) { log(`${C.red}Aucune question${C.reset}`); process.exit(1) }
  log(`${C.green}✓${C.reset} ${questions.length} questions\n`)

  log(`${C.bold}Ouvrez ${BASE}/welcome et gardez-le ouvert !${C.reset}\n`)

  // ── VAGUE 1 ──
  hr()
  log(`${C.cyan}${C.bold}VAGUE 1 — 5 joueurs forts${C.reset}`)
  log(`${C.gray}→ Ils doivent apparaître dans le classement${C.reset}\n`)
  await Promise.all(WAVE1.map((p, i) => runPlayer(p, questions, i, C.cyan)))

  log(`\n${C.green}✓ Vague 1 terminée — visible sur /welcome${C.reset}`)
  log(`${C.gray}Attendez le prochain refresh (15s) pour voir le classement…${C.reset}\n`)
  await sleep(20000)

  // ── ATTENTE EXPIRATION FENÊTRE ──
  hr()
  log(`${C.yellow}${C.bold}ATTENTE EXPIRATION FENÊTRE (2 min)${C.reset}`)
  log(`${C.gray}La vague 1 va disparaître du classement. Regardez /welcome !${C.reset}\n`)
  await countdown(WAIT_MS)

  log(`${C.yellow}⚠ Fenêtre expirée${C.reset} — si personne dans la vague 2, le fallback affiche la vague 1\n`)
  await sleep(5000)

  // ── VAGUE 2 ──
  hr()
  log(`${C.magenta}${C.bold}VAGUE 2 — 5 nouveaux joueurs${C.reset}`)
  log(`${C.gray}→ Ils remplacent la vague 1 dans le classement${C.reset}\n`)
  await Promise.all(WAVE2.map((p, i) => runPlayer(p, questions, i + 10, C.magenta)))

  log(`\n${C.green}✓ Vague 2 terminée — classement mis à jour avec les nouveaux joueurs${C.reset}`)

  hr()
  log(`${C.bold}${C.green}✓ Test terminé${C.reset}`)
  log(`${C.gray}Résultats : ${BASE}/admin/results${C.reset}\n`)
}

main()
