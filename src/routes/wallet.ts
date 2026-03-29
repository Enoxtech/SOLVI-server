import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate, AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { ApiResponse } from '../utils/ApiResponse'
import { ApiError } from '../utils/ApiError'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// In-memory wallet store (replace with database)
interface Wallet {
  userId: string
  balance: number
  ledgerBalance: number
  reservedBalance: number
  currency: string
  createdAt: Date
  updatedAt: Date
}

const wallets: Map<string, Wallet> = new Map()
const transactions: Map<string, any> = new Map()

// Helper to get or create wallet
const getOrCreateWallet = (userId: string): Wallet => {
  let wallet = wallets.get(userId)
  if (!wallet) {
    wallet = {
      userId,
      balance: 0,
      ledgerBalance: 0,
      reservedBalance: 0,
      currency: 'NGN',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    wallets.set(userId, wallet)
  }
  return wallet
}

// Get wallet balance
router.get('/balance', authenticate, (req: AuthRequest, res, next) => {
  try {
    const wallet = getOrCreateWallet(req.user!.userId)
    
    ApiResponse.success(res, {
      balance: wallet.balance,
      ledgerBalance: wallet.ledgerBalance,
      reservedBalance: wallet.reservedBalance,
      availableBalance: wallet.balance - wallet.reservedBalance,
      currency: wallet.currency,
    })
  } catch (error) {
    next(error)
  }
})

// Fund wallet (add money)
router.post(
  '/fund',
  authenticate,
  validate([
    body('amount').isFloat({ min: 100 }).withMessage('Minimum amount is ₦100'),
  ]),
  (req: AuthRequest, res, next) => {
    try {
      const { amount } = req.body
      const wallet = getOrCreateWallet(req.user!.userId)

      // Update balance
      wallet.balance += amount
      wallet.ledgerBalance += amount
      wallet.updatedAt = new Date()
      wallets.set(wallet.userId, wallet)

      // Create transaction record
      const transaction = {
        id: uuidv4(),
        type: 'funding',
        amount,
        balanceAfter: wallet.balance,
        status: 'completed',
        reference: `FUND-${Date.now()}`,
        description: 'Wallet funding',
        createdAt: new Date(),
      }
      transactions.set(transaction.id, transaction)

      ApiResponse.success(res, {
        transaction,
        balance: wallet.balance,
      }, 'Wallet funded successfully')
    } catch (error) {
      next(error)
    }
  }
)

// Withdraw from wallet
router.post(
  '/withdraw',
  authenticate,
  validate([
    body('amount').isFloat({ min: 100 }).withMessage('Minimum amount is ₦100'),
    body('bankCode').notEmpty().withMessage('Bank code is required'),
    body('accountNumber').notEmpty().withMessage('Account number is required'),
    body('accountName').notEmpty().withMessage('Account name is required'),
  ]),
  (req: AuthRequest, res, next) => {
    try {
      const { amount, bankCode, accountNumber, accountName } = req.body
      const wallet = getOrCreateWallet(req.user!.userId)
      const availableBalance = wallet.balance - wallet.reservedBalance

      if (amount > availableBalance) {
        throw ApiError.badRequest('Insufficient balance')
      }

      // Process withdrawal (simulate)
      wallet.balance -= amount
      wallet.updatedAt = new Date()
      wallets.set(wallet.userId, wallet)

      const transaction = {
        id: uuidv4(),
        type: 'withdrawal',
        amount,
        balanceAfter: wallet.balance,
        status: 'pending',
        reference: `WD-${Date.now()}`,
        description: `Withdrawal to ${accountName} (${accountNumber})`,
        metadata: { bankCode, accountNumber, accountName },
        createdAt: new Date(),
      }
      transactions.set(transaction.id, transaction)

      ApiResponse.success(res, {
        transaction,
        balance: wallet.balance,
      }, 'Withdrawal initiated successfully')
    } catch (error) {
      next(error)
    }
  }
)

// Transfer to another user
router.post(
  '/transfer',
  authenticate,
  validate([
    body('recipientId').notEmpty().withMessage('Recipient ID is required'),
    body('amount').isFloat({ min: 100 }).withMessage('Minimum amount is ₦100'),
  ]),
  (req: AuthRequest, res, next) => {
    try {
      const { recipientId, amount, note } = req.body
      const senderId = req.user!.userId

      if (senderId === recipientId) {
        throw ApiError.badRequest('Cannot transfer to yourself')
      }

      const senderWallet = getOrCreateWallet(senderId)
      const availableBalance = senderWallet.balance - senderWallet.reservedBalance

      if (amount > availableBalance) {
        throw ApiError.badRequest('Insufficient balance')
      }

      // Deduct from sender
      senderWallet.balance -= amount
      senderWallet.updatedAt = new Date()
      wallets.set(senderId, senderWallet)

      // Add to recipient
      const recipientWallet = getOrCreateWallet(recipientId)
      recipientWallet.balance += amount
      recipientWallet.updatedAt = new Date()
      wallets.set(recipientId, recipientWallet)

      // Create transaction records
      const senderTx = {
        id: uuidv4(),
        type: 'transfer',
        amount,
        balanceAfter: senderWallet.balance,
        status: 'completed',
        reference: `TRF-${Date.now()}`,
        description: `Transfer to user ${recipientId}`,
        recipientId,
        note,
        createdAt: new Date(),
      }
      transactions.set(senderTx.id, senderTx)

      const recipientTx = {
        id: uuidv4(),
        type: 'transfer',
        amount,
        balanceAfter: recipientWallet.balance,
        status: 'completed',
        reference: `TRF-${Date.now()}`,
        description: `Transfer from user ${senderId}`,
        senderId,
        createdAt: new Date(),
      }
      transactions.set(recipientTx.id, recipientTx)

      ApiResponse.success(res, {
        transaction: senderTx,
        balance: senderWallet.balance,
      }, 'Transfer successful')
    } catch (error) {
      next(error)
    }
  }
)

// Get mini statement (recent transactions)
router.get('/statement', authenticate, (req: AuthRequest, res, next) => {
  try {
    const userTxs = Array.from(transactions.values())
      .filter(tx => tx.senderId === req.user!.userId || tx.recipientId === req.user!.userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    ApiResponse.success(res, { transactions: userTxs })
  } catch (error) {
    next(error)
  }
})

export default router