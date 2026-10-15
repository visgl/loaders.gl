import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';
import {parse} from 'yaml';

/** One offline agent prompt with observable scoring criteria. */
type EvalCase = {
  /** Stable case identifier. */
  id: string;
  /** Skill reference exercised by this case. */
  category: string;
  /** User request for a manual evaluation. */
  prompt: string;
  /** Observable requirements for a passing run. */
  expectedBehaviors: string[];
  /** Mistakes that fail the evaluation. */
  forbiddenMistakes: string[];
  /** Repository-relative authoritative source paths. */
  canonicalSources: string[];
};

/** Versioned offline agent evaluation cases. */
type EvalCorpus = {
  /** Evaluation schema version. */
  version: number;
  /** Purpose and limits of the corpus. */
  description: string;
  /** Independent evaluation prompts. */
  cases: EvalCase[];
};

const repositoryDirectory = process.cwd();
const skillDirectory = path.join(repositoryDirectory, 'skills/loadersgl');
const skillPath = path.join(skillDirectory, 'SKILL.md');
const evalPath = path.join(repositoryDirectory, 'test/llm/loadersgl-skill-evals.json');

/** Reads the portable skill metadata and instruction body. */
function readSkillFrontmatter(): {frontmatter: Record<string, unknown>; body: string} {
  const skill = readFileSync(skillPath, 'utf8');
  const match = skill.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  expect(match, 'SKILL.md must have YAML frontmatter').not.toBeNull();

  return {
    frontmatter: parse(match?.[1] || ''),
    body: match?.[2] || ''
  };
}

describe('loadersgl Agent Skill', () => {
  test('uses valid portable frontmatter and local references', () => {
    const {frontmatter, body} = readSkillFrontmatter();

    expect(Object.keys(frontmatter).sort()).toEqual(['description', 'name']);
    expect(frontmatter.name).toBe('loadersgl');
    expect(typeof frontmatter.description).toBe('string');
    expect((frontmatter.description as string).length).toBeGreaterThan(80);

    const referenceLinks = [...body.matchAll(/\]\((references\/[^)]+\.md)\)/g)].map(
      match => match[1]
    );
    expect(new Set(referenceLinks).size).toBe(4);
    for (const referenceLink of referenceLinks) {
      expect(existsSync(path.join(skillDirectory, referenceLink))).toBe(true);
    }

    expect(existsSync(path.join(skillDirectory, 'agents/openai.yaml'))).toBe(false);
    expect(existsSync(path.join(skillDirectory, 'scripts'))).toBe(false);
  });

  test('has a valid offline eval corpus with resolvable canonical sources', () => {
    const corpus = JSON.parse(readFileSync(evalPath, 'utf8')) as EvalCorpus;

    expect(corpus.version).toBe(1);
    expect(corpus.description.length).toBeGreaterThan(40);
    expect(corpus.cases.length).toBeGreaterThanOrEqual(9);

    const caseIds = new Set<string>();
    const categories = new Set<string>();
    for (const evalCase of corpus.cases) {
      expect(evalCase.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(caseIds.has(evalCase.id), `duplicate eval id: ${evalCase.id}`).toBe(false);
      caseIds.add(evalCase.id);
      categories.add(evalCase.category);

      expect(evalCase.prompt.length).toBeGreaterThan(30);
      expect(evalCase.expectedBehaviors.length).toBeGreaterThanOrEqual(3);
      expect(evalCase.forbiddenMistakes.length).toBeGreaterThanOrEqual(2);
      expect(evalCase.canonicalSources.length).toBeGreaterThanOrEqual(2);

      for (const source of evalCase.canonicalSources) {
        expect(path.isAbsolute(source), `${source} must be repository-relative`).toBe(false);
        expect(source.split('/')).not.toContain('..');
        expect(existsSync(path.join(repositoryDirectory, source)), `missing ${source}`).toBe(true);
      }
    }

    expect(categories).toEqual(
      new Set(['architecture', 'debugging', 'portability', 'contributing'])
    );
  });
});
