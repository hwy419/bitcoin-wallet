# Expert Documentation Migration Guide

**Date**: October 22, 2025
**Purpose**: Guide for all agents to understand the new segmented documentation structure

---

## Overview

The expert documentation has been migrated from monolithic single-file notes to a **segmented, topic-based structure** to improve:
- **Navigation speed**: Find information in seconds, not minutes
- **Maintenance**: Update specific topics without scrolling through 6,000+ lines
- **Context efficiency**: Read only the files you need
- **Cross-referencing**: Clear links between related topics
- **Collaboration**: Multiple people can edit different files simultaneously

---

## New Structure

### Directory Layout

```
prompts/docs/experts/
├── blockchain/
│   ├── _INDEX.md               # Quick reference & navigation
│   ├── architecture.md         # BIP standards, HD wallet, derivation
│   ├── addresses.md            # Address generation, validation
│   ├── transactions.md         # Transaction building, PSBT, fees
│   ├── utxo.md                 # UTXO management, coin selection
│   ├── multisig.md             # Multisig implementation
│   └── decisions.md            # ADRs and trade-offs
│
├── security/
│   ├── _INDEX.md
│   ├── encryption.md           # AES-256-GCM, PBKDF2
│   ├── key-management.md       # Storage, handling, lifecycle
│   ├── threat-model.md         # Attack vectors, mitigations
│   ├── audits.md               # Security audit reports
│   └── decisions.md
│
├── frontend/
│   ├── _INDEX.md
│   ├── architecture.md         # Component hierarchy, tab layout
│   ├── components.md           # Component library & specs
│   ├── state.md                # Context, hooks, data flow
│   ├── styling.md              # Tailwind, design tokens
│   └── decisions.md
│
├── backend/
│   ├── _INDEX.md
│   ├── service-worker.md       # Architecture, lifecycle
│   ├── messages.md             # Message handlers, patterns
│   ├── storage.md              # Chrome storage, encryption
│   ├── api.md                  # Blockstream, price service
│   └── decisions.md
│
├── design/
│   ├── _INDEX.md
│   ├── design-system.md        # Colors, typography, spacing
│   ├── components.md           # Component design specs
│   ├── user-flows.md           # Flow diagrams, journeys
│   ├── accessibility.md        # A11y guidelines, WCAG
│   └── decisions.md
│
├── product/
│   ├── _INDEX.md
│   ├── roadmap.md              # Release planning, versions
│   ├── requirements.md         # User stories, criteria
│   ├── features.md             # Feature specifications
│   └── decisions.md
│
├── qa/
│   ├── _INDEX.md
│   ├── test-plans.md           # Manual test plans
│   ├── test-cases.md           # Test case library
│   ├── bugs.md                 # Bug tracking, triage
│   └── decisions.md
│
└── testing/
    ├── _INDEX.md
    ├── unit-tests.md           # Unit test patterns
    ├── integration.md          # Integration test patterns
    ├── infrastructure.md       # Jest config, CI/CD
    └── decisions.md
```

---

## File Naming Conventions

### _INDEX.md

**Purpose**: Entry point for each domain - quick reference and navigation hub

**Must Include**:
- Current status (Implemented ✅, In Progress ⏳, Planned 📋)
- Documentation map with links to all segmented files
- Recent changes (last 5-10 updates)
- Quick reference (common commands, patterns, shortcuts)

**Example Structure**:
```markdown
# {Expert} - Quick Reference

**Last Updated**: YYYY-MM-DD
**Role**: {Expert Name}
**Purpose**: {Brief description}

## Current Status
- ✅ Feature A implemented
- ⏳ Feature B in progress
- 📋 Feature C planned

## Documentation Map
- [architecture.md](./architecture.md) - Description
- [decisions.md](./decisions.md) - ADRs

## Recent Changes (Last 5)
1. **YYYY-MM-DD**: Change description
2. **YYYY-MM-DD**: Change description

## Quick Reference
{Common patterns, commands, or info}
```

### Topic Files (architecture.md, components.md, etc.)

**Purpose**: Deep-dive documentation on specific topics

**Must Include**:
- Header with: title, last updated date, related files
- Quick navigation section with anchor links
- Comprehensive content on the topic
- Cross-references to related files
- Code examples where relevant

**Example Structure**:
```markdown
# {Topic Title}

**Last Updated**: YYYY-MM-DD
**Component**: {Expert Domain} - {Topic}
**Related**: [topic-b.md](./topic-b.md), [decisions.md](./decisions.md)

---

## Quick Navigation
- [Section A](#section-a)
- [Section B](#section-b)
- [Back to Index](./_INDEX.md)

---

## Section A

{Content with code examples}

See [topic-b.md](./topic-b.md#related-section) for related information.

## Section B

{More content}
```

### decisions.md

**Purpose**: Architecture Decision Records (ADRs) for the domain

**Must Include**:
- Numbered ADRs (ADR-001, ADR-002, etc.)
- Each ADR contains: Status, Context, Decision, Rationale, Consequences, References
- Organized by category if many decisions

**Example Structure**:
```markdown
# {Expert} - Decision Log

**Last Updated**: YYYY-MM-DD

---

## ADR-001: Decision Title (YYYY-MM-DD)

**Status**: Accepted | Proposed | Deprecated

**Context**: Why did we need to make this decision?

**Decision**: What did we decide?

**Rationale**: Why did we decide this way?

**Consequences**:
- Positive: What benefits does this provide?
- Negative: What trade-offs did we make?

**Alternatives Considered**:
1. Alternative A - Why we didn't choose this
2. Alternative B - Why we didn't choose this

**References**: [related-file.md](./related-file.md#section)

---

## ADR-002: Next Decision Title

{Same format}
```

---

## Workflow for Agents

### Before Starting Work

1. **Read `_INDEX.md`** for your domain to get current status and recent changes
2. **Navigate to relevant topic file(s)** using the documentation map
3. **Review related documentation** via cross-references
4. **Check `decisions.md`** to understand past architectural choices

### During Work

1. **Take notes** of implementation details, patterns, decisions
2. **Track which files** will need updates when you're done
3. **Note any new ADRs** you might need to document

### After Completing Work

1. **Update topic-specific file(s)** with:
   - New implementation details
   - Code examples and patterns
   - Integration points
   - Known issues or limitations
   - Cross-references to related documentation

2. **Add ADR to `decisions.md`** if you made an architectural decision:
   - Why you made the decision
   - What alternatives you considered
   - Trade-offs and consequences

3. **Update `_INDEX.md`** with:
   - New entry in "Recent Changes" (keep last 5-10)
   - Update "Current Status" section if needed
   - Update quick reference if you added common patterns

4. **Verify cross-references** - ensure links work and are bidirectional

### Code Review Checklist

Before marking work as complete, verify:

- [ ] Topic-specific file(s) updated with implementation details
- [ ] New ADR added to `decisions.md` if architectural decision was made
- [ ] `_INDEX.md` updated with recent change
- [ ] Current status updated in `_INDEX.md` if feature moved to implemented
- [ ] Cross-references added to related files
- [ ] All relative links tested and working
- [ ] Code examples include proper syntax highlighting
- [ ] No sensitive information (keys, passwords) in documentation

---

## Cross-Referencing Best Practices

### Use Relative Links

**Good**:
```markdown
See [transactions.md](./transactions.md#psbt-workflow) for PSBT implementation.
```

**Bad**:
```markdown
See the transactions file for PSBT implementation.
```

### Be Specific

**Good**:
```markdown
The encryption parameters are defined in [encryption.md - AES-256-GCM Configuration](../security/encryption.md#aes-256-gcm-configuration).
```

**Bad**:
```markdown
See security notes for encryption details.
```

### Bidirectional References

If File A references File B, File B should reference File A where relevant:

**In transactions.md**:
```markdown
UTXOs are selected using the algorithm described in [utxo.md#selection-algorithm](./utxo.md#selection-algorithm).
```

**In utxo.md**:
```markdown
## Selection Algorithm

This algorithm is used by TransactionBuilder, documented in [transactions.md#transaction-building](./transactions.md#transaction-building).
```

---

## Migration from Legacy Files

### Legacy Files Status

The original monolithic `*-notes.md` files in `prompts/docs/` remain for reference during transition:

- `blockchain-expert-notes.md` (4,237 lines) → `experts/blockchain/` (7 files)
- `security-expert-notes.md` (3,910 lines) → `experts/security/` (5 files)
- `frontend-developer-notes.md` (6,569 lines) → `experts/frontend/` (5 files)
- `backend-developer-notes.md` (5,871 lines) → `experts/backend/` (5 files)
- `ui-ux-designer-notes.md` (6,595 lines) → `experts/design/` (5 files)
- `product-manager-notes.md` (3,983 lines) → `experts/product/` (4 files)
- `qa-engineer-notes.md` (2,883 lines) → `experts/qa/` (4 files)
- `testing-expert-notes.md` (4,099 lines) → `experts/testing/` (4 files)

**Total**: ~38,000 lines across 8 monolithic files → ~44 organized, topic-focused files

### Archiving Plan

Legacy files will be:
1. Kept for 1-2 release cycles (through v0.11.0 and v0.12.0)
2. Moved to `prompts/docs/archive/` directory
3. Eventually deleted after team confirms no information loss

### Finding Information

If you can't find something in the new structure:

1. Check the `_INDEX.md` for navigation
2. Use grep to search across all segmented files:
   ```bash
   grep -r "search term" prompts/docs/experts/
   ```
3. Check the legacy file in `prompts/docs/` as a fallback
4. If information is missing, add it to the appropriate segmented file

---

## Benefits Summary

### For Individual Agents

- **Faster lookups**: Go directly to the topic you need
- **Less scrolling**: Topic files are 200-1000 lines instead of 4000-6000
- **Better focus**: Read only what's relevant to your current task
- **Easier updates**: Edit a single topic file, not a massive document

### For Collaboration

- **Parallel editing**: Multiple agents can edit different files simultaneously
- **Clearer diffs**: Git changes show exactly what topic was updated
- **Better code reviews**: Reviewers see focused changes, not 6000-line file diffs
- **Reduced conflicts**: Less likely to have merge conflicts

### For Project Health

- **Knowledge preservation**: Easier to keep documentation current
- **Onboarding**: New contributors can ramp up faster
- **Maintenance**: Updates are scoped to specific areas
- **Context efficiency**: Claude Code uses less context for the same information

---

## Questions & Support

If you have questions about the new structure:

1. **Check this guide first** - most common questions are answered here
2. **Review `_INDEX.md`** in the relevant domain for navigation
3. **Look at examples** - check how other experts structured their files
4. **Ask in documentation** - propose improvements to this guide

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-22 | 1.0 | Initial migration guide created |

---

**Remember**: Good documentation is:
- **Up-to-date**: Update when you make changes
- **Specific**: Link to exact sections, not vague references
- **Connected**: Use bidirectional cross-references
- **Findable**: Use clear section headers and table of contents
- **Useful**: Include code examples and practical patterns

Happy documenting! 📚
