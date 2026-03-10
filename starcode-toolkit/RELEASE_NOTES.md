# StarCode Release Notes

## v1.0.18

*Released on 2026-03-02*

## Core
- Add workspace-serve command (experimental)
- ACP both live and load share synthetic pending status preceding actual data
- Replace structuredClone with spread operator for process.env in tests
- Add 50ms tolerance for NTFS mtime precision in Windows FileTime assertions
- Replace Unix-only test assumptions with cross-platform alternatives
- Use path.sep in discovery test for cross-platform path matching
- Normalize backslash paths in config rel() and file ignore on Windows
- Fix plugin resolution with createRequire fallback on Windows
- Harden preload cleanup against Windows EBUSY errors
- Normalize git excludesFile path for Windows in tests
- Stream bash output and add synthetic pending events to ACP
- Add git flags for snapshot operations and fix tests for cross-platform on Windows
- Handle CRLF line endings in markdown frontmatter parsing on Windows
- Use path.join for cross-platform glob test assertions
- Upgrade to Bun 1.3.10 canary and force baseline builds always
- Normalize paths at permission boundaries on Windows
- Windows path support and canonicalization
- Upgrade OpenTUI to v0.1.81
- Change detection on Windows, especially Cygwin
- Cache platform binary in postinstall for faster startup
- Revert caching platform binary in postinstall for faster startup
- Cache platform binary in postinstall for faster startup
- Publish desktop beta releases to a separate repository
- Add experimental endpoint to list all sessions
- Fixed terminal issues in the app
- Respect info exclude in snapshot staging
- Missing plugin dependencies cause TUI to black screen
- Synchronize changes
- Temporarily disable plan enter tool to prevent unintended mode switches during task execution
- Migrate Bun.spawn to Process utility with timeout and cleanup
- Disable Bun config cache in CI
- Await git ID cache write in project module
- Import custom tools via file URL
- Add message delete endpoint
- Fix most segfaults on Windows with Bun v1.3.10 stable
- Split TUI and server configuration

## TUI
- Support variant parameter in GitHub Actions and StarCode GitHub run command
- Add Go SDK code generation script
- Show LSP errors for apply_patch tool
- Consume stdout concurrently with process exit in auth login

---

## v1.0.17

*Released on 2026-02-27*

## Core
- Add workspace-serve command (experimental)
- ACP both live and load share synthetic pending status preceding actual data
- Replace structuredClone with spread operator for process.env in tests
- Add 50ms tolerance for NTFS mtime precision in Windows FileTime assertions
- Replace Unix-only test assumptions with cross-platform alternatives
- Use path.sep in discovery test for cross-platform path matching
- Normalize backslash paths in config rel() and file ignore on Windows
- Fix plugin resolution with createRequire fallback on Windows
- Harden preload cleanup against Windows EBUSY errors
- Normalize git excludesFile path for Windows in tests
- Stream bash output and add synthetic pending events to ACP
- Add git flags for snapshot operations and fix tests for cross-platform on Windows
- Handle CRLF line endings in markdown frontmatter parsing on Windows
- Use path.join for cross-platform glob test assertions
- Upgrade to Bun 1.3.10 canary and force baseline builds always
- Normalize paths at permission boundaries on Windows
- Windows path support and canonicalization
- Upgrade OpenTUI to v0.1.81
- Change detection on Windows, especially Cygwin
- Cache platform binary in postinstall for faster startup
- Revert caching platform binary in postinstall for faster startup
- Cache platform binary in postinstall for faster startup
- Publish desktop beta releases to a separate repository
- Add experimental endpoint to list all sessions
- Fixed terminal issues in the app
- Respect info exclude in snapshot staging
- Missing plugin dependencies cause TUI to black screen
- Synchronize changes
- Temporarily disable plan enter tool to prevent unintended mode switches during task execution
- Migrate Bun.spawn to Process utility with timeout and cleanup
- Disable Bun config cache in CI
- Await git ID cache write in project module
- Import custom tools via file URL
- Add message delete endpoint
- Fix most segfaults on Windows with Bun v1.3.10 stable
- Split TUI and server configuration

## TUI
- Support variant parameter in GitHub Actions and StarCode GitHub run command
- Add Go SDK code generation script
- Show LSP errors for apply_patch tool
- Consume stdout concurrently with process exit in auth login

---

## v1.0.16

*Released on 2026-02-24*

## Core
- Add automatic .env file loading from home directory
- Enable real-time synchronization of environment variables without requiring manual `npx -y @buildwise-ai/load-env` invocations
- Improve security by loading environment variables on-demand instead of storing them permanently in the environment
- Add dfmt formatter support for D language files
- Bump GitLab provider and auth plugin for mid-session token refresh
- Remove unnecessary per-message title LLM calls
- Prioritize user-defined variables over environment variables in Google Vertex AI configuration
- Add OpenAI-compatible endpoint support for Google Vertex provider
- Add Venice support for temperature, topP, topK, and smallOption parameters
- Add cljfmt formatter support for Clojure files
- Fixed terminal rendering and interaction issues in the application
- Normalize file status paths relative to instance directory
- Migrate from Bun.Glob to npm glob package
- Bump AI SDK packages for Google, Google Vertex, Anthropic, Bedrock, and provider utils
- Add support for medium reasoning with Gemini 3.1
- Remove use of Bun.file
- Text files misclassified as binary
- Fetch default server at top level in desktop application
- Terminal rework in the app
- Bake in the AWS and Google authentication packages
- Token substitution in STARCODE_CONFIG_CONTENT now works correctly
- Revert migration from Bun.file() to Filesystem module
- Migrate project.ts from Bun.file() to Filesystem/stat modules
- Migrate read tool from Bun.file() to Filesystem module
- Migrate write tool from Bun.file() to Filesystem module
- Migrate Edit tool from Bun.file() to Filesystem module
- Migrate remaining tool files from Bun.file() to Filesystem/stat modules
- Migrate storage.ts from Bun.file()/Bun.write() to Filesystem module
- Migrate src/storage/json-migration.ts from Bun.file() to Filesystem module
- Migrate MCP auth module from Bun file APIs to Filesystem module
- Migrate storage database from Bun.file() to statSync for file existence checks
- Migrate session prompt module from Bun.file() to Filesystem/stat modules
- Fix crash in `starcode run` and show errored tool calls in output
- Migrate skill discovery to use Filesystem module instead of Bun file APIs
- Migrate session instruction handling from Bun.file() to Filesystem module
- Migrate provider.ts from Bun.file() to Filesystem module
- Migrate shell.ts from Bun.file() to statSync for improved file system operations
- Migrate log utility from Bun.file() to Node.js fs module for better compatibility
- Migrate models.ts from Bun.file()/Bun.write() to Filesystem module
- Use HashiCorp releases API for installing terraform-ls
- Migrate LSP server from Bun.file()/Bun.write() to Filesystem module
- Migrate session command from Bun.file() to statSync for improved file system operations
- Migrate agent.ts from Bun.file() to Filesystem module
- Migrate auth module from Bun.file()/Bun.write() to Filesystem module
- Pass sessionID and callID to shell.env hook input
- Fix terminal cross-talk issue in the application
- Update SST version
- Migrate src/global/index.ts from Bun.file() to Filesystem module
- Emit PROMPT_TOO_LARGE error when GitHub context overflows
- Migrate src/bun/index.ts from Bun.file()/Bun.write() to Filesystem module
- Migrate config/markdown.ts from Bun.file() to Filesystem module
- Migrate file/index.ts from Bun.file() to Filesystem module
- Migrate format/formatter.ts from Bun.file() to Filesystem module
- Allow readJson to be called without explicit type parameter
- Migrate file/ripgrep.ts from Bun APIs to Filesystem module
- Migrate index.ts from Bun.file() to Filesystem module
- Add Julia language server support
- Bump GitLab AI provider to 3.6.0 to add Sonnet 4.6 support
- Add centralized filesystem module for Bun.file migration
- Fix Clojure syntax highlighting
- Ensure explore subagent prompts for external directory permission instead of auto-denying
- Don't autoload kilo
- Add Kilo as a native provider
- Simplify redundant ternary in updateMessage
- Ensure Read tool uses fs/promises for all file system operations
- Make read tool more memory efficient
- Surface plugin auth providers in the login picker
- Invalidate OAuth credentials when OAuth provider indicates they are invalid
- Don't fetch models.dev on completion
- Recover state after SSE reconnect and harden SSE streams
- Keep message part order stable when files resolve asynchronously
- Drop IDs from attachments in tools and assign them in prompt.ts instead
- Support adaptive thinking for Claude Sonnet 4.6
- Add missing id, sessionID, and messageID to MCP tool attachments
- Remove unnecessary deep clones from session loop and LLM stream
- Remove User-Agent header assertion from LLM test to fix failing test

## TUI
- Make use of server directory path for file references in prompts
- Add database migration command to convert JSON storage to SQLite
- Add --continue and --fork flags to attach command
- Fixed inaccurate tips in TUI
- Improve GitHub action branch detection and handle 422 errors
- Ensure onExit callback fires after terminal output is written
- Migrate TUI thread module from Bun.file() to Filesystem module
- Migrate agent command from Bun.file()/Bun.write() to Filesystem module
- Migrate import command from Bun.file() to Filesystem module
- Update pasteImage to only increment count when the previous attachment is an image
- Migrate editor.ts from Bun.file()/Bun.write() to Filesystem module
- Migrate clipboard.ts from Bun.file() to Filesystem module
- Migrate CLI run command from Bun.file() to Filesystem/stat modules
- Session list --max-count parameter now correctly limits the number of sessions displayed
- Exit cleanly without hanging after session ends
- Style scrollbox for permission and sidebar
- Increase button heights and improve permission prompt layout alignment
- Display new session banner with logo and project details in TUI
- Add custom tool and MCP call responses that are visible and collapsible
- Use structuredClone instead of remeda's clone for better performance and native support

---


## v1.0.15

*Released on 2026-02-18*

## Core
- Add dfmt formatter support for D language files
- Bump GitLab provider and auth plugin for mid-session token refresh
- Remove unnecessary per-message title LLM calls
- Prioritize user-defined variables over environment variables in Google Vertex AI configuration
- Add OpenAI-compatible endpoint support for Google Vertex provider
- Add Venice support for temperature, topP, topK, and smallOption parameters
- Add cljfmt formatter support for Clojure files

## TUI
- Make use of server directory path for file references in prompts
- Add database migration command to convert JSON storage to SQLite
- Add --continue and --fork flags to attach command
- Fixed inaccurate tips in TUI

---


## v1.0.14

*Released on 2026-02-16*

## Core
- Add additional context overflow cases and remove overcorrecting ones
- Ensure compaction is more reliable by adding reserve token buffer to provide enough room for input window compaction
- Improve /review prompt to detect behavior changes more explicitly
- Improve Amazon Bedrock check to include container credentials
- Support Claude agent SDK-style structured outputs in the StarCode SDK
- Support custom API URL per model
- Add automatic variant generation for Venice models
- Use Promise.all for MCP listTools calls to improve performance
- Upgrade OpenTUI to version 0.1.79
- Improve compaction check logic
- Make read tool offset 1-indexed to match line numbers and avoid confusion
- Add directory reading capability to the read tool
- Allow model configurations without npm/api provider details
- Tool outputs are now more LLM-friendly
- Return image attachments from webfetch tool
- Expose tool arguments in shell hook for plugin visibility
- Improve Codex model list
- Token substitution in STARCODE_CONFIG_CONTENT environment variable
- Look for recent model in fallback in CLI
- Baseline CPU detection fixed
- Windows selection behavior and manual Ctrl+C handling
- Terminal PTY isolation for app
- Revert token substitution in STARCODE_CONFIG_CONTENT
- Ensure @-mentioning a directory uses the read tool instead of deprecated list tool
- Add tool.definition hook for plugins to modify tool description and parameters
- Remove worktree delete functionality
- Resolve ACP hanging indefinitely in thinking state on Windows
- Revert to SQLite database implementation
- Move timeout configuration from programmatic API to CLI flag
- Update AI SDK packages and use adaptive reasoning for Claude Opus 4.6 on Vertex, Bedrock, and Anthropic
- Show all project sessions from any working directory
- Tweak websearch tool description date info to avoid cache busts
- Add comprehensive test coverage for Session.list() filters
- Filter sessions at database level to improve session list loading performance
- Fix Vercel gateway variants
- Bump Vertex AI packages
- Ensure Anthropic models on OpenRouter also have variant support
- Add WAL checkpoint on database open
- Ensure Vercel variants pass Amazon models under Bedrock key
- Add db command for database inspection and querying
- Derive all IDs from file paths during JSON migration
- Ensure SQLite migration logs to stderr instead of stdout

## TUI
- Default session sidebar to auto
- Dismiss dialogs with Ctrl+C in TUI
- Keep /share command available to copy existing share link
- Add mode-specific input placeholders to improve context-aware prompts
- Prevent home wordmark corruption in height-constrained terminals
- Use FFI to resolve Windows raw input and Ctrl+C handling issues
- Add toggle to hide session header in TUI
- Do not open console on error
- Prevent crash when tool inputs are malformed during starcode run
- Add --dir option to run command

---


## v1.0.13

*Released on 2026-02-11*

## Core
- Enable Claude 3.5 Sonnet (new) model support
- Silently ignore proxy command failures to prevent config initialization crashes
- Ensure GitHub Copilot plugin properly sets headers when used in clients other than TUI
- Bundle GitLab auth plugin directly instead of dynamic install
- Fix plugin installation to use direct package.json manipulation instead of bun add
- Fix image reading with OpenAI-compatible providers like Kimi K2.5
- Downgrade xai ai-sdk package due to errors
- Revert model autocomplete feature using models.dev schema reference
- Add models.dev schema reference for model autocomplete in starcode.json
- Adjust task tool description and input to reduce tool call failures with GPT models
- Wait for dependencies before loading custom tools and plugins
- Allow the function to hide or show thinking blocks to be bound to a key
- Skip dependency installation in read-only configuration directories
- Ensure Kimi for Coding plan has thinking enabled by default for k2p5
- Fixed Cloudflare Workers AI provider
- Prevent random hangs in plugin installs when using HTTP proxy by adding --no-cache flag
- Session errors when attachment file not found are now handled gracefully
- Support remote server connections in terminal and fix GLIBC compatibility
- Load user plugins after built-in plugins
- Fix unhandled errors when aborting with queued messages
- User plugins override built-in plugins for the same provider
- Move Codex 5.3 model definition to plugin to avoid showing unsupported model to other users
- Add session usage tracking to ACP
- Update transforms for GPT-5.3
- No changes in review pane
- Fix terminal replay in application
- Fix workspace reset issues in the app
- Resolve Homebrew upgrade requiring multiple runs
- Publish session.error event for invalid model selection
- Create file if it doesn't exist when writing via ACP
- Adjust agent variant logic to check if variant is available for model instead of requiring exact match
- Add new ContextOverflowError type
- Remove obsolete Copilot model enablement instructions
- Enable thinking for all reasoning models on Alibaba Cloud (DashScope)
- Parse mid-stream OpenAI response errors to prevent infinite retries on unrecoverable errors
- Revert web input focus shortcut feature
- Add web input focus shortcut
- Add models.dev schema reference for model autocomplete in starcode.json
- Set variant in assistant messages
- Add skill discovery from URLs via well-known RFC
- Clean up orphaned worktree directories
- Properly encode file URLs with special characters
- SessionPrompt.shell() now triggers loop if messages are queued
- Use reasoning summary auto for GPT-5 models that are not chat
- Add specific system prompt for Trinity model
- Correct prefix selection for amazon-bedrock provider in getSmallModel
- Don't rely on metadata.summary in task tool render
- Handle step-start and step-finish parts in GitHub response text extraction
- Bump @gitlab/gitlab-ai-provider to 3.5.0
- Add directory parameter to plugin client for multi-project support
- Correct /data API usage and data format for importing share URLs
- Parallelize skill downloads for faster loading in TUI
- Add skill discovery from URLs via well-known RFC
- Handle dollar sign character with file pattern in configuration
- Increase test timeout to 30s to prevent failures during package installation
- Memory leak fixed in platform fetch for events
- Show helpful message when free usage limit is exceeded

## TUI
- Add running spinner to bash tool in TUI
- Add hover states to question tool tabs
- Allow mouse escape via "esc" labels in dialogs
- Clean up dialog-model.tsx per code review
- Revert addition of version to session header and status dialog
- Revert showing connected providers in /connect dialog
- Use sender color for queued messages in TUI
- Revert footer restoration in session view
- Add Claude Code-style --fork flag to duplicate sessions before continuing
- Restore footer to session view
- Increase skill dialog width
- Improve skills dialog readability

---


## v1.0.12

*Released on 2026-02-05*

## Core
- Revert pull request that was mistakenly merged
- Add --mdns-domain flag to customize mDNS hostname
- Added and deleted file status now correctly calculated in app
- Add User-Agent header for GitLab AI Gateway requests
- Add Ormolu code formatter for Haskell
- Use OpenTUI OSC52 clipboard implementation
- Convert system message content to string for Copilot provider
- Give STARCODE_CONFIG_CONTENT proper priority for setting config based on docs
- Fixed session title generation with OpenAI models
- Simplify directory tree output for prompts
- Fix task status to show current tool state from message store
- Allow starting new sessions after errors by fixing stuck session status
- Adjust resolve parts to properly order tool calls when messages contain multiple @ references
- Hide badge for builtin slash commands
- Add workspace tests to the app
- Send custom agent prompts as developer messages instead of user messages when using Codex subscriptions
- Fixed variant logic for Anthropic models through OpenAI compatibility endpoint
- Add prompt caching support for Claude Opus on AWS Bedrock
- Scope agent variant to model
- Prevent duplicate AGENTS.md injection when reading instruction files 
- StarCode no longer hangs when using client.app.log() during initialization
- Remove outer backtick wrapper in session transcript tool formatting
- Allow user plugins to override built-in auth plugins
- Binary file handling in file view
- Ensure switching Anthropic models mid-conversation works without errors and fix reasoning opaque not being picked up for Gemini models
- Fix issue where folders and files starting with "." could not be mentioned with @
- Show actual retry error message instead of generic error message
- Use process.env directly for runtime environment mutations in provider
- Add reasoning variants support for SAP AI Core
- Add UTF-8 encoding defaults for Windows PTY
- Prevent memory leaks from AbortController closures
- Revert addition of Trinity model system prompt support
- Add Trinity model system prompt support
- Add shell.env hook for manipulating environment in tools and shell
- Use official ai-gateway-provider package for Cloudflare AI Gateway
- Allow theme colors in agent customization
- Add support for reading skills from .agents/skills directories
- Provider headers from config not applied to fetch requests
- Ensure MCP tools are sanitized
- Add .slnx to C#/F# LSP root detection
- Improve skills system with better prompting, fix permission requests after skill invocation, and ensure agents can locate scripts and resources
- Exclude k2p5 from reasoning variants
- Handle nested array items for Gemini schema validation
- Plugins are always reinstalled
- Strip properties and required fields from non-object types in Gemini schema
- Make CLI run command non-interactive
- Revert change that caused headers to be double merged if provider was authenticated in multiple places
- Document the built-in agents
- Prevent double-prefixing of Bedrock cross-region inference models
- Prioritize STARCODE_CONFIG_DIR for AGENTS.md

## TUI
- Respect terminal transparency in system theme
- Truncate session title in exit banner to prevent display overflow
- Show exit message banner in TUI
- Add spinner animation for Task tool
- Correct pluralization of match count in grep and glob tools
- Remove extra padding between search and results in dialog-select
- Add UI for skill tool in session view
- Conditionally render bash tool output in TUI
- Add skill dialog for selecting and inserting skills
- Enable password authentication for remote session attachment
- Fix documentation issues
- Revert skill slash commands feature
- Add skill slash commands to the app
- Add --thinking flag to show reasoning blocks in run command
- Always fall back to native clipboard after OSC52
- Restore direct OSC52 support

---


## v1.0.11

*Released on 2026-02-05*

## Core
- Remove unused experimental keys from TUI
- Add continuous integration configuration
- Remove AI SDK middleware that was preventing think blocks from being sent back as assistant message content
- I need to see the actual commit message to summarize it. Could you please provide the commit message you'd like me to summarize for the changelog entry?
- Sync changes
- Allow specifying custom models file path via STARCODE_MODELS_PATH environment variable
- Ensure models configuration is not empty before loading
- Make skills invokable as slash commands in the TUI
- Don't follow symbolic links by default in grep and ripgrep operations
- Prevent parallel test runs from contaminating environment variables
- Ensure Mistral ordering fixes also apply to Devstral
- Add Copilot-specific provider to properly handle reasoning tokens
- Respect STARCODE_MODELS_URL environment variable in build process
- Use snake_case for thinking parameter with OpenAI-compatible APIs
- Bump AI SDK packages
- Ensure ask question tool isn't included when using acp
- Handle redirected statement treesitter node in bash permissions
- Remove special case handling for Google Vertex Anthropic provider in response generation
- Exclude chat models from textVerbosity setting
