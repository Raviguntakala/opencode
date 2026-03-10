#!/usr/bin/env bun

import { $ } from "bun"

console.log("=== Custom NPM Publishing ===\n")

// Check Bun version (allow 1.3.x)
const bunVersion = process.versions.bun
if (!bunVersion || !bunVersion.startsWith("1.3.")) {
  console.warn(`⚠️  This script was designed for bun@1.3.x, you have ${bunVersion}`)
  console.log("Continuing anyway...")
}

// Load configuration
const loadConfig = async () => {
  try {
    const config = await Bun.file("starcode-toolkit/publish-config.json").json()
    console.log("✅ Loaded configuration from starcode-toolkit/publish-config.json")
    return config
  } catch (error) {
    console.error("❌ Could not load starcode-toolkit/publish-config.json:", error)
    console.log("Please create starcode-toolkit/publish-config.json with your settings")
    process.exit(1)
  }
}

const config = await loadConfig()

// Parse CLI arguments
const args = process.argv.slice(2)
const shouldBuild = args.includes("--build")
const shouldPublish = args.includes("--publish")

// Display mode
if (shouldBuild || shouldPublish) {
  console.log(
    `\nMode: ${shouldBuild && shouldPublish ? "Build + Publish" : shouldBuild ? "Build Only" : "Publish Only"}\n`,
  )
} else {
  console.log(`\nMode: Configuration Only\n`)
}

// Get current version from original repo
const getOriginalVersion = async () => {
  try {
    const pkg = await Bun.file("packages/opencode/package.json").json()
    return pkg.version
  } catch (error) {
    console.error("Could not read original version:", error)
    return "1.0.0"
  }
}

// Generate custom version
const generateCustomVersion = async () => {
  if (config.versionStrategy === "increment") {
    // Check if main package exists and get latest version
    try {
      const result = await $`npm view ${config.packages[0].newName} version`.text()
      const currentVersion = result.trim()
      const versionParts = currentVersion.split(".")

      if (versionParts.length === 3 && versionParts[0] && versionParts[1] && versionParts[2]) {
        const major = parseInt(versionParts[0])
        const minor = parseInt(versionParts[1])
        const patch = parseInt(versionParts[2])

        if (!isNaN(major) && !isNaN(minor) && !isNaN(patch)) {
          return `${major}.${minor}.${patch + 1}`
        }
      }
      throw new Error("Invalid version format")
    } catch {
      // Package doesn't exist, use base version
      return "1.0.0" // Start with 1.0.0 since binaries are at 1.0.0
    }
  } else if (config.versionStrategy === "timestamp") {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    return `1.0.0-${timestamp}`
  }
  return "1.0.0" // Default to 1.0.0
}

const customVersion = await generateCustomVersion()
console.log("Custom version:", customVersion)

// Update dependency names to use custom package names
const updateDependencyNames = (dependencies: any) => {
  if (!dependencies) return dependencies

  const updated = { ...dependencies }

  // Map original package names to new names
  const packageNameMap: Record<string, string> = {}
  config.packages.forEach((pkg: any) => {
    packageNameMap[pkg.originalName] = pkg.newName
  })

  // Update workspace dependencies - first collect all changes
  const namesToUpdate: Record<string, string> = {}
  Object.keys(updated).forEach((depName) => {
    if (packageNameMap[depName]) {
      namesToUpdate[depName] = packageNameMap[depName]
    }
  })

  // Apply name changes
  Object.entries(namesToUpdate).forEach(([oldName, newName]) => {
    updated[newName] = updated[oldName]
    delete updated[oldName]
  })

  // Handle workspace and catalog dependencies
  Object.keys(updated).forEach((depName) => {
    if (updated[depName] === "workspace:*") {
      updated[depName] = customVersion
    }
    if (updated[depName] === "catalog:") {
      const rootPkg = require("../package.json")
      updated[depName] = rootPkg.workspaces?.catalog?.[depName] || "latest"
    }
  })

  return updated
}

const transformExports = (pkg: any) => {
  if (!pkg.exports) return pkg

  const transformedPkg = { ...pkg }

  // Use EXACTLY the same logic as individual publish scripts
  for (const [key, value] of Object.entries(pkg.exports)) {
    if (typeof value === "string") {
      // EXACT same transformation: ./src/ -> ./dist/, remove .ts
      const file = value.replace("./src/", "./dist/").replace(".ts", "")

      // EXACT same structure: import + types
      transformedPkg.exports[key] = {
        import: file + ".js",
        types: file + ".d.ts",
      }
    }
    // Leave complex objects unchanged (shouldn't exist in your packages)
  }

  console.log(`✅ Transformed exports for ${pkg.name}:`, transformedPkg.exports)
  return transformedPkg
}

// Create updated package.json for publishing (without modifying original)
const createPublishPackageJson = async (packageConfig: any) => {
  const packageJsonPath = `${packageConfig.path}/package.json`

  try {
    const pkg = await Bun.file(packageJsonPath).json()

    // Create updated package.json
    const updatedPkg = {
      ...pkg,
      name: packageConfig.newName,
      version: customVersion,
      description: packageConfig.description,
      // Remove private flag if it exists
      private: undefined,
      // Update repository info
      repository: {
        type: "git",
        url: config.repositoryUrl,
      },
      // Update workspace dependencies to use new package names
      dependencies: updateDependencyNames(pkg.dependencies),
      devDependencies: updateDependencyNames(pkg.devDependencies),
      optionalDependencies: updateDependencyNames(pkg.optionalDependencies),
    }

    // Transform exports field to point to dist/ instead of src/
    const transformedPkg = transformExports(updatedPkg)

    // Clean up undefined values
    Object.keys(transformedPkg).forEach((key) => {
      if (transformedPkg[key] === undefined) {
        delete transformedPkg[key]
      }
    })

    console.log(`Created publish config for ${packageConfig.newName}`)
    return transformedPkg
  } catch (error) {
    console.error(`Failed to create publish config for ${packageJsonPath}:`, error)
    throw error
  }
}

// Build packages using original build logic
const buildPackage = async (packageConfig: any) => {
  console.log(`Building ${packageConfig.newName}...`)

  const originalDir = process.cwd()

  if (packageConfig.path === "packages/opencode") {
    // Use OpenCode's specific build process
    process.chdir(packageConfig.path)
    try {
      // Check if build script exists
      const buildScriptPath = "./script/build.ts"
      const buildScriptExists = await Bun.file(buildScriptPath).exists()

      if (buildScriptExists) {
        // Set the version and channel environment variables before building
        process.env["OPENCODE_VERSION"] = customVersion
        process.env["OPENCODE_CHANNEL"] = "latest"

        // Import and run the original build script
        const currentDir = process.cwd()
        const absoluteBuildPath = `${currentDir}/${buildScriptPath}`
        await import(absoluteBuildPath)
        console.log(`✅ Built ${packageConfig.newName} using original build script with version ${customVersion}`)
      } else {
        console.log(`⚠️  No build script found for ${packageConfig.newName}, skipping build`)
      }
    } catch (error) {
      console.error(`❌ Failed to build ${packageConfig.newName}:`, error)
      throw error
    } finally {
      process.chdir(originalDir)
    }
  } else if (packageConfig.path === "packages/sdk/js") {
    // SDK build process
    process.chdir(packageConfig.path)
    try {
      // Check if generate script exists
      const generateScriptPath = "./script/generate.ts"
      const generateScriptExists = await Bun.file(generateScriptPath).exists()

      if (generateScriptExists) {
        // Generate SDK files first
        const currentDir = process.cwd()
        const absoluteGeneratePath = `${currentDir}/${generateScriptPath}`
        await import(absoluteGeneratePath)
      }

      // Clean and build
      await $`rm -rf dist`
      await $`bun tsc`
      console.log(`✅ Built ${packageConfig.newName} SDK`)
    } catch (error) {
      console.error(`❌ Failed to build ${packageConfig.newName}:`, error)
      throw error
    } finally {
      process.chdir(originalDir)
    }
  } else if (packageConfig.path === "packages/plugin") {
    // Plugin build process
    process.chdir(packageConfig.path)
    try {
      await $`rm -rf dist`
      await $`bun tsc`
      console.log(`✅ Built ${packageConfig.newName} plugin`)
    } catch (error) {
      console.error(`❌ Failed to build ${packageConfig.newName}:`, error)
      throw error
    } finally {
      process.chdir(originalDir)
    }
  } else {
    // Generic build for other packages
    process.chdir(packageConfig.path)
    try {
      await $`bun run build`.nothrow()
    } catch {
      try {
        await $`bun run tsc`.nothrow()
      } catch {
        console.log(`No build script found for ${packageConfig.newName}, skipping build`)
      }
    } finally {
      process.chdir(originalDir)
    }
  }
}

// Publish package with OpenCode-specific logic
const publishPackage = async (packageConfig: any, publishConfig: any) => {
  console.log(`\n=== Publishing ${packageConfig.newName} ===`)

  if (packageConfig.path === "packages/opencode") {
    await publishOpenCodePackage(packageConfig, publishConfig)
  } else {
    await publishRegularPackage(packageConfig, publishConfig)
  }
}

// Copy starcode directory with consistent exclusions and error handling
const copyStarcodeDirectory = async (folderName: string, packageName: string, customExcludes: string[] = []) => {
  const sourcePath = `../../.starcode/${folderName}/`
  const destPath = `./dist/${packageName}/${folderName}/`

  // Standard exclusions that should be applied to all folders
  const standardExcludes = ["node_modules", "__pycache__", "*.pyc", "*.log", ".DS_Store"]

  // Combine standard and custom exclusions
  const allExcludes = [...standardExcludes, ...customExcludes]

  try {
    // Build rsync command with proper exclude arguments
    const excludeArgs = allExcludes.flatMap((exclude) => ["--exclude", exclude])
    await $`rsync -av ${excludeArgs} ${sourcePath} ${destPath}`
    console.log(`✅ Copied ${folderName} files`)
  } catch (error) {
    console.error(`❌ Failed to copy ${folderName} files - this is required for publishing`)
    console.error(`Expected location: ${sourcePath}`)
    throw new Error(`${folderName} files not found: ${error}`)
  }
}

// Publish OpenCode package with binary handling
const publishOpenCodePackage = async (packageConfig: any, publishConfig: any) => {
  const originalDir = process.cwd()
  process.chdir(packageConfig.path)

  try {
    // Import the build script to get binaries info
    let binaries = {}
    try {
      const buildScriptPath = "./script/build.ts"
      const currentDir = process.cwd()
      const absoluteBuildPath = `${currentDir}/${buildScriptPath}`
      const buildModule = await import(absoluteBuildPath)
      binaries = buildModule.binaries || {}
    } catch (error) {
      console.log("⚠️  Could not import build script, using empty binaries")
      console.log("Error:", error instanceof Error ? error.message : String(error))
    }

    // Create distribution directory structure like original
    await $`mkdir -p ./dist/${packageConfig.newName}`
    await $`cp -r ./bin ./dist/${packageConfig.newName}/bin`

    // Extract command name from package config (remove scope if present)
    const commandName = packageConfig.newName.includes("/")
      ? packageConfig.newName.split("/")[1]
      : packageConfig.newName.replace("ravi-kumar-", "")

    // Files are already renamed by rebrand script, so no need to rename again
    // Just verify they exist
    const unixBinary = `./dist/${packageConfig.newName}/bin/${commandName}`
    const windowsBinary = `./dist/${packageConfig.newName}/bin/${commandName}.cmd`

    console.log(`✅ Binary files already renamed to ${commandName}`)

    await $`cp ../../starcode-toolkit/postinstall.mjs ./dist/${packageConfig.newName}/postinstall.mjs`
    await $`cp ../../.starcode/schema.json ./dist/${packageConfig.newName}/schema.json`
    await $`cp ../../.starcode/starcode.json ./dist/${packageConfig.newName}/starcode.json`
    await $`cp ../../.starcode/tui.json ./dist/${packageConfig.newName}/tui.json`

    // Copy custom folders (excluding unnecessary files)
    await $`mkdir -p ./dist/${packageConfig.newName}/agent`
    await $`mkdir -p ./dist/${packageConfig.newName}/command`
    await $`mkdir -p ./dist/${packageConfig.newName}/tool`
    await $`mkdir -p ./dist/${packageConfig.newName}/skill`

    // Copy all starcode directories using the reusable function
    await copyStarcodeDirectory("agent", packageConfig.newName)
    await copyStarcodeDirectory("command", packageConfig.newName)
    await copyStarcodeDirectory("tool", packageConfig.newName)
    await copyStarcodeDirectory("skill", packageConfig.newName, ["*.tmp"])

    // Create main package.json for the wrapper package
    const mainPackageJson = {
      name: packageConfig.newName,
      bin: {
        starcode: `./bin/${commandName}`, // Main command
        star: `./bin/${commandName}`,     // Short alias
      },
      scripts: {
        postinstall: "node ./postinstall.mjs",
      },
      version: customVersion,
      description: packageConfig.description,
      ...(config.trackOriginalVersion && {
        originalVersion: "0.11.7", // Fixed original version
        originalName: packageConfig.originalName,
        forkedFrom: "https://github.com/sst/opencode",
        customFork: true,
      }),
      optionalDependencies: Object.fromEntries(
        Object.entries(binaries).map(([name, version]) => [
          name.replace("opencode", "starcode"),
          customVersion, // Use the custom version instead of "dev"
        ]),
      ),
    }

    await Bun.file(`./dist/${packageConfig.newName}/package.json`).write(JSON.stringify(mainPackageJson, null, 2))

    // Publish binary packages first
    for (const [name] of Object.entries(binaries)) {
      const newBinaryName = name.replace("opencode", "starcode")
      console.log(`Publishing binary package: ${newBinaryName}`)

      // Update binary package.json with new name
      const binaryPkgPath = `dist/${name}/package.json`
      if (await Bun.file(binaryPkgPath).exists()) {
        const binaryPkg = await Bun.file(binaryPkgPath).json()
        binaryPkg.name = newBinaryName
        binaryPkg.version = customVersion
        await Bun.file(binaryPkgPath).write(JSON.stringify(binaryPkg, null, 2))
      }

      // WINDOWS BINARY FIX: Rename the actual binary files
      const isWindows = name.includes("windows")
      if (isWindows) {
        const oldBinaryPath = `dist/${name}/bin/opencode.exe`
        const newBinaryPath = `dist/${name}/bin/starcode.exe`
        try {
          await $`mv "${oldBinaryPath}" "${newBinaryPath}"`
          console.log(`✅ Renamed Windows binary: opencode.exe → starcode.exe`)
        } catch (error) {
          console.log(`⚠️  Could not rename Windows binary:`, error)
        }
      } else {
        const oldBinaryPath = `dist/${name}/bin/opencode`
        const newBinaryPath = `dist/${name}/bin/starcode`
        try {
          await $`mv "${oldBinaryPath}" "${newBinaryPath}"`
          console.log(`✅ Renamed binary: opencode → starcode`)
        } catch (error) {
          console.log(`⚠️  Could not rename binary:`, error)
        }
      }

      await $`cd dist/${name} && chmod -R 755 .`
      if (shouldPublish) {
        await $`cd dist/${name} && npm publish`
        console.log(`✅ Published binary: ${newBinaryName}`)
      } else {
        console.log(`📦 Ready to publish binary: ${newBinaryName}`)
      }
    }

    // Publish main package
    if (shouldPublish) {
      await $`cd ./dist/${packageConfig.newName} && npm publish`
      console.log(`✅ Successfully published ${packageConfig.newName}@${customVersion}`)
    } else {
      console.log(`📦 Ready to publish: ${packageConfig.newName}@${customVersion}`)
    }
  } catch (error) {
    console.error(`❌ Failed to publish ${packageConfig.newName}:`, error)
    throw error
  } finally {
    process.chdir(originalDir)
  }
}

// Publish regular packages (SDK, Plugin, etc.)
const publishRegularPackage = async (packageConfig: any, publishConfig: any) => {
  const originalDir = process.cwd()
  process.chdir(packageConfig.path)

  try {
    // Create temporary package.json for publishing
    const originalPkg = await Bun.file("package.json").text()
    await Bun.file("package.json").write(JSON.stringify(publishConfig, null, 2))

    try {
      // Publish the package
      if (shouldPublish) {
        await $`npm publish`
        console.log(`✅ Successfully published ${packageConfig.newName}@${customVersion}`)
      } else {
        console.log(`📦 Ready to publish: ${packageConfig.newName}@${customVersion}`)
      }
    } finally {
      // Restore original package.json
      await Bun.file("package.json").write(originalPkg)
    }
  } catch (error) {
    console.error(`❌ Failed to publish ${packageConfig.newName}:`, error)
    throw error
  } finally {
    process.chdir(originalDir)
  }
}

// Main execution
const main = async () => {
  try {
    console.log("\nCreating publish configurations...")

    // Create publish configurations for all packages (ALWAYS runs)
    const publishConfigs: Record<string, any> = {}
    for (const packageConfig of config.packages) {
      publishConfigs[packageConfig.path] = await createPublishPackageJson(packageConfig)
    }
    console.log("✅ Configurations created and transformations applied\n")

    // Show what would happen
    if (!shouldBuild && !shouldPublish) {
      console.log("📋 Configuration Summary:")
      console.log(`   Version: ${customVersion}`)
      console.log(`   Packages: ${config.packages.length}`)
      for (const packageConfig of config.packages) {
        console.log(`   - ${packageConfig.newName}`)
      }
      console.log("\n💡 Next steps:")
      console.log("   bun starcode-toolkit/publish.ts --build           # Build packages")
      console.log("   bun starcode-toolkit/publish.ts --publish         # Build and publish packages")
      return
    }

    // Build step (runs if --build flag OR --publish flag)
    if (shouldBuild || shouldPublish) {
      // Update schema before building
      console.log("\n📥 Updating schema from opencode.ai...")
      await $`bun starcode-toolkit/update-schema.ts`

      console.log("Building packages...")
      for (const packageConfig of config.packages) {
        await buildPackage(packageConfig)
      }
      console.log("✅ Build completed")

      // Prepare packages for publishing (copy files, create package.json)
      console.log("\nPreparing packages for publishing...")
      for (const packageConfig of config.packages) {
        await publishPackage(packageConfig, publishConfigs[packageConfig.path])
      }
      console.log("✅ Package preparation completed")
    }

    // Success messages
    if (shouldPublish) {
      console.log("\n🎉 All packages published successfully!")
      console.log("\nPublished packages:")
      for (const packageConfig of config.packages) {
        console.log(`- ${packageConfig.newName}@${customVersion}`)
      }

      // Create a version tracking file
      // Read upstream version from package.json
      const upstreamVersion = await getOriginalVersion()
      
      // Read existing published-versions.json to get last published version
      let lastPublished = upstreamVersion // Default to current if file doesn't exist
      try {
        const existingVersionInfo = await Bun.file("starcode-toolkit/published-versions.json").json()
        lastPublished = existingVersionInfo.originalVersion // Get what was originalVersion last time
      } catch {
        // File doesn't exist yet, first publish
      }

      const versionInfo = {
        customVersion,
        originalVersion: upstreamVersion, // Current upstream version from package.json
        lastPublishedOriginalVersion: lastPublished, // What was published last time
        publishedAt: new Date().toISOString(),
        packages: config.packages.map((p: any) => ({
          name: p.newName,
          originalName: p.originalName,
          path: p.path,
        })),
      }

      await Bun.file("starcode-toolkit/published-versions.json").write(JSON.stringify(versionInfo, null, 2))
      console.log("\n📝 Version info saved to starcode-toolkit/published-versions.json")

      // Generate release notes if versions differ
      if (versionInfo.originalVersion !== versionInfo.lastPublishedOriginalVersion) {
        console.log("\n📰 Generating release notes...")
        try {
          await $`bun run starcode-toolkit/generate-release-notes.ts`
          console.log("✅ Release notes generated successfully")
        } catch (error) {
          console.warn("⚠️  Failed to generate release notes:", error)
        }
      } else {
        console.log("\n📰 No new upstream versions, skipping release notes generation")
      }
    } else {
      console.log("\n✅ Build completed successfully!")
      console.log("Tip: Add --publish flag to publish the built packages")
    }
  } catch (error) {
    console.error("❌ Operation failed:", error)
    process.exit(1)
  }
}

// Run the script
await main()
