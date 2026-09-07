const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');

/**
 * Register a new user
 * @param {Object} data - User registration data
 * @returns {Object} User without password
 */
const registerUser = async (data) => {
  const { name, email, phone, password, role } = data;

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw new Error('Email already registered');
  }

  // Check if phone already exists (if provided)
  if (phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      throw new Error('Phone already registered');
    }
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      isActive: role === 'OWNER' ? false : true
    }
  });

  // Create notification for admins if role is OWNER
  if (role === 'OWNER') {
    const admins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } });
    if (admins.length > 0) {
      const notifications = admins.map(admin => ({
        userId: admin.id,
        title: 'New Owner Registration',
        message: `A new property owner ${name} (${email}) has registered and is awaiting your approval.`,
        type: 'SYSTEM'
      }));
      await prisma.notification.createMany({ data: notifications });
    }
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Login user
 * @param {Object} data - Login credentials {email, password}
 * @returns {Object} User and JWT token
 */
const loginUser = async (data) => {
  const { email, password } = data;

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('No account found with this email. Please register first.');
  }

  // Check if account is active
  if (!user.isActive) {
    if (user.role === 'OWNER') {
      throw new Error('Your owner account is pending admin approval. Please wait.');
    }
    throw new Error('Account is deactivated. Please contact admin.');
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Incorrect password. Please try again.');
  }

  // Generate JWT token
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  // Remove password before returning
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token
  };
};

/**
 * Get user profile by ID
 * @param {Number} userId - User ID
 * @returns {Object} User profile
 */
const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      profilePhoto: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  })
  if (!user) throw new Error('User not found')
  return user
};

module.exports = {
  registerUser,
  loginUser,
  getProfile
};
