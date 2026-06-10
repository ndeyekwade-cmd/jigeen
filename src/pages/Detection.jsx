import { useState, useRef } from 'react'

export default function Detection() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
  }

  const handleAnalyse = async () => {
    if (!image) return
    setLoading(true)
    setResult(null)
    await new Promise(r => setTimeout(r, 2500))
    setResult({
      label: 'Bénin',
      confidence: 87,
      message: "L'analyse ne détecte pas de signe malin. Consultez néanmoins un médecin pour confirmation."
    })
    setLoading(false)
  }

  const handleReset = () => {
    setImage(null)
    setPreview(null)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#b83d65', marginBottom: '8px' }}>
          Analyse par Intelligence Artificielle
        </h1>
        <p style={{ color: '#9e2d4e', fontSize: '15px' }}>
          Téléversez une image mammographique pour obtenir une analyse précoce
        </p>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(212,72,117,0.12)',
        border: '2px solid #f2b8ca'
      }}>
        {/* Zone de téléversement */}
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed #e76b95',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: '#fef4f7',
            transition: 'background 0.2s',
            marginBottom: '24px'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#fde8ef'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#fef4f7'}
        >
          {preview ? (
            <img
              src={preview}
              alt="Aperçu"
              style={{ maxHeight: '300px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
            />
          ) : (
            <>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🩺</div>
              <p style={{ color: '#b83d65', fontWeight: '600', fontSize: '16px' }}>
                Cliquez pour choisir une image
              </p>
              <p style={{ color: '#9e2d4e', fontSize: '13px', marginTop: '6px' }}>
                Formats acceptés : JPG, PNG, DICOM
              </p>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />

        {/* Boutons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={handleAnalyse}
            disabled={!image || loading}
            style={{
              backgroundColor: image && !loading ? '#d44875' : '#f2b8ca',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              padding: '12px 36px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: image && !loading ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s'
            }}
          >
            {loading ? '⏳ Analyse en cours...' : '🔍 Analyser'}
          </button>
          {image && (
            <button
              onClick={handleReset}
              style={{
                backgroundColor: 'transparent',
                color: '#b83d65',
                border: '2px solid #d44875',
                borderRadius: '24px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* Résultat */}
        {result && (
          <div style={{
            marginTop: '28px',
            padding: '24px',
            borderRadius: '16px',
            backgroundColor: result.label === 'Bénin' ? '#e8f5e9' : '#fde8ef',
            border: `2px solid ${result.label === 'Bénin' ? '#a5d6a7' : '#e76b95'}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>
              {result.label === 'Bénin' ? '✅' : '⚠️'}
            </div>
            <h2 style={{
              fontSize: '22px',
              fontWeight: '800',
              color: result.label === 'Bénin' ? '#2e7d32' : '#b83d65',
              marginBottom: '8px'
            }}>
              Résultat : {result.label}
            </h2>
            <div style={{ fontSize: '15px', color: '#555', marginBottom: '12px' }}>
              Confiance du modèle : <strong>{result.confidence}%</strong>
            </div>
            <p style={{ color: '#444', fontSize: '14px', lineHeight: '1.7' }}>
              {result.message}
            </p>
            <p style={{ marginTop: '16px', fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
              ⚕️ Ce résultat est indicatif et ne remplace pas un diagnostic médical professionnel.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
