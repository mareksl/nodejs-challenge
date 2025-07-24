import { array, object, string } from 'yup'

export const packagesSchema = object({
  Packages: array(
    object({
      TiCode: string().required(),
      DisplayName: string().required()
    })
  )
})
