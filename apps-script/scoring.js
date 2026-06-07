function isGroupStage_(stage) {
  return String(stage || '').toLowerCase() === WC_STAGE.GROUP;
}

function isFinalMatch_(match) {
  return String(match.status || '').toLowerCase() === WC_MATCH_STATUS.FINAL;
}

function numberOrZero_(value) {
  var numberValue = Number(value);
  return isNaN(numberValue) ? 0 : numberValue;
}

function buildRosterLookup_(rosters) {
  var byTeamId = {};
  rosters.forEach(function (roster) {
    if (!byTeamId[roster.teamId]) {
      byTeamId[roster.teamId] = [];
    }
    byTeamId[roster.teamId].push(roster.managerId);
  });
  return byTeamId;
}

function buildRedCardCountLookup_(events) {
  var lookup = {};
  events.forEach(function (event) {
    if (event.eventType !== WC_EVENT_TYPE.RED_CARD) {
      return;
    }
    var key = event.matchId + '::' + event.teamId;
    lookup[key] = (lookup[key] || 0) + Math.max(1, numberOrZero_(event.count));
  });
  return lookup;
}

function createLedgerRow_(managerId, teamId, matchId, stage, category, points, quantity, explanation, source) {
  return {
    ledgerId: [matchId, managerId, teamId, category].join('::'),
    managerId: managerId,
    teamId: teamId,
    matchId: matchId || '',
    stage: stage || '',
    category: category,
    points: points,
    quantity: quantity,
    explanation: explanation,
    source: source || 'scoring-engine',
    createdAtUtc: new Date().toISOString()
  };
}

function scoreTeamInMatch_(match, teamId, redCardCount) {
  if (!isFinalMatch_(match)) {
    return [];
  }

  var isHome = teamId === match.homeTeamId;
  var goalsFor = numberOrZero_(isHome ? match.homeScore : match.awayScore);
  var goalsAgainst = numberOrZero_(isHome ? match.awayScore : match.homeScore);
  var rows = [];

  if (match.winnerTeamId === teamId) {
    rows.push({
      category: 'win',
      points: WC_SCORING_RULES.WIN,
      quantity: 1,
      explanation: 'Match win'
    });
  } else if (isGroupStage_(match.stage) && goalsFor === goalsAgainst) {
    rows.push({
      category: 'draw',
      points: WC_SCORING_RULES.GROUP_DRAW,
      quantity: 1,
      explanation: 'Group-stage draw'
    });
  }

  if (goalsFor > 0) {
    rows.push({
      category: 'goal_scored',
      points: goalsFor * WC_SCORING_RULES.GOAL_SCORED,
      quantity: goalsFor,
      explanation: goalsFor + ' goal(s) scored'
    });
  }

  if (goalsAgainst > 0) {
    rows.push({
      category: 'goal_allowed',
      points: goalsAgainst * WC_SCORING_RULES.GOAL_ALLOWED,
      quantity: goalsAgainst,
      explanation: goalsAgainst + ' goal(s) allowed'
    });
  }

  if (goalsAgainst === 0) {
    rows.push({
      category: 'clean_sheet',
      points: WC_SCORING_RULES.CLEAN_SHEET,
      quantity: 1,
      explanation: 'Clean sheet'
    });
  }

  if (redCardCount > 0) {
    rows.push({
      category: 'red_card',
      points: redCardCount * WC_SCORING_RULES.RED_CARD,
      quantity: redCardCount,
      explanation: redCardCount + ' red card(s)'
    });
  }

  return rows;
}

function buildScoringLedger(data) {
  var rosters = data.rosters || [];
  var matches = data.matches || [];
  var events = data.events || [];
  var teams = data.teams || [];
  var rosterLookup = buildRosterLookup_(rosters);
  var redCardLookup = buildRedCardCountLookup_(events);
  var ledger = [];

  matches.forEach(function (match) {
    [match.homeTeamId, match.awayTeamId].forEach(function (teamId) {
      var managerIds = rosterLookup[teamId] || [];
      var redCardCount = redCardLookup[match.matchId + '::' + teamId] || 0;
      var scoringRows = scoreTeamInMatch_(match, teamId, redCardCount);

      managerIds.forEach(function (managerId) {
        scoringRows.forEach(function (row) {
          ledger.push(createLedgerRow_(
            managerId,
            teamId,
            match.matchId,
            match.stage,
            row.category,
            row.points,
            row.quantity,
            row.explanation,
            'match'
          ));
        });
      });
    });
  });

  teams.forEach(function (team) {
    var managerIds = rosterLookup[team.teamId] || [];
    managerIds.forEach(function (managerId) {
      if (String(team.qualifiedForKnockouts).toLowerCase() === 'true' || team.qualifiedForKnockouts === true) {
        ledger.push(createLedgerRow_(
          managerId,
          team.teamId,
          '',
          WC_STAGE.GROUP,
          'qualify_for_knockouts',
          WC_SCORING_RULES.QUALIFY_FOR_KNOCKOUTS,
          1,
          'Qualified for knockout stage',
          'team-bonus'
        ));
      }

      if (String(team.wonGroup).toLowerCase() === 'true' || team.wonGroup === true) {
        ledger.push(createLedgerRow_(
          managerId,
          team.teamId,
          '',
          WC_STAGE.GROUP,
          'win_group',
          WC_SCORING_RULES.WIN_GROUP,
          1,
          'Won group',
          'team-bonus'
        ));
      }

      if (String(team.isChampion).toLowerCase() === 'true' || team.isChampion === true) {
        ledger.push(createLedgerRow_(
          managerId,
          team.teamId,
          '',
          WC_STAGE.FINAL,
          'champion',
          WC_SCORING_RULES.CHAMPION,
          1,
          'Won the World Cup',
          'tournament-bonus'
        ));
      }
    });
  });

  return ledger;
}

function buildStandings(data, ledger) {
  var managers = data.managers || [];
  var rosters = data.rosters || [];
  var teams = data.teams || [];
  var teamById = {};
  var totals = {};
  var now = new Date().toISOString();

  managers.forEach(function (manager) {
    totals[manager.managerId] = 0;
  });

  ledger.forEach(function (row) {
    totals[row.managerId] = (totals[row.managerId] || 0) + numberOrZero_(row.points);
  });

  teams.forEach(function (team) {
    teamById[team.teamId] = team;
  });

  var standings = managers.map(function (manager) {
    var managerRosters = rosters.filter(function (roster) {
      return roster.managerId === manager.managerId;
    });
    var aliveCount = managerRosters.filter(function (roster) {
      var team = teamById[roster.teamId] || {};
      return String(team.status || '').toLowerCase() !== 'eliminated';
    }).length;

    return {
      rank: 0,
      managerId: manager.managerId,
      displayName: manager.displayName,
      totalPoints: Math.round((totals[manager.managerId] || 0) * 100) / 100,
      countryCount: managerRosters.length,
      aliveCount: aliveCount,
      eliminatedCount: managerRosters.length - aliveCount,
      lastUpdatedUtc: now
    };
  });

  standings.sort(function (a, b) {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return String(a.displayName).localeCompare(String(b.displayName));
  });

  standings.forEach(function (row, index) {
    row.rank = index + 1;
  });

  return standings;
}
