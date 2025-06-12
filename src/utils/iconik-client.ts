import axios, { AxiosHeaders } from 'axios'
import {
  ICONIK_APP_ID,
  ICONIK_AUTH_TOKEN,
} from 'src/config/env-vars'

export const iconikClient = axios.create({
  baseURL: 'https://app.iconik.io/API/',
  headers: {
    'App-Id': ICONIK_APP_ID,
    'Auth-Token': ICONIK_AUTH_TOKEN,
  },
})
