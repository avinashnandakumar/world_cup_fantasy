const draftPaths = {
  snapshot: window.WORLD_CUP_CONFIG?.snapshotUrl || "./sample-data/dashboard-snapshot-8.json",
  league: "./sample-data/simulated-league-8.json",
  teams: "./sample-data/simulated-teams-48.json",
  ledger: "./sample-data/simulated-scoring-ledger-8.json"
};

const draftManagerColors = [
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

const draftFlags = {
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

let draftModel = {
  meta: {},
  managers: [],
  rosters: [],
  teams: [],
  ledger: [],
  standings: []
};

const $draft = (id) => document.getElementById(id);
const money = (value) => `$${Number(value || 0).toFixed(0)}`;
const points = (value) => Number(value || 0).toFixed(Number(value || 0) % 1 === 0 ? 0 : 2);

initDraftPage();

async function initDraftPage() {
  draftModel = await loadDraftModel();
  renderDraftPage();
}

async function loadDraftJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

async function loadDraftModel() {
  try {
    const snapshot = await loadDraftJson(draftPaths.snapshot);
    if (snapshot.meta && Array.isArray(snapshot.rosters)) {
      return normalizeDraftSnapshot(snapshot);
    }

    const [league, teams, ledger] = await Promise.all([
      loadDraftJson(draftPaths.league),
      loadDraftJson(draftPaths.teams),
      loadDraftJson(draftPaths.ledger)
    ]);

    return {
      meta: {
        leagueName: snapshot.data?.league?.name || league.league?.name || "World Cup Fantasy",
        generatedAt: snapshot.generatedAt || new Date().toISOString()
      },
      managers: league.managers || [],
      rosters: league.rosters || [],
      teams: teams.teams || [],
      ledger: ledger.ledger || [],
      standings: snapshot.data?.standings || []
    };
  } catch (error) {
    return {
      meta: { leagueName: "World Cup Fantasy", generatedAt: new Date().toISOString() },
      managers: [],
      rosters: [],
      teams: [],
      ledger: [],
      standings: []
    };
  }
}

function normalizeDraftSnapshot(snapshot) {
  return {
    meta: {
      leagueName: snapshot.meta?.leagueName || "World Cup Fantasy",
      generatedAt: snapshot.meta?.generatedAtUtc || new Date().toISOString(),
      lastExternalSyncAtUtc: snapshot.meta?.lastExternalSyncAtUtc || ""
    },
    managers: (snapshot.managers || []).map((manager) => ({
      managerId: manager.managerId,
      displayName: manager.displayName || manager.managerId,
      color: manager.color || "",
      colorToken: manager.colorToken || ""
    })),
    rosters: snapshot.rosters || [],
    teams: (snapshot.teams || []).map((team) => ({
      teamId: team.teamId,
      name: team.countryName || team.name || team.teamId,
      group: team.group || "",
      flagEmoji: team.flagEmoji || "",
      status: String(team.status || "scheduled").toLowerCase()
    })),
    ledger: snapshot.ledger || [],
    standings: snapshot.standings || []
  };
}

function renderDraftPage() {
  const rows = draftRows();
  const managers = managerDraftSummaries(rows);
  renderDraftUpdated();
  renderDraftSummary(rows, managers);
  renderPowerRankings(managers);
  renderDraftHighlights(rows, managers);
  renderDraftRosters(managers);
  renderDraftBoard(rows);
}

function renderDraftUpdated() {
  const value = draftModel.meta.lastExternalSyncAtUtc || draftModel.meta.generatedAt;
  const date = value ? new Date(value) : new Date();
  const label = Number.isNaN(date.getTime())
    ? "Updated"
    : `Updated ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  $draft("draft-updated").innerHTML = `<span></span> ${label}`;
}

function renderDraftSummary(rows, managers) {
  const topPrice = rows.reduce((best, row) => row.price > best.price ? row : best, { price: 0 });
  $draft("draft-manager-count").textContent = String(managers.length);
  $draft("draft-country-count").textContent = String(rows.length);
  $draft("draft-total-spend").textContent = money(rows.reduce((sum, row) => sum + row.price, 0));
  $draft("draft-top-price").textContent = topPrice.team ? `${money(topPrice.price)} ${topPrice.team.name}` : "-";
}

function renderPowerRankings(managers) {
  const maxScore = Math.max(...managers.map((manager) => manager.powerScore), 1);
  $draft("power-rankings").innerHTML = managers.map((manager, index) => `
    <article class="power-card" style="--manager-color:${manager.color}; --power-width:${Math.max(8, (manager.powerScore / maxScore) * 100)}%">
      <div class="power-rank">#${index + 1}</div>
      <div class="power-main">
        <div class="power-title-row">
          <span class="player-swatch"></span>
          <h3>${escapeDraftHtml(manager.displayName)}</h3>
        </div>
        <div class="power-bar" aria-hidden="true"><span></span></div>
        <div class="power-meta">
          <span>${points(manager.powerScore)} power</span>
          <span>${money(manager.spend)} spent</span>
          <span>${points(manager.currentPoints)} live pts</span>
        </div>
      </div>
      <div class="power-roster-flags" aria-label="${escapeDraftHtml(manager.displayName)} countries">
        ${manager.rows.map((row) => `<span title="${escapeDraftHtml(row.team.name)}">${countryFlag(row.team)}</span>`).join("")}
      </div>
    </article>
  `).join("") || emptyDraftState("No draft results found yet.") ;
}

function renderDraftHighlights(rows, managers) {
  const topPrice = rows.reduce((best, row) => row.price > best.price ? row : best, rows[0] || null);
  const strongestRoster = managers[0] || null;
  const bestCurrentValue = rows
    .filter((row) => row.currentPoints > 0 && row.price > 0)
    .sort((a, b) => (b.currentPoints / b.price) - (a.currentPoints / a.price))[0];
  const bestFreePick = rows
    .filter((row) => row.price === 0)
    .sort((a, b) => b.currentPoints - a.currentPoints)[0];
  const premiumStack = [...managers]
    .sort((a, b) => b.premiumCount - a.premiumCount || b.spend - a.spend)[0];

  const highlights = [
    topPrice && {
      label: "Most Expensive",
      value: `${countryFlag(topPrice.team)} ${topPrice.team.name}`,
      detail: `${money(topPrice.price)} by ${topPrice.manager.displayName}`
    },
    strongestRoster && {
      label: "Draft Favorite",
      value: strongestRoster.displayName,
      detail: `${points(strongestRoster.powerScore)} initial power with ${money(strongestRoster.spend)} spent`
    },
    bestCurrentValue && {
      label: "Best Paid Return",
      value: `${countryFlag(bestCurrentValue.team)} ${bestCurrentValue.team.name}`,
      detail: `${points(bestCurrentValue.currentPoints)} pts from ${money(bestCurrentValue.price)}`
    },
    bestFreePick && {
      label: "Best Free Pick",
      value: `${countryFlag(bestFreePick.team)} ${bestFreePick.team.name}`,
      detail: `${points(bestFreePick.currentPoints)} pts for ${bestFreePick.manager.displayName}`
    },
    premiumStack && {
      label: "Premium Stack",
      value: premiumStack.displayName,
      detail: `${premiumStack.premiumCount} live-auction countr${premiumStack.premiumCount === 1 ? "y" : "ies"}`
    }
  ].filter(Boolean);

  $draft("draft-highlights").innerHTML = highlights.map((item) => `
    <article class="draft-highlight-card">
      <span>${escapeDraftHtml(item.label)}</span>
      <strong>${escapeDraftHtml(item.value)}</strong>
      <p>${escapeDraftHtml(item.detail)}</p>
    </article>
  `).join("") || emptyDraftState("Draft highlights will appear after rosters load.");
}

function renderDraftRosters(managers) {
  $draft("draft-rosters").innerHTML = managers.map((manager) => `
    <article class="draft-roster-card" style="--manager-color:${manager.color}">
      <header>
        <span class="player-swatch"></span>
        <div>
          <h3>${escapeDraftHtml(manager.displayName)}</h3>
          <p>${money(manager.spend)} spent · ${points(manager.currentPoints)} current pts</p>
        </div>
        <strong>${points(manager.powerScore)}</strong>
      </header>
      <div class="draft-roster-picks">
        ${manager.rows.map((row) => `
          <div class="draft-roster-pick">
            <span class="flag-square flag-emoji">${countryFlag(row.team)}</span>
            <span>
              <strong>${escapeDraftHtml(row.team.name)}</strong>
              <em>Pick ${row.pick || "-"} · ${escapeDraftHtml(formatPhase(row.phase))}</em>
            </span>
            <b>${money(row.price)}</b>
          </div>
        `).join("")}
      </div>
    </article>
  `).join("") || emptyDraftState("No manager rosters found.");
}

function renderDraftBoard(rows) {
  $draft("draft-board-body").innerHTML = rows.map((row) => `
    <tr style="--manager-color:${row.managerColor}">
      <td data-label="Pick"><span class="rank-cell">${row.pick || "-"}</span></td>
      <td data-label="Country">
        <span class="draft-country-cell">
          <span class="flag-square flag-emoji">${countryFlag(row.team)}</span>
          <span>
            <strong>${escapeDraftHtml(row.team.name)}</strong>
            <em>Group ${escapeDraftHtml(row.team.group || "-")}</em>
          </span>
        </span>
      </td>
      <td data-label="Manager">
        <span class="player-cell"><span class="player-swatch"></span><strong>${escapeDraftHtml(row.manager.displayName)}</strong></span>
      </td>
      <td data-label="Phase">${escapeDraftHtml(formatPhase(row.phase))}</td>
      <td data-label="Price">${money(row.price)}</td>
      <td data-label="Current Pts">${points(row.currentPoints)}</td>
    </tr>
  `).join("");
}

function draftRows() {
  return [...draftModel.rosters]
    .map((roster, index) => {
      const manager = managerById(roster.managerId);
      const team = teamById(roster.teamId);
      const notes = String(roster.notes || "");
      const price = priceFromRoster(roster);
      const phase = phaseFromRoster(roster);
      const pick = Number(roster.draftSlot || roster.draftPick || index + 1);
      return {
        roster,
        manager,
        team,
        notes,
        price,
        phase,
        pick,
        currentPoints: currentPointsForTeam(roster.managerId, roster.teamId),
        managerColor: managerColor(manager, roster.managerId),
        teamPower: teamDraftPower({ price, phase, pick })
      };
    })
    .sort((a, b) => a.pick - b.pick);
}

function managerDraftSummaries(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    if (!grouped.has(row.manager.managerId)) {
      grouped.set(row.manager.managerId, {
        managerId: row.manager.managerId,
        displayName: row.manager.displayName,
        color: row.managerColor,
        rows: [],
        spend: 0,
        currentPoints: currentPointsForManager(row.manager.managerId),
        powerScore: 0,
        premiumCount: 0
      });
    }
    const summary = grouped.get(row.manager.managerId);
    summary.rows.push(row);
    summary.spend += row.price;
    summary.powerScore += row.teamPower;
    summary.premiumCount += row.phase === "live" ? 1 : 0;
  });

  return [...grouped.values()]
    .map((summary) => ({
      ...summary,
      rows: summary.rows.sort((a, b) => a.pick - b.pick)
    }))
    .sort((a, b) => b.powerScore - a.powerScore || b.spend - a.spend || a.displayName.localeCompare(b.displayName));
}

function teamDraftPower(row) {
  const maxPick = Math.max(draftModel.rosters.length, 48);
  const pickValue = Math.max(0, maxPick + 1 - Number(row.pick || maxPick));
  const phaseBonus = row.phase === "live" ? 14 : row.phase === "sealed" ? 7 : 1;
  return pickValue + Number(row.price || 0) + phaseBonus;
}

function priceFromRoster(roster) {
  if (roster.price !== undefined && roster.price !== "") return Number(roster.price || 0);
  const match = String(roster.notes || "").match(/price\s*=\s*(-?\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : 0;
}

function phaseFromRoster(roster) {
  const source = `${roster.acquisitionType || ""} ${roster.notes || ""}`.toLowerCase();
  if (source.includes("sealed")) return "sealed";
  if (source.includes("snake")) return "snake";
  if (source.includes("live")) return "live";
  return roster.acquisitionType || "draft";
}

function currentPointsForTeam(managerId, teamId) {
  return draftModel.ledger
    .filter((row) => row.managerId === managerId && row.teamId === teamId)
    .reduce((sum, row) => sum + Number(row.points || 0), 0);
}

function currentPointsForManager(managerId) {
  const standing = draftModel.standings.find((row) => row.managerId === managerId);
  if (standing) return Number(standing.totalPoints || 0);
  return draftModel.ledger
    .filter((row) => row.managerId === managerId)
    .reduce((sum, row) => sum + Number(row.points || 0), 0);
}

function managerById(managerId) {
  const index = draftModel.managers.findIndex((manager) => manager.managerId === managerId);
  const manager = draftModel.managers[index] || {};
  return {
    managerId,
    displayName: manager.displayName || managerId,
    color: manager.color || draftManagerColors[Math.max(0, index) % draftManagerColors.length],
    colorToken: manager.colorToken || ""
  };
}

function teamById(teamId) {
  const team = draftModel.teams.find((item) => item.teamId === teamId) || {};
  return {
    teamId,
    name: team.countryName || team.name || teamId,
    group: team.group || "",
    flagEmoji: team.flagEmoji || ""
  };
}

function managerColor(manager, managerId) {
  if (manager.color) return manager.color;
  const index = draftModel.managers.findIndex((item) => item.managerId === managerId);
  return draftManagerColors[Math.max(0, index) % draftManagerColors.length];
}

function countryFlag(team) {
  return team?.flagEmoji || draftFlags[team?.teamId] || String(team?.name || team?.teamId || "WC").slice(0, 2).toUpperCase();
}

function formatPhase(phase) {
  const normalized = String(phase || "draft").toLowerCase();
  if (normalized === "live") return "Live";
  if (normalized === "sealed") return "Sealed";
  if (normalized === "snake") return "Snake";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function emptyDraftState(message) {
  return `<div class="draft-empty">${escapeDraftHtml(message)}</div>`;
}

function escapeDraftHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
