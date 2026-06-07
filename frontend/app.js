const SNAPSHOT_URLS = ["./dashboard-snapshot.json", "../sample-data/dashboard-snapshot-8.json"];
const SAMPLE_BASE_URLS = ["../", "./", "/"];
const managerColors = {
  blue: "#1479ff",
  red: "#e5484d",
  gold: "#d99100",
  green: "#16a36a",
  purple: "#7c5cff",
  silver: "#7d8796",
  orange: "#f97316",
  black: "#2b2f36"
};

const fallbackSnapshot = {
  meta: {
    leagueName: "World Cup Chaos League",
    source: "simulated",
    phase: "Group Stage Matchday 2",
    lastUpdated: "2026-06-07T18:30:00-07:00",
    summary: "Sample dashboard data is showing because no live snapshot is connected yet."
  },
  timeline: [
    { id: "groups", label: "Groups", status: "active", note: "All rosters alive" },
    { id: "r32", label: "Round of 32", status: "pending", note: "32 teams" },
    { id: "r16", label: "Round of 16", status: "pending", note: "16 teams" },
    { id: "qf", label: "Quarterfinals", status: "pending", note: "8 teams" },
    { id: "sf", label: "Semifinals", status: "pending", note: "4 teams" },
    { id: "final", label: "Final", status: "pending", note: "Champion +2" }
  ],
  managers: [
    { id: "m1", name: "Avi", color: "#1479ff", points: 18.25, movement: 1, alive: 5, qualified: 2, groupWinners: 1 },
    { id: "m2", name: "Maya", color: "#16a36a", points: 17.5, movement: -1, alive: 4, qualified: 2, groupWinners: 0 },
    { id: "m3", name: "Sam", color: "#e5484d", points: 15.75, movement: 2, alive: 5, qualified: 1, groupWinners: 1 },
    { id: "m4", name: "Jordan", color: "#7c5cff", points: 13.5, movement: 0, alive: 3, qualified: 1, groupWinners: 0 }
  ],
  countries: [
    { id: "arg", name: "Argentina", flag: "🇦🇷", group: "A", managerId: "m1", points: 7.25, status: "qualified", nextMatch: "vs Japan" },
    { id: "usa", name: "United States", flag: "🇺🇸", group: "D", managerId: "m1", points: 5.5, status: "alive", nextMatch: "vs Ghana" },
    { id: "mar", name: "Morocco", flag: "🇲🇦", group: "H", managerId: "m1", points: 4.25, status: "alive", nextMatch: "vs Chile" },
    { id: "fra", name: "France", flag: "🇫🇷", group: "B", managerId: "m2", points: 8, status: "qualified", nextMatch: "vs Korea Republic" },
    { id: "jpn", name: "Japan", flag: "🇯🇵", group: "A", managerId: "m2", points: 4.75, status: "alive", nextMatch: "vs Argentina" },
    { id: "gha", name: "Ghana", flag: "🇬🇭", group: "D", managerId: "m2", points: 4.75, status: "alive", nextMatch: "vs United States" },
    { id: "bra", name: "Brazil", flag: "🇧🇷", group: "C", managerId: "m3", points: 8.5, status: "qualified", nextMatch: "vs Croatia" },
    { id: "can", name: "Canada", flag: "🇨🇦", group: "F", managerId: "m3", points: 3.75, status: "alive", nextMatch: "vs Senegal" },
    { id: "chi", name: "Chile", flag: "🇨🇱", group: "H", managerId: "m3", points: 3.5, status: "alive", nextMatch: "vs Morocco" },
    { id: "esp", name: "Spain", flag: "🇪🇸", group: "E", managerId: "m4", points: 7, status: "qualified", nextMatch: "vs Egypt" },
    { id: "sen", name: "Senegal", flag: "🇸🇳", group: "F", managerId: "m4", points: 4.25, status: "alive", nextMatch: "vs Canada" },
    { id: "egy", name: "Egypt", flag: "🇪🇬", group: "E", managerId: "m4", points: 2.25, status: "danger", nextMatch: "vs Spain" }
  ],
  matches: [
    {
      id: "match-001",
      status: "live",
      minute: "67'",
      home: "United States",
      away: "Ghana",
      homeScore: 2,
      awayScore: 1,
      impacts: [
        { managerId: "m1", label: "USA win + goals", points: 1.75 },
        { managerId: "m2", label: "Ghana goal + conceded", points: 0 }
      ]
    },
    {
      id: "match-002",
      status: "live",
      minute: "HT",
      home: "Brazil",
      away: "Croatia",
      homeScore: 1,
      awayScore: 0,
      impacts: [
        { managerId: "m3", label: "Brazil lead + clean sheet watch", points: 2 },
        { managerId: "m2", label: "Croatia conceded", points: -0.25 }
      ]
    },
    {
      id: "match-003",
      status: "final",
      minute: "FT",
      home: "France",
      away: "Korea Republic",
      homeScore: 3,
      awayScore: 0,
      impacts: [
        { managerId: "m2", label: "France win, goals, clean sheet", points: 3 }
      ]
    }
  ],
  ledger: [
    { managerId: "m1", country: "Argentina", match: "Argentina 2-0 Japan", category: "Win", points: 1, explanation: "Match win" },
    { managerId: "m1", country: "Argentina", match: "Argentina 2-0 Japan", category: "Goals Scored", points: 1, explanation: "Two goals at +0.5 each" },
    { managerId: "m1", country: "Argentina", match: "Argentina 2-0 Japan", category: "Clean Sheet", points: 0.5, explanation: "Zero goals allowed" },
    { managerId: "m2", country: "France", match: "France 3-0 Korea Republic", category: "Goals Scored", points: 1.5, explanation: "Three goals at +0.5 each" },
    { managerId: "m3", country: "Canada", match: "Canada 1-1 Senegal", category: "Draw", points: 0.5, explanation: "Group stage draw" },
    { managerId: "m4", country: "Egypt", match: "Egypt 0-2 Spain", category: "Goals Allowed", points: -0.5, explanation: "Two goals allowed at -0.25 each" }
  ],
  rules: [
    { category: "All matches", event: "Win", points: "+1" },
    { category: "Group stage only", event: "Draw", points: "+0.5" },
    { category: "All matches", event: "Goal scored", points: "+0.5" },
    { category: "All matches", event: "Goal allowed", points: "-0.25" },
    { category: "All matches", event: "Clean sheet", points: "+0.5" },
    { category: "All matches", event: "Red card", points: "-1" },
    { category: "Group bonus", event: "Qualify for knockouts", points: "+0.5" },
    { category: "Group bonus", event: "Win group", points: "+1" },
    { category: "Tournament bonus", event: "Win World Cup", points: "+2" }
  ]
};

let dashboardState = fallbackSnapshot;
let selectedManagerId = null;
let countryFilter = "all";

const byId = (id) => document.getElementById(id);
const managerById = (id) => dashboardState.managers.find((manager) => manager.id === id);
const countriesForManager = (managerId) => dashboardState.countries.filter((country) => country.managerId === managerId);
const formatPoints = (points) => `${Number(points).toFixed(points % 1 === 0 ? 0 : 2)} pts`;
const formatPointNoun = (points) => `${Number(points).toFixed(points % 1 === 0 ? 0 : 2)} ${Math.abs(Number(points)) === 1 ? "pt" : "pts"}`;

async function loadSnapshot() {
  try {
    const snapshot = await fetchFirstJson(SNAPSHOT_URLS);
    dashboardState = await normalizeSnapshot(snapshot);
  } catch (error) {
    dashboardState = fallbackSnapshot;
    dashboardState.meta = {
      ...fallbackSnapshot.meta,
      source: "simulated",
      summary: "Using embedded sample data until dashboard-snapshot.json or Apps Script JSON is connected."
    };
  }

  selectedManagerId = selectedManagerId || dashboardState.managers[0]?.id;
  renderDashboard();
}

async function fetchFirstJson(urls) {
  let lastError;
  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`${url} returned ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("No snapshot URL configured");
}

async function fetchLinkedFixture(path) {
  if (!path) return null;
  return fetchFirstJson(SAMPLE_BASE_URLS.map((base) => `${base}${path}`));
}

async function normalizeSnapshot(snapshot) {
  if (snapshot.data?.standings) {
    return normalizeCanonicalSnapshot(snapshot);
  }

  return {
    ...fallbackSnapshot,
    ...snapshot,
    meta: { ...fallbackSnapshot.meta, ...(snapshot.meta || {}) },
    managers: snapshot.managers || fallbackSnapshot.managers,
    countries: snapshot.countries || fallbackSnapshot.countries,
    matches: snapshot.matches || fallbackSnapshot.matches,
    ledger: snapshot.ledger || fallbackSnapshot.ledger,
    rules: snapshot.rules || fallbackSnapshot.rules,
    timeline: snapshot.timeline || fallbackSnapshot.timeline
  };
}

async function normalizeCanonicalSnapshot(snapshot) {
  const data = snapshot.data;
  const [rulesFile, teamsFile, leagueFile, matchesFile, ledgerFile] = await Promise.all([
    fetchLinkedFixture(data.rulesFile),
    fetchLinkedFixture(data.teamsFile),
    fetchLinkedFixture(data.leagueFile),
    fetchLinkedFixture(data.matchesFile),
    fetchLinkedFixture(data.ledgerFile)
  ]);

  const managerMeta = new Map((leagueFile?.managers || []).map((manager) => [manager.managerId, manager]));
  const standings = data.standings || [];
  const teams = teamsFile?.teams || [];
  const rosters = leagueFile?.rosters || [];
  const ledger = ledgerFile?.ledger || [];
  const matches = matchesFile?.matches || [];
  const teamById = new Map(teams.map((team) => [team.teamId, team]));
  const matchById = new Map(matches.map((match) => [match.matchId, match]));

  const pointsByTeam = ledger.reduce((totals, row) => {
    totals[row.teamId] = (totals[row.teamId] || 0) + Number(row.points || 0);
    return totals;
  }, {});

  const managers = standings.map((standing) => {
    const meta = managerMeta.get(standing.managerId) || {};
    const managerTeams = rosters
      .filter((roster) => roster.managerId === standing.managerId)
      .map((roster) => teamById.get(roster.teamId))
      .filter(Boolean);

    return {
      id: standing.managerId,
      name: standing.displayName || meta.displayName || standing.managerId,
      color: managerColors[meta.colorToken] || "#1479ff",
      points: Number(standing.totalPoints || 0),
      movement: 0,
      alive: managerTeams.filter((team) => !["eliminated"].includes(team.status)).length,
      qualified: managerTeams.filter((team) => team.qualifiedForKnockouts).length,
      groupWinners: managerTeams.filter((team) => team.wonGroup).length
    };
  });

  const countries = rosters.map((roster) => {
    const team = teamById.get(roster.teamId) || {};
    return {
      id: roster.teamId,
      name: team.name || roster.teamId,
      flag: team.shortName || "WC",
      group: team.group || "-",
      managerId: roster.managerId,
      points: Number((pointsByTeam[roster.teamId] || 0).toFixed(2)),
      status: normalizeTeamStatus(team.status),
      nextMatch: nextMatchLabel(team)
    };
  });

  const displayMatches = matches.map((match) => {
    const home = teamById.get(match.homeTeamId);
    const away = teamById.get(match.awayTeamId);
    const rows = ledger.filter((row) => row.matchId === match.matchId);
    const impactTotals = rows.reduce((totals, row) => {
      totals[row.managerId] = (totals[row.managerId] || 0) + Number(row.points || 0);
      return totals;
    }, {});

    return {
      id: match.matchId,
      status: match.status,
      minute: match.status === "final" ? "FT" : "Live",
      home: home?.name || match.homeTeamId,
      away: away?.name || match.awayTeamId,
      homeScore: match.homeGoals,
      awayScore: match.awayGoals,
      impacts: Object.entries(impactTotals).map(([managerId, points]) => ({
        managerId,
        label: `${prettifyStage(match.stage)} swing`,
        points: Number(points.toFixed(2))
      }))
    };
  });

  const displayLedger = ledger.map((row) => {
    const team = teamById.get(row.teamId);
    const match = matchById.get(row.matchId);
    return {
      managerId: row.managerId,
      country: team?.name || row.teamId,
      match: match ? matchLabel(match, teamById) : "Tournament bonus",
      category: prettifyCategory(row.category),
      points: Number(row.points || 0),
      explanation: row.explanation
    };
  });

  const rules = (rulesFile?.rules || fallbackSnapshot.rules).map((rule) => ({
    category: rule.scope || rule.category,
    event: rule.label || rule.event,
    points: typeof rule.points === "number" && rule.points > 0 ? `+${rule.points}` : `${rule.points}`
  }));

  return {
    meta: {
      leagueName: data.league?.name || "World Cup Fantasy League",
      source: snapshot.mode || "simulation",
      phase: data.league?.currentPhase || "Simulation",
      lastUpdated: snapshot.generatedAt || new Date().toISOString(),
      summary: snapshot.dataHealth?.message || "Generated from canonical sample-data fixtures."
    },
    timeline: fallbackSnapshot.timeline.map((step) => ({
      ...step,
      status: step.id === "final" ? "active" : "complete"
    })),
    managers,
    countries,
    matches: displayMatches,
    ledger: displayLedger,
    rules
  };
}

function renderDashboard() {
  renderLeaguePulseHeader();
  renderTournamentTimelineStrip();
  renderChampionshipRaceBoard();
  renderManagerSpotlightPanel();
  renderLiveMatchImpactRail();
  renderRosterFateTracker();
  renderCountryCardGrid();
  renderRulesReferencePanel();
  renderScoringLedgerDrawer();
}

function renderLeaguePulseHeader() {
  const meta = dashboardState.meta;
  const lastUpdated = new Date(meta.lastUpdated).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
  byId("league-name").textContent = meta.leagueName;
  byId("league-summary").textContent = `${meta.phase} · Last updated ${lastUpdated}. ${meta.summary}`;

  const healthBadge = byId("data-health-badge");
  healthBadge.dataset.state = meta.source || "simulated";
  healthBadge.textContent = meta.source === "live" ? "Live data" : "Simulated data";
}

function renderTournamentTimelineStrip() {
  byId("timeline-track").innerHTML = dashboardState.timeline
    .map((step) => `
      <article class="timeline-step ${step.status === "active" ? "active" : ""}">
        <strong>${step.label}</strong>
        <span class="muted">${step.note}</span>
      </article>
    `)
    .join("");
}

function renderChampionshipRaceBoard() {
  const managers = sortedManagers();
  const leader = managers[0];
  byId("leader-gap").textContent = leader ? `${leader.name} leads` : "No standings";
  byId("standings-list").innerHTML = managers
    .map((manager, index) => {
      const gap = leader ? leader.points - manager.points : 0;
      const movement = manager.movement > 0 ? `↑ ${manager.movement}` : manager.movement < 0 ? `↓ ${Math.abs(manager.movement)}` : "–";
      return `
        <button class="standing-card" style="--manager-color:${manager.color}" data-manager-id="${manager.id}">
          <span class="rank-badge">${index + 1}</span>
          <span>
            <p class="manager-name">${manager.name}</p>
            <p class="manager-meta">${gap === 0 ? "Leader" : `${formatPointNoun(gap)} back`} · Movement ${movement}</p>
          </span>
          <span class="points-stack">
            <strong>${manager.points.toFixed(2)}</strong>
            <span class="muted">points</span>
          </span>
        </button>
      `;
    })
    .join("");

  document.querySelectorAll(".standing-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectedManagerId = card.dataset.managerId;
      renderManagerSpotlightPanel();
      renderCountryCardGrid();
    });
  });
}

function renderManagerSpotlightPanel() {
  const select = byId("manager-select");
  select.innerHTML = sortedManagers()
    .map((manager) => `<option value="${manager.id}">${manager.name}</option>`)
    .join("");
  select.value = selectedManagerId;

  const manager = managerById(selectedManagerId);
  const countries = countriesForManager(selectedManagerId);
  byId("manager-spotlight").innerHTML = `
    <div class="manager-summary">
      <div class="standing-card" style="--manager-color:${manager.color}">
        <span class="rank-badge">${rankForManager(manager.id)}</span>
        <span>
          <p class="manager-name">${manager.name}</p>
          <p class="manager-meta">${manager.alive} alive · ${manager.qualified} qualified · ${manager.groupWinners} group winners</p>
        </span>
        <span class="points-stack"><strong>${manager.points.toFixed(2)}</strong><span class="muted">points</span></span>
      </div>
      ${countries.map((country) => countryRow(country)).join("")}
    </div>
  `;
}

function renderLiveMatchImpactRail() {
  const liveMatches = dashboardState.matches.filter((match) => match.status === "live");
  byId("live-count").textContent = `${liveMatches.length} live`;
  byId("match-rail").innerHTML = dashboardState.matches
    .map((match) => `
      <article class="match-card">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">${match.status} · ${match.minute}</p>
            <h3>${match.home} vs ${match.away}</h3>
          </div>
          <span class="soft-pill">${match.homeScore}-${match.awayScore}</span>
        </div>
        <div class="scoreline">
          <span>${match.home}</span>
          <span>${match.homeScore} : ${match.awayScore}</span>
          <span>${match.away}</span>
        </div>
        <ul class="impact-list">
          ${match.impacts.map((impact) => impactRow(impact)).join("")}
        </ul>
      </article>
    `)
    .join("");
}

function renderRosterFateTracker() {
  byId("fate-tracker").innerHTML = sortedManagers()
    .map((manager) => {
      const countries = countriesForManager(manager.id);
      return `
        <article class="fate-row">
          <strong>${manager.name}</strong>
          <span class="muted"> · ${manager.alive}/${countries.length} alive</span>
          <div class="fate-bar" aria-label="${manager.name} roster fate">
            ${countries.map((country) => `<span class="fate-segment ${country.status}"></span>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCountryCardGrid() {
  const tabs = ["all", "alive", "qualified", "danger"];
  byId("country-filter-tabs").innerHTML = tabs
    .map((tab) => `<button class="${tab === countryFilter ? "active" : ""}" data-filter="${tab}">${tab}</button>`)
    .join("");

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      countryFilter = button.dataset.filter;
      renderCountryCardGrid();
    });
  });

  const countries = dashboardState.countries.filter((country) => countryFilter === "all" || country.status === countryFilter);
  byId("country-grid").innerHTML = countries.map((country) => countryCard(country)).join("");
}

function renderRulesReferencePanel() {
  byId("rules-grid").innerHTML = dashboardState.rules
    .map((rule) => `
      <article class="rule-item">
        <span>
          <strong>${rule.event}</strong>
          <span class="manager-meta">${rule.category}</span>
        </span>
        <span class="soft-pill">${rule.points}</span>
      </article>
    `)
    .join("");
}

function renderScoringLedgerDrawer() {
  const term = byId("ledger-search")?.value?.toLowerCase() || "";
  const rows = dashboardState.ledger.filter((row) => {
    const manager = managerById(row.managerId)?.name || "";
    return `${manager} ${row.country} ${row.match} ${row.category} ${row.explanation}`.toLowerCase().includes(term);
  });

  byId("ledger-body").innerHTML = rows
    .map((row) => {
      const manager = managerById(row.managerId);
      const pointsClass = row.points < 0 ? "negative" : "positive";
      return `
        <tr>
          <td>${manager?.name || row.managerId}</td>
          <td>${row.country}</td>
          <td>${row.match}</td>
          <td>${row.category}</td>
          <td class="${pointsClass}">${row.points > 0 ? "+" : ""}${row.points}</td>
          <td>${row.explanation}</td>
        </tr>
      `;
    })
    .join("");
}

function sortedManagers() {
  return [...dashboardState.managers].sort((a, b) => b.points - a.points);
}

function normalizeTeamStatus(status) {
  if (status === "champion") return "qualified";
  if (status === "scheduled") return "alive";
  return status || "alive";
}

function nextMatchLabel(team) {
  if (team?.isChampion) return "Champion";
  if (team?.status === "eliminated") return "Eliminated";
  if (team?.qualifiedForKnockouts) return "Qualified";
  return team?.group ? `Group ${team.group}` : "TBD";
}

function matchLabel(match, teamById) {
  const home = teamById.get(match.homeTeamId)?.name || match.homeTeamId;
  const away = teamById.get(match.awayTeamId)?.name || match.awayTeamId;
  return `${home} ${match.homeGoals}-${match.awayGoals} ${away}`;
}

function prettifyCategory(category) {
  return String(category || "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function prettifyStage(stage) {
  const labels = { GROUP: "Group", R32: "Round of 32", R16: "Round of 16", QF: "Quarterfinal", SF: "Semifinal", FINAL: "Final" };
  return labels[stage] || stage || "Match";
}

function rankForManager(managerId) {
  return sortedManagers().findIndex((manager) => manager.id === managerId) + 1;
}

function countryRow(country) {
  return `
    <article class="manager-country-row">
      <span class="flag" aria-hidden="true">${country.flag}</span>
      <span>
        <strong>${country.name}</strong>
        <span class="manager-meta">Group ${country.group} · ${country.nextMatch}</span>
      </span>
      <span class="soft-pill">${formatPoints(country.points)}</span>
    </article>
  `;
}

function countryCard(country) {
  const manager = managerById(country.managerId);
  return `
    <article class="country-card" style="--manager-color:${manager?.color || "var(--color-cyan)"}">
      <header>
        <span class="flag" aria-hidden="true">${country.flag}</span>
        <span class="status-badge">${country.status}</span>
      </header>
      <div>
        <h3>${country.name}</h3>
        <p class="manager-meta">${manager?.name || "Unassigned"} · Group ${country.group}</p>
      </div>
      <div class="card-stat-row">
        <span class="soft-pill">${formatPoints(country.points)}</span>
        <span class="soft-pill">${country.nextMatch}</span>
      </div>
    </article>
  `;
}

function impactRow(impact) {
  const manager = managerById(impact.managerId);
  const pointsClass = impact.points < 0 ? "negative" : "positive";
  return `
    <li>
      <span>${manager?.name || impact.managerId}: ${impact.label}</span>
      <strong class="${pointsClass}">${impact.points > 0 ? "+" : ""}${impact.points}</strong>
    </li>
  `;
}

byId("refresh-button").addEventListener("click", loadSnapshot);
byId("manager-select").addEventListener("change", (event) => {
  selectedManagerId = event.target.value;
  renderManagerSpotlightPanel();
  renderCountryCardGrid();
});
byId("ledger-search").addEventListener("input", renderScoringLedgerDrawer);

loadSnapshot();
