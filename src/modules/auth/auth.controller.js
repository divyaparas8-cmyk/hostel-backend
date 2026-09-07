const authService = require('./auth.service');

/**
 * Register user controller
 */
const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      });
    }

    // Role validation
    if (role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot register as SUPER_ADMIN through this API'
      });
    }

    const assignedRole = role === 'OWNER' ? 'OWNER' : 'STUDENT';

    const user = await authService.registerUser({
      name,
      email,
      phone,
      password,
      role: assignedRole
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: user
    });
  } catch (error) {
    console.error('Registration Error:', error.message);
    const statusCode = error.message.includes('already registered') ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

/**
 * Login user controller
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const result = await authService.loginUser({ email, password });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    const isAuthError = 
      error.message.includes('No account found') || 
      error.message.includes('Incorrect password') || 
      error.message.includes('deactivated');
      
    const statusCode = isAuthError ? 401 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

/**
 * Get current user profile controller
 */
const getMe = async (req, res) => {
  try {
    // req.user is set by verifyToken middleware
    const userId = req.user.id;
    const user = await authService.getProfile(userId);

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get Profile Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};
