# Agentic Mesh Protocol (AMP)

*A lightweight, JSON‑based messaging framework for distributed, role‑aware, memory‑enhanced communication between autonomous distributed agents.*

**Version:** Draft v0.1  
**Author:** Jamin Quimby  
**Last Updated:** 

## Abstract

The Agentic Mesh Protocol (AMP) introduces the MemoryGram—a portable, partial memory snapshot that lets agents share relevant context without centralising live memory. AMP adapts the classic SOAP 1.2 envelope (Header + Body) to JSON and adds the MemoryGram section for context exchange.

## Status of this Document

This repository hosts a Working Draft. Breaking changes are expected until v1.0 is tagged.

Contributions are welcome—see [Contributing](#contributing).

## Conformance

The key words MUST, SHALL, SHOULD, MAY, etc. are to be interpreted as described in [RFC 2119](https://tools.ietf.org/html/rfc2119).

## Table of Contents

1. [Introduction](#1-introduction)
2. [Protocol Overview](#2-protocol-overview)
3. [MemoryGram Model](#3-memorygram-model)
4. [Security Considerations](#4-security-considerations)
5. [Extensibility and Routing](#5-extensibility-and-routing)
6. [Getting Started](#getting-started)
7. [Contributing](#contributing)
8. [Normative References](#normative-references)
9. [Informative References](#informative-references)
10. [License](#license)

## 1 Introduction

AMP is designed for:

- **Role‑aware routing** – messages include agent roles for semantic routing.
- **Context continuity** – partial memory snapshots avoid global state.
- **Secure interoperability** – multilayer encryption options (field, section, BYOE).

### 1.1 Relationship to SOAP 1.2

AMP reuses the envelope/header/body model from SOAP 1.2 Part 1 but serialises it as JSON and layers the MemoryGram on top.

### 1.2 Terminology

| Term | Meaning |
|------|---------|
| Agent | Autonomous software entity exchanging AMP messages. |
| MemoryGram | JSON‑encoded, partial memory snapshot. |
| RoutingIntent | Directive for intermediaries (e.g. delegate, broadcast). |
| TTL | Hop‑count before message expiry. |

## 2 Protocol Overview

An AMP message has three top‑level members:

```json
{
  "Envelope": {
    "Header": { /* metadata */ },
    "Body":   { /* task & payload */ },
    "MemoryGram": { /* context snapshot */ }
  }
}
```

### 2.1 Header

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| messageId | string | ✓ | Globally unique identifier. |
| traceId | string | ✓ | Correlates linked messages. |
| roles | array | ✓ | Actor roles (e.g. ["planner","vendor"]). |
| routingIntent | string | ✓ | How intermediaries handle the message. |
| ttl | integer | ✓ | Hop count before expiry. |
| encryption | object | — | Strategy metadata (BYOE, keys, etc.). |

### 2.2 Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| task | string | ✓ | Task name or identifier. |
| expectedOutput | array | ✓ | Outputs the sender requires. |
| context | object | — | Arbitrary task parameters. |

### 2.3 MemoryGram

Portable snapshot of local memory (graph form):

```json
"MemoryGram": {
  "nodes": [
    {
      "id": "plan-123",
      "type": "plan",
      "metadata": { "importance": 0.95, "decay": 0.1 }
    }
  ],
  "edges": [
    {
      "source": "plan-123",
      "target": "budget-req",
      "weight": 0.8,
      "context": "derived from"
    }
  ],
  "mode": "snapshot",
  "encoding": "json"
}
```

## 3 MemoryGram Model

### 3.1 Nodes

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique node ID. |
| type | string | Category (e.g. plan, issue). |
| metadata | object | Arbitrary key‑values (importance, decay, etc.). |

### 3.2 Edges

| Field | Type | Description |
|-------|------|-------------|
| source | string | Source node ID. |
| target | string | Target node ID. |
| weight | number | Strength (0‒1). |
| context | string | Optional label. |

### 3.3 Lifecycle

1. **Generate** – built locally via confidence queries.
2. **Transmit** – included in the envelope.
3. **Interpret** – recipient treats as hints not mandates.
4. **Decay/Reinforce** – recalculated independently per agent.

## 4 Security Considerations

AMP supports three encryption levels:

1. **Field‑level** – encrypt individual fields:
   ```json
   "draftPlan🔐": { "encryptedFor": "legal" }
   ```

2. **Section‑level** – encrypt MemoryGram wholesale.

3. **BYOE** – integrate custom key management or envelopes (JWE, KMS URIs, etc.).

## 5 Extensibility and Routing

- Define new `routingIntent` keywords via module docs.
- Extend MemoryGram metadata without breaking receivers (must‑ignore rule).
- Bind AMP over HTTP, AMQP, gRPC & other transports.

## Normative References

- [SOAP Version 1.2 Part 1: Messaging Framework](https://www.w3.org/TR/soap12-part1/) – W3C Rec.
- [RFC 2119](https://tools.ietf.org/html/rfc2119) – Key Words for Requirement Levels.
- [RFC 8259](https://tools.ietf.org/html/rfc8259) – The JSON Data Interchange Format.

## Informative References

- [JSON‑LD 1.1](https://www.w3.org/TR/json-ld11/)
- Agentic AI Messaging Patterns (forthcoming)

## License

Copyright © 2025 Jamin Quimby

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

https://www.apache.org/licenses/LICENSE‑2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
