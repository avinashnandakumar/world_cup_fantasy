const paths = {
  snapshot: window.WORLD_CUP_CONFIG?.snapshotUrl || "./sample-data/dashboard-snapshot-8.json",
  league: "./sample-data/simulated-league-8.json",
  teams: "./sample-data/simulated-teams-48.json",
  matches: "./sample-data/simulated-matches.json",
  ledger: "./sample-data/simulated-scoring-ledger-8.json"
};

const managerColors = {
  blue: "#2878ff",
  red: "#e54b4b",
  gold: "#e0a72f",
  green: "#18a566",
  purple: "#7957ff",
  silver: "#88929e",
  orange: "#f17628",
  black: "#121820",
  teal: "#0d9488",
  pink: "#db2777",
  lime: "#65a30d",
  navy: "#1d4ed8"
};

const managerColorPalette = [
  "#2878ff",
  "#e54b4b",
  "#e0a72f",
  "#18a566",
  "#7957ff",
  "#f17628",
  "#0d9488",
  "#db2777",
  "#65a30d",
  "#1d4ed8",
  "#7c3aed",
  "#121820"
];

const worldCupKnockoutSchedule = {
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

const condensedBracketRoundPairings = {
  R16: [[89, 73, 75], [90, 74, 77], [91, 76, 78], [92, 79, 80], [93, 83, 84], [94, 81, 82], [95, 86, 88], [96, 85, 87]],
  QF: [[97, 89, 90], [98, 93, 94], [99, 91, 92], [100, 95, 96]],
  SF: [[101, 97, 98], [102, 99, 100]],
  FINAL: [[104, 101, 102]]
};

const condensedBracketSourceStages = {
  R16: "R32",
  QF: "R16",
  SF: "QF",
  FINAL: "SF"
};

const countryFlags = {
  argentina: "🇦🇷",
  brazil: "🇧🇷",
  england: "🏴",
  france: "🇫🇷",
  spain: "🇪🇸",
  portugal: "🇵🇹",
  germany: "🇩🇪",
  netherlands: "🇳🇱",
  belgium: "🇧🇪",
  colombia: "🇨🇴",
  mexico: "🇲🇽",
  usa: "🇺🇸",
  japan: "🇯🇵",
  morocco: "🇲🇦",
  uruguay: "🇺🇾",
  switzerland: "🇨🇭",
  croatia: "🇭🇷",
  norway: "🇳🇴",
  ecuador: "🇪🇨",
  senegal: "🇸🇳",
  austria: "🇦🇹",
  turkey: "🇹🇷",
  iran: "🇮🇷",
  egypt: "🇪🇬",
  "south-korea": "🇰🇷",
  sweden: "🇸🇪",
  algeria: "🇩🇿",
  "ivory-coast": "🇨🇮",
  paraguay: "🇵🇾",
  australia: "🇦🇺",
  canada: "🇨🇦",
  scotland: "🏴",
  "czech-republic": "🇨🇿",
  ghana: "🇬🇭",
  tunisia: "🇹🇳",
  "south-africa": "🇿🇦",
  "saudi-arabia": "🇸🇦",
  qatar: "🇶🇦",
  uzbekistan: "🇺🇿",
  jordan: "🇯🇴",
  iraq: "🇮🇶",
  "dr-congo": "🇨🇩",
  "bosnia-herzegovina": "🇧🇦",
  "new-zealand": "🇳🇿",
  panama: "🇵🇦",
  haiti: "🇭🇹",
  curacao: "🇨🇼",
  "cape-verde": "🇨🇻"
};

const fallback = {
  meta: { leagueName: "MH Fantasy World Cup", generatedAt: new Date().toISOString(), lastExternalSyncAtUtc: "", phase: "Simulated table" },
  standings: [
    { rank: 1, managerId: "black", displayName: "Black Arrows", totalPoints: 7.75 },
    { rank: 2, managerId: "blue", displayName: "Blue Comets", totalPoints: 6.75 }
  ],
  managers: [
    { managerId: "black", displayName: "Black Arrows", colorToken: "black" },
    { managerId: "blue", displayName: "Blue Comets", colorToken: "blue" }
  ],
  rosters: [],
  teams: [],
  matches: [],
  ledger: [],
  roasts: { latestBatch: [], todayArchive: [] }
};

let model = fallback;
let selectedManagerId = null;
let selectedCondensedBracketRound = "SF";
let typingIndex = 0;
let charIndex = 0;
let typingDeleting = false;
let typingHold = 0;

const $ = (id) => document.getElementById(id);
const fmt = (value) => Number(value || 0).toFixed(Number(value || 0) % 1 === 0 ? 0 : 2);

init();

async function init() {
  setupRefreshButton();
  setupMatchBreakdownModal();
  setupWorldCupBracketTabs();
  model = await loadModel();
  selectedManagerId = model.standings[0]?.managerId || model.managers[0]?.managerId;
  render();
  startTyping();
}

function setupRefreshButton() {
  const button = $("refresh-dashboard");
  if (!button) return;
  button.addEventListener("click", () => {
    button.disabled = true;
    button.classList.add("is-refreshing");
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(Date.now()));
    window.location.href = url.toString();
  });
}

function setupMatchBreakdownModal() {
  document.addEventListener("click", (event) => {
    const closeTarget = event.target.closest("[data-close-match-breakdown]");
    if (closeTarget) {
      closeMatchBreakdown();
      return;
    }

    const card = event.target.closest(".match-card[data-final-match='true']");
    if (!card) return;
    openMatchBreakdown(card.dataset.matchId);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMatchBreakdown();
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest(".match-card[data-final-match='true']");
    if (!card) return;
    event.preventDefault();
    openMatchBreakdown(card.dataset.matchId);
  });
}

function setupWorldCupBracketTabs() {
  document.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-bracket-round]");
    if (!tab) return;
    selectedCondensedBracketRound = ["FINAL", "SF", "QF", "R16", "R32"].includes(tab.dataset.bracketRound)
      ? tab.dataset.bracketRound
      : "SF";
    renderWorldCupBracket();
  });
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

async function loadModel() {
  try {
    const snapshot = await loadJson(paths.snapshot);

    if (snapshot.meta && Array.isArray(snapshot.standings)) {
      return normalizeAppsScriptSnapshot(snapshot);
    }

    const [league, teams, matches, ledger] = await Promise.all([
      loadJson(paths.league),
      loadJson(paths.teams),
      loadJson(paths.matches),
      loadJson(paths.ledger)
    ]);

    return {
      meta: {
        leagueName: snapshot.data?.league?.name || league.league?.name || "MH Fantasy World Cup",
        generatedAt: snapshot.generatedAt,
        lastExternalSyncAtUtc: snapshot.lastExternalSyncAtUtc || snapshot.data?.league?.lastExternalSyncAtUtc || "",
        phase: snapshot.data?.league?.currentPhase || "Live table"
      },
      standings: snapshot.data?.standings || [],
      managers: league.managers || [],
      rosters: league.rosters || [],
      teams: (teams.teams || []).map(normalizeDashboardTeam),
      matches: matches.matches || [],
      ledger: ledger.ledger || [],
      roasts: normalizeRoasts(snapshot.data?.roasts)
    };
  } catch (error) {
    return fallback;
  }
}

function normalizeAppsScriptSnapshot(snapshot) {
  return {
    meta: {
      leagueName: snapshot.meta?.leagueName || "World Cup Fantasy",
      generatedAt: snapshot.meta?.generatedAtUtc || new Date().toISOString(),
      lastExternalSyncAtUtc: snapshot.meta?.lastExternalSyncAtUtc || "",
      phase: snapshot.meta?.mode === "simulation" ? "SIMULATION" : "LIVE"
    },
    standings: (snapshot.standings || []).map((standing, index) => ({
      rank: Number(standing.rank || index + 1),
      managerId: standing.managerId,
      displayName: standing.displayName || standing.managerId,
      totalPoints: Number(standing.totalPoints || 0)
    })),
    managers: (snapshot.managers || []).map((manager) => ({
      managerId: manager.managerId,
      displayName: manager.displayName,
      color: manager.color || "",
      colorToken: colorTokenFromValue(manager.color)
    })),
    rosters: snapshot.rosters || [],
    teams: (snapshot.teams || []).map(normalizeDashboardTeam),
    matches: (snapshot.matches || []).map((match) => ({
      matchId: match.matchId,
      stage: match.stage,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeGoals: Number(match.homeScore || 0),
      awayGoals: Number(match.awayScore || 0),
      status: match.status || "scheduled",
      kickoffUtc: match.kickoffUtc || "",
      winnerTeamId: match.winnerTeamId || "",
      matchNumber: match.matchNumber || ""
    })),
    ledger: snapshot.ledger || [],
    roasts: normalizeRoasts(snapshot.roasts)
  };
}

function normalizeRoasts(roasts) {
  const source = roasts || {};
  return {
    latestBatch: normalizeRoastRows(source.latestBatch),
    todayArchive: normalizeRoastRows(source.todayArchive)
  };
}

function normalizeDashboardTeam(team) {
  return {
    teamId: team.teamId,
    name: team.countryName || team.name || team.teamId,
    flagEmoji: correctedWorldCupFlag(team.teamId, team.flagEmoji),
    shortName: correctedWorldCupFlag(team.teamId, team.flagEmoji) || countryFlags[team.teamId] || (team.countryName || team.teamId || "WC").slice(0, 3).toUpperCase(),
    group: correctedWorldCupGroup(team.teamId, team.group),
    groupRank: team.groupRank,
    status: String(team.status || "scheduled").toLowerCase(),
    qualifiedForKnockouts: team.qualifiedForKnockouts === true || team.qualifiedForKnockouts === "TRUE",
    wonGroup: team.wonGroup === true || team.wonGroup === "TRUE"
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

function normalizeRoastRows(rows) {
  return (rows || []).map((row) => ({
    roastId: row.roastId || "",
    batchId: row.batchId || "",
    generatedAtUtc: row.generatedAtUtc || row.createdAtUtc || "",
    slotLocal: row.slotLocal || "",
    targetType: row.targetType || "",
    targetId: row.targetId || "",
    managerId: row.managerId || "",
    matchId: row.matchId || "",
    teamIds: Array.isArray(row.teamIds)
      ? row.teamIds
      : String(row.teamIds || "").split(",").map((item) => item.trim()).filter(Boolean),
    severity: row.severity || "spicy",
    text: row.text || "",
    evidence: row.evidence || "",
    sourceSnapshotGeneratedAtUtc: row.sourceSnapshotGeneratedAtUtc || "",
    status: row.status || "active"
  })).filter((row) => row.text);
}

function render() {
  renderHero();
  renderUpdated();
  renderStandings();
  renderFlags();
  renderCountryBreakdown();
  renderMatches();
  renderWorldCupBracket();
  renderPointsTimeline();
  renderProjectedBonuses();
  renderAllGames();
}

function renderHero() {
  $("page-title").textContent = displayLeagueName();
}

function displayLeagueName() {
  const name = model.meta.leagueName || "MH Fantasy World Cup";
  if (String(name).toLowerCase().includes("mh") && String(name).toLowerCase().includes("world cup fantasy league")) {
    return "MH Fantasy World Cup";
  }
  return name;
}

function renderUpdated() {
  const sourceTime = model.meta.lastExternalSyncAtUtc || model.meta.generatedAt;
  const date = sourceTime ? new Date(sourceTime) : new Date();
  const label = `Updated at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  $("last-updated").textContent = label;
  $("top-updated").innerHTML = `<span></span> ${label}`;
}

function renderStandings() {
  const sorted = standingsForMainTable();
  const rankMovement = rankMovementByManager();
  $("standings-body").innerHTML = sorted.map((standing) => {
    const manager = managerById(standing.managerId);
    const totals = settledCategoryTotalsForManager(standing.managerId);
    const gamesPlayed = gamesPlayedForManager(standing.managerId);
    const countriesRemaining = countriesRemainingForManager(standing.managerId);
    const bonus = Number.isFinite(Number(standing.bonus)) ? Number(standing.bonus) : totals.bonuses;
    const projectedTotal = projectedTotalForManager(standing.managerId, standing.totalPoints);
    const projectionLine = projectedTotal === null ? "" : `
          <span class="total-points-projected">Proj: ${fmt(projectedTotal)}</span>`;
    const movement = rankMovement[standing.managerId];

    return `
      <tr style="--manager-color:${managerColor(manager, standing.managerId)}">
        <td data-label="Rank"><span class="rank-cell">${standing.rank}</span></td>
        <td>
          <span class="player-cell">
            <span class="player-swatch"></span>
            <span class="player-name-row">
              <a class="player-name" href="#${managerRosterAnchorId(standing.managerId)}">${escapeHtml(standing.displayName)}</a>
              ${renderRankMovementBadge(movement)}
            </span>
          </span>
        </td>
        <td data-label="Total" class="total-points">
          <span class="total-points-current">${fmt(standing.totalPoints)}</span>
          ${projectionLine}
        </td>
        <td data-label="Alive" class="countries-remaining countries-remaining-${Math.max(0, Math.min(4, countriesRemaining))}">${countriesRemaining}</td>
        <td data-label="GP">${gamesPlayed}</td>
        <td data-label="Bonus" class="bonus-points">${formatProjectedBonus(bonus)}</td>
        <td data-label="Wins">${fmt(totals.wins)}</td>
        <td data-label="Goals">${fmt(totals.goals)}</td>
        <td data-label="Defense" class="${totals.defense < 0 ? "negative" : ""}">${fmt(totals.defense)}</td>
        <td data-label="Cards" class="${totals.cards < 0 ? "negative" : ""}">${fmt(totals.cards)}</td>
        <td class="mobile-standings-strip-cell" aria-label="Standings stat summary">
          <span class="mobile-standings-strip">
            <span class="stat-chip"><span>Alive</span>${countriesRemaining}</span>
            <span class="stat-chip"><span>GP</span>${gamesPlayed}</span>
            <span class="stat-chip"><span>B</span>${formatProjectedBonus(bonus)}</span>
            <span class="stat-chip"><span>W</span>${fmt(totals.wins)}</span>
            <span class="stat-chip"><span>G</span>${fmt(totals.goals)}</span>
            <span class="stat-chip ${totals.defense < 0 ? "negative" : ""}"><span>DEF</span>${fmt(totals.defense)}</span>
            <span class="stat-chip ${totals.cards < 0 ? "negative" : ""}"><span>C</span>${fmt(totals.cards)}</span>
          </span>
        </td>
      </tr>
    `;
  }).join("");
}

function standingsForMainTable() {
  return rosterManagersInOrder()
    .map((standing) => ({
      ...standing,
      bonus: earnedBonusForManager(standing.managerId, standing),
      totalPoints: settledTotalForManager(standing.managerId) + earnedBonusFallbackForManager(standing.managerId, standing)
    }))
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return String(a.displayName || a.managerId).localeCompare(String(b.displayName || b.managerId));
    })
    .map((standing, index) => ({
      ...standing,
      rank: index + 1
    }));
}

function renderFlags() {
  const topTeams = topTeamTotals().slice(0, 18);
  $("flag-ribbon").innerHTML = topTeams.map(({ team, points }) => `
    <span class="flag-chip">
      <span class="flag-square flag-emoji">${countryFlag(team)}</span>
      ${team.name || "Country"} · ${fmt(points)}
    </span>
  `).join("");
}

function renderCountryBreakdown() {
  const managerRows = standingsForMainTable();
  $("country-breakdown").innerHTML = managerRows.map(({ managerId, displayName, totalPoints }) => {
    const manager = managerById(managerId);
    const gamesPlayed = gamesPlayedForManager(managerId);
    const countries = model.rosters
      .filter((roster) => roster.managerId === managerId)
      .map((roster) => {
        const team = teamById(roster.teamId);
        return {
          roster,
          team,
          points: totalPointsForTeam(roster.teamId)
        };
      })
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return String(a.team?.name || a.roster.teamId).localeCompare(String(b.team?.name || b.roster.teamId));
      });

    return `
      <article id="${managerRosterAnchorId(managerId)}" class="roster-card" style="--manager-color:${managerColor(manager, managerId)}">
        <header class="roster-card-header">
          <span class="player-swatch"></span>
          <div>
            <h3>${displayName}</h3>
          </div>
          <span class="roster-games-played">${gamesPlayed} GP</span>
          <strong class="roster-total-points">${fmt(totalPoints)} pts</strong>
        </header>
        <div class="roster-country-list">
          ${countries.map(({ roster, team, points }) => `
            ${renderRosterCountryDetails(managerId, roster, team, points)}
          `).join("") || `<p class="country-meta">No countries drafted yet.</p>`}
        </div>
      </article>
    `;
  }).join("");
}

function managerRosterAnchorId(managerId) {
  return `roster-${String(managerId || "manager").replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function renderRosterCountryDetails(managerId, roster, team, points) {
  const matches = matchesForTeam(roster.teamId);
  const nextMatch = nextScheduledMatchForTeam(roster.teamId);
  const groupPlace = groupPlaceLabel(roster.teamId);
  const metaLabel = nextMatch ? `${formatUpcomingMatchLabel(nextMatch)} · ${groupPlace}` : groupPlace;
  const isEliminated = !teamStillInTournament(team);
  return `
    <details class="roster-country-detail ${isEliminated ? "roster-country-detail-eliminated" : ""}">
      <summary class="roster-country-row">
        <span class="country-expand-icon" aria-hidden="true"></span>
        <span class="flag-square flag-emoji">${countryFlag(team)}</span>
        <span class="roster-country-name">
          <strong>${team?.name || roster.teamId}</strong>
          <span>${metaLabel}</span>
        </span>
        <strong class="country-point-number">${fmt(points)}</strong>
      </summary>
      <div class="country-match-list">
        ${matches.map((match) => renderCountryMatchRow(managerId, roster.teamId, match)).join("") || `
          <p class="country-meta">No matches scheduled yet.</p>
        `}
        ${renderCountryBonusRow(managerId, roster.teamId)}
      </div>
    </details>
  `;
}

function renderMatches() {
  const matches = todaysMatches();
  const title = $("matches-title");
  if (title) title.textContent = matches.some((match) => localDateKey(match.kickoffUtc) === localDateKey(new Date())) ? "Today's Games" : "Next Up";
  $("match-strip").innerHTML = matches.map((match) => renderMatchCard(match, { showHoldProjection: true })).join("") || `<p class="country-meta">No games available yet.</p>`;
}

function renderRoasts() {
  const feed = $("roast-feed");
  if (!feed) return;

  const latestBatch = model.roasts?.latestBatch || [];
  const archive = (model.roasts?.todayArchive || [])
    .filter((roast) => !latestBatch.some((latest) => latest.roastId === roast.roastId));
  const newestRoast = latestBatch[0] || archive[0];
  const updated = $("roast-updated");
  if (updated) {
    updated.textContent = newestRoast ? `Generated ${formatRoastTime(newestRoast.generatedAtUtc)}` : "Warming up";
  }

  if (!latestBatch.length) {
    feed.innerHTML = `
      <div class="roast-empty">
        <strong>Red Card Report is warming up.</strong>
        <span>Waiting for enough match chaos to start throwing tomatoes.</span>
      </div>
    `;
    return;
  }

  feed.innerHTML = `
    <div class="roast-latest">
      ${latestBatch.map(renderRoastCard).join("")}
    </div>
    ${archive.length ? `
      <details class="roast-archive">
        <summary>Today's archive <span>${archive.length} roast${archive.length === 1 ? "" : "s"}</span></summary>
        <div class="roast-archive-list">
          ${archive.map(renderRoastCard).join("")}
        </div>
      </details>
    ` : ""}
  `;
}

function renderRoastCard(roast) {
  const severity = String(roast.severity || "spicy").toLowerCase() === "nuclear" ? "nuclear" : "spicy";
  return `
    <article class="roast-card roast-card-${severity}">
      <div class="roast-card-top">
        <span>${escapeHtml(roastTargetLabel(roast))}</span>
      </div>
      <p>${escapeHtml(roast.text)}</p>
      <div class="roast-evidence">
        <span>${escapeHtml(roast.evidence || "Fantasy evidence pending")}</span>
        <time>${escapeHtml(formatRoastTime(roast.generatedAtUtc))}</time>
      </div>
    </article>
  `;
}

function renderWorldCupBracket() {
  const node = $("world-cup-bracket-grid");
  if (!node) return;

  const round = condensedBracketRound(selectedCondensedBracketRound);
  const title = $("bracket-title");
  if (title) title.textContent = round.title;
  updateWorldCupBracketTabs(round.stage);

  const bracket = round.matches;
  const leftSide = bracket.slice(0, Math.ceil(bracket.length / 2));
  const rightSide = bracket.slice(Math.ceil(bracket.length / 2));

  node.innerHTML = `
    <div class="world-cup-bracket-lane world-cup-bracket-lane-left">
      ${leftSide.map((match) => renderWorldCupBracketMatch(match)).join("")}
    </div>
    <div class="world-cup-bracket-spine" aria-hidden="true"></div>
    <div class="world-cup-bracket-lane world-cup-bracket-lane-right">
      ${rightSide.map((match) => renderWorldCupBracketMatch(match)).join("")}
    </div>
  `;
}

function updateWorldCupBracketTabs(stage) {
  document.querySelectorAll("[data-bracket-round]").forEach((tab) => {
    const isActive = tab.dataset.bracketRound === stage;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
}

function renderWorldCupBracketMatch(match) {
  const actualMatch = match.actualMatch || actualMatchForBracketMatch(match);
  return `
    <article class="world-cup-bracket-match" aria-label="${escapeHtml(`${match.home.country} vs ${match.away.country}`)}">
      <span class="world-cup-bracket-date">${escapeHtml(worldCupBracketScheduleLabel(match.matchNumber, actualMatch))}</span>
      ${renderWorldCupBracketSide(match.home, actualMatch)}
      <span class="world-cup-bracket-vs">vs</span>
      ${renderWorldCupBracketSide(match.away, actualMatch)}
    </article>
  `;
}

function renderWorldCupBracketSide(side, match) {
  const points = match && isFinalMatch(match) ? bracketTeamPoints(match.matchId, side.teamId) : null;
  return `
    <span class="world-cup-bracket-side">
      <strong>${escapeHtml(side.country)}</strong>
      <em>${escapeHtml(worldCupBracketManagerLabel(side.teamId))}</em>
      ${points === null ? "" : `<b class="world-cup-bracket-points">${formatSignedPoints(points)}</b>`}
    </span>
  `;
}

function condensedBracketRound(stage) {
  const normalized = ["FINAL", "SF", "QF", "R16", "R32"].includes(normalizedStage(stage)) ? normalizedStage(stage) : "SF";
  if (normalized !== "R32") {
    return {
      stage: normalized,
      title: knockoutStageLabel(normalized),
      matches: projectedCondensedBracketRound(normalized)
    };
  }

  return {
    stage: "R32",
    title: knockoutStageLabel("R32"),
    matches: projectedWorldCupBracket(projectedGroupTables()).map((match) => ({
      ...match,
      actualMatch: actualMatchForBracketMatch(match)
    }))
  };
}

function projectedCondensedBracketRound(stage) {
  const normalized = normalizedStage(stage);
  const sourceStage = condensedBracketSourceStages[normalized];
  const sourceMatches = sourceStage && sourceStage !== "R32"
    ? projectedCondensedBracketRound(sourceStage)
    : projectedWorldCupBracket(projectedGroupTables()).map((match) => ({
      ...match,
      actualMatch: actualMatchForBracketMatch(match)
    }));
  const sourceMatchesByNumber = new Map(sourceMatches.map((match) => [match.matchNumber, match]));

  return (condensedBracketRoundPairings[normalized] || []).map(([matchNumber, homeSource, awaySource], index) => {
    const home = winnerSideForCondensedBracket(sourceMatchesByNumber.get(homeSource), homeSource);
    const away = winnerSideForCondensedBracket(sourceMatchesByNumber.get(awaySource), awaySource);
    const actualMatch = actualMatchForStageAndNumber(normalized, matchNumber)
      || actualMatchForDerivedBracketMatch(normalized, matchNumber, home.teamId, away.teamId);

    if (actualMatch?.homeTeamId && actualMatch?.awayTeamId) {
      return {
        ...bracketMatchFromActualMatch(actualMatch, index),
        matchNumber,
        stage: normalized
      };
    }

    return {
      matchNumber,
      stage: normalized,
      actualMatch,
      home,
      away
    };
  });
}

function winnerSideForCondensedBracket(sourceMatch, sourceMatchNumber) {
  const actualMatch = actualMatchForBracketSource(sourceMatch, sourceMatchNumber);
  const winnerId = actualMatch ? winningTeamId(actualMatch) : "";
  if (winnerId) {
    return {
      ...bracketSideFromTeam(winnerId),
      seed: `W${sourceMatchNumber}`
    };
  }
  return {
    seed: `W${sourceMatchNumber}`,
    teamId: "",
    country: `Winner ${sourceMatchNumber}`
  };
}

function actualMatchForStageAndNumber(stage, matchNumber) {
  return model.matches.find((match) => normalizedStage(match.stage) === stage && bracketMatchNumbersMatch(match, matchNumber)) || null;
}

function actualMatchForDerivedBracketMatch(stage, matchNumber, homeTeamId, awayTeamId) {
  const candidates = model.matches.filter((match) => {
    const stageMatches = normalizedStage(match.stage) === stage;
    const slotMatches = matchDateMatchesBracketSlot(match, matchNumber);
    return stageMatches || slotMatches;
  });

  return candidates.find((match) => bracketMatchNumbersMatch(match, matchNumber))
    || candidates.find((match) => {
      if (!homeTeamId || !awayTeamId) return false;
      const sameDirection = match.homeTeamId === homeTeamId && match.awayTeamId === awayTeamId;
      const swapped = match.homeTeamId === awayTeamId && match.awayTeamId === homeTeamId;
      return sameDirection || swapped;
    })
    || uniquePartialTeamMatch(candidates, [homeTeamId, awayTeamId])
    || (candidates.length === 1 ? candidates[0] : null);
}

function uniquePartialTeamMatch(candidates, teamIds) {
  const knownTeamIds = teamIds.filter(Boolean);
  if (!knownTeamIds.length) return null;
  const matches = candidates.filter((match) => {
    const matchTeamIds = [match.homeTeamId, match.awayTeamId].filter(Boolean);
    return knownTeamIds.every((teamId) => matchTeamIds.includes(teamId));
  });
  return matches.length === 1 ? matches[0] : null;
}

function actualMatchForBracketSource(sourceMatch, sourceMatchNumber) {
  if (!sourceMatch) return actualMatchForDerivedBracketMatch("", sourceMatchNumber, "", "");
  return sourceMatch.actualMatch
    || actualMatchForBracketMatch(sourceMatch)
    || actualMatchForDerivedBracketMatch(sourceMatch.stage || "", sourceMatchNumber, sourceMatch.home.teamId, sourceMatch.away.teamId);
}

function bracketMatchFromActualMatch(match, index) {
  return {
    matchNumber: match.matchNumber || match.apiMatchId || match.matchId || index + 1,
    stage: normalizedStage(match.stage),
    actualMatch: match,
    home: bracketSideFromTeam(match.homeTeamId),
    away: bracketSideFromTeam(match.awayTeamId)
  };
}

function bracketSideFromTeam(teamId) {
  const team = teamById(teamId);
  return {
    seed: "",
    teamId,
    country: team?.name || teamId || "TBD"
  };
}

function actualMatchForBracketMatch(bracketMatch) {
  const stage = bracketMatch.stage || "R32";
  return model.matches.find((match) => {
    if (normalizedStage(match.stage) === stage && bracketMatchNumbersMatch(match, bracketMatch.matchNumber)) return true;
    if (bracketMatchNumbersMatch(match, bracketMatch.matchNumber)) return true;
    if (!bracketTeamsMatch(match, bracketMatch)) return false;
    return normalizedStage(match.stage) === stage || matchDateMatchesBracketSlot(match, bracketMatch.matchNumber);
  }) || null;
}

function bracketMatchNumbersMatch(match, matchNumber) {
  if (!matchNumber) return false;
  const target = String(matchNumber);
  return [match.matchNumber, match.apiMatchId, match.matchId]
    .filter(Boolean)
    .some((value) => {
      const text = String(value);
      return text === target || text.endsWith(`-${target}`) || text.endsWith(`_${target}`);
    });
}

function bracketTeamsMatch(match, bracketMatch) {
  const sameDirection = match.homeTeamId === bracketMatch.home.teamId && match.awayTeamId === bracketMatch.away.teamId;
  const swapped = match.homeTeamId === bracketMatch.away.teamId && match.awayTeamId === bracketMatch.home.teamId;
  return sameDirection || swapped;
}

function matchDateMatchesBracketSlot(match, matchNumber) {
  const dateKey = worldCupKnockoutSchedule[matchNumber];
  if (!dateKey || !match.kickoffUtc) return false;
  return localDateKey(match.kickoffUtc) === dateKey;
}

function bracketTeamPoints(matchId, teamId) {
  if (!matchId || !teamId) return 0;
  return model.ledger
    .filter((row) => row.matchId === matchId && row.teamId === teamId)
    .reduce((sum, row) => sum + Number(row.points || 0), 0);
}

function normalizedStage(stage) {
  const value = String(stage || "").toUpperCase().replaceAll("-", "_").replaceAll(" ", "_");
  const aliases = {
    ROUND_OF_32: "R32",
    RO32: "R32",
    R32: "R32",
    ROUND_OF_16: "R16",
    RO16: "R16",
    R16: "R16",
    QUARTER_FINAL: "QF",
    QUARTERFINALS: "QF",
    QUARTER_FINALS: "QF",
    QF: "QF",
    SEMI_FINAL: "SF",
    SEMIFINALS: "SF",
    SEMI_FINALS: "SF",
    SF: "SF",
    FINAL: "FINAL"
  };
  return aliases[value] || value;
}

function knockoutStageLabel(stage) {
  const labels = {
    R32: "Round of 32",
    R16: "Round of 16",
    QF: "Quarterfinals",
    SF: "Semifinals",
    FINAL: "Final"
  };
  return labels[normalizedStage(stage)] || "Round of 32";
}

function worldCupBracketManagerLabel(teamId) {
  if (!teamId) return "TBD";
  const managerNames = managersForTeam(teamId)
    .map((managerId) => managerById(managerId)?.displayName || managerId)
    .filter(Boolean);
  return managerNames.length ? managerNames.join(" + ") : "Unowned";
}

function worldCupBracketScheduleLabel(matchNumber, match = null) {
  if (match?.kickoffUtc) return formatMatchDate(match);
  const dateKey = worldCupKnockoutSchedule[matchNumber];
  if (!dateKey) return "TBD";
  const [year, month, day] = dateKey.split("-").map(Number);
  const matchDate = new Date(year, month - 1, day);
  const today = startOfLocalDay(new Date());
  const daysAway = Math.round((startOfLocalDay(matchDate) - today) / 86400000);

  if (daysAway === 0) return "Today";
  if (daysAway === 1) return "Tomorrow";
  if (daysAway > 1 && daysAway <= 7) {
    return matchDate.toLocaleDateString([], { weekday: "short" });
  }
  return matchDate.toLocaleDateString([], { month: "short", day: "numeric" });
}

function roastTargetLabel(roast) {
  if (roast.managerId) {
    return managerById(roast.managerId)?.displayName || roast.managerId;
  }
  if (roast.targetType === "team" || (roast.teamIds || []).length === 1) {
    const team = teamById((roast.teamIds || [roast.targetId])[0]);
    return team?.name || roast.targetId || "Team roast";
  }
  if (roast.matchId) {
    const match = matchById(roast.matchId);
    if (match) {
      const home = teamById(match.homeTeamId);
      const away = teamById(match.awayTeamId);
      return `${home?.name || match.homeTeamId} vs ${away?.name || match.awayTeamId}`;
    }
  }
  if (roast.targetType === "league") return "The whole league";
  return roast.targetId || "Red Card Report";
}

function formatRoastTime(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function renderAllGames() {
  const matches = [...model.matches].sort(sortMatchesChronologically);
  $("all-games-list").innerHTML = renderMatchDayGroups(matches) || `<p class="country-meta">No games available yet.</p>`;
}

function renderMatchDayGroups(matches) {
  const groups = matches.reduce((days, match) => {
    const day = localDateKey(match.kickoffUtc) || "TBD";
    if (!days.has(day)) days.set(day, []);
    days.get(day).push(match);
    return days;
  }, new Map());

  return [...groups.entries()].map(([day, dayMatches]) => renderMatchDayGroup(day, dayMatches)).join("");
}

function renderMatchDayGroup(day, matches) {
  const firstMatch = matches[0] || {};
  const isPast = day !== "TBD" && day < localDateKey(new Date());
  return `
    <details class="match-day-group" ${isPast ? "" : "open"}>
      <summary class="match-day-divider">
        <span>${formatMatchDayLabel(firstMatch, day)}</span>
        <strong>${matches.length} match${matches.length === 1 ? "" : "es"}</strong>
      </summary>
      <div class="match-day-games">
        ${matches.map((match) => renderMatchCard(match)).join("")}
      </div>
    </details>
  `;
}

function sortMatchesChronologically(a, b) {
  const aTime = matchSortTime(a);
  const bTime = matchSortTime(b);
  if (aTime !== bTime) return aTime - bTime;
  return String(a.matchId || "").localeCompare(String(b.matchId || ""));
}

function matchSortTime(match) {
  const parsed = Date.parse(match.kickoffUtc || "");
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function renderMatchCard(match, options = {}) {
  const home = teamById(match.homeTeamId);
  const away = teamById(match.awayTeamId);
  const hasStarted = matchHasStarted(match);
  const isFinal = isFinalMatch(match);
  const showHoldProjection = options.showHoldProjection && isLiveMatch(match);
  const homeGoals = matchHomeGoals(match);
  const awayGoals = matchAwayGoals(match);

  return `
    <article class="match-card ${isFinal ? "match-card-final" : ""}" data-match-id="${escapeHtml(match.matchId || "")}" data-final-match="${isFinal ? "true" : "false"}" ${isFinal ? 'tabindex="0" role="button" aria-label="Open final scoring breakdown"' : ""}>
      <div class="match-stage">
        <span>${formatMatchDate(match)}</span>
        <span class="match-status match-status-${matchStatusClass(match.status)}">${formatMatchStatusLabel(match)}</span>
      </div>
      <div class="score-row">
        <span>${countryFlag(home)} ${home?.name || match.homeTeamId || "Home"}</span>
        <strong>${hasStarted ? `${homeGoals} - ${awayGoals}` : "TBD"}</strong>
        <span>${countryFlag(away)} ${away?.name || match.awayTeamId || "Away"}</span>
      </div>
      <div class="match-manager-points">
        ${teamMatchManagerRows(match, match.homeTeamId, hasStarted, showHoldProjection).map(renderMatchManagerRow).join("")}
        ${teamMatchManagerRows(match, match.awayTeamId, hasStarted, showHoldProjection).map(renderMatchManagerRow).join("")}
      </div>
    </article>
  `;
}

function renderMatchManagerRow(item) {
  return `
    <span class="match-manager-row" style="--manager-color:${managerColor(managerById(item.managerId), item.managerId)}">
      <i></i>
      <strong>${item.managerName}</strong>
      <em>${countryFlag(item.team)} ${item.team?.name || item.teamId}</em>
      <b class="match-points-stack">
        <span class="match-current-points">${item.points === null ? "TBD" : `${Number(item.points) > 0 ? "+" : ""}${fmt(item.points)}`}</span>
        ${item.holdPoints === null || item.holdPoints === undefined ? "" : `
          <span class="match-projected-points">Projected ${Number(item.holdPoints) > 0 ? "+" : ""}${fmt(item.holdPoints)}</span>
          <span class="match-projection-breakdown">${item.projectionSummary || ""}</span>
        `}
      </b>
    </span>
  `;
}

function openMatchBreakdown(matchId) {
  const modal = $("match-breakdown-modal");
  const content = $("match-breakdown-content");
  const match = matchById(matchId);
  if (!modal || !content || !match || !isFinalMatch(match)) return;

  content.innerHTML = renderMatchBreakdown(match);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const closeButton = modal.querySelector(".match-breakdown-close");
  if (closeButton) closeButton.focus();
}

function closeMatchBreakdown() {
  const modal = $("match-breakdown-modal");
  if (!modal || !modal.classList.contains("is-open")) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function renderMatchBreakdown(match) {
  const home = teamById(match.homeTeamId);
  const away = teamById(match.awayTeamId);
  const homeGoals = matchHomeGoals(match);
  const awayGoals = matchAwayGoals(match);
  const rows = scoringRowsForMatch(match.matchId);
  const groupedRows = [match.homeTeamId, match.awayTeamId].map((teamId) => ({
    teamId,
    team: teamById(teamId),
    total: rows
      .filter((row) => row.teamId === teamId)
      .reduce((sum, row) => sum + Number(row.points || 0), 0),
    managers: scoringRowsByManager(rows.filter((row) => row.teamId === teamId))
  }));

  return `
    <header class="match-breakdown-header">
      <span>${escapeHtml(match.stage || "Match")} · ${escapeHtml(formatMatchDate(match))}</span>
      <h3 id="match-breakdown-title">${escapeHtml(home?.name || match.homeTeamId)} ${homeGoals} - ${awayGoals} ${escapeHtml(away?.name || match.awayTeamId)}</h3>
      <p>Final scoring breakdown from the ledger.</p>
    </header>
    <div class="match-breakdown-summary">
      ${groupedRows.map((group) => `
        <article>
          <span>${countryFlag(group.team)} ${escapeHtml(group.team?.name || group.teamId)}</span>
          <strong>${formatSignedPoints(group.total)}</strong>
        </article>
      `).join("")}
    </div>
    <div class="match-breakdown-teams">
      ${groupedRows.map(renderMatchBreakdownTeam).join("")}
    </div>
  `;
}

function scoringRowsForMatch(matchId) {
  return model.ledger
    .filter((row) => row.matchId === matchId)
    .sort((a, b) => {
      if (a.teamId !== b.teamId) return String(a.teamId).localeCompare(String(b.teamId));
      if (a.managerId !== b.managerId) return String(a.managerId).localeCompare(String(b.managerId));
      return categorySortValue(a.category) - categorySortValue(b.category);
    });
}

function scoringRowsByManager(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    if (!groups.has(row.managerId)) groups.set(row.managerId, []);
    groups.get(row.managerId).push(row);
  });
  return [...groups.entries()].map(([managerId, managerRows]) => ({
    managerId,
    manager: managerById(managerId),
    rows: managerRows,
    total: managerRows.reduce((sum, row) => sum + Number(row.points || 0), 0)
  }));
}

function renderMatchBreakdownTeam(group) {
  return `
    <section class="match-breakdown-team">
      <div class="match-breakdown-team-title">
        <strong>${countryFlag(group.team)} ${escapeHtml(group.team?.name || group.teamId)}</strong>
        <span>${formatSignedPoints(group.total)} pts</span>
      </div>
      ${group.managers.length ? group.managers.map(renderMatchBreakdownManager).join("") : `
        <p class="match-breakdown-empty">No rostered scoring rows for this team.</p>
      `}
    </section>
  `;
}

function renderMatchBreakdownManager(group) {
  return `
    <article class="match-breakdown-manager" style="--manager-color:${managerColor(group.manager, group.managerId)}">
      <div class="match-breakdown-manager-title">
        <span><i></i>${escapeHtml(group.manager?.displayName || group.managerId)}</span>
        <strong>${formatSignedPoints(group.total)}</strong>
      </div>
      <div class="match-breakdown-rows">
        ${group.rows.map((row) => `
          <div class="match-breakdown-row">
            <span>${escapeHtml(categoryLabel(row.category))}</span>
            <small>${escapeHtml(row.explanation || scoringFormula(row))}</small>
            <strong>${formatSignedPoints(row.points)}</strong>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function categoryLabel(category) {
  return String(category || "scoring")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function scoringFormula(row) {
  const quantity = Number(row.quantity || 0);
  const pointsPerUnit = Number(row.pointsPerUnit || 0);
  if (quantity && pointsPerUnit) {
    return `${quantity} x ${formatSignedPoints(pointsPerUnit)}`;
  }
  return "Ledger scoring row";
}

function categorySortValue(category) {
  const order = ["win", "group_draw", "draw", "goal_scored", "goal_allowed", "clean_sheet", "red_card", "qualify_for_knockouts", "qualify_knockouts", "win_group", "champion"];
  const index = order.indexOf(String(category || ""));
  return index === -1 ? order.length : index;
}

function formatSignedPoints(value) {
  const numberValue = Number(value || 0);
  return `${numberValue > 0 ? "+" : ""}${fmt(numberValue)}`;
}

function matchHomeGoals(match) {
  return Number(match.homeGoals ?? match.homeScore ?? 0);
}

function matchAwayGoals(match) {
  return Number(match.awayGoals ?? match.awayScore ?? 0);
}

function startTyping() {
  const phrases = typingPhrases();
  const node = $("typing-text");
  node.textContent = phrases[0];
  charIndex = phrases[0].length;
  typingDeleting = true;
  typingHold = 12;

  window.setInterval(() => {
    const phrase = phrases[typingIndex % phrases.length];
    if (typingHold > 0) {
      typingHold -= 1;
      return;
    }

    if (!typingDeleting) {
      charIndex += 1;
      node.textContent = phrase.slice(0, charIndex);
      if (charIndex >= phrase.length) {
        typingDeleting = true;
        typingHold = 12;
      }
    } else {
      charIndex -= 1;
      node.textContent = phrase.slice(0, Math.max(charIndex, 0));
      if (charIndex <= 0) {
        typingDeleting = false;
        typingIndex += 1;
      }
    }
  }, 72);
}

function typingPhrases() {
  return tableFacts();
}

function tableFacts() {
  const sorted = sortedStandings();
  const leader = sorted[0];
  const second = sorted[1];
  const gap = leader && second ? fmt(leader.totalPoints - second.totalPoints) : "0";
  const topCountry = topTeamTotals()[0];
  const topSwing = biggestSingleMatchSwing();
  const closestGap = closestStandingsGap(sorted);
  return [
    `${leader?.displayName || "The leader"} lead by ${gap} point${Number(gap) === 1 ? "" : "s"}`,
    topSwing ? `${topSwing.managerName} swung ${fmt(topSwing.points)} points in one match` : "Every goal moves the table",
    topCountry ? `${topCountry.team.name || "A country"} has scored ${fmt(topCountry.points)} fantasy points` : "Country points roll up to player glory",
    closestGap ? `${closestGap.first} and ${closestGap.second} are separated by ${fmt(closestGap.gap)} points` : "Live games stay calm, standings stay loud"
  ];
}

function sortedStandings() {
  return [...model.standings].sort((a, b) => Number(a.rank) - Number(b.rank));
}

function rosterManagersInOrder() {
  const seen = new Set();
  const rankedManagers = sortedStandings().map((standing) => {
    seen.add(standing.managerId);
    return {
      managerId: standing.managerId,
      displayName: standing.displayName,
      rank: standing.rank,
      totalPoints: Number(standing.totalPoints || 0)
    };
  });
  const unrankedManagers = model.managers
    .filter((manager) => !seen.has(manager.managerId))
    .map((manager) => ({
      managerId: manager.managerId,
      displayName: manager.displayName || manager.managerId,
      rank: null,
      totalPoints: totalPointsForManager(manager.managerId)
    }));
  return [...rankedManagers, ...unrankedManagers];
}

function managerById(managerId) {
  return model.managers.find((manager) => manager.managerId === managerId) || {};
}

function rankMovementByManager() {
  const currentRanks = rankMapFromStandings(sortedStandings());
  const timeline = buildDailyCumulativeTotals();
  if (timeline.length < 2) return {};

  const snapshots = timeline.map((day) => ({
    date: day.date,
    ranks: rankMapFromTotals(day.values)
  }));

  let baseline = null;
  for (let index = snapshots.length - 2; index >= 0; index -= 1) {
    if (hasRankDifference(snapshots[index].ranks, currentRanks)) {
      baseline = snapshots[index];
      break;
    }
  }
  if (!baseline) return {};

  return Object.fromEntries(Object.entries(currentRanks)
    .map(([managerId, currentRank]) => {
      const previousRank = baseline.ranks[managerId];
      const delta = Number(previousRank || 0) - Number(currentRank || 0);
      if (!previousRank || !delta) return null;
      return [managerId, {
        direction: delta > 0 ? "up" : "down",
        places: Math.abs(delta),
        baselineDate: baseline.date
      }];
    })
    .filter(Boolean));
}

function rankMapFromStandings(standings) {
  return Object.fromEntries(standings.map((standing, index) => [
    standing.managerId,
    Number(standing.rank || index + 1)
  ]));
}

function rankMapFromTotals(values) {
  return Object.fromEntries([...values]
    .sort((a, b) => {
      if (Number(b.total || 0) !== Number(a.total || 0)) return Number(b.total || 0) - Number(a.total || 0);
      return String(a.displayName || a.managerId).localeCompare(String(b.displayName || b.managerId));
    })
    .map((value, index) => [value.managerId, index + 1]));
}

function hasRankDifference(previousRanks, currentRanks) {
  return Object.entries(currentRanks).some(([managerId, currentRank]) => previousRanks[managerId] && previousRanks[managerId] !== currentRank);
}

function renderRankMovementBadge(movement) {
  if (!movement) return "";
  const isUp = movement.direction === "up";
  const verb = isUp ? "Moved up" : "Moved down";
  const noun = movement.places === 1 ? "spot" : "spots";
  const label = `${isUp ? "▲" : "▼"}${movement.places}`;
  const title = `${verb} ${movement.places} ${noun} since ${formatShortDate(movement.baselineDate)}`;
  return `<span class="rank-movement rank-movement-${movement.direction}" title="${title}" aria-label="${title}">${label}</span>`;
}

function teamById(teamId) {
  return model.teams.find((team) => team.teamId === teamId) || {};
}

function matchById(matchId) {
  return model.matches.find((match) => match.matchId === matchId);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function managerColor(manager, managerId) {
  if (managerColors[manager?.colorToken]) {
    return managerColors[manager.colorToken];
  }
  return managerColorByIndex(managerId || manager?.managerId);
}

function managerColorByIndex(managerId) {
  const managerIds = rosterManagersInOrder().map((row) => row.managerId);
  const index = Math.max(0, managerIds.indexOf(managerId));
  return managerColorPalette[index % managerColorPalette.length];
}

function managersForTeam(teamId) {
  return model.rosters
    .filter((roster) => roster.teamId === teamId)
    .map((roster) => roster.managerId);
}

function gamesPlayedForManager(managerId) {
  const ownedTeams = new Set(
    model.rosters
      .filter((roster) => roster.managerId === managerId)
      .map((roster) => roster.teamId)
  );

  return model.matches.reduce((total, match) => {
    if (!matchHasStarted(match)) return total;
    return total
      + (ownedTeams.has(match.homeTeamId) ? 1 : 0)
      + (ownedTeams.has(match.awayTeamId) ? 1 : 0);
  }, 0);
}

function countriesRemainingForManager(managerId) {
  const aliveTeamIds = teamsStillAliveInTournament();
  return new Set(model.rosters
    .filter((roster) => roster.managerId === managerId)
    .map((roster) => roster.teamId)
    .filter((teamId) => aliveTeamIds.has(teamId))).size;
}

function teamStillInTournament(team) {
  if (!team?.teamId) return false;
  return teamsStillAliveInTournament().has(team.teamId);
}

function teamsStillAliveInTournament() {
  const statusEliminated = new Set(model.teams
    .filter((team) => teamMarkedEliminated(team))
    .map((team) => team.teamId));
  const knockoutMatches = knockoutMatchesForElimination();
  const finalMatchComplete = knockoutMatches.some((match) => normalizedStage(match.stage) === "FINAL" && isFinalMatch(match));

  if (finalMatchComplete) return new Set();

  const alive = new Set(projectedWorldCupBracket(projectedGroupTables())
    .flatMap((match) => [match.home.teamId, match.away.teamId])
    .filter(Boolean));
  const eliminatedByMatch = completedKnockoutLoserTeamIds();

  knockoutMatches.forEach((match) => {
    if (isFinalMatch(match)) {
      const winnerId = winningTeamId(match);
      if (winnerId && normalizedStage(match.stage) !== "FINAL") alive.add(winnerId);
      return;
    }

    if (match.homeTeamId) alive.add(match.homeTeamId);
    if (match.awayTeamId) alive.add(match.awayTeamId);
  });

  statusEliminated.forEach((teamId) => alive.delete(teamId));
  eliminatedByMatch.forEach((teamId) => alive.delete(teamId));
  return alive;
}

function completedKnockoutLoserTeamIds() {
  const loserIds = new Set();
  model.matches
    .filter((match) => isFinalMatch(match) && isKnockoutEliminationMatch(match))
    .forEach((match) => loserTeamIds(match).forEach((teamId) => loserIds.add(teamId)));
  return loserIds;
}

function isKnockoutEliminationMatch(match) {
  const knockoutStages = ["R32", "R16", "QF", "SF", "FINAL"];
  if (knockoutStages.includes(normalizedStage(match.stage))) return true;
  const firstKnockoutDate = worldCupKnockoutSchedule[73];
  const matchDate = localDateKey(match.kickoffUtc);
  return Boolean(firstKnockoutDate && matchDate && matchDate >= firstKnockoutDate);
}

function knockoutMatchesForElimination() {
  const knockoutStages = ["R32", "R16", "QF", "SF", "FINAL"];
  const matchesById = new Map();

  model.matches
    .filter((match) => knockoutStages.includes(normalizedStage(match.stage)))
    .forEach((match) => matchesById.set(match.matchId, match));

  projectedWorldCupBracket(projectedGroupTables())
    .map(actualMatchForBracketMatch)
    .filter(Boolean)
    .forEach((match) => matchesById.set(matchKey(match), { ...match, stage: normalizedStage(match.stage) === "R32" ? match.stage : "R32" }));

  return [...matchesById.values()].sort(sortMatchesChronologically);
}

function matchKey(match) {
  return match.matchId || `${match.homeTeamId}-${match.awayTeamId}-${match.kickoffUtc || match.stage || "match"}`;
}

function teamMarkedEliminated(team) {
  const status = String(team?.status || "").toLowerCase();
  return ["eliminated", "knocked_out", "knocked-out", "out", "withdrawn"].includes(status);
}

function winningTeamId(match) {
  if (match.winnerTeamId) return match.winnerTeamId;
  const homeGoals = matchHomeGoals(match);
  const awayGoals = matchAwayGoals(match);
  if (homeGoals > awayGoals) return match.homeTeamId;
  if (awayGoals > homeGoals) return match.awayTeamId;
  return "";
}

function loserTeamIds(match) {
  const winnerId = winningTeamId(match);
  if (!winnerId) return [];
  return [match.homeTeamId, match.awayTeamId]
    .filter(Boolean)
    .filter((teamId) => teamId !== winnerId);
}

function pointsForManagerTeamInMatch(managerId, teamId, matchId) {
  return model.ledger
    .filter((row) => row.managerId === managerId && row.teamId === teamId && row.matchId === matchId)
    .reduce((sum, row) => sum + Number(row.points || 0), 0);
}

function displayPointsForManagerTeamInMatch(managerId, teamId, match) {
  if (isLiveMatch(match)) {
    return liveFantasyPointsForTeam(match, teamId) + redCardPointsForManagerTeamInMatch(managerId, teamId, match.matchId);
  }
  return pointsForManagerTeamInMatch(managerId, teamId, match.matchId);
}

function redCardPointsForManagerTeamInMatch(managerId, teamId, matchId) {
  return model.ledger
    .filter((row) => row.managerId === managerId && row.teamId === teamId && row.matchId === matchId && row.category === "red_card")
    .reduce((sum, row) => sum + Number(row.points || 0), 0);
}

function projectedTotalForManager(managerId, currentTotal) {
  let hasLiveMatch = false;
  const liveProjection = model.matches
    .filter((match) => isLiveMatch(match))
    .reduce((sum, match) => {
      return sum + ["homeTeamId", "awayTeamId"].reduce((matchSum, sideKey) => {
        const teamId = match[sideKey];
        if (!managersForTeam(teamId).includes(managerId)) return matchSum;
        hasLiveMatch = true;

        const projectedPoints = holdProjectionPointsForTeam(match, teamId)
          + redCardPointsForManagerTeamInMatch(managerId, teamId, match.matchId);
        return matchSum + projectedPoints;
      }, 0);
    }, 0);

  return hasLiveMatch ? Number(currentTotal || 0) + liveProjection : null;
}

function liveFantasyPointsForTeam(match, teamId) {
  const isHome = teamId === match.homeTeamId;
  const goalsFor = isHome ? matchHomeGoals(match) : matchAwayGoals(match);
  const goalsAgainst = isHome ? matchAwayGoals(match) : matchHomeGoals(match);
  return (goalsFor * 0.5) + (goalsAgainst * -0.25);
}

function holdProjectionPointsForTeam(match, teamId) {
  const isHome = teamId === match.homeTeamId;
  const goalsFor = isHome ? matchHomeGoals(match) : matchAwayGoals(match);
  const goalsAgainst = isHome ? matchAwayGoals(match) : matchHomeGoals(match);
  let points = liveFantasyPointsForTeam(match, teamId);

  if (goalsFor > goalsAgainst) {
    points += 1;
  } else if (String(match.stage || "").toLowerCase() === "group" && goalsFor === goalsAgainst) {
    points += 0.5;
  }

  if (goalsAgainst === 0) {
    points += 0.5;
  }

  return points;
}

function projectedBreakdownForTeam(match, teamId, redCardPoints = 0) {
  const isHome = teamId === match.homeTeamId;
  const goalsFor = isHome ? matchHomeGoals(match) : matchAwayGoals(match);
  const goalsAgainst = isHome ? matchAwayGoals(match) : matchHomeGoals(match);
  const parts = [];

  if (goalsFor > goalsAgainst) {
    parts.push("W:1");
  } else if (String(match.stage || "").toLowerCase() === "group" && goalsFor === goalsAgainst) {
    parts.push("D:0.5");
  }

  if (goalsFor > 0) {
    parts.push(`G:${fmt(goalsFor * 0.5)}`);
  }

  if (goalsAgainst > 0) {
    parts.push(`GA:${fmt(goalsAgainst * -0.25)}`);
  } else {
    parts.push("CS:0.5");
  }

  if (redCardPoints) {
    parts.push(`RC:${fmt(redCardPoints)}`);
  }

  return parts.join(" ");
}

function teamMatchManagerRows(match, teamId, hasStarted, showHoldProjection = false) {
  const managerIds = managersForTeam(teamId);
  const team = teamById(teamId);
  if (!managerIds.length) {
    return [{
      managerId: "",
      managerName: "Unowned",
      teamId,
      team,
      points: hasStarted ? 0 : null,
      holdPoints: showHoldProjection ? holdProjectionPointsForTeam(match, teamId) : null,
      projectionSummary: showHoldProjection ? projectedBreakdownForTeam(match, teamId) : ""
    }];
  }
  return managerIds.map((managerId) => {
    const redCardPoints = redCardPointsForManagerTeamInMatch(managerId, teamId, match.matchId);
    return {
      managerId,
      managerName: managerById(managerId)?.displayName || managerId,
      teamId,
      team,
      points: hasStarted ? displayPointsForManagerTeamInMatch(managerId, teamId, match) : null,
      holdPoints: showHoldProjection ? holdProjectionPointsForTeam(match, teamId) + redCardPoints : null,
      projectionSummary: showHoldProjection ? projectedBreakdownForTeam(match, teamId, redCardPoints) : ""
    };
  });
}

function matchesForTeam(teamId) {
  return [...model.matches]
    .filter((match) => match.homeTeamId === teamId || match.awayTeamId === teamId)
    .sort(sortMatchesChronologically);
}

function nextScheduledMatchForTeam(teamId) {
  const now = Date.now();
  return matchesForTeam(teamId).find((match) => {
    const kickoff = matchSortTime(match);
    return kickoff >= now && !matchHasStarted(match);
  });
}

function renderCountryMatchRow(managerId, teamId, match) {
  const opponentId = match.homeTeamId === teamId ? match.awayTeamId : match.homeTeamId;
  const opponent = teamById(opponentId);
  const hasStarted = matchHasStarted(match);
  const points = hasStarted ? displayPointsForManagerTeamInMatch(managerId, teamId, match) : null;
  const score = hasStarted ? `${matchHomeGoals(match)}-${matchAwayGoals(match)}` : "TBD";
  const resultLabel = hasStarted ? `${Number(points) > 0 ? "+" : ""}${fmt(points)} pts` : formatUpcomingMatchLabel(match);
  return `
    <article class="country-match-row">
      <span class="country-match-date">${formatMatchDate(match)}</span>
      <span class="country-match-opponent">vs ${countryFlag(opponent)} ${opponent?.name || opponentId || "TBD"}</span>
      <span class="country-match-score">${score}</span>
      <strong class="country-match-points">${resultLabel}</strong>
    </article>
  `;
}

function renderCountryBonusRow(managerId, teamId) {
  const rows = bonusRowsForManagerTeam(managerId, teamId);
  const total = rows.reduce((sum, row) => sum + Number(row.points || 0), 0);
  const breakdown = rows.length
    ? rows.map((row) => `${bonusLabel(row.category)} ${formatSignedPoints(row.points)}`).join(" · ")
    : "No bonus earned";
  return `
    <article class="country-match-row country-bonus-row">
      <span class="country-match-date">BONUS</span>
      <span class="country-match-opponent">${escapeHtml(breakdown)}</span>
      <span class="country-match-score">Final</span>
      <strong class="country-match-points">${formatSignedPoints(total)} pts</strong>
    </article>
  `;
}

function bonusRowsForManagerTeam(managerId, teamId) {
  const ledgerRows = settledLedgerRows()
    .filter((row) => row.managerId === managerId && row.teamId === teamId && isEarnedBonusCategory(row.category))
    .sort((a, b) => categorySortValue(a.category) - categorySortValue(b.category));
  if (ledgerRows.length) {
    return ledgerRows;
  }

  return projectedBonusRowsForTeam(teamId);
}

function projectedBonusRowsForTeam(teamId) {
  const projection = projectedBonusByTeam().get(teamId) || {};
  const rows = [];
  if (projection.bonus >= 0.5) {
    rows.push({ category: "qualify_for_knockouts", points: 0.5 });
  }
  if (projection.bonus >= 1.5) {
    rows.push({ category: "win_group", points: 1 });
  }
  return rows;
}

function bonusLabel(category) {
  const labels = {
    qualify_for_knockouts: "Qualified",
    qualify_knockouts: "Qualified",
    win_group: "Won group",
    champion: "Champion"
  };
  return labels[category] || categoryLabel(category);
}

function todaysMatches() {
  const today = localDateKey(new Date());
  const matches = model.matches.filter((match) => localDateKey(match.kickoffUtc) === today);
  if (matches.length) {
    return matches.sort(sortMatchesChronologically);
  }

  const now = Date.now();
  const nextUp = model.matches
    .filter((match) => {
      const kickoff = matchSortTime(match);
      return kickoff >= now && !matchHasStarted(match);
    })
    .sort(sortMatchesChronologically)
    .slice(0, 3);
  if (nextUp.length) return nextUp;

  return [...model.matches]
    .filter((match) => matchHasStarted(match))
    .sort((a, b) => sortMatchesChronologically(b, a))
    .slice(0, 3);
}

function matchHasStarted(match) {
  const status = String(match.status || "scheduled").toLowerCase();
  return status !== "scheduled" && status !== "postponed";
}

function isLiveMatch(match) {
  const status = String(match.status || "").toLowerCase();
  return ["live", "in_progress", "playing", "halftime", "half_time"].includes(status);
}

function isFinalMatch(match) {
  const status = String(match.status || "").toLowerCase();
  return ["final", "finished", "complete"].includes(status);
}

function localDateKey(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMatchDate(match) {
  const date = new Date(match.kickoffUtc || "");
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatUpcomingMatchLabel(match) {
  const date = new Date(match.kickoffUtc || "");
  if (Number.isNaN(date.getTime())) return "TBD";

  const today = startOfLocalDay(new Date());
  const matchDay = startOfLocalDay(date);
  const daysAway = Math.round((matchDay - today) / 86400000);

  if (daysAway === 0) return "Today";
  if (daysAway > 0 && daysAway < 7) {
    return date.toLocaleDateString([], { weekday: "long" });
  }
  return `${date.getMonth() + 1}/${String(date.getDate()).padStart(2, "0")}`;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatMatchDayLabel(match, day) {
  const date = new Date(match.kickoffUtc || "");
  if (Number.isNaN(date.getTime())) return day || "Date TBD";
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

function colorTokenFromValue(value) {
  if (!value) return "";
  var normalized = String(value).toLowerCase();
  if (managerColors[normalized]) return normalized;
  if (normalized.includes("blue")) return "blue";
  if (normalized.includes("red")) return "red";
  if (normalized.includes("gold") || normalized.includes("yellow")) return "gold";
  if (normalized.includes("purple")) return "purple";
  if (normalized.includes("orange")) return "orange";
  if (normalized.includes("silver") || normalized.includes("gray") || normalized.includes("grey")) return "silver";
  if (normalized.includes("black")) return "black";
  if (normalized.includes("teal")) return "teal";
  if (normalized.includes("pink")) return "pink";
  if (normalized.includes("lime")) return "lime";
  if (normalized.includes("navy")) return "navy";
  return "";
}

function categoryTotalsForManager(managerId) {
  return summarizeRows(model.ledger.filter((row) => row.managerId === managerId));
}

function settledCategoryTotalsForManager(managerId) {
  return summarizeRows(settledLedgerRows().filter((row) => row.managerId === managerId));
}

function categoryTotalsForTeam(teamId) {
  return summarizeRows(model.ledger.filter((row) => row.teamId === teamId));
}

function totalPointsForTeam(teamId) {
  return model.ledger
    .filter((row) => row.teamId === teamId)
    .reduce((sum, row) => sum + Number(row.points || 0), 0);
}

function totalPointsForManager(managerId) {
  return model.ledger
    .filter((row) => row.managerId === managerId)
    .reduce((sum, row) => sum + Number(row.points || 0), 0);
}

function settledTotalForManager(managerId) {
  return settledLedgerRows()
    .filter((row) => row.managerId === managerId)
    .reduce((sum, row) => sum + Number(row.points || 0), 0);
}

function earnedBonusForManager(managerId, standing = {}) {
  if (Number.isFinite(Number(standing.bonus))) {
    return Number(standing.bonus);
  }
  return resolvedBonusForManager(managerId);
}

function earnedBonusFallbackForManager(managerId, standing = {}) {
  if (Number.isFinite(Number(standing.bonus))) {
    return 0;
  }
  const ledgerBonus = settledCategoryTotalsForManager(managerId).bonuses;
  return Math.max(0, resolvedBonusForManager(managerId) - ledgerBonus);
}

function resolvedBonusForManager(managerId) {
  return model.rosters
    .filter((roster) => roster.managerId === managerId)
    .flatMap((roster) => bonusRowsForManagerTeam(managerId, roster.teamId))
    .reduce((sum, row) => sum + Number(row.points || 0), 0);
}

function hasEarnedBonusLedgerRows() {
  return settledLedgerRows().some((row) => isEarnedBonusCategory(row.category));
}

function settledLedgerRows() {
  return model.ledger.filter((row) => {
    if (!row.matchId) return true;
    const match = matchById(row.matchId);
    return match ? isFinalMatch(match) : false;
  });
}

function summarizeRows(rows) {
  return rows.reduce((totals, row) => {
    const points = Number(row.points || 0);
    if (row.category === "win") totals.wins += points;
    else if (row.category === "goal_scored") totals.goals += points;
    else if (row.category === "goal_allowed" || row.category === "clean_sheet") totals.defense += points;
    else if (row.category === "red_card") totals.cards += points;
    else if (isEarnedBonusCategory(row.category)) totals.bonuses += points;
    return totals;
  }, { wins: 0, goals: 0, defense: 0, bonuses: 0, cards: 0 });
}

function isEarnedBonusCategory(category) {
  return ["qualify_for_knockouts", "qualify_knockouts", "win_group", "champion"].includes(category);
}

function topTeamTotals() {
  const totals = {};
  for (const row of model.ledger) {
    totals[row.teamId] = (totals[row.teamId] || 0) + Number(row.points || 0);
  }
  return model.teams
    .map((team) => ({ team, points: totals[team.teamId] || 0 }))
    .sort((a, b) => b.points - a.points);
}

function countryFlag(team) {
  if (!team) return "🏳";
  return team.flagEmoji || countryFlags[team.teamId] || team.shortName || "🏳";
}

function biggestSingleMatchSwing() {
  const totalsByMatchManager = {};
  for (const row of model.ledger) {
    if (!row.matchId) continue;
    const key = `${row.matchId}::${row.managerId}`;
    totalsByMatchManager[key] = (totalsByMatchManager[key] || 0) + Number(row.points || 0);
  }
  return Object.entries(totalsByMatchManager)
    .map(([key, points]) => {
      const managerId = key.split("::").pop();
      return {
        managerId,
        managerName: managerById(managerId)?.displayName || managerId,
        points: Math.abs(points)
      };
    })
    .sort((a, b) => b.points - a.points)[0];
}

function closestStandingsGap(sorted) {
  let closest = null;
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const first = sorted[index];
    const second = sorted[index + 1];
    const gap = Math.abs(Number(first.totalPoints || 0) - Number(second.totalPoints || 0));
    if (!closest || gap < closest.gap) {
      closest = {
        first: first.displayName,
        second: second.displayName,
        gap
      };
    }
  }
  return closest;
}

function buildDailyCumulativeTotals() {
  const matchDateById = Object.fromEntries(model.matches.map((match) => [
    match.matchId,
    match.kickoffUtc ? match.kickoffUtc.slice(0, 10) : ""
  ]));
  const datedRows = [];
  const undatedRows = [];

  for (const row of model.ledger) {
    const date = matchDateById[row.matchId] || "";
    (date ? datedRows : undatedRows).push({ row, date });
  }

  const dates = [...new Set(datedRows.map((item) => item.date))].sort();
  const finalDate = dates[dates.length - 1] || new Date(model.meta.generatedAt || Date.now()).toISOString().slice(0, 10);
  if (!dates.length) dates.push(finalDate);

  const rowsByDate = {};
  dates.forEach((date) => {
    rowsByDate[date] = [];
  });
  datedRows.forEach((item) => {
    rowsByDate[item.date].push(item.row);
  });
  rowsByDate[finalDate].push(...undatedRows.map((item) => item.row));

  const managerIds = rosterManagersInOrder().map((manager) => manager.managerId);
  const totals = Object.fromEntries(managerIds.map((managerId) => [managerId, 0]));

  return dates.map((date) => {
    for (const row of rowsByDate[date] || []) {
      if (row.managerId in totals) {
        totals[row.managerId] += Number(row.points || 0);
      }
    }
    const values = managerIds.map((managerId) => ({
      managerId,
      displayName: managerById(managerId)?.displayName || managerId,
      total: Math.round((totals[managerId] || 0) * 100) / 100
    }));
    const leader = [...values].sort((a, b) => b.total - a.total)[0];
    return { date, values, leader };
  });
}

function buildStandingsTimeline() {
  const dailyTotals = buildDailyCumulativeTotals();
  if (!dailyTotals.length) return [];

  const latestDateValue = dateValueForTimeline(dailyTotals[dailyTotals.length - 1].date);
  const windowStart = latestDateValue === null ? null : latestDateValue - (13 * 24 * 60 * 60 * 1000);
  const visibleDays = dailyTotals.filter((day) => {
    if (windowStart === null) return true;
    const value = dateValueForTimeline(day.date);
    return value === null || value >= windowStart;
  });
  const sourceDays = visibleDays.length ? visibleDays : dailyTotals;

  return sourceDays.map((day) => {
    const rankedValues = [...day.values]
      .sort((a, b) => {
        if (Number(b.total || 0) !== Number(a.total || 0)) return Number(b.total || 0) - Number(a.total || 0);
        return String(a.displayName || a.managerId).localeCompare(String(b.displayName || b.managerId));
      })
      .map((value, index) => ({
        ...value,
        rank: index + 1
      }));
    const valuesById = Object.fromEntries(rankedValues.map((value) => [value.managerId, value]));
    const values = rosterManagersInOrder().map((manager) => valuesById[manager.managerId] || {
      managerId: manager.managerId,
      displayName: manager.displayName || manager.managerId,
      total: 0,
      rank: rankedValues.length + 1
    });
    return {
      date: day.date,
      values,
      leader: rankedValues[0] || null
    };
  });
}

function dateValueForTimeline(date) {
  const value = Date.parse(`${date}T00:00:00Z`);
  return Number.isNaN(value) ? null : value;
}

function standingsJourneyForManagers(timeline, managers) {
  const latestDay = timeline[timeline.length - 1];
  const firstDay = timeline[0];

  return managers.map((manager) => {
    const ranks = timeline
      .map((day) => day.values.find((value) => value.managerId === manager.managerId)?.rank)
      .filter((rank) => Number.isFinite(rank));
    const firstRank = firstDay?.values.find((value) => value.managerId === manager.managerId)?.rank || null;
    const current = latestDay?.values.find((value) => value.managerId === manager.managerId) || null;
    const currentRank = current?.rank || null;
    return {
      ...manager,
      currentTotal: current?.total || 0,
      currentRank,
      firstRank,
      bestRank: ranks.length ? Math.min(...ranks) : null,
      worstRank: ranks.length ? Math.max(...ranks) : null,
      movement: firstRank && currentRank ? firstRank - currentRank : 0,
      volatility: ranks.length ? Math.max(...ranks) - Math.min(...ranks) : 0
    };
  });
}

function renderPointsTimeline() {
  const node = $("points-timeline");
  if (!node) return;

  const timeline = buildStandingsTimeline();
  if (!timeline.length) {
    node.innerHTML = `<p class="country-meta">No standings history available yet.</p>`;
    return;
  }

  const managers = rosterManagersInOrder();
  const firstDay = timeline[0];
  const latestDay = timeline[timeline.length - 1];
  const latestLeader = latestDay?.leader;
  const journeys = standingsJourneyForManagers(timeline, managers);
  const biggestClimb = [...journeys].sort((a, b) => b.movement - a.movement)[0];
  const wildestRide = [...journeys].sort((a, b) => b.volatility - a.volatility)[0];
  const rankCount = Math.max(1, managers.length);
  const width = 100;
  const height = 100;
  const rankPointsFor = (managerId) => timeline.map((day, dayIndex) => {
    const value = day.values.find((item) => item.managerId === managerId);
    const x = timeline.length === 1 ? width / 2 : (dayIndex / (timeline.length - 1)) * width;
    const y = rankCount === 1 ? height / 2 : (((value?.rank || rankCount) - 1) / (rankCount - 1)) * height;
    return { x, y, rank: value?.rank || rankCount, total: value?.total || 0 };
  });
  const rankMarkers = Array.from({ length: rankCount }, (_, index) => ({
    rank: index + 1,
    y: rankCount === 1 ? height / 2 : (index / (rankCount - 1)) * height
  }));

  node.innerHTML = `
    <div class="timeline-mobile-summary">
      <article>
        <span>Latest leader</span>
        <strong>${latestLeader?.displayName || "No leader"}</strong>
        <em>#${latestLeader?.rank || 1} · ${fmt(latestLeader?.total || 0)} pts</em>
      </article>
      <article>
        <span>Biggest climb</span>
        <strong>${biggestClimb?.displayName || "No movement"}</strong>
        <em>${biggestClimb?.movement > 0 ? `+${biggestClimb.movement} place${biggestClimb.movement === 1 ? "" : "s"}` : "No climb"}</em>
      </article>
      <article>
        <span>Wildest ride</span>
        <strong>${wildestRide?.displayName || "No movement"}</strong>
        <em>${wildestRide?.volatility ? `${wildestRide.volatility + 1}-rank range` : "Steady"}</em>
      </article>
    </div>
    <div class="timeline-scroll">
      <div class="timeline-chart" style="--timeline-days:${timeline.length}">
        <svg class="timeline-plot" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
          ${rankMarkers.map((marker) => `
            <line class="timeline-rank-line" x1="0" x2="${width}" y1="${marker.y}" y2="${marker.y}" />
            <text class="timeline-rank-label" x="0" y="${marker.y}" dominant-baseline="middle">#${marker.rank}</text>
          `).join("")}
          ${managers.map((manager) => {
            const ranks = rankPointsFor(manager.managerId);
            const linePoints = ranks.length === 1
              ? [{ ...ranks[0], x: 8 }, { ...ranks[0], x: 92 }]
              : ranks;
            const color = managerColor(managerById(manager.managerId), manager.managerId);
            return `
              <polyline points="${linePoints.map((point) => `${point.x},${point.y}`).join(" ")}" stroke="${color}" />
              ${ranks.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="1.6" fill="${color}" />`).join("")}
            `;
          }).join("")}
        </svg>
        ${timeline.map((day) => `
          <div class="timeline-day">
            <span class="timeline-date">${formatShortDate(day.date)}</span>
          </div>
        `).join("")}
      </div>
    </div>
    <div class="timeline-table">
      ${journeys.map((journey) => `
        <article class="timeline-card" style="--manager-color:${managerColor(managerById(journey.managerId), journey.managerId)}">
          <span class="timeline-date">#${journey.currentRank || "?"} now</span>
          <strong>${escapeHtml(journey.displayName || journey.managerId)}</strong>
          <span>Best #${journey.bestRank || "?"} · Low #${journey.worstRank || "?"}</span>
          <small>${journey.movement > 0 ? `Up ${journey.movement}` : journey.movement < 0 ? `Down ${Math.abs(journey.movement)}` : "Even"} since ${formatShortDate(firstDay?.date)}</small>
        </article>
      `).join("")}
    </div>
    <div class="timeline-legend">
      ${managers.map((manager) => `
        <span style="--manager-color:${managerColor(managerById(manager.managerId), manager.managerId)}">
          <i></i>${manager.displayName}
        </span>
      `).join("")}
    </div>
  `;
}

function renderProjectedBonuses() {
  const node = $("projected-bonus-grid");
  if (!node) return;

  const rows = rosterManagersInOrder()
    .map((manager) => ({
      ...manager,
      projection: projectedBonusForManager(manager.managerId)
    }))
    .sort((a, b) => {
      if (b.projection.total !== a.projection.total) return b.projection.total - a.projection.total;
      return String(a.displayName || a.managerId).localeCompare(String(b.displayName || b.managerId));
    });

  node.innerHTML = rows.map((row) => {
    const manager = managerById(row.managerId);
    const contributors = row.projection.details.filter((detail) => detail.bonus > 0);
    return `
      <article class="projected-bonus-card" style="--manager-color:${managerColor(manager, row.managerId)}">
        <header>
          <span class="player-swatch"></span>
          <div>
            <h3>${escapeHtml(row.displayName || row.managerId)}</h3>
            <p>${contributors.length} bonus countr${contributors.length === 1 ? "y" : "ies"}</p>
          </div>
          <strong>${formatProjectedBonus(row.projection.total)}</strong>
        </header>
        <div class="projected-bonus-list">
          ${contributors.length ? contributors.map(renderProjectedBonusCountry).join("") : `
            <p class="projected-bonus-empty">No group bonuses.</p>
          `}
        </div>
      </article>
    `;
  }).join("");
}

function renderProjectedBonusCountry(detail) {
  const qualifierLabel = detail.qualificationType === "third" ? "Best 3rd" : detail.rankLabel;
  return `
    <span class="projected-bonus-country">
      <span>${countryFlag(detail.team)} ${escapeHtml(detail.team?.name || detail.teamId)}</span>
      <em>Group ${escapeHtml(detail.group || "-")} · ${qualifierLabel}</em>
      <strong>${formatProjectedBonus(detail.bonus)}</strong>
    </span>
  `;
}

function projectedBonusForManager(managerId) {
  const bonusByTeam = projectedBonusByTeam();
  const details = model.rosters
    .filter((roster) => roster.managerId === managerId)
    .map((roster) => {
      const projection = bonusByTeam.get(roster.teamId) || {};
      const team = teamById(roster.teamId);
      return {
        teamId: roster.teamId,
        team,
        group: team.group,
        bonus: Number(projection.bonus || 0),
        rank: projection.rank || null,
        rankLabel: projection.rank ? `Rank ${projection.rank}` : "No table",
        qualificationType: projection.qualificationType || ""
      };
    })
    .sort((a, b) => {
      if (b.bonus !== a.bonus) return b.bonus - a.bonus;
      return String(a.team?.name || a.teamId).localeCompare(String(b.team?.name || b.teamId));
    });

  return {
    total: details.reduce((sum, detail) => sum + detail.bonus, 0),
    details
  };
}

function projectedBonusByTeam() {
  const bonusByTeam = new Map();
  projectedGroupTables().forEach((table) => {
    table.rows.forEach((row) => {
      const bonus = table.hasStarted
        ? (row.qualifiesForKnockouts ? 0.5 : 0) + (row.rank === 1 ? 1 : 0)
        : 0;
      bonusByTeam.set(row.teamId, {
        bonus,
        rank: table.hasStarted ? row.rank : null,
        qualificationType: table.hasStarted ? row.qualificationType : ""
      });
    });
  });
  return bonusByTeam;
}

function groupBonusFallbackReady() {
  const tables = projectedGroupTables();
  return tables.length > 0 && tables.every((table) => (
    table.rows.length >= 4 && table.rows.every((row) => row.played >= 3)
  ));
}

function projectedGroupTables() {
  const groups = new Map();
  model.teams.forEach((team) => {
    if (!team.group) return;
    if (!groups.has(team.group)) groups.set(team.group, new Map());
    groups.get(team.group).set(team.teamId, groupStandingRow(team));
  });

  model.matches
    .filter((match) => isGroupStageMatch(match) && matchHasStarted(match))
    .forEach((match) => {
      const group = groupForMatch(match);
      if (!group) return;
      if (!groups.has(group)) groups.set(group, new Map());
      const table = groups.get(group);
      if (!table.has(match.homeTeamId)) table.set(match.homeTeamId, groupStandingRow(teamById(match.homeTeamId)));
      if (!table.has(match.awayTeamId)) table.set(match.awayTeamId, groupStandingRow(teamById(match.awayTeamId)));

      applyGroupResult(table.get(match.homeTeamId), matchHomeGoals(match), matchAwayGoals(match));
      applyGroupResult(table.get(match.awayTeamId), matchAwayGoals(match), matchHomeGoals(match));
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
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
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

function projectedWorldCupBracket(tables) {
  const groupRows = new Map(tables.map((table) => [table.group, table.rows]));
  const thirdRows = bestThirdPlaceRows(tables).slice(0, 8);
  const usedThirdGroups = new Set();
  const thirdByGroup = new Map(thirdRows.map((row) => [row.group, row]));
  const matchups = [
    [73, worldCupSeedLabel(groupRows, "A", 2), worldCupSeedLabel(groupRows, "B", 2)],
    [74, worldCupSeedLabel(groupRows, "E", 1), worldCupThirdSeedByGroup("D", thirdByGroup, usedThirdGroups)],
    [75, worldCupSeedLabel(groupRows, "F", 1), worldCupSeedLabel(groupRows, "C", 2)],
    [76, worldCupSeedLabel(groupRows, "C", 1), worldCupSeedLabel(groupRows, "F", 2)],
    [77, worldCupSeedLabel(groupRows, "I", 1), worldCupThirdSeedByGroup("F", thirdByGroup, usedThirdGroups)],
    [78, worldCupSeedLabel(groupRows, "E", 2), worldCupSeedLabel(groupRows, "I", 2)],
    [79, worldCupSeedLabel(groupRows, "A", 1), worldCupThirdSeedByGroup("E", thirdByGroup, usedThirdGroups)],
    [80, worldCupSeedLabel(groupRows, "L", 1), worldCupThirdSeedByGroup("K", thirdByGroup, usedThirdGroups)],
    [81, worldCupSeedLabel(groupRows, "D", 1), worldCupThirdSeedByGroup("B", thirdByGroup, usedThirdGroups)],
    [82, worldCupSeedLabel(groupRows, "G", 1), worldCupThirdSeedByGroup("I", thirdByGroup, usedThirdGroups)],
    [83, worldCupSeedLabel(groupRows, "K", 2), worldCupSeedLabel(groupRows, "L", 2)],
    [84, worldCupSeedLabel(groupRows, "H", 1), worldCupSeedLabel(groupRows, "J", 2)],
    [85, worldCupSeedLabel(groupRows, "B", 1), worldCupThirdSeedByGroup("J", thirdByGroup, usedThirdGroups)],
    [86, worldCupSeedLabel(groupRows, "J", 1), worldCupSeedLabel(groupRows, "H", 2)],
    [87, worldCupSeedLabel(groupRows, "K", 1), worldCupThirdSeedByGroup("L", thirdByGroup, usedThirdGroups)],
    [88, worldCupSeedLabel(groupRows, "D", 2), worldCupSeedLabel(groupRows, "G", 2)]
  ];

  return matchups.map(([matchNumber, home, away]) => ({ matchNumber, stage: "R32", home, away }));
}

function worldCupSeedLabel(groupRows, group, rank) {
  const row = groupRows.get(group)?.find((item) => item.rank === rank);
  const seed = rank === 1 ? "W" : "R";
  return {
    seed: `${seed}${group}`,
    teamId: row?.teamId || "",
    country: row ? (row.team?.name || row.teamId) : `${seed}${group}`
  };
}

function worldCupThirdSeedLabel(eligibleGroups, thirdByGroup, usedThirdGroups) {
  const group = eligibleGroups.find((candidate) => thirdByGroup.has(candidate) && !usedThirdGroups.has(candidate));
  if (!group) {
    return {
      seed: `3rd ${eligibleGroups.join("/")}`,
      teamId: "",
      country: `3rd ${eligibleGroups.join("/")}`
    };
  }
  usedThirdGroups.add(group);
  const row = thirdByGroup.get(group);
  return {
    seed: `3${group}`,
    teamId: row?.teamId || "",
    country: row ? (row.team?.name || row.teamId) : `3${group}`
  };
}

function worldCupThirdSeedByGroup(group, thirdByGroup, usedThirdGroups) {
  const row = thirdByGroup.get(group);
  usedThirdGroups.add(group);
  return {
    seed: `3${group}`,
    teamId: row?.teamId || "",
    country: row ? (row.team?.name || row.teamId) : `3${group}`
  };
}

function isGroupStageMatch(match) {
  return String(match.stage || "").toLowerCase() === "group" || Boolean(match.group);
}

function formatProjectedBonus(value) {
  return `${Number(value || 0) > 0 ? "+" : ""}${fmt(value)}`;
}

function groupPlaceLabel(teamId) {
  const team = teamById(teamId);
  if (!team.group) return "Group TBD";
  const table = projectedGroupTables().find((groupTable) => groupTable.group === team.group);
  const row = table?.rows.find((item) => item.teamId === teamId);
  return row?.rank ? `${ordinal(row.rank)} in Group ${team.group}` : `Group ${team.group}`;
}

function ordinal(value) {
  const numberValue = Number(value || 0);
  const suffix = numberValue % 100 >= 11 && numberValue % 100 <= 13
    ? "th"
    : { 1: "st", 2: "nd", 3: "rd" }[numberValue % 10] || "th";
  return `${numberValue}${suffix}`;
}

function formatShortDate(value) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value || "TBD";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function prettyStatus(status) {
  if (!status) return "TBD";
  return status.replaceAll("_", " ");
}

function formatMatchStatusLabel(match) {
  const status = String(match.status || "scheduled").toLowerCase();
  if (isLiveMatch(match)) {
    const minute = approximateLiveMatchMinute(match);
    return minute ? `Live - ${minute}${minute === "HT" ? "" : "m"}` : "Live";
  }
  if (status === "scheduled") {
    return formatPacificKickoffTime(match);
  }
  return prettyStatus(match.status);
}

function formatPacificKickoffTime(match) {
  const date = new Date(match.kickoffUtc || "");
  if (Number.isNaN(date.getTime())) return "TBD";
  return `${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles"
  })} PST`;
}

function approximateLiveMatchMinute(match) {
  const kickoff = Date.parse(match.kickoffUtc || "");
  if (Number.isNaN(kickoff)) return null;

  const status = String(match.status || "").toLowerCase();
  if (status === "halftime" || status === "half_time") return "HT";

  const elapsedMinutes = Math.floor((Date.now() - kickoff) / 60000);
  if (elapsedMinutes <= 0) return null;

  const estimatedMatchMinute = elapsedMinutes > 60 ? elapsedMinutes - 15 : elapsedMinutes;
  return Math.min(Math.max(estimatedMatchMinute, 1), 120);
}

function matchStatusClass(status) {
  const value = String(status || "scheduled").toLowerCase();
  if (["live", "in_progress", "playing", "halftime", "half_time"].includes(value)) return "live";
  if (value === "final" || value === "finished" || value === "complete") return "final";
  if (value === "scheduled") return "scheduled";
  return "scheduled";
}
