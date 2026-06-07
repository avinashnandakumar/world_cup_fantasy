const snapshotFallback = {
  data: {
    league: {
      name: "Simulated 8-Manager League",
      currentPhase: "FINAL_COMPLETE",
    },
    standings: [
      { rank: 1, managerId: "mgr-black-arrows", displayName: "Black Arrows", totalPoints: 7.75, championOwned: true },
      { rank: 2, managerId: "mgr-blue-comets", displayName: "Blue Comets", totalPoints: 6.75, championOwned: false },
      { rank: 3, managerId: "mgr-orange-crush", displayName: "Orange Crush", totalPoints: 3.5, championOwned: false },
      { rank: 4, managerId: "mgr-golden-boots", displayName: "Golden Boots", totalPoints: 1.5, championOwned: false },
      { rank: 5, managerId: "mgr-silver-strikers", displayName: "Silver Strikers", totalPoints: 1.25, championOwned: false },
      { rank: 6, managerId: "mgr-green-waves", displayName: "Green Waves", totalPoints: 1, championOwned: false },
      { rank: 7, managerId: "mgr-purple-reign", displayName: "Purple Reign", totalPoints: 0.25, championOwned: false },
      { rank: 8, managerId: "mgr-red-rockets", displayName: "Red Rockets", totalPoints: -1, championOwned: false },
    ],
  },
};

const rosterFallback = {
  managers: [
    { managerId: "mgr-black-arrows", displayName: "Black Arrows", color: "#101820", roster: ["Ionia", "Harbor", "Valletta", "Summit", "Cobalt", "Desert"] },
    { managerId: "mgr-blue-comets", displayName: "Blue Comets", color: "#22d3ee", roster: ["Aurora", "Atlas", "Nord", "Pacifica", "River", "Sierra"] },
    { managerId: "mgr-orange-crush", displayName: "Orange Crush", color: "#ff8a00", roster: ["Coral", "Dynamo", "Emerald", "Highland", "Marina", "Prairie"] },
    { managerId: "mgr-golden-boots", displayName: "Golden Boots", color: "#facc15", roster: ["Luson", "Mesa", "Orchid", "Pioneer", "Quartz", "Ridge"] },
    { managerId: "mgr-silver-strikers", displayName: "Silver Strikers", color: "#94a3b8", roster: ["Avalon", "Bay", "Canyon", "Delta", "Forest", "Granite"] },
    { managerId: "mgr-green-waves", displayName: "Green Waves", color: "#0e7a4f", roster: ["Horizon", "Island", "Jade", "Lagoon", "Metro", "Nova"] },
    { managerId: "mgr-purple-reign", displayName: "Purple Reign", color: "#8b5cf6", roster: ["Oasis", "Peak", "Royal", "Sol", "Terra", "Union"] },
    { managerId: "mgr-red-rockets", displayName: "Red Rockets", color: "#ff4f7b", roster: ["Vista", "West", "Zenith", "Liberty", "Capital", "Breeze"] },
  ],
};

const matchFallback = [
  { homeTeamName: "Ionia", awayTeamName: "Aurora", homeScore: 2, awayScore: 1, status: "LIVE", minute: "68'", fantasySwing: "+1.25" },
  { homeTeamName: "Harbor", awayTeamName: "Coral", homeScore: 0, awayScore: 0, status: "LIVE", minute: "HT", fantasySwing: "+0.50" },
  { homeTeamName: "Summit", awayTeamName: "Atlas", homeScore: 3, awayScore: 2, status: "FINAL", minute: "FT", fantasySwing: "+2.00" },
];

const ledgerFallback = [
  { managerName: "Black Arrows", countryName: "Ionia", scoringCategory: "Win", points: 1, explanation: "Ionia won 2-1." },
  { managerName: "Blue Comets", countryName: "Aurora", scoringCategory: "Goal scored", points: 0.5, explanation: "Aurora scored once." },
  { managerName: "Black Arrows", countryName: "Ionia", scoringCategory: "Champion bonus", points: 2, explanation: "Ionia won the simulated tournament." },
  { managerName: "Red Rockets", countryName: "Vista", scoringCategory: "Goal allowed", points: -0.25, explanation: "Vista allowed one goal." },
];

const accents = ["#facc15", "#22d3ee", "#ff4f7b", "#0e7a4f", "#a3e635", "#ff8a00", "#8b5cf6", "#101820"];

const flagPairs = [
  ["#16a34a", "#fffdf4", "#ef4444"],
  ["#22d3ee", "#fffdf4", "#101820"],
  ["#facc15", "#0e7a4f", "#fffdf4"],
  ["#ff4f7b", "#fffdf4", "#22d3ee"],
  ["#101820", "#facc15", "#fffdf4"],
  ["#8b5cf6", "#fffdf4", "#ff4f7b"],
  ["#0e7a4f", "#a3e635", "#fffdf4"],
  ["#ff8a00", "#fffdf4", "#101820"],
];

const headlines = [
  "The table is moving.",
  "Every goal changes the room.",
  "Flags rise. Rosters breathe.",
  "One poster for the whole race.",
];

const byId = (id) => document.getElementById(id);

const readJson = async (path, fallback) => {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return await response.json();
  } catch {
    return fallback;
  }
};

const formatPoints = (points) => Number(points).toLocaleString(undefined, {
  minimumFractionDigits: points % 1 ? 2 : 0,
  maximumFractionDigits: 2,
});

const colorTokens = {
  black: "#101820",
  blue: "#22d3ee",
  red: "#ff4f7b",
  gold: "#facc15",
  green: "#0e7a4f",
  purple: "#8b5cf6",
  silver: "#94a3b8",
  orange: "#ff8a00",
};

const createFlag = (label, index) => {
  const colors = flagPairs[index % flagPairs.length];
  return `<i class="country-mark" style="--flag-a:${colors[0]};--flag-b:${colors[1]};--flag-c:${colors[2]}" title="${label}"></i>`;
};

const typeHeadline = () => {
  const target = byId("typed-headline");
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    const phrase = headlines[phraseIndex];
    target.textContent = phrase.slice(0, charIndex);

    if (!deleting && charIndex < phrase.length) {
      charIndex += 1;
      window.setTimeout(tick, 55);
      return;
    }

    if (!deleting && charIndex === phrase.length) {
      deleting = true;
      window.setTimeout(tick, 1500);
      return;
    }

    if (deleting && charIndex > 0) {
      charIndex -= 1;
      window.setTimeout(tick, 28);
      return;
    }

    deleting = false;
    phraseIndex = (phraseIndex + 1) % headlines.length;
    window.setTimeout(tick, 260);
  };

  tick();
};

const renderHero = (standings, league) => {
  const leader = standings[0];
  const second = standings[1];
  const gap = second ? leader.totalPoints - second.totalPoints : 0;
  byId("leader-rank").textContent = `#${leader.rank}`;
  byId("leader-name").textContent = leader.displayName;
  byId("leader-score").textContent = formatPoints(leader.totalPoints);
  byId("leader-meta").textContent = `${league.name} · ${formatPoints(gap)} point lead · ${leader.championOwned ? "Champion owned" : "Open race"}`;
  byId("hero-summary").textContent = `${leader.displayName} leads by ${formatPoints(gap)}. The page stays poster-simple up front, with scoring math tucked into the audit drawer.`;
};

const renderFlagRiver = (managers) => {
  const countries = managers.flatMap((manager) => manager.roster.slice(0, 3));
  const doubled = [...countries, ...countries, ...countries];
  byId("flag-river").innerHTML = doubled
    .map((country, index) => `
      <span class="flag-chip" style="animation-delay:${index * -0.55}s">
        ${createFlag(country, index)}
        <span>${country}</span>
      </span>
    `)
    .join("");
};

const renderMatches = (matches) => {
  byId("bug-track").innerHTML = matches.slice(0, 3).map((match, index) => `
    <article class="match-row" style="animation-delay:${index * 0.08}s">
      <div class="team-side">${createFlag(match.homeTeamName, index)}<span>${match.homeTeamName}</span></div>
      <div class="score-core">
        <span>${match.homeScore ?? 0}-${match.awayScore ?? 0}</span>
        <small>${match.status || "Live"} ${match.minute || ""}</small>
      </div>
      <div class="team-side"><span>${match.awayTeamName}</span>${createFlag(match.awayTeamName, index + 3)}</div>
      <div class="swing-badge">${match.fantasySwing || "+0.50"} swing</div>
    </article>
  `).join("");
};

const renderRace = (standings, managers) => {
  const leaderPoints = standings[0]?.totalPoints || 0;
  const managerById = new Map(managers.map((manager) => [manager.managerId, manager]));

  byId("race-board").innerHTML = standings.map((standing, index) => {
    const manager = managerById.get(standing.managerId) || {};
    const gap = leaderPoints - standing.totalPoints;
    const roster = manager.roster || [];
    return `
      <article class="manager-card ${index === 0 ? "leader" : ""}" style="--accent:${manager.color || accents[index % accents.length]};--accent-two:${accents[(index + 2) % accents.length]};animation-delay:${index * 0.07}s">
        <div class="manager-rank">Rank ${standing.rank}</div>
        <div class="manager-name">${standing.displayName}</div>
        <div class="manager-points">${formatPoints(standing.totalPoints)}</div>
        <div class="manager-gap">${index === 0 ? "Setting the pace" : `${formatPoints(gap)} pts back`}</div>
        <div class="mini-flags" aria-label="${standing.displayName} roster preview">
          ${roster.slice(0, 6).map((country, flagIndex) => createFlag(country, index + flagIndex)).join("")}
        </div>
      </article>
    `;
  }).join("");
};

const renderRosters = (standings, managers) => {
  const standingsById = new Map(standings.map((standing) => [standing.managerId, standing]));

  byId("roster-stack").innerHTML = managers.map((manager, index) => {
    const standing = standingsById.get(manager.managerId) || { totalPoints: 0, rank: "?" };
    return `
      <article class="roster-row">
        <div class="roster-manager">#${standing.rank} ${manager.displayName}</div>
        <div class="roster-countries">
          ${manager.roster.map((country, countryIndex) => `
            <span class="country-pill">${createFlag(country, index + countryIndex)}${country}</span>
          `).join("")}
        </div>
        <div class="roster-total">${formatPoints(standing.totalPoints)} pts</div>
      </article>
    `;
  }).join("");
};

const renderLedger = (ledger) => {
  byId("ledger-list").innerHTML = ledger.slice(0, 10).map((row) => `
    <article class="ledger-item">
      <div>
        <strong>${row.managerName || row.managerId || "Manager"} · ${row.countryName || row.teamName || "Country"}</strong>
        <span>${row.scoringCategory || row.category || "Scoring"} — ${row.explanation || "Scoring detail"}</span>
      </div>
      <div class="ledger-points">${Number(row.points || 0) > 0 ? "+" : ""}${formatPoints(Number(row.points || 0))}</div>
    </article>
  `).join("");
};

const bindLedger = () => {
  const drawer = byId("ledger-drawer");
  byId("open-ledger").addEventListener("click", () => {
    if (drawer.showModal) drawer.showModal();
  });
};

const hydrateManagers = (leagueData, teamsData) => {
  if (leagueData.managers?.[0]?.roster) return leagueData.managers;

  const teamById = new Map((teamsData.teams || []).map((team) => [team.teamId, team]));
  return (leagueData.managers || rosterFallback.managers).map((manager) => {
    const roster = (leagueData.rosters || [])
      .filter((row) => row.managerId === manager.managerId)
      .sort((a, b) => a.draftPick - b.draftPick)
      .map((row) => teamById.get(row.teamId)?.name || row.teamId);

    return {
      ...manager,
      color: manager.color || colorTokens[manager.colorToken] || accents[0],
      roster,
    };
  });
};

const hydrateMatches = (matchesData, teamsData) => {
  const matches = Array.isArray(matchesData) ? matchesData : matchesData.matches || [];
  const teamById = new Map((teamsData.teams || []).map((team) => [team.teamId, team]));

  return matches.map((match) => ({
    ...match,
    homeTeamName: match.homeTeamName || teamById.get(match.homeTeamId)?.name || "Home",
    awayTeamName: match.awayTeamName || teamById.get(match.awayTeamId)?.name || "Away",
    homeScore: match.homeScore ?? match.homeGoals ?? 0,
    awayScore: match.awayScore ?? match.awayGoals ?? 0,
    status: match.status || "scheduled",
    minute: match.minute || (match.status === "final" ? "FT" : "LIVE"),
    fantasySwing: match.fantasySwing || (match.stage === "FINAL" ? "+2.00" : "+0.75"),
  }));
};

const hydrateLedger = (ledgerData, leagueData, teamsData) => {
  const ledger = Array.isArray(ledgerData) ? ledgerData : ledgerData.ledger || [];
  const teamById = new Map((teamsData.teams || []).map((team) => [team.teamId, team]));
  const managerById = new Map((leagueData.managers || []).map((manager) => [manager.managerId, manager]));

  return ledger.map((row) => ({
    ...row,
    managerName: row.managerName || managerById.get(row.managerId)?.displayName,
    countryName: row.countryName || teamById.get(row.teamId)?.name,
    scoringCategory: row.scoringCategory || row.category?.replaceAll("_", " "),
  }));
};

const init = async () => {
  const [snapshot, rosterData, matchesData, ledgerData, teamsData] = await Promise.all([
    readJson("../../sample-data/dashboard-snapshot-8.json", snapshotFallback),
    readJson("../../sample-data/simulated-league-8.json", rosterFallback),
    readJson("../../sample-data/simulated-matches.json", matchFallback),
    readJson("../../sample-data/simulated-scoring-ledger-8.json", ledgerFallback),
    readJson("../../sample-data/simulated-teams-48.json", { teams: [] }),
  ]);

  const standings = snapshot.data?.standings || snapshotFallback.data.standings;
  const league = snapshot.data?.league || snapshotFallback.data.league;
  const managers = hydrateManagers(rosterData, teamsData);
  const matches = hydrateMatches(matchesData, teamsData);
  const ledger = hydrateLedger(ledgerData, rosterData, teamsData);

  renderHero(standings, league);
  renderFlagRiver(managers);
  renderMatches(matches.length ? matches : matchFallback);
  renderRace(standings, managers);
  renderRosters(standings, managers);
  renderLedger(ledger.length ? ledger : ledgerFallback);
  bindLedger();
  typeHeadline();
};

init();
