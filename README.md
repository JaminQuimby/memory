
> A lightweight, JSON-based messaging framework for distributed, role‑aware, memory‑enhanced communication between autonomous agents.

**Version:** Draft v0.1  
**Editors:** Jamin Quimby (author)
**Last Updated:** June 2025

---

## Abstract

The Agentic Mesh Protocol (AMP) is a lightweight, JSON‑native messaging framework designed to enable autonomous agents to exchange structured tasks, routing metadata, and decentralized graph snapshots (MemoryGrams) without relying on a central memory store. AMP leverages a simple frame structure comprising a Header with role‑aware routing, time‑to‑live controls, and extensible header blocks and a Body defining task payloads. By embedding immutable MemoryGrams alongside each message, AMP allows agents to share partial, portable immutable memory snapshots that can be extended on each hop. Transport‑agnostic and easily extensible through optional modules (e.g., attachments, decay policies, encryption), AMP supports HTTP/2 streaming, HTTP/1.1 multipart bindings, and secure BYOE encryption extensions. Part 1 of this specification defines the core messaging model and processing rules, providing a foundation for a modular, scalable, and resilient agentic agent communication ecosystem.

---

---

## Status of this Document

This is a Working Draft. It was produced by the AMP Incubator Working Group. Breaking changes may occur until the specification reaches Recommendation. Contributions and issues: linkedin.com/in/jaminquimby

---

## Conformance

The keywords **MUST**, **SHALL**, **SHOULD**, **MAY**, **RECOMMENDED**, **OPTIONAL** have the meanings defined in [RFC 2119].

---

## Short Table of Contents

1. Introduction
    
2. AMP Processing Model
    
3. AMP Extensibility Model
    
4. Protocol Binding Framework
    
5. AMP Message Construct
    
6. Use of URIs
    
7. Security Considerations
    
8. References  
    A. MemoryGram Model (Appendix)
    

---

## 1 Introduction

The **Agentic Mesh Protocol (AMP)** is a lightweight, JSON-native protocol intended for exchanging structured tasks, metadata, and decentralized cognitive memory snapshots in distributed agent networks. It uses standard JSON technologies to define an extensible messaging framework containing an frame construct that can be transported over a variety of bindings. The design is independent of any specific programming model or agent implementation.

AMP achieves two primary goals:

1. **Simplicity:** Provide a minimal core (frame, Header, Body, MemoryGrams)
    
2. **Extensibility:** Enable new capabilities—attachments, decay policies, security modules—as optional modules without altering the core.
    

This specification consists of:

1. **AMP Processing Model** (Section 2) — rules for processing a single AMP message in isolation.
    
2. **AMP Extensibility Model** (Section 3) — concepts of features and modules, and how extensions integrate.
    
3. **Protocol Binding Framework** (Section 4) — rules for defining transports (HTTP, HTTP/2, SMTP, AMQP, gRPC).
    
4. **AMP Message Construct** (Section 5) — JSON frame structure and field semantics.
    

Optional adjunct modules (e.g., multi-gram MemoryGrams, attachments, decayPolicy) are defined in Part 2.


### 1.1 Notational Conventions

This specification uses the keywords **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** as defined by [RFC 2119].

Data types (e.g., string, number, array, object) follow the JSON Schema vocabulary as described in [RFC 8259].

JSON Pointer notation (RFC 6901) is used to reference fields within examples.

All parts of this specification are normative unless explicitly marked as non-normative.
### 1.2 Conformance

This specification defines the JSON message formats and the rules for generating, exchanging, and processing AMP messages. It does not mandate the scope of any particular implementation, but **MUST** be implemented without violating any mandatory requirement.

To claim conformance with AMP Part 1, an implementation **MUST** correctly implement all **MUST** requirements in Sections 2–5 that pertain to its supported use cases. Implementations are not required to support every optional feature or module.

An implementation **MAY** support any number of optional adjunct modules defined in Part 2. To claim conformance to a module, the implementation **MUST** satisfy all mandatory requirements in that module’s specification.

Specifications or frameworks that build on AMP **MAY** provide richer or specialized services, but **MUST** remain consistent with the mandatory core requirements of Part 1. Conformance rules for such extensions are outside the scope of this document and should be defined by their own specifications.

AMP is designed to enable common agent messaging scenarios; non-normative examples are provided in Part 2.

### 1.3 Relation to Other Specifications

AMP messages are specified as JSON data structures rather than an XML Information Set. While examples may use JSON syntax, implementations MAY support alternate representations for transmitting AMP messages between nodes (see AMP Protocol Binding Framework).

Some information items defined by this document (see AMP Message Construct) are identified using namespace-qualified names. Refer to Table 1 for namespace identifiers defined herein.

Note: This specification uses the term JSON Expanded Name to refer to the pair {absolute URI reference, local-name} for a value representing a qualified name. Future specifications or errata may update terminology to align with evolving namespace recommendations.

AMP does not require JSON Schema processing for validation of element and attribute values defined in this specification. Values defined herein MUST be explicitly included in the transmitted AMP message except where noted otherwise (see AMP Message Construct).

AMP attribute types follow JSON Schema [JSON Schema] definitions. Unless stated otherwise, all lexical forms supported by JSON Schema are valid, and forms representing the same value are equivalent for AMP processing (e.g., boolean values true and 1 are treated equivalently). For brevity, examples in this document refer to one canonical form.

Applications carrying data not defined by this specification MAY specify additional validation steps. Schema language and validation technology choices are at the application’s discretion.

AMP uses JSON Pointer [RFC 6901] for referencing locations within AMP messages (see Use of URIs in AMP).

The media type "application/amp+json" SHOULD be used for JSON serializations of the AMP message model.

### 1.4 Example AMP Message

The following example shows a notification-style AMP message with three key components: an application-defined header block (`alertControl`) containing priority and expiration data, a Body payload (`alert`), and an immutable MemoryGrams snapshot. Intermediary nodes can use the header block to prioritize message forwarding, while any node along the path can inspect or relay the MemoryGrams data. MemoryGrams are immutable snapshots that any node can generate, annotate, encrypt, and relay following the same `role`, `mustUnderstand`, and `relay` rules that apply to header blocks.

```
{
  "frame": {
    "Header": {
      "messageId": "amp-1001",
      "traceId": "trace-alert-20250626",
      "roles": ["monitor","notifier"],
      "routingIntent": "broadcast",
      "ttl": 3,
      "headerBlocks": [
        {
          "type": "alertControl",
          "role": "urn:agentic:mesh:role:next",
          "mustUnderstand": true,
          "content": {
            "priority": 1,
            "expires": "2025-06-26T15:00:00Z"
          }
        }
      ]
    },
    "Body": {
      "task": "alert",
      "expectedOutput": ["acknowledgment"],
      "context": {
        "message": "Pick up Mary at school at 2pm"
      }
    },
    "MemoryGrams": [
        {
          "id": "alert-evt",
          "type": "event",
          "metadata": { "importance": 0.9, "decay": 0.05 },
           "role": "next",
          "encryption": { "scheme": "homomorphic", "keyId": "key-123" }
        }
      ]
    }
}
```
#### 1.4.1 Mixed-Content Example

To illustrate mixed content in AMP messages—interleaving text and structured payloads—a feature spec can define a `content` array in the Body (or any header block) as shown below:

```
{
  "frame": {
    "Body": {
      "content": [
        "System alert generated at 2025-06-26T15:00:00Z.
",
        {
          "type": "json",
          "payload": { "metric": "cpuUsage", "value": 92 }
        },
        "
Please investigate immediate spike.
",
        {
          "type": "image",
          "mediaType": "image/png",
          "data": "iVBORw0KGgoAAAANSUhEUgAAA..."
        }
      ]
    }
  }
}
```

In this pattern, plain text strings and typed objects co-exist in a single array, enabling rich mixed-content flows within a JSON-native AMP message.
### 1.5 Terminology

This section defines key terms and concepts used in this specification.

#### 1.5.1 Protocol Concepts

**AMP**  
The formal set of conventions governing the format, processing, and routing rules of AMP messages.

**AMP node**  
An entity that transmits, receives, processes, or forwards AMP messages, according to the AMP Processing Model (Section 2).

**AMP role**  
A function that an AMP node assumes when processing a message. Roles are represented by tokens (e.g., `next`, `ultimateReceiver`) that map to IRIs.

**AMP binding**  
A specification of how AMP messages are carried over an underlying transport protocol (Section 4). Examples include HTTP/1.1 multipart, HTTP/2 streaming, SMTP.

**AMP feature**  
An optional extension to the core messaging framework (Section 3), such as Attachments, DecayPolicy, or Encryption modules.

**AMP module**  
A self‑contained specification that defines the syntax, semantics, and processing rules for one or more AMP header blocks or MemoryGram behaviors.

**Message Exchange Pattern (MEP)**  
A template for a sequence of AMP messages between nodes (e.g., request-response, event-stream), specified as an AMP feature.

**AMP application**  
Software or agent framework that produces, consumes, or otherwise acts upon AMP messages in accordance with this specification.

#### 1.5.2 Data Encapsulation Concepts

**AMP message**  
The basic unit of communication between AMP nodes, represented as a JSON `frame` object.

**frame**  
The outermost JSON object of an AMP message containing `Header`, `Body`, and `MemoryGrams`.

**Header**  
A collection of routing metadata, roles, TTL, encryption settings, and optional header blocks.

**Header block**  
A JSON object within `headerBlocks` that carries extension data (e.g., `alertControl`), targeted at nodes by role and optional processing flags (`mustUnderstand`, `relay`).

**Body**  
A JSON object defining the task payload (`task`, `expectedOutput`, `context`).

**MemoryGram**  
A JSON object representing a partial memory snapshot (nodes, edges, metadata), carried alongside the message.

**AMP fault**  
A structured error object indicating processing failures (e.g., `amp:MustUnderstand`, `amp:TTLExpired`). Faults are delivered in lieu of normal response bodies.

#### 1.5.3 Message Sender and Receiver Concepts

**AMP sender**  
An AMP node that originates an AMP message.

**AMP receiver**  
An AMP node that accepts and processes an AMP message.

**Message path**  
The sequence of AMP nodes through which a message travels: initial sender, zero or more intermediaries, and an ultimate receiver.

**Initial sender**  
The AMP sender at the start of the message path.

**AMP intermediary**  
An AMP node that both receives and forwards a message, potentially processing header blocks and MemoryGrams.

**Ultimate receiver**  
The final AMP node in the message path that processes the `Body` and any header blocks targeted at it.

---

## ## 2 AMP Processing Model

AMP provides a distributed, role‑aware processing model in which an AMP message originates at an initial sender and travels to an ultimate receiver via zero or more intermediaries. This model can support multiple Message Exchange Patterns (MEPs) — one-way, request/response, event streams, and peer-to-peer conversations — implemented as AMP features (see Section 3).

This section defines the AMP Processing Model, specifying how an AMP node processes a single message in isolation, without retaining state or correlating across messages. Any multi‑message coordination (e.g., transaction lifecycles, retries) is delegated to higher‑level modules or MEP definitions.

Section 3 (AMP Extensibility Model) describes how features and modules integrate with the Processing Model. Section 4 (Protocol Binding Framework) defines how AMP messages are mapped onto diverse transports such as HTTP/2 streaming or SMTP.

### 2.1 AMP Nodes and Roles

An **AMP node** may be an initial sender, intermediary, or ultimate receiver. Each node is identified by a globally unique URI string. Nodes **MUST** process messages per this model.

AMP roles are represented as simple, case-sensitive tokens in JSON, and **MUST** map unambiguously to full IRIs. To keep JSON idiomatic, the spec defines the following core tokens and their corresponding IRIs:

|Token|IRI|Description|
|---|---|---|
|`next`|`urn:agentic:mesh:role:next`|Intermediaries and ultimate receivers.|
|`none`|`urn:agentic:mesh:role:none`|Nodes **MUST NOT** act in this role.|
|`ultimateReceiver`|`urn:agentic:mesh:role:ultimateReceiver`|Final message recipient.|

Additional role tokens **MAY** be defined by extensions. Implementations **MUST** resolve each token to its full IRI when applying routing or policy decisions.

Example:

```
"roles": ["next", "ultimateReceiver"]
```

Using bare tokens avoids XML-style URNs in JSON and aligns with practices in protocols like HTTP status codes or MQTT quality-of-service levels.

### 2.2 AMP Roles and Nodes

In processing an AMP message, an AMP node assumes one or more roles, each uniquely identified by a URI known as the AMP role identifier. Roles assigned to a node MUST remain invariant throughout the processing of an individual AMP message. This specification explicitly addresses the processing of single AMP messages and does not define node behavior concerning role variability across different messages.

Table 2 defines three standard AMP roles that carry special significance within AMP message processing:

Table 2: AMP Roles Defined by this Specification

|Short-name|Name|Description|
|---|---|---|
|next|"amp://role/next"|All AMP intermediaries and the ultimate AMP receiver MUST act in this role.|
|none|"amp://role/none"|AMP nodes MUST NOT assume this role.|
|ultimateReceiver|"amp://role/ultimateReceiver"|Only the ultimate AMP receiver MUST assume this role.|

Additional AMP role identifiers MAY be introduced to support specific application requirements.

AMP roles serve primarily to identify AMP nodes and their associated processing responsibilities. Unlike direct routing identifiers, AMP role identifiers do not inherently define routing or message exchange semantics. For instance, an AMP role identifier MAY be a URI used directly for routing AMP messages to the correct node, or it MAY serve an indirect or non-routing purpose, such as categorizing nodes by functional domain (e.g., "amp://example.org/finance/accountManager") or representing roles unrelated to routing (e.g., identifying caching services with a URI indicating idempotency and safe replay).

Beyond the three standard AMP roles defined in Table 2, this specification does not impose specific rules for determining the roles a node will assume for processing a given message. Implementations MAY decide roles based on static configuration, information from the underlying transport binding (such as delivery endpoint URIs), or dynamic system configuration set by administrators or users during deployment.

### 2.3 Targeting AMP Header Blocks

An AMP header block MAY include a role attribute (see AMP role Attribute) used to target the header block specifically at AMP nodes operating in the specified role. This specification refers to the value of the AMP role attribute as the AMP role associated with the corresponding AMP header block.

An AMP header block is considered targeted at an AMP node if the AMP role of the header block matches a role assumed by that AMP node. AMP header blocks targeted at the special role "amp://role/none" are never formally processed. Such AMP header blocks MAY contain data required for processing other AMP header blocks. Unless explicitly removed by an intermediary (see Relaying AMP Messages), these header blocks are relayed with the AMP message to the ultimate AMP receiver (see also AMP Modules).

### 2.4 Understanding AMP Header Blocks

Specifications defining various header functions (AMP modules) are anticipated to emerge over time (see AMP Modules), and some AMP nodes may implement software supporting one or more of these extensions. An AMP header block is understood by an AMP node if the software at that node is designed to fully adhere to and implement the semantics associated with the JSON-defined name of the outermost element of that header block.

An AMP header block MAY contain a mustUnderstand attribute (see AMP mustUnderstand Attribute). If the value of this attribute is set to "true", the AMP header block is considered mandatory.

Mandatory AMP header blocks typically modify the interpretation or handling of other AMP header blocks or the AMP body elements. Consequently, each mandatory AMP header block targeted at a node MUST be processed by that node, or the node MUST cease processing the AMP message entirely and generate a fault (see Processing AMP Messages and AMP Fault). Marking AMP header blocks as mandatory ensures that critical modifications will not be silently or erroneously ignored by the node targeted by the header block.

The mustUnderstand attribute is not designed to detect routing errors, misidentified nodes, or node role assignment failures. Any of these conditions might prevent proper processing of an AMP header block. This specification does not mandate the generation of faults based solely on the presence or value of the mustUnderstand attribute for AMP header blocks not targeted at the current processing node. Specifically, it is not considered an error for an ultimate AMP receiver to receive an AMP message containing a mandatory header block targeted at a role that the ultimate receiver does not assume. This scenario can occur if the header block persists due to routing or targeting errors at preceding intermediaries.

Only one fault per message; order of header and body processing is at node’s discretion unless extensions specify otherwise.

### 2.5 Structure and Interpretation of AMP Bodies

An ultimate AMP receiver MUST correctly process the immediate children of the AMP body (see AMP Body). However, with the exception of AMP faults (see AMP Fault), this specification does not mandate any particular structure or interpretation for these elements, nor does it provide a standard mechanism for defining their processing semantics.

### 2.6 Processing AMP Messages

This section defines the rules for processing AMP messages. Implementations MAY employ optimistic concurrency, rollbacks, or other techniques to allow flexibility in processing order. Unless otherwise specified, all AMP messages, AMP faults, and application-level side effects MUST produce results equivalent to executing the following steps in sequence:

1. Determine the set of roles the node will assume. The contents of the AMP frame, including any AMP header blocks and the AMP body, MAY be examined to inform this decision.
    
2. Identify all mandatory AMP header blocks targeted at the node (i.e., header blocks with mustUnderstand="true").
    
3. If any mandatory header block is not understood by the node, generate a single AMP fault with a code of "MustUnderstand". No further processing of the message is permitted after such a fault is raised. Faults regarding the AMP body content MUST NOT be generated in this step.
    
4. Process all mandatory AMP header blocks targeted at the node and, if the node is the ultimate AMP receiver, process the AMP body as well. Nodes MAY also choose to process non-mandatory header blocks targeted at them.
    
5. If the node is an intermediary and message exchange patterns require forwarding (for example, no fault was generated), relay the AMP message as described in Relaying AMP Messages.
    
6. When processing any header block, the node MUST understand and conform fully to the header block’s specification. Processing one header block does not guarantee processing another with the same name; header specifications determine fault conditions. Ultimate AMP receivers MUST process the AMP body consistent with section 2.5.
    
7. AMP faults indicate processing failures. A single AMP message MAY result in multiple error conditions, but only one fault MUST be generated. When several faults are possible, any one MAY be selected unless one is qualified with "MUST", in which case a fault from the set of "MUST" faults MUST be chosen.
    

Nodes MAY utilize any information within the AMP frame (headers or body) when processing. For example, caching functions MAY cache entire AMP messages.

Header and body processing order MAY be controlled by specific header blocks. In the absence of such control, nodes have discretion over processing order: header blocks MAY be processed before, interleaved with, or after body processing.

Note: These rules apply per node. Extensions may enforce ordering across multiple nodes along the message path, generating sender faults if header blocks survive past intended points based on mustUnderstand attributes.

### 2.7 Relaying AMP Messages

AMP messages originate at an initial AMP sender and traverse zero or more AMP intermediaries before reaching an ultimate AMP receiver. Although AMP does not define explicit routing or forwarding rules, such functionality can be specified via AMP features (see AMP Extensibility Model).

AMP distinguishes two intermediary types:

• Forwarding Intermediaries: These nodes transparently relay AMP messages without altering header or body content, except for removing or adding extensions as dictated by AMP features.

• Active Intermediaries: These nodes may inspect and process header blocks, modify message content, or inject new header blocks before forwarding to the next hop.

When relaying:

1. The intermediary MUST forward all header blocks not marked for removal by intermediary-specific rules.
    
2. The intermediary MAY remove header blocks targeted at its own roles once processed.
    
3. The intermediary MUST preserve message integrity and any mandatory header semantics unless a fault or modification is required by an AMP module.
    
4. After processing, the intermediary relays the message to the next node in the path, as determined by routing metadata in the AMP header.
    

Use of forwarding and active intermediaries allows flexible message distribution while maintaining AMP’s modular and decentralized processing model.

### 2.7.1 Relaying AMP Header Blocks

Relaying of AMP header blocks at intermediary nodes depends on whether those blocks are processed by the intermediary. A header block is considered reinserted if, after processing, the intermediary decides it should appear in the forwarded message. Some header block specifications may require that a block targeted at roles assumed by the intermediary be relayed even if not processed; such blocks are termed relayable.

An AMP header block MAY include a relay attribute (see AMP relay Attribute). When this attribute’s value is "true", the header block is relayable. Relayable header blocks are forwarded by forwarding intermediaries as described in section 2.7.2.

The relay attribute has no effect on header blocks not targeted at the intermediary’s roles, nor does it override mandatory (mustUnderstand) semantics. It also does not affect processing by the ultimate AMP receiver.

Table 3 summarizes an intermediary’s forwarding behavior for a header block:

|Role|Assumed by Node|Understood & Processed|Forwarded?|
|---|---|---|---|
|next|Yes|Yes|No, unless reinserted|
|next|No|n/a|Yes, if relay="true"|
|user-defined|Yes|Yes|No, unless reinserted|
|user-defined|No|n/a|Yes, if relay="true"|
|ultimateReceiver|Yes|Yes|n/a|
|none|No|n/a|Yes (always relayed)|

### 2.7.2 AMP Forwarding Intermediaries

When one or more AMP header blocks or the message exchange pattern require forwarding, the processing node acts as an AMP forwarding intermediary on behalf of the inbound message initiator.

AMP forwarding intermediaries MUST follow the AMP processing model defined in section 2.6 Processing AMP Messages. Additionally, when constructing a forwarded AMP message, they MUST:

1. Remove all AMP header blocks that have been processed by the intermediary.
    
2. Remove all non-relayable AMP header blocks targeted at this intermediary that were ignored during processing.
    
3. Retain all relayable AMP header blocks targeted at this intermediary that were ignored during processing.
    

Forwarding intermediaries MUST also comply with any AMP forwarding feature specifications in use. Each feature’s specification MUST describe the required semantics for constructing the forwarded message, including rules for inserting or reinserting header blocks. Header reinsertion may be indistinguishable from leaving blocks in place; this process emphasizes the need for each node on the path to explicitly handle relevant header blocks before forwarding.

### 2.7.2.1 Relayed Infoset

This section defines how AMP forwarding intermediaries handle the JSON structure of relayed messages when no additional feature processing overrides these rules:

1. Preserve all frame-level properties by default, except when explicitly removed by feature rules.
    
2. Remove header entries that have been processed by the intermediary.
    
3. Insert or reinstate header entries according to AMP feature specifications.
    
4. If the "headers" array is absent and features require header insertion, initialize an empty "headers" array.
    
5. Preserve all header properties (including role, mustUnderstand, and relay flags) unless a feature dictates removal.
    
6. Expand any qualified names into a standardized JSON representation (e.g., full URI plus local name).
    
7. Optional metadata fields such as "baseUri" or "charset" MAY be retained or omitted based on feature needs.
    
8. Additional application-specific properties in the frame or headers MAY be retained or pruned per feature rules.
    
9. For message signing, use a defined JSON canonicalization profile (e.g., RFC 8785) to ensure consistent encoding across nodes.
    
10. Mixed-content scenarios (interleaving text and objects) are not natively supported; features requiring such patterns should define explicit schema structures.
    

Note: These rules focus on JSON-native handling. AMP features should rely on clear, schema-driven definitions rather than legacy XML concepts.

### 2.7.3 AMP Active Intermediaries

Beyond the behavior of AMP forwarding intermediaries, active AMP intermediaries may perform additional transformations or enrichments to outgoing messages that are not strictly dictated by incoming header blocks. These capabilities can include, but are not limited to:

- **Security services**: e.g., signing, encryption, token injection
    
- **Annotation services**: e.g., adding audit metadata or trace information
    
- **Content manipulation services**: e.g., data masking, format conversion, enrichment
    

Active intermediaries may modify, remove, or insert header blocks and body fields as needed to implement these services. Such modifications can affect how downstream nodes interpret or process the message. Therefore:

1. **Feature Discovery**: Each active intermediary MUST include a machine-readable indicator (e.g., a header block or metadata field) describing the features it applied, so downstream nodes can detect and adapt to those changes.
    
2. **Idempotent Design**: Active intermediary operations SHOULD be idempotent or carry state markers to avoid repeated side effects when messages traverse multiple hops.
    
3. **Transparency Contracts**: AMP feature specifications for active services SHOULD define:
    
    - The exact locations and formats of injected metadata
        
    - Any header blocks or body sections that may be transformed or removed
        
    - Validation rules or schemas for downstream conformance checks
        

By standardizing these conventions in AMP feature specs, implementations ensure robust and interoperable message flows through active intermediaries.

### 2.8 AMP Versioning Model

Each AMP message includes a version identifier on the frame object. This version is expressed as a property within the frame, for example:

```
{
  "frame": {
    "version": "1.0",
    // ... other frame properties ...
  }
}
```

A node determines support for an AMP message version on a per-message basis. “Support” means understanding the frame semantics for that version. The AMP Versioning Model applies solely to the frame; it does not govern versioning of header blocks, protocol bindings, MemoryGrams, or other message elements.

Nodes MAY support multiple AMP versions but MUST process each message according to its declared version semantics.

When receiving a message with an unsupported version, a node MUST generate an AMP fault with the code `VersionMismatch`. Any other structural malformation of the message MUST result in a fault with the code `Sender`.

Feature specifications MAY define upgrade paths between versions (e.g., from 1.0 to 2.0) using an `Upgrade` header block and corresponding fault codes for version mismatch scenarios.

---

---

### 3. AMP Extensibility Model


AMP provides a lightweight messaging framework whose core design emphasizes extensibility. The mechanisms described below allow AMP to incorporate advanced capabilities found in richer messaging systems through modular feature definitions.

## 3.1 AMP Features

An AMP feature is an extension that adds specific capabilities to the core AMP messaging framework. Features may cover concerns such as reliability, security, correlation, routing, and various message exchange patterns (MEPs) like request/response, one-way, or peer-to-peer workflows.

AMP’s extensibility model supports two primary expression mechanisms:

- **AMP Processing Model** (see section 2): Defines how individual AMP nodes process messages and apply feature semantics via header blocks and frame properties.
    
- **AMP Protocol Binding Framework** (see section 4): Describes how AMP features map to underlying transport protocols and how nodes send/receive AMP messages over different bindings.
    

Under the Processing Model, nodes that implement one or more AMP features express those features within AMP header blocks. Each feature’s combined syntax and semantics form an AMP module (see section 3.3 AMP Modules). Header blocks for these modules can target any node or chain of nodes along an AMP message path.

The Protocol Binding Framework operates between adjacent AMP nodes. It allows different transport protocols (e.g., HTTP, HTTP/2, gRPC, MQTT) to support or enhance AMP features without requiring the same binding for every hop. When a binding defines features externally to the AMP frame, its specification must include rules for intermediary behavior. However, binding-level rules MUST NOT override the core Processing Model.

Where possible, end-to-end features SHOULD be implemented as AMP header blocks so they benefit from the standard Processing Model rules rather than relying solely on binding-specific extensions.

### 3.1.1 Requirements on Features

Any AMP feature specification MUST include:

- **Feature URI**: A unique URI to unambiguously name the feature for discovery and negotiation.
    
- **Node State**: Definitions of the state or configuration data each node requires to implement the feature.
    
- **Node Processing**: Detailed processing steps for each node, including error and failure handling pertaining to underlying transport behavior (see section 4.2 Binding Framework).
    
- **Inter-Node Data**: Specification of the data exchanged between nodes to support the feature.
    

Feature specifications for Message Exchange Patterns (see section 3.2) must also satisfy these requirements.

### 3.2 AMP Message Exchange Patterns (MEPs)

An AMP Message Exchange Pattern (MEP) is a feature that defines a template for message workflows between AMP nodes (e.g., request/response, publish/subscribe, or peer-to-peer interactions). MEPs are first-class AMP features and follow the same specification rules as other features.

MEP specifications MUST include:

1. **MEP URI**: A unique URI identifying the MEP.
    
2. **Exchange Lifecycle**: A description of the sequence and timing of messages (e.g., request followed by response to the original sender).
    
3. **Causal Relationships**: Definitions of temporal or causal links between messages exchanged under the pattern.
    
4. **Termination Semantics**: Rules for normal and abnormal completion of the exchange.
    
5. **Additional Messages**: Requirements to generate supplementary messages (such as acknowledgments or error notifications).
    
6. **Fault Handling**: Rules for delivering or processing AMP faults within the MEP context.
    

Underlying transport binding specifications MAY declare support for one or more named MEPs, but MUST NOT override the core AMP Processing Model.


3.3 AMP Modules

An AMP module defines the syntax and semantics of one or more AMP header blocks that implement zero or more AMP features. A module specification MUST adhere to the following rules:

- **Module URI**: MUST include a unique URI that identifies the module for discovery, negotiation, and registration.
    
- **Feature Declaration**: MUST list the AMP features (see section 3.1) that the module provides.
    
- **Header Block Definitions**: MUST fully specify the structure and semantics of each header block used by the module, including any extensions or modifications to the core Processing Model (section 2). Modules are free to extend or alter processing behavior as needed.
    
- **Abstract Property Mapping (Optional)**: MAY use property conventions (e.g., abstract feature properties) from AMP binding frameworks. When used, the module spec MUST clearly map abstract properties to their concrete representations in header block JSON structures.
    
- **Body Interactions**: MUST describe how the module affects or interacts with the AMP body content, including any ordering or execution dependencies. If the module transforms or replaces body elements, the spec MUST define the reversal or processing steps required by downstream nodes.
    
- **Module Interactions**: MUST specify any interactions or dependencies with other AMP modules and features, detailing expected processing order and combined semantics.
    

By following these rules, AMP modules provide a consistent mechanism to extend the protocol while preserving interoperability and clarity.

---

### 4. AMP Protocol Binding Framework
 

The AMP Protocol Binding Framework defines how AMP messages are carried over various transport protocols. A binding specification describes the mapping between AMP message structures and the underlying protocol, ensuring that feature semantics and message constructs are preserved across transports.

A binding specification MUST include:

- **Feature Support Declaration**: List the AMP features (see section 3.1) that the binding implements or enhances.
    
- **Transport Mapping**: Define how AMP frames, headers, bodies, and MemoryGrams are represented and transmitted using the underlying protocol’s constructs (e.g., HTTP headers, gRPC metadata, MQTT topics).
    
- **Feature Contract Enforcement**: Describe how the binding honors feature contracts—such as reliability, security, or MEP guarantees—using the transport’s native capabilities.
    
- **Failure Handling**: Specify how to detect, report, and recover from transport-level errors (e.g., connection drops, timeouts, protocol violations) in ways that align with AMP fault semantics.
    
- **Implementation Requirements**: Outline the requirements for conformant implementations, including mandatory headers/metadata, encoding rules, and version negotiation steps.
    

Bindings do not define a separate processing model; they integrate with the core AMP Processing Model (section 2) implemented by AMP nodes. A binding is always part of a node’s capabilities, not a standalone component.

By following this framework, new transports (e.g., WebSockets, QUIC, SMTP) can be added to AMP with consistent behavior and predictable integration across diverse network environments.

### 4.1 Goals of the Binding Framework

The binding framework aims to:

1. **Standardize Common Concepts**: Establish requirements and concepts shared by all AMP binding specifications.
    
2. **Promote Reuse**: Enable homogeneous descriptions for features supported across multiple bindings, reducing duplication and easing maintenance.
    
3. **Ensure Consistency**: Provide a consistent approach to specifying optional features regardless of transport.
    

Multiple bindings offering the same optional feature (e.g., reliable delivery) can leverage different mechanisms—one may rely on the transport’s native reliability, while another implements reliability via application logic. The binding framework ensures that applications experience a uniform interface to optional features, no matter which binding is used.

### 4.2 AMP Binding Framework State Model

AMP message exchange across nodes—including initial senders, intermediaries, and ultimate receivers—is modeled as a distributed state machine. Each node maintains local state that may include:

- **Outgoing Message Buffer**: AMP frame, headers, body, and MemoryGrams being assembled for transmission.
    
- **Incoming Message Buffer**: Partial or complete AMP messages received and awaiting processing.
    
- **Feature State**: Data or configuration (e.g., retry counts, correlation IDs, security contexts) required by AMP features.
    

The state at each node evolves through:

1. **Local Processing**: Applying AMP Processing Model rules (section 2) and feature logic to update state based on local operations.
    
2. **Received Updates**: Incorporating state information carried in inbound AMP messages or binding metadata from adjacent nodes.
    

A binding specification augments the core AMP Processing Model by:

- Defining how transport-specific metadata (e.g., connection parameters, transport headers) maps to or updates feature state.
    
- Specifying how the underlying protocol’s primitives (e.g., streaming frames, multipart payloads) transfer AMP frame data and state information.
    

Bindings MUST declare the MEPs they support and define any required state transitions for each pattern. When multiple features are enabled, binding and feature specs MUST document:

- **Feature Interdependencies**: Any order or mutual exclusion requirements among features (e.g., correlation before security handshake).
    
- **State Conventions**: Naming and typing rules for state data (e.g., authentication tokens, transaction IDs) to promote cross-binding consistency.
    

Bindings also MUST specify the minimal responsibility for message serialization and reconstitution:

- **frame Transfer**: How to encode, transmit, and restore the AMP frame over the wire, including optional compressions or chunking.
    
- **Serialization Formats**: If using JSON or alternative encodings (e.g., binary formats), list supported versions and character encodings.
    
- **Streaming Semantics**: Whether nodes may stream process messages as chunks arrive, provided final results match batch processing of complete frames.
    

By combining the core Processing Model with binding-specific state transitions, AMP ensures that message delivery, feature enforcement, and error handling remain consistent across diverse transports.

---

### 5. AMP Message Construct

An AMP message is represented as a JSON object whose top‑level key is the `frame`. The `frame` contains exactly three child properties: `Header`, `Body`, and optionally `MemoryGrams`. No other top‑level keys are permitted.

```
{
  "frame": {
    "Header": { /* message metadata and header blocks */ },
    "Body":   { /* task payload or application data */ },
    "MemoryGrams": [ /* zero or more immutable context snapshots */ ]
  }
}
```

Rules:

1. **Single frame Root**: The message object MUST contain exactly one `frame` property. Nested or multiple frames are not allowed.
    
2. **Header/Body/MemoryGrams**: Inside `frame`, only `Header`, `Body`, and `MemoryGrams` keys are recognized. `MemoryGrams` may be omitted if not used.
    
3. **No Extraneous Fields**: Any additional properties at the `frame` level or above MUST be rejected or ignored, depending on feature rules.
    
4. **No Processing Instructions or Doctypes**: AMP does not support XML concepts such as processing instructions or document type declarations. All message metadata must be encoded in JSON properties or header blocks.
    
5. **Whitespace and Comments**: JSON does not preserve insignificant whitespace or comments. Any formatting hints are ignored by default.
    
6. **Serialization**: AMP messages are serialized as UTF‑8 JSON text. Bindings MAY support binary or compressed representations but MUST restore the exact JSON structure upon reception.
    
7. **Validation**: Conformant implementations MUST validate incoming messages against the AMP message schema, ensuring the presence and correct types of `Header` and `Body`, and that `MemoryGrams`, if present, is an array of objects.
    
8. **Extensibility**: Feature‑specific header blocks and frame extensions can be defined, but must appear under `Header` or in `MemoryGrams`, never at the top level.

By adhering to these rules, AMP ensures a clear, interoperable JSON message model without legacy XML constructs.

### 5.1 AMP frame
The AMP frame element information item has:

- A _local name_ of **frame**.
    
- Zero or more namespace-qualified attribute information items in its _attributes_ property.
    
- One or more element information items in its _children_ property, in order as follows:
    
    1. An optional **Header** element information item (see 5.2 AMP Header).
        
    2. A mandatory **Body** element information item (see 5.3 AMP Body).
        
    3. Zero or more **MemoryGram** element information items (see 5.4 AMP MemoryGrams).
        

---

### 5.1.1 AMP version Attribute**  
The **version** attribute information item indicates which revision of the AMP spec this frame conforms to.

- A _local name_ of **version**.
    
- The attribute is of type _xs:string_. Its value is a semantic version identifier (e.g. `"1.0.0"`) matching the AMP release.
    

This attribute **MAY** appear on the frame element. If absent, peers should assume the latest stable version.

---

**5.2 AMP Header**  
The AMP Header is a JSON object that carries modular metadata blocks for each message. It provides a decentralized and extensible mechanism for agents to include routing, control, or custom data without central coordination.

**Structure:**

```
{
  "Header": {
    "<blockName>": { /* block-specific properties */ },
    ...
  }
}
```

- **Header**: top‑level object property containing header blocks.
    
- **blockName**: unique key identifying the block (e.g., `routing`, `ttl`, `encryption`).
    
- **block-specific properties**: object fields defined by each module’s schema.

### 5.2.1 AMP Header Block**  
An AMP header block is a JSON object entry under the top‑level `Header` property. It carries metadata or control information in a modular, decentralized fashion.

**Definition:**

```
{
  "Header": {
    "<blockName>": {
      /* block-specific fields */
    }
  }
}
```

**Rules for AMP header blocks:**

1. **Key Naming:**
    
    - The block key (`blockName`) MUST use camelCase and be unique within `Header`.
        
2. **Field Types:**
    
    - Blocks MAY include any combination of JSON primitives (string, number, boolean), objects, or arrays, as defined by their module schema.
        
3. **Standardized Properties:** Optional but recommended fields that many blocks share:
    
    - `encodingStyle` (string): URI indicating serialization rules for payloads.
        
    - `role` (string): processing role, e.g. `initialSender`, `intermediary`, `ultimateReceiver`.
        
    - `mustUnderstand` (boolean): if `true`, the receiver MUST process or explicitly reject unknown blocks.
        
    - `relay` (boolean): if `true`, the block MUST be forwarded even if unrecognized.
        
4. **Forwarding Semantics:**
    
    - Unrecognized blocks or properties MUST be ignored during processing but preserved in any forwarded message.
        
5. **Validation:**
    
    - Core properties (`mustUnderstand`, `relay`, `role`, etc.) MUST be validated by the processing agent.
        
    - Custom modules are responsible for validating their own fields.
        

**Example: Transaction Block**

```
{
  "Header": {
    "transaction": {
      "amount": 5,
      "mustUnderstand": true,
      "relay": false
    }
  }
}
```

This AMP-native JSON replaces XML-based header blocks with a simple object model, preserving modularity, extensibility, and decentralized processing.

**5.2.2 AMP Role Property**  
The **role** property in an AMP header block specifies the intended processing role for that block, guiding agents on how to handle it. It replaces SOAP’s namespace-qualified `role` attribute with a simple JSON key.

**Definition:**

```
{
  "Header": {
    "<blockName>": {
      "role": "<roleName>",
      /* other block-specific fields */
    }
  }
}
```

**Rules for the** `**role**` **property:**

1. **Key Name:**
    
    - Use the exact key `role` within a header block object.
        
2. **Value Type:**
    
    - A string representing the processing role.
        
    - Common role names include:
        
        - `initialSender` (default if omitted)
            
        - `intermediary`
            
        - `ultimateReceiver`
            
3. **Default Behavior:**
    
    - If `role` is omitted, processors MUST assume `ultimateReceiver`.
        
4. **Processing Semantics:**
    
    - Agents SHOULD include `role` only in header blocks.
        
    - When relaying a message, intermediaries MAY omit `role` if its value is `ultimateReceiver`.
        
    - Receivers MUST ignore `role` properties on nested block fields not directly under `Header`.
        
5. **Validation:**
    
    - Processors MUST validate that the `role` value is one of the recognized options; unrecognized values are treated as `ultimateReceiver`.
        

**Example: AMP Header with Role**

```
{
  "Header": {
    "audit": {
      "role": "intermediary",
      "timestamp": "2025-06-26T15:30:00Z"
    }
  }
}
```

This JSON-native `role` property maintains AMP’s protocol-neutral, modular design and clearly indicates which agents should process each header block.

**5.2.3 AMP mustUnderstand Property**  
The **mustUnderstand** property in an AMP header block indicates whether processing of that block is mandatory. It replaces SOAP’s `mustUnderstand` attribute with a JSON boolean field.

**Definition:**

```json
{
  "Header": {
    "<blockName>": {
      "mustUnderstand": true,
      /* other block-specific fields */
    }
  }
}
```

**Rules for the `mustUnderstand` property:**

1. **Key Name:**
    
    - Use `mustUnderstand` within a header block object.
        
2. **Value Type:**
    
    - Boolean (`true` or `false`).
        
3. **Default Behavior:**
    
    - If omitted, it is treated as `false`.
        
4. **Validation:**
    
    - Agents MUST accept any valid JSON boolean.
        
5. **Processing Semantics:**
    
    - If `mustUnderstand` is `true` and the receiver does not recognize the block, the receiver MUST reject or error.
        
    - If `false`, unrecognized blocks may be ignored but should still be forwarded.
        
6. **Forwarding Semantics:**
    
    - Intermediaries MAY omit `mustUnderstand` when forwarding if its value is `false`.
        

**Example: AMP Header with mustUnderstand**

```json
{
  "Header": {
    "audit": {
      "mustUnderstand": true,
      "timestamp": "2025-06-26T15:30:00Z"
    }
  }
}
```

This JSON-native `mustUnderstand` field ensures mandatory header blocks are explicitly handled, preserving AMP’s robust, modular processing model.


**5.2.4 AMP relay Property**  
The **relay** property in an AMP header block specifies whether the block must be forwarded by intermediaries even if unrecognized. It replaces SOAP’s `relay` attribute with a JSON boolean field.

**Definition:**

```
{
  "Header": {
    "<blockName>": {
      "relay": true,
      /* other block-specific fields */
    }
  }
}
```

**Rules for the** `**relay**` **property:**

1. **Key Name:**
    
    - Use `relay` within a header block object.
        
2. **Value Type:**
    
    - Boolean (`true` or `false`).
        
3. **Default Behavior:**
    
    - If omitted, it is treated as `false`.
        
4. **Validation:**
    
    - Agents MUST accept any valid JSON boolean.
        
5. **Processing Semantics:**
    
    - If `relay` is `true`, intermediaries MUST include the block when forwarding, even if they do not understand it.
        
    - If `relay` is `false`, intermediaries MAY omit the block if unrecognized, but SHOULD preserve it when possible.
        
6. **Usage Constraints:**
    
    - Agents SHOULD include `relay` only in header block objects.
        
    - Receivers MUST ignore `relay` properties appearing outside direct children of the `Header`.
        

**Example: AMP Header with relay**

```
{
  "Header": {
    "audit": {
      "relay": true,
      "timestamp": "2025-06-26T15:30:00Z"
    }
  }
}
```

This JSON-native `relay` field ensures necessary header blocks are consistently forwarded, upholding AMP’s decentralized, modular routing model.

**5.3 AMP Body**  
The AMP Body is a JSON object that carries the primary task payload intended for the ultimate agent receiver. It replaces the SOAP Body’s XML infoset with a clear, JSON-native structure.

**Structure:**

```
{
  "Body": {
    /* task-specific payload object */
  }
}
```

**Rules for the AMP Body:**

1. **Key Name:**
    
    - Use `Body` as the top-level property for message payload.
        
2. **Payload Type:**
    
    - The value of `Body` is a single JSON object whose schema is defined by the application or module (e.g., `task`, `query`, `response`).
        
3. **Attributes & Metadata:**
    
    - Any control or metadata fields (e.g., `contentType`, `schemaVersion`) should be included at the same level as the payload or nested under a dedicated metadata key.
        
4. **Whitespace & Formatting:**
    
    - JSON whitespace is insignificant; processors must ignore formatting differences.
        
5. **Validation:**
    
    - Receivers MUST validate the payload against the agreed-upon schema before processing.
        
6. **Error Handling:**
    
    - If the payload fails validation, the receiver MUST return an AMP error message (see 5.5 AMP Fault section).
        

**Example: AMP Body**

```
{
  "Body": {
    "task": {
      "action": "processOrder",
      "orderId": "12345",
      "items": [
        { "sku": "ABC", "quantity": 2 },
        { "sku": "XYZ", "quantity": 1 }
      ]
    },
    "schemaVersion": "1.2.0"
  }
}
```

This JSON Body section cleanly encapsulates the core message payload, enabling modular schema definitions and straightforward validation in AMP’s decentralized agent ecosystem.

### 5.3.1 AMP Body Child Elements  
AMP Body child elements are represented as properties within the `Body` object. Each key corresponds to a distinct payload segment or module.

**Structure:**

```
{
  "Body": {
    "childKey": {},
    "anotherChild": []
  }
}
```

**Rules for AMP Body child elements:**

1. **Key Naming:**
    
    - Use camelCase for each `childKey`.
        
    - Keys MUST be unique within the `Body` object.
        
2. **Value Types:**
    
    - Values MAY be any valid JSON type (object, array, string, number, boolean).
        
    - Custom modules define their own schemas for these payloads.
        
3. **Standardized Fields:**
    
    - `encodingStyle` (string, optional): URI indicating serialization rules for nested content.
        
    - `schemaVersion` (string, optional): version identifier for the child payload schema.
        
4. **Whitespace & Formatting:**
    
    - JSON whitespace is insignificant and ignored by processors.
        
5. **Reserved Child—**`**fault**`**:**
    
    - The `fault` key is reserved for error reporting (see 5.5 AMP Fault).
        
    - If present, no other child is processed; `fault` payload must follow the AMP Fault schema.
        
6. **Validation & Processing:**
    
    - Receivers MUST validate each child payload against its module schema.
        
    - Unknown child keys MAY be ignored but should be preserved when forwarding.
        

**Example: AMP Body with Multiple Children**

```
{
  "Body": {
    "task": {
      "action": "updateRecord",
      "recordId": "67890"
    },
    "metadata": {
      "schemaVersion": "1.0.0",
      "encodingStyle": "application/json"
    }
  }
}
```

{
  "Body": {
    "fault": {
      "code": {
        "value": "Client.InvalidRequest",
        "subcode": "MissingField"
      },
      "reason": {
        "text": "The 'orderId' field is required.",
        "lang": "en-US"
      },
      "escalateToHuman": true,
      "returnTo": "agent://node-17",
      "detail": {
        "missingFields": ["orderId"]
      }
    }
  }
}

**5.4.1 AMP Code Object**  
The AMP Code object carries the primary error code and optional detailed subcode within an AMP Fault. It replaces the SOAP Code and Subcode elements with a flat JSON structure.

**Structure:**

```json
{
  "fault": {
    "code": {
      "value": "<errorCode>",    // required: machine-readable fault code
      "subcode": "<subCode>"     // optional: detailed application-specific code
    }
  }
}
```

**Rules for AMP Code:**

1. **Key Naming:**
    
    - Use the exact key `code` under the `fault` object.
        
    - Inside `code`, use `value` (required) and `subcode` (optional).
        
2. **Value Types:**
    
    - `value`: string following the agreed-upon error vocabulary.
        
    - `subcode`: string representing a more specific category or qualifier.
        
3. **Defaults & Validation:**
    
    - `value` is mandatory; processors MUST reject faults missing `value`.
        
    - `subcode` if present, MUST be validated against application-defined subcode lists.
        
4. **Forwarding Semantics:**
    
    - Code object is part of a terminating Fault; intermediaries do not modify it.
        

**Example: AMP Code Object**

```json
{
  "fault": {
    "code": {
      "value": "Client.InvalidRequest",
      "subcode": "MissingField"
    }
  }
}
```


**5.4.2 AMP Reason Object**  
The AMP Reason object provides a human-readable explanation of a fault, supporting multiple language variants. It replaces SOAP’s Reason and Text elements with a JSON-native list.

**Structure:**

```
{
  "fault": {
    "reason": [
      {
        "text": "<human-readable description>",  // required: explanation
        "lang": "<IETF-language-tag>"          // required: language code, e.g. "en-US"
      }
      /* Additional entries for other languages */
    ]
  }
}
```

**Rules for AMP Reason:**

1. **Key Naming:**
    
    - Use `reason` under the `fault` object.
        
    - `reason` is an array of objects with `text` and `lang` fields.
        
2. **Array Entries:**
    
    - Each entry MUST include `text` (string) and `lang` (valid IETF language tag).
        
    - Entries SHOULD have unique `lang` values.
        
3. **Value Types:**
    
    - `text`: string carrying the explanation; not for algorithmic processing.
        
    - `lang`: string following IETF BCP 47 (e.g., "en", "fr-CA").
        
4. **Defaults & Validation:**
    
    - At least one reason entry is required.
        
    - Processors MUST validate `lang` codes; unknown codes may be accepted but logged.
        
5. **Forwarding Semantics:**
    
    - Reason is part of a terminating Fault; intermediaries do not modify it.
        

**Example: AMP Reason Object**

```
{
  "fault": {
    "reason": [
      { "text": "The 'orderId' field is required.", "lang": "en-US" },
      { "text": "Le champ 'orderId' est requis.", "lang": "fr-FR" }
    ]
  }
}
```


**5.4.3 AMP Node Property**  
The **node** property in an AMP Fault identifies which agent node generated the fault. It replaces SOAP’s Node element with a JSON URI field.

**Structure:**

```
{
  "fault": {
    "node": "<agentUri>",    // required for intermediaries, optional for ultimateReceiver
    /* other fault fields */
  }
}
```

**Rules for AMP Node:**

1. **Key Naming:**
    
    - Use `node` under the `fault` object.
        
2. **Value Type:**
    
    - String representing the URI of the agent node (e.g., `agent://node-17`).
        
3. **Presence:**
    
    - Must be present if the fault is generated by an intermediary node.
        
    - May be included by the ultimateReceiver to explicitly indicate fault origin.
        
4. **Validation:**
    
    - Ensure the URI follows the agreed agent URI scheme.
        
5. **Semantics:**
    
    - Indicates source of error for routing, logging, or debugging.
        

---

**5.4.4 AMP Role Property**  
The **role** property in an AMP Fault specifies the processing role of the node when the fault occurred. It replaces SOAP’s Role element with a JSON string field.

**Structure:**

```
{
  "fault": {
    "role": "<roleName>",    // optional: e.g. "intermediary", "ultimateReceiver"
    /* other fault fields */
  }
}
```

**Rules for AMP Role:**

1. **Key Naming:**
    
    - Use `role` under the `fault` object.
        
2. **Value Type:**
    
    - String; must match one of the defined processing roles (e.g., `initialSender`, `intermediary`, `ultimateReceiver`).
        
3. **Optionality:**
    
    - May be omitted if not critical to fault handling.
        
4. **Validation:**
    
    - Processors MUST validate against the set of known roles; unrecognized values treated as `ultimateReceiver`.
        
5. **Semantics:**
    
    - Helps identify the context under which the error was produced.
        

**Example: AMP Fault with Node and Role**

```
{
  "Body": {
    "fault": {
      "code": { "value": "Server.ProcessingError" },
      "reason": [ { "text": "Timeout while processing.", "lang": "en-US" } ],
      "node": "agent://node-17",
      "role": "intermediary"
    }
  }
}
```

**5.4.5 AMP Detail Object**  
The AMP Detail object carries application-specific error information within a fault. It replaces SOAP’s Detail element and its detail entries with a flexible JSON structure.

**Structure:**

```
{
  "fault": {
    "detail": {
      "<entryKey>": {
        /* entry-specific fields */
      },
      /* additional entries */
    }
  }
}
```

**Rules for AMP Detail:**

1. **Key Naming:**
    
    - The `detail` key under `fault` holds a JSON object of entries.
        
    - Each entry uses a unique, camelCase `entryKey`.
        
2. **Entry Structure:**
    
    - Entry values MAY be any valid JSON type (object, array, primitive) as defined by the application schema.
        
    - Modules may include an optional `encodingStyle` field (string URI) to indicate serialization rules.
        
3. **Optionality:**
    
    - `detail` is optional; omit it if no application-specific data is needed.
        
4. **Forwarding Semantics:**
    
    - Detail entries are part of a terminating fault and are not forwarded by intermediaries.
        
5. **Validation:**
    
    - Receivers MUST validate `detail` entries against the application’s error-detail schema.
        

**Example: AMP Detail Object**

```
{
  "fault": {
    "detail": {
      "missingCredentials": {
        "username": null,
        "reason": "User not found"
      },
      "timeoutInfo": {
        "durationMs": 30000,
        "retryable": false
      }
    }
  }
}
```


**5.4.6 AMP Fault Codes**  
AMP Fault Codes classify errors within a fault’s `code.value` field and optional `subcode`. Applications MAY define additional subcodes beyond the base set.

**Base Fault Code Enum:**

```
{
  "faultCodes": [
    "VersionMismatch",    // invalid frame structure or namespace
    "MustUnderstand",    // mandatory block not understood
    "DataEncodingUnknown", // unsupported encoding style
    "Sender",            // client-side error—message malformed or unauthorized
    "Receiver"           // server-side processing error
  ]
}
```

**Subcodes:**

- Any string values under `code.subcode` to refine classification (e.g., `MessageTimeout`, `AuthenticationFailed`).
    
- Subcodes are interpreted in the context of `code.value`.
    

**Processing Rules:**

1. **Interpretation:**
    
    - A node MUST understand the base `code.value` to interpret `detail`.
        
2. **Subcode Chaining:**
    
    - Multiple subcode levels can be represented by concatenating qualifiers in `subcode` (e.g., `MessageTimeout.NetworkFailure`).
        
3. **Validation:**
    
    - Receivers MUST validate `code.value` against the base enum and log or reject unknown codes.
        
4. **Escalation & Recovery:**
    
    - `VersionMismatch` faults SHOULD include an AMP `Upgrade` header block (see Part 2) listing supported protocol versions.
        
    - `Sender` faults indicate non-retryable errors—clients must correct and resend.
        
    - `Receiver` faults indicate retryable errors—clients MAY resend later.
        

**Example: AMP Fault Codes Usage**

```
{
  "Body": {
    "fault": {
      "code": {
        "value": "VersionMismatch",
        "subcode": "MessageTimeout"
      },
      "reason": [ { "text": "Node supports AMP v1.0 only.", "lang": "en-US" } ],
      "metadata": {
        "supportedVersions": ["1.0", "1.1"]
      }
    }
  }
}
```

**5.4.8 AMP MustUnderstand Fault**  
When an AMP node encounters one or more mandatory header blocks it cannot process (`mustUnderstand:true`), it generates a fault with `code.value = "MustUnderstand"` and includes a `notUnderstood` list under the `Header`.

**Structure:**

```
{
  "Header": {
    "notUnderstood": [
      "extension1",    // keys of header blocks not understood
      "extension2"
    ]
  },
  "Body": {
    "fault": {
      "code": { "value": "MustUnderstand" },
      "reason": [ { "text": "Mandatory header blocks not understood.", "lang": "en-US" } ]
    }
  }
}
```

**Rules for MustUnderstand Faults:**

1. **Reserved Header Field:**
    
    - `Header.notUnderstood` is an array of camelCase keys identifying each mandatory header block the node failed to process.
        
2. **Fault Code:**
    
    - The `Body.fault.code.value` field MUST be set to `MustUnderstand`.
        
3. **Reason:**
    
    - Provide at least one human-readable reason entry.
        
4. **Optional Detail:**
    
    - Additional context may be added under `fault.detail`.
        
5. **Processing Semantics:**
    
    - Receivers MUST cease normal processing when `MustUnderstand` faults occur.
        
    - Intermediaries SHOULD NOT forward the original message—this is a terminating fault.
        
6. **Example Comprehension:**
    
    - Clients can inspect `Header.notUnderstood` to know which header modules need support or reconfiguration.


### 6.0 AMP MemoryGram

The AMP MemoryGram is a JSON object capturing an immutable snapshot of agent context—modeled as graph data with nodes and edges—for decentralized sharing. In v1.0, it represents a single snapshot; see Part 2 for multi-gram arrays and pruning policies.

**Structure:**

```
{
  "MemoryGram": {
    "id": "<uuid>",           // unique identifier for this snapshot
    "timestamp": "<ISO8601>", // creation time in UTC
    "nodes": [                  // list of context nodes
      {
        "id": "<nodeId>",        // unique node identifier
        "type": "<nodeType>",    // e.g. "entity", "state"
        "attributes": {            // arbitrary key/value pairs
          /* node-specific fields */
        }
      }
    ],
    "edges": [                  // relationships between nodes
      {
        "source": "<nodeId>",    // id of source node
        "target": "<nodeId>",    // id of target node
        "weight": <number>         // numeric strength of relation
      }
    ],
    "metadata": {               // optional snapshot metadata
      "sourceAgent": "<agentUri>",
      "schemaVersion": "1.0.0"
    }
  }
}
```

**Rules for AMP MemoryGrams:**

1. **Immutability:** Once created, a MemoryGram MUST NOT be modified.
    
2. **Identification:**
    
    - `id` MUST be a UUID v4.
        
    - `timestamp` MUST follow ISO 8601 format in UTC.
        
3. **Graph Payload:**
    
    - `nodes`: array of node objects representing context entities or states.
        
    - `edges`: array of edge objects describing weighted relationships between nodes.
        
4. **Metadata:**
    
    - `metadata` is optional but recommended for tracing, versioning, and compatibility.
        
5. **Validation:**
    
    - Receivers MUST validate graph structure (unique node IDs, valid edge references) before merging or presenting.
        
6. **Forwarding & Pruning:**
    
    - MemoryGrams are included in the frame’s top-level array (Part 2).
        
    - Pruning policies (e.g., maximum history length, decay thresholds) are described in Appendix A.
        

**Example: AMP MemoryGram**

```
{
  "MemoryGram": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-06-26T23:00:00Z",
    "nodes": [
      { "id": "n1", "type": "entity", "attributes": { "name": "Alice" } },
      { "id": "n2", "type": "state",  "attributes": { "status": "active" } }
    ],
    "edges": [
      { "source": "n1", "target": "n2", "weight": 0.75 }
    ],
    "metadata": {
      "sourceAgent": "agent://node-42",
      "schemaVersion": "1.0.0"
    }
  }
}
```

---

**7.0 Security Considerations**  
AMP provides an extensibility model for adding security features via modular header blocks and payload extensions. Designers and implementors should consider the following when defining and deploying AMP security mechanisms:

1. **Trust Evaluation**
    
    - Agents MUST verify the identity and privileges of message senders before processing sensitive header blocks or Body contents.
        
    - Implement access control modules (e.g., `authentication`, `authorization`) as AMP header blocks with clear validation rules.
        
2. **Header Block Safety**
    
    - Only well-specified header blocks with understood side effects (state changes, logging, message generation) should be processed.
        
    - Unrecognized security header blocks MUST be ignored but preserved if `relay:true`; unknown blocks with `mustUnderstand:true` trigger a MustUnderstand fault.
        
3. **Payload Protection**
    
    - Use encryption and integrity modules (e.g., `encryption`, `signature`) defined as header blocks to protect confidentiality and detect tampering.
        
    - Bind cryptographic metadata (algorithm, key identifiers) to header blocks, and validate prior to Body processing.
        
4. **Modular Awareness**
    
    - Ensure each AMP processing module is aware of the overall security context.
        
    - For example, Body payload modules should not execute without confirming authentication and integrity modules succeeded.
        
5. **Data Sanitization**
    
    - Sanitize all data fields—including nested JSON values, URI parameters, and binary attachments—against injection and overflow attacks.
        
    - Define a `validation` header block or schema versioning to enforce content rules.
        
6. **Side‑Effect Minimization**
    
    - Limit the scope of state‑changing header blocks to explicit, permissioned actions.
        
    - Log and audit each security‑relevant action via a dedicated `audit` block, including timestamps and agent URIs.
        
7. **Error Handling**
    
    - On security validation failures, generate an AMP Fault with `code.value = "Receiver.SecurityViolation"` or a suitable custom code.
        
    - Include `detail` entries explaining the violation, and optionally `escalateToHuman:true` for manual review.
        
8. **Versioning & Upgrades**
    
    - Use an `Upgrade` header block for protocol version mismatches, including supported security module versions.
        
    - Maintain backward compatibility by negotiating security feature support at the start of message exchanges.
        

By following these considerations and leveraging AMP’s modular header model, implementors can build robust, decentralized security architectures that align with their specific deployment requirements.

---

## 7 Security Considerations

Security mechanisms (confidentiality, integrity, non-repudiation) are provided by modules (e.g., field/section-level encryption). Intermediate nodes are attack surfaces; modules **SHOULD** document trust models and privacy boundaries.

---

**7.2 AMP Intermediaries**  
Intermediary agents in AMP may inspect, modify, or forward messages as they pass through the network. To mitigate man‑in‑the‑middle and privacy risks, implement the following:

1. **End‑to‑End Protection**
    
    - Use header blocks like `encryption` and `signature` to provide confidentiality and integrity beyond transport hops.
        
    - Ensure only the ultimateReceiver can decrypt sensitive payloads.
        
2. **Agent Authentication**
    
    - Require each intermediary to present verifiable credentials via an `authentication` block.
        
    - Validate intermediary identities before forwarding.
        
3. **Selective Processing**
    
    - Only allow trusted intermediaries to handle header blocks with side effects (e.g., `routing`, `audit`).
        
    - Intermediaries without a validated `authorization` block MUST ignore such blocks or trigger a MustUnderstand fault.
        
4. **Audit & Logging**
    
    - Log each processing step in an `audit` block, including agentUri, timestamp, and actions taken.
        
    - Protect logs from tampering using a `signature` block.
        
5. **Transport Agnosticism**
    
    - Don’t assume transport‑level security covers all hops—use AMP’s modular header blocks for end‑to‑end guarantees.
        

---

**7.3 Underlying Protocol Bindings**  
AMP can be carried over HTTP, gRPC, SMTP, or custom transports. Binding specifications SHOULD:

1. **Security Implications**
    
    - Document risks of omitting or violating AMP security recommendations (e.g., skipping signature validation).
        
    - Describe countermeasures for threats not covered by the transport (e.g., replay attacks).
        
2. **Extension Interactions**
    
    - Explain how AMP header blocks (e.g., `authentication`, `encryption`) interact with transport features (e.g., HTTP Basic Auth, TLS).
        
    - Warn of potential conflicts (e.g., double-encryption, header stripping).
        
3. **Default vs. Non‑Default Ports**
    
    - Highlight infrastructure behaviors (proxies, filters) when using well‑known ports.
        
    - Recommend non‑default ports or custom endpoints to avoid unintended middlebox interference.
        

---

**7.3.1 Binding to Application‑Specific Protocols**  
Bindings to specialized protocols (e.g., IoT, message buses) MAY reuse existing endpoints. Authors SHOULD:

1. **Document Port Semantics**
    
    - List default ports and associated network assumptions or filters.
        
    - Provide examples of using alternative ports to bypass unwanted inspection.
        
2. **Profile‑Aware Security**
    
    - Identify default behaviors (e.g., QoS, routing) that could affect AMP messages.
        
    - Specify additional header blocks or transport flags needed to preserve AMP semantics.
        
3. **Compatibility Testing**
    
    - Test AMP over common infrastructure stacks to uncover protocol binding issues.
        
    - Include guidance on mitigating discovered interoperability or security problems.


## A Appendix: MemoryGram Model (Non‑Normative)

### A.1 Nodes & Edges

|   |   |   |
|---|---|---|
|Field|Type|Description|
|id|string|Unique node identifier.|
|type|string|Node category (e.g. plan, issue).|
|metadata|object|Key-values (importance, decay, etc.).|

|   |   |   |
|---|---|---|
|Field|Type|Description|
|source|string|Source node ID.|
|target|string|Target node ID.|
|weight|number|Strength (0–1).|
|context|string|Optional label.|

### A.2 Lifecycle

1. **Generate**: Local confidence query.
    
2. **Transmit**: Included in frame.
    
3. **Interpret**: Hints only.
    
4. **Decay/Reinforce**: Agent-specific aging.
    

---

© 2025 Jamin Quimby — Apache 2.0 License
