# Agentic Mesh Protocol (AMP)

*A lightweight, JSON‑based messaging framework for distributed, role‑aware, memory‑enhanced communication between autonomous distributed agents.*

**Version:** Draft v0.1  
**Author:** Jamin Quimby  
**Last Updated:** 

## Abstract

The Agentic Mesh Protocol (AMP) is a lightweight protocol intended for exchanging structured information between autonomous, agentic entities in decentralized, distributed environments. Part 1: Messaging Framework defines an extensible messaging framework expressed in JSON, introducing a novel MemoryGram construct that enables agents to share partial memory snapshots and contextual information without requiring centralized memory storage.

This specification supports interoperable communication between heterogeneous Agentic Agents across organizational boundaries, building on foundational concepts from SOAP Version 1.2 while adapting them for modern distributed AI systems.

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

major design goals for AMP are **simplicity** and **extensibility**. To achieve these, AMP deliberately omits certain features commonly found in distributed systems, such as built-in reliability, security, correlation, routing, and Message Exchange Patterns (MEPs). While AMP defines core messaging semantics, many features are expected to be implemented as extensions or by complementary protocols.

The AMP specification is organized into three parts:

* The **AMP processing model**, defining rules for processing an AMP message (see Section 2).
* The **AMP extensibility model**, introducing concepts of AMP features and modules (see Section 3).
* The **AMP protocol binding framework**, describing rules for defining transport bindings to carry AMP messages (see Section 4).

The AMP message construct defines the structure of an AMP message (see Section 5).

An introductory primer is provided as a non-normative document to explain AMP's core concepts and typical usage scenarios.

## 1.1 Notational Conventions

The keywords **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are to be interpreted as described in RFC 2119.

## 1.2 Conformance

This specification describes data formats and rules for generating, exchanging, and processing AMP messages. Implementations claiming conformance MUST correctly implement all mandatory requirements expressed in this document that pertain to the features used. Implementations are not required to support all mandatory features if those features are not used in their message exchange scenarios.

AMP can be used as the basis for other technologies providing richer or more specialized services. Conformance rules for such technologies are outside the scope of this specification.

## 1.4 Relation to Other Specifications

An AMP message is specified as a JSON object following this protocol's envelope, header, body, and MemoryGram structure. While examples are shown in JSON, other serializations or encodings MAY be used provided they conform to AMP's processing rules and bindings.

AMP builds upon foundational concepts from SOAP Version 1.2, adapting them from XML to JSON and introducing agentic-specific constructs such as the MemoryGram.

## 1.5 Example AMP Message

```json
{
  "Envelope": {
    "Header": {
      "messageId": "AMP-001234",
      "traceId": "Q4-LAUNCH-871",
      "roles": ["planner", "vendor"],
      "routingIntent": "delegate",
      "ttl": 5,
      "encryption": {
        "type": "BYOE"
      }
    },
    "Body": {
      "task": "Execute Q4 launch",
      "expectedOutput": ["timeline", "approval"],
      "context": {
        "urgency": "high"
      }
    },
    "MemoryGram": {
      "nodes": [
        {
          "id": "plan-123",
          "type": "plan",
          "metadata": {
            "decay": 0.1,
            "importance": 0.95
          }
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
  }
}
```

## 1.6 Terminology

| Term | Meaning |
|------|---------|
| **Agent** | Autonomous software entity exchanging AMP messages. |
| **AMP Node** | A process or device that generates, receives, or relays AMP messages. |
| **MemoryGram** | JSON‑encoded, partial memory snapshot. |
| **RoutingIntent** | Directive for intermediaries (e.g. delegate, broadcast). |
| **TTL (Time-to-live)** | Hop‑count before message expiry. |


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
