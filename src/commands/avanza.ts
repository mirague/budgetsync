import {Command} from '@oclif/command'
import * as AvanzaAPI from 'avanza'
import * as Listr from 'listr'
import {SaveTransaction} from 'ynab'
import {timeout} from '../lib/timeout'
import {ynabAPI} from '../lib/ynab'

const avanza = new AvanzaAPI()

type Context = {
  avanzaHoldingAmount: number;
  ynabAccountBalance: number;
  diff: number;
}

// Read how to setup Avanza credentials at https://github.com/fhqvst/avanza

export default class Avanza extends Command {
  static description = 'Sync investments holding value from Avanza to YNAB tracking account'

  async run() {
    const tasks = new Listr([
      {
        title: 'Load Avanza account balances',
        task: async (ctx: Context) =>
          avanza.authenticate({
            username: process.env.AVANZA_USERNAME!,
            password: process.env.AVANZA_PASSWORD!,
            totpSecret: process.env.AVANZA_TOTP_SECRET!,
          }).then(async () => {
            await timeout(1000)
            const accountIds = process.env.AVANZA_ACCOUNT_IDS?.split(',')!
            const accounts = await Promise.all(
              accountIds?.map(id => avanza.getAccountOverview(id))
            )
            await timeout(1000)
            avanza.disconnect()

            const amount = accounts.reduce((total: number, account) => {
              const accValue = account.totalCollateralValue || account.totalPositionsValue
              return total + accValue
            }, 0)

            ctx.avanzaHoldingAmount = Math.round(amount * 1000)

            return true
          }),
      },
      {
        title: 'Load YNAB account balance',
        task: async (ctx: Context) => {
          const {data: {account}} = await ynabAPI.accounts.getAccountById(
            process.env.YNAB_BUDGET_ID!,
            process.env.YNAB_INVESTMENTS_ACCOUNT_ID!
          )
          ctx.ynabAccountBalance = account.cleared_balance + account.uncleared_balance
          return true
        },
      },
      {
        title: 'Reconcile tracking account in YNAB',
        skip: (ctx: Context) => {
          ctx.diff = ctx.avanzaHoldingAmount - ctx.ynabAccountBalance
          return (Math.abs(ctx.diff) < 1000) ? 'Nothing to reconcile' : false
        },
        task: async (ctx: Context) => ynabAPI.transactions.createTransaction(process.env.YNAB_BUDGET_ID!, {
          transaction: {
            account_id: process.env.YNAB_INVESTMENTS_ACCOUNT_ID!,
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
}
