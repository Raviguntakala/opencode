#!/usr/bin/env bun
/**
 * Simple GitHub Release Creator
 * Creates a GitHub release with built distribution files after npm publish
 * This is a backup option for users who cannot download from npm
 */

import { $ } from "bun"
import { spawnSync } from "child_process"

console.log("=== GitHub Release Creator ===\n")

// Load configuration
const loadConfig = async () => {
  try {
    const config = await Bun.file("starcode-toolkit/publish-config.json").json()
    console.log("✅ Loaded configuration from starcode-toolkit/publish-config.json")
    return config
  } catch (error) {
    console.error("❌ Could not load starcode-toolkit/publish-config.json:", error)
    process.exit(1)
  }
}

// Load published version info
const loadPublishedVersion = async () => {
  try {
    const versionInfo = await Bun.file("starcode-toolkit/published-versions.json").json()
    console.log("✅ Loaded version info from published-versions.json")
    return versionInfo
  } catch (error) {
    console.error("❌ Could not load published-versions.json. Did you run publish script first?")
    process.exit(1)
  }
}

// Get repository URL from git remote origin
const getRepoUrl = async () => {
  try {
    const remoteUrl = await $`git config --get remote.origin.url`.quiet().text()
    const url = remoteUrl.trim()

    // Convert SSH URL to HTTPS URL for display
    // git@git.i.mercedes-benz.com:ITS-OC/rof-step-starcode.git
    // -> https://git.i.mercedes-benz.com/ITS-OC/rof-step-starcode
    if (url.startsWith("git@")) {
      const match = url.match(/git@([^:]+):(.+?)(\.git)?$/)
      if (match) {
        return `https://${match[1]}/${match[2]}`
      }
    }

    // Already HTTPS, just remove .git suffix
    return url.replace(/\.git$/, "")
  } catch (error) {
    console.warn("⚠️  Could not get git remote URL, using default")
    return "https://github.com/buildwise-ai/starcode"
  }
}

const config = await loadConfig()
const versionInfo = await loadPublishedVersion()
const repoUrl = await getRepoUrl()

const version = versionInfo.customVersion
const tagName = `v${version}`

console.log(`\n📦 Creating GitHub release for version ${version}`)
console.log(`   Tag: ${tagName}`)
console.log(`   Repository: ${repoUrl}`)

// Parse CLI arguments
const args = process.argv.slice(2)
const isDryRun = args.includes("--dry-run")

if (isDryRun) {
  console.log("\n🔍 DRY RUN MODE - No actual release will be created\n")
}

// Check if gh CLI is installed
const checkGhCli = async () => {
  try {
    await $`gh --version`.quiet()
    console.log("✅ GitHub CLI (gh) is installed")
    return true
  } catch {
    console.error("❌ GitHub CLI (gh) is not installed")
    console.error("Install it from: https://cli.github.com/")
    return false
  }
}

// Create release notes
const generateReleaseNotes = async (versionInfo: any) => {
  const date = new Date(versionInfo.publishedAt).toLocaleDateString()

  // Try to read from RELEASE_NOTES.md
  let releaseNotesContent = ""
  try {
    const fullNotes = await Bun.file("starcode-toolkit/RELEASE_NOTES.md").text()
    
    // Extract only the latest release notes (first release after header)
    const lines = fullNotes.split("\n")
    let capturing = false
    const capturedLines: string[] = []
    
    for (const line of lines) {
      if (line.startsWith("## v") && !capturing) {
        // Start capturing, but skip the version line itself
        capturing = true
        continue
      } else if (line.trim().startsWith("*Released on") && capturing) {
        // Skip the release date line
        continue
      } else if (line.trim() === "---" && capturing) {
        // Stop at separator
        break
      } else if (capturing) {
        capturedLines.push(line)
      }
    }
    
    if (capturedLines.length > 0) {
      releaseNotesContent = capturedLines.join("\n").trim()
    }
  } catch {
    console.log("   No RELEASE_NOTES.md found, using default notes")
  }

  let notes = `📅 Published: ${date}\n\n`

  if (releaseNotesContent) {
    notes += releaseNotesContent + "\n\n"
  }

  notes += `## 📦 Published Packages\n\n`
  for (const pkg of versionInfo.packages) {
    notes += `- **${pkg.name}**\n`
  }

  notes += `\n## 📦 Distribution Files\n\n`
  notes += `Pre-built binaries are attached to this release.\n`

  return notes
}

// Create archives for GitHub release (tar.gz for Linux, zip for others)
const createArchives = async (dryRun: boolean = false) => {
  const archives: string[] = []
  const distBasePath = "packages/opencode/dist/@buildwise-ai"

  console.log("📦 Creating archives from binaries...")

  try {
    const { readdirSync, existsSync, statSync } = await import("fs")

    try {
      const distDirs = readdirSync(distBasePath)

      for (const dir of distDirs) {
        // Skip if it's a file (like .tar.gz or .zip files)
        if (dir.includes(".")) continue

        if (dir.startsWith("starcode-")) {
          const binPath = `${distBasePath}/${dir}/bin`

          // Check if bin directory exists
          if (!existsSync(binPath) || !statSync(binPath).isDirectory()) {
            console.log(`   Skipping ${dir} - no bin directory`)
            continue
          }

          // Strip scope from archive name: @buildwise-ai/starcode-linux-x64 -> starcode-linux-x64
          // This makes it easier to use in install scripts and curl commands
          const cleanName = dir // Already just "starcode-linux-x64" from directory name

          // Linux gets .tar.gz, others get .zip
          if (dir.includes("linux")) {
            const archiveName = `${cleanName}.tar.gz`
            const archivePath = `${distBasePath}/${archiveName}`

            if (!dryRun) {
              console.log(`   Creating ${archiveName}...`)
              await $`tar -czf ../../${archiveName} *`.cwd(binPath)
            } else {
              console.log(`   Would create ${archiveName}`)
            }

            archives.push(archivePath)
          } else {
            const archiveName = `${cleanName}.zip`
            const archivePath = `${distBasePath}/${archiveName}`

            if (!dryRun) {
              console.log(`   Creating ${archiveName}...`)
              await $`zip -r ../../${archiveName} *`.cwd(binPath)
            } else {
              console.log(`   Would create ${archiveName}`)
            }

            archives.push(archivePath)
          }
        }
      }
    } catch (dirError) {
      console.log(`   No distribution directory found at ${distBasePath}`)
    }
  } catch (error) {
    console.warn("⚠️  Error creating archives:", error)
  }

  return archives
}

// Collect distribution files to upload
const collectDistFiles = async (dryRun: boolean = false) => {
  const files: string[] = []

  // Create archives from binaries
  const archives = await createArchives(dryRun)
  files.push(...archives)

  if (files.length > 0) {
    console.log(`✅ ${dryRun ? "Would create" : "Created"} ${files.length} archive(s)`)
  }

  return files
}

// Create the GitHub release
const createRelease = async () => {
  if (!(await checkGhCli())) {
    return false
  }

  console.log("\n🔨 Generating release notes...")
  const releaseNotes = await generateReleaseNotes(versionInfo)

  // Save release notes to temp file
  const notesFile = "starcode-toolkit/.github-release-notes.md"
  await Bun.file(notesFile).write(releaseNotes)
  console.log("✅ Release notes generated")

  console.log("\n📦 Collecting distribution files...")
  const distFiles = await collectDistFiles(isDryRun)

  if (distFiles.length === 0) {
    console.log("⚠️  No distribution files found")
    console.log("   This is OK - release will be created without attachments")
  } else {
    console.log(`✅ Found ${distFiles.length} distribution file(s)`)
  }

  if (isDryRun) {
    console.log("\n🔍 DRY RUN - Would create release with:")
    console.log(`   Tag: ${tagName}`)
    console.log(`   Title: ${tagName}`)
    console.log(`   Notes file: ${notesFile}`)
    console.log(`   Distribution files: ${distFiles.length}`)
    for (const file of distFiles) {
      console.log(`   - ${file}`)
    }
    return true
  }

  try {
    console.log("\n🚀 Creating GitHub release...")

    // Check if release already exists and delete it
    try {
      await $`gh release view ${tagName}`.quiet()
      console.log(`   Release ${tagName} already exists, deleting it...`)
      await $`gh release delete ${tagName} -y`.quiet()
    } catch {
      // Release doesn't exist, which is fine
    }

    // Check if tag exists locally
    const tagExists = await $`git tag -l ${tagName}`.quiet().text()

    if (tagExists.trim()) {
      console.log(`   Tag ${tagName} exists locally, deleting it...`)
      await $`git tag -d ${tagName}`.quiet()
    }

    // Check if tag exists remotely and delete it
    try {
      const remoteTag = await $`git ls-remote --tags origin refs/tags/${tagName}`.quiet().text()
      if (remoteTag.trim()) {
        console.log(`   Tag ${tagName} exists remotely, pushing it...`)
        await $`git push --no-verify origin :refs/tags/${tagName}`.quiet()
      }
    } catch {
      // Error checking remote tags, which is fine
    }

    // Create the release (gh will create the tag)
    // Use spawnSync with args array to bypass shell interpretation
    // (execSync passes through shell which treats @ in paths as glob characters)
    const ghArgs = [
      "release",
      "create",
      tagName,
      "--title",
      tagName,
      "--notes-file",
      notesFile,
      ...distFiles,
    ]
    spawnSync("gh", ghArgs, { stdio: "inherit" })

    console.log("\n✅ GitHub release created successfully!")
    console.log(`   View at: ${repoUrl}/releases/tag/${tagName}`)

    // Cleanup temp file
    await $`rm -f ${notesFile}`.quiet()

    return true
  } catch (error) {
    console.error("\n❌ Failed to create GitHub release:", error)
    return false
  }
}

// Main execution
const main = async () => {
  try {
    const success = await createRelease()

    if (success) {
      console.log("\n🎉 Done!")
      console.log("\n💡 Tip: Users can now download from:")
      console.log(`   - npm: npm install -g ${versionInfo.packages[0].name}`)
      console.log(`   - GitHub releases (backup): ${repoUrl}/releases`)
    } else {
      process.exit(1)
    }
  } catch (error) {
    console.error("\n❌ Failed:", error)
    process.exit(1)
  }
}

await main()
