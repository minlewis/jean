#!/usr/bin/env bun
/**
 * i18n validation script
 *
 * Checks:
 *   1. en.json and zh-CN.json have the same key structure (same set of leaf keys)
 *   2. Every t('foo.bar') / t("foo.bar") reference in src/ points to an existing key
 *
 * Exit code 0 = pass, 1 = failures found.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const LOCALES_DIR = 'src/i18n/locales'
const SRC_DIR = 'src'

interface CheckResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

function collectKeys(obj: unknown, prefix = ''): Set<string> {
  const keys = new Set<string>()
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return keys
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      for (const nested of collectKeys(v, path)) keys.add(nested)
    } else {
      keys.add(path)
    }
  }
  return keys
}

function checkLocaleParity(): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  const enPath = join(LOCALES_DIR, 'en.json')
  const zhPath = join(LOCALES_DIR, 'zh-CN.json')

  let en: unknown
  let zh: unknown
  try {
    en = JSON.parse(readFileSync(enPath, 'utf8'))
  } catch (e) {
    errors.push(`Failed to read ${enPath}: ${(e as Error).message}`)
    return { ok: false, errors }
  }
  try {
    zh = JSON.parse(readFileSync(zhPath, 'utf8'))
  } catch (e) {
    errors.push(`Failed to read ${zhPath}: ${(e as Error).message}`)
    return { ok: false, errors }
  }

  const enKeys = collectKeys(en)
  const zhKeys = collectKeys(zh)

  const onlyEn = [...enKeys].filter(k => !zhKeys.has(k))
  const onlyZh = [...zhKeys].filter(k => !enKeys.has(k))

  for (const k of onlyEn)
    errors.push(`[parity] en has key missing in zh-CN: ${k}`)
  for (const k of onlyZh)
    errors.push(`[parity] zh-CN has key missing in en: ${k}`)

  return { ok: errors.length === 0, errors }
}

function* walkFiles(dir: string, exts: string[]): Generator<string> {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const name of entries) {
    const full = join(dir, name)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      // skip generated / dependency folders
      if (['node_modules', 'dist', '.git', 'build'].includes(name)) continue
      yield* walkFiles(full, exts)
    } else if (st.isFile() && exts.some(ext => name.endsWith(ext))) {
      yield full
    }
  }
}

function checkTCallReferences(knownKeys: Set<string>): {
  ok: boolean
  errors: string[]
} {
  const errors: string[] = []
  // Match t('foo.bar.baz') or t("foo.bar") — single-quoted, double-quoted, with optional whitespace
  const pattern = /\bt\(\s*['"]([^'"]+)['"]/g

  for (const file of walkFiles(SRC_DIR, ['.ts', '.tsx'])) {
    let content: string
    try {
      content = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    let m: RegExpExecArray | null
    while ((m = pattern.exec(content)) !== null) {
      const key = m[1]
      if (key === undefined) continue
      if (!knownKeys.has(key)) {
        errors.push(`[t-ref] ${file}: unknown key '${key}'`)
      }
    }
  }

  return { ok: errors.length === 0, errors }
}

function main(): number {
  const result: CheckResult = { ok: true, errors: [], warnings: [] }

  // 1. Parity check
  const parity = checkLocaleParity()
  result.errors.push(...parity.errors)

  // 2. Build the known key set (use en as source of truth)
  let knownKeys = new Set<string>()
  try {
    const en = JSON.parse(readFileSync(join(LOCALES_DIR, 'en.json'), 'utf8'))
    knownKeys = collectKeys(en)
  } catch {
    // already reported in parity step
  }

  // 3. t() reference scan (only run if parity passed; otherwise keys may legitimately be missing)
  if (parity.ok && knownKeys.size > 0) {
    const refs = checkTCallReferences(knownKeys)
    result.errors.push(...refs.errors)
  } else {
    result.warnings.push('[t-ref] skipped because locale parity check failed')
  }

  result.ok = result.errors.length === 0

  console.log('')
  console.log('i18n:check')
  console.log('==========')
  if (result.errors.length === 0) {
    console.log(
      `✅ pass — ${knownKeys.size} keys consistent across en.json and zh-CN.json`
    )
  } else {
    console.log(`❌ fail — ${result.errors.length} error(s):`)
    for (const e of result.errors) console.log(`   - ${e}`)
  }
  if (result.warnings.length > 0) {
    for (const w of result.warnings) console.log(`⚠️  ${w}`)
  }
  console.log('')

  return result.ok ? 0 : 1
}

process.exit(main())
