# PWA Offline Strategy & Action Classification

## Overview
This document outlines the offline action classification, payment/signing action exclusions, and duplicate replay protection policies for ChenPilot Client.

## Restricted Offline Action Classification
- **Payment & Signing Actions**: Actions such as `send_payment`, `sign_transaction`, `transfer`, and `sign` are strictly excluded from offline queuing by default to prevent unsafe replays after connectivity returns.
- **Supported Actions**: Read operations, preference synchronization, and non-state-changing metadata updates are eligible for offline queuing.

## Duplicate Replay Protection
All queued operations maintain unique identifiers (`id`) to prevent duplicate replays upon reconnection.
