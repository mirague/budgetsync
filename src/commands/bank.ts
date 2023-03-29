import { Command } from '@oclif/command'
import * as Listr from 'listr'
import Nordigen from 'nordigen-api'
import { TransactionData } from 'nordigen-api/build/main/lib/types'
import { SaveTransaction, ScheduledTransactionDetail } from 'ynab'
import { daysSinceDate } from '../lib/date'
import { ynabAPI } from '../lib/ynab'
import * as NordigenClient from 'nordigen-node'
import { Transaction } from '../lib/nordigen'

const {
  NORDIGEN_REQUISITION_ID,
  NORDIGEN_SECRET_ID,
  NORDIGEN_SECRET_KEY,
  YNAB_CHECKING_ACCOUNT_ID,
  YNAB_BUDGET_ID,
} = process.env

const client: NordigenClient.default = new (NordigenClient as any)({
  secretId: NORDIGEN_SECRET_ID!,
  secretKey: NORDIGEN_SECRET_KEY!,
})

const MAX_DAYS = 60

type Context = {
  transactions: {
    booked: Transaction[]
    pending: Transaction[]
  }
}

function txFilter(tx: Transaction): boolean {
  return daysSinceDate(new Date(tx.bookingDate)) <= MAX_DAYS
}

function cleanUnstructured(str: string): string {
  return str
    .replace('Swish betalning', '')
    .replace('Swish inbetalning', '')
    .replace('Reservation ', '') // Pending payments
    .replace('Autogiro K*', '') // Klarna
    .trim()
}

// transfer_account_id
const IBAN_TO_YNAB_OVERRIDES: Record<
  string,
  Partial<ScheduledTransactionDetail>
> = {
  // Nordea Savings
  '43951838295': {
    transfer_account_id: 'e0632c42-5dd8-4491-b5a1-bfe079b4213b',
  },
  // ICA Household Account
  '92725871875': { payee_name: 'Household Account' },
  // Amanda
  '930372859': { payee_name: 'Amanda Duggan' },
  // Buffer Avanza
  '95556145360': {
    transfer_account_id: '2755165d-47cb-47a8-9196-2ac4bd8dc363',
  },
  // Klarna
  // '5457973'
}

function toYNABTransaction(
  tx: Transaction,
  isPending = false,
): SaveTransaction {
  const unstructuredInfo = cleanUnstructured(
    tx.remittanceInformationUnstructured,
  )

  const isKlarna = tx.remittanceInformationUnstructured.includes('K*')

  const memo =
    (tx.remittanceInformationStructured
      ? tx.remittanceInformationStructured
      : unstructuredInfo) +
    (tx.additionalInformation ? ` (${tx.additionalInformation})` : '')

  const payeeName = tx.debtorName || tx.creditorName || unstructuredInfo

  let transaction: SaveTransaction = {
    import_id: tx.transactionId,
    cleared: SaveTransaction.ClearedEnum.Cleared,
    account_id: YNAB_CHECKING_ACCOUNT_ID!,
    amount: Math.floor(parseFloat(tx.transactionAmount.amount) * 1000),
    date: tx.bookingDate,
    payee_name: payeeName,
    flag_color: isKlarna ? SaveTransaction.FlagColorEnum.Purple : null,
    memo: memo,
  }

  if (tx.creditorAccount?.iban) {
    const mappedExtra = IBAN_TO_YNAB_OVERRIDES[tx.creditorAccount?.iban]
    transaction = { ...transaction, ...mappedExtra } satisfies SaveTransaction
  }

  return transaction
}

export default class Bank extends Command {
  static description = 'Import transactions from Nordigen to YNAB'

  async run() {
    // Generate new access token. Token is valid for 24 hours
    // Note: access_token is automatically injected to other requests after you successfully obtain it
    await client.generateToken()

    const tasks = new Listr([
      {
        title: 'Load bank transactions from Nordigen',
        task: async (ctx: Context) => {
          const requisitionData = await client.requisition.getRequisitionById(
            NORDIGEN_REQUISITION_ID!,
          )

          // Get account id from the list
          const accountId = requisitionData.accounts[0]

          // Instantiate account object
          const account = client.account(accountId)

          const today = new Date()
          const dateTo = today.toISOString().split('T')[0]
          const dateFrom = new Date(
            new Date().setDate(today.getDate() - MAX_DAYS),
          )
            .toISOString()
            .split('T')[0]

          // Fetch account transactions
          const {
            transactions,
          }: {
            transactions: { booked: Transaction[]; pending: Transaction[] }
          } = await account.getTransactions({
            // Format date to YYYY-MM-DD format
            dateFrom: dateFrom,
            dateTo: dateTo,
            // country: 'SE', // not used but needed in type 🤷‍♀️
          } as any)

          if (!transactions) {
            throw new Error(
              `Could not load account transactions: ${
                (requisitionData as any)?.detail
              }`,
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
            // Commented out: IDs don't match between pending + booked :(
            // ...ctx.transactions.pending
            //   .filter(txFilter)
            //   .map((tx) => toYNABTransaction(tx, true)),
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
