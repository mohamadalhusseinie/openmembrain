# Compliance Framework: GDPR/DSGVO, Swiss nDSG, EU AI Act

Status: design-only, no implementation. See [#64](https://github.com/mohamadalhusseinie/openmembrane/issues/64).

This is a technical design document, not legal advice. It maps regulatory obligations to concrete technical mechanisms in OpenMembrane so that hosted/sync modes are built with compliance in mind from the start, instead of retrofitted later. Legal review of this document by qualified counsel is a separate, required step before any hosted or sync mode ships.

This design is upstream of [#12](https://github.com/mohamadalhusseinie/openmembrane/issues/12) (CH/EU sync), [#13](https://github.com/mohamadalhusseinie/openmembrane/issues/13) (hosted team mode), and [#14](https://github.com/mohamadalhusseinie/openmembrane/issues/14) (self-hosted enterprise mode). Those designs should reference the relevant rows of the compliance matrix below.

## Per-Mode Compliance Matrix

| Mode | Data location | Controller / processor | GDPR applies | nDSG applies | AI Act relevance | Key obligations |
|---|---|---|---|---|---|---|
| Local-only (current MVP) | Developer's machine only | User is both controller and processor of their own data | Only insofar as the user is a data controller for their own organization's data; OpenMembrane itself processes nothing on their behalf | Same as GDPR column | Minimal — see AI Act section | Privacy-by-design documentation only |
| CH/EU sync (#12) | CH or EU-hosted infrastructure, user-controlled keys | OpenMembrane (or its infra provider) is processor; user/org is controller | Applies if EU-based users or EU-hosted infra | Applies directly if CH-hosted infra, per nDSG's effects-based scope (see below) | Same as local-only; sync itself doesn't change AI system classification | Encryption, DPA with infra provider, cross-border transfer assessment, data residency guarantees |
| Self-hosted (#14) | Customer's own infrastructure | Customer is controller and processor; OpenMembrane is software vendor, not a processor | Applies based on customer's jurisdiction, not OpenMembrane's | Applies based on customer's jurisdiction | Same as local-only; customer's own AI Act obligations are separate from OpenMembrane's | DPA template for customer's own downstream use, audit log support |
| Hosted team (#13) | OpenMembrane-managed hosted infrastructure | OpenMembrane is processor; org/team is controller | Full GDPR compliance required | Full nDSG compliance required, including FDPIC notification path | Same scope assessment as below, but policy enforcement across a team increases documentation burden | DPA, ROPA, breach notification to both EU DPAs and FDPIC, data subject rights endpoints, retention policy, tenant isolation |

## GDPR / DSGVO

### Lawful Basis For Processing

Each processing activity needs an identified lawful basis (GDPR Art. 6):

| Activity | Likely lawful basis |
|---|---|
| Session transcript analysis (local extraction) | Not applicable — user processes their own data locally, OpenMembrane is not a party to this processing |
| Memory extraction via external LLM (`propose_memory_from_session`, when configured) | Legitimate interest or contract, depending on deployment mode; requires explicit user opt-in per [security-and-privacy.md](../security-and-privacy.md) regardless of legal basis |
| Storage (hosted/sync modes) | Contract (providing the sync/hosting service the user or org signed up for) |
| Sync (CH/EU mode) | Consent (explicit opt-in, nothing syncs by default) |

### Data Subject Rights → Technical Mechanism

| Right | Mechanism | Status |
|---|---|---|
| Right to access | Export all memories, pending candidates, audit log, and diagnostics for a user/project | Not built. Requires an export command/tool covering all four stores. |
| Right to erasure ("forget me") | Full deletion of all memories, candidates, audit log entries, and diagnostics for a user/project | Not built. `delete_memory` exists for individual entries; a project/user-scoped purge does not. |
| Right to rectification | Update an existing memory's content | Partially covered by `update_memory`. |
| Right to data portability | Export in a standard, re-importable format (e.g. JSON matching the internal schema) | Not built. Should reuse the access-export mechanism above with a documented schema. |
| Right to restriction of processing | Ability to freeze a memory/project from further extraction or export without deleting it | Not built. |

### Data Minimization By Design

The membrane philosophy is itself a data-minimization measure: only durable, non-secret, non-noise knowledge is extracted and persisted (see [security-and-privacy.md](../security-and-privacy.md)). Raw transcripts and raw source code are not stored by default. This should be documented explicitly in any DPA or ROPA as a built-in minimization control, not just a product feature.

### Data Processing Agreements (DPA)

Required whenever an external LLM provider is used for extraction (the `propose_memory_from_session` path) or whenever a hosted/sync infrastructure provider stores user data on OpenMembrane's behalf. A DPA template needs:

- categories of data processed (memory candidates, redacted transcript excerpts)
- purpose limitation (extraction only, no secondary use)
- sub-processor disclosure (see the residency-verification requirement in [ch-eu-sync-mode.md](ch-eu-sync-mode.md))
- data deletion timelines on contract termination

### Record Of Processing Activities (ROPA)

Required for hosted team mode. Document: processing activity, purpose, categories of data subjects, categories of data, recipients (including sub-processors), retention period, and security measures — per activity, not just per product.

### Data Retention

Staleness review exists in the current codebase; a formal retention/deletion policy does not. Hosted modes need an explicit retention period (with a documented default and org-configurable override) after which memories, candidates, audit entries, and diagnostics are automatically purged unless retained for a documented legal reason.

### Cross-Border Transfers

Relevant for CH/EU sync and hosted modes, and for any external LLM provider call that leaves the EU/CH (e.g. a US-based model provider). Standard contractual clauses or an adequacy decision must cover any such transfer; this is a DPA-level requirement, not a code-level one, but the product must expose *which* provider is in use so the correct legal instrument can be verified.

### Data Breach Notification

Hosted/sync modes need a documented breach response process: detection, assessment, and notification to affected data controllers within GDPR's 72-hour window. See the nDSG section below for the distinct Swiss timeline and authority.

## Swiss nDSG (revFADP)

The Swiss nDSG (effective September 2023) is closely aligned with GDPR but has distinct requirements that must be handled separately, not assumed to be "GDPR but Swiss":

- **Scope is effects-based, not establishment-based.** nDSG applies to processing that has effects in Switzerland regardless of where the processor is located. If OpenMembrane stores data on CH infrastructure (#12), nDSG applies directly, independent of where OpenMembrane itself is headquartered.
- **Individual criminal liability.** Unlike GDPR, which fines organizations, nDSG can impose *criminal* fines on the *responsible individual* — up to CHF 250,000 — not the company. This materially changes the risk profile for whoever is designated as the responsible person in team/enterprise modes, and should be called out explicitly (not buried) in the per-mode compliance matrix and in any DPA offered to CH customers.
- **Breach notification is FDPIC, not EU DPAs.** Notification must go to the Federal Data Protection and Information Commissioner (FDPIC) "as soon as possible," which is a different timeline and a different authority than GDPR's 72-hour EU DPA notification. Hosted team mode's breach process needs a separate FDPIC notification branch, not just a EU-DPA one.
- **Cross-border transfer safeguards.** Transfers to countries without adequate protection (per Switzerland's own adequacy list, which is separate from the EU's) require standard contractual clauses or binding corporate rules, mirroring but not identical to the GDPR mechanism.
- **DPIA requirement.** A Data Protection Impact Assessment is required for high-risk processing. Whether LLM-backed extraction qualifies as high-risk needs to be assessed per deployment mode (local-only: no; hosted with external LLM: likely yes) before hosted team mode ships.
- **CH representative requirement.** Processing Swiss data from outside Switzerland may require a designated representative in Switzerland — relevant if hosted infrastructure sits outside CH.
- **Register of processing activities threshold.** Required for organizations with 250+ employees or high-risk processing. Applicability to OpenMembrane itself (as opposed to its customers) needs a one-time determination once hosted team mode's operating structure is known.

## EU AI Act

**Scope assessment:** OpenMembrane is a *deployer* of AI models, not a *provider* of a general-purpose AI (GPAI) model. The GPAI obligations under Art. 53 apply to organizations that build and offer foundation models — not to applications that call them. This means Art. 53 does not apply to OpenMembrane.

The relevant question instead is whether any product mode falls into an Annex III high-risk category. Given the use case — a developer tool that processes session transcripts to extract durable project knowledge — this is very unlikely for any current or planned mode. The more probable classification is **minimal risk with transparency obligations under Art. 50**, which carries a materially lighter compliance burden than high-risk classification would.

- **Risk classification:** minimal/limited risk is the expected classification across all modes (local-only, CH/EU sync, self-hosted, hosted team). This should be re-assessed if a future mode introduces automated decision-making with legal or similarly significant effects on individuals, which none currently do.
- **Transparency obligations (Art. 50):** users must be able to tell whether LLM-backed extraction (`propose_memory_from_session` with a configured provider) or the deterministic `MockMemoryExtractor` is active. This should be surfaced in tool responses or diagnostics, not just in documentation.
- **Technical documentation:** minimal risk classification does not require the extensive technical documentation that high-risk systems do, but a short internal note describing the extraction pipeline and human oversight mechanism (below) should be maintained in case classification is later challenged.
- **Human oversight:** the pending-candidate approval queue already functions as a human-in-the-loop control — candidates are not persisted without either automatic policy approval or explicit user approval. This satisfies the spirit of Art. 14 human oversight requirements for the parts of the pipeline that reach that queue, and should be documented as such.

## Data Flow Diagrams

### Local-only mode

```
session transcript
  -> secret redaction (local)
  -> extraction (local AI tool, or local LLM call if configured)
  -> classification / policy / dedup / conflict detection (local)
  -> local JSON/SQLite store (.openmembrane)

No data leaves the developer's machine.
```

### CH/EU sync mode (#12)

```
session transcript
  -> secret redaction (local)
  -> extraction (local, or external LLM if explicitly configured)
  -> classification / policy / dedup / conflict detection (local)
  -> local store (canonical)
  -> [explicit opt-in] encrypted append-only change envelope
       -> CH/EU-hosted sync infrastructure (replica, not canonical)

Keys stay with the user. See ch-eu-sync-mode.md for the full protocol.
```

### Hosted team mode (#13)

```
session transcript
  -> secret redaction (local, per-device)
  -> extraction (local, or external LLM if org-configured)
  -> classification / policy / dedup / conflict detection (local)
  -> encrypted sync -> hosted infrastructure (tenant-isolated per org)
  -> org-level policy enforcement, audit log, admin controls

Full GDPR + nDSG obligations apply at the hosted infrastructure boundary.
```

## Gap Analysis: Current Codebase vs. Required

| Requirement | Current state | Gap |
|---|---|---|
| Secret redaction before persistence | Implemented (rule-based filters) | None for local-only mode |
| Right to rectification | `update_memory` implemented | None |
| Right to erasure (single memory) | `delete_memory` implemented | Project/user-scoped bulk purge not implemented |
| Right to access / portability | Not implemented | Needs full export tool covering memories, candidates, audit, diagnostics |
| Retention policy | Staleness review implemented; no automatic deletion | Needs configurable retention period + automatic purge |
| DPA template | Not created | Needed before any external LLM provider or hosted infra is used in production |
| ROPA | Not created | Needed before hosted team mode ships |
| Breach notification process | Not documented | Needs separate GDPR (72h, EU DPAs) and nDSG (FDPIC, "as soon as possible") branches |
| AI Act transparency (extractor type visible to user) | Not surfaced | Needs to be exposed in tool responses/diagnostics |
| DPIA | Not performed | Needed before hosted team mode ships, per nDSG high-risk assessment |

## References

- [GDPR Full Text](https://gdpr-info.eu/)
- [Swiss nDSG (revFADP)](https://www.fedlex.admin.ch/eli/cc/2022/491/en)
- [FDPIC Guidance](https://www.edoeb.admin.ch/edoeb/en/home.html)
- [EU AI Act](https://artificialintelligenceact.eu/)
- [Security and Privacy](../security-and-privacy.md)
- [Product Vision](../product-vision.md)
- [Roadmap](../roadmap.md)
- Related: [#12](https://github.com/mohamadalhusseinie/openmembrane/issues/12) (CH/EU sync), [#13](https://github.com/mohamadalhusseinie/openmembrane/issues/13) (hosted team), [#14](https://github.com/mohamadalhusseinie/openmembrane/issues/14) (self-hosted enterprise)
