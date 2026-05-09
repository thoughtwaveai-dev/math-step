// HMAC-signed tokens for one-tap email unsubscribe links.
// Format: <base64url(parent_id)>.<base64url(hmacSha256(stream + parent_id))>
// No expiry — the link stays valid until the parent re-enables that stream.
// If a token leaks, the worst case is the recipient gets unsubscribed; they
// can re-enable from Parent View. Re-keying REMINDER_UNSUB_SECRET invalidates
// every previously-issued link.
//
// Stream isolation: daily tokens sign the bare parent_id (kept for backward
// compatibility with already-issued links); weekly tokens sign
// `weekly:${parent_id}`. A token from one stream cannot validate against the
// other because the HMAC inputs differ.

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

function sign(payload: string): Buffer {
  return createHmac('sha256', getSecret()).update(payload).digest()
}

function verify(token: string | null | undefined, prefix: string): string | null {
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
  const expected = sign(`${prefix}${parentId}`)
  if (providedSig.length !== expected.length) return null
  if (!timingSafeEqual(providedSig, expected)) return null
  return parentId
}

// Daily stream — bare parent_id for backward compatibility.
export function createUnsubscribeToken(parentId: string): string {
  const sig = sign(parentId)
  return `${b64urlEncode(parentId)}.${b64urlEncode(sig)}`
}

export function verifyUnsubscribeToken(token: string | null | undefined): string | null {
  return verify(token, '')
}

// Weekly stream — prefixed input so a daily token can't validate here.
export function createWeeklyUnsubscribeToken(parentId: string): string {
  const sig = sign(`weekly:${parentId}`)
  return `${b64urlEncode(parentId)}.${b64urlEncode(sig)}`
}

export function verifyWeeklyUnsubscribeToken(token: string | null | undefined): string | null {
  return verify(token, 'weekly:')
}
