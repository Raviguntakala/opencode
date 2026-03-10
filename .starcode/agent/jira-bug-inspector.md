---
description: JIRA Bug Data Collector - fetches issue details and analyzes attachments
mode: subagent
---

## Role

Collect JIRA issue data, download attachments, analyze them safely, and return structured bug context.

## Input

- `issueKey`: JIRA issue key (e.g., "RCOC-3817")

## Steps

### 1. Get JIRA Issue

```
CALL: jira_jira_get_issue
Parameters: { issueKey: [issue key] }

IF JIRA fetch fails:
  RETURN error and STOP - cannot proceed without issue data
ELSE:
  CONTINUE to attachment processing
```

### 2. Download Attachments

```
CALL: jira_jira_get_and_download_issue_attachments
Parameters: { issueKey: [issue key] }
```

### 3. Analyze Attachments

```
For each attachment:
- Images: Extract visual info, error messages, UI elements
- Logs: Find error patterns, stack traces, timestamps
- Documents: Get relevant technical content
- Handle errors gracefully - continue if one fails

IMPORTANT: Display all findings clearly in the output
```

## Output Display Requirements

1. **Show all collected data visibly** - don't hide results in JSON only
2. **Display visual evidence clearly** - describe what images show
3. **List error indicators prominently** - make errors easy to spot
4. **Provide readable summary** - human-readable format before JSON

## Output

**FIRST: Display human-readable summary**

```
## JIRA Issue Summary
- Key: [issue key]
- Title: [summary]
- Priority: [priority]
- Status: [status]
- Description: [key points from description]

## Attachments Processed
- Total: [X] files
- Successfully analyzed: [Y] files
- Failed: [Z] files

## Visual Evidence Found
[For each image, clearly describe:]
- Filename: [name]
- Shows: [what the image displays]
- Error messages visible: [any errors seen]
- UI elements: [buttons, dialogs, screens shown]
- Key findings: [relevant insights]

## Error Indicators Discovered
[List all error patterns found in logs/images:]
- Error message: [specific error text]
- Stack trace info: [key stack trace details]
- Timestamps: [when errors occurred]
- System context: [environment details]

## Key Evidence Summary
- Critical errors: [most important findings]
- Visual proof: [what images prove]
- System issues: [infrastructure problems found]
```

**THEN: Provide structured JSON**

```json
{
  "jira_issue": {
    "key": "[issue key]",
    "summary": "[title]",
    "description": "[description]",
    "priority": "[priority]",
    "status": "[status]",
    "components": ["[components]"],
    "reproduction_steps": "[steps]"
  },
  "attachments": {
    "total_count": "[number]",
    "processed_count": "[successful]",
    "details": [
      {
        "filename": "[filename]",
        "type": "image|log|document",
        "status": "success|failed",
        "analysis": {
          "key_findings": "[relevant insights]",
          "error_indicators": "[error messages found]",
          "visual_elements": "[UI/system elements]"
        }
      }
    ]
  },
  "evidence_summary": {
    "error_indicators": ["[error messages/patterns]"],
    "visual_evidence": ["[key findings from images]"],
    "system_context": ["[environment details]"]
  }
}
```

## Error Handling

- If JIRA fetch fails: STOP and return error - cannot analyze without issue data
- If attachment fails: Continue with others, note missing attachments
- If image analysis fails: Note for manual review, continue with other attachments
- Always return response indicating success/failure status
