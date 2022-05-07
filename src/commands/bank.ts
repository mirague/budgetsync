import { Command } from '@oclif/command'
import * as Listr from 'listr'
import Nordigen from 'nordigen-api'
import { Transaction, TransactionData } from 'nordigen-api/build/main/lib/types'
import { SaveTransaction } from 'ynab'
import { daysSinceDate } from '../lib/date'
import { ynabAPI } from '../lib/ynab'

const {
  NORDIGEN_AUTH_TOKEN,
  NORDIGEN_REQUISITION_ID,
  YNAB_CHECKING_ACCOUNT_ID,
  YNAB_BUDGET_ID,
} = process.env

const nordigen = new Nordigen(NORDIGEN_AUTH_TOKEN!)

type Context = {
  transactions: TransactionData['transactions']
}

function txFilter(tx: Transaction): boolean {
  return daysSinceDate(new Date(tx.bookingDate)) <= 7
}

function toYNABTransaction(
  tx: Transaction,
  isPending = false,
): SaveTransaction {
  return {
    import_id: isPending ? null : tx.transactionId,
    cleared: SaveTransaction.ClearedEnum.Cleared,
    account_id: YNAB_CHECKING_ACCOUNT_ID!,
    amount: parseInt(tx.transactionAmount.amount, 10) * 1000,
    date: tx.bookingDate,
    payee_name: tx.remittanceInformationUnstructured,
    memo: tx.remittanceInformationUnstructured,
  }
}

export default class Bank extends Command {
  static description = 'Import transactions from Nordigen to YNAB'

  async run() {
    const tasks = new Listr([
      {
        title: 'Load bank transactions from Nordigen',
        task: async (ctx: Context) => {
          const requisitionInfo = await nordigen.getRequisitionInfo(
            NORDIGEN_REQUISITION_ID!,
          )
          const data = await nordigen.getAccountTransactions(
            requisitionInfo.accounts[0],
          )
          const { transactions } = data
          if (!transactions) {
            throw new Error(
              `Could not load account transactions: ${(data as any)?.detail}`,
            )
          }
          ctx.transactions = transactions
          return true
        },
      },
      {
        title: 'Import transactions to YNAB',
        task: async (ctx: Context) => {
          const transactions = [
            ...ctx.transactions.booked
              .filter(txFilter)
              .map((tx) => toYNABTransaction(tx)),
            // ...ctx.transactions.pending.filter(txFilter).map(tx => toYNABTransaction(tx, true)),
          ]

          return ynabAPI.transactions.bulkCreateTransactions(YNAB_BUDGET_ID!, {
            transactions,
          })
        },
      },
    ])

    tasks.run().catch((error) => {
      if (error instanceof Error) {
        this.error(error)
      }
      console.error('Error:', { ...error }) // eslint-disable-line
    })
  }
}
