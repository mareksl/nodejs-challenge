import { array, object, string } from 'yup'

export const titleDataSchema = object({
  Title: array(
    object({
      TICODE: string().required(),
      SeriesTitle: string().required()
    })
  )
})
