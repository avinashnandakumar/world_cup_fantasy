const snapshotUrl = "../../sample-data/dashboard-snapshot-8.json";
const ledgerUrl = "../../sample-data/simulated-scoring-ledger-8.json";
const leagueUrl = "../../sample-data/simulated-league-8.json";
const teamsUrl = "../../sample-data/simulated-teams-48.json";

const fallbackStandings = [
  { rank: 1, managerId: "mgr-black-arrows", displayName: "Black Arrows", totalPoints: 7.75, championOwned: true },
  { rank: 2, managerId: "mgr-blue-comets", displayName: "Blue Comets", totalPoints: 6.75, championOwned: false },
  { rank: 3, managerId: "mgr-orange-crush", displayName: "Orange Crush", totalPoints: 3.5, championOwned: false },
  { rank: 4, managerId: "mgr-golden-boots", displayName: "Golden Boots", totalPoints: 1.5, championOwned: false },
  { rank: 5, managerId: "mgr-silver-strikers", displayName: "Silver Strikers", totalPoints: 1.25, championOwned: false },
  { rank: 6, managerId: "mgr-green-waves", displayName: "Green Waves", totalPoints: 1, championOwned: false },
  { rank: 7, managerId: "mgr-purple-reign", displayName: "Purple Reign", totalPoints: 0.25, championOwned: false },
  { rank: 8, managerId: "mgr-red-rockets", displayName: "Red Rockets", totalPoints: -1, championOwned: false }
];

const fallbackRosters = {
  "mgr-black-arrows": ["Brazil", "Ionia", "Japan", "Morocco", "Poland", "Wales"],
  "mgr-blue-comets": ["France", "Korea", "Mexico", "Norway", "Senegal", "USA"],
  "mgr-orange-crush": ["Argentina", "Canada", "Croatia", "Ghana", "Qatar", "Tunisia"]
};

const managerColors = [
  "#101820",
  "#2563eb",
  "#ff7a1a",
  "#b88a00",
  "#71717a",
  "#0e7a4f",
  "#7c3aed",
  "#ef4444"
];

const flags = {
  Argentina: "🇦🇷",
  Brazil: "🇧🇷",
  Canada: "🇨🇦",
  Croatia: "🇭🇷",
  France: "🇫🇷",
  Ghana: "🇬🇭",
  Ionia: "🏆",
  Japan: "🇯🇵",
  Korea: "🇰🇷",
  Mexico: "🇲🇽",
  Morocco: "🇲🇦",
  Norway: "🇳🇴",
  Poland: "🇵🇱",
  Qatar: "🇶🇦",
  Senegal: "🇸🇳",
  Tunisia: "🇹🇳",
  USA: "🇺🇸",
  Wales: "🏴"
};

const flagPalettes = [
  ["#22d3ee", "#0e7a4f"],
  ["#facc15", "#ff4f7b"],
  ["#2563eb", "#fffdf4"],
  ["#0e7a4f", "#facc15"],
  ["#ff4f7b", "#101820"],
  ["#fffdf4", "#ef4444"]
];

const typingPhrases = [
  "Every goal moves the table.",
  "One clean sheet can change the race.",
  "Flags, points, drama, repeat.",
  "The leader is never fully safe."
];

const query = (selector) => document.querySelector(selector);

async function getJson(url, fallback) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not load ${url}`);
    return await response.json();
  } catch {
    return fallback;
  }
}

function formatPoints(value) {
  return Number(value).toFixed(Number.isInteger(Number(value)) ? 0 : 2);
}

function startTyping() {
  const element = query("[data-typing]");
  let phraseIndex = 0;
  let letterIndex = 0;
  let deleting = false;

  function tick() {
    const phrase = typingPhrases[phraseIndex];
    element.textContent = phrase.slice(0, letterIndex);

    if (!deleting && letterIndex < phrase.length) {
      letterIndex += 1;
      window.setTimeout(tick, 48);
      return;
    }

    if (!deleting && letterIndex === phrase.length) {
      deleting = true;
      window.setTimeout(tick, 1400);
      return;
    }

    if (deleting && letterIndex > 0) {
      letterIndex -= 1;
      window.setTimeout(tick, 24);
      return;
    }

    deleting = false;
    phraseIndex = (phraseIndex + 1) % typingPhrases.length;
    window.setTimeout(tick, 280);
  }

  tick();
}

function renderHero(standings) {
  const leader = standings[0];
  const second = standings[1];
  const gap = leader && second ? leader.totalPoints - second.totalPoints : 0;

  query("[data-leader-name]").textContent = leader.displayName;
  query("[data-leader-score]").textContent = formatPoints(leader.totalPoints);
  query("[data-gap]").textContent = `+${formatPoints(gap)}`;
}

function renderRace(standings) {
  const container = query("[data-race-strip]");
  const leaderPoints = standings[0]?.totalPoints ?? 0;

  container.innerHTML = standings
    .map((manager, index) => {
      const height = Math.max(0, Math.min(90, manager.totalPoints * 8));
      const gap = index === 0 ? "Leader" : `${formatPoints(leaderPoints - manager.totalPoints)} back`;
      const move = index % 3 === 0 ? "▲ 1" : index % 3 === 1 ? "●" : "▼ 1";
      return `
        <article class="rank-card" style="--manager-color:${managerColors[index % managerColors.length]}; --rise:-${height}px">
          <div class="rank-number">
            <span>#${manager.rank}</span>
            <span class="rank-move">${move}</span>
          </div>
          <div class="rank-name">${manager.displayName}</div>
          <div class="rank-points">${formatPoints(manager.totalPoints)}</div>
          <div class="rank-gap">${gap}${manager.championOwned ? " · owns champ" : ""}</div>
        </article>
      `;
    })
    .join("");
}

function renderLiveSwing(standings) {
  const swings = [
    { icon: "⚽", manager: standings[0]?.displayName ?? "Black Arrows", detail: "Brazil goal", delta: 0.5 },
    { icon: "🧤", manager: standings[1]?.displayName ?? "Blue Comets", detail: "Clean sheet watch", delta: 0.5 },
    { icon: "🚩", manager: standings[6]?.displayName ?? "Purple Reign", detail: "Goal allowed", delta: -0.25 },
    { icon: "🏆", manager: standings[0]?.displayName ?? "Black Arrows", detail: "Champion bonus locked", delta: 2 }
  ];

  query("[data-swing-list]").innerHTML = swings
    .map((swing) => `
      <div class="impact-row">
        <strong>${swing.icon}</strong>
        <span>
          <strong>${swing.manager}</strong>
          <small>${swing.detail}</small>
        </span>
        <span class="delta ${swing.delta < 0 ? "negative" : ""}">${swing.delta > 0 ? "+" : ""}${formatPoints(swing.delta)}</span>
      </div>
    `)
    .join("");
}

function renderManagerPicker(standings, rosterMap) {
  const picker = query("[data-manager-picker]");
  picker.innerHTML = standings
    .map((manager, index) => `
      <button class="manager-tab ${index === 0 ? "is-active" : ""}" type="button" data-manager-id="${manager.managerId}">
        #${manager.rank} ${manager.displayName}
      </button>
    `)
    .join("");

  picker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-manager-id]");
    if (!button) return;
    picker.querySelectorAll(".manager-tab").forEach((tab) => tab.classList.remove("is-active"));
    button.classList.add("is-active");
    renderRoster(button.dataset.managerId, rosterMap);
  });

  renderRoster(standings[0]?.managerId, rosterMap);
}

function renderRoster(managerId, rosterMap) {
  const countries = rosterMap[managerId] || Object.values(rosterMap)[0] || [];

  query("[data-roster-stack]").innerHTML = countries
    .map((country, index) => {
      const palette = flagPalettes[index % flagPalettes.length];
      const points = [4.25, 3.5, 1.25, 0.75, -0.25, 2][index % 6];
      const status = index < 2 ? "Alive" : index === 2 ? "Group winner" : "Final";
      return `
        <article class="country-card" style="--flag-a:${palette[0]}; --flag-b:${palette[1]}">
          <div class="country-flag">${flags[country] || "🏳️"}</div>
          <h3>${country}</h3>
          <div class="country-meta">
            <span>${formatPoints(points)} pts</span>
            <span class="status-pill">${status}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function normalizeRosterMap(leagueData, teamsData) {
  if (!leagueData || !Array.isArray(leagueData.rosters)) return fallbackRosters;
  const teamNames = (teamsData?.teams || []).reduce((map, team) => {
    map[team.teamId] = team.name;
    return map;
  }, {});

  return leagueData.rosters.reduce((map, row) => {
    const managerId = row.managerId || row.manager_id;
    const country = row.countryName || row.country || row.teamName || teamNames[row.teamId];
    if (!managerId || !country) return map;
    map[managerId] ||= [];
    map[managerId].push(country);
    return map;
  }, {});
}

function renderAudit(ledger) {
  const rows = Array.isArray(ledger) ? ledger.slice(0, 22) : (ledger?.ledger || []).slice(0, 22);
  query("[data-ledger-table]").innerHTML = rows
    .map((row) => {
      const manager = row.managerName || row.displayName || row.managerId || "Manager";
      const country = row.countryName || row.country || row.teamName || "Country";
      const category = row.category || row.scoringCategory || "Scoring event";
      const points = row.points ?? row.pointDelta ?? 0;
      const reason = row.explanation || row.reason || row.matchId || "Simulated scoring row";
      return `
        <div class="ledger-row">
          <span>
            <strong>${manager} · ${country}</strong>
            <small>${category} · ${reason}</small>
          </span>
          <strong class="delta ${Number(points) < 0 ? "negative" : ""}">${Number(points) > 0 ? "+" : ""}${formatPoints(points)}</strong>
        </div>
      `;
    })
    .join("");
}

function setupAuditDrawer() {
  const dialog = query("[data-audit-dialog]");
  document.querySelectorAll("[data-open-audit]").forEach((button) => {
    button.addEventListener("click", () => {
      if (typeof dialog.showModal === "function") dialog.showModal();
    });
  });
  query("[data-close-audit]").addEventListener("click", () => dialog.close());
}

async function init() {
  const [snapshot, ledger, league, teams] = await Promise.all([
    getJson(snapshotUrl, { data: { standings: fallbackStandings } }),
    getJson(ledgerUrl, []),
    getJson(leagueUrl, null),
    getJson(teamsUrl, null)
  ]);

  const standings = snapshot?.data?.standings || fallbackStandings;
  const rosterMap = normalizeRosterMap(league, teams);

  startTyping();
  renderHero(standings);
  renderRace(standings);
  renderLiveSwing(standings);
  renderManagerPicker(standings, rosterMap);
  renderAudit(ledger);
  setupAuditDrawer();
}

init();
