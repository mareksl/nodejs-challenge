import { episodesSchema } from '../schema/episodes'
import { packagesSchema } from '../schema/packages'
import { titleDataSchema } from '../schema/title-data'

const fileSchema = packagesSchema.concat(titleDataSchema).concat(episodesSchema).json()

export const validation = {
  async validateFile(file: Express.Multer.File, buffer: Buffer) {
    console.log(`Validating file: ${file.originalname}`)

    const properties = await fileSchema.validate(buffer.toString('utf-8'))

    return {
      filename: file.originalname,
      size: buffer.length,
      type: file.mimetype,
      encoding: file.encoding,
      isValid: true,
      properties
    }
  }
}
