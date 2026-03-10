#!/usr/bin/env bun

interface PublishedVersions {
  customVersion: string
  originalVersion: string
  lastPublishedOriginalVersion: string
  publishedAt: string
  packages: Array<{
    name: string
    originalName: string
    path: string
  }>
}

interface GitHubRelease {
  tag_name: string
  name: string
  body: string
  published_at: string
}

function replaceOpenCodeBranding(text: string): string {
  return text
    .replaceAll(/OPENCODE_/g, "STARCODE_")
    .replaceAll(/OpenCode/g, "StarCode")
    .replaceAll(/opencode/g, "starcode")
    .replaceAll(/\s*\(@[\w-]+\)/g, "") // Remove contributor names like (@username)
    .replaceAll(/^-?\s*No notable changes\s*$/gim, "") // Remove 'No notable changes' lines
}

function filterReleaseNotes(body: string): string {
  const lines = body.split("\n")
  const filtered: string[] = []
  let currentSection = ""
  let skipSection = false
  let inContributorSection = false

  for (const line of lines) {
    // Skip everything after "Thank you" or contributor sections
    if (
      line.match(/^\*\*Thank you to \d+ community contributor/i) ||
      line.match(/^Thank you to \d+ community contributor/i)
    ) {
      inContributorSection = true
      break
    }

    // Skip if in contributor section
    if (inContributorSection) {
      continue
    }

    // Check for section headers (##)
    if (line.match(/^##\s+(Core|TUI|Desktop|Web|CLI|Console|Enterprise)/i)) {
      const match = line.match(/^##\s+(\w+)/i)
      currentSection = match && match[1] ? match[1].toLowerCase() : ""
      skipSection = currentSection === "desktop"

      if (!skipSection) {
        filtered.push(line)
      }
      continue
    }

    // Skip contributor mentions with @username
    if (line.match(/^-?\s*@\w+:/)) {
      continue
    }

    // Add line if not in skip section
    if (!skipSection) {
      filtered.push(line)
    }
  }

  // Clean up trailing empty lines
  while (filtered.length > 0 && filtered[filtered.length - 1]?.trim() === "") {
    filtered.pop()
  }

  return filtered.join("\n")
}

async function fetchReleases(from: string, to: string): Promise<GitHubRelease[]> {
  const response = await fetch(
    "https://api.github.com/repos/anomalyco/opencode/releases?per_page=100"
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch releases: ${response.statusText}`)
  }

  const releases = (await response.json()) as GitHubRelease[]

  // Find releases between versions
  const fromIndex = releases.findIndex((r) => r.tag_name === `v${from}`)
  const toIndex = releases.findIndex((r) => r.tag_name === `v${to}`)

  if (fromIndex === -1) {
    throw new Error(`Version ${from} not found`)
  }
  if (toIndex === -1) {
    throw new Error(`Version ${to} not found`)
  }

  // Return releases from newest to oldest (excluding the 'from' version)
  return releases.slice(toIndex, fromIndex).reverse()
}

async function generateReleaseNotes() {
  const publishedPath = new URL("published-versions.json", import.meta.url)
    .pathname
  const published = (await Bun.file(publishedPath).json()) as PublishedVersions

  const { customVersion, originalVersion, lastPublishedOriginalVersion } =
    published

  if (lastPublishedOriginalVersion === originalVersion) {
    console.log("No new upstream versions since last publish")
    return
  }

  console.log(
    `Fetching releases from ${lastPublishedOriginalVersion} to ${originalVersion}...`
  )

  const releases = await fetchReleases(
    lastPublishedOriginalVersion,
    originalVersion
  )

  if (releases.length === 0) {
    console.log("No releases found")
    return
  }

  console.log(`Found ${releases.length} release(s)`)

  // Build combined release notes
  const sections: Record<string, string[]> = {}

  // Collect all sections from all releases
  for (const release of releases) {
    const filtered = filterReleaseNotes(release.body)
    const branded = replaceOpenCodeBranding(filtered)
    const lines = branded.split("\n")

    let currentSection = ""
    for (const line of lines) {
      const match = line.match(/^##\s+(\w+)/)
      if (match && match[1]) {
        currentSection = match[1]
        if (!sections[currentSection]) {
          sections[currentSection] = []
        }
      } else if (currentSection && line.trim()) {
        const section = sections[currentSection]
        if (section) {
          section.push(line)
        }
      }
    }
  }

  // Build formatted notes with combined sections
  let notes = `## v${customVersion}\n\n`
  notes += `*Released on ${new Date().toISOString().split("T")[0]}*\n\n`

  for (const [section, items] of Object.entries(sections)) {
    notes += `## ${section}\n`
    notes += items.join("\n") + "\n\n"
  }

  // Append to RELEASE_NOTES.md
  const notesPath = new URL("RELEASE_NOTES.md", import.meta.url).pathname
  const existing = await Bun.file(notesPath).text().catch(() => "")

  // Check if file has existing content beyond the header
  const hasContent = existing && existing.trim() !== "# StarCode Release Notes"
  
  const updated = hasContent
    ? existing.replace(
        "# StarCode Release Notes",
        `# StarCode Release Notes\n\n${notes}---\n`
      )
    : `# StarCode Release Notes\n\n${notes}`

  await Bun.write(notesPath, updated)

  console.log(`Release notes written to RELEASE_NOTES.md`)
  console.log(
    `\nNext steps:\n1. Review the release notes\n2. Update customVersion in published-versions.json\n3. Run the publish script`
  )
}

generateReleaseNotes().catch((error) => {
  console.error("Error:", error.message)
  process.exit(1)
})
