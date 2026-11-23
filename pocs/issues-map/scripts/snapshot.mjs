// Lit le dépôt public dataforgoodfr/mediterranean-rescue et le tableau 44 de l'organisation
// avec la CLI GitHub, puis écrit data/issues-map/snapshot.json à la racine du dépôt (ignoré par
// Git). Lecture seule : aucune écriture dans GitHub.
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OWNER = "dataforgoodfr";
const REPO = "mediterranean-rescue";
const PROJECT = 44;
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "data", "issues-map");

const QUERY = `query($cursor: String) {
  repository(owner: "${OWNER}", name: "${REPO}") {
    issues(first: 50, after: $cursor, orderBy: {field: CREATED_AT, direction: ASC}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number title state url createdAt updatedAt closedAt
        issueType { name }
        parent { number }
        subIssues(first: 100) { nodes { number } }
        subIssuesSummary { total completed }
        blockedBy(first: 10) { nodes { number state } }
        assignees(first: 10) { nodes { login } }
        labels(first: 20) { nodes { name color } }
        milestone { title dueOn }
        projectItems(first: 10) {
          nodes {
            project { number }
            status: fieldValueByName(name: "Status") { ... on ProjectV2ItemFieldSingleSelectValue { name } }
            size: fieldValueByName(name: "Size") { ... on ProjectV2ItemFieldSingleSelectValue { name } }
            iteration: fieldValueByName(name: "Iteration") { ... on ProjectV2ItemFieldIterationValue { title startDate duration } }
          }
        }
      }
    }
  }
}`;

function gh(args) {
  return JSON.parse(execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
}

const raw = [];
let cursor = null;
do {
  const args = ["api", "graphql", "-f", `query=${QUERY}`];
  if (cursor) args.push("-f", `cursor=${cursor}`);
  const page = gh(args).data.repository.issues;
  raw.push(...page.nodes);
  cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
} while (cursor);

const issues = raw.map((i) => {
  const item = i.projectItems.nodes.find((n) => n.project?.number === PROJECT);
  return {
    number: i.number,
    title: i.title,
    state: i.state, // OPEN | CLOSED
    url: i.url,
    type: i.issueType?.name ?? null,
    parent: i.parent?.number ?? null,
    children: i.subIssues.nodes.map((n) => n.number),
    subTotal: i.subIssuesSummary.total,
    subDone: i.subIssuesSummary.completed,
    // Les issues ouvertes qui bloquent celle-ci (champ « Blocked by » de GitHub).
    blockedBy: i.blockedBy.nodes.filter((b) => b.state === "OPEN").map((b) => b.number),
    assignees: i.assignees.nodes.map((a) => a.login),
    labels: i.labels.nodes.map((l) => ({ name: l.name, color: l.color })),
    milestone: i.milestone ? { title: i.milestone.title, due: i.milestone.dueOn } : null,
    inProject: Boolean(item),
    status: item?.status?.name ?? null,
    size: item?.size?.name ?? null,
    iteration: item?.iteration
      ? { title: item.iteration.title, start: item.iteration.startDate, days: item.iteration.duration }
      : null,
    updatedAt: i.updatedAt,
  };
});

const snapshot = {
  source: `https://github.com/${OWNER}/${REPO}`,
  project: `https://github.com/orgs/${OWNER}/projects/${PROJECT}`,
  takenAt: new Date().toISOString(),
  issues,
};

mkdirSync(out, { recursive: true });
writeFileSync(join(out, "snapshot.json"), JSON.stringify(snapshot, null, 1));
const open = issues.filter((i) => i.state === "OPEN").length;
const epics = issues.filter((i) => i.type === "Epic").length;
console.log(`snapshot: ${issues.length} issues (${open} open, ${epics} epics) at ${snapshot.takenAt}`);
