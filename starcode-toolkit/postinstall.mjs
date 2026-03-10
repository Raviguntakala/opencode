#!/usr/bin/env node

import fs from "fs"
import path from "path"
import os from "os"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

function detectPlatformAndArch() {
  // Map platform names
  let platform
  switch (os.platform()) {
    case "darwin":
      platform = "darwin"
      break
    case "linux":
      platform = "linux"
      break
    case "win32":
      platform = "windows"
      break
    default:
      platform = os.platform()
      break
  }

  // Map architecture names
  let arch
  switch (os.arch()) {
    case "x64":
      arch = "x64"
      break
    case "arm64":
      arch = "arm64"
      break
    case "arm":
      arch = "arm"
      break
    default:
      arch = os.arch()
      break
  }

  return { platform, arch }
}

// Recursive copy function for tool and skills directories
async function copyDirectoryRecursive(src, dest) {
  const stats = await fs.promises.stat(src)

  if (stats.isDirectory()) {
    await fs.promises.mkdir(dest, { recursive: true })
    const entries = await fs.promises.readdir(src)

    for (const entry of entries) {
      // Skip excluded files and directories
      if (
        entry.includes("Zone.Identifier") ||
        entry === "node_modules" ||
        entry === "__pycache__" ||
        entry.endsWith(".pyc") ||
        entry.endsWith(".log") ||
        entry === ".DS_Store"
      ) {
        continue
      }

      const srcPath = path.join(src, entry)
      const destPath = path.join(dest, entry)
      await copyDirectoryRecursive(srcPath, destPath)
    }
  } else {
    await fs.promises.copyFile(src, dest)
  }
}

function findBinary() {
  const { platform, arch } = detectPlatformAndArch()
  const packageName = `@buildwise-ai/starcode-${platform}-${arch}`
  const binaryName = platform === "windows" ? "starcode.exe" : "starcode"

  try {
    // Use require.resolve to find the package
    const packageJsonPath = require.resolve(`${packageName}/package.json`)
    const packageDir = path.dirname(packageJsonPath)
    const binaryPath = path.join(packageDir, "bin", binaryName)

    if (!fs.existsSync(binaryPath)) {
      throw new Error(`Binary not found at ${binaryPath}`)
    }

    return { binaryPath, binaryName }
  } catch (error) {
    throw new Error(`Could not find package ${packageName}: ${error.message}`)
  }
}

function prepareBinDirectory(binaryName) {
  const binDir = path.join(__dirname, "bin")
  const targetPath = path.join(binDir, binaryName)

  // Ensure bin directory exists
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true })
  }

  // Remove existing binary/symlink if it exists
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath)
  }

  return { binDir, targetPath }
}

function symlinkBinary(sourcePath, binaryName) {
  const { targetPath } = prepareBinDirectory(binaryName)

  fs.symlinkSync(sourcePath, targetPath)
  console.log(`starcode binary symlinked: ${targetPath} -> ${sourcePath}`)

  // Verify the file exists after operation
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Failed to symlink binary to ${targetPath}`)
  }
}

async function setupCustomAgentsAndCommands() {
  try {
    console.log("📦 Setting up starcode custom agents and commands...")

    const configDir = process.env.XDG_CONFIG_HOME
      ? path.join(process.env.XDG_CONFIG_HOME, "starcode")
      : path.join(os.homedir(), ".config", "starcode")

    const agentDir = path.join(configDir, "agent")
    const commandDir = path.join(configDir, "command")
    const toolDir = path.join(configDir, "tool")
    const skillsDir = path.join(configDir, "skill")

    await fs.promises.mkdir(agentDir, { recursive: true })
    await fs.promises.mkdir(commandDir, { recursive: true })
    await fs.promises.mkdir(toolDir, { recursive: true })
    await fs.promises.mkdir(skillsDir, { recursive: true })

    const packageRootDir = __dirname
    const sourceAgentDir = path.join(packageRootDir, "agent")
    const sourceCommandDir = path.join(packageRootDir, "command")
    const sourceToolDir = path.join(packageRootDir, "tool")
    const sourceSkillsDir = path.join(packageRootDir, "skill")

    // Reusable function to copy config files
    async function copyConfigFile(filename, options = {}) {
      const { overwrite = true, label = filename } = options
      const sourcePath = path.join(packageRootDir, filename)
      const destPath = path.join(configDir, filename)

      if (fs.existsSync(sourcePath)) {
        if (!overwrite && fs.existsSync(destPath)) {
          console.log(`⏭️  ${label} already exists (keeping user config)`)
          return
        }
        await fs.promises.copyFile(sourcePath, destPath)
        console.log(`✅ Installed ${label}`)
      }
    }

    // Copy config files (schema always overwrites, starcode.json and tui.json preserve user config)
    await copyConfigFile("schema.json", { overwrite: true })
    await copyConfigFile("starcode.json", { overwrite: false })
    await copyConfigFile("tui.json", { overwrite: true })

    console.log(`Looking for agents in: ${sourceAgentDir}`)
    console.log(`Looking for commands in: ${sourceCommandDir}`)

    if (fs.existsSync(sourceAgentDir)) {
      const agentFiles = await fs.promises.readdir(sourceAgentDir)
      for (const file of agentFiles) {
        if (file.endsWith(".md") && !file.includes("Zone.Identifier")) {
          const sourcePath = path.join(sourceAgentDir, file)
          const destPath = path.join(agentDir, file)
          await fs.promises.copyFile(sourcePath, destPath)
          console.log(`✅ Installed agent: ${file}`)
        }
      }
    }

    if (fs.existsSync(sourceCommandDir)) {
      const commandFiles = await fs.promises.readdir(sourceCommandDir)
      for (const file of commandFiles) {
        if (file.endsWith(".md") && !file.includes("Zone.Identifier")) {
          const sourcePath = path.join(sourceCommandDir, file)
          const destPath = path.join(commandDir, file)
          await fs.promises.copyFile(sourcePath, destPath)
          console.log(`✅ Installed command: ${file}`)
        }
      }
    }

    // Copy tool files (recursive for complex structures)
    console.log(`Looking for tools in: ${sourceToolDir}`)
    if (fs.existsSync(sourceToolDir)) {
      await copyDirectoryRecursive(sourceToolDir, toolDir)
      console.log("✅ Installed tool files with complete directory structure")
    }

    // Copy skills (recursive for complex structures)
    console.log(`Looking for skills in: ${sourceSkillsDir}`)
    if (fs.existsSync(sourceSkillsDir)) {
      await copyDirectoryRecursive(sourceSkillsDir, skillsDir)
      console.log("✅ Installed skills with complete directory structure")
    }

    console.log(`🎉 Custom agents, commands, tools, and skills installed to ${configDir}`)
  } catch (error) {
    console.warn("⚠️ Could not install custom agents/commands:", error.message)
  }
}

async function main() {
  try {
    if (os.platform() === "win32") {
      // On Windows, the .exe is already included in the package and bin field points to it
      // No postinstall setup needed
      console.log("Windows detected: binary setup not needed (using packaged .exe)")
      await setupCustomAgentsAndCommands()
      return
    }

    // On non-Windows platforms, cache the binary for faster startup
    // The bin/starcode wrapper checks for bin/.starcode first
    const { binaryPath } = findBinary()
    const target = path.join(__dirname, "bin", ".starcode")
    if (fs.existsSync(target)) fs.unlinkSync(target)
    try {
      fs.linkSync(binaryPath, target)
    } catch {
      fs.copyFileSync(binaryPath, target)
    }
    fs.chmodSync(target, 0o755)
    console.log(`starcode binary cached: ${target}`)
    
    await setupCustomAgentsAndCommands()
  } catch (error) {
    console.error("Failed to setup starcode binary:", error.message)
    process.exit(1)
  }
}

try {
  main()
} catch (error) {
  console.error("Postinstall script error:", error.message)
  process.exit(0)
}
