const fallbackSnapshot = {
  data: {
    league: { name: "Simulated 8-Manager League", currentPhase: "Final Complete" },
    standings: [
      { rank: 1, managerId: "mgr-black-arrows", displayName: "Black Arrows", totalPoints: 7.75, championOwned: true },
      { rank: 2, managerId: "mgr-blue-comets", displayName: "Blue Comets", totalPoints: 6.75, championOwned: false },
      { rank: 3, managerId: "mgr-orange-crush", displayName: "Orange Crush", totalPoints: 3.5, championOwned: false },
      { rank: 4, managerId: "mgr-golden-boots", displayName: "Golden Boots", totalPoints: 1.5, championOwned: false },
      { rank: 5, managerId: "mgr-silver-strikers", displayName: "Silver Strikers", totalPoints: 1.25, championOwned: false },
      { rank: 6, managerId: "mgr-green-waves", displayName: "Green Waves", totalPoints: 1, championOwned: false }
    ]
  }
};

const fallbackLeague = {
  managers: [
    { managerId: "mgr-black-arrows", displayName: "Black Arrows", shortName: "Arrows" },
    { managerId: "mgr-blue-comets", displayName: "Blue Comets", shortName: "Comets" },
    { managerId: "mgr-orange-crush", displayName: "Orange Crush", shortName: "Crush" },
    { managerId: "mgr-golden-boots", displayName: "Golden Boots", shortName: "Boots" },
    { managerId: "mgr-silver-strikers", displayName: "Silver Strikers", shortName: "Strikers" },
    { managerId: "mgr-green-waves", displayName: "Green Waves", shortName: "Waves" }
  ],
  rosters: [
    { managerId: "mgr-black-arrows", teamId: "team-ionia" },
    { managerId: "mgr-black-arrows", teamId: "team-hibernia" },
    { managerId: "mgr-blue-comets", teamId: "team-atlas" },
    { managerId: "mgr-orange-crush", teamId: "team-galdor" },
    { managerId: "mgr-golden-boots", teamId: "team-cyrenia" },
    { managerId: "mgr-green-waves", teamId: "team-deltora" },
    { managerId: "mgr-silver-strikers", teamId: "team-freedonia" }
  ]
};

const fallbackTeams = [
  { teamId: "team-ionia", displayName: "Ionia", group: "C", status: "champion" },
  { teamId: "team-hibernia", displayName: "Hibernia", group: "B", status: "eliminated_r32" },
  { teamId: "team-atlas", displayName: "Atlas", group: "A", status: "eliminated_qf" },
  { teamId: "team-galdor", displayName: "Galdor", group: "B", status: "runner_up" },
  { teamId: "team-cyrenia", displayName: "Cyrenia", group: "A", status: "group_exit" },
  { teamId: "team-deltora", displayName: "Deltora", group: "A", status: "group_exit" },
  { teamId: "team-freedonia", displayName: "Freedonia", group: "B", status: "group_exit" }
];

const fallbackMatches = [
  { stage: "FINAL", status: "final", homeTeamId: "team-ionia", awayTeamId: "team-galdor", homeGoals: 2, awayGoals: 1 },
  { stage: "QF", status: "final", homeTeamId: "team-atlas", awayTeamId: "team-ionia", homeGoals: 0, awayGoals: 1 },
  { stage: "R16", status: "final", homeTeamId: "team-atlas", awayTeamId: "team-eldoria", homeGoals: 2, awayGoals: 0 }
];

const fallbackLedger = [
  { managerId: "mgr-black-arrows", teamId: "team-ionia", category: "champion", points: 2, explanation: "Ionia won the World Cup." },
  { managerId: "mgr-black-arrows", teamId: "team-ionia", category: "goal_scored", points: 1, explanation: "Ionia scored 2 goals against Galdor." },
  { managerId: "mgr-blue-comets", teamId: "team-atlas", category: "win", points: 1, explanation: "Atlas defeated Eldoria after extra time." },
  { managerId: "mgr-orange-crush", teamId: "team-galdor", category: "goal_allowed", points: -0.5, explanation: "Galdor allowed 2 goals against Ionia." }
];

const state = {
  snapshot: fallbackSnapshot,
  league: fallbackLeague,
  teams: fallbackTeams,
  matches: fallbackMatches,
  ledger: fallbackLedger,
  selectedManagerId: "mgr-black-arrows"
};

const $ = (id) => document.getElementById(id);

async function fetchJson(path, fallback) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed ${path}`);
    return await response.json();
  } catch {
    return fallback;
  }
}

function teamName(teamId) {
  return state.teams.find((team) => team.teamId === teamId)?.displayName || shortId(teamId);
}

function managerName(managerId) {
  return state.league.managers.find((manager) => manager.managerId === managerId)?.displayName ||
    state.snapshot.data.standings.find((manager) => manager.managerId === managerId)?.displayName ||
    shortId(managerId);
}

function shortId(value) {
  return String(value || "Unknown").replace(/^team-/, "").replace(/^mgr-/, "").replaceAll("-", " ");
}

function formatPoints(points) {
  return Number(points || 0).toFixed(Number.isInteger(Number(points)) ? 0 : 2);
}

function pointsClass(points) {
  return Number(points) < 0 ? "delta-negative" : "delta-positive";
}

function statusLabel(status) {
  return String(status || "active").replaceAll("_", " ");
}

function standings() {
  return [...state.snapshot.data.standings].sort((a, b) => a.rank - b.rank);
}

function ledgerForManager(managerId) {
  return state.ledger.filter((row) => row.managerId === managerId);
}

function managerTotal(managerId) {
  return state.snapshot.data.standings.find((row) => row.managerId === managerId)?.totalPoints || 0;
}

function teamTotal(teamId) {
  return state.ledger
    .filter((row) => row.teamId === teamId)
    .reduce((total, row) => total + Number(row.points || 0), 0);
}

function rosterForManager(managerId) {
  return state.league.rosters
    .filter((row) => row.managerId === managerId)
    .map((row) => state.teams.find((team) => team.teamId === row.teamId) || { teamId: row.teamId, displayName: teamName(row.teamId) });
}

function renderHeader() {
  const [leader, second] = standings();
  const gap = second ? Number(leader.totalPoints) - Number(second.totalPoints) : 0;
  $("leader-name").textContent = leader.displayName;
  $("leader-score").textContent = formatPoints(leader.totalPoints);
  $("leader-context").textContent = second
    ? `${second.displayName} is ${formatPoints(gap)} point${gap === 1 ? "" : "s"} back. Champion ownership is visible, but the board is still about total roster lift.`
    : "The race board is waiting for challengers.";
  $("sync-pill").textContent = `${state.snapshot.mode || "demo"} · ${state.snapshot.data?.league?.currentPhase || "ready"}`;
}

function renderLeaderboard() {
  const leaderScore = standings()[0]?.totalPoints || 0;
  $("leaderboard-list").innerHTML = standings().map((row) => {
    const gap = Number(leaderScore) - Number(row.totalPoints);
    const champion = row.championOwned ? " · champion" : "";
    return `
      <li class="leaderboard-row">
        <span class="rank">${row.rank}</span>
        <span>
          <span class="manager-name">${row.displayName}</span>
          <span class="manager-gap">${row.rank === 1 ? "leader" : `${formatPoints(gap)} back`}${champion}</span>
        </span>
        <span class="points">${formatPoints(row.totalPoints)}</span>
      </li>
    `;
  }).join("");
}

function renderMatches() {
  const matches = state.matches.slice(-5).reverse();
  $("match-count").textContent = `${state.matches.length} tracked`;
  $("match-strip-track").innerHTML = matches.map((match) => `
    <article class="match-chip ${match.status}">
      <div class="match-meta">
        <span>${match.stage || "Match"}</span>
        <span>${match.status || "scheduled"}</span>
      </div>
      <div class="team-line">
        <span>${teamName(match.homeTeamId)}</span>
        <strong>${match.homeGoals ?? "-"}</strong>
      </div>
      <div class="team-line">
        <span>${teamName(match.awayTeamId)}</span>
        <strong>${match.awayGoals ?? "-"}</strong>
      </div>
    </article>
  `).join("");
}

function renderManagerPicker() {
  $("manager-select").innerHTML = standings().map((row) => `
    <option value="${row.managerId}">${row.displayName}</option>
  `).join("");
  $("manager-select").value = state.selectedManagerId;
}

function renderManager() {
  const standing = standings().find((row) => row.managerId === state.selectedManagerId) || standings()[0];
  state.selectedManagerId = standing.managerId;
  const roster = rosterForManager(standing.managerId);
  const ledger = ledgerForManager(standing.managerId);
  const positive = ledger.filter((row) => Number(row.points) > 0).length;
  const negative = ledger.filter((row) => Number(row.points) < 0).length;

  $("manager-profile").innerHTML = `
    <div class="profile-top">
      <div class="profile-mark">${standing.rank}</div>
      <div>
        <h3>${standing.displayName}</h3>
        <p class="leader-context">Rank ${standing.rank}. ${standing.championOwned ? "Owns the champion." : "Built from match-by-match value."}</p>
      </div>
    </div>
    <div class="profile-stats">
      <div class="stat-tile"><span>Total</span><strong>${formatPoints(standing.totalPoints)}</strong></div>
      <div class="stat-tile"><span>Roster</span><strong>${roster.length}</strong></div>
      <div class="stat-tile"><span>Swings</span><strong>${positive}/${negative}</strong></div>
    </div>
  `;

  $("roster-summary").textContent = `${roster.length} countries`;
  const maxTeamScore = Math.max(1, ...roster.map((team) => Math.abs(teamTotal(team.teamId))));
  $("roster-list").innerHTML = roster.map((team) => {
    const total = teamTotal(team.teamId);
    const width = Math.max(8, Math.min(100, Math.abs(total) / maxTeamScore * 100));
    return `
      <article class="roster-row">
        <div class="roster-meta">
          <span class="roster-name">${team.displayName}</span>
          <span class="${pointsClass(total)}">${formatPoints(total)}</span>
        </div>
        <div class="roster-meta">
          <span class="roster-status">${statusLabel(team.status)}</span>
          <span>Group ${team.group || "-"}</span>
        </div>
        <div class="meter"><span style="width:${width}%"></span></div>
      </article>
    `;
  }).join("");

  $("moment-list").innerHTML = ledger.slice(-6).reverse().map((row) => `
    <article class="moment-row">
      <div class="moment-meta">
        <span>${teamName(row.teamId)} · ${statusLabel(row.category)}</span>
        <strong class="${pointsClass(row.points)}">${formatPoints(row.points)}</strong>
      </div>
      <span class="moment-title">${row.explanation}</span>
    </article>
  `).join("");
}

function renderAudit(filter = "") {
  const query = filter.trim().toLowerCase();
  const rows = state.ledger.filter((row) => {
    const haystack = `${managerName(row.managerId)} ${teamName(row.teamId)} ${row.category} ${row.explanation}`.toLowerCase();
    return haystack.includes(query);
  });
  $("audit-list").innerHTML = rows.map((row) => `
    <article class="audit-row">
      <strong>${managerName(row.managerId)} · ${teamName(row.teamId)} <span class="${pointsClass(row.points)}">${formatPoints(row.points)}</span></strong>
      <p>${statusLabel(row.category)} · ${row.explanation}</p>
    </article>
  `).join("");
}

function bindInteractions() {
  $("manager-select").addEventListener("change", (event) => {
    state.selectedManagerId = event.target.value;
    renderManager();
  });
  $("audit-open").addEventListener("click", () => {
    $("audit-drawer").classList.add("open");
    $("audit-drawer").setAttribute("aria-hidden", "false");
    $("audit-search").focus();
  });
  const closeAudit = () => {
    $("audit-drawer").classList.remove("open");
    $("audit-drawer").setAttribute("aria-hidden", "true");
  };
  $("audit-close").addEventListener("click", closeAudit);
  $("audit-close-scrim").addEventListener("click", closeAudit);
  $("audit-search").addEventListener("input", (event) => renderAudit(event.target.value));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAudit();
  });
}

async function boot() {
  const [snapshot, league, teamsFile, matchesFile, ledgerFile] = await Promise.all([
    fetchJson("../../sample-data/dashboard-snapshot-8.json", fallbackSnapshot),
    fetchJson("../../sample-data/simulated-league-8.json", fallbackLeague),
    fetchJson("../../sample-data/simulated-teams-48.json", { teams: fallbackTeams }),
    fetchJson("../../sample-data/simulated-matches.json", { matches: fallbackMatches }),
    fetchJson("../../sample-data/simulated-scoring-ledger-8.json", { ledger: fallbackLedger })
  ]);

  state.snapshot = snapshot;
  state.league = league;
  state.teams = teamsFile.teams || teamsFile;
  state.matches = matchesFile.matches || matchesFile;
  state.ledger = ledgerFile.ledger || ledgerFile;
  state.selectedManagerId = standings()[0]?.managerId || state.selectedManagerId;

  renderHeader();
  renderLeaderboard();
  renderMatches();
  renderManagerPicker();
  renderManager();
  renderAudit();
  bindInteractions();
}

boot();
