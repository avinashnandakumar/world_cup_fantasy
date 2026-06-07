function fetchFakeWorldCupApiPayload() {
  return {
    provider: 'fake-world-cup-api',
    fetchedAtUtc: new Date().toISOString(),
    matches: [
      {
        id: 'fake-api-001',
        phase: 'GROUP',
        group: 'A',
        home: 'ARG',
        away: 'USA',
        homeGoals: 2,
        awayGoals: 1,
        state: 'FINAL',
        winner: 'ARG',
        penalties: false,
        kickoffUtc: '2026-06-11T20:00:00Z',
        updatedUtc: '2026-06-11T22:00:00Z',
        redCards: [
          { team: 'USA', minute: 72 }
        ]
      }
    ]
  };
}

function normalizeStage_(providerStage) {
  var value = String(providerStage || '').toLowerCase();
  var map = {
    group: WC_STAGE.GROUP,
    round_of_32: WC_STAGE.ROUND_OF_32,
    r32: WC_STAGE.ROUND_OF_32,
    round_of_16: WC_STAGE.ROUND_OF_16,
    r16: WC_STAGE.ROUND_OF_16,
    quarterfinal: WC_STAGE.QUARTERFINAL,
    semifinal: WC_STAGE.SEMIFINAL,
    final: WC_STAGE.FINAL
  };
  return map[value] || value;
}

function normalizeMatchStatus_(providerStatus) {
  var value = String(providerStatus || '').toLowerCase();
  if (value === 'final' || value === 'finished' || value === 'complete') {
    return WC_MATCH_STATUS.FINAL;
  }
  if (value === 'live' || value === 'in_progress' || value === 'playing') {
    return WC_MATCH_STATUS.LIVE;
  }
  if (value === 'postponed') {
    return WC_MATCH_STATUS.POSTPONED;
  }
  return value || WC_MATCH_STATUS.SCHEDULED;
}

function normalizeApiPayload(payload) {
  var matches = [];
  var events = [];
  var source = payload.provider || 'unknown-api';

  (payload.matches || []).forEach(function (item) {
    var matchId = String(item.id);
    matches.push({
      matchId: matchId,
      stage: normalizeStage_(item.phase),
      group: item.group || '',
      homeTeamId: item.home,
      awayTeamId: item.away,
      homeScore: numberOrZero_(item.homeGoals),
      awayScore: numberOrZero_(item.awayGoals),
      status: normalizeMatchStatus_(item.state),
      winnerTeamId: item.winner || '',
      decidedByPens: item.penalties === true,
      kickoffUtc: item.kickoffUtc || '',
      lastUpdatedUtc: item.updatedUtc || payload.fetchedAtUtc || new Date().toISOString(),
      manualOverride: false
    });

    (item.redCards || []).forEach(function (card, index) {
      events.push({
        eventId: [matchId, 'red-card', card.team, index + 1].join('::'),
        matchId: matchId,
        teamId: card.team,
        eventType: WC_EVENT_TYPE.RED_CARD,
        minute: card.minute || '',
        count: 1,
        notes: 'Normalized red card',
        source: source
      });
    });
  });

  return {
    matches: matches,
    events: events
  };
}

function syncFakeApiData() {
  setupSheets();
  var normalized = normalizeApiPayload(fetchFakeWorldCupApiPayload());
  writeTable_(WC_SHEETS.MATCHES, WC_HEADERS.Matches, normalized.matches);
  writeTable_(WC_SHEETS.MATCH_EVENTS, WC_HEADERS.MatchEvents, normalized.events);
  rebuildScoringOutputs();
  appendSyncLog_('info', 'syncFakeApiData', 'Fake API payload normalized and scored.', 'matches=' + normalized.matches.length);
}
