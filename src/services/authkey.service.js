// src/services/authkey.service.js
import { dbGet, dbSet, dbUpdate, dbDelete } from '../config/firebase.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Cryptographically-safe 6-digit numeric key (100000–999999) */
export function generateKey() {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return String(arr[0] % 900000 + 100000)
}

const ts = () => new Date().toISOString()

// ── CRUD ─────────────────────────────────────────────────────────────────────

/** Create and store a new authkey. Returns the full record. */
export async function createAuthKey(createdBy = 'admin') {
  const key = generateKey()
  const record = {
    key,
    createdBy,
    createdAt: ts(),
    used: false,
    usedAt: null,
    active: true,
  }
  await dbSet(`authkeys/${key}`, record)
  return record
}

/** Validate key → marks as used. Returns { valid, reason?, record? } */
export async function validateAuthKey(key) {
  const record = await dbGet(`authkeys/${key}`)
  if (!record)        return { valid: false, reason: 'Key not found' }
  if (!record.active) return { valid: false, reason: 'Key is deactivated' }
  if (record.used)    return { valid: false, reason: 'Key already used' }

  const update = { used: true, usedAt: ts() }
  await dbUpdate(`authkeys/${key}`, update)
  return { valid: true, record: { ...record, ...update } }
}

/** List all keys, newest first. */
export async function listAuthKeys() {
  const raw = await dbGet('authkeys')
  if (!raw) return []
  return Object.values(raw).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )
}

/** Deactivate (soft-delete) a key. */
export async function deactivateAuthKey(key) {
  const record = await dbGet(`authkeys/${key}`)
  if (!record) return false
  await dbUpdate(`authkeys/${key}`, { active: false })
  return true
}

/** Permanently delete a key. */
export async function deleteAuthKey(key) {
  const record = await dbGet(`authkeys/${key}`)
  if (!record) return false
  await dbDelete(`authkeys/${key}`)
  return true
}