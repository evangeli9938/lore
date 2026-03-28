import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import type {
  DraftCandidate,
  ExtractionProvider,
  TurnArtifact,
} from "./extraction-provider";

type CodexProviderConfig = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
};

const AUTH_PATH = join(homedir(), ".codex", "auth.json");
const CONFIG_PATH = join(homedir(), ".codex", "config.toml");

const readCodexProviderConfig = async (): Promise<CodexProviderConfig> => {
  let apiKey: string | undefined;
  let baseUrl: string | undefined;
  let model: string | undefined;

  try {
    const authContent = await readFile(AUTH_PATH, "utf8");
    const parsed = JSON.parse(authContent) as Record<string, unknown>;
    if (typeof parsed.OPENAI_API_KEY === "string" && parsed.OPENAI_API_KEY.length > 0) {
      apiKey = parsed.OPENAI_API_KEY;
    }
  } catch {
    // Missing auth is a valid degraded state.
  }

  try {
    const configContent = await readFile(CONFIG_PATH, "utf8");
    const baseUrlMatch = configContent.match(/base_url\s*=\s*"([^"]+)"/);
    const modelMatch = configContent.match(/^model\s*=\s*"([^"]+)"/m);
    baseUrl = baseUrlMatch?.[1];
    model = modelMatch?.[1];
  } catch {
    // Missing config is also a valid degraded state.
  }

  return {
    apiKey,
    baseUrl,
    model: model ?? "gpt-5.4",
  };
};

const buildExtractionPrompt = (turn: TurnArtifact): string => JSON.stringify({
  instruction:
    "Extract explicit, candidate shared knowledge from this coding turn. Return a JSON array. Draft only domain_rule, glossary_term, architecture_fact, or explicit user_preference. Never draft decision_record. If nothing is explicit enough, return [].",
  turn,
});

const parseDraftCandidates = (
  text: string,
  turn: TurnArtifact,
): DraftCandidate[] => {
  try {
    const parsed = JSON.parse(text) as Array<Partial<DraftCandidate>>;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((candidate, index) => {
      if (
        typeof candidate.kind !== "string" ||
        typeof candidate.title !== "string" ||
        typeof candidate.content !== "string" ||
        typeof candidate.confidence !== "number"
      ) {
        return [];
      }

      return [{
        id: candidate.id ?? `draft-${turn.sessionId}-${turn.turnIndex}-${index}`,
        kind: candidate.kind,
        title: candidate.title,
        content: candidate.content,
        confidence: candidate.confidence,
        evidenceNote:
          typeof candidate.evidenceNote === "string"
            ? candidate.evidenceNote
            : "Observed from a coding turn.",
        sessionId: turn.sessionId,
        projectId: turn.projectId,
        turnIndex: turn.turnIndex,
        timestamp: turn.turnTimestamp,
        tags: Array.isArray(candidate.tags)
          ? candidate.tags.filter((tag): tag is string => typeof tag === "string")
          : [],
      }];
    });
  } catch {
    return [];
  }
};

export class CodexExtractionProvider implements ExtractionProvider {
  async extractCandidates(turn: TurnArtifact): Promise<DraftCandidate[]> {
    const config = await readCodexProviderConfig();
    if (!config.apiKey || !config.baseUrl) {
      return [];
    }

    try {
      const response = await fetch(`${config.baseUrl}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          input: buildExtractionPrompt(turn),
        }),
      });
      if (!response.ok) {
        return [];
      }

      const payload = await response.json() as { output_text?: string };
      return parseDraftCandidates(payload.output_text ?? "[]", turn);
    } catch {
      return [];
    }
  }
}
