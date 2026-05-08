// HMAC-signed tokens for one-tap email unsubscribe links.
// Format: <base64url(parent_id)>.<base64url(hmacSha256(parent_id))>
// No expiry — the link stays valid until the parent re-enables reminders.
// If a token leaks, the worst case is the recipient gets unsubscribed; they
// can re-enable from Parent View. Re-keying REMINDER_UNSUB_SECRET invalidates
// every previously-issued link.

import { createHmac, timingSafeEqual } from 'node:crypto'

function getSecret(): string {
  const secret = process.env.REMINDER_UNSUB_SECRET
  if (!secret) throw new Error('REMINDER_UNSUB_SECRET is not set.')
  return secret
}

function b64urlEncode(input: string | Buffer): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8')
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function b64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  const padLen = (4 - (padded.length % 4)) % 4
  return Buffer.from(padded + '='.repeat(padLen), 'base64')
}

function sign(parentId: string): Buffer {
  return createHmac('sha256', getSecret()).update(parentId).digest()
}

export function createUnsubscribeToken(parentId: string): string {
  const sig = sign(parentId)
  return `${b64urlEncode(parentId)}.${b64urlEncode(sig)}`
}

export function verifyUnsubscribeToken(token: string | null | undefined): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  let parentId: string
  let providedSig: Buffer
  try {
    parentId = b64urlDecode(parts[0]).toString('utf8')
    providedSig = b64urlDecode(parts[1])
  } catch {
    return null
  }
  if (!parentId) return null
  const expected = sign(parentId)
  if (providedSig.length !== expected.length) return null
  if (!timingSafeEqual(providedSig, expected)) return null
  return parentId
}
