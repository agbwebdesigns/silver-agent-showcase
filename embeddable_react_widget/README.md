# Embeddable React Widget

## Purpose

This example demonstrates the embeddable React widget used by Silver Agent. The widget is designed to be installed on a customer website through a small script snippet, then loaded from a hosted JavaScript bundle.

The goal of this example is to show how Silver Agent can be distributed as a SaaS-style website assistant without requiring customers to build their own frontend integration.

## What This Demonstrates

- How a lightweight script can embed a React application into a third-party website
- How the widget creates its own DOM mount point
- How the widget reads customer configuration, such as a public key
- How the chat UI sends messages to the backend API
- How the widget maintains basic conversation state
- How the chat UI works

## Key Files

```txt
frontend/src/
  index.html
  index.jsx
  App.jsx
  ChatBox.jsx
  rollup.widget.config.js
```

## Design Notes

### Customer-Friendly Installation

The widget is designed so customers do not need to understand React, Node, or the backend architecture. They only need to add a small script snippet to their website.

### Separation from the Customer Website

The widget creates its own mount point and manages its own UI state. This keeps the integration lightweight and reduces the chance of interfering with the customer’s existing website structure.

### Public Key Validation

The public key is not a secret. It is used to identify the customer account and route requests to the correct backend configuration. Server-side validation is still required to prevent unauthorized or misconfigured usage.

### API-Driven Chat

The widget does not contain the AI logic itself. It sends user messages to the backend, where prompt construction, compliance rules, retrieval, memory, and response generation are handled.

### Why This Matters

This widget demonstrates more than a chat UI. It shows a product distribution model.

Silver Agent is designed to be embedded into customer websites as a hosted SaaS tool. The embeddable widget allows one backend and one hosted frontend bundle to serve multiple customer sites while keeping customer installation simple.
