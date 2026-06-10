import { useState } from 'react'

export default function RegisterMedecin() {
  const [form, setForm] = useState({
    prenom: '', nom: '', specialite: '', localite: '', hopital: '', photo: '',
  })
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.prenom.trim())     e.prenom     = 'Champ requis'
    if (!form.nom.trim())        e.nom        = 'Champ requis'
    if (!form.specialite.trim()) e.specialite = 'Champ requis'
    if (!form.localite.trim())   e.localite   = 'Champ requis'
    if (!form.hopital.trim())    e.hopital    = 'Champ requis'
    return e
  }

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
  }

  const handleSubmit = () => {
    const e2 = validate()
    if (Object.keys(e2).length > 0) { setErrors(e2); return }

    const newId = Date.now()
    const medecins = JSON.parse(localStorage.getItem('jigeen_medecins') || '[]')
    medecins.push({ id: newId, date: new Date().toISOString(), ...form })
    try {
      localStorage.setItem('jigeen_medecins', JSON.stringify(medecins))
      localStorage.setItem('jigeen_current_medecin', newId)
    } catch {
      // localStorage plein : on retire les photos pour libérer de l'espace
      const slim = medecins.map(m => ({ ...m, photo: '' }))
      localStorage.setItem('jigeen_medecins', JSON.stringify(slim))
      localStorage.setItem('jigeen_current_medecin', newId)
    }
    setSuccess(true)
    setTimeout(() => { window.location.href = '/#/medecin' }, 1800)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f4eff2',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      fontFamily: 'Segoe UI, sans-serif',
      position: 'relative',
      padding: '40px 24px',
    }}>

      {/* Cercles décoratifs */}
      <div style={{
        position: 'fixed', top: '-80px', right: '-80px',
        width: '260px', height: '260px', borderRadius: '50%',
        backgroundColor: 'rgba(212,72,117,0.15)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-60px', left: '-60px',
        width: '200px', height: '200px', borderRadius: '50%',
        backgroundColor: 'rgba(184,61,101,0.12)', pointerEvents: 'none',
      }} />

      {/* Carte principale */}
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: '820px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
      }}>

        {/* Panneau gauche */}
        <div style={{
          width: '300px',
          flexShrink: 0,
          background: 'linear-gradient(160deg, #e76b95 0%, #d44875 60%, #b83d65 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 32px',
          gap: '24px',
          borderRadius: '20px 0 0 20px',
        }}>
          <a href="/" style={{
            width: '110px', height: '110px', borderRadius: '50%',
            backgroundColor: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            textDecoration: 'none', cursor: 'pointer',
          }}>
            <img src="/logo.avif" alt="Jigeen" style={{ width: '96px', height: '96px', objectFit: 'contain' }} />
          </a>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            <p style={{ color: 'white', fontSize: '17px', fontWeight: '800', textAlign: 'center', letterSpacing: '1px', margin: 0 }}>
              JIGEEN
            </p>

            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', lineHeight: '1.75', margin: 0, textAlign: 'center' }}>
              Plateforme de <strong style={{ fontWeight: '700' }}>détection précoce du cancer du sein.</strong>
            </p>

          </div>
        </div>

        {/* Panneau droit */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          padding: '40px',
          overflowY: 'auto',
          borderRadius: '0 20px 20px 0',
        }}>

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '52px', marginBottom: '16px' }}>✅</div>
              <h2 style={{ color: '#d44875', fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>
                Inscription réussie !
              </h2>
              <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                Dr {form.prenom} {form.nom}, votre profil a bien été enregistré.<br />
                Vous serez contacté pour prendre en charge la patiente et assurer le suivi médical.
              </p>
              <button
                onClick={() => { setForm({ prenom: '', nom: '', specialite: '', localite: '', hopital: '', photo: '' }); setSuccess(false) }}
                style={{
                  marginTop: '24px',
                  backgroundColor: '#d44875', color: 'white', border: 'none',
                  borderRadius: '10px', padding: '12px 32px',
                  fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                }}
              >
                Nouvelle inscription
              </button>
            </div>
          ) : (
            <>
              <h1 style={{
                fontSize: '20px', fontWeight: '800',
                color: '#d44875', textAlign: 'center',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                marginBottom: '32px',
              }}>
                Inscription Médecin
              </h1>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <Field label="Prénom" required value={form.prenom}
                    error={errors.prenom} onChange={v => handleChange('prenom', v)} />
                  <Field label="Nom" required value={form.nom}
                    error={errors.nom} onChange={v => handleChange('nom', v)} />
                </div>

                <Field label="Spécialité" required value={form.specialite}
                  error={errors.specialite} onChange={v => handleChange('specialite', v)}
                  placeholder="ex : Oncologie, Gynécologie..." />

                <Field label="Localité" required value={form.localite}
                  error={errors.localite} onChange={v => handleChange('localite', v)}
                  placeholder="Ville ou quartier" />

                <Field label="Nom de l'hôpital / Clinique" required value={form.hopital}
                  error={errors.hopital} onChange={v => handleChange('hopital', v)}
                  placeholder="Établissement de rattachement" />

                {/* Photo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555' }}>Photo de profil</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%',
                      backgroundColor: '#fde8ef', border: '2px solid #f2b8ca',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', flexShrink: 0,
                    }}>
                      {form.photo
                        ? <img src={form.photo} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '26px' }}>👩‍⚕️</span>
                      }
                    </div>
                    <label style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '10px 14px', borderRadius: '8px',
                      border: '1.5px dashed #f2b8ca', cursor: 'pointer',
                      fontSize: '13px', color: '#d44875', fontWeight: '600',
                      backgroundColor: '#fdf5f8', transition: 'all 0.2s',
                    }}>
                      {form.photo ? 'Changer la photo' : 'Choisir une photo'}
                      <input
                        type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files[0]
                          if (!file) return
                          const img = new Image()
                          const url = URL.createObjectURL(file)
                          img.onload = () => {
                            const canvas = document.createElement('canvas')
                            canvas.width = 120
                            canvas.height = 120
                            const ctx = canvas.getContext('2d')
                            const size = Math.min(img.width, img.height)
                            const sx = (img.width - size) / 2
                            const sy = (img.height - size) / 2
                            ctx.drawImage(img, sx, sy, size, size, 0, 0, 120, 120)
                            handleChange('photo', canvas.toDataURL('image/jpeg', 0.5))
                            URL.revokeObjectURL(url)
                          }
                          img.src = url
                        }}
                      />
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  style={{
                    marginTop: '8px',
                    backgroundColor: '#d44875', color: 'white', border: 'none',
                    borderRadius: '10px', padding: '14px',
                    fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                    letterSpacing: '0.5px',
                    boxShadow: '0 4px 16px rgba(212,72,117,0.35)',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = '#b83d65'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = '#d44875'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  S'INSCRIRE
                </button>

              </div>

            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, error, placeholder = '', required = false }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '12px', fontWeight: '600', color: '#555' }}>
        {label}{required && <span style={{ color: '#d44875' }}> *</span>}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '10px 14px',
          borderRadius: '8px',
          border: `1.5px solid ${error ? '#e53e3e' : '#f2b8ca'}`,
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s',
          backgroundColor: error ? '#fff5f5' : 'white',
        }}
        onFocus={e => { e.target.style.borderColor = '#d44875' }}
        onBlur={e => { e.target.style.borderColor = error ? '#e53e3e' : '#f2b8ca' }}
      />
      {error && <span style={{ fontSize: '11px', color: '#e53e3e' }}>{error}</span>}
    </div>
  )
}
