import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { userQueries, rateLimitQueries, getDatabase } from '../db';
import { sendVerificationEmail } from '../services/emailService';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken, requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, verifyEmailSchema, emailSchema, updateProfileSchema } from '../schemas/auth';
import { logAudit } from '../services/auditService';

const router = Router();

// Token expiry duration (24 hours)
const TOKEN_EXPIRY_HOURS = 24;

// Avatar upload configuration
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AVATARS_DIR = process.env.AVATARS_PATH || path.join(__dirname, '../../data/avatars');

if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATARS_DIR),
  filename: (_req, file, cb) => {
    const uuid = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuid}${ext || '.jpg'}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_AVATAR_SIZE },
  fileFilter: (_req, file, cb) => {
    if ((ALLOWED_AVATAR_TYPES as readonly string[]).includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: PNG, JPEG, GIF, WebP'));
    }
  },
});

function generateToken(): string {
  return crypto.randomUUID();
}

function getTokenExpiryDate(): string {
  const date = new Date();
  date.setHours(date.getHours() + TOKEN_EXPIRY_HOURS);
  return date.toISOString();
}

// POST /api/auth/avatar — upload avatar for current user
router.post('/avatar', requireAuth, (req: Request, res: Response) => {
  uploadAvatar.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'File must be under 5MB' });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    try {
      const db = getDatabase();
      const userId = req.user!.userId;
      
      // Get current user to check for existing avatar
      const currentUser = db.prepare('SELECT avatar_filename FROM users WHERE id = ?').get(userId) as { avatar_filename?: string } | undefined;
      
      // Delete old avatar file if it exists
      if (currentUser?.avatar_filename) {
        const oldFilePath = path.join(AVATARS_DIR, currentUser.avatar_filename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      // Update user with new avatar filename
      const now = new Date().toISOString();
      db.prepare('UPDATE users SET avatar_filename = ?, updated_at = ? WHERE id = ?').run(
        req.file.filename,
        now,
        userId
      );

      logAudit({
        userId: req.user!.userId,
        userEmail: req.user!.email,
        action: 'user.avatar_uploaded',
        resourceType: 'user',
        resourceId: userId,
        details: { filename: req.file.filename },
      });

      res.status(201).json({ 
        message: 'Avatar uploaded successfully',
        avatarUrl: `/api/auth/avatar/${userId}`
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Error saving avatar:', error);
      res.status(500).json({ error: 'Failed to save avatar' });
    }
  });
});

// GET /api/auth/avatar/:userId — serve avatar image (NO auth required)
router.get('/avatar/:userId', (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    
    const user = getDatabase().prepare('SELECT avatar_filename FROM users WHERE id = ?').get(userId) as { avatar_filename?: string } | undefined;
    
    if (!user || !user.avatar_filename) {
      res.status(404).json({ error: 'Avatar not found' });
      return;
    }

    const filePath = path.join(AVATARS_DIR, user.avatar_filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Avatar file not found' });
      return;
    }

    // Set appropriate content type based on file extension
    const ext = path.extname(user.avatar_filename).toLowerCase();
    let contentType = 'image/jpeg'; // default
    switch (ext) {
      case '.png': contentType = 'image/png'; break;
      case '.gif': contentType = 'image/gif'; break;
      case '.webp': contentType = 'image/webp'; break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving avatar:', error);
    res.status(500).json({ error: 'Failed to serve avatar' });
  }
});

// DELETE /api/auth/avatar — remove current user's avatar
router.delete('/avatar', requireAuth, (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const userId = req.user!.userId;
    
    // Get current user avatar
    const user = db.prepare('SELECT avatar_filename FROM users WHERE id = ?').get(userId) as { avatar_filename?: string } | undefined;
    
    if (!user || !user.avatar_filename) {
      res.status(404).json({ error: 'No avatar to remove' });
      return;
    }

    // Delete the file
    const filePath = path.join(AVATARS_DIR, user.avatar_filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Clear avatar_filename in database
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET avatar_filename = "", updated_at = ? WHERE id = ?').run(now, userId);

    logAudit({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'user.avatar_deleted',
      resourceType: 'user',
      resourceId: userId,
      details: { filename: user.avatar_filename },
    });

    res.json({ message: 'Avatar removed successfully' });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
});

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if email already exists
    const existingUser = userQueries.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'Email has already been taken' });
      return;
    }

    // Generate verification token
    const verificationToken = generateToken();
    const tokenExpiresAt = getTokenExpiryDate();

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = userQueries.create({
      email,
      password: hashedPassword,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: tokenExpiresAt,
    });

    // Send verification email
    let emailSent = true;
    try {
      await sendVerificationEmail(email, verificationToken);
      rateLimitQueries.recordEmailSent(email);
    } catch (emailError) {
      emailSent = false;
      console.error('Failed to send verification email:', emailError);
      logAudit({ userId: user.id, userEmail: email, action: 'email.verification_failed', resourceType: 'user', resourceId: user.id, details: { error: String(emailError) } });
    }

    logAudit({ userId: user.id, userEmail: email, action: 'user.registered', resourceType: 'user', resourceId: user.id, details: { email, emailSent } });

    res.status(201).json({
      message: emailSent
        ? 'Registration successful. Please check your email to verify your account.'
        : 'Registration successful, but the verification email could not be sent. Please use the "Resend Verification" option to try again.',
      userId: user.id,
      emailSent,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', validate(verifyEmailSchema), async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    // Find user by token
    const user = userQueries.findByVerificationToken(token);
    if (!user) {
      res.status(400).json({ error: 'Invalid or expired verification token' });
      return;
    }

    // Check if token has expired
    if (user.emailVerificationTokenExpiresAt) {
      const expiresAt = new Date(user.emailVerificationTokenExpiresAt);
      if (expiresAt < new Date()) {
        res.status(400).json({ error: 'Verification token has expired. Please request a new one.' });
        return;
      }
    }

    // Mark email as verified
    const verifiedUser = userQueries.markEmailVerified(user.id);

    // Return user data so frontend can sync (never expose password)
    res.json({
      message: 'Email verified successfully. You can now log in.',
      user: verifiedUser ? {
        email: verifiedUser.email,
        role: verifiedUser.role,
      } : null
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', validate(emailSchema), async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = userQueries.findByEmail(email);
    if (!user) {
      // Don't reveal whether email exists
      res.json({ message: 'If an account with that email exists, a verification email has been sent.' });
      return;
    }

    // Check if already verified
    if (user.emailVerified) {
      res.status(400).json({ error: 'Email is already verified' });
      return;
    }

    // Check rate limit
    if (!rateLimitQueries.canSendEmail(email)) {
      res.status(429).json({ error: 'Please wait at least 1 minute before requesting another verification email' });
      return;
    }

    // Generate new token
    const verificationToken = generateToken();
    const tokenExpiresAt = getTokenExpiryDate();

    userQueries.setVerificationToken(user.id, verificationToken, tokenExpiresAt);

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
      rateLimitQueries.recordEmailSent(email);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(500).json({ error: 'Failed to send verification email' });
      return;
    }

    res.json({ message: 'If an account with that email exists, a verification email has been sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// POST /api/auth/check-verification
router.post('/check-verification', validate(emailSchema), async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = userQueries.findByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ emailVerified: user.emailVerified });
  } catch (error) {
    console.error('Check verification error:', error);
    res.status(500).json({ error: 'Failed to check verification status' });
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = userQueries.findByEmail(email);
    if (!user || !(await verifyPassword(password, user.password))) {
      logAudit({ userEmail: email, action: 'user.login_failed', resourceType: 'user', details: { email } });
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({ error: 'email_not_verified' });
      return;
    }

    const db = getDatabase();
    const now = new Date().toISOString();
    const clientIp = req.ip || '127.0.0.1';
    db.prepare(
      'UPDATE users SET sign_in_count = sign_in_count + 1, last_sign_in_at = ?, last_sign_in_ip = ?, updated_at = ? WHERE id = ?'
    ).run(now, clientIp, now, user.id);

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    logAudit({ userId: user.id, userEmail: user.email, action: 'user.login', resourceType: 'user', resourceId: user.id });

    // Get updated user data including avatar
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as Record<string, unknown>;
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        signInCount: user.signInCount + 1,
        lastSignInAt: now,
        lastSignInIp: clientIp,
        emailVerified: true,
        avatarUrl: updatedUser.avatar_filename ? `/api/auth/avatar/${user.id}` : null,
        createdAt: user.createdAt,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// PUT /api/auth/profile/:id
router.put('/profile/:id', validate(updateProfileSchema), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { email, password, currentPassword } = req.body;

    const db = getDatabase();
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (currentPassword && !(await verifyPassword(currentPassword, row.password as string))) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    const now = new Date().toISOString();

    if (email && email.toLowerCase() !== (row.email as string).toLowerCase()) {
      const emailTaken = userQueries.findByEmail(email);
      if (emailTaken && emailTaken.id !== id) {
        res.status(400).json({ error: 'Email has already been taken' });
        return;
      }
      db.prepare('UPDATE users SET email = ?, updated_at = ? WHERE id = ?').run(email, now, id);
    }

    if (password) {
      const hashedPassword = await hashPassword(password);
      db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?').run(hashedPassword, now, id);
    }

    logAudit({ userId: id, userEmail: (email || row.email) as string, action: 'user.profile_updated', resourceType: 'user', resourceId: id, details: { emailChanged: !!email, passwordChanged: !!password } });

    const updatedRow = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({
      user: {
        id: updatedRow.id,
        email: updatedRow.email,
        role: updatedRow.role,
        signInCount: updatedRow.sign_in_count,
        lastSignInAt: updatedRow.last_sign_in_at,
        lastSignInIp: updatedRow.last_sign_in_ip,
        emailVerified: updatedRow.email_verified === 1,
        avatarUrl: updatedRow.avatar_filename ? `/api/auth/avatar/${id}` : null,
        createdAt: updatedRow.created_at,
        updatedAt: updatedRow.updated_at,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// DELETE /api/auth/profile/:id
router.delete('/profile/:id', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const db = getDatabase();
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    logAudit({ userId: id, action: 'user.deleted', resourceType: 'user', resourceId: id });
    res.json({ message: 'Account deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// POST /api/auth/sync - Sync user from server to frontend (validates password)
router.post('/sync', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = userQueries.findByEmail(email);
    if (!user || !(await verifyPassword(password, user.password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({ error: 'Email not verified' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        avatarUrl: user.avatarFilename ? `/api/auth/avatar/${user.id}` : null,
      }
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

export default router;
