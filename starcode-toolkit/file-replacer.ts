import path from "path"

interface ReplaceFileOptions {
  source: string
  destination: string
  backup?: string | null
  dryRun?: boolean
}

interface ReplaceResult {
  success: boolean
  message: string
}

/**
 * Replace a file with content from another file
 * @param options - Configuration for file replacement
 * @param options.source - Source file path to copy from
 * @param options.destination - Destination file path to replace
 * @param options.backup - Optional backup file path. If provided, backs up destination before replacing
 * @param options.dryRun - If true, simulates the operation without making changes
 * @returns Result object with success status and message
 */
export async function replaceFile(options: ReplaceFileOptions): Promise<ReplaceResult> {
  const { source, destination, backup = null, dryRun = false } = options

  const sourcePath = path.resolve(source)
  const destPath = path.resolve(destination)
  const backupPath = backup ? path.resolve(backup) : null

  try {
    // Check if source file exists
    if (!(await Bun.file(sourcePath).exists())) {
      return {
        success: false,
        message: `Source file not found: ${source}`,
      }
    }

    // Check if destination file exists
    if (!(await Bun.file(destPath).exists())) {
      return {
        success: false,
        message: `Destination file not found: ${destination}`,
      }
    }

    if (!dryRun) {
      // Create backup if specified and doesn't exist
      if (backupPath && !(await Bun.file(backupPath).exists())) {
        const backupDir = path.dirname(backupPath)
        await Bun.spawn(["mkdir", "-p", backupDir]).exited
        const destContent = await Bun.file(destPath).text()
        await Bun.write(backupPath, destContent)
      }

      // Replace destination with source content
      const sourceContent = await Bun.file(sourcePath).text()
      await Bun.write(destPath, sourceContent)
    }

    return {
      success: true,
      message: backup
        ? `${destination} replaced with ${source} (backup: ${backup})`
        : `${destination} replaced with ${source}`,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to replace ${destination}: ${error}`,
    }
  }
}

/**
 * Replace multiple files in batch
 * @param replacements - Array of file replacement configurations
 * @param dryRun - If true, simulates all operations without making changes
 * @returns Object with success count and total count
 */
export async function replaceFiles(
  replacements: Omit<ReplaceFileOptions, "dryRun">[],
  dryRun = false
): Promise<{ success: number; total: number }> {
  let successCount = 0

  for (const replacement of replacements) {
    const result = await replaceFile({ ...replacement, dryRun })
    if (result.success) {
      successCount++
      console.log(`  ✅ ${result.message}`)
    } else {
      console.log(`  ❌ ${result.message}`)
    }
  }

  return { success: successCount, total: replacements.length }
}

interface ReplaceInDirectoryOptions {
  directory: string
  search: string | RegExp
  replace: string
  extensions?: string[]
  exclude?: (RegExp | string)[]
  dryRun?: boolean
}

interface DirectoryReplaceResult {
  success: number
  total: number
  skipped: number
}

/**
 * Replace text in all files within a directory
 * @param options - Configuration for directory replacement
 * @param options.directory - Directory path to scan
 * @param options.search - String or RegExp to search for
 * @param options.replace - Replacement string
 * @param options.extensions - Optional array of file extensions to include (e.g., [".ts", ".md"])
 * @param options.exclude - Optional array of patterns to exclude from replacement
 * @param options.dryRun - If true, simulates the operation without making changes
 * @returns Result object with success, total, and skipped counts
 */
export async function replaceInDirectory(options: ReplaceInDirectoryOptions): Promise<DirectoryReplaceResult> {
  const { directory, search, replace, extensions, exclude, dryRun = false } = options

  const dirPath = path.resolve(directory)
  let successCount = 0
  let totalCount = 0
  let skippedCount = 0

  async function processDirectory(dir: string) {
    const entries = await Array.fromAsync(new Bun.Glob("**/*").scan({ cwd: dir, onlyFiles: false }))

    for (const entry of entries) {
      const fullPath = path.join(dir, entry)
      const stat = await Bun.file(fullPath).stat()

      if (stat.isDirectory()) continue

      // Check file extension if filter provided
      if (extensions && extensions.length > 0) {
        const ext = path.extname(entry)
        if (!extensions.includes(ext)) {
          continue
        }
      }

      totalCount++

      try {
        const content = await Bun.file(fullPath).text()
        
        // Apply exclusions if provided
        let newContent = content
        if (exclude && exclude.length > 0) {
          // For each exclusion pattern, protect it during replacement
          const protectedContent = content
          const markers: { placeholder: string; original: string }[] = []
          let workingContent = protectedContent
          
          // Replace exclusions with unique markers
          for (let i = 0; i < exclude.length; i++) {
            const pattern = exclude[i]
            if (!pattern) continue
            
            const placeholder = `__PROTECTED_${i}__`
            const regex = typeof pattern === "string" ? new RegExp(pattern, "g") : pattern
            const matches = workingContent.match(regex)
            
            if (matches) {
              for (const match of matches) {
                const uniquePlaceholder = `${placeholder}_${markers.length}`
                markers.push({ placeholder: uniquePlaceholder, original: match })
                workingContent = workingContent.replace(match, uniquePlaceholder)
              }
            }
          }
          
          // Apply the main replacement
          newContent = search instanceof RegExp ? workingContent.replace(search, replace) : workingContent.replaceAll(search, replace)
          
          // Restore protected content
          for (const { placeholder, original } of markers) {
            newContent = newContent.replace(placeholder, original)
          }
        } else {
          newContent = search instanceof RegExp ? content.replace(search, replace) : content.replaceAll(search, replace)
        }

        if (content !== newContent) {
          if (!dryRun) {
            await Bun.write(fullPath, newContent)
          }
          successCount++
        } else {
          skippedCount++
        }
      } catch (error) {
        console.log(`  ⚠️  Failed to process ${entry}: ${error}`)
        skippedCount++
      }
    }
  }

  try {
    const fs = await import("fs")
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      throw new Error(`Directory not found: ${directory}`)
    }

    await processDirectory(dirPath)
  } catch (error) {
    console.log(`  ❌ Error scanning directory: ${error}`)
  }

  return { success: successCount, total: totalCount, skipped: skippedCount }
}
