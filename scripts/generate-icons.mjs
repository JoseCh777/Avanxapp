import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const SOURCE = 'resource/Isotio.png'
const OUT_DIR = 'public/icons'

await mkdir(OUT_DIR, { recursive: true })

const trimmed = await sharp(SOURCE).trim({ threshold: 12 }).png().toBuffer()
const { width = 1, height = 1 } = await sharp(trimmed).metadata()
const side = Math.max(width, height)

async function makeIcon(size, ratio, file) {
  const inner = Math.round(size * ratio)
  const symbol = await sharp(trimmed)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: symbol, gravity: 'center' }])
    .png()
    .toFile(file)

  console.log(`${file} (${size}x${size})`)
}

await makeIcon(192, 0.78, `${OUT_DIR}/icon-192.png`)
await makeIcon(512, 0.78, `${OUT_DIR}/icon-512.png`)
await makeIcon(180, 0.78, `${OUT_DIR}/apple-touch-icon.png`)
await makeIcon(64, 0.86, 'public/favicon.png')

console.log(`Source aspect ratio: ${width}x${height}`)
