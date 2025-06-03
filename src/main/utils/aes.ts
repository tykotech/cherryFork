import * as crypto from 'crypto'

// Encryption function
export function encrypt(text: string, secretKey: string, iv: string): { iv: string; encryptedData: string } {
  const _iv = Buffer.from(iv, 'hex')
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey), _iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return {
    iv: _iv.toString('hex'),
    encryptedData: encrypted
  }
}

// Decryption function
export function decrypt(encryptedData: string, iv: string, secretKey: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), Buffer.from(iv, 'hex'))
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
