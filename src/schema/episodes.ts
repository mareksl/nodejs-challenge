import { array, object, string } from 'yup'

export const episodesSchema = object({
  EpisodeData: array(
    object({
      TICODE: string().required(),
      EPISODENO: string().required()
    })
  )
})
