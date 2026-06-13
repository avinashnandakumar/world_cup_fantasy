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

function doPost(event) {
  try {
    var payload = JSON.parse(event.postData && event.postData.contents ? event.postData.contents : '{}');
    var result = applyExternalMatchSyncPayload_(payload);
    return createJsonResponse_(result);
  } catch (error) {
    appendSyncLog_('error', 'doPost', 'External sync failed.', error.message || String(error));
    return createJsonResponse_({
      ok: false,
      error: error.message || String(error)
    });
  }
}

function applyExternalMatchSyncPayload_(payload) {
  setupSheets();
  validateExternalSyncToken_(payload.token);

  var matches = payload.matches || [];
  var events = payload.events || [];
  if (!Array.isArray(matches) || !Array.isArray(events)) {
    throw new Error('Payload must include matches and events arrays.');
  }

  var mergedMatches = mergeExternalMatches_(matches);
  var mergedEvents = mergeExternalEvents_(events, payload.redCardScrapingEnabled === false);
  writeTable_(WC_SHEETS.MATCHES, WC_HEADERS.Matches, mergedMatches);
  writeTable_(WC_SHEETS.MATCH_EVENTS, WC_HEADERS.MatchEvents, mergedEvents);
  var rebuildResult = rebuildScoringOutputs();

  appendSyncLog_(
    'info',
    'externalMatchSync',
    'External match sync applied.',
    'source=' + (payload.source || 'unknown') + ', matches=' + mergedMatches.length + ', events=' + mergedEvents.length
  );

  return {
    ok: true,
    matches: mergedMatches.length,
    events: mergedEvents.length,
    ledgerRows: rebuildResult.ledgerRows,
    standingsRows: rebuildResult.standingsRows,
    receivedAtUtc: new Date().toISOString()
  };
}

function validateExternalSyncToken_(token) {
  var expected = getExternalSyncToken_();
  if (!expected) {
    throw new Error('Missing externalSyncToken. Set it in Script Properties or Settings.');
  }
  if (String(token || '') !== String(expected)) {
    throw new Error('Invalid external sync token.');
  }
}

function getExternalSyncToken_() {
  var propertyToken = PropertiesService.getScriptProperties().getProperty('EXTERNAL_SYNC_TOKEN');
  if (propertyToken) {
    return propertyToken;
  }
  var settings = readSettingsMap_();
  return settings.externalSyncToken || '';
}

function mergeExternalMatches_(incomingMatches) {
  var existing = readTable_(WC_SHEETS.MATCHES);
  var existingById = {};
  existing.forEach(function (row) {
    existingById[row.matchId] = row;
  });

  var seen = {};
  var rows = incomingMatches.map(function (match) {
    var existingRow = existingById[match.matchId];
    seen[match.matchId] = true;
    if (existingRow && isTruthy_(existingRow.manualOverride)) {
      return existingRow;
    }
    return normalizeExternalMatchRow_(match);
  });

  existing.forEach(function (row) {
    if (!seen[row.matchId]) {
      rows.push(row);
    }
  });

  return rows.sort(function (a, b) {
    var aKickoff = String(a.kickoffUtc || '');
    var bKickoff = String(b.kickoffUtc || '');
    if (aKickoff !== bKickoff) {
      return aKickoff < bKickoff ? -1 : 1;
    }
    return String(a.matchId || '').localeCompare(String(b.matchId || ''));
  });
}

function mergeExternalEvents_(incomingEvents, removeExternalRedCards) {
  var existing = readTable_(WC_SHEETS.MATCH_EVENTS);
  var byId = {};

  existing.forEach(function (row) {
    if (removeExternalRedCards && isExternalRedCardEvent_(row)) {
      return;
    }
    if (row.eventId) {
      byId[row.eventId] = row;
    }
  });

  incomingEvents.forEach(function (event) {
    var normalized = normalizeExternalEventRow_(event);
    if (removeExternalRedCards && isExternalRedCardEvent_(normalized)) {
      return;
    }
    var existingRow = byId[normalized.eventId];
    if (existingRow && String(existingRow.source || '').toLowerCase() === 'manual') {
      return;
    }
    byId[normalized.eventId] = normalized;
  });

  return Object.keys(byId).map(function (eventId) {
    return byId[eventId];
  }).sort(function (a, b) {
    var matchCompare = String(a.matchId || '').localeCompare(String(b.matchId || ''));
    if (matchCompare !== 0) {
      return matchCompare;
    }
    return String(a.eventId || '').localeCompare(String(b.eventId || ''));
  });
}

function isExternalRedCardEvent_(event) {
  var source = String(event.source || '').toLowerCase();
  return event.eventType === WC_EVENT_TYPE.RED_CARD && source !== 'manual';
}

function normalizeExternalMatchRow_(match) {
  return {
    matchId: String(match.matchId || ''),
    stage: normalizeStage_(match.stage),
    group: match.group || '',
    homeTeamId: match.homeTeamId || '',
    awayTeamId: match.awayTeamId || '',
    homeScore: match.homeScore === null || match.homeScore === undefined ? '' : Number(match.homeScore),
    awayScore: match.awayScore === null || match.awayScore === undefined ? '' : Number(match.awayScore),
    status: normalizeMatchStatus_(match.status),
    winnerTeamId: match.winnerTeamId || '',
    decidedByPens: match.decidedByPens === true,
    kickoffUtc: match.kickoffUtc || '',
    lastUpdatedUtc: match.lastUpdatedUtc || new Date().toISOString(),
    manualOverride: false
  };
}

function normalizeExternalEventRow_(event) {
  return {
    eventId: String(event.eventId || ''),
    matchId: String(event.matchId || ''),
    teamId: event.teamId || '',
    eventType: event.eventType || '',
    minute: event.minute || '',
    count: event.count === undefined || event.count === '' ? 1 : Number(event.count),
    notes: event.notes || '',
    source: event.source || 'external-api'
  };
}

function isTruthy_(value) {
  return value === true || String(value).toLowerCase() === 'true';
}

function createJsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
