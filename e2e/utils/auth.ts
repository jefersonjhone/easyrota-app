export const unique = () => `${Date.now()}.${Math.random().toString(36).slice(2)}`
export const uniqueRegistration = () => `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`.slice(-8)
export const uniqueCivilServantEmail = () => `e2e+${unique()}@uefs.br`
export const uniqueStudentEmail = () => `${uniqueRegistration()}@discente.uefs.br`

export const loginCredentials = {
  civilServant: {
    email: 'servant.e2e@uefs.br',
    password: '12345678',
  },
  student: {
    email: 'student.e2e@discente.uefs.br',
    password: '12345678',
  },
}

const civilServants = [
  { name: 'PROFESSOR DA SILVA SANTOS', registration: '87654321' },
  { name: 'ANGELO CONRADO LOULA', registration: '12345678' },
  { name: 'AARON ROBERTO DE MELLO LOPES', registration: '71654523' },
  { name: 'ABEL AUGUSTO CONCEICAO', registration: '71424161' },
  { name: 'ABEL CARNEIRO MOTA LIMA', registration: '71656724' },
  { name: 'ABENAILDES SORAYA VIEIRA DOS SANTOS', registration: '92082055' },
  { name: 'ABILIO SOUZA COSTA NETO', registration: '72495346' },
  { name: 'ABRAAO BRITO PEIXOTO', registration: '71524718' },
  { name: 'ABRAAO VIEIRA MAIA', registration: '71307605' },
] as const

const projectIndexes: Record<string, number> = {
  chromium: 0,
  firefox: 1,
  webkit: 2,
}

export function civilServantFor(projectName: string, retry: number) {
  const projectIndex = projectIndexes[projectName]
  const civilServant = civilServants[projectIndex * 3 + retry]

  if (!civilServant) {
    throw new Error(`No civil-servant fixture for ${projectName}, retry ${retry}`)
  }

  return civilServant
}
