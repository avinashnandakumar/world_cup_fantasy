function buildSnapshot(data, ledger, standings) {
  var settings = readSettingsMap_();
  var generatedAtUtc = new Date().toISOString();
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
    ledger: ledger || []
  };
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
  } else if (path === 'ledger') {
    payload = snapshot.ledger;
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
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
