import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate, AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { ApiResponse } from '../utils/ApiResponse'
import { ApiError } from '../utils/ApiError'

const router = Router()

// In-memory user profiles
interface UserProfile {
  id: string
  email: string
  name: string
  phone?: string
  avatar?: string
  address?: string
  dateOfBirth?: string
  createdAt: Date
  updatedAt: Date
}

const profiles: Map<string, UserProfile> = new Map()

// Get user profile
router.get('/profile', authenticate, (req: AuthRequest, res, next) => {
  try {
    let profile = profiles.get(req.user!.userId)
    
    if (!profile) {
      // Create default profile
      profile = {
        id: req.user!.userId,
        email: req.user!.email,
        name: 'User',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      profiles.set(req.user!.userId, profile)
    }

    ApiResponse.success(res, profile)
  } catch (error) {
    next(error)
  }
})

// Update user profile
router.put(
  '/profile',
  authenticate,
  validate([
    body('name').optional().trim().notEmpty(),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('dateOfBirth').optional().trim(),
    body('avatar').optional().isURL(),
  ]),
  (req: AuthRequest, res, next) => {
    try {
      let profile = profiles.get(req.user!.userId)
      
      if (!profile) {
        profile = {
          id: req.user!.userId,
          email: req.user!.email,
          name: 'User',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      const { name, phone, address, dateOfBirth, avatar } = req.body
      
      if (name) profile.name = name
      if (phone) profile.phone = phone
      if (address) profile.address = address
      if (dateOfBirth) profile.dateOfBirth = dateOfBirth
      if (avatar) profile.avatar = avatar
      profile.updatedAt = new Date()

      profiles.set(profile.id, profile)

      ApiResponse.success(res, profile, 'Profile updated successfully')
    } catch (error) {
      next(error)
    }
  }
)

// Get notifications
router.get('/notifications', authenticate, (req: AuthRequest, res, next) => {
  try {
    // In production, fetch from database
    const notifications = [
      {
        id: '1',
        title: 'Welcome to SOLVI!',
        message: 'Start sending and receiving money today.',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ]

    ApiResponse.success(res, { notifications })
  } catch (error) {
    next(error)
  }
})

// Mark notification as read
router.put('/notifications/:id/read', authenticate, (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    // In production, update database
    ApiResponse.success(res, { id, read: true }, 'Notification marked as read')
  } catch (error) {
    next(error)
  }
})

// Get settings
router.get('/settings', authenticate, (req: AuthRequest, res, next) => {
  try {
    const settings = {
      currency: 'NGN',
      language: 'en',
      notifications: {
        transactions: true,
        promotions: false,
        security: true,
      },
      security: {
        biometricLogin: false,
        pinEnabled: false,
      },
      theme: 'dark',
    }

    ApiResponse.success(res, settings)
  } catch (error) {
    next(error)
  }
})

// Update settings
router.put('/settings', authenticate, (req: AuthRequest, res, next) => {
  try {
    const settings = req.body
    // In production, save to database
    ApiResponse.success(res, { settings }, 'Settings updated')
  } catch (error) {
    next(error)
  }
})

export default router