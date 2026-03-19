'use client'

export default function AdminManualPage() {
  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      <div className="no-print flex items-center justify-between mb-6">
        <h1 className="text-[18px] font-bold">Manuel Administrateur</h1>
        <button onClick={() => window.print()}
          className="px-4 py-2 rounded-lg text-[13px] font-medium text-white"
          style={{ background: 'var(--color-primary)' }}>
          🖨 Imprimer
        </button>
      </div>

      <div style={{ maxWidth: 720, fontFamily: 'system-ui, sans-serif', fontSize: 14, lineHeight: 1.7, color: '#1A1A1A' }}>

        {/* Header */}
        <div className="rounded-xl p-6 mb-8" style={{ background: 'var(--color-primary)', color: 'white' }}>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>QR-QUIZ</div>
          <div style={{ fontSize: 16, fontWeight: 600, opacity: 0.9 }}>Manuel Administrateur</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Interface de gestion du parcours QCM</div>
        </div>

        {/* Sommaire */}
        <Section title="Sommaire" color="#1E3A5F">
          <ol style={{ paddingLeft: 20, lineHeight: 2.2 }}>
            {['Connexion & Déconnexion', 'Tableau de bord', 'Gestion des Questions (Stations)', 'QR Codes', 'Participants', 'Résultats', 'Réinitialisation du jeu'].map((t, i) => (
              <li key={i} style={{ fontWeight: 500 }}>{t}</li>
            ))}
          </ol>
        </Section>

        {/* 1. Connexion */}
        <Section title="1. Connexion & Déconnexion" color="#1E3A5F">
          <Step n={1} text="Accédez à" code="https://quiz.dedobbeleer.online/admin" />
          <Step n={2} text="Saisissez vos identifiants administrateur (email + mot de passe)." />
          <Step n={3} text='Cliquez sur "Se connecter". Vous êtes redirigé vers le tableau de bord.' />
          <Tip>L'icône 👁 sur le champ mot de passe permet d'afficher/masquer votre saisie.</Tip>
          <Step n={4} text='Pour vous déconnecter, cliquez sur "Déconnexion" en bas du menu latéral gauche.' />
        </Section>

        {/* 2. Tableau de bord */}
        <Section title="2. Tableau de bord" color="#1E3A5F">
          <p>La page d'accueil affiche une vue synthétique en temps réel :</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li><b>Participants inscrits</b> — nombre total d'inscrits</li>
            <li><b>Parcours complets</b> — participants ayant répondu à toutes les stations</li>
            <li><b>En cours</b> — participants actifs</li>
            <li><b>Réponses subsidiaires</b> — nombre de réponses à la question bonus</li>
          </ul>
          <p style={{ marginTop: 12 }}>Les barres de progression par station donnent un aperçu visuel du taux de bonnes réponses.</p>
          <Tip>Cliquez sur <b>↻ Actualiser</b> pour rafraîchir les données en temps réel pendant l'événement.</Tip>
        </Section>

        {/* 3. Questions */}
        <Section title="3. Gestion des Questions (Stations)" color="#1E3A5F">
          <SubSection title="Créer une station">
            <Step n={1} text='Cliquez sur "+ Nouvelle station" en haut à droite.' />
            <Step n={2} text="Remplissez le formulaire :" />
            <FieldList fields={[
              ['Nom de la station *', 'Nom affiché aux participants (ex: Salle Informatique)'],
              ['Code 3 chiffres *', 'Code unique imprimé sous le QR code (ex: 101) — non modifiable après création'],
              ['Question *', 'Le texte de la question posée'],
              ['Propositions A B C D *', 'Les 4 réponses possibles'],
              ['Bonne réponse', 'Sélectionnez le bouton radio devant la bonne réponse'],
              ['Explication', '(Optionnel) Affiché au participant après sa réponse'],
            ]} />
            <Step n={3} text='Cliquez sur "Créer". La station apparaît dans la liste.' />
            <Warn>Le code à 3 chiffres est permanent. Si une erreur est faite, supprimez et recréez la station.</Warn>
          </SubSection>

          <SubSection title="Modifier une station">
            <p>Cliquez sur l'icône ✏️ à droite de la station. Vous pouvez modifier le nom, la question, les réponses et l'explication. Le code à 3 chiffres reste fixe.</p>
          </SubSection>

          <SubSection title="Supprimer une station">
            <p>Cliquez sur l'icône 🗑 rouge. Une confirmation est demandée. La suppression est définitive.</p>
            <Warn>Supprimer une station efface aussi toutes les réponses des participants à cette station.</Warn>
          </SubSection>

          <SubSection title="Réordonner les stations">
            <p>Glissez-déposez les lignes en maintenant le curseur sur les 6 points à gauche de chaque station. L'ordre est sauvegardé automatiquement.</p>
          </SubSection>

          <SubSection title="Limite maximum">
            <p>Le bloc <b>⚙️ Stations dans le parcours</b> affiche le nombre de stations créées sur le maximum autorisé. Ajustez la limite avec les boutons — / + puis cliquez <b>OK</b>.</p>
          </SubSection>
        </Section>

        {/* 4. QR Codes */}
        <Section title="4. QR Codes" color="#1E3A5F">
          <SubSection title="Générer les QR codes">
            <Step n={1} text='Allez dans le menu "QR Codes".' />
            <Step n={2} text='Cliquez sur "⬛ Générer tout" pour créer les QR codes de toutes les stations en une seule opération.' />
            <Step n={3} text="Les QR codes apparaissent dans la grille. Chaque carte affiche le nom, le code et le QR." />
          </SubSection>
          <SubSection title="Télécharger un QR code (PNG)">
            <p>Sous chaque carte, cliquez sur <b>↓ PNG</b> pour télécharger l'image haute résolution (1000×1000 px).</p>
          </SubSection>
          <SubSection title="Régénérer un QR code">
            <p>Cliquez sur <b>↻</b> sous la carte concernée. Utile si l'URL du serveur a changé.</p>
          </SubSection>
          <SubSection title="Imprimer tous les QR codes">
            <Step n={1} text={"Cliquez sur \"🖨 Imprimer tout\". Un aperçu s'affiche."} />
            <Step n={2} text={"Cliquez sur \"🖨 Imprimer\" pour ouvrir la fenêtre d'impression du navigateur."} />
            <p style={{ marginTop: 8 }}>La mise en page est optimisée pour l'impression A4, 2 QR codes par ligne.</p>
          </SubSection>
          <Tip>Le QR code d'accueil (URL d'inscription) est affiché en haut de la page — c'est lui que vous affichez à l'entrée de l'événement.</Tip>
        </Section>

        {/* 5. Participants */}
        <Section title="5. Participants" color="#1E3A5F">
          <p>La page <b>Participants</b> liste tous les inscrits avec :</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Nom, prénom, email, téléphone</li>
            <li>Heure d'inscription</li>
            <li>Progression (stations répondues / total)</li>
            <li>Statut : <b style={{ color: '#3B6D11' }}>Complet</b> · <b style={{ color: '#185FA5' }}>En cours</b> · <b style={{ color: '#888' }}>Débuté</b></li>
          </ul>
          <SubSection title="Recherche & filtre">
            <p>Utilisez la barre de recherche (nom ou email) et le filtre de statut pour retrouver un participant.</p>
          </SubSection>
          <SubSection title="Export des données">
            <p>Cliquez sur <b>↓ CSV</b> ou <b>↓ JSON</b> pour télécharger la liste complète des participants avec leurs données d'inscription.</p>
          </SubSection>
        </Section>

        {/* 6. Résultats */}
        <Section title="6. Résultats" color="#1E3A5F">
          <p>La page <b>Résultats</b> affiche :</p>
          <SubSection title="Résultats par station">
            <p>Tableau avec pour chaque station : nombre de réponses, nombre de bonnes réponses, pourcentage de réussite et barre visuelle colorée.</p>
            <ul style={{ paddingLeft: 20, marginTop: 4, color: '#555' }}>
              <li>🟢 ≥ 70% — Vert</li>
              <li>🔵 ≥ 40% — Bleu</li>
              <li>🟠 ≥ 20% — Orange</li>
              <li>🔴 &lt; 20% — Rouge</li>
            </ul>
          </SubSection>
          <SubSection title="Réponses subsidiaires">
            <p>Classées par ordre d'arrivée. Le premier participant est mis en évidence (fond doré). Utile pour désigner le gagnant en cas d'égalité de score.</p>
          </SubSection>
          <Tip>Cliquez sur <b>↻ Actualiser</b> pour mettre à jour les résultats en temps réel.</Tip>
        </Section>

        {/* 7. Réinitialisation */}
        <Section title="7. Réinitialisation du jeu" color="#E24B4A">
          <Warn>Cette opération supprime TOUTES les données de jeu (participants, réponses, réponses subsidiaires). Les questions et QR codes sont conservés.</Warn>
          <Step n={1} text='Dans le menu latéral, cliquez sur "⚠ Réinitialiser le jeu" (tout en bas).' />
          <Step n={2} text="Une modale de confirmation s'ouvre. Saisissez votre mot de passe administrateur." />
          <Step n={3} text='Cliquez sur "Réinitialiser". Le compteur repasse à zéro.' />
          <p style={{ marginTop: 12 }}>À utiliser avant chaque nouvelle session de jeu.</p>
        </Section>

      </div>
    </>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ borderLeft: `4px solid ${color}`, paddingLeft: 14, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color, margin: 0 }}>{title}</h2>
      </div>
      <div style={{ paddingLeft: 4 }}>{children}</div>
    </div>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16, marginTop: 14 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
      {children}
    </div>
  )
}

function Step({ n, text, code }: { n: number; text: string; code?: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
      <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: '#1E3A5F', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{n}</div>
      <p style={{ margin: 0, color: '#333' }}>{text} {code && <code style={{ background: '#EEF', padding: '1px 6px', borderRadius: 4, fontSize: 12, color: '#1E3A5F' }}>{code}</code>}</p>
    </div>
  )
}

function FieldList({ fields }: { fields: [string, string][] }) {
  return (
    <div style={{ background: '#F8F8F8', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
      {fields.map(([name, desc]) => (
        <div key={name} style={{ display: 'flex', gap: 12, marginBottom: 6, fontSize: 13 }}>
          <span style={{ fontWeight: 600, minWidth: 160, color: '#1E3A5F' }}>{name}</span>
          <span style={{ color: '#555' }}>{desc}</span>
        </div>
      ))}
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#E8F4FD', border: '1px solid #B5D4F4', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 13, color: '#185FA5' }}>
      💡 {children}
    </div>
  )
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#FFF3E0', border: '1px solid #FAC775', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 13, color: '#854F0B' }}>
      ⚠️ {children}
    </div>
  )
}
