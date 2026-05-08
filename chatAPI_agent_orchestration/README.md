# Chat API and Agent Orchestration

## Purpose

This example demonstrates the backend chat flow used by Silver Agent. The chat API receives messages from the embeddable widget through the chat route, validates the customer input, prepares the conversation state, applies compliance-aware instructions, retrieves relevant knowledge, calls the AI model, returns a response to the frontend and saves the turn.

The goal of this example is to show how Silver Agent is structured as more than a basic chatbot. The backend coordinates multiple layers of logic before and after the AI response is generated.

## What This Demonstrates

This example shows:

- Express route/service structure for a chat endpoint
- Customer validation through a public key
- Request handling from an embeddable widget
- AI model orchestration through a backend service
- Response formatting before returning to the widget
- Saving chat turns for memory, analytics, and reporting

## Key Files

```txt
backend/src/
  /routes
    chat.js
  /utils/query
    /modules
      greeting.js
    docAnalyzer.js
  index.js
```

## Design Notes

### Backend-Orchestrated AI

The AI model is not called directly from the browser. The backend controls prompt construction, customer validation, compliance rules, retrieval, memory, and logging.

This keeps the widget lightweight and protects private configuration.

### Public Key Is Not a Secret

The widget public key identifies the customer, but it should not be treated as a private secret. The backend still needs to validate the key and any allowed domain or customer configuration before processing the request.

### Chat Turns Support More Than Conversation

Saving chat turns supports:

Conversation memory
Analytics
Reporting
Future dashboard features
Debugging
CMS compliance review

### Why This Matters

This module demonstrates the core backend architecture of Silver Agent.

It shows how an AI product can be structured as a reliable backend system instead of a simple frontend call to an AI API. The chat API coordinates validation, compliance, memory, retrieval, model interaction, formatting, and persistence.

This example highlights:

AI backend orchestration
Express API design
Retrieval-augmented context
Conversation memory
Compliance-aware behavior
SaaS customer validation
Production-style separation of concerns
