import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate, AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { ApiResponse } from '../utils/ApiResponse'
import { ApiError } from '../utils/ApiError'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Exchange rates (in production, fetch from external API)
const exchangeRates = {
  USD: { NGN: 1500, GBP: 0.79, EUR: 0.92, CNY: 7.24 },
  EUR: { NGN: 1630, USD: 1.09, GBP: 0.86, CNY: 7.87 },
  GBP: { NGN: 1895, USD: 1.27, EUR: 1.16, CNY: 9.15 },
  NGN: { USD: 0.00067, EUR: 0.00061, GBP: 0.00053, CNY: 0.0048 },
  CNY: { NGN: 208, USD: 0.14, EUR: 0.13, GBP: 0.11 },
}

// Get exchange rates
router.get('/rates', (req, res, next) => {
  try {
    ApiResponse.success(res, {
      base: 'USD',
      rates: exchangeRates,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// Get rate for specific currency pair
router.get('/rate/:from/:to', (req, res, next) => {
  try {
    const { from, to } = req.params
    const fromUpper = from.toUpperCase()
    const toUpper = to.toUpperCase()

    if (!exchangeRates[fromUpper] || !exchangeRates[fromUpper][toUpper]) {
      throw ApiError.badRequest('Invalid currency pair')
    }

    ApiResponse.success(res, {
      from: fromUpper,
      to: toUpper,
      rate: exchangeRates[fromUpper][toUpper],
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    next(error)
  }
})

// Convert currency
router.post(
  '/convert',
  authenticate,
  validate([
    body('from').notEmpty().withMessage('Source currency is required'),
    body('to').notEmpty().withMessage('Target currency is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  ]),
  (req: AuthRequest, res, next) => {
    try {
      const { from, to, amount } = req.body
      const fromUpper = from.toUpperCase()
      const toUpper = to.toUpperCase()

      if (!exchangeRates[fromUpper] || !exchangeRates[fromUpper][toUpper]) {
        throw ApiError.badRequest('Invalid currency pair')
      }

      const rate = exchangeRates[fromUpper][toUpper]
      const convertedAmount = amount * rate

      const transaction = {
        id: uuidv4(),
        type: 'exchange',
        from: fromUpper,
        to: toUpper,
        fromAmount: amount,
        toAmount: convertedAmount,
        rate,
        status: 'completed',
        reference: `EX-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }

      ApiResponse.success(res, {
        transaction,
        result: {
          from: fromUpper,
          to: toUpper,
          fromAmount: amount,
          toAmount: convertedAmount,
          rate,
        },
      }, 'Currency converted successfully')
    } catch (error) {
      next(error)
    }
  }
)

// Get exchange history
router.get('/history', authenticate, (req: AuthRequest, res, next) => {
  try {
    // In production, fetch from database
    ApiResponse.success(res, { transactions: [], message: 'No exchange history yet' })
  } catch (error) {
    next(error)
  }
})

export default router