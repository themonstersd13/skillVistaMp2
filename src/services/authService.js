const { query, getClient } = require('../database/pgClient');
const { USER_ROLES, HTTP_STATUS } = require('../config/constants');
const { signToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/password');
const ErrorResponse = require('../utils/errorResponse');

const roleDisplayNames = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.FACULTY]: 'Faculty',
  [USER_ROLES.STUDENT]: 'Student',
};

const ensureRoleExists = async (client, roleKey) => {
  const displayName = roleDisplayNames[roleKey];

  const result = await client.query(
    `
      INSERT INTO roles (role_key, role_name)
      VALUES ($1, $2)
      ON CONFLICT (role_key)
      DO UPDATE SET role_name = EXCLUDED.role_name
      RETURNING id, role_key, role_name
    `,
    [roleKey, displayName]
  );

  return result.rows[0];
};

const mapUser = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
    email: row.email,
    role: row.role_key,
    department: row.department,
    academicYear: row.academic_year,
    isActive: row.is_active,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const generateAuthPayload = (user) => {
  return {
    sub: user.id,
    id: user.id,
    email: user.email,
    role: user.role,
  };
};

const registerUser = async ({ firstName, lastName, email, password, role }) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const normalizedRole = role || USER_ROLES.STUDENT;
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rowCount > 0) {
      throw new ErrorResponse('An account with this email already exists.', HTTP_STATUS.CONFLICT);
    }

    const roleRecord = await ensureRoleExists(client, normalizedRole);
    const passwordHash = await hashPassword(password);

    const insertedUser = await client.query(
      `
        INSERT INTO users (role_id, first_name, last_name, email, password_hash)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          first_name,
          last_name,
          email,
          department,
          academic_year,
          is_active,
          last_login_at,
          created_at,
          updated_at
      `,
      [roleRecord.id, firstName, lastName, email, passwordHash]
    );

    await client.query('COMMIT');

    const user = {
      ...mapUser({
        ...insertedUser.rows[0],
        role_key: roleRecord.role_key,
      }),
    };

    const token = signToken(generateAuthPayload(user));

    return {
      user,
      token,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const loginUser = async ({ email, password }) => {
  const result = await query(
    `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.password_hash,
        u.department,
        u.academic_year,
        u.is_active,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        r.role_key
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.email = $1
      LIMIT 1
    `,
    [email]
  );

  if (result.rowCount === 0) {
    throw new ErrorResponse('Invalid email or password.', HTTP_STATUS.UNAUTHORIZED);
  }

  const userRow = result.rows[0];
  const isPasswordValid = await comparePassword(password, userRow.password_hash);

  if (!isPasswordValid) {
    throw new ErrorResponse('Invalid email or password.', HTTP_STATUS.UNAUTHORIZED);
  }

  if (!userRow.is_active) {
    throw new ErrorResponse('Your account is inactive. Please contact an administrator.', HTTP_STATUS.FORBIDDEN);
  }

  await query('UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1', [userRow.id]);

  const user = mapUser({
    ...userRow,
    last_login_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const token = signToken(generateAuthPayload(user));

  return {
    user,
    token,
  };
};

const getUserById = async (userId) => {
  const result = await query(
    `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.department,
        u.academic_year,
        u.is_active,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        r.role_key
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId]
  );

  if (result.rowCount === 0) {
    throw new ErrorResponse('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  return mapUser(result.rows[0]);
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};
