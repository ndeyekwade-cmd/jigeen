import { useEffect, useRef, useState, useCallback } from 'react'

const STEPS = [
  { text: 'Daalal ak Jamm', sub: 'Wolof',    audio: '/daalal.m4a' },
  { text: 'Bienvenue',      sub: 'Français',  audio: '/bienvenue.m4a' },
  { text: 'Welcome',        sub: 'English',   audio: '/welcome.m4a' },
  { text: 'Fadidi fa diam', sub: 'Sérère',    audio: null },
]

export default function Accueil({ onStart, chatOpen }) {
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [visible, setVisible] = useState(true)
  const [showButton, setShowButton] = useState(false)
  const audioRef = useRef(null)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [adminError, setAdminError] = useState(false)

  const handleAdminAccess = () => {
    if (adminCode === '4FANTASTIQUES') {
      window.location.href = '/#/admin'
    } else {
      setAdminError(true)
      setAdminCode('')
    }
  }

  const handleStart = () => setStarted(true)

  useEffect(() => {
    if (!started || done) return

    const goNext = () => {
      setShowButton(true)
      setVisible(false)
      setTimeout(() => {
        const nextStep = step + 1
        if (nextStep >= STEPS.length) {
          setDone(true)
          setVisible(true)
        } else {
          setStep(nextStep)
          setVisible(true)
        }
      }, 300)
    }

    const src = STEPS[step].audio
    if (src) {
      if (audioRef.current) audioRef.current.pause()
      const audio = new Audio(src)
      audioRef.current = audio
      audio.play().catch(() => {})
      audio.onended = goNext
    } else {
      const fallback = setTimeout(goNext, 5000)
      return () => clearTimeout(fallback)
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.onended = null
        audioRef.current.pause()
      }
    }
  }, [step, done, started])

  // Écran d'intro pour déverrouiller l'audio
  if (!started) {
    return (
      <div
        onClick={handleStart}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          gap: '28px',
        }}
      >
        <div style={{
          width: '140px', height: '140px', borderRadius: '50%',
          backgroundColor: 'rgba(212,72,117,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 40px rgba(212,72,117,0.5)',
          animation: 'ringPulse 2s ease-in-out infinite',
        }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <img src="/logo.avif" alt="logo" style={{ width: '90px', height: '90px', objectFit: 'contain' }} />
          </div>
        </div>
        <p style={{
          color: 'white',
          fontSize: '18px',
          fontWeight: '600',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          letterSpacing: '0.5px',
        }}>
          Appuyez pour commencer
        </p>
        <style>{`
          @keyframes ringPulse {
            0%, 100% { transform: scale(1); box-shadow: 0 8px 40px rgba(212,72,117,0.5); }
            50% { transform: scale(1.07); box-shadow: 0 8px 60px rgba(212,72,117,0.7); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      gap: '40px',
    }}>

      {/* Cercle animé */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Anneaux pulsants */}
        <div style={{
          position: 'absolute',
          width: '420px', height: '420px',
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.6)',
          animation: 'ringPulse 3s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          width: '370px', height: '370px',
          borderRadius: '50%',
          border: '2px solid rgba(231,107,149,0.8)',
          animation: 'ringPulse 3s ease-in-out 0.5s infinite',
        }} />
        <div style={{
          position: 'absolute',
          width: '320px', height: '320px',
          borderRadius: '50%',
          border: '1.5px solid rgba(212,72,117,0.5)',
          animation: 'ringPulse 3s ease-in-out 1s infinite',
        }} />

        {/* Cercle principal */}
        <div style={{
          width: '280px', height: '280px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e76b95 0%, #d44875 55%, #b83d65 100%)',
          boxShadow: '0 12px 60px rgba(212,72,117,0.6), 0 0 0 8px rgba(212,72,117,0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 0.35s ease',
          opacity: visible ? 1 : 0,
        }}>
          {!done ? (
            <>
              <div style={{
                width: '68px', height: '68px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.95)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '14px', overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              }}>
                <img src="/logo.avif" alt="logo" style={{ width: '62px', height: '62px', objectFit: 'contain' }} />
              </div>
              <span style={{
                color: 'white',
                fontSize: STEPS[step].text.length > 10 ? '22px' : '32px',
                fontWeight: '800',
                textAlign: 'center',
                padding: '0 20px',
                letterSpacing: '0.5px',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}>
                {STEPS[step].text}
              </span>
              <span style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: '12px',
                marginTop: '8px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}>
                {STEPS[step].sub}
              </span>
            </>
          ) : (
            <>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.95)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '14px', overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              }}>
                <img src="/logo.avif" alt="logo" style={{ width: '74px', height: '74px', objectFit: 'contain' }} />
              </div>
              <span style={{
                color: 'white',
                fontSize: '20px',
                fontWeight: '800',
                textAlign: 'center',
                letterSpacing: '2px',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}>
                JIGEEN
              </span>
            </>
          )}
        </div>
      </div>

      {/* Indicateurs de progression */}
      {!done && (
        <div style={{ display: 'flex', gap: '10px' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? '32px' : '10px',
              height: '10px',
              borderRadius: '5px',
              backgroundColor: i === step ? 'white' : 'rgba(255,255,255,0.4)',
              boxShadow: i === step ? '0 0 8px rgba(255,255,255,0.8)' : 'none',
              transition: 'all 0.4s ease',
            }} />
          ))}
        </div>
      )}

      {/* Bouton final */}
      {showButton && !chatOpen && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeUp 0.6s ease forwards',
        }}>
          <button
            onClick={onStart}
            style={{
              backgroundColor: '#d44875',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.4)',
              borderRadius: '30px',
              padding: '18px 60px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 6px 30px rgba(212,72,117,0.5), 0 2px 0 rgba(255,255,255,0.2) inset',
              transition: 'all 0.2s',
              letterSpacing: '0.5px',
            }}
            onMouseOver={e => {
              e.currentTarget.style.backgroundColor = '#b83d65'
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = '0 10px 36px rgba(212,72,117,0.6)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.backgroundColor = '#d44875'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(212,72,117,0.5)'
            }}
          >
            Commencer →
          </button>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
            Détection précoce du cancer du sein
          </p>
        </div>
      )}

      {/* Navigation discrète */}
      <div style={{
        position: 'fixed', bottom: '18px', right: '18px',
        display: 'flex', gap: '8px',
      }}>
        <a href="/#/medecin" style={{
          backgroundColor: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(8px)',
          color: 'white', textDecoration: 'none',
          borderRadius: '20px', padding: '7px 16px',
          fontSize: '12px', fontWeight: '600',
          border: '1px solid rgba(255,255,255,0.3)',
          letterSpacing: '0.3px',
        }}>
          Espace médecin
        </a>
        <button
          onClick={() => setShowAdminModal(true)}
          style={{
            backgroundColor: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            borderRadius: '20px', padding: '7px 16px',
            fontSize: '12px', fontWeight: '600',
            border: '1px solid rgba(255,255,255,0.3)',
            letterSpacing: '0.3px', cursor: 'pointer',
          }}>
          Admin
        </button>
      </div>

      {/* Modal code admin */}
      {showAdminModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) { setShowAdminModal(false); setAdminCode(''); setAdminError(false) } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            backgroundColor: 'white', borderRadius: '20px',
            padding: '36px 32px', width: '320px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔐</div>
            <h2 style={{ color: '#d44875', fontSize: '17px', fontWeight: '800', margin: '0 0 6px' }}>
              Accès Administration
            </h2>
            <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 20px' }}>
              Entrez le code d'accès
            </p>
            <input
              autoFocus
              type="password"
              value={adminCode}
              onChange={e => { setAdminCode(e.target.value); setAdminError(false) }}
              onKeyDown={e => e.key === 'Enter' && handleAdminAccess()}
              placeholder="••••••••••••"
              style={{
                width: '100%', padding: '11px 14px', boxSizing: 'border-box',
                borderRadius: '10px',
                border: `2px solid ${adminError ? '#e53e3e' : '#f2b8ca'}`,
                fontSize: '15px', textAlign: 'center', letterSpacing: '3px',
                outline: 'none', marginBottom: '8px',
                backgroundColor: adminError ? '#fff5f5' : 'white',
              }}
            />
            {adminError && (
              <p style={{ color: '#e53e3e', fontSize: '12px', margin: '0 0 12px', fontWeight: '600' }}>
                Code incorrect
              </p>
            )}
            <button
              onClick={handleAdminAccess}
              style={{
                width: '100%', marginTop: '8px',
                backgroundColor: '#d44875', color: 'white',
                border: 'none', borderRadius: '10px', padding: '12px',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              }}
            >
              Accéder
            </button>
            <button
              onClick={() => { setShowAdminModal(false); setAdminCode(''); setAdminError(false) }}
              style={{
                width: '100%', marginTop: '8px',
                backgroundColor: 'transparent', color: '#aaa',
                border: 'none', padding: '8px',
                fontSize: '13px', cursor: 'pointer',
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 0.2; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
