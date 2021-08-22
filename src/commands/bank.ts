import {Command, flags} from '@oclif/command'
import * as Listr from 'listr'
import Nordigen from 'nordigen-api'
import {Transaction, TransactionData} from 'nordigen-api/build/main/lib/types'
import {SaveTransaction} from 'ynab'
import {daysSinceDate} from '../lib/date'
import {ynabAPI} from '../lib/ynab'

const {
  NORDIGEN_AUTH_TOKEN,
  NORDIGEN_REQUISITION_ID,
  YNAB_CHECKING_ACCOUNT_ID,
  YNAB_BUDGET_ID,
} = process.env

const nordigen = new Nordigen(NORDIGEN_AUTH_TOKEN!)

type Context = {
  transactions: TransactionData['transactions'];
}

function txFilter(tx: Transaction): boolean {
  return daysSinceDate(new Date(tx.bookingDate)) <= 7
}

function toYNABTransaction(tx: Transaction): SaveTransaction {
  return {
    import_id: tx.transactionId,
    cleared: SaveTransaction.ClearedEnum.Cleared,
    account_id: YNAB_CHECKING_ACCOUNT_ID!,
    amount: parseInt(tx.transactionAmount.amount, 10) * 1000,
    date: tx.bookingDate,
    payee_name: tx.remittanceInformationUnstructured,
    memo: tx.remittanceInformationUnstructured,
  }
}

export default class Bank extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'name to print'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(Bank)

    const tasks = new Listr([
      {
        title: 'Load bank transactions',
        task: async (ctx: Context, task) => {
          const data = await nordigen.getAccountTransactions(NORDIGEN_REQUISITION_ID!)
          const {transactions} = data
          if (!transactions) {
            throw new Error('Could not load account transactions')
          }
          ctx.transactions = transactions
          return true
        },
      },
      {
        title: 'Import to YNAB',
        task: async (ctx: Context, task) => {
          const transactions = [
            ...ctx.transactions.booked.filter(txFilter),
            ...ctx.transactions.pending.filter(txFilter),
          ].map(toYNABTransaction)

          return ynabAPI.transactions.bulkCreateTransactions(YNAB_BUDGET_ID!, {
            transactions,
          })
        },
      },
    ])

    tasks.run()
  }
}
