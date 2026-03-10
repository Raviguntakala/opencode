# Contributing to StarCode

Welcome to StarCode development! This guide has two sections:
- **For Package Maintainers**: Full rebranding and publishing workflow
- **For Contributors**: How to add agents, slash commands, and MCPs

---

## 📦 For Package Maintainers

### Prerequisites

Ensure you have these tools installed:
- **[git](https://git-scm.com/install/linux)** - Version control
- **[Node.js](https://nodejs.org/en/download)** - JavaScript runtime
- **[bun](https://bun.sh)** - Package manager and runtime
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
- **[gh cli](https://github.com/cli/cli/blob/trunk/docs/install_linux.md#debian)** - GitHub CLI for releases

### Rebranding & Publishing Workflow

#### Important Notes Before Starting

⚠️ **CRITICAL: Never Edit Original Code Directly**

- **DO NOT** edit any original source files to fix branding issues
- **DO NOT** manually fix test failures by changing test files
- **ONLY** update rebrand rules in `starcode-toolkit/rebrand.ts` to handle changes
- This ensures clean upstream merges without conflicts

⚠️ **CRITICAL: Keep Rebrand and Revert in Sync**

- **ALWAYS** add corresponding revert rules when adding rebrand rules
- Every change in `rebrand.ts` must have a reverse operation in `revert.ts`
- This ensures complete cleanup after publishing

If rebrand or tests fail:
1. Analyze what changed in upstream code
2. Update the rebrand rules to handle the new patterns
3. Add matching revert rules for the new rebrand rules
4. Fix test issues by updating rebrand logic, not tests themselves

#### Step 1: Sync and Rebrand

```bash
# 1. Pull latest changes
git pull origin dev

# 2. Install dependencies
bun install

# 3. Run rebranding script
bun starcode-toolkit/rebrand.ts
```

**⚠️ If rebrand fails:**
- Review the error messages carefully
- Upstream code may have changed (new files, patterns, or structure)
- Update `starcode-toolkit/rebrand.ts` rules to handle new patterns
- **DO NOT manually edit source files** - fix the rebrand rules instead
- Re-run `bun starcode-toolkit/rebrand.ts` after fixing rules

#### Step 2: Testing Checklist

Before publishing, verify ALL of the following:

- [ ] **TUI Functionality**: `bun dev` shows TUI and works normally
- [ ] **Help & Branding**: `bun dev --help` shows proper StarCode logo and text (no OpenCode references)
- [ ] **Authentication**: `bun dev auth login` authenticates with GitHub Copilot successfully
- [ ] **Upgrade Command**: `bun dev upgrade` works and upgrades properly
- [ ] **Test Suite**: `cd packages/opencode && bun test` - All test cases must pass
  - **⚠️ If tests fail:** Update rebrand rules to fix issues, don't edit test files directly
- [ ] **Exit Logo**: Exit message displays proper StarCode logo
- [ ] **Build Binaries**: `bun starcode-toolkit/publish.ts --build` - Build packages and binaries
- [ ] **Binary Aliases**: Check `bin/` folder contains both `starcode` and `star` aliases

#### Step 3: Publishing

Once ALL tests pass:

```bash
# Build and publish packages
bun starcode-toolkit/publish.ts --publish

# Create GitHub release
bun starcode-toolkit/create-github-release.ts
```

#### Step 4: Post-Publish Verification

- [ ] Release notes generated in `RELEASE_NOTES.md`
- [ ] GitHub release created with correct version
- [ ] NPM packages published successfully
- [ ] Binaries uploaded to GitHub release

#### Step 5: Revert Changes

After successful publish, revert all rebranded changes to keep repo clean:

```bash
# Revert all rebranding changes
bun starcode-toolkit/revert.ts

# Verify git status is clean
git status
```

This ensures:
- Repository stays in sync with upstream
- Next upstream merge has no conflicts
- Rebrand process is repeatable

---

## 👥 For Contributors

If you're contributing agents, slash commands, MCPs, or skills:

### 🚨 CRITICAL RULES

### ❌ WHAT YOU CANNOT DO

- **NEVER edit any files outside the `.starcode/` folder**
- **NEVER modify package.json, tsconfig.json, or any config files in the root**
- **NEVER change the main source code in `packages/`, `src/`, or any core directories**
- **NEVER update dependencies or build scripts**
- **NEVER modify existing agents, commands, or tools in the main codebase**

### ✅ WHAT YOU CAN DO

- **Add new agents in `.starcode/agent/`**
- **Create slash commands in `.starcode/command/`**
- **Build custom tools in `.starcode/tool/`**
- **Create reusable skills in `.starcode/skills/`**
- **Update documentation for your contributions**

## 📁 Folder Structure

The `.starcode/` folder has this structure (based on existing examples):

```
.starcode/
├── agent/          # Custom agents (simple .md files)
│   ├── docs.md             # Example: Documentation agent
│   ├── git-committer.md    # Example: Git commit agent
│   └── my-agent.md         # Your custom agent
├── command/        # Slash commands (simple .md files)
│   ├── analyze-bug.md      # Example: Bug analysis command
│   └── my-command.md       # Your custom command
├── tool/           # Custom tools (currently empty - check examples in main codebase)
├── skill/         # Reusable skills
│   └── dad-joke-generator/ # Example skill
│       ├── SKILL.md        # Skill definition
│       ├── assets/         # Skill assets
│       ├── references/     # Reference materials
│       └── scripts/        # Skill scripts
├── package.json    # Dependencies for custom code
└── .gitignore      # Ignore patterns
```

## 🛠️ Development Workflow

### 1. Setup Development Environment

```bash
# Clone the repository
git clone git.i.mercedes-benz.com:ITS-OC/rof-step-starcode.git
cd rof-step-starcode

# Install dependencies
bun install

# Create your development branch
git checkout -b feature/my-custom-agent
```

### 2. Create Your Custom Component

Choose the appropriate folder based on what you're building:

#### For Agents (`.starcode/agent/`)

Agents are simple markdown files with frontmatter configuration:

```bash
cd .starcode/agent/
```

Create a single `.md` file like `my-agent.md`:

```markdown
---
description: Brief description of what your agent does
---

You are an expert [role description]

[Detailed instructions for the agent behavior]

[Any specific guidelines or rules]
```

#### For Slash Commands (`.starcode/command/`)

Commands are markdown files that can call agents or perform actions:

```bash
cd .starcode/command/
```

Create a single `.md` file like `my-command.md`:

```markdown
---
description: What this command does
agent: optional-agent-to-use
---

[Command description and instructions]

## Role Definition

[What role this command performs]

## Input Requirements

[What inputs are needed]

## Execution Protocol

[Step-by-step execution instructions]
```

#### For Skills (`.starcode/skills/`)

Skills need a directory structure:

```bash
mkdir -p .starcode/skills/my-skill
cd .starcode/skills/my-skill
```

Create these files:

- `SKILL.md` - Skill definition with frontmatter
- `assets/` - Any assets needed
- `references/` - Reference materials
- `scripts/` - Executable scripts

### 3. Test Your Development

```bash
# Build the project (run from root directory)
# Start the TUI (this automatically looks for .starcode folder)
starcode
```

**Inside the TUI you can:**

- **View agents**: Type `/agents` to see all available agents
- **Use slash commands**: Type `/your-command-name` to execute commands
- **Check Tools/Skills**: Ask "Do you have tool `<name>`?" or "Do you have skill `<name>`?"

### 4. Quality Standards

#### Code Quality

- **Use TypeScript** for all `.ts` files
- **Follow existing code patterns** from the main codebase
- **Add proper error handling**
- **Include comprehensive logging**
- **Write clean, documented code**

#### Configuration Files

For components that need configuration, create simple structures:

**Agent Configuration** (frontmatter in .md file):

```markdown
---
description: Clear description of what this agent does
model: claude-3-5-sonnet-20241022 # optional
temperature: 0.7 # optional
---
```

**Command Configuration** (frontmatter in .md file):

```markdown
---
description: What this command does
agent: agent-name # optional - if command uses specific agent
---
```

**MCP Server Configuration** (`config.json`):

```json
{
  "context": {
    "databases": ["db1", "db2"],
    "tables": {...}
  }
}
```

**Skill Configuration** (frontmatter in SKILL.md):

```markdown
---
name: skill-name
description: What this skill does
---
```

#### Documentation

Every component should have clear documentation:

**For Agents**: Instructions within the markdown file
**For Commands**: Description and usage in the markdown file
**For MCP Servers**: `README.md` with setup and usage instructions
**For Skills**: Documentation within `SKILL.md` with examples and capabilities

### 5. Testing Checklist

Before submitting your PR, verify:

- [ ] Your component loads without errors
- [ ] All commands/tools work as expected
- [ ] No modifications to main codebase
- [ ] Proper documentation included
- [ ] Configuration files are valid JSON
- [ ] No conflicts with existing components
- [ ] Clean git history with meaningful commits

## 📝 Submission Process

### 1. Prepare Your PR

```bash
# Ensure you're on your feature branch
git status

# Stage only .starcode changes
git add .starcode/

# Commit with descriptive message
git commit -m "feat: add custom agent for code review"

# Push to your branch
git push origin feature/my-custom-agent
```

### 2. Create Pull Request

When creating your PR:

1. **Title**: Use conventional commits (`feat:`, `fix:`, `docs:`)
2. **Description**: Explain what you built and why
3. **Testing**: Describe how you tested it
4. **Screenshots**: If applicable, show it working

#### PR Template

```markdown
## Description

Brief description of your contribution.

## Type of Change

- [ ] New Agent
- [ ] New Slash Command
- [ ] New Tool
- [ ] New MCP Server
- [ ] New Skill
- [ ] Documentation Update

## Testing

- [ ] Tested locally with `starcode` command
- [ ] All functionality works as expected
- [ ] No errors in console/logs
- [ ] Documentation is complete

## Files Changed

List only files in `.starcode/` folder.

## Additional Notes

Any special setup or considerations.
```

### 3. Review Process

Your PR will be reviewed for:

- **Compliance** - Only `.starcode/` changes
- **Quality** - Code follows standards
- **Documentation** - Complete and clear
- **Testing** - Works as described
- **Security** - No malicious code or vulnerabilities

## 📋 Component Specifications

### Agent Configuration (`agent/*/config.json`)

```json
{
  "name": "agent-name",
  "version": "1.0.0",
  "description": "Agent description",
  "author": "Your Name <email>",
  "model": "claude-3-5-sonnet-20241022",
  "temperature": 0.7,
  "maxTokens": 4000,
  "systemPrompt": "./prompt.md",
  "capabilities": ["code", "analysis", "writing"],
  "tags": ["coding", "assistant"]
}
```

### Command Configuration (`command/*/config.json`)

```json
{
  "name": "command-name",
  "version": "1.0.0",
  "description": "Command description",
  "author": "Your Name <email>",
  "usage": "/command-name [options]",
  "handler": "./handler.ts",
  "parameters": {
    "required": ["param1"],
    "optional": ["param2"]
  },
  "examples": ["/command-name value1", "/command-name value1 --param2=value2"]
}
```

### Tool Configuration (`tool/*/config.json`)

```json
{
  "name": "tool-name",
  "version": "1.0.0",
  "description": "Tool description",
  "author": "Your Name <email>",
  "implementation": "./implementation.ts",
  "inputSchema": {
    "type": "object",
    "properties": {
      "input": { "type": "string" }
    },
    "required": ["input"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "result": { "type": "string" }
    }
  }
}
```

### MCP Server Configuration (`mcp/*/config.json`)

```json
{
  "name": "mcp-server-name",
  "version": "1.0.0",
  "description": "MCP server description",
  "author": "Your Name <email>",
  "server": "./server.ts",
  "transport": "stdio",
  "capabilities": {
    "tools": true,
    "resources": true,
    "prompts": false
  },
  "tools": [
    {
      "name": "tool-name",
      "description": "Tool description"
    }
  ]
}
```

## ❓ FAQ

### Q: Can I modify existing agents or tools?

**A: No.** You can only add new components in `.starcode/`. To suggest changes to existing functionality, open an issue first.

### Q: Can I add dependencies to package.json?

**A: No.** You can only modify `.starcode/package.json` for dependencies specific to your custom components.

### Q: What if I need to change something in the main codebase?

**A: Open an issue first.** Describe what you need and why. Core maintainers will evaluate and implement if needed.

### Q: How do I handle conflicts with existing functionality?

**A: Use unique names** and check the existing codebase first. All custom components should have unique identifiers.

### Q: Can I submit multiple components in one PR?

**A: Yes,** but keep them related. For example, an agent + its supporting tools is fine, but unrelated components should be separate PRs.

## 🆘 Getting Help

- **Issues**: Open a GitHub issue for questions or problems
- **Discussions**: Use GitHub discussions for general questions
- **Documentation**: Check existing components in `.starcode/` for examples
- **Testing**: Use `starcode` command locally to test everything

## 🏷️ Component Naming

Use clear, descriptive names:

- **Agents**: `code-reviewer`, `documentation-writer`, `bug-analyzer`
- **Commands**: `generate-tests`, `refactor-code`, `add-docs`
- **Tools**: `file-analyzer`, `dependency-checker`, `code-formatter`
- **MCP Servers**: `database-query`, `api-client`, `file-watcher`

Remember: **Your creativity should be in your contributions, not in breaking the rules!** 🎨
