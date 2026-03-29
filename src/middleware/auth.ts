import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/ApiError'
import { jwtUtils, JwtPayload } from '../utils/jwt'

export interface AuthRequest extends Request {
  user?: JwtPayload
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided')
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwtUtils.verifyToken(token)
    
    req.user = decoded
    next()
  } catch (error) {
    if (error instanceof ApiError) {
      next(error)
    } else {
      next(ApiError.unauthorized('Invalid token'))
    }
  }
}

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = jwtUtils.verifyToken(token)
      req.user = decoded
    }
  } catch (error) {
    // Token invalid but continue anyway for optional auth
  }
  next()
}