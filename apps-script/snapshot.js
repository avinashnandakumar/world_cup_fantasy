function buildSnapshot(data, ledger, standings) {
  var settings = readSettingsMap_();
  var generatedAtUtc = new Date().toISOString();
  var roastFeed = buildRoastSnapshot_(data.roasts || []);
  return {
    meta: {
      leagueName: settings.leagueName || 'World Cup Fantasy League',
      mode: settings.mode || 'simulation',
      generatedAtUtc: generatedAtUtc,
      lastExternalSyncAtUtc: settings.lastExternalSyncAtUtc || '',
      scoringRules: WC_SCORING_RULES
    },
    standings: standings,
    managers: data.managers || [],
    rosters: data.rosters || [],
    teams: data.teams || [],
    matches: data.matches || [],
    events: data.events || [],
    ledger: ledger || [],
    roasts: roastFeed
  };
}

function buildRoastSnapshot_(rows) {
  var activeRows = (rows || [])
    .filter(function (row) {
      return String(row.status || 'active').toLowerCase() === 'active';
    })
    .map(normalizeRoastSnapshotRow_)
    .sort(function (a, b) {
      var generatedCompare = String(b.generatedAtUtc || '').localeCompare(String(a.generatedAtUtc || ''));
      if (generatedCompare !== 0) {
        return generatedCompare;
      }
      return String(b.roastId || '').localeCompare(String(a.roastId || ''));
    });

  var latestBatchId = activeRows.length ? activeRows[0].batchId : '';
  var latestBatch = latestBatchId ? activeRows.filter(function (row) {
    return row.batchId === latestBatchId;
  }) : [];
  var todayKey = localDateKey_(new Date());
  var todayArchive = activeRows.filter(function (row) {
    return localDateKey_(row.generatedAtUtc) === todayKey;
  });

  return {
    latestBatch: latestBatch,
    todayArchive: todayArchive
  };
}

function normalizeRoastSnapshotRow_(row) {
  return {
    roastId: String(row.roastId || ''),
    batchId: String(row.batchId || ''),
    generatedAtUtc: isoString_(row.generatedAtUtc),
    slotLocal: String(row.slotLocal || ''),
    targetType: String(row.targetType || ''),
    targetId: String(row.targetId || ''),
    managerId: String(row.managerId || ''),
    matchId: String(row.matchId || ''),
    teamIds: parseTeamIds_(row.teamIds),
    severity: String(row.severity || 'spicy'),
    text: String(row.text || ''),
    evidence: String(row.evidence || ''),
    sourceSnapshotGeneratedAtUtc: isoString_(row.sourceSnapshotGeneratedAtUtc),
    status: String(row.status || 'active')
  };
}

function parseTeamIds_(value) {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  return String(value || '')
    .split(',')
    .map(function (item) {
      return item.trim();
    })
    .filter(Boolean);
}

function isoString_(value) {
  if (!value) {
    return '';
  }
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return value.toISOString();
  }
  return String(value);
}

function localDateKey_(value) {
  var date = value ? new Date(value) : new Date();
  if (isNaN(date.getTime())) {
    return '';
  }
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function getSnapshotObject() {
  var data = readLeagueData();
  var ledger = buildScoringLedger(data);
  var standings = buildStandings(data, ledger);
  return buildSnapshot(data, ledger, standings);
}

function doGet(event) {
  var path = event && event.parameter && event.parameter.endpoint ? event.parameter.endpoint : 'snapshot';
  var snapshot = getSnapshotObject();
  var payload;

  if (path === 'standings') {
    payload = snapshot.standings;
  } else if (path === 'managers') {
    payload = snapshot.managers;
  } else if (path === 'matches') {
    payload = snapshot.matches;
  } else if (path === 'events') {
    payload = snapshot.events;
  } else if (path === 'ledger') {
    payload = snapshot.ledger;
  } else if (path === 'roasts') {
    payload = snapshot.roasts;
  } else if (path === 'rules') {
    payload = {
      scoringRules: WC_SCORING_RULES,
      notes: [
        'Draw points apply only during the group stage.',
        'Penalty shootout goals do not count as goals scored.',
        'There are no knockout advancement bonuses.'
      ]
    };
  } else {
    payload = snapshot;
  }

  return ContentService
    .createTextOutput(JSON.stringify({
      debug: true,
      path: path,
      snapshotKeys: Object.keys(snapshot),
      payloadType: Array.isArray(payload) ? 'array' : typeof payload,
      payloadKeys: payload && !Array.isArray(payload) && typeof payload === 'object' ? Object.keys(payload) : [],
      payload: payload
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
