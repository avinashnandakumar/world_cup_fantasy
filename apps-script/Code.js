function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('World Cup Fantasy')
    .addItem('Set up sheets', 'setupSheets')
    .addItem('Load simulation data', 'loadSimulationData')
    .addItem('Sync fake API data', 'syncFakeApiData')
    .addItem('Rebuild scoring outputs', 'rebuildScoringOutputs')
    .addItem('Install minute trigger', 'installMinuteTrigger')
    .addToUi();
}

function rebuildScoringOutputs() {
  var data = readLeagueData();
  var ledger = buildScoringLedger(data);
  var standings = buildStandings(data, ledger);
  writeScoringOutputs(ledger, standings);
  appendSyncLog_('info', 'rebuildScoringOutputs', 'Scoring ledger and standings rebuilt.', 'ledgerRows=' + ledger.length);
  return {
    ledgerRows: ledger.length,
    standingsRows: standings.length
  };
}

function syncFromConfiguredSource() {
  var settings = readSettingsMap_();
  if ((settings.mode || 'simulation') === 'simulation') {
    rebuildScoringOutputs();
    appendSyncLog_('info', 'syncFromConfiguredSource', 'Simulation mode sync rebuilt scoring outputs.', '');
    return;
  }

  appendSyncLog_(
    'warning',
    'syncFromConfiguredSource',
    'Real API sync is not implemented yet.',
    'Set mode=simulation or add provider client.'
  );
}

function installMinuteTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'syncFromConfiguredSource') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('syncFromConfiguredSource')
    .timeBased()
    .everyMinutes(1)
    .create();

  appendSyncLog_('info', 'installMinuteTrigger', 'Installed 1-minute sync trigger.', '');
}

function removeSyncTriggers() {
  var removed = 0;
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'syncFromConfiguredSource') {
      ScriptApp.deleteTrigger(trigger);
      removed += 1;
    }
  });
  appendSyncLog_('info', 'removeSyncTriggers', 'Removed sync triggers.', 'removed=' + removed);
}
