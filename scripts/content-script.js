let CACHE = {
  startDate: "",
  endDate: "",
  isWeeklyLeague: "",
  showExpectedStats: "true",
  showGames: "true",
  showLinks: "true",
  expectedStatsSeason: ""
}

let PLAYER_AVG_STATS = {};
let NHL_TEAMS = {};
let SKATER_CATS_ALL = [ "Goals",
                        "Assists",
                        "Plus/Minus",
                        "Penalty Minutes",
                        "Powerplay Goals",
                        "Powerplay Assists",
                        "Powerplay Points",
                        "Shorthanded Goals",
                        "Shorthanded Assists",
                        "Shorthanded Points",
                        "Game-Winning Goals",
                        "Shots on Goal",
                        "Faceoffs Won",
                        "Hits",
                        "Blocks"
                  ];
let GOALIE_CATS_ALL = [ "Wins",
                        "Goals Against Average",
                        "Saves",
                        "Save Percentage",
                        "Shutouts"
                      ];
let SKATER_CATS = [];
let GOALIE_CATS = [];
const yahooToNhlCatNames = {
                    "Goals" : "goals",
                    "Assists": "assists",
                    "Plus/Minus": "plusMinus",
                    "Penalty Minutes": "pim",
                    "Powerplay Goals": "powerPlayGoals",
                    "Powerplay Points": "powerPlayPoints",
                    "Shorthanded Goals": "shortHandedGoals",
                    "Shorthanded Points": "shortHandedPoints",
                    "Game-Winning Goals": "gameWinningGoals",
                    "Shots on Goal": "shots",
                    // Note: No faceoff won count in nhl api
                    "Hits": "hits",
                    "Blocks": "blocked",
                    "Wins": "wins",
                    "Goals Against Average": "goalAgainstAverage",
                    "Saves": "saves",
                    "Save Percentage": "savePercentage",
                    "Shutouts": "shutouts"
}
const yahooToShortCatNames = {
                    "Goals" : "G",
                    "Assists": "A",
                    "Plus/Minus": "+/-",
                    "Penalty Minutes": "PIM",
                    "Powerplay Goals": "PPG",
                    "Powerplay Points": "PPP",
                    "Shorthanded Goals": "SHG",
                    "Shorthanded Points": "SHP",
                    "Game-Winning Goals": "GWG",
                    "Shots on Goal": "SOG",
                    // Note: No faceoff won count in nhl api
                    "Hits": "HIT",
                    "Blocks": "BLK",
                    "Wins": "W",
                    "Goals Against Average": "GAA",
                    "Saves": "SV",
                    "Save Percentage": "SV%",
                    "Shutouts": "SHO"
}


init();

async function init() {
  const players = document.querySelectorAll(".ysf-player-name");
  loadCache();

  // fetch data on first initialization
  if (Object.keys(NHL_TEAMS).length === 0) {
    console.debug("Initializing teams");
    await initTeams();
    await getTeamSchedules();
  }
  updateLeagueCategories(); // league categories can change without a fresh reload (stats page of only skaters or goalies)
  console.debug("NHL Teams: ", NHL_TEAMS);

  if (players) {
    players.forEach((player) => updatePlayer(player));
  }
}

async function initTeams() {
  const url = 'https://statsapi.web.nhl.com/api/v1/teams'
  await fetch(url)
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    for (let teamData of data['teams']) {
      if (!NHL_TEAMS[teamData['id']]) {
        NHL_TEAMS[teamData['id']] = new Map();
      }
      NHL_TEAMS[teamData['id']]['abbreviation'] = teamData['abbreviation'].toUpperCase();
      NHL_TEAMS[teamData['id']]['urlname'] = normalizeStr(teamData['name']).replace(/\s+/g,'-').replace(/\./g,'').toLowerCase();
      NHL_TEAMS[teamData['id']]['games'] = 0;
    }
  });
}

function loadCache() {
  for (const key in CACHE) {
    chrome.storage.sync.get(`${key}`, function(result) {
      if (result[key] !== undefined) {
        CACHE[key] = result[key];
        console.debug(`Loading cache: ${key}: ${result[key]}`);
      }
    })
  }
}

// populate NHL_TEAMS with schedule data
async function getTeamSchedules() {
  let startDate = CACHE.startDate;
  let endDate = CACHE.endDate;
  let today = new Date();
  if (!startDate) {
    if (CACHE.isWeeklyLeague) {
      startDate = new Date();
      startDate.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // most recent Monday
    } else {
      startDate = today;
    }
    startDate = startDate.getFullYear() + "-" + String((startDate.getMonth() + 1)).padStart(2, '0') + "-" + String(startDate.getDate()).padStart(2, '0');
  }
  if (!endDate) {
    endDate = new Date();
    endDate.setDate(today.getDate() + ((7 - today.getDay())) % 7); // upcoming Sunday
    endDate = endDate.getFullYear() + "-" + String((endDate.getMonth() + 1)).padStart(2, '0') + "-" + String(endDate.getDate()).padStart(2, '0');
  }
  console.debug("start date:", startDate, ", end date:", endDate);

  const url = `https://statsapi.web.nhl.com/api/v1/schedule?startDate=${startDate}&endDate=${endDate}`;
  await fetch(url)
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    for (let day of data['dates']) {
      for (let game of day['games']) {
        let homeId = game.teams.home.team.id;
        let awayId = game.teams.away.team.id;
        NHL_TEAMS[homeId]['games'] += 1;
        NHL_TEAMS[awayId]['games'] += 1;
      }
    }
  });
}

// get relevant categories in league
function updateLeagueCategories() {
  let skaterCatsTmp = [];
  let goalieCatsTmp = [];
  for (let category of SKATER_CATS_ALL) {
    if (document.querySelector(`[title='${category}']`)) {
      skaterCatsTmp.push(category);
    }
  }
  for (let category of GOALIE_CATS_ALL) {
    if (document.querySelector(`[title='${category}']`)) {
      goalieCatsTmp.push(category);
    }
  }
  SKATER_CATS = skaterCatsTmp;
  GOALIE_CATS = goalieCatsTmp;

}

function getTeamIdByAbbreviation(teamAbbr) {
  switch (teamAbbr) {
    case "LA":
      teamAbbr = "LAK";
      break;
    case "SJ":
      teamAbbr = "SJS";
      break;
    case "NJ":
      teamAbbr = "NJD";
      break;
    case "TB":
      teamAbbr = "TBL";
      break;
    default:
      break;
  }
  for (const id in NHL_TEAMS) {
    if (teamAbbr === NHL_TEAMS[id]['abbreviation']) {
      return id;
    }
  }
  return null;
}

// remove diacritics like é in Montréal
function normalizeStr(str) {
  return str.normalize('NFKD').replace(/[\u0300-\u036f]/g, "");
}

async function getPlayerStats(teamId, name) {
  const rosterUrl = `https://statsapi.web.nhl.com/api/v1/teams/${teamId}/roster`;
  let playerId = null;
  const rosterResponse = await fetch(rosterUrl).then(response => response.json());
  this.rosterResponse = rosterResponse;
  for (let player of rosterResponse['roster']) {
    if (name === normalizeStr(player.person.fullName)) {
      playerId = player.person.id;
      break;
    }
  }

  if (playerId) {
    let playerUrl = `https://statsapi.web.nhl.com/api/v1/people/${playerId}/stats?stats=statsSingleSeason`
    if (CACHE.expectedStatsSeason) {
      const regex = /^\d{8}$/;
      if (regex.test(CACHE.expectedStatsSeason)) {
        playerUrl += `&season=${CACHE.expectedStatsSeason}`
        console.debug(`Calculating expected stats using ${CACHE.expectedStatsSeason} season`);
      } else {
        console.debug(`Invalid expectedStatsSeason ${CACHE.expectedStatsSeason}. Using current season instead`);
      }
    }
    const statsResponse = await fetch(playerUrl).then(response => response.json());
    this.statsResponse = statsResponse;
    let stats = statsResponse['stats'][0]['splits'][0]['stat'];
    return stats;
  }

  return null;
}

function playerStatsToAverages(playerStats) {
  let averageStats = new Map();
  if (playerStats['games'] > 0) {
    for (let category of SKATER_CATS) {
      averageStats.set(category, playerStats[yahooToNhlCatNames[category]]/playerStats['games']);
    }
  }
  return averageStats;
}

function goalieStatsToAverages(goalieStats) {
  let averageStats = new Map();
  if (goalieStats['games'] > 0) {
    for (let category of GOALIE_CATS) {
      averageStats.set(category, goalieStats[yahooToNhlCatNames[category]]);
      if (isCumulativeStat(category)) {
        averageStats.set(category, averageStats.get(category)/goalieStats['games']);
      }
    }
  }
  return averageStats;
}

function getExpectedStatsStr(stats, numGames) {
  let expectedStatsStr = "";
  let expStats;
  let cnt = 0;

  if (numGames == 0) {
    return "N/A";
  }

  for (let cat of stats.keys()) {
    if (cnt > 0) { expectedStatsStr += ', '; }
    if (cnt % 3 === 0) { expectedStatsStr += '<br>'; }
    if (isCumulativeStat(cat)) {
      expStats = (stats.get(cat)*numGames).toFixed(2);
    } else {
      expStats = (stats.get(cat)).toFixed(2);
    }
    expectedStatsStr += `${yahooToShortCatNames[cat]}: ${expStats}`
    cnt++;
  }

  return expectedStatsStr;
}

function isCumulativeStat(stat) {
  return !(stat.toLowerCase().includes('average') || stat.toLowerCase().includes('percentage'));
}

async function updatePlayer(player) {
  let averageStats;
  const regexpPlayerInfo = /(.*) ([A-Z]+) - ([A-Z]+).*/;
  const regexNameInitial = /^[A-Z]\. .*/;
  const match = player.innerText.match(regexpPlayerInfo);

  // first name initials do not work for stats lookup
  if (match && match.length > 2 && !regexNameInitial.test(match[1])) {
    const name = match[1];
    const teamAbbr = match[match.length - 2].toUpperCase();
    const position = match[match.length - 1].toUpperCase();
    let teamId = getTeamIdByAbbreviation(teamAbbr);
    let infoId = "yfha-" + name.toLowerCase().replace(/\s+/g,'-');
    const dobberUrl = `https://frozenpool.dobbersports.com/players/` + name.toLowerCase().replace(/\s+/g,'-');
    const dailyFaceoffUrl = `https://www.dailyfaceoff.com/teams/${NHL_TEAMS[teamId]['urlname']}/line-combinations`;

    if (teamId) {
      let numGames = NHL_TEAMS[teamId]['games'];

      if (PLAYER_AVG_STATS[name]) {
        console.debug(`Fetching ${name}'s stats cache`);
        averageStats = PLAYER_AVG_STATS[name];
      } else {
        let playerStats = await getPlayerStats(teamId, name);
        if (playerStats) {
          if (position === 'G') {
            averageStats = goalieStatsToAverages(playerStats);
          } else {
            averageStats = playerStatsToAverages(playerStats);
          }
        }
        PLAYER_AVG_STATS[name] = averageStats;
      }
      
      let infoBox = document.getElementById(infoId);
      if (infoBox) {
        // clear any existing info if it exists
        infoBox.innerHTML = "";
      } else {
        infoBox = document.createElement('div');
        infoBox.setAttribute('id', infoId);
        player.appendChild(infoBox);
      }
      if (CACHE.showGames) {
        let gamebox_css = numGames > 5 ? "nhl-games-max":`nhl-games-${numGames}`;
        infoBox.innerHTML += `<span class="${gamebox_css} info-box">G: ${numGames}</span>`;
      }
      if (CACHE.showLinks) {
        infoBox.innerHTML += `<span class="dobber-box info-box"><a href="${dobberUrl}" target="_blank">Dobber</a></span>`;
        infoBox.innerHTML += `<span class="dailyfaceoff-box info-box"><a href="${dailyFaceoffUrl}" target="_blank">DailyFaceoff</a></span>`;
      }
      if (CACHE.showExpectedStats && averageStats) {
        let expectedStatsStr = getExpectedStatsStr(averageStats, numGames);
        infoBox.innerHTML += `<br><div class="stats-box nhl-games-${numGames} info-box">Expected Stats*:${expectedStatsStr}</span></div>`;
      }
    }
  }
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.debug("Update triggered", sender);
    if (request.msg === "update") {
      init();
      sendResponse({msg: "complete"});
    }
  }
);