import { useState, useEffect } from 'react'

function calculerScore(f) {
  const n = k => Math.min(Math.max(parseFloat(f[k]) || 0, 0), 10) / 10
  const b = k => parseInt(f[k]) || 0
  const bmi = parseFloat(f.BMI) || 22
  const bmiR = bmi >= 30 ? 1 : bmi >= 25 ? 0.5 : 0

  const score =
    n('Smoking')               * 0.10 +
    n('Alcohol_Use')           * 0.08 +
    n('Obesity')               * 0.09 +
    n('Diet_Red_Meat')         * 0.05 +
    n('Diet_Salted_Processed') * 0.05 +
    (1 - n('Fruit_Veg_Intake'))* 0.05 +
    (1 - n('Physical_Activity'))* 0.05 +
    (1 - n('Physical_Activity_Level')) * 0.03 +
    n('Air_Pollution')         * 0.04 +
    n('Occupational_Hazards')  * 0.03 +
    (1 - n('Calcium_Intake'))  * 0.03 +
    b('Family_History')        * 0.14 +
    b('BRCA_Mutation')         * 0.18 +
    b('H_Pylori_Infection')    * 0.04 +
    bmiR                       * 0.07

  return Math.min(Math.round(score * 100), 100)
}

function niveauRisque(score) {
  if (score >= 60) return { label: 'Risque élevé',  color: '#e53e3e', bg: '#fff5f5' }
  if (score >= 33) return { label: 'Risque modéré', color: '#d97706', bg: '#fffbeb' }
  return             { label: 'Risque faible',   color: '#38a169', bg: '#f0fff4' }
}

const SECTIONS = [
  {
    title: 'Mesures corporelles',
    fields: [
      { key: 'BMI', label: 'IMC (Indice de Masse Corporelle)', type: 'number', placeholder: 'ex : 24.5' },
    ],
  },
  {
    title: 'Mode de vie',
    fields: [
      { key: 'Smoking',               label: 'Tabagisme',                        type: 'range' },
      { key: 'Alcohol_Use',           label: 'Consommation d\'alcool',            type: 'range' },
      { key: 'Obesity',               label: 'Comportements liés à l\'obésité',   type: 'range' },
      { key: 'Physical_Activity',     label: 'Activité physique',                 type: 'range' },
      { key: 'Physical_Activity_Level', label: 'Niveau d\'activité (auto-évaluation)', type: 'range' },
    ],
  },
  {
    title: 'Alimentation',
    fields: [
      { key: 'Diet_Red_Meat',         label: 'Viande rouge',             type: 'range' },
      { key: 'Diet_Salted_Processed', label: 'Aliments salés / transformés', type: 'range' },
      { key: 'Fruit_Veg_Intake',      label: 'Fruits et légumes',         type: 'range' },
      { key: 'Calcium_Intake',        label: 'Apport en calcium',         type: 'range' },
    ],
  },
  {
    title: 'Environnement',
    fields: [
      { key: 'Air_Pollution',         label: 'Exposition à la pollution',  type: 'range' },
      { key: 'Occupational_Hazards',  label: 'Risques professionnels',     type: 'range' },
    ],
  },
  {
    title: 'Facteurs génétiques / médicaux',
    fields: [
      { key: 'Family_History',    label: 'Antécédents familiaux de cancer', type: 'binary' },
      { key: 'BRCA_Mutation',     label: 'Mutation BRCA (si connue)',        type: 'binary' },
      { key: 'H_Pylori_Infection', label: 'Infection H. Pylori',            type: 'binary' },
    ],
  },
]

const EMPTY_FEATURES = {
  BMI: '', Smoking: 5, Alcohol_Use: 0, Obesity: 5,
  Diet_Red_Meat: 5, Diet_Salted_Processed: 5, Fruit_Veg_Intake: 5,
  Physical_Activity: 5, Physical_Activity_Level: 5,
  Air_Pollution: 3, Occupational_Hazards: 2, Calcium_Intake: 5,
  Family_History: 0, BRCA_Mutation: 0, H_Pylori_Infection: 0,
}

// ── Formulaire de détection ───────────────────────────────────────────────────

function FormulaireDetection({ patient, onClose }) {
  const [features, setFeatures] = useState(EMPTY_FEATURES)
  const [resultat, setResultat] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [apiError, setApiError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setApiError(null)

    // Extraire l'âge numérique depuis la réponse texte du patient
    const ageRaw = patient.age || ''
    const ageNum = parseFloat((ageRaw.match(/\d+/) || ['35'])[0]) || 35

    const payload = {
      Age:                    ageNum,
      Gender:                 0,
      BMI:                    parseFloat(features.BMI) || 22,
      Smoking:                parseFloat(features.Smoking),
      Alcohol_Use:            parseFloat(features.Alcohol_Use),
      Obesity:                parseFloat(features.Obesity),
      Diet_Red_Meat:          parseFloat(features.Diet_Red_Meat),
      Diet_Salted_Processed:  parseFloat(features.Diet_Salted_Processed),
      Fruit_Veg_Intake:       parseFloat(features.Fruit_Veg_Intake),
      Physical_Activity:      parseFloat(features.Physical_Activity),
      Physical_Activity_Level: parseFloat(features.Physical_Activity_Level),
      Air_Pollution:          parseFloat(features.Air_Pollution),
      Occupational_Hazards:   parseFloat(features.Occupational_Hazards),
      Calcium_Intake:         parseFloat(features.Calcium_Intake),
      Family_History:         parseInt(features.Family_History),
      BRCA_Mutation:          parseInt(features.BRCA_Mutation),
      H_Pylori_Infection:     parseInt(features.H_Pylori_Infection),
    }

    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Erreur serveur : ${res.status}`)
      const data = await res.json()

      const niveau = niveauRisque(data.score)
      setResultat({ score: data.score, niveau, riskLevel: data.risk_level })

      const analyses = JSON.parse(localStorage.getItem('jigeen_analyses') || '[]')
      analyses.push({
        id: Date.now(), patientId: patient.id,
        date: new Date().toISOString(), features,
        score: data.score, niveau: data.risk_level,
      })
      localStorage.setItem('jigeen_analyses', JSON.stringify(analyses))

    } catch (err) {
      // Fallback calcul local si le serveur est injoignable
      const score = calculerScore({ ...features, antecedents: patient.antecedents, age: patient.age })
      const niveau = niveauRisque(score)
      setResultat({ score, niveau, riskLevel: niveau.label })
      setApiError('Serveur IA injoignable — score calculé localement.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '16px',
      border: '2px solid #f2b8ca', padding: '28px',
      flex: 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ color: '#d44875', fontWeight: '700', fontSize: '16px', margin: 0 }}>
            Analyse — {patient.prenom} {patient.nom}
          </h3>
          <p style={{ color: '#999', fontSize: '12px', margin: '4px 0 0' }}>
            {patient.age} · {patient.ville} · Antécédents : {patient.antecedents}
          </p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#aaa', cursor: 'pointer' }}>✕</button>
      </div>

      {!resultat ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Âge pré-rempli */}
          <div style={{ backgroundColor: '#fdf5f8', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#888' }}>
            <strong style={{ color: '#d44875' }}>Patiente :</strong> {patient.prenom} {patient.nom} · {patient.age} · Antécédents : {patient.antecedents}
          </div>

          {SECTIONS.map(section => (
            <div key={section.title}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#d44875', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', borderBottom: '1px solid #fde8ef', paddingBottom: '6px' }}>
                {section.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {section.fields.map(f => (
                  <div key={f.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#555' }}>{f.label}</label>
                      {f.type === 'range' && (
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#d44875' }}>
                          {features[f.key]} / 10
                        </span>
                      )}
                    </div>

                    {f.type === 'number' && (
                      <input
                        type="number" step="0.1" min="10" max="60"
                        value={features[f.key]}
                        onChange={e => setFeatures(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder} required
                        style={{ width: '100%', padding: '9px 13px', borderRadius: '8px', border: '1.5px solid #f2b8ca', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      />
                    )}

                    {f.type === 'range' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#bbb', width: '16px' }}>0</span>
                        <input
                          type="range" min="0" max="10" step="1"
                          value={features[f.key]}
                          onChange={e => setFeatures(p => ({ ...p, [f.key]: e.target.value }))}
                          style={{ flex: 1, accentColor: '#d44875' }}
                        />
                        <span style={{ fontSize: '11px', color: '#bbb', width: '16px' }}>10</span>
                      </div>
                    )}

                    {f.type === 'binary' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {[['0', 'Non'], ['1', 'Oui']].map(([val, lbl]) => (
                          <button
                            key={val} type="button"
                            onClick={() => setFeatures(p => ({ ...p, [f.key]: val }))}
                            style={{
                              flex: 1, padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                              border: `2px solid ${features[f.key] == val ? '#d44875' : '#f2b8ca'}`,
                              backgroundColor: features[f.key] == val ? '#fde8ef' : 'white',
                              color: features[f.key] == val ? '#d44875' : '#888',
                            }}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button type="submit" disabled={loading} style={{
            backgroundColor: loading ? '#f2b8ca' : '#d44875', color: 'white', border: 'none',
            borderRadius: '10px', padding: '14px',
            fontSize: '15px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(212,72,117,0.35)',
          }}>
            {loading ? 'Analyse en cours...' : 'Analyser et prédire le score'}
          </button>
        </form>
      ) : (
        <div style={{ textAlign: 'center' }}>
          {/* Score circulaire */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0 24px' }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="58" fill="none" stroke="#f0e0e8" strokeWidth="12" />
              <circle
                cx="70" cy="70" r="58" fill="none"
                stroke={resultat.niveau.color} strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 58 * resultat.score / 100} ${2 * Math.PI * 58}`}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: resultat.niveau.color }}>{resultat.score}%</div>
              <div style={{ fontSize: '10px', color: '#aaa', fontWeight: '600' }}>SCORE</div>
            </div>
          </div>

          {apiError && (
            <p style={{ fontSize: '11px', color: '#d97706', marginBottom: '8px' }}>⚠ {apiError}</p>
          )}
          <div style={{
            backgroundColor: resultat.niveau.bg, border: `2px solid ${resultat.niveau.color}`,
            borderRadius: '12px', padding: '14px 24px', marginBottom: '20px', display: 'inline-block',
          }}>
            <span style={{ color: resultat.niveau.color, fontWeight: '700', fontSize: '16px' }}>
              {resultat.riskLevel}
            </span>
          </div>

          <div style={{ backgroundColor: '#fafafa', borderRadius: '10px', padding: '14px', marginBottom: '20px', textAlign: 'left' }}>
            <p style={{ fontSize: '12px', color: '#666', margin: 0, lineHeight: '1.7' }}>
              {resultat.score >= 60
                ? 'Une consultation spécialisée urgente est recommandée. Le profil clinique de la patiente présente plusieurs facteurs à haut risque.'
                : resultat.score >= 30
                ? 'Un suivi médical rapproché est conseillé. Des examens complémentaires (échographie, mammographie) sont recommandés.'
                : 'Le profil clinique est rassurant. Un suivi de routine annuel est conseillé.'
              }
            </p>
          </div>

          <button
            onClick={() => { setFeatures(EMPTY_FEATURES); setResultat(null) }}
            style={{
              backgroundColor: 'white', color: '#d44875',
              border: '2px solid #d44875', borderRadius: '10px',
              padding: '10px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
            }}
          >
            Nouvelle analyse
          </button>
        </div>
      )}
    </div>
  )
}

// ── Page principale Espace Médecin ────────────────────────────────────────────

export default function EspaceMedecin() {
  const [medecins, setMedecins]       = useState([])
  const [selectedMedecin, setSelectedMedecin] = useState(null)
  const [patients, setPatients]       = useState([])
  const [assignments, setAssignments] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showDetection, setShowDetection]     = useState(false)

  useEffect(() => {
    const docs     = JSON.parse(localStorage.getItem('jigeen_medecins')     || '[]')
    const pats     = JSON.parse(localStorage.getItem('jigeen_patients')     || '[]')
    const assigns  = JSON.parse(localStorage.getItem('jigeen_assignments')  || '[]')
    setMedecins(docs)
    setPatients(pats)
    setAssignments(assigns)

    // Auto-sélection après inscription
    const currentId = localStorage.getItem('jigeen_current_medecin')
    if (currentId) {
      const found = docs.find(m => m.id === parseInt(currentId))
      if (found) setSelectedMedecin(found)
      localStorage.removeItem('jigeen_current_medecin')
    }
  }, [])

  // Sélection du médecin
  if (!selectedMedecin) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#f4eff2',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Segoe UI, sans-serif', padding: '32px',
      }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <a href="/" style={{
              width: '72px', height: '72px', borderRadius: '50%',
              backgroundColor: 'white', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', boxShadow: '0 4px 16px rgba(212,72,117,0.25)',
              textDecoration: 'none', cursor: 'pointer',
            }}>
              <img src="/logo.avif" alt="Jigeen" style={{ width: '64px', objectFit: 'contain' }} />
            </a>
            <h1 style={{ color: '#d44875', fontSize: '22px', fontWeight: '800', margin: '0 0 6px' }}>Espace Médecin</h1>
            <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>Sélectionnez votre profil pour accéder à vos patients</p>
          </div>

          {medecins.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '16px', color: '#bbb' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>👩‍⚕️</div>
              <p>Aucun médecin inscrit.<br />
                <a href="/#/register" style={{ color: '#d44875', fontWeight: '600' }}>S'inscrire →</a>
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {medecins.map(m => {
                const nb = assignments.filter(a => a.medecinId === m.id).length
                const nonLus = assignments.filter(a => a.medecinId === m.id && !a.lu).length
                return (
                  <button key={m.id} onClick={() => setSelectedMedecin(m)} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    backgroundColor: 'white', border: '2px solid #f2b8ca',
                    borderRadius: '14px', padding: '14px 18px', cursor: 'pointer',
                    textAlign: 'left', transition: 'all 0.18s',
                  }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#d44875'; e.currentTarget.style.backgroundColor = '#fdf5f8' }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = '#f2b8ca'; e.currentTarget.style.backgroundColor = 'white' }}
                  >
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      backgroundColor: '#fde8ef', overflow: 'hidden', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                    }}>
                      {m.photo ? <img src={m.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👩‍⚕️'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#333' }}>Dr {m.prenom} {m.nom}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{m.specialite} · {m.localite}</div>
                    </div>
                    {nb > 0 && (
                      <div style={{
                        backgroundColor: nonLus > 0 ? '#d44875' : '#f2b8ca',
                        color: 'white', borderRadius: '20px',
                        padding: '3px 10px', fontSize: '12px', fontWeight: '700',
                      }}>
                        {nb} patient{nb > 1 ? 's' : ''}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Patients assignés à ce médecin
  const mesAssignments = assignments.filter(a => a.medecinId === selectedMedecin.id)
  const mesPatients = mesAssignments
    .map(a => patients.find(p => p.id === a.patientId))
    .filter(Boolean)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7f3f5', fontFamily: 'Segoe UI, sans-serif' }}>

      {/* Header */}
      <div style={{
        backgroundColor: '#d44875', padding: '14px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(212,72,117,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <a href="/" style={{
            width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            textDecoration: 'none', cursor: 'pointer',
          }}>
            <img src="/logo.avif" alt="logo" style={{ width: '36px', objectFit: 'contain' }} />
          </a>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>
              Dr {selectedMedecin.prenom} {selectedMedecin.nom}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>
              {selectedMedecin.specialite} · {selectedMedecin.hopital}
            </div>
          </div>
        </div>
        <button
          onClick={() => { setSelectedMedecin(null); setSelectedPatient(null) }}
          title="Changer de profil"
          style={{
            width: '42px', height: '42px', borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.6)',
            overflow: 'hidden', cursor: 'pointer', padding: 0,
            backgroundColor: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {selectedMedecin.photo
            ? <img src={selectedMedecin.photo} alt="profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '22px', lineHeight: 1 }}>👩‍⚕️</span>
          }
        </button>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* Liste patients */}
        <div style={{ width: '320px', flexShrink: 0 }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#333', marginBottom: '14px' }}>
            Mes patients
            <span style={{
              marginLeft: '8px', backgroundColor: '#fde8ef', color: '#d44875',
              borderRadius: '20px', padding: '2px 10px', fontSize: '12px',
            }}>
              {mesPatients.length}
            </span>
          </h2>

          {mesPatients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'white', borderRadius: '14px', border: '2px solid #f2b8ca', color: '#bbb' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📭</div>
              <p style={{ fontSize: '13px' }}>Aucun patient assigné pour l'instant.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mesPatients.map(p => (
                <div
                  key={p.id}
                  onClick={() => { setSelectedPatient(p); setShowDetection(false) }}
                  style={{
                    backgroundColor: selectedPatient?.id === p.id ? '#fde8ef' : 'white',
                    border: `2px solid ${selectedPatient?.id === p.id ? '#d44875' : '#f2b8ca'}`,
                    borderRadius: '12px', padding: '14px 16px', cursor: 'pointer',
                    transition: 'all 0.18s',
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#333' }}>{p.prenom} {p.nom}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>{p.age} · {p.ville}</div>
                  <div style={{ fontSize: '11px', color: '#d44875', marginTop: '4px', fontWeight: '600' }}>
                    {p.signes}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zone principale */}
        <div style={{ flex: 1 }}>
          {!selectedPatient ? (
            <div style={{
              backgroundColor: 'white', borderRadius: '16px', border: '2px dashed #f2b8ca',
              padding: '60px 40px', textAlign: 'center', color: '#ccc',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📋</div>
              <p style={{ fontSize: '15px', fontWeight: '600', color: '#bbb' }}>
                Sélectionnez un patient pour consulter son dossier
              </p>
            </div>
          ) : showDetection ? (
            <FormulaireDetection
              patient={selectedPatient}
              onClose={() => setShowDetection(false)}
            />
          ) : (
            /* ── Dossier patient ── */
            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '2px solid #f2b8ca', padding: '28px' }}>

              {/* En-tête dossier */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ color: '#d44875', fontWeight: '800', fontSize: '18px', margin: '0 0 4px' }}>
                    Dossier — {selectedPatient.prenom} {selectedPatient.nom}
                  </h3>
                  <p style={{ color: '#aaa', fontSize: '12px', margin: 0 }}>
                    Reçu le {new Date(selectedPatient.date).toLocaleString('fr-FR')}
                  </p>
                </div>
                <button onClick={() => setSelectedPatient(null)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', color: '#bbb', cursor: 'pointer' }}>✕</button>
              </div>

              {/* Informations personnelles */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#d44875', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Informations personnelles
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    ['Prénom', selectedPatient.prenom],
                    ['Nom', selectedPatient.nom],
                    ['Âge', selectedPatient.age],
                    ['Ville / Quartier', selectedPatient.ville],
                    ['Téléphone', selectedPatient.telephone],
                  ].map(([label, val]) => (
                    <div key={label} style={{ backgroundColor: '#fafafa', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '10px', color: '#aaa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                      <div style={{ fontSize: '14px', color: '#333', fontWeight: '600', marginTop: '3px' }}>{val || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Informations médicales */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#d44875', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Informations médicales
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    ['Antécédents familiaux', selectedPatient.antecedents],
                    ['Signes remarqués', selectedPatient.signes],
                    ['Durée des signes', selectedPatient.duree],
                    ['Période règles / ovulation', selectedPatient.cycles],
                  ].map(([label, val]) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '11px 14px', backgroundColor: '#fafafa', borderRadius: '10px',
                      borderLeft: '3px solid #f2b8ca',
                    }}>
                      <span style={{ fontSize: '12px', color: '#888', fontWeight: '600' }}>{label}</span>
                      <span style={{ fontSize: '13px', color: '#333', fontWeight: '700' }}>{val || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bouton lancer détection */}
              <button
                onClick={() => setShowDetection(true)}
                style={{
                  width: '100%', backgroundColor: '#d44875', color: 'white',
                  border: 'none', borderRadius: '12px', padding: '14px',
                  fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(212,72,117,0.35)',
                }}
              >
                🔬 Lancer l'analyse de détection
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
