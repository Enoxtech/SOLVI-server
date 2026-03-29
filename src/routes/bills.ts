import { Router } from 'express'
import { body, query } from 'express-validator'
import { authenticate, AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { ApiResponse } from '../utils/ApiResponse'
import { ApiError } from '../utils/ApiError'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Billers and plans data
const billers = {
  airtime: [
    { id: 'mtn', name: 'MTN', logo: '📱' },
    { id: 'airtel', name: 'Airtel', logo: '📱' },
    { id: 'glo', name: 'Glo', logo: '📱' },
    { id: '9mobile', name: '9mobile', logo: '📱' },
  ],
  data: [
    { id: 'mtn-data', name: 'MTN Data', logo: '📶' },
    { id: 'airtel-data', name: 'Airtel Data', logo: '📶' },
    { id: 'glo-data', name: 'Glo Data', logo: '📶' },
    { id: '9mobile-data', name: '9mobile Data', logo: '📶' },
  ],
  tv: [
    { id: 'dstv', name: 'DStv', logo: '📺' },
    { id: 'gotv', name: 'GOtv', logo: '📺' },
    { id: 'startimes', name: 'StarTimes', logo: '📺' },
  ],
  electricity: [
    { id: 'eko-electric', name: 'Eko Electricity', logo: '⚡' },
    { id: 'ikeja-electric', name: 'Ikeja Electric', logo: '⚡' },
    { id: 'jos-electric', name: 'Jos Electric', logo: '⚡' },
    { id: 'portharcourt-electric', name: 'Port Harcourt Electric', logo: '⚡' },
    { id: 'kano-electric', name: 'Kano Electric', logo: '⚡' },
  ],
}

const dataPlans: Record<string, Array<{ id: string; name: string; price: number; validity: string; data: string }>> = {
  'mtn-data': [
    { id: 'mtn-500mb', name: '500MB', price: 400, validity: '30 days', data: '500MB' },
    { id: 'mtn-1gb', name: '1GB', price: 800, validity: '30 days', data: '1GB' },
    { id: 'mtn-2gb', name: '2GB', price: 1600, validity: '30 days', data: '2GB' },
    { id: 'mtn-5gb', name: '5GB', price: 4000, validity: '30 days', data: '5GB' },
    { id: 'mtn-10gb', name: '10GB', price: 8000, validity: '30 days', data: '10GB' },
  ],
  'airtel-data': [
    { id: 'airtel-500mb', name: '500MB', price: 400, validity: '30 days', data: '500MB' },
    { id: 'airtel-1gb', name: '1GB', price: 800, validity: '30 days', data: '1GB' },
    { id: 'airtel-2gb', name: '2GB', price: 1600, validity: '30 days', data: '2GB' },
    { id: 'airtel-5gb', name: '5GB', price: 4000, validity: '30 days', data: '5GB' },
  ],
  'glo-data': [
    { id: 'glo-500mb', name: '500MB', price: 400, validity: '30 days', data: '500MB' },
    { id: 'glo-1gb', name: '1GB', price: 800, validity: '30 days', data: '1GB' },
    { id: 'glo-2gb', name: '2GB', price: 1600, validity: '30 days', data: '2GB' },
  ],
  '9mobile-data': [
    { id: '9mobile-500mb', name: '500MB', price: 400, validity: '30 days', data: '500MB' },
    { id: '9mobile-1gb', name: '1GB', price: 800, validity: '30 days', data: '1GB' },
    { id: '9mobile-2gb', name: '2GB', price: 1600, validity: '30 days', data: '2GB' },
  ],
}

const tvPlans: Record<string, Array<{ id: string; name: string; price: number; validity: string }>> = {
  dstv: [
    { id: 'dstv-paccess', name: 'Paccess', price: 2200, validity: '30 days' },
    { id: 'dstv-confam', name: 'Confam', price: 3500, validity: '30 days' },
    { id: 'dstv-yanga', name: 'Yanga', price: 4500, validity: '30 days' },
    { id: 'dstv-smart', name: 'Smart', price: 5500, validity: '30 days' },
    { id: 'dstv-compact', name: 'Compact', price: 10500, validity: '30 days' },
    { id: 'dstv-premium', name: 'Premium', price: 21000, validity: '30 days' },
  ],
  gotv: [
    { id: 'gotv-lite', name: 'Lite', price: 900, validity: '30 days' },
    { id: 'gotv-value', name: 'Value', price: 1900, validity: '30 days' },
    { id: 'gotv-max', name: 'Max', price: 3600, validity: '30 days' },
  ],
  startimes: [
    { id: 'st-nova', name: 'Nova', price: 900, validity: '30 days' },
    { id: 'st-basic', name: 'Basic', price: 2000, validity: '30 days' },
    { id: 'st-smart', name: 'Smart', price: 2500, validity: '30 days' },
    { id: 'st-classic', name: 'Classic', price: 4000, validity: '30 days' },
  ],
}

const electricityPlans = [
  { id: 'prepaid', name: 'Prepaid Meter', type: 'prepaid' },
  { id: 'postpaid', name: 'Postpaid Meter', type: 'postpaid' },
]

// Get all billers
router.get('/billers', (req, res, next) => {
  try {
    ApiResponse.success(res, billers)
  } catch (error) {
    next(error)
  }
})

// Get data plans for a provider
router.get('/data-plans/:provider', (req, res, next) => {
  try {
    const { provider } = req.params
    const plans = dataPlans[provider] || []
    ApiResponse.success(res, plans)
  } catch (error) {
    next(error)
  }
})

// Get TV plans
router.get('/tv-plans/:provider', (req, res, next) => {
  try {
    const { provider } = req.params
    const plans = tvPlans[provider] || []
    ApiResponse.success(res, plans)
  } catch (error) {
    next(error)
  }
})

// Get electricity payment types
router.get('/electricity/types', (req, res, next) => {
  try {
    ApiResponse.success(res, electricityPlans)
  } catch (error) {
    next(error)
  }
})

// Purchase airtime
router.post(
  '/airtime',
  authenticate,
  validate([
    body('provider').notEmpty().withMessage('Provider is required'),
    body('phoneNumber').notEmpty().withMessage('Phone number is required'),
    body('amount').isFloat({ min: 50 }).withMessage('Minimum amount is ₦50'),
  ]),
  (req: AuthRequest, res, next) => {
    try {
      const { provider, phoneNumber, amount } = req.body

      // Simulate purchase (integrate with actual provider API)
      const transaction = {
        id: uuidv4(),
        type: 'airtime',
        provider,
        phoneNumber,
        amount,
        status: 'completed',
        reference: `AR-${Date.now()}`,
        description: `${provider} airtime purchase`,
        createdAt: new Date(),
      }

      ApiResponse.success(res, { transaction }, 'Airtime purchased successfully')
    } catch (error) {
      next(error)
    }
  }
)

// Purchase data
router.post(
  '/data',
  authenticate,
  validate([
    body('provider').notEmpty().withMessage('Provider is required'),
    body('phoneNumber').notEmpty().withMessage('Phone number is required'),
    body('planId').notEmpty().withMessage('Plan is required'),
  ]),
  (req: AuthRequest, res, next) => {
    try {
      const { provider, phoneNumber, planId } = req.body

      // Find plan
      const plans = dataPlans[provider] || []
      const plan = plans.find(p => p.id === planId)
      if (!plan) {
        throw ApiError.badRequest('Invalid plan')
      }

      const transaction = {
        id: uuidv4(),
        type: 'data',
        provider,
        phoneNumber,
        amount: plan.price,
        plan: plan.name,
        data: plan.data,
        validity: plan.validity,
        status: 'completed',
        reference: `DATA-${Date.now()}`,
        description: `${provider} data purchase - ${plan.name}`,
        createdAt: new Date(),
      }

      ApiResponse.success(res, { transaction }, 'Data purchased successfully')
    } catch (error) {
      next(error)
    }
  }
)

// Pay TV subscription
router.post(
  '/tv',
  authenticate,
  validate([
    body('provider').notEmpty().withMessage('Provider is required'),
    body('smartCardNumber').notEmpty().withMessage('Smart card number is required'),
    body('planId').notEmpty().withMessage('Plan is required'),
  ]),
  (req: AuthRequest, res, next) => {
    try {
      const { provider, smartCardNumber, planId } = req.body

      const plans = tvPlans[provider] || []
      const plan = plans.find(p => p.id === planId)
      if (!plan) {
        throw ApiError.badRequest('Invalid plan')
      }

      const transaction = {
        id: uuidv4(),
        type: 'tv',
        provider,
        smartCardNumber,
        amount: plan.price,
        plan: plan.name,
        validity: plan.validity,
        status: 'completed',
        reference: `TV-${Date.now()}`,
        description: `${provider} subscription - ${plan.name}`,
        createdAt: new Date(),
      }

      ApiResponse.success(res, { transaction }, 'TV subscription successful')
    } catch (error) {
      next(error)
    }
  }
)

// Pay electricity bill
router.post(
  '/electricity',
  authenticate,
  validate([
    body('provider').notEmpty().withMessage('Provider is required'),
    body('meterNumber').notEmpty().withMessage('Meter number is required'),
    body('meterType').isIn(['prepaid', 'postpaid']).withMessage('Invalid meter type'),
    body('amount').isFloat({ min: 100 }).withMessage('Minimum amount is ₦100'),
  ]),
  (req: AuthRequest, res, next) => {
    try {
      const { provider, meterNumber, meterType, amount } = req.body

      const transaction = {
        id: uuidv4(),
        type: 'electricity',
        provider,
        meterNumber,
        meterType,
        amount,
        status: 'completed',
        reference: `ELEC-${Date.now()}`,
        description: `${provider} electricity payment`,
        createdAt: new Date(),
      }

      ApiResponse.success(res, { transaction }, 'Electricity bill paid successfully')
    } catch (error) {
      next(error)
    }
  }
)

export default router