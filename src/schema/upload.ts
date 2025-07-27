import { array, boolean, date, InferType, number, object, string } from 'yup'
import { packagesSchema } from './packages'
import { titleDataSchema } from './title-data'
import { episodesSchema } from './episodes'

export const fileSchema = packagesSchema.concat(titleDataSchema).concat(episodesSchema)

export const uploadSchema = object({
  id: string().uuid().required(),
  filename: string().required(),
  uploadDate: date().required(),
  fileProperties: object({
    filename: string().required(),
    size: number().required(),
    type: string().required(),
    encoding: string().required(),
    isValid: boolean().required()
  }).required(),
  parsedData: fileSchema,
  status: string().required(),
  lastUpdated: date().optional()
})

export type UploadEntry = InferType<typeof uploadSchema>
