function getFantasySpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureSheet_(spreadsheet, sheetName, headers) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var hasHeaders = firstRow.some(function (value) {
    return value !== '';
  });

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function setupSheets() {
  var spreadsheet = getFantasySpreadsheet_();
  Object.keys(WC_HEADERS).forEach(function (sheetName) {
    ensureSheet_(spreadsheet, sheetName, WC_HEADERS[sheetName]);
  });

  var settingsSheet = spreadsheet.getSheetByName(WC_SHEETS.SETTINGS);
  if (settingsSheet.getLastRow() <= 1) {
    settingsSheet.getRange(2, 1, WC_DEFAULT_SETTINGS.length, WC_DEFAULT_SETTINGS[0].length).setValues(WC_DEFAULT_SETTINGS);
  }

  appendSyncLog_('info', 'setupSheets', 'Sheet skeleton verified.', '');
}

function readTable_(sheetName) {
  var sheet = getFantasySpreadsheet_().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }

  var values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  var headers = values.shift();
  return values
    .filter(function (row) {
      return row.some(function (value) {
        return value !== '';
      });
    })
    .map(function (row) {
      var objectRow = {};
      headers.forEach(function (header, index) {
        objectRow[header] = row[index];
      });
      return objectRow;
    });
}

function writeTable_(sheetName, headers, rows) {
  var spreadsheet = getFantasySpreadsheet_();
  var sheet = ensureSheet_(spreadsheet, sheetName, headers);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);

  if (rows.length > 0) {
    var values = rows.map(function (row) {
      return headers.map(function (header) {
        return row[header] === undefined ? '' : row[header];
      });
    });
    sheet.getRange(2, 1, values.length, headers.length).setValues(values);
  }
}

function readLeagueData() {
  return {
    managers: readTable_(WC_SHEETS.MANAGERS),
    rosters: readTable_(WC_SHEETS.ROSTERS),
    teams: readTable_(WC_SHEETS.TEAMS),
    matches: readTable_(WC_SHEETS.MATCHES),
    events: readTable_(WC_SHEETS.MATCH_EVENTS)
  };
}

function writeScoringOutputs(ledger, standings) {
  writeTable_(WC_SHEETS.SCORING_LEDGER, WC_HEADERS.ScoringLedger, ledger);
  writeTable_(WC_SHEETS.STANDINGS, WC_HEADERS.Standings, standings);
}

function appendSyncLog_(level, action, message, details) {
  var spreadsheet = getFantasySpreadsheet_();
  var sheet = ensureSheet_(spreadsheet, WC_SHEETS.SYNC_LOG, WC_HEADERS.SyncLog);
  sheet.appendRow([
    new Date().toISOString(),
    level,
    action,
    message,
    details || ''
  ]);
}

function readSettingsMap_() {
  var settings = readTable_(WC_SHEETS.SETTINGS);
  var map = {};
  settings.forEach(function (row) {
    map[row.key] = row.value;
  });
  return map;
}
