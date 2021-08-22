import {Command, flags} from '@oclif/command'
import {google} from 'googleapis'
import {SaveTransaction} from 'ynab'
import {googleAuth} from '../lib/google'
import {ynabAPI} from '../lib/ynab'
import cli from 'cli-ux'

const {
  YNAB_CRYPTO_ACCOUNT_ID,
  YNAB_BUDGET_ID,
  GOOGLE_SPREADSHEET_ID,
} = process.env

export default class Crypto extends Command {
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
    const {args, flags} = this.parse(Crypto)

    const cryptoValue = Math.round(await this.getCryptoValue() * 1000)
    const ynabBalance = await this.getYNABCryptoBalance()
    const diff = cryptoValue - ynabBalance

    if (diff === 0) {
      return this.log('Balance is already up to date.')
    }

    cli.action.start(`Creating reconciliation for ${diff / 1000}kr`)
    await ynabAPI.transactions.createTransaction(YNAB_BUDGET_ID!, {
      transaction: {
        account_id: YNAB_CRYPTO_ACCOUNT_ID!,
        amount: diff,
        date: (new Date()).toISOString(),
        cleared: SaveTransaction.ClearedEnum.Reconciled,
        payee_name: 'BudgetSync',
        memo: 'Entered automatically by BudgetSync',
      },
    })
    cli.action.stop()
  }

  getCryptoValue = async () => {
    const sheets = google.sheets({version: 'v4', auth: await googleAuth.getClient()})
    try {
      cli.action.start('Reading crypto holding value from Google Sheet')
      const {data: {values}} = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SPREADSHEET_ID!,
        range: 'Holdings!E2',
        valueRenderOption: 'UNFORMATTED_VALUE',
      })
      cli.action.stop()
      if (!values) {
        return this.error('No values found for spreadsheet')
      }
      return values[0][0]
    } catch (error) {
      cli.action.stop()
      this.error(error)
    }
  }

  getYNABCryptoBalance = async () => {
    const {data: {account}} = await ynabAPI.accounts.getAccountById(
      YNAB_BUDGET_ID!,
      YNAB_CRYPTO_ACCOUNT_ID!
    )
    return account.cleared_balance + account.uncleared_balance
  }
}