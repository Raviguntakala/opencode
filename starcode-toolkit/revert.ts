#!/usr/bin/env bun
/**
 * Simplified revert script that uses git to undo ALL rebrand changes.
 *
 * Instead of maintaining 60+ search/replace rules, this script:
 *   1. Uses `git checkout HEAD` to restore all tracked files to their pre-rebrand state
 *   2. Removes known untracked files created by rebrand (e.g. bin/<brand>)
 *   3. Preserves all changes in:
 *      - *-toolkit/ folders (starcode-toolkit/, fredcode-toolkit/)
 *      - .<brand>/ dot folders (.starcode/, .fredcode/) for agents, commands, tools, skills, etc.
 *
 * This is self-maintaining: when rebrand.ts adds new rules, no matching revert rule is needed.
 * Works from any toolkit folder — auto-detects brand name from the folder it lives in.
 */

import { spawnSync, execSync } from "child_process"
import { unlinkSync, existsSync, readdirSync, statSync } from "fs"
import path from "path"

const DRY_RUN = process.env["DRY_RUN"] === "true"

// Auto-detect repo root
const root = path.resolve(import.meta.dir, "..")

// Derive brand name from the folder this script lives in (e.g. starcode-toolkit → starcode)
const brand = path.basename(import.meta.dir).replace(/-toolkit$/, "")

// Auto-detect all *-toolkit/ folders and .<brand>/ dot folders to preserve
const entries = readdirSync(root)
const toolkits = entries.filter((f) => f.endsWith("-toolkit") && statSync(path.join(root, f)).isDirectory())
const brands = new Set(toolkits.map((t) => t.replace(/-toolkit$/, "")))
const dotDirs = entries.filter(
  (f) => f.startsWith(".") && brands.has(f.slice(1)) && statSync(path.join(root, f)).isDirectory(),
)
const PRESERVE_DIRS = [...toolkits, ...dotDirs]

// Untracked files known to be created by rebrand
// (rebrand renames bin/opencode → bin/<brand>, creating an untracked file)
const REBRAND_UNTRACKED = [`packages/opencode/bin/${brand}`]

const isPreserved = (f: string) => PRESERVE_DIRS.some((d) => f.startsWith(d + "/"))

function modified() {
  return execSync("git diff --name-only HEAD", { encoding: "utf-8" })
    .trim()
    .split("\n")
    .filter(Boolean)
}

function untracked() {
  return execSync("git ls-files --others --exclude-standard", { encoding: "utf-8" })
    .trim()
    .split("\n")
    .filter(Boolean)
}

function main() {
  console.log("🔄 Reverting rebrand changes using git...\n")
  if (DRY_RUN) console.log("🔍 DRY RUN MODE\n")

  // 1. Get all modified tracked files relative to HEAD
  const files = modified()
  const preserved = files.filter(isPreserved)
  const revert = files.filter((f) => !isPreserved(f))

  console.log(`📊 ${files.length} modified files: ${revert.length} to revert, ${preserved.length} preserved`)
  console.log(`   Preserved dirs: ${PRESERVE_DIRS.join(", ")}`)

  if (preserved.length) {
    console.log("\n📁 Preserving files:")
    for (const f of preserved) console.log(`   ✅ ${f}`)
  }

  // 2. Revert all non-toolkit tracked files
  if (revert.length) {
    console.log("\n↩️  Reverting tracked files:")
    for (const f of revert) console.log(`   ${f}`)
    if (!DRY_RUN) {
      const result = spawnSync("git", ["checkout", "HEAD", "--", ...revert], { stdio: "inherit" })
      if (result.status !== 0) {
        console.error("❌ git checkout failed")
        process.exit(1)
      }
    }
  }

  // 3. Clean up known untracked files created by rebrand
  console.log("\n🧹 Cleaning untracked rebrand files:")
  for (const f of REBRAND_UNTRACKED) {
    if (existsSync(f)) {
      console.log(`   🗑️  ${f}`)
      if (!DRY_RUN) unlinkSync(f)
    } else {
      console.log(`   ⏭️  ${f} (not found)`)
    }
  }

  // 4. Verify: only toolkit files should remain modified
  const remaining = modified()
  const bad = remaining.filter((f) => !isPreserved(f))

  if (bad.length) {
    console.log("\n⚠️  WARNING: Non-preserved files still modified:")
    for (const f of bad) console.log(`   ❌ ${f}`)
  } else {
    console.log("\n✨ Revert complete! Only preserved files remain modified.")
  }

  // 5. Report untracked non-preserved files for awareness
  const untrackedBad = untracked().filter((f) => !isPreserved(f))
  if (untrackedBad.length) {
    console.log("\n📝 Untracked non-preserved files (review manually):")
    for (const f of untrackedBad) console.log(`   ❓ ${f}`)
  }

  // 6. Final summary
  const preservedRemaining = remaining.filter(isPreserved)
  const untrackedPreserved = untracked().filter(isPreserved)
  console.log("\n📋 Final state:")
  console.log(`   Modified preserved files: ${preservedRemaining.length}`)
  console.log(`   Untracked preserved files: ${untrackedPreserved.length}`)
  if (bad.length) console.log(`   ⚠️  Non-toolkit modified: ${bad.length}`)
  if (untrackedBad.length) console.log(`   ⚠️  Non-toolkit untracked: ${untrackedBad.length}`)
}

main()
