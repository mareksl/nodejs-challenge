import 'dotenv/config'
import { object, string } from 'yup'

export const { AMQP_URL, MONGO_URI, ICONIK_APP_ID, ICONIK_AUTH_TOKEN, ICONIK_COLLECTION_ID } = object({
  AMQP_URL: string().required(),
  MONGO_URI: string().required(),
  ICONIK_APP_ID: string().uuid().required(),
  ICONIK_AUTH_TOKEN: string().required(),
  ICONIK_COLLECTION_ID: string().uuid()
}).validateSync(process.env)
