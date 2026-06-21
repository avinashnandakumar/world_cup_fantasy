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
  renderProjectedBracket();
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
        teams: (snapshot.teams || []).map(normalizeGroupTeam),
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
      teams: (teamsFile.teams || []).map(normalizeGroupTeam),
      matches: (matchesFile.matches || []).map(normalizeGroupMatch)
    };
  } catch (error) {
    const [teamsFile, matchesFile] = await Promise.all([
      loadGroupJson(groupPaths.teams),
      loadGroupJson(groupPaths.matches)
    ]);
    return {
      meta: { generatedAt: new Date().toISOString(), lastExternalSyncAtUtc: "" },
      teams: (teamsFile.teams || []).map(normalizeGroupTeam),
      matches: (matchesFile.matches || []).map(normalizeGroupMatch)
    };
  }
}

function normalizeGroupTeam(team) {
  return {
    ...team,
    teamId: team.teamId,
    name: team.countryName || team.name || team.teamId,
    shortName: team.shortName || "",
    flagEmoji: correctedWorldCupFlag(team.teamId, team.flagEmoji),
    group: correctedWorldCupGroup(team.teamId, team.group),
    groupRank: team.groupRank
  };
}

function correctedWorldCupGroup(teamId, fallbackGroup) {
  return window.worldCup2026GroupForTeam
    ? window.worldCup2026GroupForTeam(teamId, fallbackGroup)
    : fallbackGroup || "";
}

function correctedWorldCupFlag(teamId, fallbackFlag) {
  return window.worldCup2026FlagForTeam
    ? window.worldCup2026FlagForTeam(teamId, fallbackFlag)
    : fallbackFlag || "";
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
            <tr class="${groupRowClass(row)}">
              <td>${row.rank}</td>
              <td>
                <span class="group-country-name">${groupCountryFlag(row.team)} ${escapeGroupHtml(row.team?.name || row.teamId)}</span>
                ${row.qualifiesForKnockouts ? `<span class="ko-badge">${row.qualificationType === "third" ? "3rd KO" : "KO"}</span>` : ""}
              </td>
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

function groupRowClass(row) {
  if (!row.qualifiesForKnockouts) return "";
  return row.qualificationType === "third" ? "is-qualifying is-third-qualifying" : "is-qualifying";
}

function renderProjectedBracket() {
  const node = document.getElementById("projected-bracket-grid");
  if (!node) return;
  const bracket = projectedKnockoutBracket(projectedGroupTables());
  node.innerHTML = bracket.map((match) => `
    <article class="bracket-match-card">
      <span>Match ${match.matchNumber}</span>
      <div>
        <strong>${escapeGroupHtml(match.home)}</strong>
        <em>vs</em>
        <strong>${escapeGroupHtml(match.away)}</strong>
      </div>
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
      const group = groupForMatch(match);
      if (!group) return;
      if (!groups.has(group)) groups.set(group, new Map());
      const table = groups.get(group);
      if (!table.has(match.homeTeamId)) table.set(match.homeTeamId, groupStandingRow(teamById(match.homeTeamId)));
      if (!table.has(match.awayTeamId)) table.set(match.awayTeamId, groupStandingRow(teamById(match.awayTeamId)));

      applyGroupResult(table.get(match.homeTeamId), match.homeGoals, match.awayGoals);
      applyGroupResult(table.get(match.awayTeamId), match.awayGoals, match.homeGoals);
    });

  const tables = [...groups.entries()].map(([group, table]) => {
    const hasStarted = [...table.values()].some((row) => row.played > 0);
    const hasSourceRanks = [...table.values()].some((row) => Number.isFinite(row.sourceRank));
    const rows = [...table.values()]
      .sort(hasStarted ? sortGroupStandingRows : sortSourceGroupRankRows)
      .map((row, index) => ({
        ...row,
        group,
        rank: hasStarted || !Number.isFinite(row.sourceRank) ? index + 1 : row.sourceRank
      }));
    return {
      group,
      hasStarted: hasStarted || hasSourceRanks,
      rows
    };
  });
  return markProjectedKnockoutQualifiers(tables);
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

function groupForMatch(match) {
  const homeGroup = correctedWorldCupGroup(match.homeTeamId, teamById(match.homeTeamId)?.group);
  const awayGroup = correctedWorldCupGroup(match.awayTeamId, teamById(match.awayTeamId)?.group);
  if (homeGroup && homeGroup === awayGroup) return homeGroup;
  return correctedWorldCupGroup(match.homeTeamId, match.group)
    || correctedWorldCupGroup(match.awayTeamId, match.group)
    || match.group
    || "";
}

function markProjectedKnockoutQualifiers(tables) {
  const thirdPlaceQualifiers = new Set(bestThirdPlaceRows(tables).slice(0, 8).map((row) => row.teamId));
  return tables.map((table) => ({
    ...table,
    rows: table.rows.map((row) => {
      const automatic = table.hasStarted && row.rank <= 2;
      const third = table.hasStarted && row.rank === 3 && thirdPlaceQualifiers.has(row.teamId);
      return {
        ...row,
        qualifiesForKnockouts: automatic || third,
        qualificationType: automatic ? "auto" : third ? "third" : ""
      };
    })
  }));
}

function bestThirdPlaceRows(tables) {
  return tables
    .filter((table) => table.hasStarted)
    .map((table) => table.rows.find((row) => row.rank === 3))
    .filter(Boolean)
    .sort(sortThirdPlaceRows);
}

function sortThirdPlaceRows(a, b) {
  return sortGroupStandingRows(a, b);
}

function projectedKnockoutBracket(tables) {
  const groupRows = new Map(tables.map((table) => [table.group, table.rows]));
  const thirdRows = bestThirdPlaceRows(tables).slice(0, 8);
  const usedThirdGroups = new Set();
  const thirdByGroup = new Map(thirdRows.map((row) => [row.group, row]));
  const matchups = [
    [73, seedLabel(groupRows, "A", 2), seedLabel(groupRows, "B", 2)],
    [74, seedLabel(groupRows, "E", 1), thirdSeedLabel(["A", "B", "C", "D", "F"], thirdByGroup, usedThirdGroups)],
    [75, seedLabel(groupRows, "F", 1), seedLabel(groupRows, "C", 2)],
    [76, seedLabel(groupRows, "C", 1), seedLabel(groupRows, "F", 2)],
    [77, seedLabel(groupRows, "I", 1), thirdSeedLabel(["C", "D", "F", "G", "H"], thirdByGroup, usedThirdGroups)],
    [78, seedLabel(groupRows, "E", 2), seedLabel(groupRows, "I", 2)],
    [79, seedLabel(groupRows, "A", 1), thirdSeedLabel(["C", "E", "F", "H", "I"], thirdByGroup, usedThirdGroups)],
    [80, seedLabel(groupRows, "L", 1), thirdSeedLabel(["E", "H", "I", "J", "K"], thirdByGroup, usedThirdGroups)],
    [81, seedLabel(groupRows, "D", 1), thirdSeedLabel(["B", "E", "F", "I", "J"], thirdByGroup, usedThirdGroups)],
    [82, seedLabel(groupRows, "G", 1), thirdSeedLabel(["A", "E", "H", "I", "J"], thirdByGroup, usedThirdGroups)],
    [83, seedLabel(groupRows, "K", 2), seedLabel(groupRows, "L", 2)],
    [84, seedLabel(groupRows, "H", 1), seedLabel(groupRows, "J", 2)],
    [85, seedLabel(groupRows, "B", 1), thirdSeedLabel(["E", "F", "G", "I", "J"], thirdByGroup, usedThirdGroups)],
    [86, seedLabel(groupRows, "J", 1), seedLabel(groupRows, "H", 2)],
    [87, seedLabel(groupRows, "K", 1), thirdSeedLabel(["D", "E", "I", "J", "L"], thirdByGroup, usedThirdGroups)],
    [88, seedLabel(groupRows, "D", 2), seedLabel(groupRows, "G", 2)]
  ];

  return matchups.map(([matchNumber, home, away]) => ({ matchNumber, home, away }));
}

function seedLabel(groupRows, group, rank) {
  const row = groupRows.get(group)?.find((item) => item.rank === rank);
  const seed = rank === 1 ? "W" : "R";
  return row ? `${seed}${group} ${row.team?.name || row.teamId}` : `${seed}${group}`;
}

function thirdSeedLabel(eligibleGroups, thirdByGroup, usedThirdGroups) {
  const group = eligibleGroups.find((candidate) => thirdByGroup.has(candidate) && !usedThirdGroups.has(candidate));
  if (!group) return `3rd ${eligibleGroups.join("/")}`;
  usedThirdGroups.add(group);
  const row = thirdByGroup.get(group);
  return `3${group} ${row.team?.name || row.teamId}`;
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
  return team?.flagEmoji || "";
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
