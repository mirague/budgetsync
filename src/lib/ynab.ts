import * as ynab from 'ynab'

export const ynabAPI = new ynab.API(process.env.YNAB_API_TOKEN!)
