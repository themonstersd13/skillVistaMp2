const bcrypt = require('bcryptjs');

const hashPassword = async (plainTextPassword) => {
  return bcrypt.hash(plainTextPassword, 10);
};

const comparePassword = async (plainTextPassword, hashedPassword) => {
  return bcrypt.compare(plainTextPassword, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};
