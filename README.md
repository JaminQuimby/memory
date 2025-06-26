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


# 2 Protocol Overview

An AMP message has three top-level members:

```json
{
  "Envelope": {
    "Header": { /* metadata */ },
    "Body": { /* task & payload */ },
    "MemoryGram": { /* context snapshot */ }
  }
}
```

## 2.1 Header

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| messageId | string | ✓ | Globally unique identifier. |
| traceId | string | ✓ | Correlates linked messages. |
| roles | array | ✓ | Actor roles (e.g. ["planner","vendor"]). |
| routingIntent | string | ✓ | How intermediaries handle the message. |
| ttl | integer | ✓ | Hop count before expiry. |
| encryption | object | — | Strategy metadata (BYOE, keys, etc.). |

## 2.2 Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| task | string | ✓ | Task name or identifier. |
| expectedOutput | array | ✓ | Outputs the sender requires. |
| context | object | — | Arbitrary task parameters. |

## 2.3 MemoryGram

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

# 3 MemoryGram Model

## 3.1 Nodes

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique node ID. |
| type | string | Category (e.g. plan, issue). |
| metadata | object | Arbitrary key-values (importance, decay, etc.). |

## 3.2 Edges

| Field | Type | Description |
|-------|------|-------------|
| source | string | Source node ID. |
| target | string | Target node ID. |
| weight | number | Strength (0-1). |
| context | string | Optional label. |

## 3.3 Lifecycle

1. **Generate** – built locally via confidence queries.
2. **Transmit** – included in the envelope.
3. **Interpret** – recipient treats as hints not mandates.
4. **Decay/Reinforce** – recalculated independently per agent.

# 4 AMP Processing Model

The Agentic Mesh Protocol (AMP) defines a distributed processing model in which an AMP message originates from an initial sender and is delivered to an ultimate receiver through zero or more intermediaries. This model supports a variety of message exchange patterns, including one-way messages, request/response interactions, and peer-to-peer conversations.

This section specifies how an AMP node processes a single AMP message in isolation, without maintaining state or correlation between multiple messages. Coordination of multi-message exchanges is the responsibility of higher-level protocols or features built on top of AMP.

Section 5 describes AMP's extensibility model and how extensions may interact with the processing model and transport bindings. Section 6 defines the protocol binding framework, which governs how AMP messages are exchanged over different transport protocols.

## 4.1 AMP Nodes

An AMP node is any entity that sends, receives, or forwards AMP messages. It may act as an initial sender, an ultimate receiver, or an intermediary. Each AMP node is identified by a unique URI.

Each AMP node MUST process messages according to the AMP processing model defined in this section and throughout this specification.

## 4.2 AMP Roles and Nodes

When processing a message, an AMP node acts in one or more roles, each identified by a URI known as the AMP role name. The roles assumed by a node MUST remain constant during processing of a given message.

This specification defines several core roles:

| Role Name | URI | Description |
|-----------|-----|-------------|
| next | `urn:agentic:mesh:role:next` | Role assumed by all intermediaries and ultimate receivers. |
| none | `urn:agentic:mesh:role:none` | Role that nodes MUST NOT act in. |
| ultimateReceiver | `urn:agentic:mesh:role:ultimateReceiver` | Role assumed by the final message recipient. |

Other role names MAY be defined as needed by applications or extensions.

AMP role names primarily identify the role(s) a node plays during message processing; they do not directly imply routing or delivery semantics. For example, AMP roles MAY be named with a URI useable to route AMP messages to an appropriate AMP node. Conversely, it is also appropriate to use AMP roles with names that are related more indirectly to message routing (e.g., `http://example.org/banking/anyAccountMgr`) or which are unrelated to routing (e.g., a URI meant to identify "all cache management software").

With the exception of the three AMP role names defined above, this specification does not prescribe the criteria by which a given node determines the set of roles in which it acts on a given message. For example, implementations can base this determination on factors including, but not limited to: hard coded choices in the implementation, information provided by the underlying protocol binding (e.g., the URI to which the message was physically delivered), or configuration information provided by users during system installation.

## 4.3 Targeting Header Blocks

AMP header blocks MAY specify a role attribute to target the block at nodes operating in that role.

A header block is considered targeted at an AMP node if the node acts in a role matching the header block's role attribute. The role attribute is specified in the JSON header block structure as:

```json
{
  "type": "headerBlockType",
  "role": "urn:agentic:mesh:role:next",
  "mustUnderstand": true,
  "relay": false,
  "content": { ... }
}
```

Header blocks targeted at the `none` role MUST NOT be processed. Such AMP header blocks MAY carry data that is required for processing of other AMP header blocks. Unless removed by the action of an intermediary (see 2.7 Relaying Messages), such blocks are relayed with the message to the ultimate receiver.

Untargeted or non-understood header blocks MAY be relayed to ultimate receivers unless removed by intermediaries.

## 4.4 Understanding Header Blocks

An AMP node is said to understand a header block if it has been implemented to fully conform to and implement the semantics specified for the header block's type identifier.

Header blocks MAY carry a `mustUnderstand` attribute set to `true`, making them mandatory:

```json
{
  "type": "criticalProcessing",
  "role": "urn:agentic:mesh:role:next",
  "mustUnderstand": true,
  "content": { ... }
}
```

Mandatory AMP header blocks are presumed to somehow modify the semantics of other AMP header blocks or the message body. Therefore, for every mandatory AMP header block targeted to a node, that node MUST either process the header block according to its specification or not process the AMP message at all, and instead generate a fault. Tagging AMP header blocks as mandatory thus assures that such modifications will not be silently (and, presumably, erroneously) ignored by an AMP node to which the header block is targeted.

An AMP node MUST either process every mandatory header block targeted at it or generate a fault with code `amp:MustUnderstand`. Ignoring mandatory header blocks is not permitted.

The `mustUnderstand` attribute is not intended as a mechanism for detecting errors in routing, misidentification of nodes, failure of a node to serve in its intended role(s), etc. This specification therefore does not require any fault to be generated based on the presence or value of the `mustUnderstand` attribute on an AMP header block not targeted at the current processing node.

## 4.5 Structure and Interpretation of AMP Bodies

An ultimate AMP receiver MUST correctly process the message body according to the semantics agreed upon by communicating agents. The message body is represented as a JSON object within the AMP message envelope:

```json
{
  "Envelope": {
    "Header": {
      "messageId": "msg-12345",
      "traceId": "trace-abc",
      "roles": ["planner", "vendor"],
      "routingIntent": "direct",
      "ttl": 10
    },
    "Body": {
      "task": "processRequest",
      "expectedOutput": ["status", "result"],
      "context": {
        "priority": "high",
        "deadline": "2025-06-27T10:00:00Z"
      }
    },
    "MemoryGram": { ... }
  }
}
```

With the exception of AMP faults, this specification mandates no particular structure or interpretation of the body content beyond the required fields (`task` and `expectedOutput`), and provides no standard means for specifying the processing to be done. The body content is determined by the agreement between communicating agents or by higher-level protocols built on AMP.

AMP nodes MAY make reference to any information in the AMP envelope when processing the message body or AMP header blocks. For example, a caching function can cache the entire AMP message, if desired.

## 4.6 Processing MemoryGram

The MemoryGram component provides contextual information to assist in message processing but does not mandate specific processing behavior. AMP nodes SHOULD process MemoryGram data according to the following principles:

1. **Treat as hints, not mandates**: MemoryGram data provides context and suggestions but does not override explicit message processing rules.

2. **Independent interpretation**: Each node interprets MemoryGram data according to its own capabilities and policies.

3. **Optional processing**: Nodes MAY ignore MemoryGram data entirely without affecting message validity.

4. **Context integration**: When processed, MemoryGram data SHOULD be integrated with the node's local memory and context.

5. **Privacy preservation**: Nodes SHOULD respect the privacy implications of MemoryGram data and handle it according to their security policies.

MemoryGram processing MAY influence how nodes interpret the message body, select processing strategies, or generate responses, but MUST NOT change the fundamental semantics of the message processing model.

## 4.7 Message Processing Rules

This section sets out the rules by which AMP messages are processed. Nothing in this specification prevents the use of optimistic concurrency, roll back, or other techniques that might provide increased flexibility in processing order. Unless otherwise stated, processing of all generated AMP messages, AMP faults and application-level side effects MUST be semantically equivalent to performing the following steps separately, and in the order given:

1. **Validate message structure**: Ensure the message conforms to the AMP envelope structure with required Header, Body, and MemoryGram components.

2. **Determine the roles** the node acts in for this message. The contents of the AMP envelope, including Header fields, Body content, and MemoryGram data, MAY be inspected in making such determination.

3. **Process Header requirements**: Validate required Header fields (messageId, traceId, roles, routingIntent, ttl) and process any routing or security directives.

4. **Check TTL**: Decrement the ttl value and generate a fault with code `amp:TTLExpired` if the value reaches zero before processing completes.

5. **Identify all mandatory header blocks** targeted at the node (if using extended header block processing).

6. **Check understanding**: If one or more of the AMP header blocks identified in the preceding step are not understood by the node, then generate a single AMP fault with code `amp:MustUnderstand`. If such a fault is generated, any further processing MUST NOT be done. Faults relating to the contents of the message body MUST NOT be generated in this step.

7. **Process MemoryGram**: Optionally process the MemoryGram according to section 4.6, integrating context information as appropriate.

8. **Process Body and any header blocks**: Process the message Body according to the specified task and any AMP header blocks targeted at the node. An AMP node MAY also choose to process non-mandatory AMP header blocks targeted at it.

9. **Relay if required**: In the case of an AMP intermediary, and where the AMP message exchange pattern and results of processing (e.g., no fault generated) require that the AMP message be sent further along the message path, relay the message as described in section 4.8 Relaying Messages.

In all cases where an AMP header block is processed, the AMP node MUST understand the AMP header block and MUST do such processing in a manner fully conformant with the specification for that header block. The successful processing of one header block does not guarantee successful processing of another block with the same type within the same message: the specification for the header block determines the circumstances in which such processing would result in a fault.

**Fault Generation**: Failure is indicated by the generation of a fault. AMP message processing MAY result in the generation of an AMP fault; more than one AMP fault MUST NOT be generated when processing an AMP message.

A message may contain or result in multiple errors during processing. Except where the order of detection is specifically indicated, an AMP node is at liberty to reflect any single fault from the set of possible faults prescribed for the errors encountered. The selection of a fault need not be predicated on the application of the "MUST", "SHOULD" or "MAY" keywords to the generation of the fault, with the exception that if one or more of the prescribed faults is qualified with the "MUST" keyword, then any one fault from the set of possible faults MUST be generated.

**Processing Order**: The processing of one or more AMP header blocks MAY control or determine the order of processing for other AMP header blocks and/or the message body. In the absence of such a controlling AMP header block, the order of header and body processing is at the discretion of the AMP node. Header blocks MAY be processed in arbitrary order. Header block processing MAY precede, MAY be interleaved with, or MAY follow processing of the message body.

The order of processing header blocks and the body is at the node's discretion unless overridden by extensions.

Generate faults when processing errors occur. Only one fault per message is permitted.

## 4.8 Relaying Messages

AMP messages flow from initial senders to ultimate receivers via intermediaries. While AMP does not define routing or forwarding semantics, such features MAY be specified by extensions.

AMP defines two different types of intermediaries:

- **Forwarding intermediaries**: Process and relay messages without significantly changing content beyond what is required by the AMP processing model.
- **Active intermediaries**: May modify messages, add or remove headers, or perform other processing (e.g., security, annotations) not described by inbound headers.

### 4.8.1 Relaying Header Blocks

The relaying of AMP header blocks targeted at an intermediary AMP node depends on whether the AMP header blocks are processed or not by that node. An AMP header block is said to be **reinserted** if the processing of that header block determines that the header block is to be reinserted in the forwarded message. The specification for an AMP header block may call for the header block to be relayed in the forwarded message if the header block is targeted at a role played by the AMP intermediary, but not otherwise processed by the intermediary. Such header blocks are said to be **relayable**.

An AMP header block MAY carry a `relay` attribute. When the value of such an attribute is `true`, the header block is said to be relayable:

```json
{
  "type": "cachingHint",
  "role": "urn:agentic:mesh:role:next",
  "relay": true,
  "content": { "cacheable": true }
}
```

When forwarding, intermediaries:

- Remove processed mandatory header blocks
- Remove non-relayable header blocks targeted at the intermediary but ignored during processing
- Retain relayable header blocks targeted at the intermediary but ignored during processing

The `relay` attribute has no effect on AMP header blocks targeted at a role other than one assumed by an AMP intermediary.

The `relay` attribute has no effect on the AMP processing model when the header block also carries a `mustUnderstand` attribute with a value of `true`.

The `relay` attribute has no effect on the processing of AMP messages by the ultimate AMP receiver.

**AMP Node Forwarding Behavior Table:**

| Role | Header Block | | |
|------|--------------|---|---|
| **Type** | **Assumed** | **Understood & Processed** | **Forwarded** |
| next | Yes | Yes | No, unless reinserted |
| next | Yes | No | No, unless relay=true |
| user-defined | Yes | Yes | No, unless reinserted |
| user-defined | Yes | No | No, unless relay=true |
| user-defined | No | n/a | Yes |
| ultimateReceiver | Yes | Yes | n/a |
| ultimateReceiver | No | n/a | n/a |
| none | No | n/a | Yes |

### 4.8.2 AMP Forwarding Intermediaries

The semantics of AMP Header fields, MemoryGram content, or the AMP message exchange pattern used, MAY require that the AMP message be forwarded to another AMP node on behalf of the initiator of the inbound AMP message. In this case, the processing AMP node acts in the role of an AMP forwarding intermediary.

Forwarding AMP intermediaries MUST process the message according to the AMP processing model defined in 4.7 Processing AMP Messages. In addition, when generating an AMP message for the purpose of forwarding, they MUST:

- Decrement the ttl value in the Header
- Update traceId to maintain correlation while indicating intermediary processing
- Preserve messageId to maintain message identity
- Remove all processed AMP header blocks (if using extended header processing)
- Remove all non-relayable AMP header blocks that were targeted at the forwarding node but ignored during processing
- Retain all relayable AMP header blocks that were targeted at the forwarding node but ignored during processing
- Process MemoryGram according to section 4.8.3 Relaying MemoryGram

Forwarding AMP intermediaries MUST also obey the specification for the AMP forwarding features being used. The specification for each such feature MUST describe the required semantics, including the rules describing how the forwarded message is constructed. Such rules MAY describe placement of inserted or reinserted AMP header blocks.

#### 4.8.2.1 Relayed JSON Structure

This section describes the behavior of AMP forwarding intermediaries with respect to preservation of the JSON structure properties of a relayed AMP message.

Unless overridden by the processing of AMP features at an intermediary, the following rules apply:

1. All JSON structure properties of a message MUST be preserved, except as specified in rules 2 through 14.

2. Header fields MAY be modified according to forwarding rules (ttl decrement, traceId updates).

3. Header block objects targeted at an intermediary MAY be removed from the headers array by that intermediary, as detailed in 4.8.2 AMP Forwarding Intermediaries.

4. Header block objects for additional header blocks MAY be added to the headers array as detailed in 4.8.2 AMP Forwarding Intermediaries.

5. MemoryGram content MAY be modified according to section 4.8.3 Relaying MemoryGram.

6. Additional properties MAY be added to the Header object for intermediary processing metadata.

7. AMP role attribute values that are present in header block objects may be transformed as appropriate for forwarding.

8. AMP `mustUnderstand` attribute values that are present in header block objects may be transformed as appropriate for forwarding.

9. AMP `relay` attribute values that are present in header block objects may be transformed as appropriate for forwarding.

10. The semantic meaning of the Body MUST be preserved unless explicitly modified by processed header blocks.

11. Additional metadata properties MAY be added to header blocks for intermediary processing tracking.

12. JSON property ordering MAY be changed during forwarding.

13. JSON formatting and whitespace MAY be changed during forwarding.

14. MemoryGram nodes and edges MAY be annotated with intermediary processing metadata.

**Note**: The rules above allow for signing of AMP Header fields, Body content, MemoryGram data, and combinations thereof. Care should be taken when implementing digital signatures to account for permitted JSON transformations.

### 4.8.3 Relaying MemoryGram

When forwarding AMP messages, intermediaries SHOULD handle MemoryGram data according to the following rules:

1. **Preservation**: By default, MemoryGram data SHOULD be preserved and forwarded unchanged.

2. **Annotation**: Intermediaries MAY add metadata to MemoryGram nodes or edges to indicate processing history:

```json
"MemoryGram": {
  "nodes": [
    {
      "id": "plan-123",
      "type": "plan",
      "metadata": {
        "importance": 0.95,
        "decay": 0.1,
        "processedBy": ["intermediary-node-1"],
        "processingTimestamp": "2025-06-26T14:30:00Z"
      }
    }
  ]
}
```

3. **Filtering**: Intermediaries MAY remove MemoryGram nodes or edges that violate security policies, but SHOULD preserve graph connectivity where possible.

4. **Augmentation**: Intermediaries MAY add new nodes or edges to the MemoryGram to provide additional context, but MUST clearly identify such additions.

5. **Privacy**: Intermediaries MUST respect privacy policies when processing MemoryGram data and SHOULD NOT expose sensitive information to unauthorized recipients.

### 4.8.4 AMP Active Intermediaries

In addition to the processing performed by forwarding AMP intermediaries, active AMP intermediaries undertake additional processing that can modify the outbound AMP message in ways not described in the inbound AMP message. That is, they can undertake processing not described by AMP header blocks in the incoming AMP message. The potential set of services provided by an active AMP intermediary includes, but is not limited to: security services, annotation services, and content manipulation services.

The results of such active processing could impact the interpretation of AMP messages by downstream AMP nodes. For example, as part of generating an outbound AMP message, an active AMP intermediary might have removed and encrypted some or all of the AMP header blocks found in the inbound AMP message.

It is strongly recommended that AMP features provided by active AMP intermediaries be described in a manner that allows such modifications to be detected by affected AMP nodes in the message path.

Extensions SHOULD describe such processing to allow downstream nodes to detect changes.

## 4.9 Versioning

The AMP message version is identified in the envelope structure. For AMP 1.0, the presence of the three-component structure (Header, Body, MemoryGram) indicates version 1.0:

```json
{
  "Envelope": {
    "Header": {
      "messageId": "msg-12345",
      "version": "1.0"
    },
    "Body": { ... },
    "MemoryGram": { ... }
  }
}
```

An AMP node determines whether it supports the version of an AMP message on a per-message basis. In this context "support" means understanding the semantics of that version of the AMP envelope. The versioning model is directed only at the AMP envelope structure. It does not address versioning of AMP header blocks, encodings, protocol bindings, or anything else.

An AMP node MAY support multiple envelope versions. However, when processing a message, an AMP node MUST use the semantics defined by the version of that message.

Nodes determine version support per message and MUST use semantics defined for the message version.

If an AMP node receives a message whose version is not supported, it MUST generate a fault with code `amp:VersionMismatch`. Any other malformation of the message construct MUST result in the generation of a fault with code `amp:Sender`.

If a message's version is unsupported, the node MUST generate a version mismatch fault.

## 4.10 AMP Fault Codes

AMP defines the following standard fault codes:

| Fault Code | Description |
|------------|-------------|
| `amp:MustUnderstand` | A mandatory header block was not understood by the processing node |
| `amp:VersionMismatch` | The message version is not supported by the processing node |
| `amp:Sender` | The message is malformed or contains invalid content from the sender |
| `amp:Receiver` | The processing node encountered an error while processing a valid message |
| `amp:TTLExpired` | The message time-to-live expired before processing could complete |
| `amp:InvalidMemoryGram` | The MemoryGram structure is malformed or contains invalid data |

Additional fault codes MAY be defined by extensions or applications as needed.
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
