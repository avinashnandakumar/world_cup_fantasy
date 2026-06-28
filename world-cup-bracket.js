const bracketPaths = {
  snapshot: window.WORLD_CUP_CONFIG?.snapshotUrl || "./sample-data/dashboard-snapshot-8.json",
  league: "./sample-data/simulated-league-8.json",
  teams: "./sample-data/simulated-teams-48.json",
  matches: "./sample-data/simulated-matches.json"
};

const knockoutSchedule = {
  73: "2026-06-28",
  74: "2026-06-29",
  75: "2026-06-29",
  76: "2026-06-29",
  77: "2026-06-30",
  78: "2026-06-30",
  79: "2026-06-30",
  80: "2026-07-01",
  81: "2026-07-01",
  82: "2026-07-01",
  83: "2026-07-02",
  84: "2026-07-02",
  85: "2026-07-02",
  86: "2026-07-03",
  87: "2026-07-03",
  88: "2026-07-03",
  89: "2026-07-04",
  90: "2026-07-04",
  91: "2026-07-05",
  92: "2026-07-05",
  93: "2026-07-06",
  94: "2026-07-06",
  95: "2026-07-07",
  96: "2026-07-07",
  97: "2026-07-09",
  98: "2026-07-10",
  99: "2026-07-11",
  100: "2026-07-11",
  101: "2026-07-14",
  102: "2026-07-15",
  104: "2026-07-19"
};

const roundDefinitions = [
  { key: "r32", title: "Round of 32", matchNumbers: [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88] },
  { key: "r16", title: "Round of 16", pairings: [[89, 73, 75], [90, 74, 77], [91, 76, 78], [92, 79, 80], [93, 83, 84], [94, 81, 82], [95, 86, 88], [96, 85, 87]] },
  { key: "qf", title: "Quarterfinals", pairings: [[97, 89, 90], [98, 93, 94], [99, 91, 92], [100, 95, 96]] },
  { key: "sf", title: "Semifinals", pairings: [[101, 97, 98], [102, 99, 100]] },
  { key: "final", title: "Final", pairings: [[104, 101, 102]] }
];

let bracketModel = {
  meta: { generatedAt: new Date().toISOString(), lastExternalSyncAtUtc: "" },
  managers: [],
  rosters: [],
  teams: [],
  matches: []
};

initWorldCupBracket();

async function initWorldCupBracket() {
  bracketModel = await loadBracketModel();
  renderBracketUpdated();
  renderFullBracket();
}

async function loadBracketJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

async function loadBracketModel() {
  try {
    const snapshot = await loadBracketJson(bracketPaths.snapshot);
    if (snapshot.meta && Array.isArray(snapshot.teams)) {
      return {
        meta: {
          generatedAt: snapshot.meta.generatedAtUtc || new Date().toISOString(),
          lastExternalSyncAtUtc: snapshot.meta.lastExternalSyncAtUtc || ""
        },
        managers: snapshot.managers || [],
        rosters: snapshot.rosters || [],
        teams: (snapshot.teams || []).map(normalizeBracketTeam),
        matches: (snapshot.matches || []).map(normalizeBracketMatch)
      };
    }

    const [league, teamsFile, matchesFile] = await Promise.all([
      loadBracketJson(bracketPaths.league),
      loadBracketJson(snapshot.data?.teamsFile || bracketPaths.teams),
      loadBracketJson(snapshot.data?.matchesFile || bracketPaths.matches)
    ]);

    return {
      meta: {
        generatedAt: snapshot.generatedAt || new Date().toISOString(),
        lastExternalSyncAtUtc: snapshot.lastExternalSyncAtUtc || snapshot.data?.league?.lastExternalSyncAtUtc || ""
      },
      managers: league.managers || [],
      rosters: league.rosters || [],
      teams: (teamsFile.teams || []).map(normalizeBracketTeam),
      matches: (matchesFile.matches || []).map(normalizeBracketMatch)
    };
  } catch (error) {
    const [league, teamsFile, matchesFile] = await Promise.all([
      loadBracketJson(bracketPaths.league),
      loadBracketJson(bracketPaths.teams),
      loadBracketJson(bracketPaths.matches)
    ]);
    return {
      meta: { generatedAt: new Date().toISOString(), lastExternalSyncAtUtc: "" },
      managers: league.managers || [],
      rosters: league.rosters || [],
      teams: (teamsFile.teams || []).map(normalizeBracketTeam),
      matches: (matchesFile.matches || []).map(normalizeBracketMatch)
    };
  }
}

function normalizeBracketTeam(team) {
  return {
    ...team,
    teamId: team.teamId,
    name: team.countryName || team.name || team.teamId,
    flagEmoji: correctedWorldCupFlag(team.teamId, team.flagEmoji),
    group: correctedWorldCupGroup(team.teamId, team.group),
    groupRank: team.groupRank
  };
}

function normalizeBracketMatch(match) {
  return {
    ...match,
    homeGoals: Number(match.homeGoals ?? match.homeScore ?? 0),
    awayGoals: Number(match.awayGoals ?? match.awayScore ?? 0)
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

function renderBracketUpdated() {
  const sourceTime = bracketModel.meta.lastExternalSyncAtUtc || bracketModel.meta.generatedAt;
  const date = sourceTime ? new Date(sourceTime) : new Date();
  const label = `Updated at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  const node = document.getElementById("bracket-updated");
  if (node) node.innerHTML = `<span></span> ${label}`;
}

function renderFullBracket() {
  const tree = document.getElementById("full-bracket-tree");
  if (!tree) return;

  const matchesByNumber = buildKnockoutMatches();
  const rounds = roundDefinitions.map((round) => ({
    ...round,
    matches: round.matchNumbers
      ? round.matchNumbers.map((matchNumber) => matchesByNumber.get(matchNumber))
      : round.pairings.map(([matchNumber]) => matchesByNumber.get(matchNumber))
  }));

  document.getElementById("bracket-team-count").textContent = String(projectedRoundOf32(projectedGroupTables()).length * 2);
  document.getElementById("bracket-match-count").textContent = String([...matchesByNumber.keys()].length);
  tree.innerHTML = rounds.map(renderBracketRound).join("");
}

function renderBracketRound(round) {
  return `
    <section class="full-bracket-round full-bracket-round-${round.key}" aria-label="${escapeBracketHtml(round.title)}">
      <header>
        <h2>${escapeBracketHtml(round.title)}</h2>
        <span>${round.matches.length} game${round.matches.length === 1 ? "" : "s"}</span>
      </header>
      <div class="full-bracket-round-stack">
        ${round.matches.map(renderBracketMatch).join("")}
      </div>
    </section>
  `;
}

function renderBracketMatch(match) {
  return `
    <article class="full-bracket-match">
      <div class="full-bracket-match-top">
        <span>Match ${match.matchNumber}</span>
        <time>${escapeBracketHtml(scheduleLabel(match.matchNumber))}</time>
      </div>
      <div class="full-bracket-sides">
        ${renderBracketBranchSide(match.home)}
        <span class="full-bracket-vs">vs</span>
        ${renderBracketBranchSide(match.away)}
      </div>
    </article>
  `;
}

function renderBracketBranchSide(side) {
  const possibilities = side.possibilities || [];
  const emptyClass = possibilities.length ? "" : " full-bracket-side-empty";
  return `
    <div class="full-bracket-side${emptyClass}">
      <strong>${escapeBracketHtml(side.label)}</strong>
      <div class="full-bracket-path-list">
        ${possibilities.length ? possibilities.map(renderPossibilityChip).join("") : `<span class="full-bracket-empty-slot">TBD</span>`}
      </div>
    </div>
  `;
}

function renderPossibilityChip(item) {
  return `
    <span class="full-bracket-path-chip">
      <span>${escapeBracketHtml(item.flag || "")}</span>
      <strong>${escapeBracketHtml(item.country)}</strong>
      <em>${escapeBracketHtml(item.manager)}</em>
    </span>
  `;
}

function buildKnockoutMatches() {
  const matches = new Map();
  projectedRoundOf32(projectedGroupTables()).forEach((match) => {
    matches.set(match.matchNumber, {
      matchNumber: match.matchNumber,
      home: seedSide(match.home),
      away: seedSide(match.away)
    });
  });

  roundDefinitions
    .filter((round) => round.pairings)
    .forEach((round) => {
      round.pairings.forEach(([matchNumber, homeSource, awaySource]) => {
        matches.set(matchNumber, {
          matchNumber,
          home: winnerSide(homeSource, matches),
          away: winnerSide(awaySource, matches)
        });
      });
    });

  return matches;
}

function seedSide(seed) {
  const team = teamById(seed.teamId);
  return {
    label: seed.country,
    sourceMatchNumber: null,
    possibilities: [{
      teamId: seed.teamId,
      country: seed.country,
      manager: managerLabelForTeam(seed.teamId),
      flag: team?.flagEmoji || ""
    }]
  };
}

function winnerSide(sourceMatchNumber, matches) {
  return {
    label: `Winner ${sourceMatchNumber}`,
    sourceMatchNumber,
    possibilities: []
  };
}

function projectedRoundOf32(tables) {
  const groupRows = new Map(tables.map((table) => [table.group, table.rows]));
  const thirdRows = bestThirdPlaceRows(tables).slice(0, 8);
  const usedThirdGroups = new Set();
  const thirdByGroup = new Map(thirdRows.map((row) => [row.group, row]));
  const matchups = [
    [73, seedLabel(groupRows, "A", 2), seedLabel(groupRows, "B", 2)],
    [74, seedLabel(groupRows, "E", 1), thirdSeedByGroup("D", thirdByGroup, usedThirdGroups)],
    [75, seedLabel(groupRows, "F", 1), seedLabel(groupRows, "C", 2)],
    [76, seedLabel(groupRows, "C", 1), seedLabel(groupRows, "F", 2)],
    [77, seedLabel(groupRows, "I", 1), thirdSeedByGroup("F", thirdByGroup, usedThirdGroups)],
    [78, seedLabel(groupRows, "E", 2), seedLabel(groupRows, "I", 2)],
    [79, seedLabel(groupRows, "A", 1), thirdSeedByGroup("E", thirdByGroup, usedThirdGroups)],
    [80, seedLabel(groupRows, "L", 1), thirdSeedByGroup("K", thirdByGroup, usedThirdGroups)],
    [81, seedLabel(groupRows, "D", 1), thirdSeedByGroup("B", thirdByGroup, usedThirdGroups)],
    [82, seedLabel(groupRows, "G", 1), thirdSeedByGroup("I", thirdByGroup, usedThirdGroups)],
    [83, seedLabel(groupRows, "K", 2), seedLabel(groupRows, "L", 2)],
    [84, seedLabel(groupRows, "H", 1), seedLabel(groupRows, "J", 2)],
    [85, seedLabel(groupRows, "B", 1), thirdSeedByGroup("J", thirdByGroup, usedThirdGroups)],
    [86, seedLabel(groupRows, "J", 1), seedLabel(groupRows, "H", 2)],
    [87, seedLabel(groupRows, "K", 1), thirdSeedByGroup("L", thirdByGroup, usedThirdGroups)],
    [88, seedLabel(groupRows, "D", 2), seedLabel(groupRows, "G", 2)]
  ];

  return matchups.map(([matchNumber, home, away]) => ({ matchNumber, home, away }));
}

function seedLabel(groupRows, group, rank) {
  const row = groupRows.get(group)?.find((item) => item.rank === rank);
  const seed = rank === 1 ? "W" : "R";
  return {
    seed: `${seed}${group}`,
    teamId: row?.teamId || "",
    country: row ? (row.team?.name || row.teamId) : `${seed}${group}`
  };
}

function thirdSeedLabel(eligibleGroups, thirdByGroup, usedThirdGroups) {
  const group = eligibleGroups.find((candidate) => thirdByGroup.has(candidate) && !usedThirdGroups.has(candidate));
  if (!group) return { seed: `3rd ${eligibleGroups.join("/")}`, teamId: "", country: `3rd ${eligibleGroups.join("/")}` };
  usedThirdGroups.add(group);
  const row = thirdByGroup.get(group);
  return {
    seed: `3${group}`,
    teamId: row?.teamId || "",
    country: row ? (row.team?.name || row.teamId) : `3${group}`
  };
}

function thirdSeedByGroup(group, thirdByGroup, usedThirdGroups) {
  const row = thirdByGroup.get(group);
  usedThirdGroups.add(group);
  return {
    seed: `3${group}`,
    teamId: row?.teamId || "",
    country: row ? (row.team?.name || row.teamId) : `3${group}`
  };
}

function projectedGroupTables() {
  const groups = new Map();
  bracketModel.teams.forEach((team) => {
    if (!team.group) return;
    if (!groups.has(team.group)) groups.set(team.group, new Map());
    groups.get(team.group).set(team.teamId, groupStandingRow(team));
  });

  bracketModel.matches
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
    return { group, hasStarted: hasStarted || hasSourceRanks, rows };
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
    .sort(sortGroupStandingRows);
}

function managerLabelForTeam(teamId) {
  if (!teamId) return "TBD";
  const managerNames = bracketModel.rosters
    .filter((roster) => roster.teamId === teamId)
    .map((roster) => managerById(roster.managerId)?.displayName || roster.managerId)
    .filter(Boolean);
  return managerNames.length ? managerNames.join(" + ") : "Unowned";
}

function teamById(teamId) {
  return bracketModel.teams.find((team) => team.teamId === teamId) || {};
}

function managerById(managerId) {
  return bracketModel.managers.find((manager) => manager.managerId === managerId) || {};
}

function isGroupStageMatch(match) {
  return String(match.stage || "").toLowerCase() === "group" || Boolean(match.group);
}

function matchHasStarted(match) {
  const status = String(match.status || "scheduled").toLowerCase();
  return status !== "scheduled" && status !== "postponed";
}

function scheduleLabel(matchNumber) {
  const dateKey = knockoutSchedule[matchNumber];
  if (!dateKey) return "TBD";
  const [year, month, day] = dateKey.split("-").map(Number);
  const matchDate = new Date(year, month - 1, day);
  return matchDate.toLocaleDateString([], { month: "short", day: "numeric" });
}

function escapeBracketHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
