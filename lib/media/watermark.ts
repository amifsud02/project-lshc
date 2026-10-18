import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

// Longest edge of the output. Keeps memory bounded on very large originals.
const MAX_EDGE = 3000
// Logo width as a share of the photo's shorter side, and how opaque it is.
const LOGO_SCALE = 0.16
const LOGO_OPACITY = 0.75

let logo: Promise<Buffer> | null = null
function getLogo() {
  logo ??= readFile(path.join(process.cwd(), 'public', 'lshc.png'))
  return logo
}

/** Returns the photo as a JPEG with the club logo stamped in the bottom-right corner. */
export async function watermarkPhoto(input: Buffer): Promise<Buffer> {
  const photo = await sharp(input)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true })
  const { width, height } = photo.info

  const logoSize = Math.round(Math.min(width, height) * LOGO_SCALE)
  const margin = Math.round(Math.min(width, height) * 0.03)
  const stamp = await sharp(await getLogo())
    .resize(logoSize, logoSize, { fit: 'inside' })
    .ensureAlpha()
    // Scale the logo's alpha channel down to LOGO_OPACITY.
    .composite([
      {
        input: Buffer.from([255, 255, 255, Math.round(255 * LOGO_OPACITY)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer()

  return sharp(photo.data)
    .composite([{ input: stamp, left: width - logoSize - margin, top: height - logoSize - margin }])
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer()
}
