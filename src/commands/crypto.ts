import {Command} from '@oclif/command'
import {google} from 'googleapis'
import {SaveTransaction} from 'ynab'
import * as Listr from 'listr'
import {googleAuth} from '../lib/google'
import {ynabAPI} from '../lib/ynab'
import {timeout} from '../lib/timeout'
import cli from 'cli-ux'

type Context = {
  cryptoHoldingAmount: number;
  ynabAccountBalance: number;
  diff: number;
}

export default class Crypto extends Command {
  static description = 'Sync Crypto holdings from a Google Sheet to YNAB tracking account'

  // Sometimes the google sheets value isn't loaded yet
  sheetTries = 0

  async run() {
    const tasks = new Listr([
      {
        title: 'Load Crypto account balance from Google Sheet',
        task: async (ctx: Context) => {
          ctx.cryptoHoldingAmount = Math.round(await this.getCryptoValue() * 1000)
          return true
        },
      },
      {
        title: 'Load YNAB account balance',
        task: async (ctx: Context) => {
          const {data: {account}} = await ynabAPI.accounts.getAccountById(
            process.env.YNAB_BUDGET_ID!,
            process.env.YNAB_CRYPTO_ACCOUNT_ID!
          )
          ctx.ynabAccountBalance = account.cleared_balance + account.uncleared_balance
          return true
        },
      },
      {
        title: 'Reconcile tracking account in YNAB',
        skip: (ctx: Context) => {
          ctx.diff = Math.round(ctx.cryptoHoldingAmount - ctx.ynabAccountBalance)
          return (Math.abs(ctx.diff) < 1000) ? 'Nothing to reconcile' : false
        },
        task: async (ctx: Context) => ynabAPI.transactions.createTransaction(process.env.YNAB_BUDGET_ID!, {
          transaction: {
            account_id: process.env.YNAB_CRYPTO_ACCOUNT_ID!,
            amount: ctx.diff,
            date: (new Date()).toISOString(),
            cleared: SaveTransaction.ClearedEnum.Reconciled,
            payee_name: 'BudgetSync',
            memo: 'Entered automatically by BudgetSync',
            approved: true,
          },
        }),
      },
    ])

    tasks.run().catch(error => {
      if (error instanceof Error) {
        this.error(error)
      }
      console.error('Error:', {...error}) // eslint-disable-line
    })
  }

  getCryptoValue = async (): Promise<number> => {
    this.sheetTries++
    const sheets = google.sheets({version: 'v4', auth: await googleAuth.getClient()})
    try {
      const {data: {values}} = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID!,
        range: 'Holdings!E2',
        valueRenderOption: 'UNFORMATTED_VALUE',
      })
      cli.action.stop()
      if (!values) {
        return this.error(new Error('No values found for spreadsheet'))
      }

      const v = values[0][0]
      if (isNaN(v)) {
        if (this.sheetTries < 5) {
          await timeout(1000 + (this.sheetTries * 500))
          return this.getCryptoValue()
        }
        throw new Error('Could not load current holding value from Google Sheet')
      }

      return v
    } catch (error) {
      cli.action.stop()
      this.error(error)
    }
  }
}
