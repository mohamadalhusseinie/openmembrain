# Design: CH/EU Encrypted Sync Mode

Status: design-only, no implementation. See [#12](https://github.com/mohamadalhusseinie/openmembrane/issues/12).

Future mode, not MVP (Phase 7 in the [roadmap](../roadmap.md)). This design should be read together with [compliance-framework.md](compliance-framework.md), which defines the GDPR/nDSG obligations that shape several requirements below.

## Goal

Allow developers and teams to optionally sync their project memory to privacy-compliant CH/EU infrastructure, without weakening the local-first default.

## Ownership Model

The first question this design must answer, before any protocol detail: is the remote endpoint a transport replica, or can it become the canonical memory store?

**Decision: local records are always canonical.** The remote CH/EU-hosted store is a replica, synchronized via encrypted, append-only change envelopes. It is never the source of truth, and no code path should be able to treat a remote-only record as authoritative over a local one. This keeps the local-only mode's guarantees intact even when sync is enabled — sync is additive, not a replacement for local storage.

Append-only means the remote store accepts new envelopes but cannot be used to retroactively alter history. Edits and deletions are represented as new envelopes (see Deletion And Tombstone Propagation below), not as mutations of previously-synced data.

## Encryption

- **At rest and in transit:** end-to-end encryption. Keys are generated and held by the user (or the team's designated key holders in hosted team mode); the CH/EU infrastructure provider stores ciphertext only.
- **What this does not solve:** E2EE protects data from the infrastructure provider and from network observers. It does **not** prevent an authorized client, or an external LLM the user has configured, from requesting more decrypted context than a given operation needs. A single global "may use synced memory" toggle is not sufficient policy granularity.
- **Required control:** purpose- and scope-limited projections. Policy must be able to answer "what may this specific extraction call, retrieval query, or export operation decrypt and see" — not just "is sync enabled." This should reuse and extend the existing local policy/classification layer rather than introducing a parallel sync-specific policy system.

## Sync Protocol Requirements

The protocol design must specify each of the following before implementation begins:

1. **Device identity and authorization** — how a device proves it belongs to the user/team and is authorized to sync.
2. **Key rotation and lost/revoked-device behavior** — how keys are rotated, and what happens to previously-synced data's accessibility when a device is lost or revoked.
3. **Deletion/tombstone propagation** — deletions on one device must propagate to other devices and to the remote replica as explicit tombstone envelopes, not silent omissions, so that "forget me" (see compliance-framework.md) is honored consistently across devices.
4. **Rollback after a corrupted remote** — since local is canonical, a corrupted or compromised remote replica must be recoverable by re-deriving it from local state, not by trusting whatever the remote currently holds.
5. **Metadata visible to the storage provider** — even with E2EE payloads, the provider may see envelope size, timing, device count, and similar metadata. This must be documented explicitly rather than implied away by "it's encrypted."
6. **Conflict states requiring user review** — local/remote divergence that cannot be resolved automatically must surface as a reviewable conflict, not be silently resolved by a last-write-wins rule.
7. **Data-egress receipt** — a record, inspectable by the user, showing exactly what left the device in a given sync operation. This gives the "explicit visibility into what syncs" user story a concrete mechanism, not just a policy promise.

## Data Residency: Verifiable, Not Asserted

A design document's residency claim is not, by itself, sufficient. The acceptance criteria for this feature must verify the *running system's* behavior, not just the design doc's copy.

Where data actually lands is decided at runtime by the storage provider's region configuration and its sub-processor list. A "CH/EU-hosted" claim can pass design review cleanly while a failover path or CDN edge quietly stores a copy outside the committed region. To avoid this:

- The design must specify **how residency is checked against the running system** — e.g. a documented, periodically-verified list of regions and sub-processors actually in use, not only a one-time architecture decision.
- Failover and CDN/edge caching paths must be explicitly audited for region compliance as part of the same verification, not assumed to inherit the primary region's guarantee.
- The residency guarantee stated to users should be backed by something checkable (e.g. a status page, an audit log entry, or a runtime assertion), not only by the design document having been reviewed and approved.

This requirement should be reflected as an explicit item in the acceptance criteria for #12's implementation follow-ups, not just documented here.

## Explicit Opt-In UX

- Nothing syncs by default. Sync is off until the user explicitly enables it.
- The opt-in flow must show, before the user confirms, what categories of data will sync (memories, not raw transcripts by default — see [security-and-privacy.md](../security-and-privacy.md)).
- The user must be able to disable sync at any time without losing local data.

## Conflict Resolution

When local and remote diverge in a way that cannot be resolved automatically (per protocol requirement 6 above), the conflict is surfaced to the user for manual resolution rather than auto-merged. Automatic resolution is only acceptable for conflicts where one side is a strict superset of the other (e.g. a tombstone always wins over a stale, un-deleted copy).

## Audit Trail For Sync Events

Every sync operation (initial enable, envelope push/pull, conflict surfaced, conflict resolved, device revoked, key rotated) should produce an audit event, consistent with the existing audit/diagnostics distinction in [security-and-privacy.md](../security-and-privacy.md#audit-events-vs-diagnostics).

## Data Flow Diagram

```
Device A                                  CH/EU Sync Infrastructure
--------                                  -------------------------
local canonical store
  |
  | (user opt-in)
  v
encrypted append-only envelope  ------->   ciphertext-only replica
  ^                                         (region-verified, see above)
  |
  | pull + decrypt (keys held by user)
  |
Device B
  local canonical store (merged via
  conflict-resolution rules)
```

## Non-Goals (This Design)

- No SaaS backend, billing, or accounts (see [#13](https://github.com/mohamadalhusseinie/openmembrane/issues/13))
- No team sharing (see [#13](https://github.com/mohamadalhusseinie/openmembrane/issues/13))
- No self-hosted option (see [#14](https://github.com/mohamadalhusseinie/openmembrane/issues/14))
- No implementation unless split into follow-up issues

## References

- [Compliance Framework](compliance-framework.md)
- [Security and Privacy](../security-and-privacy.md)
- [Product Vision](../product-vision.md)
- [Roadmap](../roadmap.md)
- Related: [#13](https://github.com/mohamadalhusseinie/openmembrane/issues/13) (hosted team), [#14](https://github.com/mohamadalhusseinie/openmembrane/issues/14) (self-hosted enterprise), [#64](https://github.com/mohamadalhusseinie/openmembrane/issues/64) (compliance framework)
