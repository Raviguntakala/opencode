# StarCode Toolkit

Complete toolkit for rebranding OpenCode to StarCode and publishing to npm.

## 🚨 DEVELOPMENT & CONTRIBUTION NOTICE

**If you want to develop agents, slash commands, custom tools, MCPs, or any custom functionality:**

1. **DO NOT EDIT THE MAIN CODEBASE** - All custom development must be done in the `.starcode/` folder
2. **Use the designated folder structure** in `.starcode/`:
   - `agent/` - For custom agents
   - `command/` - For slash commands
   - `tool/` - For custom tools
   - `mcp/` - For Model Context Protocol servers
   - `skills/` - For reusable skills
3. **Test locally** by running `starcode` command - it will automatically use your `.starcode/` folder contents
4. **Create a new branch** and submit a PR with only `.starcode/` changes
5. **See [CONTRIBUTING.md](CONTRIBUTING.md)** for detailed development guidelines and strict rules

⚠️ **Any PRs that modify the main codebase outside `.starcode/` will be rejected.**

## Prerequisites

1. **Bun installed** (v1.2.x recommended)

   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **npm account with organization access**

   ```bash
   npm login
   npm org ls @buildwise-ai  # Verify access
   ```

3. **Fresh OpenCode repository**
   ```bash
   git clone https://github.com/sst/opencode.git
   cd opencode
   bun install
   ```

## Step-by-Step Process

### 1. Rebrand OpenCode to StarCode

```bash
# Run rebranding script
bun starcode-toolkit/rebrand.ts
```

This changes all user-facing references:

- CLI command: `opencode` → `starcode`
- Config directories: `~/.opencode/` → `~/.starcode/`
- ASCII logos: Shows "STARCODE" branding
- Help text: All descriptions updated

### 2. Test the Rebranded Version

```bash
# Build the project
bun dev

# Test in another terminal
./dist/opencode/bin/starcode --help
```

**Expected output:**

```
█▀▄▀█ ▀█▀ █░░ ▀█▀ █▀▀▄ █▀▀▄ █▀▀ █▀▀█ █▀▀▄ █▀▀
█░▀░█ ░█░ █░░ ░█░ █░░█ █░░█ █░░ █░░█ █░░█ █▀▀
▀░░░▀ ▀▀▀ ▀▀▀ ▀▀▀ ▀░░▀ ▀▀▀░ ▀▀▀ ▀▀▀▀ ▀▀▀░ ▀▀▀

Commands:
  starcode [project]           start starcode tui
  starcode attach <server>     attach to a running starcode server
  ...
```

### 3. Configure Publishing (Optional)

Edit `starcode-toolkit/publish-config.json` if needed:

```json
{
  "packagePrefix": "@your-org",
  "repositoryUrl": "https://github.com/your-org/your-repo",
  "packages": [
    {
      "newName": "@your-org/your-package-name",
      "description": "Your custom description"
    }
  ]
}
```

### 4. Publish to npm

```bash
# Publish all packages
bun starcode-toolkit/publish.ts --publish
```

This will:

- Build all packages with binaries
- Publish platform-specific binary packages
- Publish main packages with proper dependencies
- Auto-increment version numbers

### 5. Create GitHub Release (Optional Backup)

After publishing to npm, you can create a GitHub release with distribution files:

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Authenticate with GitHub
gh auth login

# Create the release
bun starcode-toolkit/create-github-release.ts

# Or do a dry run first
bun starcode-toolkit/create-github-release.ts --dry-run
```

This creates:

- A git tag (e.g., `v1.0.1`)
- A GitHub release with notes
- Attached distribution files (binaries, tarballs)

**Note**: This is a backup option for users who can't download from npm. The release uses already-built artifacts from the publish step, so the rebranding is already applied.

### 6. Revert Changes (For Upstream Sync)

```bash
# Revert all rebranding changes
bun starcode-toolkit/revert.ts
```

This reverts all changes back to original opencode, making it easier to sync with upstream.

### 7. Test Installation

```bash
# Install your published package
npm install -g @buildwise-ai/starcode

# Test the command
starcode --help
```

## What Gets Changed

### ✅ User-Facing Changes (Rebranded)

- **Command name**: `starcode` instead of `opencode`
- **ASCII logos**: Custom "STARCODE" branding
- **Config directories**: `~/.starcode/` instead of `~/.opencode/`
- **Config files**: `starcode.json` instead of `opencode.json`
- **Help text**: All command descriptions updated
- **TUI branding**: Status bar shows "star"

### ⚠️ Internal Code (Unchanged)

- **Package directories**: `packages/opencode/` (for compatibility)
- **Import statements**: All internal references preserved
- **Build system**: Original build process maintained

## Troubleshooting

### Rebranding Issues

**Problem**: Some files not found during rebranding

```bash
❌ packages/opencode/src/cli/ui.ts (file not found)
```

**Solution**: Ensure you're in the OpenCode root directory and all files exist.

### Publishing Issues

**Problem**: Version already exists

```bash
npm error You cannot publish over the previously published versions: 1.0.1
```

**Solution**: The script auto-increments versions. If this fails, manually update the version strategy in config.

**Problem**: Not authenticated

```bash
npm error 401 Unauthorized
```

**Solution**:

```bash
npm login
npm whoami  # Verify authentication
```

### Installation Issues

**Problem**: Package not found after publishing

```bash
npm error 404 Not Found - GET https://registry.npmjs.org/@buildwise-ai%2fstarcode
```

**Solution**: Wait 5-10 minutes for npm registry propagation, then try again.

## File Structure

```
starcode-toolkit/
├── README.md              # This file
├── rebrand.ts            # Rebranding script
├── publish.ts            # Publishing script
└── publish-config.json   # Publishing configuration
```

## Advanced Usage

### Dry Run Rebranding

Test rebranding without making changes:

```bash
DRY_RUN=true bun starcode-toolkit/rebrand.ts
```

### Custom Branding

To rebrand to a different name, edit the `rebrand.ts` file and replace all instances of "starcode" with your desired name.

### Version Strategies

In `publish-config.json`:

- `"increment"`: Auto-increment patch version (1.0.0 → 1.0.1)
- `"timestamp"`: Use timestamp versions (1.0.0-2024-01-15T10-30-00)

## Support

If you encounter issues:

1. Check that you're in the OpenCode root directory
2. Ensure Bun and npm are properly installed
3. Verify npm authentication and organization access
4. Wait for npm registry propagation after publishing
