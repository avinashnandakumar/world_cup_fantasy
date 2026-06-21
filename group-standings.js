const groupPaths = {
  snapshot: window.WORLD_CUP_CONFIG?.snapshotUrl || "./sample-data/dashboard-snapshot-8.json",
  teams: "./sample-data/simulated-teams-48.json",
  matches: "./sample-data/simulated-matches.json"
};

let groupModel = {
  meta: { generatedAt: new Date().toISOString(), lastExternalSyncAtUtc: "" },
  teams: [],
  matches: []
};

initGroupStandings();

async function initGroupStandings() {
  groupModel = await loadGroupModel();
  renderGroupUpdated();
  renderGroupSummary();
  renderGroupTables();
}

async function loadGroupJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

async function loadGroupModel() {
  try {
    const snapshot = await loadGroupJson(groupPaths.snapshot);
    if (snapshot.meta && Array.isArray(snapshot.teams)) {
      return {
        meta: {
          generatedAt: snapshot.meta.generatedAtUtc || new Date().toISOString(),
          lastExternalSyncAtUtc: snapshot.meta.lastExternalSyncAtUtc || ""
        },
        teams: (snapshot.teams || []).map((team) => ({
          teamId: team.teamId,
          name: team.countryName || team.name || team.teamId,
          shortName: team.shortName || team.teamId,
          flagEmoji: team.flagEmoji || "",
          group: team.group,
          groupRank: team.groupRank
        })),
        matches: (snapshot.matches || []).map(normalizeGroupMatch)
      };
    }

    const [teamsFile, matchesFile] = await Promise.all([
      loadGroupJson(snapshot.data?.teamsFile || groupPaths.teams),
      loadGroupJson(snapshot.data?.matchesFile || groupPaths.matches)
    ]);

    return {
      meta: {
        generatedAt: snapshot.generatedAt || new Date().toISOString(),
        lastExternalSyncAtUtc: snapshot.lastExternalSyncAtUtc || snapshot.data?.league?.lastExternalSyncAtUtc || ""
      },
      teams: teamsFile.teams || [],
      matches: (matchesFile.matches || []).map(normalizeGroupMatch)
    };
  } catch (error) {
    const [teamsFile, matchesFile] = await Promise.all([
      loadGroupJson(groupPaths.teams),
      loadGroupJson(groupPaths.matches)
    ]);
    return {
      meta: { generatedAt: new Date().toISOString(), lastExternalSyncAtUtc: "" },
      teams: teamsFile.teams || [],
      matches: (matchesFile.matches || []).map(normalizeGroupMatch)
    };
  }
}

function normalizeGroupMatch(match) {
  return {
    ...match,
    homeGoals: Number(match.homeGoals ?? match.homeScore ?? 0),
    awayGoals: Number(match.awayGoals ?? match.awayScore ?? 0)
  };
}

function renderGroupUpdated() {
  const sourceTime = groupModel.meta.lastExternalSyncAtUtc || groupModel.meta.generatedAt;
  const date = sourceTime ? new Date(sourceTime) : new Date();
  const label = `Updated at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  const node = document.getElementById("group-updated");
  if (node) node.innerHTML = `<span></span> ${label}`;
}

function renderGroupSummary() {
  const tables = projectedGroupTables();
  const started = tables.filter((table) => table.hasStarted).length;
  document.getElementById("group-count").textContent = String(tables.length);
  document.getElementById("group-country-count").textContent = String(groupModel.teams.length);
  document.getElementById("group-started-count").textContent = String(started);
}

function renderGroupTables() {
  const node = document.getElementById("group-standings-grid");
  const tables = projectedGroupTables().sort((a, b) => String(a.group).localeCompare(String(b.group)));
  node.innerHTML = tables.map((table) => `
    <article class="group-table-card">
      <header>
        <h3>Group ${escapeGroupHtml(table.group)}</h3>
        <span>${table.hasStarted ? "Current" : "Pending"}</span>
      </header>
      <table class="group-table">
        <thead>
          <tr>
            <th>RK</th>
            <th>Country</th>
            <th>Pts</th>
            <th>GD</th>
            <th>GF</th>
          </tr>
        </thead>
        <tbody>
          ${table.rows.map((row) => `
            <tr class="${row.rank <= 2 && table.hasStarted ? "is-qualifying" : ""}">
              <td>${row.rank}</td>
              <td>${groupCountryFlag(row.team)} ${escapeGroupHtml(row.team?.name || row.teamId)}</td>
              <td>${row.points}</td>
              <td>${formatGoalDifference(row.goalsFor - row.goalsAgainst)}</td>
              <td>${row.goalsFor}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </article>
  `).join("");
}

function projectedGroupTables() {
  const groups = new Map();
  groupModel.teams.forEach((team) => {
    if (!team.group) return;
    if (!groups.has(team.group)) groups.set(team.group, new Map());
    groups.get(team.group).set(team.teamId, groupStandingRow(team));
  });

  groupModel.matches
    .filter((match) => isGroupStageMatch(match) && matchHasStarted(match))
    .forEach((match) => {
      const group = match.group || teamById(match.homeTeamId)?.group || teamById(match.awayTeamId)?.group;
      if (!group) return;
      if (!groups.has(group)) groups.set(group, new Map());
      const table = groups.get(group);
      if (!table.has(match.homeTeamId)) table.set(match.homeTeamId, groupStandingRow(teamById(match.homeTeamId)));
      if (!table.has(match.awayTeamId)) table.set(match.awayTeamId, groupStandingRow(teamById(match.awayTeamId)));

      applyGroupResult(table.get(match.homeTeamId), match.homeGoals, match.awayGoals);
      applyGroupResult(table.get(match.awayTeamId), match.awayGoals, match.homeGoals);
    });

  return [...groups.entries()].map(([group, table]) => {
    const hasStarted = [...table.values()].some((row) => row.played > 0);
    const hasSourceRanks = [...table.values()].some((row) => Number.isFinite(row.sourceRank));
    const rows = [...table.values()]
      .sort(hasStarted ? sortGroupStandingRows : sortSourceGroupRankRows)
      .map((row, index) => ({
        ...row,
        rank: hasStarted || !Number.isFinite(row.sourceRank) ? index + 1 : row.sourceRank
      }));
    return {
      group,
      hasStarted: hasStarted || hasSourceRanks,
      rows
    };
  });
}

function groupStandingRow(team) {
  return {
    teamId: team.teamId,
    team,
    played: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    sourceRank: Number.isFinite(Number(team.groupRank)) ? Number(team.groupRank) : null
  };
}

function applyGroupResult(row, goalsFor, goalsAgainst) {
  row.played += 1;
  row.goalsFor += Number(goalsFor || 0);
  row.goalsAgainst += Number(goalsAgainst || 0);
  if (goalsFor > goalsAgainst) row.points += 3;
  else if (goalsFor === goalsAgainst) row.points += 1;
}

function sortGroupStandingRows(a, b) {
  const goalDifferenceA = a.goalsFor - a.goalsAgainst;
  const goalDifferenceB = b.goalsFor - b.goalsAgainst;
  if (b.points !== a.points) return b.points - a.points;
  if (goalDifferenceB !== goalDifferenceA) return goalDifferenceB - goalDifferenceA;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return String(a.team?.name || a.teamId).localeCompare(String(b.team?.name || b.teamId));
}

function sortSourceGroupRankRows(a, b) {
  const rankA = Number.isFinite(a.sourceRank) ? a.sourceRank : Number.MAX_SAFE_INTEGER;
  const rankB = Number.isFinite(b.sourceRank) ? b.sourceRank : Number.MAX_SAFE_INTEGER;
  if (rankA !== rankB) return rankA - rankB;
  return String(a.team?.name || a.teamId).localeCompare(String(b.team?.name || b.teamId));
}

function teamById(teamId) {
  return groupModel.teams.find((team) => team.teamId === teamId) || {};
}

function isGroupStageMatch(match) {
  return String(match.stage || "").toLowerCase() === "group" || Boolean(match.group);
}

function matchHasStarted(match) {
  const status = String(match.status || "scheduled").toLowerCase();
  return status !== "scheduled" && status !== "postponed";
}

function groupCountryFlag(team) {
  return team?.flagEmoji || team?.shortName || "";
}

function formatGoalDifference(value) {
  const numberValue = Number(value || 0);
  return `${numberValue > 0 ? "+" : ""}${numberValue}`;
}

function escapeGroupHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
