export interface CrudGetOptions {
  idParam: string
  primaryKey: string
  transform: any | null
  populate: string | string[] | null
}
