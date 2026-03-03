/**
 * blog-catalog/scripts/extract.mjs
 *
 * ClaudeMixのブログ記事（有料カテゴリ）から frontmatter を一括抽出し、
 * izanami-product-writer 用のカタログファイルを生成する。
 *
 * 対象カテゴリ: "ClaudeMix 記録" / "ClaudeMix 考察"
 * 出力先: .claude/skills/izanami-product-writer/docs/blog-catalog.md
 *
 * TTL_DAYS を変更する場合はこのファイルの定数を直接編集してください。
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { join, dirname, isAbsolute } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

// ---- 設定 ----
const TTL_DAYS = 30
const TARGET_CATEGORIES = ['ClaudeMix 記録', 'ClaudeMix 考察']

// ---- パス解決 ----
const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../../../..') // extract.mjs → scripts → blog-catalog → skills → .claude → ROOT

// .env から BLOG_SOURCE_PATH を読み込む
const require = createRequire(import.meta.url)
const dotenv = require('dotenv')
dotenv.config({ path: join(ROOT, '.env') })

const blogSourcePath = process.env.BLOG_SOURCE_PATH
if (!blogSourcePath) throw new Error('BLOG_SOURCE_PATH が .env に設定されていません')
const POSTS_DIR = isAbsolute(blogSourcePath) ? blogSourcePath : join(ROOT, blogSourcePath)
const OUTPUT_FILE = join(ROOT, '.claude/skills/izanami-product-writer/docs/blog-catalog.md')

// ---- frontmatter パーサー（slug / title / description / category のみ取得）----
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return null

  const result = {}
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '')
    result[key] = value
  }
  return result
}

function addDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

async function main() {
  const files = (await readdir(POSTS_DIR)).filter(f => f.endsWith('.md'))

  const buckets = Object.fromEntries(TARGET_CATEGORIES.map(c => [c, []]))

  for (const file of files) {
    const content = await readFile(join(POSTS_DIR, file), 'utf-8')
    const fm = parseFrontmatter(content)
    if (!fm || !TARGET_CATEGORIES.includes(fm.category)) continue

    buckets[fm.category].push({
      slug: fm.slug ?? '',
      title: fm.title ?? '',
      description: fm.description ?? '',
    })
  }

  const today = new Date().toISOString().split('T')[0]
  const expiresAt = addDays(TTL_DAYS)
  const total = TARGET_CATEGORIES.reduce((n, c) => n + buckets[c].length, 0)

  const lines = [
    `> 生成日: ${today} | 有効期限: ${expiresAt} | TTL: ${TTL_DAYS}日 | 対象記事数: ${total}件`,
    '> ⚠️ 有効期限を超えた場合は `/blog-catalog` を再実行してください。',
    '',
    '# ブログカタログ（商品宣伝用）',
    '',
    '> izanami-product-writer が記事生成の参考材料として使用します。',
    '> 手動編集可。ただし次回 `/blog-catalog` 実行時に上書きされます。',
    '',
  ]

  for (const category of TARGET_CATEGORIES) {
    const articles = buckets[category]
    lines.push(`## ${category}（${articles.length}件）`, '')
    for (const a of articles) {
      lines.push(`- slug: \`${a.slug}\``)
      lines.push(`  title: ${a.title}`)
      lines.push(`  description: ${a.description}`)
      lines.push('')
    }
  }

  await mkdir(dirname(OUTPUT_FILE), { recursive: true })
  await writeFile(OUTPUT_FILE, lines.join('\n'), 'utf-8')

  console.log('✓ ブログカタログを生成しました')
  console.log(`  ClaudeMix 記録: ${buckets['ClaudeMix 記録'].length}件`)
  console.log(`  ClaudeMix 考察: ${buckets['ClaudeMix 考察'].length}件`)
  console.log(`  合計: ${total}件 | 有効期限: ${expiresAt}`)
  console.log(`  → .claude/skills/izanami-product-writer/docs/blog-catalog.md`)
}

main().catch(err => { console.error(err); process.exit(1) })
