'use client'
import { useEffect, useState } from 'react'

export default function PlayerGuidePage() {
  const [baseUrl, setBaseUrl] = useState('')
  useEffect(() => { setBaseUrl(window.location.origin) }, [])

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; }
          .card { break-inside: avoid; }
        }
        @media screen {
          body { background: #F0F2F5; }
        }
      `}</style>

      {/* Print bar */}
      <div className="no-print" style={{ background: '#1E3A5F', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
        <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>QR-QUIZ — Guide Participant</span>
        <button onClick={() => window.print()} style={{ background: 'white', color: '#1E3A5F', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          🖨 Imprimer
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif' }}>

        {/* Cover */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2E75B6 100%)', borderRadius: 16, padding: '32px 28px', marginBottom: 24, color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>QR-QUIZ</div>
          <div style={{ fontSize: 15, opacity: 0.85, marginBottom: 16 }}>Guide du participant</div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 16px', fontSize: 13, opacity: 0.9 }}>
            Parcourez les stations, scannez les QR codes et répondez aux questions !
          </div>
        </div>

        {/* Étape 1 */}
        <PlayerStep
          num={1}
          emoji="✍️"
          title="Inscrivez-vous"
          color="#1E3A5F"
          steps={[
            `Scannez le QR code affiché à l'accueil — ou ouvrez ${baseUrl}/register dans votre navigateur.`,
            'Renseignez votre prénom, nom, email et numéro de téléphone.',
            'Appuyez sur "S\'inscrire". Vous arrivez sur votre tableau de bord.',
          ]}
        />

        {/* Étape 2 */}
        <PlayerStep
          num={2}
          emoji="🗺️"
          title="Trouvez une station"
          color="#2E75B6"
          steps={[
            'Votre tableau de bord affiche toutes les stations du parcours.',
            'Rendez-vous physiquement à une station (peu importe l\'ordre).',
          ]}
          tip="Les stations déjà répondues apparaissent en vert ✓. Commencez par celles encore grisées."
        />

        {/* Étape 3 */}
        <PlayerStep
          num={3}
          emoji="📷"
          title="Accédez à la question"
          color="#639922"
          steps={[
            'Méthode A — Appuyez sur "Scanner" et pointez la caméra sur le QR code de la station.',
            'Méthode B — Tapez le code à 3 chiffres imprimé sous le QR code et appuyez sur "Accéder".',
          ]}
          tip="Les deux méthodes amènent exactement au même écran."
        />

        {/* Étape 4 */}
        <PlayerStep
          num={4}
          emoji="🧠"
          title="Répondez à la question"
          color="#BA7517"
          steps={[
            'Lisez attentivement la question affichée.',
            'Sélectionnez l\'une des 4 propositions (A, B, C ou D).',
            'Appuyez sur "Valider ma réponse".',
            'Le résultat s\'affiche immédiatement : ✅ Bonne réponse ou ❌ Mauvaise réponse.',
          ]}
          warn="Vous ne pouvez répondre qu'une seule fois par station. Réfléchissez avant de valider !"
        />

        {/* Étape 5 */}
        <PlayerStep
          num={5}
          emoji="🏆"
          title="Terminez le parcours"
          color="#8B5CF6"
          steps={[
            'Visitez toutes les stations et répondez à chaque question.',
            'Une fois toutes les stations complétées, l\'écran de fin s\'affiche avec votre score.',
            'Répondez à la question subsidiaire — elle sert de départage en cas d\'égalité.',
          ]}
          tip="La question subsidiaire n'est disponible qu'après avoir répondu à TOUTES les stations."
        />

        {/* Règles */}
        <div className="card" style={{ background: '#F8F8F8', borderRadius: 14, padding: '20px 22px', marginBottom: 24, border: '1px solid #E0E0E0' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>📋 Règles importantes</h3>
          <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 2, fontSize: 13, color: '#555' }}>
            <li>Chaque question ne peut être répondue qu'<b>une seule fois</b></li>
            <li>Les stations peuvent être visitées dans <b>n'importe quel ordre</b></li>
            <li>La question subsidiaire ne compte <b>pas dans le score</b> — elle sert uniquement au départage</li>
            <li>En cas d'égalité de score, c'est la <b>réponse subsidiaire la plus précise reçue en premier</b> qui gagne</li>
            <li>Un seul compte par personne (email unique)</li>
          </ul>
        </div>

        {/* Problème */}
        <div className="card" style={{ background: '#FFF3E0', borderRadius: 14, padding: '20px 22px', marginBottom: 24, border: '1px solid #FAC775' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#854F0B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>❓ Un problème ?</h3>
          <div style={{ fontSize: 13, color: '#633806', lineHeight: 1.8 }}>
            <p style={{ margin: '0 0 8px' }}><b>Le QR code ne scanne pas</b> → Entrez le code à 3 chiffres manuellement.</p>
            <p style={{ margin: '0 0 8px' }}><b>La caméra ne s'ouvre pas</b> → Autorisez l'accès à la caméra dans les réglages de votre navigateur.</p>
            <p style={{ margin: 0 }}><b>Vous avez perdu votre progression</b> → Contactez un organisateur : votre compte est lié à votre email, seul l'administrateur peut réinitialiser votre accès.</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: 12, color: '#aaa', paddingTop: 16, borderTop: '1px solid #E0E0E0' }}>
          QR-QUIZ · {baseUrl || 'quiz.dedobbeleer.online'}
        </div>

      </div>
    </>
  )
}

function PlayerStep({
  num, emoji, title, color, steps, tip, warn,
}: {
  num: number; emoji: string; title: string; color: string
  steps: string[]; tip?: string; warn?: string
}) {
  return (
    <div className="card" style={{ background: 'white', borderRadius: 14, padding: '20px 22px', marginBottom: 16, border: `1px solid #E0E0E0`, borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
          {emoji}
        </div>
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Étape {num}</span>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>{title}</h2>
        </div>
      </div>
      <ol style={{ paddingLeft: 20, margin: 0, lineHeight: 1.9, fontSize: 13, color: '#444' }}>
        {steps.map((s, i) => <li key={i}>{s}</li>)}
      </ol>
      {tip && (
        <div style={{ background: '#E8F4FD', borderRadius: 8, padding: '8px 12px', marginTop: 12, fontSize: 12, color: '#185FA5' }}>
          💡 {tip}
        </div>
      )}
      {warn && (
        <div style={{ background: '#FFF3E0', borderRadius: 8, padding: '8px 12px', marginTop: 12, fontSize: 12, color: '#854F0B' }}>
          ⚠️ {warn}
        </div>
      )}
    </div>
  )
}
