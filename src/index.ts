import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

import { AppDataSource } from './config/database'
import { logger } from './config/logger'
import authRoutes from './routes/auth'
import walletRoutes from './routes/wallet'
import billRoutes from './routes/bills'
import exchangeRoutes from './routes/exchange'
import userRoutes from './routes/user'
import transactionRoutes from './routes/transactions'
import { errorHandler } from './middleware/errorHandler'
import { ApiError } from './utils/ApiError'

// Load environment variables
dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 3000

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', limiter)

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/bills', billRoutes)
app.use('/api/exchange', exchangeRoutes)
app.use('/api/user', userRoutes)
app.use('/api/transactions', transactionRoutes)

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, 'Route not found'))
})

// Global error handler
app.use(errorHandler)

// Start server
const startServer = async () => {
  try {
    // Initialize database connection
    await AppDataSource.initialize()
    logger.info('Database connected successfully')

    app.listen(PORT, () => {
      logger.info(`🚀 SOLVI API running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app