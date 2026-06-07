const paths = {
  snapshot: "../../sample-data/dashboard-snapshot-8.json",
  league: "../../sample-data/simulated-league-8.json",
  teams: "../../sample-data/simulated-teams-48.json",
  matches: "../../sample-data/simulated-matches.json",
  ledger: "../../sample-data/simulated-scoring-ledger-8.json"
};

const managerColors = {
  blue: "#2878ff",
  red: "#e54b4b",
  gold: "#e0a72f",
  green: "#18a566",
  purple: "#7957ff",
  silver: "#88929e",
  orange: "#f17628",
  black: "#121820"
};

const flagPalettes = [
  ["#1f8b4c", "#ffffff", "#d33131"],
  ["#123f8c", "#ffffff", "#e33b35"],
  ["#f4c542", "#0d703f", "#183b80"],
  ["#d81f2a", "#ffffff", "#117a47"],
  ["#0f5faf", "#f6d04d", "#e53e3e"],
  ["#202020", "#f0c45c", "#0c7b52"],
  ["#0a7f66", "#ffffff", "#e8542e"],
  ["#3b62ff", "#ffffff", "#0a1b33"]
];

const fallback = {
  meta: { leagueName: "World Cup Fantasy", generatedAt: new Date().toISOString(), phase: "Simulated table" },
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
  ledger: []
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
  model = await loadModel();
  selectedManagerId = model.standings[0]?.managerId || model.managers[0]?.managerId;
  render();
  startTyping();
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

async function loadModel() {
  try {
    const [snapshot, league, teams, matches, ledger] = await Promise.all([
      loadJson(paths.snapshot),
      loadJson(paths.league),
      loadJson(paths.teams),
      loadJson(paths.matches),
      loadJson(paths.ledger)
    ]);

    return {
      meta: {
        leagueName: snapshot.data?.league?.name || league.league?.name || "World Cup Fantasy",
        generatedAt: snapshot.generatedAt,
        phase: snapshot.data?.league?.currentPhase || "Live table"
      },
      standings: snapshot.data?.standings || [],
      managers: league.managers || [],
      rosters: league.rosters || [],
      teams: teams.teams || [],
      matches: matches.matches || [],
      ledger: ledger.ledger || []
    };
  } catch (error) {
    return fallback;
  }
}

function render() {
  renderUpdated();
  renderStandings();
  renderFlags();
  renderManagerSelect();
  renderCountryBreakdown();
  renderMatches();
}

function renderUpdated() {
  const date = model.meta.generatedAt ? new Date(model.meta.generatedAt) : new Date();
  $("last-updated").textContent = `${model.meta.phase.replaceAll("_", " ")} · ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function renderStandings() {
  const sorted = sortedStandings();
  $("standings-body").innerHTML = sorted.map((standing) => {
    const manager = managerById(standing.managerId);
    const totals = categoryTotalsForManager(standing.managerId);
    const rosterCount = model.rosters.filter((roster) => roster.managerId === standing.managerId).length || 6;

    return `
      <tr style="--manager-color:${managerColor(manager)}">
        <td data-label="Rank"><span class="rank-cell">${standing.rank}</span></td>
        <td>
          <span class="player-cell">
            <span class="player-swatch"></span>
            <span>
              <strong class="player-name">${standing.displayName}</strong>
              <span class="player-sub">${rosterCount} countries drafted</span>
            </span>
          </span>
        </td>
        <td data-label="Total" class="total-points">${fmt(standing.totalPoints)}</td>
        <td data-label="Wins">${fmt(totals.wins)}</td>
        <td data-label="Goals">${fmt(totals.goals)}</td>
        <td data-label="Defense" class="${totals.defense < 0 ? "negative" : ""}">${fmt(totals.defense)}</td>
        <td data-label="Bonuses">${fmt(totals.bonuses)}</td>
        <td data-label="Cards" class="${totals.cards < 0 ? "negative" : ""}">${fmt(totals.cards)}</td>
      </tr>
    `;
  }).join("");
}

function renderFlags() {
  const topTeams = topTeamTotals().slice(0, 18);
  $("flag-ribbon").innerHTML = topTeams.map(({ team, points }, index) => `
    <span class="flag-chip">
      <span class="flag-square" style="${flagStyle(index)}">${team.shortName || team.name?.slice(0, 3) || "WC"}</span>
      ${team.name || "Country"} · ${fmt(points)}
    </span>
  `).join("");
}

function renderManagerSelect() {
  $("manager-select").innerHTML = sortedStandings().map((standing) => `
    <option value="${standing.managerId}">${standing.displayName}</option>
  `).join("");
  $("manager-select").value = selectedManagerId;
  $("manager-select").addEventListener("change", (event) => {
    selectedManagerId = event.target.value;
    renderCountryBreakdown();
  });
}

function renderCountryBreakdown() {
  const rosters = model.rosters.filter((roster) => roster.managerId === selectedManagerId).slice(0, 6);
  const manager = managerById(selectedManagerId);
  $("country-breakdown").innerHTML = rosters.map((roster, index) => {
    const team = teamById(roster.teamId);
    const totals = categoryTotalsForTeam(roster.teamId);
    const total = Object.values(totals).reduce((sum, points) => sum + points, 0);
    return `
      <article class="country-card" style="--manager-color:${managerColor(manager)}; ${flagStyle(index)}">
        <div class="country-top">
          <span class="flag-square">${team?.shortName || "WC"}</span>
          <strong>${fmt(total)} pts</strong>
        </div>
        <h3>${team?.name || roster.teamId}</h3>
        <p class="country-meta">Group ${team?.group || "-"} · ${prettyStatus(team?.status)}</p>
        <div class="mini-stats">
          <span>Wins <strong>${fmt(totals.wins)}</strong></span>
          <span>Goals <strong>${fmt(totals.goals)}</strong></span>
          <span>Defense <strong>${fmt(totals.defense)}</strong></span>
          <span>Bonus <strong>${fmt(totals.bonuses)}</strong></span>
        </div>
      </article>
    `;
  }).join("");
}

function renderMatches() {
  const matches = [...model.matches].reverse().slice(0, 3);
  $("match-strip").innerHTML = matches.map((match) => {
    const home = teamById(match.homeTeamId);
    const away = teamById(match.awayTeamId);
    const rows = model.ledger.filter((row) => row.matchId === match.matchId);
    const managerImpact = rows.reduce((acc, row) => {
      acc[row.managerId] = (acc[row.managerId] || 0) + Number(row.points || 0);
      return acc;
    }, {});
    const topImpact = Object.entries(managerImpact).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
    const impactManager = topImpact ? managerById(topImpact[0])?.displayName : "No fantasy swing";
    const impactPoints = topImpact ? fmt(topImpact[1]) : "0";

    return `
      <article class="match-card">
        <div class="match-stage">
          <span>${match.stage}</span>
          <span>${match.status}</span>
        </div>
        <div class="score-row">
          <span>${home?.shortName || "HOME"}</span>
          <strong>${match.homeGoals} - ${match.awayGoals}</strong>
          <span>${away?.shortName || "AWAY"}</span>
        </div>
        <p class="match-impact">${impactManager}: ${Number(impactPoints) > 0 ? "+" : ""}${impactPoints} fantasy pts</p>
      </article>
    `;
  }).join("");
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
  const sorted = sortedStandings();
  const leader = sorted[0];
  const second = sorted[1];
  const gap = leader && second ? fmt(leader.totalPoints - second.totalPoints) : "0";
  return [
    `${leader?.displayName || "The leader"} lead by ${gap} point${Number(gap) === 1 ? "" : "s"}`,
    "Every goal moves the table",
    "Country points roll up to player glory",
    "Live games stay calm, standings stay loud"
  ];
}

function sortedStandings() {
  return [...model.standings].sort((a, b) => Number(a.rank) - Number(b.rank));
}

function managerById(managerId) {
  return model.managers.find((manager) => manager.managerId === managerId) || {};
}

function teamById(teamId) {
  return model.teams.find((team) => team.teamId === teamId) || {};
}

function managerColor(manager) {
  return managerColors[manager?.colorToken] || "#18a566";
}

function categoryTotalsForManager(managerId) {
  return summarizeRows(model.ledger.filter((row) => row.managerId === managerId));
}

function categoryTotalsForTeam(teamId) {
  return summarizeRows(model.ledger.filter((row) => row.teamId === teamId));
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

function flagStyle(index) {
  const colors = flagPalettes[index % flagPalettes.length];
  return `--flag-a:${colors[0]}; --flag-b:${colors[1]}; --flag-c:${colors[2]};`;
}

function prettyStatus(status) {
  if (!status) return "TBD";
  return status.replaceAll("_", " ");
}
