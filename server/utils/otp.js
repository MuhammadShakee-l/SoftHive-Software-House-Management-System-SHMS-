const crypto = require('crypto');

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

const hashOTP = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

module.exports = { generateOTP, hashOTP };