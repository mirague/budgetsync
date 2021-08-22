import {google} from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

export const googleAuth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_CREDENTIAL_PATH,
  scopes: SCOPES,
})
