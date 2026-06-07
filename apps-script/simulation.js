function getSimulationData() {
  return {
    managers: [
      { managerId: 'm01', displayName: 'Avi', color: '#2563eb', icon: 'star', active: true },
      { managerId: 'm02', displayName: 'Maya', color: '#dc2626', icon: 'bolt', active: true },
      { managerId: 'm03', displayName: 'Leo', color: '#16a34a', icon: 'trophy', active: true },
      { managerId: 'm04', displayName: 'Nina', color: '#9333ea', icon: 'spark', active: true }
    ],
    rosters: [
      { managerId: 'm01', teamId: 'ARG', draftSlot: 1, notes: '' },
      { managerId: 'm01', teamId: 'JPN', draftSlot: 8, notes: '' },
      { managerId: 'm02', teamId: 'FRA', draftSlot: 2, notes: '' },
      { managerId: 'm02', teamId: 'USA', draftSlot: 7, notes: '' },
      { managerId: 'm03', teamId: 'BRA', draftSlot: 3, notes: '' },
      { managerId: 'm03', teamId: 'MAR', draftSlot: 6, notes: '' },
      { managerId: 'm04', teamId: 'ESP', draftSlot: 4, notes: '' },
      { managerId: 'm04', teamId: 'GHA', draftSlot: 5, notes: '' }
    ],
    teams: [
      { teamId: 'ARG', countryName: 'Argentina', group: 'A', flagEmoji: '🇦🇷', status: 'champion', qualifiedForKnockouts: true, wonGroup: true, isChampion: true },
      { teamId: 'FRA', countryName: 'France', group: 'B', flagEmoji: '🇫🇷', status: 'runner_up', qualifiedForKnockouts: true, wonGroup: true, isChampion: false },
      { teamId: 'BRA', countryName: 'Brazil', group: 'C', flagEmoji: '🇧🇷', status: 'eliminated', qualifiedForKnockouts: true, wonGroup: false, isChampion: false },
      { teamId: 'ESP', countryName: 'Spain', group: 'D', flagEmoji: '🇪🇸', status: 'eliminated', qualifiedForKnockouts: true, wonGroup: true, isChampion: false },
      { teamId: 'USA', countryName: 'United States', group: 'A', flagEmoji: '🇺🇸', status: 'eliminated', qualifiedForKnockouts: true, wonGroup: false, isChampion: false },
      { teamId: 'JPN', countryName: 'Japan', group: 'B', flagEmoji: '🇯🇵', status: 'eliminated', qualifiedForKnockouts: false, wonGroup: false, isChampion: false },
      { teamId: 'MAR', countryName: 'Morocco', group: 'C', flagEmoji: '🇲🇦', status: 'eliminated', qualifiedForKnockouts: true, wonGroup: true, isChampion: false },
      { teamId: 'GHA', countryName: 'Ghana', group: 'D', flagEmoji: '🇬🇭', status: 'eliminated', qualifiedForKnockouts: false, wonGroup: false, isChampion: false }
    ],
    matches: [
      { matchId: 'sim-001', stage: WC_STAGE.GROUP, group: 'A', homeTeamId: 'ARG', awayTeamId: 'USA', homeScore: 2, awayScore: 1, status: WC_MATCH_STATUS.FINAL, winnerTeamId: 'ARG', decidedByPens: false, kickoffUtc: '2026-06-11T20:00:00Z', lastUpdatedUtc: '2026-06-11T22:00:00Z', manualOverride: false },
      { matchId: 'sim-002', stage: WC_STAGE.GROUP, group: 'B', homeTeamId: 'FRA', awayTeamId: 'JPN', homeScore: 0, awayScore: 0, status: WC_MATCH_STATUS.FINAL, winnerTeamId: '', decidedByPens: false, kickoffUtc: '2026-06-12T20:00:00Z', lastUpdatedUtc: '2026-06-12T22:00:00Z', manualOverride: false },
      { matchId: 'sim-003', stage: WC_STAGE.GROUP, group: 'C', homeTeamId: 'BRA', awayTeamId: 'MAR', homeScore: 3, awayScore: 3, status: WC_MATCH_STATUS.FINAL, winnerTeamId: '', decidedByPens: false, kickoffUtc: '2026-06-13T20:00:00Z', lastUpdatedUtc: '2026-06-13T22:00:00Z', manualOverride: false },
      { matchId: 'sim-004', stage: WC_STAGE.ROUND_OF_32, group: '', homeTeamId: 'ARG', awayTeamId: 'BRA', homeScore: 1, awayScore: 0, status: WC_MATCH_STATUS.FINAL, winnerTeamId: 'ARG', decidedByPens: false, kickoffUtc: '2026-07-01T20:00:00Z', lastUpdatedUtc: '2026-07-01T22:00:00Z', manualOverride: false },
      { matchId: 'sim-005', stage: WC_STAGE.FINAL, group: '', homeTeamId: 'ARG', awayTeamId: 'FRA', homeScore: 2, awayScore: 1, status: WC_MATCH_STATUS.FINAL, winnerTeamId: 'ARG', decidedByPens: false, kickoffUtc: '2026-07-19T20:00:00Z', lastUpdatedUtc: '2026-07-19T22:00:00Z', manualOverride: false }
    ],
    events: [
      { eventId: 'sim-event-001', matchId: 'sim-001', teamId: 'USA', eventType: WC_EVENT_TYPE.RED_CARD, minute: 72, count: 1, notes: 'Simulation red card', source: 'simulation' },
      { eventId: 'sim-event-002', matchId: 'sim-003', teamId: 'BRA', eventType: WC_EVENT_TYPE.RED_CARD, minute: 88, count: 1, notes: 'Simulation red card', source: 'simulation' }
    ]
  };
}

function loadSimulationData() {
  setupSheets();
  var data = getSimulationData();
  writeTable_(WC_SHEETS.MANAGERS, WC_HEADERS.Managers, data.managers);
  writeTable_(WC_SHEETS.ROSTERS, WC_HEADERS.Rosters, data.rosters);
  writeTable_(WC_SHEETS.TEAMS, WC_HEADERS.Teams, data.teams);
  writeTable_(WC_SHEETS.MATCHES, WC_HEADERS.Matches, data.matches);
  writeTable_(WC_SHEETS.MATCH_EVENTS, WC_HEADERS.MatchEvents, data.events);
  rebuildScoringOutputs();
  appendSyncLog_('info', 'loadSimulationData', 'Simulation data loaded.', '');
}

function runSimulationScoringSelfCheck() {
  var data = getSimulationData();
  var ledger = buildScoringLedger(data);
  var standings = buildStandings(data, ledger);
  return {
    ledgerRowCount: ledger.length,
    standings: standings,
    leader: standings.length ? standings[0] : null
  };
}

function assertSimulationScoringSelfCheck() {
  var result = runSimulationScoringSelfCheck();
  var expectedTotals = {
    m01: 10,
    m02: 2,
    m03: 3.25,
    m04: 1.5
  };

  result.standings.forEach(function (row) {
    var expected = expectedTotals[row.managerId];
    if (expected === undefined) {
      throw new Error('Unexpected manager in standings: ' + row.managerId);
    }
    if (row.totalPoints !== expected) {
      throw new Error('Expected ' + row.managerId + ' to have ' + expected + ' points, got ' + row.totalPoints);
    }
  });

  if (result.ledgerRowCount !== 37) {
    throw new Error('Expected 37 ledger rows, got ' + result.ledgerRowCount);
  }

  return 'Simulation scoring self-check passed.';
}
