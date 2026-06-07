const fallback = {
  snapshot: {
    data: {
      league: { name: "Simulated 8-Manager League", currentPhase: "FINAL_COMPLETE" },
      standings: [
        { rank: 1, managerId: "mgr-black-arrows", displayName: "Black Arrows", totalPoints: 7.75, championOwned: true },
        { rank: 2, managerId: "mgr-blue-comets", displayName: "Blue Comets", totalPoints: 6.75, championOwned: false },
        { rank: 3, managerId: "mgr-orange-crush", displayName: "Orange Crush", totalPoints: 3.5, championOwned: false },
        { rank: 4, managerId: "mgr-golden-boots", displayName: "Golden Boots", totalPoints: 1.5, championOwned: false }
      ]
    },
    dataHealth: { status: "fresh", message: "Fallback concept data" }
  },
  league: {
    managers: [
      { managerId: "mgr-black-arrows", displayName: "Black Arrows", shortName: "Arrows", colorToken: "black" },
      { managerId: "mgr-blue-comets", displayName: "Blue Comets", shortName: "Comets", colorToken: "blue" },
      { managerId: "mgr-orange-crush", displayName: "Orange Crush", shortName: "Crush", colorToken: "orange" },
      { managerId: "mgr-golden-boots", displayName: "Golden Boots", shortName: "Boots", colorToken: "gold" }
    ],
    rosters: [
      { managerId: "mgr-black-arrows", teamId: "team-ionia" },
      { managerId: "mgr-black-arrows", teamId: "team-hibernia" },
      { managerId: "mgr-blue-comets", teamId: "team-atlas" },
      { managerId: "mgr-orange-crush", teamId: "team-galdor" },
      { managerId: "mgr-golden-boots", teamId: "team-cyrenia" }
    ]
  },
  teams: [
    { teamId: "team-ionia", displayName: "Ionia", group: "C", status: "champion" },
    { teamId: "team-hibernia", displayName: "Hibernia", group: "B", status: "eliminated" },
    { teamId: "team-atlas", displayName: "Atlas", group: "A", status: "eliminated" },
    { teamId: "team-galdor", displayName: "Galdor", group: "B", status: "runner_up" },
    { teamId: "team-cyrenia", displayName: "Cyrenia", group: "A", status: "eliminated" }
  ],
  matches: [
    { stage: "QF", homeTeamId: "team-atlas", awayTeamId: "team-ionia", homeGoals: 0, awayGoals: 1, winnerTeamId: "team-ionia", decidedBy: "regulation" },
    { stage: "FINAL", homeTeamId: "team-ionia", awayTeamId: "team-galdor", homeGoals: 2, awayGoals: 1, winnerTeamId: "team-ionia", decidedBy: "regulation" }
  ],
  ledger: [
    { managerId: "mgr-black-arrows", teamId: "team-ionia", category: "champion", points: 2, explanation: "Ionia won the World Cup." },
    { managerId: "mgr-black-arrows", teamId: "team-ionia", category: "goal_scored", points: 1, explanation: "Ionia scored 2 goals against Galdor." }
  ]
};

const colorMap = {
  black: "#f8c95f",
  blue: "#73c7df",
  orange: "#ef8a54",
  gold: "#f8c95f",
  green: "#88d890",
  purple: "#c59cff",
  silver: "#c9d3d8",
  red: "#ef6f54"
};

const state = {
  selectedManagerId: null,
  data: null
};

async function readJson(path, fallbackValue) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load ${path}`);
    return await response.json();
  } catch {
    return fallbackValue;
  }
}

async function boot() {
  const [snapshot, league, teamsPayload, matchesPayload, ledgerPayload] = await Promise.all([
    readJson("../../sample-data/dashboard-snapshot-8.json", fallback.snapshot),
    readJson("../../sample-data/simulated-league-8.json", fallback.league),
    readJson("../../sample-data/simulated-teams-48.json", { teams: fallback.teams }),
    readJson("../../sample-data/simulated-matches.json", { matches: fallback.matches }),
    readJson("../../sample-data/simulated-scoring-ledger-8.json", { ledger: fallback.ledger })
  ]);

  state.data = {
    snapshot,
    league,
    teams: teamsPayload.teams || teamsPayload,
    matches: matchesPayload.matches || matchesPayload,
    ledger: ledgerPayload.ledger || ledgerPayload
  };
  state.selectedManagerId = snapshot.data.standings[0]?.managerId;
  render();
}

function render() {
  const { snapshot } = state.data;
  const standings = snapshot.data.standings;
  const leader = standings[0];
  const second = standings[1];
  const third = standings[2];
  const leaderGap = second ? leader.totalPoints - second.totalPoints : leader.totalPoints;

  text("league-title", snapshot.data.league.name.replace("Simulated ", ""));
  text("sync-label", `${snapshot.dataHealth.status} · ${snapshot.data.league.currentPhase.replaceAll("_", " ")}`);
  text("leader-name", leader.displayName);
  text("leader-score", formatPoints(leader.totalPoints));
  text("leader-gap", `+${formatPoints(leaderGap)}`);
  text("gap-copy", second ? `${second.displayName} is one swing back` : "leader has the field chasing");
  text("orb-rank-1", leader.rank);
  text("orb-rank-2", second?.rank || "");
  text("orb-rank-3", third?.rank || "");

  renderManagerRibbon();
  renderMatches();
  renderManagerStory();
  renderLedger();
}

function renderManagerRibbon() {
  const ribbon = document.getElementById("manager-ribbon");
  ribbon.innerHTML = state.data.snapshot.data.standings.map((standing) => {
    const manager = managerById(standing.managerId);
    const accent = colorMap[manager?.colorToken] || "#f8c95f";
    const active = standing.managerId === state.selectedManagerId ? " is-active" : "";
    return `
      <button class="manager-pill${active}" type="button" style="--accent:${accent}" data-manager-id="${standing.managerId}">
        <span class="rank-disc">${standing.rank}</span>
        <span>${standing.displayName}</span>
        <strong>${formatPoints(standing.totalPoints)}</strong>
      </button>
    `;
  }).join("");

  ribbon.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedManagerId = button.dataset.managerId;
      renderManagerRibbon();
      renderManagerStory();
    });
  });
}

function renderMatches() {
  const carousel = document.getElementById("match-carousel");
  const matches = state.data.matches.slice(-4).reverse();
  carousel.innerHTML = matches.map((match) => {
    const home = teamById(match.homeTeamId);
    const away = teamById(match.awayTeamId);
    const winner = teamById(match.winnerTeamId);
    const manager = managerForTeam(match.winnerTeamId);
    const note = winner
      ? `${winner.displayName} moved ${manager?.displayName || "a roster"} with a ${match.decidedBy.replace("_", " ")} result.`
      : "Draw points and clean sheets kept both sides relevant.";
    return `
      <article class="match-card">
        <div>
          <div class="match-teams">
            ${teamLine(home, match.homeGoals)}
            ${teamLine(away, match.awayGoals)}
          </div>
          <p class="impact-note">${note}</p>
        </div>
        <span class="stage-badge">${match.stage}</span>
      </article>
    `;
  }).join("");
}

function renderManagerStory() {
  const standings = state.data.snapshot.data.standings;
  const standing = standings.find((item) => item.managerId === state.selectedManagerId) || standings[0];
  const manager = managerById(standing.managerId);
  const teams = rosterTeams(standing.managerId);
  const teamScores = pointsByTeam();
  const topTeam = teams.slice().sort((a, b) => (teamScores[b.teamId] || 0) - (teamScores[a.teamId] || 0))[0];
  const topPoints = topTeam ? teamScores[topTeam.teamId] || 0 : 0;
  const leadPhrase = standing.rank === 1
    ? "setting the pace"
    : `${formatPoints(state.data.snapshot.data.standings[0].totalPoints - standing.totalPoints)} points off the lead`;

  text("manager-title", manager?.displayName || standing.displayName);
  text("manager-total", formatPoints(standing.totalPoints));
  document.getElementById("manager-storyline").innerHTML = `
    <p><strong>${manager?.displayName || standing.displayName}</strong> is ranked ${standing.rank}, ${leadPhrase}. ${topTeam ? `${topTeam.displayName} is carrying the biggest swing at ${formatPoints(topPoints)} points.` : "Roster data is still loading."}</p>
  `;

  document.getElementById("roster-flow").innerHTML = teams.slice(0, 6).map((team) => {
    const managerAccent = colorMap[manager?.colorToken] || "#f8c95f";
    const points = teamScores[team.teamId] || 0;
    return `
      <div class="country-row" style="--accent:${managerAccent}">
        <span class="flag-mark">${initials(team.displayName)}</span>
        <span>
          <strong>${team.displayName}</strong>
          <small>${teamStatus(team)} · Group ${team.group || "?"}</small>
        </span>
        <span class="country-points">${formatSigned(points)}</span>
      </div>
    `;
  }).join("");
}

function renderLedger() {
  const rows = state.data.ledger.slice(-10).reverse();
  document.getElementById("receipt-list").innerHTML = rows.map((row) => {
    const manager = managerById(row.managerId);
    const team = teamById(row.teamId);
    return `
      <article class="receipt">
        <p><strong>${manager?.displayName || "Manager"}</strong> · ${team?.displayName || "Team"}<br>${row.explanation}</p>
        <span class="receipt-points">${formatSigned(row.points)}</span>
      </article>
    `;
  }).join("");
}

function managerById(managerId) {
  return state.data.league.managers.find((manager) => manager.managerId === managerId);
}

function teamById(teamId) {
  return state.data.teams.find((team) => team.teamId === teamId) || { teamId, displayName: "Unknown", group: "?" };
}

function managerForTeam(teamId) {
  const roster = state.data.league.rosters.find((item) => item.teamId === teamId);
  return roster ? managerById(roster.managerId) : null;
}

function rosterTeams(managerId) {
  return state.data.league.rosters
    .filter((item) => item.managerId === managerId)
    .map((item) => teamById(item.teamId));
}

function pointsByTeam() {
  return state.data.ledger.reduce((scores, row) => {
    scores[row.teamId] = (scores[row.teamId] || 0) + Number(row.points || 0);
    return scores;
  }, {});
}

function teamLine(team, goals) {
  return `
    <div class="team-line">
      <span class="team-name">${team.displayName}</span>
      <span class="scoreline">${goals ?? "-"}</span>
    </div>
  `;
}

function teamStatus(team) {
  return (team.status || "active").replaceAll("_", " ");
}

function initials(name) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function formatPoints(value) {
  return Number(value || 0).toFixed(2).replace(/\.00$/, "");
}

function formatSigned(value) {
  const number = Number(value || 0);
  return `${number >= 0 ? "+" : ""}${formatPoints(number)}`;
}

function text(id, value) {
  document.getElementById(id).textContent = value;
}

document.getElementById("sync-chip").addEventListener("click", () => {
  boot();
});

boot();
