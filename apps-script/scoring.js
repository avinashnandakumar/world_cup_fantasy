function isGroupStage_(stage) {
  return String(stage || '').toLowerCase() === WC_STAGE.GROUP;
}

function isAfterRoundOf32Start_(kickoffUtc) {
  return String(kickoffUtc || '').slice(0, 10) >= '2026-06-28';
}

function isScoredAsGroupStage_(match) {
  return isGroupStage_(match.stage) && !isAfterRoundOf32Start_(match.kickoffUtc);
}

function isFinalMatch_(match) {
  return String(match.status || '').toLowerCase() === WC_MATCH_STATUS.FINAL;
}

function isLiveMatch_(match) {
  return String(match.status || '').toLowerCase() === WC_MATCH_STATUS.LIVE;
}

function isScorableMatch_(match) {
  return isFinalMatch_(match) || isLiveMatch_(match);
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

function truthy_(value) {
  return value === true || String(value).toLowerCase() === 'true';
}

var WC_2026_GROUP_BY_TEAM = {
  mexico: 'A',
  'south-africa': 'A',
  'south-korea': 'A',
  'korea-republic': 'A',
  'czech-republic': 'A',
  czechia: 'A',
  canada: 'B',
  'bosnia-herzegovina': 'B',
  'bosnia-and-herzegovina': 'B',
  qatar: 'B',
  switzerland: 'B',
  brazil: 'C',
  morocco: 'C',
  haiti: 'C',
  scotland: 'C',
  usa: 'D',
  'united-states': 'D',
  paraguay: 'D',
  turkey: 'D',
  turkiye: 'D',
  australia: 'D',
  germany: 'E',
  curacao: 'E',
  'ivory-coast': 'E',
  'cote-d-ivoire': 'E',
  ecuador: 'E',
  netherlands: 'F',
  japan: 'F',
  sweden: 'F',
  tunisia: 'F',
  belgium: 'G',
  iran: 'G',
  egypt: 'G',
  'new-zealand': 'G',
  spain: 'H',
  'cape-verde': 'H',
  'cabo-verde': 'H',
  'saudi-arabia': 'H',
  uruguay: 'H',
  france: 'I',
  senegal: 'I',
  iraq: 'I',
  norway: 'I',
  argentina: 'J',
  algeria: 'J',
  austria: 'J',
  jordan: 'J',
  portugal: 'K',
  colombia: 'K',
  uzbekistan: 'K',
  'dr-congo': 'K',
  'congo-dr': 'K',
  england: 'L',
  croatia: 'L',
  ghana: 'L',
  panama: 'L'
};

function normalizeTeamId_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function worldCup2026GroupForTeam_(teamId, fallbackGroup) {
  return WC_2026_GROUP_BY_TEAM[normalizeTeamId_(teamId)] || fallbackGroup || '';
}

function groupForMatch_(match, teamById) {
  var homeGroup = worldCup2026GroupForTeam_(
    match.homeTeamId,
    teamById[match.homeTeamId] ? teamById[match.homeTeamId].group : ''
  );
  var awayGroup = worldCup2026GroupForTeam_(
    match.awayTeamId,
    teamById[match.awayTeamId] ? teamById[match.awayTeamId].group : ''
  );
  if (homeGroup && homeGroup === awayGroup) {
    return homeGroup;
  }
  return worldCup2026GroupForTeam_(match.homeTeamId, match.group)
    || worldCup2026GroupForTeam_(match.awayTeamId, match.group)
    || match.group
    || '';
}

function emptyGroupRow_(teamId) {
  return {
    teamId: teamId,
    played: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    rank: 0,
    qualifiesForKnockouts: false,
    wonGroup: false
  };
}

function applyGroupMatchToRow_(row, goalsFor, goalsAgainst) {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  if (goalsFor > goalsAgainst) {
    row.points += 3;
  } else if (goalsFor === goalsAgainst) {
    row.points += 1;
  }
}

function sortGroupRows_(a, b) {
  var goalDifferenceA = a.goalsFor - a.goalsAgainst;
  var goalDifferenceB = b.goalsFor - b.goalsAgainst;
  if (b.points !== a.points) {
    return b.points - a.points;
  }
  if (goalDifferenceB !== goalDifferenceA) {
    return goalDifferenceB - goalDifferenceA;
  }
  if (b.goalsFor !== a.goalsFor) {
    return b.goalsFor - a.goalsFor;
  }
  return String(a.teamId || '').localeCompare(String(b.teamId || ''));
}

function expectedGroupMatchCount_(teamCount) {
  return teamCount > 1 ? teamCount * (teamCount - 1) / 2 : 0;
}

function buildDerivedGroupBonusLookup_(teams, matches) {
  var teamById = {};
  var groups = {};
  var completeGroups = [];
  var lookup = {};

  teams.forEach(function (team) {
    teamById[team.teamId] = team;
    var group = worldCup2026GroupForTeam_(team.teamId, team.group);
    if (!group) {
      return;
    }
    if (!groups[group]) {
      groups[group] = {
        group: group,
        rows: {},
        finalMatches: 0,
        complete: false
      };
    }
    groups[group].rows[team.teamId] = emptyGroupRow_(team.teamId);
  });

  matches.forEach(function (match) {
    if (!isGroupStage_(match.stage) || !isFinalMatch_(match)) {
      return;
    }
    var group = groupForMatch_(match, teamById);
    if (!group) {
      return;
    }
    if (!groups[group]) {
      groups[group] = {
        group: group,
        rows: {},
        finalMatches: 0,
        complete: false
      };
    }
    if (!groups[group].rows[match.homeTeamId]) {
      groups[group].rows[match.homeTeamId] = emptyGroupRow_(match.homeTeamId);
    }
    if (!groups[group].rows[match.awayTeamId]) {
      groups[group].rows[match.awayTeamId] = emptyGroupRow_(match.awayTeamId);
    }

    applyGroupMatchToRow_(
      groups[group].rows[match.homeTeamId],
      numberOrZero_(match.homeScore),
      numberOrZero_(match.awayScore)
    );
    applyGroupMatchToRow_(
      groups[group].rows[match.awayTeamId],
      numberOrZero_(match.awayScore),
      numberOrZero_(match.homeScore)
    );
    groups[group].finalMatches += 1;
  });

  Object.keys(groups).forEach(function (groupKey) {
    var group = groups[groupKey];
    var rows = Object.keys(group.rows).map(function (teamId) {
      return group.rows[teamId];
    });
    var expectedMatchCount = expectedGroupMatchCount_(rows.length);
    group.complete = rows.length >= 4 && expectedMatchCount > 0 && group.finalMatches >= expectedMatchCount;
    rows.sort(sortGroupRows_).forEach(function (row, index) {
      row.rank = index + 1;
      row.wonGroup = group.complete && row.rank === 1;
      row.qualifiesForKnockouts = group.complete && row.rank <= 2;
    });
    group.sortedRows = rows;
    if (group.complete) {
      completeGroups.push(group);
    }
  });

  if (completeGroups.length === Object.keys(groups).length && completeGroups.length > 0) {
    var thirdPlaceRows = [];
    completeGroups.forEach(function (group) {
      var third = group.sortedRows.filter(function (row) {
        return row.rank === 3;
      })[0];
      if (third) {
        thirdPlaceRows.push(third);
      }
    });
    thirdPlaceRows.sort(sortGroupRows_).slice(0, 8).forEach(function (row) {
      row.qualifiesForKnockouts = true;
    });
  }

  completeGroups.forEach(function (group) {
    group.sortedRows.forEach(function (row) {
      lookup[row.teamId] = {
        qualifiesForKnockouts: row.qualifiesForKnockouts,
        wonGroup: row.wonGroup
      };
    });
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
  if (!isScorableMatch_(match)) {
    return [];
  }

  var isHome = teamId === match.homeTeamId;
  var goalsFor = numberOrZero_(isHome ? match.homeScore : match.awayScore);
  var goalsAgainst = numberOrZero_(isHome ? match.awayScore : match.homeScore);
  var rows = [];
  var isFinal = isFinalMatch_(match);

  if (isFinal && match.winnerTeamId === teamId) {
    rows.push({
      category: 'win',
      points: WC_SCORING_RULES.WIN,
      quantity: 1,
      explanation: 'Match win'
    });
  } else if (isFinal && isScoredAsGroupStage_(match) && goalsFor === goalsAgainst) {
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

  if (isFinal && goalsAgainst === 0) {
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
  var derivedGroupBonusLookup = buildDerivedGroupBonusLookup_(teams, matches);
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
    var derivedBonus = derivedGroupBonusLookup[team.teamId] || {};
    managerIds.forEach(function (managerId) {
      if (truthy_(team.qualifiedForKnockouts) || derivedBonus.qualifiesForKnockouts) {
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

      if (truthy_(team.wonGroup) || derivedBonus.wonGroup) {
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
  var bonusTotals = {};
  var now = new Date().toISOString();

  managers.forEach(function (manager) {
    totals[manager.managerId] = 0;
    bonusTotals[manager.managerId] = 0;
  });

  ledger.forEach(function (row) {
    totals[row.managerId] = (totals[row.managerId] || 0) + numberOrZero_(row.points);
    if (row.category === 'qualify_for_knockouts' || row.category === 'win_group' || row.category === 'champion') {
      bonusTotals[row.managerId] = (bonusTotals[row.managerId] || 0) + numberOrZero_(row.points);
    }
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
      bonus: Math.round((bonusTotals[manager.managerId] || 0) * 100) / 100,
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
