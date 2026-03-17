const crypto = require('crypto');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Client = require('../models/Client');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { generateOTP, hashOTP } = require('../utils/otp');

const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 400, 'Name, email and password are required');
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return errorResponse(res, 400, 'An account with this email already exists');
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'developer',
      phone: phone || '',
      isEmailVerified: role === 'client' ? false : true,
    });

    if (user.role === 'developer' || user.role === 'manager') {
      await Employee.create({ user: user._id });
    } else if (user.role === 'client') {
      await Client.create({
        user: user._id,
        companyName: req.body.companyName || `${name}'s Company`,
        phone: phone || '',
        contactPerson: { name, email: user.email, phone: phone || '' },
      });
    }

    const token = generateToken(user._id);

    return successResponse(res, 201, 'Account created successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        phone: user.phone || '',
        isEmailVerified: user.isEmailVerified,
      },
      token,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const registerClient = async (req, res) => {
  try {
    const { name, email, password, phone, companyName } = req.body;

    if (!name || !email || !password || !phone || !companyName) {
      return errorResponse(res, 400, 'All fields are required');
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return errorResponse(res, 400, 'Email already in use');

    const otp = generateOTP();

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: 'client',
      isActive: true,
      isEmailVerified: false,
      otpHash: hashOTP(otp),
      otpExpire: Date.now() + 10 * 60 * 1000,
    });

    await Client.create({
      user: user._id,
      companyName,
      phone,
      contactPerson: { name, email: user.email, phone },
    });

    await sendEmail({
      to: user.email,
      subject: 'SoftHive OTP Verification',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
          <h2>Verify your email</h2>
          <p>Your OTP code is:</p>
          <div style="font-size:28px;font-weight:800;letter-spacing:6px;background:#f3f4f6;padding:14px 16px;border-radius:12px;text-align:center">
            ${otp}
          </div>
          <p style="color:#6b7280;margin-top:10px">This code expires in 10 minutes.</p>
        </div>
      `,
    });

    return successResponse(res, 201, 'OTP sent to email. Please verify to login.', {
      email: user.email,
    });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return errorResponse(res, 400, 'Email and OTP are required');

    const user = await User.findOne({ email: email.toLowerCase() }).select('+otpHash +otpExpire');
    if (!user) return errorResponse(res, 404, 'User not found');

    if (user.isEmailVerified) {
      return successResponse(res, 200, 'Already verified');
    }

    if (!user.otpHash || !user.otpExpire || user.otpExpire < Date.now()) {
      return errorResponse(res, 400, 'OTP expired. Please register again.');
    }

    if (hashOTP(String(otp)) !== user.otpHash) {
      return errorResponse(res, 400, 'Invalid OTP');
    }

    user.isEmailVerified = true;
    user.otpHash = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return successResponse(res, 200, 'Email verified successfully. You can now login.');
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    if (!user.isActive) {
      return errorResponse(res, 401, 'Your account has been deactivated. Contact admin.');
    }

    if (user.role === 'client' && !user.isEmailVerified) {
      return errorResponse(res, 401, 'Please verify OTP sent to your email before logging in.');
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    return successResponse(res, 200, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        phone: user.phone || '',
        lastLogin: user.lastLogin,
        isEmailVerified: user.isEmailVerified,
      },
      token,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return errorResponse(res, 404, 'User not found');
    return successResponse(res, 200, 'Profile fetched', { user });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    return successResponse(res, 200, 'Profile updated', { user });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return errorResponse(res, 400, 'Both fields are required');
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 400, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();
    return successResponse(res, 200, 'Password changed successfully');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase() });
    if (!user) {
      return successResponse(res, 200, 'If that email exists, a reset link has been sent');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'SoftHive — Password Reset',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
          <h2>Password Reset</h2>
          <p>Click below to reset your password:</p>
          <a href="${resetURL}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold">
            Reset Password
          </a>
          <p style="color:#6b7280;margin-top:10px">This link expires in 10 minutes.</p>
        </div>
      `,
    });

    return successResponse(res, 200, 'Password reset email sent');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return errorResponse(res, 400, 'Invalid or expired reset token');
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return successResponse(res, 200, 'Password reset successful', {
      token: generateToken(user._id),
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  register,
  registerClient,
  verifyOtp,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};