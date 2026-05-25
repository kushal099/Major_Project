import jwt from 'jsonwebtoken';

// Auth middleware: verifies JWT and attaches req.user { id, role, name, email }
export default async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authorization header missing or malformed' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET missing' });
    }

    const payload = jwt.verify(token, secret);
    
    // Fetch user from database to get current name and email
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(payload.id).select('name email role location isOnlineAvailable');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Attach full user info to request
    req.user = { 
      id: user._id.toString(), 
      role: user.role,
      name: user.name,
      email: user.email,
      location: user.location || {},
      isOnlineAvailable: !!user.isOnlineAvailable,
    };
    return next();
  } catch (err) {
    const code = err.name === 'TokenExpiredError' ? 401 : 401;
    return res.status(code).json({ message: 'Invalid or expired token' });
  }
}
