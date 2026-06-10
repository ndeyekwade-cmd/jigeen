export function matchDoctor(patientVille) {
  const medecins = JSON.parse(localStorage.getItem('jigeen_medecins') || '[]')
  if (medecins.length === 0) return null

  const ville = (patientVille || '').toLowerCase().trim()

  // Correspondance exacte ou partielle sur la localité
  const match = medecins.find(m =>
    m.localite.toLowerCase().includes(ville) ||
    ville.includes(m.localite.toLowerCase())
  )

  // Fallback : premier médecin disponible
  return match || medecins[0]
}

export function assignPatientToDoctor(patientId, medecinId) {
  const assignments = JSON.parse(localStorage.getItem('jigeen_assignments') || '[]')
  assignments.push({
    id: Date.now(),
    patientId,
    medecinId,
    date: new Date().toISOString(),
    lu: false,
  })
  localStorage.setItem('jigeen_assignments', JSON.stringify(assignments))
}
