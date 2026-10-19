# PWA Offline Strategy & Operation Queueing

## Overview
This document outlines the offline strategy and queueing mechanics for safe replay of operations once connectivity is restored.

## Operation Classification
To prevent unsafe execution of non-idempotent or financial transactions, offline queueing classifies operations:
- **Queueable**: General chat, portfolio queries, and idempotent read/assistant tasks.
- **Non-Queueable (Excluded by default)**: Payment requests, transaction signing, transfers, and account deployments.

## Duplicate Replay Protection
Operations are normalized (trimmed and lowercased) before queueing to prevent duplicate items from being added and replayed redundantly.