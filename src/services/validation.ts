import { episodesSchema } from '../schema/episodes'
import { packagesSchema } from '../schema/packages'
import { titleDataSchema } from '../schema/title-data'

const fileSchema = packagesSchema.concat(titleDataSchema).concat(episodesSchema).json()

export const validation = {
  async validateFile(file: Express.Multer.File, buffer: Buffer) {
    console.log(`Validating file: ${file.originalname}`)

    if (file.mimetype !== 'application/json') {
      throw new Error('Invalid file type. Only JSON files are allowed.')
    }

    const parsedData = await fileSchema.validate(buffer.toString('utf-8'))

    return {
      properties: {
        filename: file.originalname,
        size: buffer.length,
        type: file.mimetype,
        encoding: file.encoding,
        isValid: true
      },
      parsedData
    }
  }
}
