# Embeddable React Widget

## Purpose

This example demonstrates the embeddable React widget used by Silver Agent. The widget is designed to be installed on a customer website through a small script snippet, then loaded from a hosted JavaScript bundle.

The goal of this example is to show how Silver Agent can be distributed as a SaaS-style website assistant without requiring customers to build their own frontend integration.

## What This Demonstrates

This example shows:

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
