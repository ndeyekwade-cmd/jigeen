import { useState, useRef, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import { matchDoctor, assignPatientToDoctor } from '../utils/matchDoctor'

const QUESTIONS = [
  // Informations personnelles
  { key: 'prenom',      text: 'Pour commencer, quel est votre prénom ?' },
  { key: 'nom',         text: (r) => `Merci ${r.prenom} ! Quel est votre nom de famille ?` },
  { key: 'ville',       text: 'Dans quelle ville ou quartier habitez-vous ?' },
  { key: 'age',         text: 'Quel est votre âge ?',
    options: ['Moins de 20 ans', '20 – 30 ans', '31 – 40 ans', '41 – 50 ans', '51 – 60 ans', 'Plus de 60 ans'] },
  { key: 'telephone',   text: 'Quel est votre numéro de téléphone ?' },
  // Antécédents
  { key: 'antecedents', text: 'Y a-t-il des cas de cancer du sein dans votre famille proche (mère, sœur, tante...) ?',
    options: ['Oui', 'Non', 'Je ne sais pas'] },
  // Étape vidéo palpation
  { key: '_video', type: 'video',
    text: 'Avant de continuer, regardez cette vidéo qui vous montre comment faire une auto-palpation.\nReproduisez les gestes, puis confirmez ci-dessous.' },
  // Signes & symptômes
  { key: 'signes', text: 'Après la palpation, avez-vous remarqué quelque chose d\'inhabituel ?',
    options: ['Une boule ou grosseur', 'Une douleur', 'Changement de la peau', 'Un écoulement', 'Plusieurs de ces signes', 'Aucun signe'] },
  { key: 'duree',  text: 'Depuis combien de temps avez-vous ces signes ?',
    options: ['Moins d\'1 semaine', '1 à 4 semaines', '1 à 3 mois', 'Plus de 3 mois', 'Je ne sais pas'] },
  { key: 'cycles', text: 'Êtes-vous actuellement en période de règles ou d\'ovulation ?',
    options: ['Oui, règles', 'Oui, ovulation', 'Non', 'Je ne sais pas'] },
]

const REAL_QUESTIONS = QUESTIONS.filter(q => q.key !== '_video')
const TOTAL = REAL_QUESTIONS.length

function getQuestionText(q, reponses) {
  return typeof q.text === 'function' ? q.text(reponses) : q.text
}

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

async function generatePDF(reponses) {
  const logoDataUrl = await loadCircularLogo()
  const doc = new jsPDF()
  const pink = [212, 72, 117]
  const lightPink = [248, 214, 228]

  // ── En-tête ──
  doc.setFillColor(...pink)
  doc.rect(0, 0, 210, 50, 'F')

  // Logo circulaire
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', 8, 8, 32, 32)
  }

  // Titre "Fiche Patient"
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  doc.text('Fiche Patient', 196, 26, { align: 'right' })

  // Date
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 196, 37, { align: 'right' })

  // ── Champs ──
  const fields = [
    ['Prénom et Nom',              `${reponses.prenom || ''} ${reponses.nom || ''}`.trim() || '—'],
    ['Ville / Quartier',           reponses.ville       || '—'],
    ['Âge',                        reponses.age         || '—'],
    ['Téléphone',                  reponses.telephone   || '—'],
    ['Antécédents familiaux',      reponses.antecedents || '—'],
    ['Signes remarqués',           reponses.signes      || '—'],
    ['Durée des signes',           reponses.duree       || '—'],
    ['Période règles / ovulation', reponses.cycles      || '—'],
    ['Date de consultation',       new Date().toLocaleDateString('fr-FR')],
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

  // ── Pied de page ──
  doc.setFillColor(...pink)
  doc.rect(0, 280, 210, 17, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.text('Jigeen — Détection précoce du cancer du sein  |  Document confidentiel', 105, 290, { align: 'center' })

  return doc
}

export default function ChatWidget({ open, onClose }) {
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [qIndex, setQIndex]       = useState(0)
  const [reponses, setReponses]   = useState({})
  const [finished, setFinished]   = useState(false)
  const [ragMode, setRagMode]     = useState(false)
  const [ragLoading, setRagLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!open) return
    setMessages([{
      role: 'bot',
      text: 'Bienvenue sur Jigeen 🌸\n\nJe suis votre assistant de santé. Je vais vous poser quelques questions simples pour mieux vous accompagner dans la détection précoce du cancer du sein.\n\nVos réponses sont confidentielles et seront transmises à notre équipe médicale.',
    }])
    setInput('')
    setQIndex(0)
    setReponses({})
    setFinished(false)
    setRagMode(false)
    setRagLoading(false)
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: getQuestionText(QUESTIONS[0], {}) }])
    }, 1500)
  }, [open])

  const goToNext = (newReponses, nextIndex) => {
    if (nextIndex >= QUESTIONS.length) {
      const patientId = Date.now()
      const fileName = `jigeen_${newReponses.prenom || 'patient'}_${newReponses.nom || ''}_${patientId}.pdf`
      const records = JSON.parse(localStorage.getItem('jigeen_patients') || '[]')
      records.push({ id: patientId, date: new Date().toISOString(), fileName, ...newReponses })
      localStorage.setItem('jigeen_patients', JSON.stringify(records))

      // Matching géolocalisation → médecin le plus proche
      const medecin = matchDoctor(newReponses.ville)
      if (medecin) assignPatientToDoctor(patientId, medecin.id)

      const medecinMsg = medecin
        ? `\n\nVotre dossier a été transmis au Dr ${medecin.prenom} ${medecin.nom} (${medecin.localite}).`
        : ''

      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'bot',
          text: `Merci ${newReponses.prenom} ! Vos informations ont été enregistrées.${medecinMsg}\n\nUn professionnel de santé vous contactera au ${newReponses.telephone}.`,
        }])
        // Entrer en mode RAG si une URL est configurée
        const ragUrl = localStorage.getItem('jigeen_rag_url') || 'https://khadijawade-jigeen-rag.hf.space'
        if (ragUrl) {
          setTimeout(() => {
            setRagMode(true)
            setMessages(prev => [...prev, {
              role: 'bot',
              text: 'Avez-vous des questions sur le cancer du sein, les symptômes ou les hôpitaux au Sénégal ? Je suis là pour vous répondre.\n\nCliquez sur "Terminer" quand vous avez fini.',
            }])
          }, 1200)
        } else {
          setFinished(true)
        }
      }, 500)
    } else {
      const nextQ = QUESTIONS[nextIndex]
      setTimeout(() => {
        if (nextQ.type === 'video') {
          setMessages(prev => [...prev, { role: 'bot', text: getQuestionText(nextQ, newReponses), type: 'video' }])
        } else {
          setMessages(prev => [...prev, { role: 'bot', text: getQuestionText(nextQ, newReponses) }])
        }
        setQIndex(nextIndex)
      }, 500)
    }
  }

  const processAnswer = (text) => {
    const q = QUESTIONS[qIndex]
    const newReponses = q.key !== '_video' ? { ...reponses, [q.key]: text } : { ...reponses }
    setReponses(newReponses)
    if (q.key !== '_video') {
      setMessages(prev => [...prev, { role: 'user', text }])
    }
    goToNext(newReponses, qIndex + 1)
  }

  const sendRagMessage = async () => {
    const text = input.trim()
    if (!text || ragLoading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setRagLoading(true)
    try {
      const ragUrl = localStorage.getItem('jigeen_rag_url') || 'https://khadijawade-jigeen-rag.hf.space'
      const res = await fetch(`${ragUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'bot', text: data.answer || 'Désolé, je n\'ai pas pu répondre.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Je suis temporairement indisponible. Pour toute urgence, appelez le SAMU au 1515.' }])
    } finally {
      setRagLoading(false)
    }
  }

  const sendMessage = () => {
    const text = input.trim()
    if (!text || finished) return
    if (ragMode) { sendRagMessage(); return }
    setInput('')
    processAnswer(text)
  }

  const sendMessageWith = (text) => {
    if (!text || finished) return
    setInput('')
    processAnswer(text)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const currentQ = QUESTIONS[qIndex]
  const isVideoStep = currentQ?.type === 'video'
  const answeredReal = REAL_QUESTIONS.filter(q => reponses[q.key] !== undefined).length
  const progress = Math.round((answeredReal / TOTAL) * 100)

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      width: '380px', height: isVideoStep ? '600px' : ragMode ? '590px' : '530px',
      borderRadius: '20px', backgroundColor: 'white',
      boxShadow: '0 12px 48px rgba(0,0,0,0.22)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', zIndex: 1000,
      animation: 'slideUp 0.35s ease forwards',
      transition: 'height 0.4s ease',
    }}>

      {/* Header */}
      <div style={{
        backgroundColor: '#d44875', padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="/logo.avif" alt="logo" style={{ width: '32px', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>Jigeen</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>
              {finished ? 'Consultation terminée' : ragMode ? 'Questions libres' : isVideoStep ? 'Vidéo de palpation' : `${answeredReal} / ${TOTAL} questions`}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: 'white', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {/* Barre de progression */}
      <div style={{ height: '3px', backgroundColor: '#f2b8ca', flexShrink: 0 }}>
        <div style={{ height: '100%', backgroundColor: '#d44875', width: `${progress}%`, transition: 'width 0.4s ease' }} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fafafa' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '6px' }}>
            {msg.role === 'bot' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#d44875', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src="/logo.avif" alt="" style={{ width: '24px', objectFit: 'contain' }} />
              </div>
            )}
            <div style={{ maxWidth: '82%' }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                backgroundColor: msg.role === 'user' ? '#d44875' : 'white',
                color: msg.role === 'user' ? 'white' : '#333',
                fontSize: '14px', lineHeight: '1.5',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                whiteSpace: 'pre-line',
              }}>
                {msg.text}
              </div>
              {/* Vidéo intégrée dans la bulle */}
              {msg.type === 'video' && (
                <div style={{ marginTop: '8px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                  <video
                    controls
                    style={{ width: '100%', display: 'block', maxHeight: '200px', objectFit: 'cover' }}
                  >
                    <source src="/palpation.mp4" type="video/mp4" />
                  </video>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Zone RAG */}
      {ragMode && !finished && (
        <div style={{ borderTop: '1px solid #f0f0f0', backgroundColor: 'white', flexShrink: 0 }}>
          <div style={{ padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Posez votre question..."
              rows={1}
              disabled={ragLoading}
              style={{ flex: 1, border: '1.5px solid #f2b8ca', borderRadius: '20px', padding: '8px 14px', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: '1.4', opacity: ragLoading ? 0.6 : 1 }}
            />
            <button onClick={sendRagMessage} disabled={!input.trim() || ragLoading} style={{
              width: '38px', height: '38px', borderRadius: '50%',
              backgroundColor: input.trim() && !ragLoading ? '#d44875' : '#f2b8ca',
              border: 'none', cursor: input.trim() && !ragLoading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {ragLoading
                ? <div style={{ width: '14px', height: '14px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              }
            </button>
          </div>
          <div style={{ padding: '0 14px 10px' }}>
            <button
              onClick={() => setFinished(true)}
              style={{
                width: '100%', backgroundColor: 'white', color: '#d44875',
                border: '2px solid #d44875', borderRadius: '20px', padding: '9px',
                fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              }}
            >
              Terminer la consultation
            </button>
          </div>
        </div>
      )}

      {/* Zone d'interaction */}
      {!finished && !ragMode && (
        <>
          {/* Bouton de confirmation pour la vidéo */}
          {isVideoStep ? (
            <div style={{ padding: '12px 14px', borderTop: '1px solid #f0f0f0', backgroundColor: 'white', flexShrink: 0 }}>
              <button
                onClick={() => processAnswer('Auto-palpation effectuée')}
                style={{
                  width: '100%', backgroundColor: '#d44875', color: 'white',
                  border: 'none', borderRadius: '20px', padding: '12px',
                  fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(212,72,117,0.3)',
                }}
              >
                J'ai effectué l'auto-palpation
              </button>
            </div>
          ) : (
            <>
              {/* Options cliquables */}
              {currentQ?.options && (
                <div style={{ padding: '8px 14px 0', display: 'flex', flexWrap: 'wrap', gap: '7px', backgroundColor: 'white', borderTop: '1px solid #f0f0f0' }}>
                  {currentQ.options.map(opt => (
                    <button key={opt} onClick={() => sendMessageWith(opt)} style={{
                      backgroundColor: '#fde8ef', color: '#d44875',
                      border: '1.5px solid #f2b8ca', borderRadius: '16px',
                      padding: '5px 12px', fontSize: '12px', fontWeight: '600',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {/* Input texte */}
              <div style={{ padding: '10px 14px 12px', borderTop: currentQ?.options ? 'none' : '1px solid #f0f0f0', display: 'flex', gap: '8px', backgroundColor: 'white', flexShrink: 0 }}>
                <textarea
                  value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                  placeholder={currentQ?.options ? 'Ou écrivez votre réponse...' : 'Votre réponse...'}
                  rows={1}
                  style={{ flex: 1, border: '1.5px solid #f2b8ca', borderRadius: '20px', padding: '8px 14px', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: '1.4' }}
                />
                <button onClick={sendMessage} disabled={!input.trim()} style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  backgroundColor: input.trim() ? '#d44875' : '#f2b8ca',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </>
          )}
        </>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
