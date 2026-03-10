#!/usr/bin/env bun

/**
 * Fetches the latest config.json schema from opencode.ai and updates .starcode/schema.json
 * This ensures the schema is always in sync with the latest OpenCode configuration
 */

const SCHEMA_URL = "https://opencode.ai/config.json"
const LOCAL_SCHEMA_PATH = ".starcode/schema.json"

async function updateSchema() {
  try {
    console.log("🔄 Fetching latest schema from", SCHEMA_URL)

    const response = await fetch(SCHEMA_URL)

    if (!response.ok) {
      throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`)
    }

    const schema = await response.json()

    console.log("✅ Schema fetched successfully")
    console.log("📝 Writing to", LOCAL_SCHEMA_PATH)

    await Bun.write(LOCAL_SCHEMA_PATH, JSON.stringify(schema, null, 2))

    console.log("✅ Schema updated successfully!")
  } catch (error) {
    console.error("❌ Failed to update schema:", error)
    process.exit(1)
  }
}

updateSchema()
