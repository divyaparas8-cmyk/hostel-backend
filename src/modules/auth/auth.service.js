const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../../config/db');
const { sendEmail } = require('../../services/email.service');

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

  // Fetch all admins for notifications and emails
  const admins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } });
  
  // Create in-app notification for admins if role is OWNER
  if (role === 'OWNER' && admins.length > 0) {
    const notifications = admins.map(admin => ({
      userId: admin.id,
      title: 'New Owner Registration',
      message: `A new property owner ${name} (${email}) has registered and is awaiting your approval.`,
      type: 'SYSTEM'
    }));
    await prisma.notification.createMany({ data: notifications });
  }

  // 1. Send Alert Email to all Admins
  if (admins.length > 0) {
    const adminEmails = admins.map(a => a.email);
    const roleName = role === 'OWNER' ? 'Property Owner' : 'Student';
    
    // Send to admins (non-blocking)
    adminEmails.forEach(adminEmail => {
      sendEmail({
        to: adminEmail,
        subject: `New ${roleName} Registration Alert`,
        text: `Hello Admin, a new ${roleName} named ${name} (${email}) has just registered on the platform.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">New Registration Alert</h2>
            <p>Hello Admin,</p>
            <p>A new <strong>${roleName}</strong> has just registered on Hostel BMS.</p>
            <ul style="background: #f9fafb; padding: 15px; border-radius: 8px;">
              <li><strong>Name:</strong> ${name}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Phone:</strong> ${phone || 'N/A'}</li>
            </ul>
            ${role === 'OWNER' ? '<p style="color: #ef4444; font-weight: bold;">Action Required: Please review and approve their account from the Admin Dashboard.</p>' : ''}
            <hr style="border: 1px solid #eee; margin-top: 30px;" />
            <p style="color: #888; font-size: 12px;">Hostel Management System Alerts</p>
          </div>
        `
      }).catch(err => console.error("Admin alert email failed:", err));
    });
  }

  // 2. Send Welcome Email to the registering user (non-blocking)
  sendEmail({
    to: user.email,
    subject: 'Welcome to Hostel BMS!',
    text: `Hello ${user.name}, welcome to Hostel BMS! Your account has been created successfully.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to Hostel BMS! 🎉</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Thank you for registering on our platform.</p>
        <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0;">
          ${role === 'OWNER' 
            ? '<p style="margin: 0;">Your <strong>Property Owner</strong> account has been created and is currently <strong>under review</strong> by our team. You will receive another email once it is approved and activated.</p>' 
            : '<p style="margin: 0;">Your <strong>Student</strong> account is now active. You can log in and start exploring hostels in your preferred cities!</p>'
          }
        </div>
        <p>Best Regards,</p>
        <p><strong>Hostel BMS Team</strong></p>
      </div>
    `
  }).catch(err => console.error("Welcome email failed:", err));

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

/**
 * Request password reset
 * @param {string} email
 */
const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    // Return silently to avoid email enumeration attacks
    return;
  }

  // Generate a random plain token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token for database storage
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Set expiration (e.g., 1 hour)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Save to database
  await prisma.resetToken.create({
    data: {
      userId: user.id,
      token: hashedToken,
      expiresAt,
    }
  });

  // Construct reset URL
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${email}`;

  // Send email
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Hostel BMS Password Reset</h2>
      <p>Hello ${user.name},</p>
      <p>We received a request to reset your password. Click the link below to set a new password:</p>
      <div style="margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      </div>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
      <hr style="border: 1px solid #eee; margin-top: 30px;" />
      <p style="color: #888; font-size: 12px;">Hostel Management System</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Reset Your Hostel BMS Password',
    text: `Reset your password by visiting this link: ${resetUrl}`,
    html
  });
};

/**
 * Reset password using token
 * @param {string} email
 * @param {string} token
 * @param {string} newPassword
 */
const resetPassword = async (email, token, newPassword) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  // Hash the incoming plain token to compare with database
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const tokenRecord = await prisma.resetToken.findFirst({
    where: {
      userId: user.id,
      token: hashedToken,
      expiresAt: {
        gt: new Date() // Must not be expired
      }
    }
  });

  if (!tokenRecord) {
    throw new Error('Invalid or expired reset token');
  }

  // Hash the new password using existing bcrypt setup
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update user password and delete the used token
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    }),
    prisma.resetToken.deleteMany({
      where: { userId: user.id }
    })
  ]);
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  forgotPassword,
  resetPassword
};
