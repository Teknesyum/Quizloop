export const REPORT_URL = ''
export const REPORT_APP = 'Quizloop'

export interface ReportContext {
  version: string
  platform: string
  route: string
  moduleId: string | null
  questionId: string | null
  lang: string
  view: string
  agent: string
}

export interface ReportTicket {
  no: number
}
