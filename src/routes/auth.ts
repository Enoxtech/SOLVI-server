import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate, AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { ApiResponse } from '../utils/ApiResponse'
import { ApiError } from '../utils/ApiError'
import { jwtUtils } from '../utils/jwt'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Simulated in-memory user store (replace with DB later)
const users: Map<string, { id: string; email: string; password: string; name: string; phone?: string }> = new Map()

// Register
router.post(
  '/register',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('phone').optional().trim(),
  ]),
  (req, res, next) => {
    try {
      const { email, password, name, phone } = req.body

      // Check if user exists
      for (const user of users.values()) {
        if (user.email === email) {
          throw ApiError.conflict('Email already registered')
        }
      }

      // Create user (in production, hash password with bcrypt)
      const user = {
        id: uuidv4(),
        email,
        password, // Store hashed password in production!
        name,
        phone,
      }
      
      users.set(user.id, user)

      // Generate token
      const token = jwtUtils.generateToken({ userId: user.id, email: user.email })

      ApiResponse.created(res, {
        user: { id: user.id, email: user.email, name: user.name, phone: user.phone },
        token,
      }, 'Registration successful')
    } catch (error) {
      next(error)
    }
  }
)

// Login
router.post(
  '/login',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ]),
  (req, res, next) => {
    try {
      const { email, password } = req.body

      // Find user
      let foundUser: { id: string; email: string; password: string; name: string; phone?: string } | undefined
      for (const user of users.values()) {
        if (user.email === email) {
          foundUser = user
          break
        }
      }

      if (!foundUser || foundUser.password !== password) {
        throw ApiError.unauthorized('Invalid email or password')
      }

      const token = jwtUtils.generateToken({ userId: foundUser.id, email: foundUser.email })

      ApiResponse.success(res, {
        user: { id: foundUser.id, email: foundUser.email, name: foundUser.name, phone: foundUser.phone },
        token,
      }, 'Login successful')
    } catch (error) {
      next(error)
    }
  }
)

// Get current user
router.get('/me', authenticate, (req: AuthRequest, res, next) => {
  try {
    const user = users.get(req.user!.userId)
    if (!user) {
      throw ApiError.notFound('User not found')
    }

    ApiResponse.success(res, {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    })
  } catch (error) {
    next(error)
  }
})

// Update profile
router.put(
  '/profile',
  authenticate,
  validate([
    body('name').optional().trim().notEmpty(),
    body('phone').optional().trim(),
  ]),
  (req: AuthRequest, res, next) => {
    try {
      const user = users.get(req.user!.userId)
      if (!user) {
        throw ApiError.notFound('User not found')
      }

      const { name, phone } = req.body
      if (name) user.name = name
      if (phone) user.phone = phone

      users.set(user.id, user)

      ApiResponse.success(res, {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      }, 'Profile updated')
    } catch (error) {
      next(error)
    }
  }
)

// Change password
router.put(
  '/password',
  authenticate,
  validate([
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ]),
  (req: AuthRequest, res, next) => {
    try {
      const user = users.get(req.user!.userId)
      if (!user) {
        throw ApiError.notFound('User not found')
      }

      const { currentPassword, newPassword } = req.body
      if (user.password !== currentPassword) {
        throw ApiError.unauthorized('Current password is incorrect')
      }

      user.password = newPassword
      users.set(user.id, user)

      ApiResponse.success(res, null, 'Password changed successfully')
    } catch (error) {
      next(error)
    }
  }
)

export default router