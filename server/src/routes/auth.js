import express from 'express';

const router = express.Router();

// POST /api/auth/verify - Validate basic auth password for admin and agent portals
router.post('/verify', (req, res) => {
  const { password } = req.body;
  const commonPassword = process.env.COMMON_PASSWORD || 'admin123';  // not ideal but have to for demo :(

  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

  if (password === commonPassword) {
    return res.json({
      success: true,
      message: 'Authentication successful',
      token: Buffer.from(`auth:${Date.now()}`).toString('base64')
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid password. Please check the common password.'
  });
});

export default router;
