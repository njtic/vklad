export type DepositStatus = 'urgent' | 'warning' | 'safe' | 'closed'

export type Deposit = {
  id: string
  bankName: string
  ratePercent: number
  openDate: string
  closeDate: string
  amountRub: number
  expectedIncomeRub: number
  status: DepositStatus
  createdAt: string
  updatedAt: string
}

export type DepositDraft = {
  bankName: string
  ratePercent: string
  openDate: string
  closeDate: string
  amountRub: string
}
