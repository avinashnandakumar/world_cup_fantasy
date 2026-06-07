var WC_SHEETS = {
  SETTINGS: 'Settings',
  MANAGERS: 'Managers',
  ROSTERS: 'Rosters',
  TEAMS: 'Teams',
  MATCHES: 'Matches',
  MATCH_EVENTS: 'MatchEvents',
  SCORING_LEDGER: 'ScoringLedger',
  STANDINGS: 'Standings',
  SYNC_LOG: 'SyncLog'
};

var WC_HEADERS = {
  Settings: ['key', 'value', 'notes'],
  Managers: ['managerId', 'displayName', 'color', 'icon', 'active'],
  Rosters: ['managerId', 'teamId', 'draftSlot', 'notes'],
  Teams: [
    'teamId',
    'countryName',
    'group',
    'flagEmoji',
    'status',
    'qualifiedForKnockouts',
    'wonGroup',
    'isChampion'
  ],
  Matches: [
    'matchId',
    'stage',
    'group',
    'homeTeamId',
    'awayTeamId',
    'homeScore',
    'awayScore',
    'status',
    'winnerTeamId',
    'decidedByPens',
    'kickoffUtc',
    'lastUpdatedUtc',
    'manualOverride'
  ],
  MatchEvents: [
    'eventId',
    'matchId',
    'teamId',
    'eventType',
    'minute',
    'count',
    'notes',
    'source'
  ],
  ScoringLedger: [
    'ledgerId',
    'managerId',
    'teamId',
    'matchId',
    'stage',
    'category',
    'points',
    'quantity',
    'explanation',
    'source',
    'createdAtUtc'
  ],
  Standings: [
    'rank',
    'managerId',
    'displayName',
    'totalPoints',
    'countryCount',
    'aliveCount',
    'eliminatedCount',
    'lastUpdatedUtc'
  ],
  SyncLog: ['loggedAtUtc', 'level', 'action', 'message', 'details']
};

var WC_SCORING_RULES = {
  WIN: 1,
  GROUP_DRAW: 0.5,
  GOAL_SCORED: 0.5,
  GOAL_ALLOWED: -0.25,
  CLEAN_SHEET: 0.5,
  RED_CARD: -1,
  QUALIFY_FOR_KNOCKOUTS: 0.5,
  WIN_GROUP: 1,
  CHAMPION: 2
};

var WC_STAGE = {
  GROUP: 'group',
  ROUND_OF_32: 'round_of_32',
  ROUND_OF_16: 'round_of_16',
  QUARTERFINAL: 'quarterfinal',
  SEMIFINAL: 'semifinal',
  FINAL: 'final'
};

var WC_MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINAL: 'final',
  POSTPONED: 'postponed'
};

var WC_EVENT_TYPE = {
  GOAL: 'goal',
  RED_CARD: 'red_card'
};

var WC_DEFAULT_SETTINGS = [
  ['leagueName', 'World Cup Fantasy League', 'Displayed on dashboard snapshots.'],
  ['mode', 'simulation', 'Use simulation until a real API provider is connected.'],
  ['apiProvider', '', 'Future real data provider name.'],
  ['apiBaseUrl', '', 'Future real data provider base URL.'],
  ['lastSnapshotGeneratedAtUtc', '', 'Managed by Apps Script.']
];
