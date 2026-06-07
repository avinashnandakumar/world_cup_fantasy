const paths = {
  snapshot: "../../sample-data/dashboard-snapshot-8.json",
  league: "../../sample-data/simulated-league-8.json",
  teams: "../../sample-data/simulated-teams-48.json",
  matches: "../../sample-data/simulated-matches.json",
  ledger: "../../sample-data/simulated-scoring-ledger-8.json",
};

const fallback = {
  standings: [
    { rank: 1, managerId: "mgr-black-arrows", displayName: "Black Arrows", totalPoints: 7.75, championOwned: true },
    { rank: 2, managerId: "mgr-blue-comets", displayName: "Blue Comets", totalPoints: 6.75, championOwned: false },
    { rank: 3, managerId: "mgr-orange-crush", displayName: "Orange Crush", totalPoints: 3.5, championOwned: false },
    { rank: 4, managerId: "mgr-golden-boots", displayName: "Golden Boots", totalPoints: 1.5, championOwned: false },
  ],
  managers: [
    { managerId: "mgr-black-arrows", displayName: "Black Arrows", shortName: "Arrows", colorToken: "black" },
    { managerId: "mgr-blue-comets", displayName: "Blue Comets", shortName: "Comets", colorToken: "blue" },
    { managerId: "mgr-orange-crush", displayName: "Orange Crush", shortName: "Crush", colorToken: "orange" },
    { managerId: "mgr-golden-boots", displayName: "Golden Boots", shortName: "Boots", colorToken: "gold" },
  ],
  rosters: [
    { managerId: "mgr-black-arrows", teamId: "team-ionia" },
    { managerId: "mgr-black-arrows", teamId: "team-hibernia" },
    { managerId: "mgr-blue-comets", teamId: "team-atlas" },
    { managerId: "mgr-orange-crush", teamId: "team-galdor" },
    { managerId: "mgr-golden-boots", teamId: "team-cyrenia" },
  ],
  teams: [
    { teamId: "team-ionia", name: "Ionia", shortName: "ION", group: "C", status: "champion", isChampion: true, qualifiedForKnockouts: true },
    { teamId: "team-hibernia", name: "Hibernia", shortName: "HIB", group: "B", status: "eliminated", qualifiedForKnockouts: true },
    { teamId: "team-atlas", name: "Atlas", shortName: "ATL", group: "A", status: "eliminated", qualifiedForKnockouts: true },
    { teamId: "team-galdor", name: "Galdor", shortName: "GAL", group: "B", status: "eliminated", qualifiedForKnockouts: true },
    { teamId: "team-cyrenia", name: "Cyrenia", shortName: "CYR", group: "A", status: "qualified", qualifiedForKnockouts: true },
  ],
  matches: [
    { matchId: "match-008", stage: "FINAL", status: "final", homeTeamId: "team-ionia", awayTeamId: "team-galdor", homeGoals: 2, awayGoals: 1, decidedBy: "regulation" },
  ],
  ledger: [
    { managerId: "mgr-black-arrows", teamId: "team-ionia", category: "champion", points: 2, explanation: "Ionia won the World Cup." },
  ],
};

const flagPalettes = [
  ["#0e7a4f", "#fffdf4", "#ff4f7b"],
  ["#101820", "#facc15", "#22d3ee"],
  ["#ef4444", "#fffdf4", "#2563eb"],
  ["#16a34a", "#facc15", "#101820"],
  ["#7c3aed", "#fffdf4", "#ff4f7b"],
  ["#0f766e", "#22d3ee", "#fffdf4"],
  ["#fb923c", "#fffdf4", "#101820"],
  ["#1d4ed8", "#facc15", "#fffdf4"],
];

const state = {
  activeManagerId: null,
  data: null,
};

function byId(items, key = "teamId") {
  return new Map(items.map((item) => [item[key], item]));
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

async function loadData() {
  try {
    const [snapshot, league, teams, matches, ledger] = await Promise.all([
      loadJson(paths.snapshot),
      loadJson(paths.league),
      loadJson(paths.teams),
      loadJson(paths.matches),
      loadJson(paths.ledger),
    ]);

    return {
      standings: snapshot.data.standings,
      managers: league.managers,
      rosters: league.rosters,
      teams: teams.teams,
      matches: matches.matches,
      ledger: ledger.ledger,
    };
  } catch (error) {
    console.warn("Using fallback concept data:", error);
    return fallback;
  }
}

function formatPoints(points) {
  return Number(points).toFixed(Number.isInteger(points) ? 0 : 2);
}

function getTeamPoints(ledger, teamId) {
  return ledger
    .filter((row) => row.teamId === teamId)
    .reduce((total, row) => total + Number(row.points || 0), 0);
}

function getManagerRosters(data, managerId) {
  const teams = byId(data.teams);
  return data.rosters
    .filter((roster) => roster.managerId === managerId)
    .map((roster) => teams.get(roster.teamId))
    .filter(Boolean);
}

function flagStyle(code) {
  const seed = [...code].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const palette = flagPalettes[seed % flagPalettes.length];
  return `linear-gradient(90deg, ${palette[0]} 0 33%, ${palette[1]} 33% 66%, ${palette[2]} 66% 100%)`;
}

function flagChip(team, className = "flag-chip") {
  const code = team?.shortName || team?.flagCode || "TBD";
  return `<span class="${className}" style="background:${flagStyle(code)}">${code}</span>`;
}

function renderHero(data) {
  const leader = data.standings[0];
  const leaderTeams = getManagerRosters(data, leader.managerId).slice(0, 8);

  document.querySelector("[data-leader-name]").textContent = leader.displayName;
  document.querySelector("[data-leader-score]").textContent = formatPoints(leader.totalPoints);
  document.querySelector("[data-flag-stream]").innerHTML = leaderTeams.map((team) => flagChip(team)).join("");
}

function renderRace(data) {
  const raceList = document.querySelector("[data-race-list]");
  raceList.innerHTML = data.standings
    .map((standing, index) => {
      const teams = getManagerRosters(data, standing.managerId).slice(0, 6);
      return `
        <li class="race-row" style="animation-delay:${index * 70}ms">
          <span class="rank-badge">${standing.rank}</span>
          <span>
            <span class="manager-name">${standing.displayName}</span>
            <span class="race-flags">${teams.map((team) => flagChip(team)).join("")}</span>
          </span>
          <span class="race-points">${formatPoints(standing.totalPoints)}</span>
        </li>
      `;
    })
    .join("");

  const first = data.standings[0];
  const second = data.standings[1];
  const gap = Math.abs(first.totalPoints - second.totalPoints);
  document.querySelector("[data-gap-copy]").textContent = `${second.displayName} is ${formatPoints(gap)} pt back`;
}

function renderTrail(data) {
  const trail = document.querySelector("[data-trail]");
  const teams = byId(data.teams);
  const featuredMatches = data.matches.slice(-6);
  const positions = [
    [8, 74],
    [24, 35],
    [41, 52],
    [56, 31],
    [73, 25],
    [89, 46],
  ];

  const markers = featuredMatches
    .map((match, index) => {
      const winner = teams.get(match.winnerTeamId) || teams.get(match.homeTeamId);
      const [left, top] = positions[index % positions.length];
      const label = match.stage === "FINAL" ? "Champion moment" : match.stage;
      return `
        <div class="trail-marker" style="left:${left}%; top:${top}%">
          ${flagChip(winner, "trail-flag")}
          <strong>${label}</strong>
        </div>
      `;
    })
    .join("");

  trail.insertAdjacentHTML("beforeend", markers);
}

function renderMatches(data) {
  const teams = byId(data.teams);
  const strip = document.querySelector("[data-match-strip]");
  strip.innerHTML = data.matches
    .slice(-3)
    .reverse()
    .map((match) => {
      const home = teams.get(match.homeTeamId);
      const away = teams.get(match.awayTeamId);
      const homePoints = getTeamPoints(data.ledger, match.homeTeamId);
      const awayPoints = getTeamPoints(data.ledger, match.awayTeamId);
      return `
        <article class="score-bug">
          <p class="match-meta">${match.stage} / ${match.status}${match.decidedBy === "penalties" ? " / penalties" : ""}</p>
          <div class="score-line">
            <span class="score-team">${flagChip(home)}<span>${home.name}</span></span>
            <span>${match.homeGoals}-${match.awayGoals}</span>
            <span class="score-team">${flagChip(away)}<span>${away.name}</span></span>
          </div>
          <p class="score-context">
            Fantasy swing: ${home.shortName} ${formatPoints(homePoints)} pts, ${away.shortName} ${formatPoints(awayPoints)} pts.
          </p>
        </article>
      `;
    })
    .join("");
}

function renderRosterTabs(data) {
  const tabs = document.querySelector("[data-manager-tabs]");
  tabs.innerHTML = data.standings
    .map((standing) => {
      const isActive = standing.managerId === state.activeManagerId;
      return `
        <button class="manager-tab ${isActive ? "is-active" : ""}" type="button" data-manager-id="${standing.managerId}">
          ${standing.displayName}
        </button>
      `;
    })
    .join("");

  tabs.querySelectorAll("[data-manager-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeManagerId = button.dataset.managerId;
      renderRosterTabs(state.data);
      renderRosterFocus(state.data);
    });
  });
}

function renderRosterFocus(data) {
  const standings = byId(data.standings, "managerId");
  const manager = standings.get(state.activeManagerId);
  const teams = getManagerRosters(data, state.activeManagerId);
  const focus = document.querySelector("[data-roster-focus]");
  focus.innerHTML = `
    <aside class="roster-summary">
      <p class="mini-label">Selected manager</p>
      <h3>${manager.displayName}</h3>
      <p class="leader-score">${formatPoints(manager.totalPoints)} pts</p>
      <p>${teams.filter((team) => team.qualifiedForKnockouts).length} flags reached the knockout trail.</p>
    </aside>
    <div class="roster-grid">
      ${teams
        .map((team) => {
          const points = getTeamPoints(data.ledger, team.teamId);
          return `
            <article class="country-tile">
              ${flagChip(team)}
              <strong>${team.name}</strong>
              <span>Group ${team.group} / ${team.status}</span>
              <p>${formatPoints(points)} pts</p>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderLedger(data) {
  const teams = byId(data.teams);
  const managers = byId(data.standings, "managerId");
  document.querySelector("[data-ledger-list]").innerHTML = data.ledger
    .slice()
    .reverse()
    .slice(0, 36)
    .map((row) => {
      const team = teams.get(row.teamId);
      const manager = managers.get(row.managerId);
      const points = Number(row.points);
      return `
        <article class="ledger-item">
          <span class="ledger-points ${points < 0 ? "is-negative" : ""}">${points > 0 ? "+" : ""}${formatPoints(points)}</span>
          <span>
            <strong>${manager?.displayName || "Unknown"} / ${team?.name || "Unknown team"}</strong>
            <p>${row.explanation}</p>
          </span>
        </article>
      `;
    })
    .join("");
}

function setupDrawer() {
  const drawer = document.querySelector("[data-ledger-drawer]");
  const openButtons = document.querySelectorAll("[data-open-ledger]");
  const closeButtons = document.querySelectorAll("[data-close-ledger]");

  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
    });
  });
}

function setupTyping() {
  const words = ["race.", "flags.", "trail.", "swing.", "cup."];
  const target = document.querySelector("[data-typing]");
  let wordIndex = 0;
  let letterIndex = 0;
  let deleting = false;

  function tick() {
    const word = words[wordIndex];
    target.textContent = word.slice(0, letterIndex);

    if (!deleting && letterIndex <= word.length) {
      letterIndex += 1;
    } else if (deleting && letterIndex >= 0) {
      letterIndex -= 1;
    }

    if (letterIndex > word.length + 8) {
      deleting = true;
    }

    if (letterIndex < 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      letterIndex = 0;
    }

    window.setTimeout(tick, deleting ? 58 : 105);
  }

  tick();
}

async function init() {
  const data = await loadData();
  state.data = data;
  state.activeManagerId = data.standings[0].managerId;

  renderHero(data);
  renderRace(data);
  renderTrail(data);
  renderMatches(data);
  renderRosterTabs(data);
  renderRosterFocus(data);
  renderLedger(data);
  setupDrawer();
  setupTyping();
}

init();
