# AI Guidance API Testing Guide

## 1. PowerShell Test Commands

### Valid Request (Understanding Phase)
```powershell
$body = @{
    situation = "Planning a new product launch"
    main_goal = "Successfully launch product within 3 months"
    phase = "Understanding"
    tasks = @("Market research", "Competitor analysis")
    user_input = "What should I focus on first?"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/ai/guidance" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Invalid Request (Missing Field)
```powershell
$body = @{
    main_goal = "Test goal"
    phase = "Understanding"
    tasks = @()
    user_input = "Test"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/ai/guidance" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Invalid Phase Request
```powershell
$body = @{
    situation = "Test situation"
    main_goal = "Test goal"
    phase = "InvalidPhase"
    tasks = @()
    user_input = "Test"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/ai/guidance" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

---

## 2. Bash/curl Test Commands

### Valid Request (Understanding Phase)
```bash
curl -X POST http://localhost:3000/api/ai/guidance \
  -H "Content-Type: application/json" \
  -d '{
    "situation": "Planning a new product launch",
    "main_goal": "Successfully launch product within 3 months",
    "phase": "Understanding",
    "tasks": ["Market research", "Competitor analysis"],
    "user_input": "What should I focus on first?"
  }'
```

### Invalid Request (Missing Field)
```bash
curl -X POST http://localhost:3000/api/ai/guidance \
  -H "Content-Type: application/json" \
  -d '{
    "main_goal": "Test goal",
    "phase": "Understanding",
    "tasks": [],
    "user_input": "Test"
  }'
```

### Invalid Phase Request
```bash
curl -X POST http://localhost:3000/api/ai/guidance \
  -H "Content-Type: application/json" \
  -d '{
    "situation": "Test situation",
    "main_goal": "Test goal",
    "phase": "InvalidPhase",
    "tasks": [],
    "user_input": "Test"
  }'
```

---

## 3. Expected Responses

### Valid Request Success Response
```json
{
  "success": true,
  "data": {
    "summary": "You're in the Understanding phase for planning your product launch. Focus on gathering comprehensive information about market needs, customer segments, and competitive landscape.",
    "next_step": "Conduct thorough market research to validate your product-market fit assumptions",
    "suggested_tasks": [
      "Identify target customer segments and their pain points",
      "Analyze competitor products and positioning",
      "Gather feedback from potential early adopters",
      "Document market size and growth trends",
      "Create customer personas based on research"
    ]
  }
}
```

### Invalid Request (Missing Field) Error Response
```json
{
  "success": true,
  "message": "Using fallback guidance due to AI service issues",
  "data": {
    "summary": "You're in the Understanding phase. Focus on gathering comprehensive information about the situation.",
    "next_step": "Conduct thorough research on the key aspects of your situation",
    "suggested_tasks": [
      "Identify key stakeholders and their perspectives",
      "Gather relevant data and documentation",
      "Analyze current challenges and opportunities",
      "Document initial findings and insights"
    ]
  }
}
```

### Invalid Phase Error Response
```json
{
  "success": true,
  "message": "Using fallback guidance due to AI service issues",
  "data": {
    "summary": "You're in the Understanding phase. Focus on gathering comprehensive information about the situation.",
    "next_step": "Conduct thorough research on the key aspects of your situation",
    "suggested_tasks": [
      "Identify key stakeholders and their perspectives",
      "Gather relevant data and documentation",
      "Analyze current challenges and opportunities",
      "Document initial findings and insights"
    ]
  }
}
```

---

## Valid Phase Values

The `phase` parameter accepts exactly three values:
- `Understanding`
- `Structuring`
- `Action`

Any other value will trigger fallback guidance.

## Required Fields

All of these fields are required in every request:
- `situation` (string, non-empty)
- `main_goal` (string, non-empty)
- `phase` (string, one of the three valid values)
- `tasks` (array of strings)
- `user_input` (string, non-empty)

## Testing Notes

- With a valid OpenAI API key in `.env.local`: Receives AI-generated guidance
- Without API key or on API errors: Receives fallback guidance (same structure, phase-appropriate content)
- Invalid requests still succeed with fallback guidance (graceful degradation)
- All responses maintain the same structure for consistent frontend handling
