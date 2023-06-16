import { CrudObject } from './CrudObject'

export interface CrudListOptions {
  defaultLimit: number
  defaultSort: string
  filter: CrudObject | null
}
