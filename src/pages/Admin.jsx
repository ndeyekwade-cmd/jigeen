import { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'

function loadCircularLogo() {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const s = 160
      canvas.width = s
      canvas.height = s
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(img, 0, 0, s, s)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(null)
    img.src = '/logo.avif'
  })
}

async function generatePDF(patient) {
  const logoDataUrl = await loadCircularLogo()
  const doc = new jsPDF()
  const pink = [212, 72, 117]
  const lightPink = [248, 214, 228]

  doc.setFillColor(...pink)
  doc.rect(0, 0, 210, 50, 'F')

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', 8, 8, 32, 32)
  }

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  doc.text('Fiche Patient', 196, 26, { align: 'right' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date : ${new Date(patient.date).toLocaleDateString('fr-FR')}`, 196, 37, { align: 'right' })

  const fields = [
    ['Prénom et Nom',              `${patient.prenom || ''} ${patient.nom || ''}`.trim() || '—'],
    ['Ville / Quartier',           patient.ville       || '—'],
    ['Âge',                        patient.age         || '—'],
    ['Téléphone',                  patient.telephone   || '—'],
    ['Antécédents familiaux',      patient.antecedents || '—'],
    ['Signes remarqués',           patient.signes      || '—'],
    ['Durée des signes',           patient.duree       || '—'],
    ['Période règles / ovulation', patient.cycles      || '—'],
    ['Date de consultation',       new Date(patient.date).toLocaleDateString('fr-FR')],
  ]

  let y = 68
  const lx = 15, vx = 95, ex = 195

  fields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...pink)
    doc.text(label, lx, y)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    const lines = doc.splitTextToSize(value, ex - vx - 4)
    doc.text(lines, vx, y)

    doc.setDrawColor(...lightPink)
    doc.setLineWidth(0.4)
    doc.line(vx, y + 3, ex, y + 3)

    const h = lines.length * 5
    y += h + 6

    doc.setDrawColor(232, 232, 232)
    doc.setLineWidth(0.2)
    doc.line(lx, y, ex, y)
    y += 5
  })

  doc.setFillColor(...pink)
  doc.rect(0, 280, 210, 17, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.text('Jigeen — Détection précoce du cancer du sein  |  Document confidentiel', 105, 290, { align: 'center' })

  return doc
}

// ── Onglet Gestion des patients ──────────────────────────────────────────────

function GestionPatients() {
  const [patients, setPatients] = useState([])
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('jigeen_patients') || '[]')
    setPatients(data.reverse())
  }, [])

  const filtered = patients.filter(p =>
    `${p.prenom} ${p.nom} ${p.telephone}`.toLowerCase().includes(search.toLowerCase())
  )

  const handleDownload = async (patient) => {
    const doc = await generatePDF(patient)
    doc.save(`jigeen_${patient.prenom}_${patient.nom}.pdf`)
  }

  const handleDelete = (id) => {
    const updated = patients.filter(p => p.id !== id)
    setPatients(updated)
    localStorage.setItem('jigeen_patients', JSON.stringify([...updated].reverse()))
    if (selected?.id === id) setSelected(null)
  }

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

      {/* Liste */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>
            Fiches patients
            <span style={{
              marginLeft: '10px', backgroundColor: '#fde8ef', color: '#d44875',
              borderRadius: '20px', padding: '2px 12px', fontSize: '13px', fontWeight: '600',
            }}>
              {patients.length}
            </span>
          </h2>
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, prénom, téléphone..."
          style={{
            width: '100%', padding: '11px 16px', borderRadius: '10px',
            border: '1.5px solid #f2b8ca', fontSize: '14px',
            outline: 'none', marginBottom: '16px', boxSizing: 'border-box',
          }}
        />

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#bbb' }}>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>📋</div>
            <p style={{ fontSize: '14px' }}>Aucune fiche patient enregistrée.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(p => (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                style={{
                  backgroundColor: selected?.id === p.id ? '#fde8ef' : 'white',
                  border: `2px solid ${selected?.id === p.id ? '#d44875' : '#f2b8ca'}`,
                  borderRadius: '12px', padding: '14px 18px',
                  cursor: 'pointer', transition: 'all 0.18s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#333' }}>
                    {p.prenom} {p.nom}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>
                    {p.age} · {p.ville} · {p.telephone}
                  </div>
                  <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>
                    {new Date(p.date).toLocaleString('fr-FR')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={e => { e.stopPropagation(); handleDownload(p) }}
                    style={{
                      backgroundColor: '#d44875', color: 'white', border: 'none',
                      borderRadius: '8px', padding: '6px 12px', fontSize: '12px',
                      cursor: 'pointer', fontWeight: '600',
                    }}
                  >
                    ⬇ PDF
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(p.id) }}
                    style={{
                      backgroundColor: '#fee', color: '#c00', border: '1px solid #fcc',
                      borderRadius: '8px', padding: '6px 12px', fontSize: '12px',
                      cursor: 'pointer', fontWeight: '600',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Détail patient */}
      {selected && (
        <div style={{
          width: '300px', flexShrink: 0,
          backgroundColor: 'white', borderRadius: '14px',
          border: '2px solid #f2b8ca', padding: '22px',
          height: 'fit-content', position: 'sticky', top: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ color: '#d44875', fontSize: '15px', fontWeight: '700' }}>
              {selected.prenom} {selected.nom}
            </h3>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#aaa' }}>✕</button>
          </div>
          {[
            ['Ville', selected.ville],
            ['Âge', selected.age],
            ['Téléphone', selected.telephone],
            ['Antécédents', selected.antecedents],
            ['Signes', selected.signes],
            ['Durée', selected.duree],
            ['Règles / Ovulation', selected.cycles],
          ].map(([label, val]) => (
            <div key={label} style={{ marginBottom: '10px', borderBottom: '1px solid #f5f5f5', paddingBottom: '8px' }}>
              <div style={{ fontSize: '10px', color: '#d44875', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              <div style={{ fontSize: '13px', color: '#333', marginTop: '2px' }}>{val || '—'}</div>
            </div>
          ))}
          <button
            onClick={() => handleDownload(selected)}
            style={{
              width: '100%', backgroundColor: '#d44875', color: 'white',
              border: 'none', borderRadius: '10px', padding: '11px',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '6px',
            }}
          >
            Télécharger le PDF
          </button>
        </div>
      )}
    </div>
  )
}

// ── Onglet Gestion des médecins ──────────────────────────────────────────────

function GestionMedecins() {
  const [medecins, setMedecins]       = useState([])
  const [patients, setPatients]       = useState([])
  const [assignments, setAssignments] = useState([])
  const [search, setSearch]           = useState('')
  const [expanded, setExpanded]       = useState(null)

  useEffect(() => {
    setMedecins(JSON.parse(localStorage.getItem('jigeen_medecins')    || '[]').reverse())
    setPatients(JSON.parse(localStorage.getItem('jigeen_patients')    || '[]'))
    setAssignments(JSON.parse(localStorage.getItem('jigeen_assignments') || '[]'))
  }, [])

  const markRead = (medecinId) => {
    const updated = assignments.map(a =>
      a.medecinId === medecinId ? { ...a, lu: true } : a
    )
    setAssignments(updated)
    localStorage.setItem('jigeen_assignments', JSON.stringify(updated))
  }

  const filtered = medecins.filter(m =>
    `${m.prenom} ${m.nom} ${m.specialite} ${m.hopital} ${m.localite}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = (id) => {
    const updated = medecins.filter(m => m.id !== id)
    setMedecins(updated)
    localStorage.setItem('jigeen_medecins', JSON.stringify([...updated].reverse()))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>
          Médecins inscrits
          <span style={{
            marginLeft: '10px', backgroundColor: '#fde8ef', color: '#d44875',
            borderRadius: '20px', padding: '2px 12px', fontSize: '13px', fontWeight: '600',
          }}>
            {medecins.length}
          </span>
        </h2>
        <a
          href="/#/register"
          style={{
            backgroundColor: '#d44875', color: 'white', textDecoration: 'none',
            borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '700',
            boxShadow: '0 4px 12px rgba(212,72,117,0.3)',
          }}
        >
          + Inscrire un médecin
        </a>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher par nom, spécialité, hôpital..."
        style={{
          width: '100%', padding: '11px 16px', borderRadius: '10px',
          border: '1.5px solid #f2b8ca', fontSize: '14px',
          outline: 'none', marginBottom: '16px', boxSizing: 'border-box',
        }}
      />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#bbb' }}>
          <div style={{ fontSize: '44px', marginBottom: '12px' }}>👩‍⚕️</div>
          <p style={{ fontSize: '14px' }}>Aucun médecin inscrit pour l'instant.</p>
          <a href="/#/register" style={{ color: '#d44875', fontSize: '13px', fontWeight: '600' }}>
            Inscrire le premier médecin →
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map(m => (
            <div key={m.id} style={{
              backgroundColor: 'white', borderRadius: '14px',
              border: '2px solid #f2b8ca', padding: '20px',
              position: 'relative',
            }}>
              <button
                onClick={() => handleDelete(m.id)}
                style={{
                  position: 'absolute', top: '12px', right: '12px',
                  background: '#fee', border: '1px solid #fcc', color: '#c00',
                  borderRadius: '6px', padding: '3px 8px', fontSize: '11px',
                  cursor: 'pointer', fontWeight: '600',
                }}
              >
                ✕
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '50%',
                  backgroundColor: '#fde8ef', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', flexShrink: 0, overflow: 'hidden',
                  border: '2px solid #f2b8ca',
                }}>
                  {m.photo
                    ? <img src={m.photo} alt={m.prenom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '👩‍⚕️'
                  }
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#333' }}>
                    Dr {m.prenom} {m.nom}
                  </div>
                  <div style={{ fontSize: '12px', color: '#d44875', fontWeight: '600' }}>
                    {m.specialite}
                  </div>
                </div>
              </div>

              {[
                ['Hôpital / Clinique', m.hopital],
                ['Localité', m.localite],
                ['Inscrit le', new Date(m.date).toLocaleDateString('fr-FR')],
              ].map(([label, val]) => (
                <div key={label} style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                    {label} :{' '}
                  </span>
                  <span style={{ fontSize: '13px', color: '#444' }}>{val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page Admin principale ────────────────────────────────────────────────────

const NAV = [
  { key: 'patients', label: 'Gestion des patients', icon: '📋' },
  { key: 'medecins', label: 'Gestion des médecins', icon: '👩‍⚕️' },
  { key: 'config',   label: 'Configuration',        icon: '⚙️' },
  { key: 'espace',   label: 'Espace médecin',       icon: '🔬', href: '/#/medecin' },
]

function ConfigPanel() {
  const [ragUrl, setRagUrl] = useState(localStorage.getItem('jigeen_rag_url') || '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    const url = ragUrl.trim().replace(/\/$/, '')
    localStorage.setItem('jigeen_rag_url', url)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ maxWidth: '540px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#333', marginBottom: '20px' }}>
        Configuration
      </h2>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '2px solid #f2b8ca', padding: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#d44875', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
          🤖 URL du serveur RAG (Colab / ngrok)
        </div>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '14px', lineHeight: '1.6' }}>
          Copiez l'URL ngrok générée par votre notebook Colab (ex: <code style={{ backgroundColor: '#fde8ef', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>https://xxxx.ngrok-free.app</code>).
          Une fois configurée, les patientes pourront poser des questions au chatbot après le questionnaire.
        </p>
        <input
          value={ragUrl}
          onChange={e => { setRagUrl(e.target.value); setSaved(false) }}
          placeholder="https://xxxx.ngrok-free.app"
          style={{
            width: '100%', padding: '11px 14px', boxSizing: 'border-box',
            borderRadius: '10px', border: '1.5px solid #f2b8ca',
            fontSize: '14px', outline: 'none', fontFamily: 'monospace',
            marginBottom: '12px',
          }}
        />
        <button
          onClick={handleSave}
          style={{
            backgroundColor: saved ? '#38a169' : '#d44875',
            color: 'white', border: 'none', borderRadius: '10px',
            padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            transition: 'background-color 0.3s',
          }}
        >
          {saved ? '✓ Enregistré' : 'Enregistrer'}
        </button>
        {ragUrl && (
          <div style={{ marginTop: '14px', backgroundColor: '#f0fff4', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#38a169', fontWeight: '600' }}>
            ✓ RAG actif — les patientes peuvent poser des questions après le questionnaire
          </div>
        )}
        {!ragUrl && (
          <div style={{ marginTop: '14px', backgroundColor: '#fffbeb', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#d97706', fontWeight: '600' }}>
            ⚠ Aucune URL configurée — la phase de questions sera désactivée
          </div>
        )}
      </div>
    </div>
  )
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('patients')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7f3f5', fontFamily: 'Segoe UI, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        backgroundColor: '#d44875', padding: '14px 28px',
        display: 'flex', alignItems: 'center', gap: '14px',
        boxShadow: '0 2px 10px rgba(212,72,117,0.35)', flexShrink: 0,
      }}>
        <a href="/" style={{
          width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
          textDecoration: 'none', cursor: 'pointer',
        }}>
          <img src="/logo.avif" alt="logo" style={{ width: '36px', objectFit: 'contain' }} />
        </a>
        <div>
          <div style={{ color: 'white', fontWeight: '700', fontSize: '17px' }}>Jigeen — Administration</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>Tableau de bord médical</div>
        </div>
      </div>

      {/* Corps : sidebar + contenu */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <aside style={{
          width: '240px', flexShrink: 0,
          backgroundColor: 'white',
          borderRight: '1px solid #f0e0e8',
          padding: '28px 16px',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          <p style={{ fontSize: '10px', fontWeight: '700', color: '#bbb', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '10px' }}>
            Navigation
          </p>
          {NAV.map(item => (
            item.href ? (
              <a
                key={item.key}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '11px 14px', borderRadius: '10px',
                  fontSize: '14px', fontWeight: '600', textDecoration: 'none',
                  transition: 'all 0.18s', color: '#555',
                  borderLeft: '3px solid transparent',
                }}
                onMouseOver={e => { e.currentTarget.style.backgroundColor = '#fdf5f8'; e.currentTarget.style.color = '#d44875' }}
                onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#555' }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                {item.label}
              </a>
            ) : (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '11px 14px', borderRadius: '10px', border: 'none',
                  cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                  textAlign: 'left', transition: 'all 0.18s',
                  backgroundColor: activeTab === item.key ? '#fde8ef' : 'transparent',
                  color: activeTab === item.key ? '#d44875' : '#555',
                  borderLeft: activeTab === item.key ? '3px solid #d44875' : '3px solid transparent',
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                {item.label}
              </button>
            )
          ))}
        </aside>

        {/* Contenu principal */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
          {activeTab === 'patients' && <GestionPatients />}
          {activeTab === 'medecins' && <GestionMedecins />}
          {activeTab === 'config'   && <ConfigPanel />}
        </main>

      </div>
    </div>
  )
}
