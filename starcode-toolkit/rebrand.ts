#!/usr/bin/env bun
/**
 * Script to rename user-facing opencode references to starcode
 * This script only changes user-visible elements, not internal code
 */

import path from "path"
import { rename } from "node:fs/promises"
import { replaceInDirectory } from "./file-replacer"

const DRY_RUN = process.env["DRY_RUN"] === "true"

const stats = { tried: 0, successed: 0 }

interface RenameRule {
  description: string
  files: string[]
  search: string | RegExp
  replace: string
  isRegex?: boolean
}

const renameRules: RenameRule[] = [
  // === USER-FACING VISUAL CHANGES ONLY ===

  // 1. Global config directory name (user sees ~/.config/starcode/)
  {
    description: "Global config directory app name",
    files: ["packages/opencode/src/global/index.ts"],
    search: 'const app = "opencode"',
    replace: 'const app = "starcode"',
  },

  // 2. Install script - all opencode references (directory, comments, messages, URLs)
  {
    description: "Install script - rebrand all opencode references",
    files: ["install"],
    search: /opencode/g,
    replace: "starcode",
    isRegex: true,
  },

  // 3+4. Config filename references - catches "opencode", "opencode.json", "opencode.jsonc"
  //       in config.ts (project/global/managed file lookups, globalConfigFile array)
  //       and migrate-tui-config.ts (migration source file scanning)
  {
    description: "Config filename references - opencode to starcode",
    files: [
      "packages/opencode/src/config/config.ts",
      "packages/opencode/src/config/migrate-tui-config.ts",
      "packages/opencode/src/cli/cmd/mcp.ts",
      "packages/opencode/src/mcp/index.ts",
    ],
    search: /"opencode(\.jsonc?)?"/g,
    replace: '"starcode$1"',
    isRegex: true,
  },

  // 5. Project .opencode folder references (user sees .starcode/ folders)
  //    Broadened to cover all files that hard-code .opencode directory paths:
  //    - paths.ts: Filesystem.up targets:["...opencode"] (×2) — drives all Config.directories() callers
  //    - tui.ts: dir.endsWith("...opencode") guard — blocks .starcode/tui.json from loading
  //    - session/index.ts: plans directory path under .opencode/plans
  //    - mcp.ts: resolveConfigPath writes into .opencode/ subdirectory
  //    - ripgrep.ts: file filter that skips .opencode dirs in codesearch
  //    - tips.tsx: user-facing TUI tips mentioning .opencode/command/, agent/, tools/, etc.
  {
    description: "Project .starcode folder references",
    files: [
      "packages/opencode/src/config/config.ts",
      "packages/opencode/src/cli/cmd/tui/context/theme.tsx",
      "packages/opencode/src/config/paths.ts",
      "packages/opencode/src/config/tui.ts",
      "packages/opencode/src/session/index.ts",
      "packages/opencode/src/cli/cmd/mcp.ts",
      "packages/opencode/src/file/ripgrep.ts",
      "packages/opencode/src/cli/cmd/tui/component/tips.tsx",
      "packages/opencode/src/cli/cmd/agent.ts",
    ],
    search: /(?<!themes)\.opencode/g,
    replace: ".starcode",
    isRegex: true,
  },

  // 5b. User-visible strings in tips, MCP command messages and MCP index
  //     Uses (?<!@) lookbehind to protect '@opencode-ai/...' package imports
  {
    description: "User-visible opencode strings in tips, MCP command messages",
    files: [
      "packages/opencode/src/cli/cmd/tui/component/tips.tsx",
      "packages/opencode/src/cli/cmd/mcp.ts",
      "packages/opencode/src/mcp/index.ts",
    ],
    search: /(?<!@)opencode/g,
    replace: "starcode",
    isRegex: true,
  },

  // 6. Install directory check (user sees .starcode/bin)
  {
    description: "Install directory check in installation detection",
    files: ["packages/opencode/src/installation/index.ts"],
    search: 'path.join(".opencode", "bin")',
    replace: 'path.join(".starcode", "bin")',
  },

  // 7. CLI script name (user sees "starcode" in help)
  {
    description: "CLI script name",
    files: ["packages/opencode/src/index.ts"],
    search: '.scriptName("opencode")',
    replace: '.scriptName("starcode")',
  },

  // 8. Main display logo in CLI UI (user sees STARCODE logo)
  {
    description: "Main display logo in CLI UI",
    files: ["packages/opencode/src/cli/logo.ts"],
    search: `export const logo = {
  left: ["                   ", "█▀▀█ █▀▀█ █▀▀█ █▀▀▄", "█__█ █__█ █^^^ █__█", "▀▀▀▀ █▀▀▀ ▀▀▀▀ ▀~~▀"],
  right: ["             ▄     ", "█▀▀▀ █▀▀█ █▀▀█ █▀▀█", "█___ █__█ █__█ █^^^", "▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀"],
}`,
    replace: `export const logo = {
  left: ["                           ", "█▀▄▀█ ▀█▀ █░░ ▀█▀ █▀▀▄ █▀▀▄", "█░▀░█ ░█░ █░░ ░█░ █░░█ █░░█", "▀░░░▀ ▀▀▀ ▀▀▀ ▀▀▀ ▀░░▀ ▀▀▀░"],
  right: ["             ▄     ", "█▀▀▀ █▀▀█ █▀▀█ █▀▀█", "█___ █__█ █__█ █^^^", "▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀"],
}`,
  },

  // 9. TUI status command references (replaces opencode.status with starcode.status)
  {
    description: "TUI status command references",
    files: ["packages/opencode/src/cli/cmd/tui/app.tsx"],
    search: /opencode\.status/g,
    replace: "starcode.status",
    isRegex: true,
  },

  // 10. TUI bottom status bar branding (user sees "starcode" in bottom left)
  {
    description: "TUI bottom status bar branding",
    files: ["packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx"],
    search: "<b>Open</b>",
    replace: "<b>Star</b>",
  },

  // 11. TUI getting started message - disable it (no free models in starcode)
  {
    description: "TUI getting started message - disable by making condition always false",
    files: ["packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx"],
    search: "          <Show when={!hasProviders() && !gettingStartedDismissed()}>",
    replace: "          <Show when={false}>",
  },

  // 12. Help text for project path (user sees this in --help)
  //     Uses (?<!@) lookbehind to avoid renaming @opencode-ai/sdk package imports
  {
    description: "Help text for project path",
    files: ["packages/opencode/src/cli/cmd/web.ts", "packages/opencode/src/cli/cmd/tui/thread.ts"],
    search: /(?<!@)opencode/g,
    replace: "starcode",
    isRegex: true,
  },

  // 13. Attach command description (user sees this in --help)
  {
    description: "Attach command description",
    files: ["packages/opencode/src/cli/cmd/tui/attach.ts"],
    search: 'describe: "attach to a running opencode server"',
    replace: 'describe: "attach to a running starcode server"',
  },

  // 14. Run command description (user sees this in --help)
  {
    description: "Run command description",
    files: ["packages/opencode/src/cli/cmd/run.ts"],
    search: 'describe: "run opencode with a message"',
    replace: 'describe: "run starcode with a message"',
  },

  // 15. Upgrade command description (user sees this in --help)
  {
    description: "Upgrade command description",
    files: ["packages/opencode/src/cli/cmd/upgrade.ts"],
    search: /opencode/g,
    replace: "starcode",
    isRegex: true,
  },

  // 16. Serve command description (user sees this in --help)
  {
    description: "Serve command description",
    files: ["packages/opencode/src/cli/cmd/serve.ts"],
    search: /opencode/g,
    replace: "starcode",
    isRegex: true,
  },

  // 17. Postinstall script package name pattern (must run FIRST before general replacement)
  {
    description: "Postinstall script package name pattern with @buildwise-ai prefix",
    files: ["packages/opencode/script/postinstall.mjs"],
    search: "const packageName = `opencode-${platform}-${arch}`",
    replace: "const packageName = `@buildwise-ai/starcode-${platform}-${arch}`",
  },

  // 17b. Postinstall script - replace all remaining opencode references with starcode
  {
    description: "Postinstall script - replace all remaining opencode references",
    files: ["packages/opencode/script/postinstall.mjs"],
    search: /opencode/g,
    replace: "starcode",
    isRegex: true,
  },

  // 18. Replace "OpenCode" (capital) with "Starcode" in prompt files
  {
    description: "Prompt files - replace OpenCode (capital) with Starcode",
    files: ["packages/opencode/src/session/prompt/anthropic.txt"],
    search: /OpenCode/g, // Capital O and C
    replace: "Starcode",
    isRegex: true,
  },
  // 19. Remove feedback URL lines from anthropic.txt prompt
  {
    description: "Remove feedback URL lines from anthropic.txt",
    files: ["packages/opencode/src/session/prompt/anthropic.txt"],
    search: "- To give feedback, users should report the issue at\n  https://github.com/anomalyco/opencode\n",
    replace: "\n",
  },
  // 20. Replace "opencode" (lowercase) with "starcode" in prompt files
  {
    description: "Prompt files - replace opencode (lowercase) with starcode",
    files: [
      "packages/opencode/src/session/prompt/anthropic.txt",
      "packages/opencode/src/session/prompt/beast.txt",
      "packages/opencode/src/session/prompt/qwen.txt",
      "packages/opencode/src/session/prompt/gemini.txt",
      "packages/opencode/src/session/prompt/copilot-gpt-5.txt",
      "packages/opencode/src/session/prompt/anthropic-20250930.txt",
      // "packages/opencode/src/tool/bash.txt"
    ],
    search: /opencode/g, // All lowercase
    replace: "starcode",
    isRegex: true,
  },
  // 21. Replace "Claude Code" with "Star Code" in prompt files
  {
    description: "Prompt files - replace Claude Code with Star Code",
    files: ["packages/opencode/src/session/prompt/anthropic-20250930.txt"],
    search: /Claude Code/g,
    replace: "Star Code",
    isRegex: true,
  },
  // 22. Fix Package name in package.json (user sees @buildwise-ai/starcode)
  {
    description: "Fix bin command in package.json",
    files: ["packages/opencode/package.json"],
    search: '"name": "opencode",',
    replace: '"name": "@buildwise-ai/starcode",',
  },
  // 23. Fix bin command in package.json (user sees starcode command)
  {
    description: "Fix bin command in package.json",
    files: ["packages/opencode/package.json"],
    search: '"opencode": "./bin/opencode"',
    replace: '"starcode": "./bin/starcode"',
  },

  // 24. Fix environment variable in wrapper - OPENCODE_BIN_PATH to STARCODE_BIN_PATH
  {
    description: "Fix environment variable in wrapper - OPENCODE_BIN_PATH to STARCODE_BIN_PATH",
    files: ["packages/opencode/bin/opencode"],
    search: "process.env.OPENCODE_BIN_PATH",
    replace: "process.env.STARCODE_BIN_PATH",
  },

  // 25. Fix package base pattern in wrapper - add @buildwise-ai prefix (must run AFTER env var)
  {
    description: "Fix package base pattern in wrapper with @buildwise-ai prefix",
    files: ["packages/opencode/bin/opencode"],
    search: 'const base = "opencode-" + platform + "-" + arch',
    replace: 'const base = "@buildwise-ai/starcode-" + platform + "-" + arch',
  },

  // 26. Fix binary wrapper - replace all remaining opencode references with starcode
  {
    description: "Fix binary wrapper - replace all remaining opencode references",
    files: ["packages/opencode/bin/opencode"],
    search: /opencode/g,
    replace: "starcode",
    isRegex: true,
  },

  // === UNINSTALL COMMAND REBRANDING ===

  // 27. Uninstall command - capitalize "OpenCode" references
  {
    description: "Uninstall command - rebrand OpenCode to StarCode",
    files: ["packages/opencode/src/cli/cmd/uninstall.ts"],
    search: /OpenCode/g,
    replace: "StarCode",
    isRegex: true,
  },

  // 28. Uninstall command - all "opencode" references (folders, paths, comments, etc.)
  {
    description: "Uninstall command - rebrand opencode to starcode",
    files: ["packages/opencode/src/cli/cmd/uninstall.ts"],
    search: /opencode/g,
    replace: "starcode",
    isRegex: true,
  },

  // 29. Uninstall command - package names opencode-ai to @buildwise-ai/starcode
  {
    description: "Uninstall command - rebrand package names",
    files: ["packages/opencode/src/cli/cmd/uninstall.ts"],
    search: /starcode-ai/g,
    replace: "@buildwise-ai/starcode",
    isRegex: true,
  },

  // 30. User-facing environment variable names in flag.ts
  {
    description: "Environment variable names - OPENCODE_ to STARCODE_",
    files: ["packages/opencode/src/flag/flag.ts"],
    search: /process\.env\["OPENCODE_/g,
    replace: 'process.env["STARCODE_',
    isRegex: true,
  },

  // 30a. Environment variable names in global/index.ts (dot notation)
  {
    description: "Environment variable names - OPENCODE_ to STARCODE_ (dot notation)",
    files: ["packages/opencode/src/global/index.ts"],
    search: /OPENCODE_/g,
    replace: "STARCODE_",
    isRegex: true,
  },

  // 30b. Environment variable names - dot notation process.env.OPENCODE_ to process.env.STARCODE_
  {
    description: "Environment variable names - process.env.OPENCODE_ to process.env.STARCODE_ (dot notation)",
    files: [
      "packages/opencode/src/config/config.ts",
      "packages/opencode/src/cli/cmd/tui/attach.ts",
      "packages/opencode/src/cli/cmd/acp.ts",
    ],
    search: /process\.env\.OPENCODE_/g,
    replace: "process.env.STARCODE_",
    isRegex: true,
  },

  // 31. Environment variable string arguments in truthy/number functions
  {
    description: "Environment variable string arguments in flag.ts helpers",
    files: ["packages/opencode/src/flag/flag.ts"],
    search: /(truthy|number)\("OPENCODE_/g,
    replace: '$1("STARCODE_',
    isRegex: true,
  },

  // 31a. Server password warning messages (hardcoded strings only, not Flag variables)
  {
    description: "Server password warning messages in web.ts and serve.ts",
    files: ["packages/opencode/src/cli/cmd/web.ts", "packages/opencode/src/cli/cmd/serve.ts"],
    search: /"(Warning: )?OPENCODE_SERVER_PASSWORD is not set; server is unsecured\."/g,
    replace: '"$1STARCODE_SERVER_PASSWORD is not set; server is unsecured."',
    isRegex: true,
  },

  // === AUTO-UPDATE SYSTEM CHANGES ===

  // 32. Replace all opencode-ai references with @buildwise-ai/starcode in installation file
  {
    description: "Replace all opencode-ai references with @buildwise-ai/starcode in installation file",
    files: ["packages/opencode/src/installation/index.ts"],
    search: /(?<!@)opencode-ai/g,
    replace: "@buildwise-ai/starcode",
    isRegex: true,
  },

  // 33. Replace fetch with npm view command for version lookup
  {
    description: "Replace fetch with npm view command for version lookup",
    files: ["packages/opencode/src/installation/index.ts"],
    search: `      return fetch(\`\${registry}/@buildwise-ai/starcode/\${channel}\`)
        .then((res) => {
          if (!res.ok) throw new Error(res.statusText)
          return res.json()
        })
        .then((data: any) => data.version)`,
    replace: `      return $$\`npm view @buildwise-ai/starcode@latest version\`
        .quiet()
        .text()
        .then((output) => output.trim())`,
  },

  // 34. Use latest for plugin installation to avoid version conflicts
  {
    description: "Use latest for plugin installation to avoid version conflicts",
    files: ["packages/opencode/src/config/config.ts"],
    search: /@opencode-ai\/plugin/g,
    replace: "@buildwise-ai/plugin",
    isRegex: true,
  },

  // 35. Make build script use environment version or fallback to script version
  {
    description: "Make build script use environment version or fallback to script version",
    files: ["packages/opencode/script/build.ts"],
    search: "OPENCODE_VERSION: `'${Script.version}'`,",
    replace: "OPENCODE_VERSION: `'${process.env[\"OPENCODE_VERSION\"] || Script.version}'`,",
  },

  // 36. Update script package name to use rebranded package for version checking
  {
    description: "Update script package name to use rebranded package for version checking",
    files: ["packages/script/src/index.ts"],
    search: 'const version = await fetch("https://registry.npmjs.org/opencode-ai/latest")',
    replace: 'const version = await fetch("https://registry.npmjs.org/@buildwise-ai/starcode/latest")',
  },

  // 37. TUI auto-update success message - toast notification (capital case)
  {
    description: "TUI auto-update success message - toast notification (capital case)",
    files: [
      "packages/opencode/src/cli/cmd/tui/app.tsx",
      "packages/opencode/src/cli/cmd/tui/component/tips.tsx",
    ],
    search: /OpenCode/g,
    replace: "StarCode",
    isRegex: true,
  },

  // 38. TUI toast messages - lowercase opencode to starcode in app.tsx
  {
    description: "TUI toast messages - lowercase opencode to starcode in app.tsx",
    files: ["packages/opencode/src/cli/cmd/tui/app.tsx"],
    search: /\bopencode\b/g,
    replace: "starcode",
    isRegex: true,
  },

  // 39. TUI terminal title - replace OC with MC
  {
    description: "TUI terminal title - replace OC with MC in app.tsx",
    files: ["packages/opencode/src/cli/cmd/tui/app.tsx"],
    search: "OC |",
    replace: "MC |",
  },

  // 40. PR command description
  {
    description: "PR command description",
    files: ["packages/opencode/src/cli/cmd/pr.ts"],
    search: 'describe: "fetch and checkout a GitHub PR branch, then run opencode"',
    replace: 'describe: "fetch and checkout a GitHub PR branch, then run starcode"',
  },

  // 41. Fix workspace dependency in web package (required for bun install)
  {
    description: "Fix workspace dependency in web package",
    files: ["packages/web/package.json"],
    search: '"opencode": "workspace:*"',
    replace: '"@buildwise-ai/starcode": "workspace:*"',
  },

  // 42. Fix import statements in web package files
  {
    description: "Fix import statements in web package files",
    files: ["packages/web/src/components/share/part.tsx", "packages/web/src/components/Share.tsx"],
    search: /from ["']opencode\//g,
    replace: 'from "@buildwise-ai/starcode/',
    isRegex: true,
  },

  // 43. [REMOVED] findBinary rewrite is no longer needed.
  // The current bin/opencode uses `names` array with direct path.join(modules, name, "bin", binary),
  // which already resolves scoped packages correctly (e.g. node_modules/@buildwise-ai/starcode-linux-x64/bin/starcode).
  // Rule 25 (base name change) is sufficient.

  // 44. Update docs URL to actual documentation
  {
    description: "Update docs URL to actual documentation",
    files: ["packages/opencode/src/cli/cmd/tui/app.tsx"],
    search: 'open("https://starcode.ai/docs").catch(() => {})',
    replace: 'open("https://pages.git.i.mercedes-benz.com/ITS-OC/issue_analyser/").catch(() => {})',
  },

  // 45. Enable telemetry in session/llm.ts and agent/agent.ts
  {
    description: "Enable telemetry in session/llm.ts and agent/agent.ts",
    files: ["packages/opencode/src/session/llm.ts", "packages/opencode/src/agent/agent.ts"],
    search: "        isEnabled: cfg.experimental?.openTelemetry,",
    replace: "        isEnabled: true,",
  },

  // 46. Enable LSP tool by default
  {
    description: "Enable LSP tool by default in flag.ts",
    files: ["packages/opencode/src/flag/flag.ts"],
    search:
      'export const OPENCODE_EXPERIMENTAL_LSP_TOOL = OPENCODE_EXPERIMENTAL || truthy("STARCODE_EXPERIMENTAL_LSP_TOOL")',
    replace:
      'export const OPENCODE_EXPERIMENTAL_LSP_TOOL = true || OPENCODE_EXPERIMENTAL || truthy("STARCODE_EXPERIMENTAL_LSP_TOOL")',
  },

  // 47. Enable models fetch disabling by default
  {
    description: "Enable models fetch disabling by default in flag.ts",
    files: ["packages/opencode/src/flag/flag.ts"],
    search: 'export const OPENCODE_DISABLE_MODELS_FETCH = truthy("STARCODE_DISABLE_MODELS_FETCH")',
    replace: 'export const OPENCODE_DISABLE_MODELS_FETCH = true || truthy("STARCODE_DISABLE_MODELS_FETCH")',
  },

  // 48. Update .git/opencode cache file paths in project.ts (covers both read and write)
  {
    description: "Update .git/opencode to .git/starcode in project.ts",
    files: ["packages/opencode/src/project/project.ts"],
    search: /git, "opencode"/g,
    replace: 'git, "starcode"',
    isRegex: true,
  },

  // 49. Update .opencode/plans permission path in agent.ts
  {
    description: "Update .opencode/plans to .starcode/plans in agent.ts",
    files: ["packages/opencode/src/agent/agent.ts"],
    search: /opencode/g,
    replace: "starcode",
    isRegex: true,
  },

  // 50. Update managed config path for macOS in config.ts
  {
    description: "Update managed config path for macOS in config.ts",
    files: ["packages/opencode/src/config/config.ts"],
    search: '"/Library/Application Support/opencode"',
    replace: '"/Library/Application Support/starcode"',
  },

  // 52. Update managed config path for Linux in config.ts
  {
    description: "Update managed config path for Linux in config.ts",
    files: ["packages/opencode/src/config/config.ts"],
    search: '"/etc/opencode"',
    replace: '"/etc/starcode"',
  },

  // 53. [REMOVED] Now handled by rule 30b (process.env.OPENCODE_ dot notation in config.ts)
  // 54. User-Agent HTTP headers with template strings - rebrand opencode to fredcode
  {
    description: "User-Agent HTTP headers with template strings - rebrand opencode to fredcode",
    files: ["packages/opencode/src/session/llm.ts", "packages/opencode/src/plugin/codex.ts"],
    search: /"User-Agent":\s*`opencode\//g,
    replace: '"User-Agent": `starcode/',
    isRegex: true,
  },

  // 55. User-Agent HTTP headers with plain strings - rebrand opencode to fredcode
  {
    description: "User-Agent HTTP headers with plain strings - rebrand opencode to fredcode",
    files: ["packages/opencode/src/tool/webfetch.ts"],
    search: '"User-Agent": "opencode"',
    replace: '"User-Agent": "starcode"',
  },

  // 56. User-Agent constant in installation/index.ts
  {
    description: "User-Agent constant in installation/index.ts",
    files: ["packages/opencode/src/installation/index.ts"],
    search: "export const USER_AGENT = `opencode/",
    replace: "export const USER_AGENT = `starcode/",
  },

  // 57. User-Agent assignment in codex.ts output.headers
  {
    description: "User-Agent assignment in codex.ts output.headers",
    files: ["packages/opencode/src/plugin/codex.ts"],
    search: 'output.headers["User-Agent"] = `opencode/',
    replace: 'output.headers["User-Agent"] = `starcode/',
  },

  // 58. [TEMP] Fix yargs wrap to null - upstream issue, remove when main opencode fixes it
  {
    description: "[TEMP] Fix yargs wrap to null in index.ts",
    files: ["packages/opencode/src/index.ts"],
    search: ".wrap(100)",
    replace: ".wrap(null)",
  },

  // 59. Exit message - change command to starcode
  {
    description: "Exit message - change command to starcode",
    files: ["packages/opencode/src/cli/cmd/tui/routes/session/index.tsx"],
    search: `        \`  \${weak("Continue")}\${UI.Style.TEXT_NORMAL_BOLD}opencode -s \${session()?.id}\${UI.Style.TEXT_NORMAL}\`,`,
    replace: `        \`  \${weak("Continue")}\${UI.Style.TEXT_NORMAL_BOLD}starcode -s \${session()?.id}\${UI.Style.TEXT_NORMAL}\`,`,
  },

  // 60. Rename opencode.db to starcode.db in database files
  {
    description: "Rename opencode.db to starcode.db in database files",
    files: ["packages/opencode/src/storage/db.ts", "packages/opencode/src/index.ts"],
    search: /opencode\.db/g,
    replace: "starcode.db",
    isRegex: true,
  },

  // 61. Rename temp file prefixes from opencode to starcode
  {
    description: "Rename temp file prefixes from opencode to starcode",
    files: ["packages/opencode/src/lsp/server.ts", "packages/opencode/src/cli/cmd/tui/util/clipboard.ts"],
    search: /opencode-(?=jdtls|clipboard)/g,
    replace: "starcode-",
    isRegex: true,
  },

  // 62. Add ~/.env file loading from home directory
  {
    description: "Add ~/.env file loading from home directory",
    files: ["packages/opencode/src/index.ts"],
    search: 'import yargs from "yargs"',
    replace: `import { readFileSync } from "fs"
import { homedir } from "os"
import { join } from "path"

// Load ~/.env into process.env before anything else
const loadedEnvVars: Array<[string, string]> = []
try {
  const envContent = readFileSync(join(homedir(), ".env"), "utf-8")
  for (const line of envContent.split("\\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1)
    process.env[key] = value
    loadedEnvVars.push([key, value])
  }
} catch {}

import yargs from "yargs"`,
  },

  // 63. Add ~/.env loading log in CLI middleware (using stable anchor point)
  {
    description: "Add ~/.env loading log in CLI middleware",
    files: ["packages/opencode/src/index.ts"],
    search: `    process.env.AGENT = "1"
    process.env.OPENCODE = "1"`,
    replace: `    process.env.AGENT = "1"
    process.env.OPENCODE = "1"

    if (loadedEnvVars.length > 0) {
      Log.Default.info("loaded env from ~/.env", {
        count: loadedEnvVars.length,
        keys: loadedEnvVars.map(([k, v]) => \`\${k}=\${v.slice(0, 3)}...\`).join(", "),
      })
    }`,
  },
]

async function applyRenameRule(rule: RenameRule) {
  console.log(`\n📝 ${rule.description}`)

  for (const filePath of rule.files) {
    const fullPath = path.resolve(filePath)

    try {
      const content = await Bun.file(fullPath).text()
      let newContent: string

      if (rule.isRegex && rule.search instanceof RegExp) {
        newContent = content.replace(rule.search, rule.replace)
      } else {
        newContent = content.replaceAll(rule.search as string, rule.replace)
      }

      if (content !== newContent) {
        console.log(`  ✅ ${filePath}`)
        if (!DRY_RUN) {
          await Bun.write(fullPath, newContent)
        }
        stats.successed++
      } else {
        console.log(`  ⏭️  ${filePath} (no changes needed)`)
      }
      stats.tried++
    } catch (error) {
      console.log(`  ❌ ${filePath} (file not found or error: ${error})`)
      stats.tried++
    }
  }
}

async function renameBinaryFiles() {
  console.log(`\n📝 Renaming binary wrapper files`)

  const filesToRename = [
    {
      from: "packages/opencode/bin/opencode",
      to: "packages/opencode/bin/starcode",
    },
  ]

  for (const { from, to } of filesToRename) {
    try {
      const fromPath = path.resolve(from)
      const toPath = path.resolve(to)

      if (await Bun.file(fromPath).exists()) {
        if (!DRY_RUN) {
          // Use filesystem rename for cross-platform behavior and permission preservation.
          if (await Bun.file(toPath).exists()) {
            await Bun.file(toPath).unlink()
          }
          await rename(fromPath, toPath)
        }
        console.log(`  ✅ ${from} → ${to}`)
        stats.successed++
      } else {
        console.log(`  ⏭️  ${from} (file not found, may already be renamed)`)
      }
      stats.tried++
    } catch (error) {
      console.log(`  ❌ Failed to rename ${from}: ${error}`)
      stats.tried++
    }
  }
}

async function validateRebrand() {
  const totalExpected = renameRules.length + 1 // +1 for binary file (opencode → starcode)
  const successRate = (stats.successed / stats.tried) * 100
  const failedOperations = stats.tried - stats.successed

  if (stats.successed !== stats.tried || successRate < 100) {
    console.log(`\n❌ Rebrand incomplete! ${stats.successed}/${stats.tried} successful (${successRate.toFixed(1)}%)`)

    if (failedOperations > 0) {
      console.log(`\n📋 Failed operations details:`)
      console.log(`   • ${failedOperations} operation(s) did not complete successfully`)
      console.log(`   • This could be due to missing files, permission issues, or search patterns not matching`)
      console.log(`   • Check the output above for ❌ or ⏭️ symbols to identify which operations failed`)
    }

    console.log("\n🔄 Reverting all changes to maintain clean state...")

    try {
      // Import and run revert script
      const { $ } = await import("bun")
      const result = await $`bun starcode-toolkit/revert.ts`.quiet()

      if (result.exitCode === 0) {
        console.log("✅ All changes successfully reverted")
      } else {
        console.log("⚠️ Revert script completed with warnings")
      }
    } catch (error) {
      console.log("❌ Failed to run revert script:", error)
    }

    console.log(`\n💡 To fix this issue:`)
    console.log(`   1. Review the failed operations marked with ❌ above`)
    console.log(`   2. Check if the target files exist and have correct content`)
    console.log(`   3. Verify that search patterns match the current code`)
    console.log(`   4. Comment out problematic rules if they're no longer applicable`)

    // Check environment variable to control pipeline behavior
    const FAIL_ON_ERROR = process.env["REBRAND_FAIL_ON_ERROR"] !== "false"

    if (FAIL_ON_ERROR) {
      console.log(`\n🚨 Exiting with error code (set REBRAND_FAIL_ON_ERROR=false to continue pipeline)`)
      process.exit(1) // Break automation pipeline
    } else {
      console.log(`\n⚠️ Continuing despite errors (REBRAND_FAIL_ON_ERROR=false)`)
      return false // Continue automation pipeline
    }
  }

  console.log("\n✅ Rebrand validation passed - 100% successful!")
}

async function main() {
  console.log("🔄 Renaming user-facing opencode references to starcode...")

  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE - No files will be modified")
  }

  for (const rule of renameRules) {
    await applyRenameRule(rule)
  }

  // Replace opencode with starcode in test directory
  console.log(`\n📝 Replacing opencode with starcode in test directory`)
  const testDirResult = await replaceInDirectory({
    directory: "packages/opencode/test",
    search: /opencode/g,
    replace: "starcode",
    extensions: [".ts", ".md", ".js"],
    exclude: [
      /opencode-anthropic-auth/g,
      /@gitlab\/opencode-gitlab-auth/g,
      /@buildwise-ai\/telemetry-plugin/g,
      /@opencode-ai/g, // Exclude package scope
      /opencode\.ai/g,
      /https:\/\/opencode\.ai/g,
      /\.well-known\/opencode/g,
    ],
    dryRun: DRY_RUN,
  })
  console.log(`  ✅ ${testDirResult.success} files updated, ${testDirResult.skipped} files unchanged`)
  stats.successed += testDirResult.success > 0 ? 1 : 0
  stats.tried += 1

  // Replace OPENCODE_ with STARCODE_ for environment variables in test directory
  console.log(`\n📝 Replacing OPENCODE_ with STARCODE_ in test directory`)
  const testEnvResult = await replaceInDirectory({
    directory: "packages/opencode/test",
    search: /OPENCODE_/g,
    replace: "STARCODE_",
    extensions: [".ts", ".md", ".js"],
    exclude: [
      /OPENCODE_CALLER/g,
      /\.well-known\/opencode/g,
      /Flag\.OPENCODE_/g,
      /Flag\s+as\s+\{[^}]*OPENCODE_/g,
      /\)\.OPENCODE_/g,
    ],
    dryRun: DRY_RUN,
  })
  console.log(`  ✅ ${testEnvResult.success} files updated, ${testEnvResult.skipped} files unchanged`)
  stats.successed += testEnvResult.success > 0 ? 1 : 0
  stats.tried += 1

  // Rename binary wrapper files
  await renameBinaryFiles()

  // Validate rebrand completion
  if (!DRY_RUN) {
    await validateRebrand()
  }

  console.log("\n✨ Visual rebranding complete!")
  console.log(`\n📊 Stats: ${stats.successed}/${stats.tried} replacements successful`)
  console.log("\n📋 Summary of USER-FACING changes:")
  console.log("   • Global config directory: ~/.config/opencode/ → ~/.config/starcode/")
  console.log("   • Install directory: ~/.opencode/bin → ~/.starcode/bin")
  console.log("   • Project folders: .opencode/ → .starcode/")
  console.log("   • Config files: opencode.json → starcode.json")
  console.log("   • Config files: opencode.jsonc → starcode.jsonc")
  console.log("   • CLI script name: opencode → starcode")
  console.log("   • ASCII logos updated to show 'STARCODE' branding")
  console.log("   • TUI status bar shows 'star' instead of 'open'")

  if (DRY_RUN) {
    console.log("\n🚀 To apply changes, run: bun starcode-toolkit/rebrand.ts")
  } else {
    console.log("\n🎯 Next steps:")
    console.log("   1. Test the changes: bun dev")
    console.log("   2. Publish packages:")
    console.log("       i.   bun starcode-toolkit/publish.ts                   # Only configuration creation")
    console.log("       ii.  bun starcode-toolkit/publish.ts --build           # Build packages")
    console.log("       iii. bun starcode-toolkit/publish.ts --publish         # Build and publish packages")
    console.log("   3. Create GitHub release:")
    console.log("       bun starcode-toolkit/create-github-release.ts          # Create release with binaries")
  }
}

// Run the script
if (import.meta.main) {
  await main()
}
