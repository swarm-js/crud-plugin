import { CrudObject } from '../interfaces/CrudObject'
import { CrudDeleteOptions } from '../interfaces/CrudDeleteOptions'
import { CrudGetOptions } from '../interfaces/CrudGetOptions'
import { CrudListOptions } from '../interfaces/CrudListOptions'
import { CrudUpdateOptions } from '../interfaces/CrudUpdateOptions'
import { NotFound } from 'http-errors'
import qs from 'qs'

export class Crud {
  model: any
  cache: CrudObject

  constructor (model: any) {
    this.model = model
    this.cache = {}
  }

  async list (request: any, reply: any, options: Partial<CrudListOptions> = {}) {
    const opts: CrudListOptions = {
      primaryKey: '_id',
      defaultLimit: 20,
      filter: null,
      defaultSort: '_id',
      ...options
    }

    const filters: CrudObject[] = []
    if (opts.filter !== null) filters.push(opts.filter)
    let limit: number = opts.defaultLimit
    let page = 1
    let sort: string = opts.defaultSort

    const query = qs.parse(
      new URL(request.raw.url, `http://url.com`).search.substring(1)
    )

    for (let key in query) {
      switch (key) {
        case 'limit':
          limit = +(query[key] ?? opts.defaultLimit)
          break
        case 'page':
          page = +(query[key] ?? 1)
          break
        case 'sort':
          sort = (query[key] ?? opts.defaultSort) as string
          break
        case 'q':
          filters.push({
            $text: {
              $search: query[key] ?? ''
            }
          })
          break
        default:
          let val: any = query[key]
          if (typeof val === 'string')
            val = {
              eq: val
            }
          for (let cond in val) {
            switch (cond) {
              case 'eq':
              case 'ne':
              case 'gt':
              case 'gte':
              case 'lt':
              case 'lte':
                filters.push({
                  [key]: {
                    [`$${cond}`]: val[cond]
                  }
                })
                break
              case 'range':
                const range = val[cond]
                  .split(',')
                  .map((a: string) => parseFloat(a))
                filters.push({
                  [key]: {
                    $gte: range[0],
                    $lte: range[1]
                  }
                })
                break
              case 'in':
              case 'nin':
                filters.push({
                  [key]: {
                    [`$${cond}`]: val[cond].split(',')
                  }
                })
                break
              case 'contains':
                filters.push({
                  [key]: {
                    $regex: val[cond].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                    $options: 'i'
                  }
                })
                break
              case 'exists':
                filters.push({
                  [key]: {
                    $exists: true
                  }
                })
                break
              case 'regex':
                filters.push({
                  [key]: {
                    $regex: val[cond]
                  }
                })
                break
              case 'regexInsensitive':
                filters.push({
                  [key]: {
                    $regex: val[cond],
                    $options: 'i'
                  }
                })
                break
              case 'near':
                const nearConf = (val[cond] ?? '').split(',')
                filters.push({
                  [key]: {
                    $geoWithin: {
                      $center: [
                        [parseFloat(nearConf[1]), parseFloat(nearConf[0])],
                        parseInt(nearConf[2])
                      ]
                    }
                  }
                })
                break
              case 'within':
                const withinConf = (val[cond] ?? '')
                  .split(',')
                  .map((a: string) => parseFloat(a))
                const matrix = []
                for (let i = 0; i < withinConf.length; i = i + 2) {
                  matrix.push([withinConf[i + 1], withinConf[i + 0]])
                }
                const geoE = matrix[0][0]
                const geoN = matrix[0][1]
                const geoW = matrix[1][0]
                const geoS = matrix[1][1]
                filters.push({
                  [key]: {
                    $geoWithin: {
                      $geometry: {
                        type: 'Polygon',
                        coordinates: [
                          [
                            [geoE, geoN],
                            [geoW, geoN],
                            [geoW, geoS],
                            [geoE, geoS],
                            [geoE, geoN]
                          ]
                        ]
                      }
                    }
                  }
                })
                break
            }
          }
          break
      }
    }

    let mongoQuery = {}
    if (filters.length === 1) mongoQuery = filters[0]
    else if (filters.length)
      mongoQuery = {
        $and: filters
      }

    if (limit < 1) limit = opts.defaultLimit

    const total = await this.model.countDocuments(mongoQuery)
    const maxPage = Math.ceil(total / limit)
    if (page < 1) page = 1
    if (page > maxPage) page = maxPage

    const docs = await this.model
      .find(mongoQuery)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec()

    reply.code(200).send({
      docs: docs.map((doc: any) => {
        doc.id = doc[opts.primaryKey]
        delete doc[opts.primaryKey]
        return doc
      }),
      page,
      limit,
      maxPage,
      total
    })
  }

  getListSchema (docSchema: any) {
    return {
      type: 'object',
      properties: {
        docs: {
          type: 'array',
          items: docSchema
        },
        page: {
          type: 'number'
        },
        limit: {
          type: 'number'
        },
        maxPage: {
          type: 'number'
        },
        total: {
          type: 'number'
        }
      }
    }
  }

  async create (request: any, reply: any) {
    await this.model.create(request.body)
    reply.code(201).send({})
  }

  async get (request: any, reply: any, options: Partial<CrudGetOptions> = {}) {
    const opts: CrudGetOptions = {
      idParam: 'id',
      primaryKey: '_id',
      ...options
    }

    const doc = await this.model.findOne({
      [opts.primaryKey]: request.params[opts.idParam]
    })
    if (!doc) throw new NotFound()

    doc.id = doc[opts.primaryKey]
    delete doc[opts.primaryKey]

    reply.code(200).send(doc)
  }

  async update (
    request: any,
    reply: any,
    options: Partial<CrudUpdateOptions> = {}
  ) {
    const opts: CrudUpdateOptions = {
      idParam: 'id',
      primaryKey: '_id',
      ...options
    }

    const res = await this.model.updateOne(
      {
        [opts.primaryKey]: request.params[opts.idParam]
      },
      {
        $set: request.body
      }
    )
    if (!res.nModified) throw NotFound()
    reply.code(200).send({})
  }

  async replace (
    request: any,
    reply: any,
    options: Partial<CrudUpdateOptions> = {}
  ) {
    const opts: CrudUpdateOptions = {
      idParam: 'id',
      primaryKey: '_id',
      ...options
    }

    const res = await this.model.updateOne(
      {
        [opts.primaryKey]: request.params[opts.idParam]
      },
      {
        ...request.body,
        [opts.primaryKey]: request.params[opts.idParam]
      },
      {
        upsert: true
      }
    )
    if (res.nUpserted) reply.code(201).send({})
    else if (!res.nModified) throw NotFound()
    else reply.code(200).send({})
  }

  async delete (
    request: any,
    reply: any,
    options: Partial<CrudDeleteOptions> = {}
  ) {
    const opts: CrudDeleteOptions = {
      idParam: 'id',
      primaryKey: '_id',
      ...options
    }
    const res = await this.model.deleteOne({
      [opts.primaryKey]: request.params[opts.idParam]
    })
    if (!res.deletedCount) throw new NotFound()
    reply.code(204).send({})
  }
}
