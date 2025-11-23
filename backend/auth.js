const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-me';
const JWT_EXPIRY = '7d'; // Token expires in 7 days

/**
 * Register a new user (PostgreSQL via Prisma)
 */
async function register(req, res) {
  try {
    const { email, username, password, role = 'student', adminCode } = req.body;

    // Validate input
    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ error: 'Email, username, and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters' });
    }

    // Validate role
    if (role !== 'student' && role !== 'admin') {
      return res
        .status(400)
        .json({ error: 'Role must be either "student" or "admin"' });
    }

    // Verify admin code if registering as admin
    const ADMIN_CODE = process.env.ADMIN_CODE || 'teach123';
    let finalRole = role;
    if (role === 'admin') {
      if (!adminCode || adminCode !== ADMIN_CODE) {
        return res.status(403).json({ error: 'Invalid admin code' });
      }
      finalRole = 'admin';
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ error: 'Email already registered' });
      } else {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in DB
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: finalRole
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
}

/**
 * Login user (PostgreSQL via Prisma)
 */
async function login(req, res) {
  try {
    const { emailOrUsername, password } = req.body;

    // Validate input
    if (!emailOrUsername || !password) {
      return res
        .status(400)
        .json({ error: 'Email/username and password are required' });
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
}

/**
 * Verify JWT token middleware
 */
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Get current user profile (PostgreSQL via Prisma)
 */
async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

module.exports = {
  register,
  login,
  verifyToken,
  getProfile,
};
