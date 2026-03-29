import { Router, Request, Response } from 'express'
import { query } from 'express-validator'
import { authenticate, AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { ApiResponse } from '../utils/ApiResponse'

const router = Router()

// Get transaction history
router.get(
  '/',
  authenticate,
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('type').optional().isIn(['funding', 'withdrawal', 'transfer', 'airtime', 'data', 'tv', 'electricity', 'exchange']),
    query('status').optional().isIn(['pending', 'completed', 'failed']),
  ]),
  (req: AuthRequest, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const type = req.query.type as string
      const status = req.query.status as string

      // In production, fetch from database with filters
      const transactions = [
        {
          id: '1',
          type: 'funding',
          amount: 10000,
          status: 'completed',
          description: 'Wallet funding',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '2',
          type: 'transfer',
          amount: 5000,
          status: 'completed',
          description: 'Transfer to John Doe',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: '3',
          type: 'airtime',
          amount: 2000,
          status: 'completed',
          description: 'MTN airtime purchase',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
        },
      ]

      // Apply filters
      let filtered = transactions
      if (type) filtered = filtered.filter(t => t.type === type)
      if (status) filtered = filtered.filter(t => t.status === status)

      // Paginate
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedTransactions = filtered.slice(startIndex, endIndex)

      ApiResponse.paginated(
        res,
        { transactions: paginatedTransactions },
        {
          page,
          limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit),
        }
      )
    } catch (error) {
      next(error)
    }
  }
)

// Get single transaction
router.get('/:id', authenticate, (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    
    // In production, fetch from database
    const transaction = {
      id,
      type: 'transfer',
      amount: 5000,
      status: 'completed',
      description: 'Transfer to John Doe',
      reference: 'TRF-123456',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    ApiResponse.success(res, transaction)
  } catch (error) {
    next(error)
  }
})

export default router