# Knowledge and Memory Retrieval

## Purpose

This example demonstrates how Silver Agent operates the RAG flow before generating an AI response and how the turns are saved to create short-term memory.

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
        turnSummarizer.js
    docAnalyzer.js
    search.js
```

## Design Notes

### Knowledge and Memory Are Different

Knowledge context is approved information the assistant can use to answer.

Memory context is conversation history that helps the assistant understand the user’s current question.

Keeping them separate makes the system easier to reason about and safer to maintain.

### Retrieval Runs on the Backend

The widget does not search the knowledge base or store conversation memory. It only sends the user message and chat ID.

The backend controls retrieval, memory, prompt construction, and persistence.

### Context Should Be Curated

More context is not always better. The retrieval layer should return only the most relevant snippets, and the memory layer should keep the prompt focused on recent or summarized conversation details.

### Why This Matters

This module demonstrates the difference between a simple chatbot and a structured AI application.

Silver Agent uses retrieval and memory to help the assistant answer with relevant context, maintain conversation continuity, and avoid unnecessary guessing.

### This example highlights:

Retrieval-augmented generation
Conversation memory
Prompt context assembly
Backend-controlled AI orchestration
Mock-safe showcase data
Prompt-size management
Separation between trusted knowledge and chat history
