import { fileSchema } from '../schema/upload'

export const validation = {
  async validateFile(file: Express.Multer.File, buffer: Buffer) {
    console.log(`Validating file: ${file.originalname}`)

    if (file.mimetype !== 'application/json') {
      throw new Error('Invalid file type. Only JSON files are allowed.')
    }

    const parsedData = await fileSchema.json().validate(buffer.toString('utf-8'))

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
