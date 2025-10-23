import { getPool } from '../db/pool.js';

export async function createUser({ name, email, password_hash, auth_provider = 'password', provider_id = null, phone = null }) {
  const result = await getPool().query(
    `INSERT INTO users (name, email, password_hash, auth_provider, provider_id, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, email.toLowerCase(), password_hash, auth_provider, provider_id, phone]
  );
  return result.rows[0];
}

export async function findUserByEmail(email) {
  const result = await getPool().query(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email.toLowerCase()]);
  return result.rows[0] || null;
}

export async function findUserById(id) {
  const result = await getPool().query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
  return result.rows[0] || null;
}

export async function findUserByProvider(provider, providerId) {
  const result = await getPool().query(`SELECT * FROM users WHERE auth_provider = $1 AND provider_id = $2 LIMIT 1`, [provider, providerId]);
  return result.rows[0] || null;
}

export async function updateUserStatus(id, status) {
  const result = await getPool().query(`UPDATE users SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`, [id, status]);
  return result.rows[0] || null;
}

export async function updateUserProfile(id, name, email) {
  const result = await getPool().query(
    `UPDATE users SET name = $2, email = $3, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, name, email.toLowerCase()]
  );
  return result.rows[0] || null;
}

