import { AmountValue, BankAccount } from 'nordigen-api/build/main/lib/types'

export type Transaction = {
  readonly transactionId: string
  readonly internalTransactionId: string
  readonly entryReference: string
  readonly transactionAmount: AmountValue
  readonly bookingDate: string
  readonly valueDate: string
  readonly remittanceInformationUnstructured: string
  readonly remittanceInformationStructured: string
  readonly additionalInformation: string
  readonly creditorName?: string
  readonly creditorAccount?: BankAccount
  readonly debtorName?: string
  readonly debtorAccount?: BankAccount
}
