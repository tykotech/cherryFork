import util from 'node:util'
import zlib from 'node:zlib'

import logger from 'electron-log'

// Convert zlib's gzip and gunzip methods to Promise versions
const gzipPromise = util.promisify(zlib.gzip)
const gunzipPromise = util.promisify(zlib.gunzip)

/**
 * Compress a string
 * @returns {Promise<Buffer>} Compressed Buffer
 * @param str
 */
export async function compress(str) {
  try {
    const buffer = Buffer.from(str, 'utf-8')
    return await gzipPromise(buffer)
  } catch (error) {
    logger.error('Compression failed:', error)
    throw error
  }
}

/**
 * Decompress Buffer to JSON string
 * @param {Buffer} compressedBuffer - Compressed Buffer
 * @returns {Promise<string>} Decompressed JSON string
 */
export async function decompress(compressedBuffer) {
  try {
    const buffer = await gunzipPromise(compressedBuffer)
    return buffer.toString('utf-8')
  } catch (error) {
    logger.error('Decompression failed:', error)
    throw error
  }
}
