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
let typingIndex = 0;
let charIndex = 0;
let typingDeleting = false;
let typingHold = 0;

const $ = (id) => document.getElementById(id);
const fmt = (value) => Number(value || 0).toFixed(Number(value || 0) % 1 === 0 ? 0 : 2);

init();

async function init() {
  setupRefreshButton();
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
      teams: teams.teams || [],
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
    teams: (snapshot.teams || []).map((team) => ({
      teamId: team.teamId,
      name: team.countryName || team.name || team.teamId,
      flagEmoji: team.flagEmoji || "",
      shortName: team.flagEmoji || countryFlags[team.teamId] || (team.countryName || team.teamId || "WC").slice(0, 3).toUpperCase(),
      group: team.group,
      status: String(team.status || "scheduled").toLowerCase(),
      qualifiedForKnockouts: team.qualifiedForKnockouts === true || team.qualifiedForKnockouts === "TRUE",
      wonGroup: team.wonGroup === true || team.wonGroup === "TRUE"
    })),
    matches: (snapshot.matches || []).map((match) => ({
      matchId: match.matchId,
      stage: match.stage,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeGoals: Number(match.homeScore || 0),
      awayGoals: Number(match.awayScore || 0),
      status: match.status || "scheduled",
      kickoffUtc: match.kickoffUtc || ""
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
  renderRoasts();
  renderPointsTimeline();
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
  const sorted = sortedStandings();
  const rankMovement = rankMovementByManager();
  $("standings-body").innerHTML = sorted.map((standing) => {
    const manager = managerById(standing.managerId);
    const totals = categoryTotalsForManager(standing.managerId);
    const gamesPlayed = gamesPlayedForManager(standing.managerId);
    const movement = rankMovement[standing.managerId];

    return `
      <tr style="--manager-color:${managerColor(manager, standing.managerId)}">
        <td data-label="Rank"><span class="rank-cell">${standing.rank}</span></td>
        <td>
          <span class="player-cell">
            <span class="player-swatch"></span>
            <span class="player-name-row">
              <strong class="player-name">${standing.displayName}</strong>
              ${renderRankMovementBadge(movement)}
            </span>
          </span>
        </td>
        <td data-label="GP">${gamesPlayed}</td>
        <td data-label="Total" class="total-points">${fmt(standing.totalPoints)}</td>
        <td data-label="Wins">${fmt(totals.wins)}</td>
        <td data-label="Goals">${fmt(totals.goals)}</td>
        <td data-label="Defense" class="${totals.defense < 0 ? "negative" : ""}">${fmt(totals.defense)}</td>
        <td data-label="Bonuses">${fmt(totals.bonuses)}</td>
        <td data-label="Cards" class="${totals.cards < 0 ? "negative" : ""}">${fmt(totals.cards)}</td>
        <td class="mobile-standings-strip-cell" aria-label="Standings stat summary">
          <span class="mobile-standings-strip">
            <span class="stat-chip"><span>GP</span>${gamesPlayed}</span>
            <span class="stat-chip"><span>W</span>${fmt(totals.wins)}</span>
            <span class="stat-chip"><span>G</span>${fmt(totals.goals)}</span>
            <span class="stat-chip ${totals.defense < 0 ? "negative" : ""}"><span>DEF</span>${fmt(totals.defense)}</span>
            <span class="stat-chip"><span>B</span>${fmt(totals.bonuses)}</span>
            <span class="stat-chip ${totals.cards < 0 ? "negative" : ""}"><span>C</span>${fmt(totals.cards)}</span>
          </span>
        </td>
      </tr>
    `;
  }).join("");
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
  const managerRows = rosterManagersInOrder();
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
      <article class="roster-card" style="--manager-color:${managerColor(manager, managerId)}">
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

function renderRosterCountryDetails(managerId, roster, team, points) {
  const matches = matchesForTeam(roster.teamId);
  const nextMatch = nextScheduledMatchForTeam(roster.teamId);
  const nextMatchLabel = nextMatch ? `Next ${formatUpcomingMatchLabel(nextMatch)}` : "No upcoming matches";
  return `
    <details class="roster-country-detail">
      <summary class="roster-country-row">
        <span class="country-expand-icon" aria-hidden="true"></span>
        <span class="flag-square flag-emoji">${countryFlag(team)}</span>
        <span class="roster-country-name">
          <strong>${team?.name || roster.teamId}</strong>
          <span>Group ${team?.group || "-"} · ${nextMatchLabel}</span>
        </span>
        <strong class="country-point-number">${fmt(points)}</strong>
      </summary>
      <div class="country-match-list">
        ${matches.map((match) => renderCountryMatchRow(managerId, roster.teamId, match)).join("") || `
          <p class="country-meta">No matches scheduled yet.</p>
        `}
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
        <strong>Roast Bot is warming up.</strong>
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
        <strong>${escapeHtml(severity)}</strong>
      </div>
      <p>${escapeHtml(roast.text)}</p>
      <div class="roast-evidence">
        <span>${escapeHtml(roast.evidence || "Fantasy evidence pending")}</span>
        <time>${escapeHtml(formatRoastTime(roast.generatedAtUtc))}</time>
      </div>
    </article>
  `;
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
  return roast.targetId || "Roast Bot";
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
  const status = String(match.status || "scheduled").toLowerCase();
  const hasStarted = matchHasStarted(match);
  const showHoldProjection = options.showHoldProjection && isLiveMatch(match);

  return `
    <article class="match-card">
      <div class="match-stage">
        <span>${formatMatchDate(match)}</span>
        <span class="match-status match-status-${matchStatusClass(match.status)}">${prettyStatus(match.status)}</span>
      </div>
      <div class="score-row">
        <span>${countryFlag(home)} ${home?.name || match.homeTeamId || "Home"}</span>
        <strong>${hasStarted ? `${match.homeGoals} - ${match.awayGoals}` : "TBD"}</strong>
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

  return model.matches.filter((match) => {
    if (!matchHasStarted(match)) return false;
    return ownedTeams.has(match.homeTeamId) || ownedTeams.has(match.awayTeamId);
  }).length;
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

function liveFantasyPointsForTeam(match, teamId) {
  const isHome = teamId === match.homeTeamId;
  const goalsFor = Number(isHome ? match.homeGoals : match.awayGoals) || 0;
  const goalsAgainst = Number(isHome ? match.awayGoals : match.homeGoals) || 0;
  return (goalsFor * 0.5) + (goalsAgainst * -0.25);
}

function holdProjectionPointsForTeam(match, teamId) {
  const isHome = teamId === match.homeTeamId;
  const goalsFor = Number(isHome ? match.homeGoals : match.awayGoals) || 0;
  const goalsAgainst = Number(isHome ? match.awayGoals : match.homeGoals) || 0;
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
  const goalsFor = Number(isHome ? match.homeGoals : match.awayGoals) || 0;
  const goalsAgainst = Number(isHome ? match.awayGoals : match.homeGoals) || 0;
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
  const score = hasStarted ? `${Number(match.homeGoals || 0)}-${Number(match.awayGoals || 0)}` : "TBD";
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

function summarizeRows(rows) {
  return rows.reduce((totals, row) => {
    const points = Number(row.points || 0);
    if (row.category === "win") totals.wins += points;
    else if (row.category === "goal_scored") totals.goals += points;
    else if (row.category === "goal_allowed" || row.category === "clean_sheet") totals.defense += points;
    else if (row.category === "red_card") totals.cards += points;
    else if (["group_draw", "qualify_knockouts", "win_group", "champion"].includes(row.category)) totals.bonuses += points;
    return totals;
  }, { wins: 0, goals: 0, defense: 0, bonuses: 0, cards: 0 });
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

function renderPointsTimeline() {
  const timeline = buildDailyCumulativeTotals();
  const managers = rosterManagersInOrder();
  const firstDay = timeline[0];
  const latestDay = timeline[timeline.length - 1];
  const latestLeader = latestDay?.leader;
  const biggestMove = latestDay?.values
    .map((value) => {
      const previous = firstDay?.values.find((item) => item.managerId === value.managerId);
      return {
        displayName: value.displayName,
        delta: Math.round((value.total - (previous?.total || 0)) * 100) / 100
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  const allTotals = timeline.flatMap((day) => day.values.map((value) => value.total));
  const minTotal = Math.min(0, ...allTotals);
  const maxTotal = Math.max(1, ...allTotals);
  const range = Math.max(1, maxTotal - minTotal);
  const width = 100;
  const height = 100;
  const pointsFor = (managerId) => timeline.map((day, dayIndex) => {
    const value = day.values.find((item) => item.managerId === managerId);
    const x = timeline.length === 1 ? width / 2 : (dayIndex / (timeline.length - 1)) * width;
    const y = height - (((value?.total || 0) - minTotal) / range) * height;
    return { x, y, total: value?.total || 0 };
  });

  $("points-timeline").innerHTML = `
    <div class="timeline-mobile-summary">
      <article>
        <span>Latest leader</span>
        <strong>${latestLeader?.displayName || "No leader"}</strong>
        <em>${fmt(latestLeader?.total || 0)} pts</em>
      </article>
      <article>
        <span>Biggest move</span>
        <strong>${biggestMove?.displayName || "No movement"}</strong>
        <em>${biggestMove ? `${Number(biggestMove.delta) > 0 ? "+" : ""}${fmt(biggestMove.delta)} pts` : "0 pts"}</em>
      </article>
      <article>
        <span>Updated</span>
        <strong>${formatShortDate(latestDay?.date)}</strong>
        <em>${timeline.length} day${timeline.length === 1 ? "" : "s"}</em>
      </article>
    </div>
    <div class="timeline-scroll">
      <div class="timeline-chart" style="--timeline-days:${timeline.length}">
        <svg class="timeline-plot" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
          ${managers.map((manager) => {
            const points = pointsFor(manager.managerId);
            const linePoints = points.length === 1
              ? [{ ...points[0], x: 8 }, { ...points[0], x: 92 }]
              : points;
            const color = managerColor(managerById(manager.managerId), manager.managerId);
            return `
              <polyline points="${linePoints.map((point) => `${point.x},${point.y}`).join(" ")}" stroke="${color}" />
              ${points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="1.4" fill="${color}" />`).join("")}
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
      ${timeline.map((day) => `
        <article class="timeline-card">
          <span class="timeline-date">${formatShortDate(day.date)}</span>
          <strong>${day.leader?.displayName || "No leader"}</strong>
          <span>${fmt(day.leader?.total || 0)} pts</span>
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

function formatShortDate(value) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value || "TBD";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function prettyStatus(status) {
  if (!status) return "TBD";
  return status.replaceAll("_", " ");
}

function matchStatusClass(status) {
  const value = String(status || "scheduled").toLowerCase();
  if (["live", "in_progress", "playing", "halftime", "half_time"].includes(value)) return "live";
  if (value === "final" || value === "finished" || value === "complete") return "final";
  if (value === "scheduled") return "scheduled";
  return "scheduled";
}
