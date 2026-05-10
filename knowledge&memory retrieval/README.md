# Knowledge and Memory Retrieval

## Purpose

This example demonstrates how Silver Agent builds context before generating an AI response.

Instead of sending the user’s message directly to the AI model, the backend gathers two types of context:

1. **Knowledge context** from trusted Medicare-related content
2. **Memory context** from the current conversation

The goal is to help the assistant provide more accurate, consistent, and useful responses while keeping the prompt size manageable.

## What This Demonstrates

This example shows:

- Retrieval-augmented generation architecture
- Separating trusted knowledge from user conversation memory
- Retrieving recent conversation turns by `chatId`
- Summarizing older turns to avoid unlimited prompt growth
- Keeping retrieval logic on the backend instead of in the widget
- Preparing model input without exposing private implementation details

## Key Files

```txt
backend/src/utils/query/
    /memory
        getSummaries.js
        getTurns.js
    docAnalyzer.js
    search.js
```
