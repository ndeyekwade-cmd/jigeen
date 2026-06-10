import { useState } from 'react'
import Accueil from './pages/Accueil'
import Admin from './pages/Admin'
import RegisterMedecin from './pages/RegisterMedecin'
import EspaceMedecin from './pages/EspaceMedecin'
import ChatWidget from './components/ChatWidget'
import './App.css'

function App() {
  const [chatOpen, setChatOpen] = useState(false)
  const hash = window.location.hash
  if (hash === '#/admin')    return <Admin />
  if (hash === '#/register') return <RegisterMedecin />
  if (hash === '#/medecin')  return <EspaceMedecin />

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

      {/* Image de fond */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'url(/bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }} />

      {/* Logo filigrane */}
      <img
        src="/logo.avif"
        alt=""
        aria-hidden="true"
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '520px', height: '520px',
          objectFit: 'contain', opacity: 0.06,
          pointerEvents: 'none', zIndex: 1,
        }}
      />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <Accueil onStart={() => setChatOpen(true)} chatOpen={chatOpen} />
      </div>

      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}

export default App
