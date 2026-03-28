import { describe, expect, it } from "vitest";

import {
  extractDraftCandidates,
  type DraftCandidate,
  type ExtractionProvider,
  type TurnArtifact,
} from "../src/extraction/extraction-provider";
import {
  consolidateDraftCandidates,
  type ConsolidatedEntry,
  type ConsolidationInput,
  type ConsolidationProvider,
} from "../src/extraction/consolidation-provider";
import type { SharedKnowledgeEntry } from "../src/shared/types";
import { contentHash } from "../src/shared/validators";

const makeTurnArtifact = (): TurnArtifact => ({
  sessionId: "session-1",
  projectId: "project-alpha",
  turnIndex: 4,
  turnTimestamp: "2026-03-28T19:55:00.000Z",
  userPrompt: "Please keep database columns snake_case.",
  assistantResponse: "I will follow the snake_case naming rule.",
  toolSummaries: ["migration succeeded"],
  files: ["src/db/migrate.ts"],
  recentToolNames: ["Bash", "Edit"],
});

const makeDraftCandidate = (): DraftCandidate => ({
  id: "draft-1",
  kind: "domain_rule",
  title: "Use snake_case for DB columns",
  content: "All database columns use snake_case naming.",
  confidence: 0.84,
  evidenceNote: "Observed after a user correction about naming.",
  sessionId: "session-1",
  projectId: "project-alpha",
  turnIndex: 4,
  timestamp: "2026-03-28T19:55:01.000Z",
  tags: ["database", "naming"],
});

const makePendingEntry = (): SharedKnowledgeEntry => ({
  id: "sk-pending-1",
  kind: "domain_rule",
  title: "Pending snake_case rule",
  content: "Use snake_case for columns.",
  confidence: 0.8,
  tags: ["database"],
  sourceProjectIds: ["project-alpha"],
  sourceMemoryIds: [],
  promotionSource: "suggested",
  createdBy: "system",
  approvalStatus: "pending",
  sessionCount: 3,
  projectCount: 1,
  lastSeenAt: "2026-03-28T19:40:00.000Z",
  contentHash: contentHash("Use snake_case for columns."),
  createdAt: "2026-03-28T19:40:00.000Z",
  updatedAt: "2026-03-28T19:40:00.000Z",
});

describe("provider seams", () => {
  it("runs extraction through an injected stub provider", async () => {
    const turn = makeTurnArtifact();
    const drafts = [makeDraftCandidate()];
    const calls: TurnArtifact[] = [];

    const provider: ExtractionProvider = {
      extractCandidates: async (input: TurnArtifact): Promise<DraftCandidate[]> => {
        calls.push(input);
        return drafts;
      },
    };

    const result = await extractDraftCandidates(provider, turn);

    expect(result).toEqual(drafts);
    expect(calls).toEqual([turn]);
  });

  it("runs consolidation through an injected stub provider", async () => {
    const input: ConsolidationInput = {
      drafts: [makeDraftCandidate()],
      observations: [
        {
          contentHash: contentHash("All database columns use snake_case naming."),
          sessionCount: 4,
          projectCount: 2,
          lastSeenAt: "2026-03-28T19:55:01.000Z",
          confidence: 0.92,
          sampleProjectIds: ["project-alpha", "project-beta"],
        },
      ],
      existingPendingEntries: [makePendingEntry()],
    };
    const entries: ConsolidatedEntry[] = [
      {
        entry: makePendingEntry(),
        consumedEntryIds: ["sk-pending-2"],
      },
    ];
    const calls: ConsolidationInput[] = [];

    const provider: ConsolidationProvider = {
      consolidate: async (
        value: ConsolidationInput,
      ): Promise<{ entries: ConsolidatedEntry[] }> => {
        calls.push(value);
        return { entries };
      },
    };

    const result = await consolidateDraftCandidates(provider, input);

    expect(result.entries).toEqual(entries);
    expect(calls).toEqual([input]);
  });
});
