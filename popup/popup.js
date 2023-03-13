// weekly or daily league
var leagueTypeQ = document.getElementById("league-type-q");
var hiddenLeagueInfo = document.getElementById("hidden-league-info");
var isWeeklyLeague = document.getElementById("is-weekly-league");

// dates
var dateRangeQ = document.getElementById("date-range-q");
var hiddenDateInfo = document.getElementById("hidden-date-info");
var curWeekDates = document.getElementById("cur-week-dates");
var nextWeekDates = document.getElementById("next-week-dates");
var startDate = document.getElementById("start-date");
var endDate = document.getElementById("end-date");
var resetDates = document.getElementById("reset-dates");

// expected stats calculation
var expectedStatsQ = document.getElementById("exp-stats-q");
var hiddenExpectedStatsInfo = document.getElementById("hidden-exp-stats-info");
var expectedStatsSeason = document.getElementById("exp-stats-season");

// display options
var showExpectedStats = document.getElementById("show-expected-stats");
var showGames = document.getElementById("show-games");
var showLinks = document.getElementById("show-links");
var updateResults = document.getElementById("update-results");

chrome.storage.sync.get(["startDate"], function(result) {
    if (result) {
        startDate.value = result.startDate;
    }
});

chrome.storage.sync.get(["endDate"], function(result) {
    if (result) {
        endDate.value = result.endDate;
    }
});

chrome.storage.sync.get(["isWeeklyLeague"], function(result) {
    if (result) {
        isWeeklyLeague.checked = result.isWeeklyLeague;
    } else {
        isWeeklyLeague.checked = true;
    }
});

chrome.storage.sync.get("showExpectedStats", function(result) {
    if (result.showExpectedStats != undefined) {
        showExpectedStats.checked = result.showExpectedStats;
    }
});

chrome.storage.sync.get("showGames", function(result) {
    if (result.showGames != undefined) {
        showGames.checked = result.showGames;
    }
});

chrome.storage.sync.get("showLinks", function(result) {
    if (result.showLinks != undefined) {
        showLinks.checked = result.showLinks;
    }
});

// load current season
window.onload = function() {
    var curMonth = new Date().getMonth();
    var curYear = new Date().getFullYear();
    var opts = [];
    if (curMonth > 7) {
        opts.push({'value': `${curYear}${curYear+1}`, 'text': `${curYear}-${curYear+1} Season`});
        opts.push({'value': `${curYear-1}${curYear}`, 'text': `${curYear-1}-${curYear} Season`});
    } else {
        opts.push({'value': `${curYear-1}${curYear}`, 'text': `${curYear-1}-${curYear} Season`});
        opts.push({'value': `${curYear-2}${curYear-1}`, 'text': `${curYear-2}-${curYear-1} Season`});
    }
    console.debug(opts);
    for (var i in opts) {
        var opt = document.createElement('option');
        opt.value = opts[i]['value'];
        opt.innerHTML = opts[i]['text'];
        expectedStatsSeason.appendChild(opt);
    }

    chrome.storage.sync.get("expectedStatsSeason", function(result) {
        if (result.expectedStatsSeason != undefined) {
            expectedStatsSeason.value = result.expectedStatsSeason;
        }
    });
};

expectedStatsSeason.addEventListener("click", function() {
    chrome.storage.sync.set({"expectedStatsSeason": expectedStatsSeason.selectedOptions[0].value}, function() {
        console.debug(`expectedStatsSeason set to ${expectedStatsSeason.selectedOptions[0].value}`);
    });
});

isWeeklyLeague.addEventListener("click", function() {
    chrome.storage.sync.set({"isWeeklyLeague": isWeeklyLeague.checked}, function() {
        console.debug(`isWeeklyLeague set to ${isWeeklyLeague.checked}`);
    });
});

showExpectedStats.addEventListener("click", function() {
    chrome.storage.sync.set({"showExpectedStats": showExpectedStats.checked}, function() {
        console.debug("showExpectedStats set to " + showExpectedStats.checked);
    });
});

showGames.addEventListener("click", function() {
    chrome.storage.sync.set({"showGames": showGames.checked}, function() {
        console.debug("showGames set to " + showGames.checked);
    });
});

showLinks.addEventListener("click", function() {
    chrome.storage.sync.set({"showLinks": showLinks.checked}, function() {
        console.debug("showLinks set to " + showLinks.checked);
    });
});

dateRangeQ.addEventListener("mouseover", function() {
    hiddenDateInfo.classList.remove("popup-hidden");
});

leagueTypeQ.addEventListener("mouseover", function() {
    hiddenLeagueInfo.classList.remove("popup-hidden");
});

expectedStatsQ.addEventListener("mouseover", function() {
    hiddenExpectedStatsInfo.classList.remove("popup-hidden");
});

dateRangeQ.addEventListener("mouseout", function() {
    hiddenDateInfo.classList.add("popup-hidden");
});

leagueTypeQ.addEventListener("mouseout", function() {
    hiddenLeagueInfo.classList.add("popup-hidden");
});

expectedStatsQ.addEventListener("mouseout", function() {
    hiddenExpectedStatsInfo.classList.add("popup-hidden");
});

curWeekDates.addEventListener("click", function() {
    let today = new Date();
    let thisSunday = new Date();
    if (isWeeklyLeague.checked) {
        let lastMonday = new Date();
        lastMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        startDate.value = dateToString(lastMonday);
    } else {
        startDate.value = dateToString(today);
    }
    thisSunday.setDate(today.getDate() + ((7 - today.getDay())) % 7);
    endDate.value = dateToString(thisSunday);
});

nextWeekDates.addEventListener("click", function() {
    let today = new Date();
    let thisMonday = new Date();
    let nextSunday = new Date();
    thisMonday.setDate((today.getDate() - ((today.getDay() + 6) % 7)) + 7);
    startDate.value = dateToString(thisMonday);
    nextSunday.setDate((today.getDate() + ((7 - today.getDay())) % 7) + 7);
    endDate.value = dateToString(nextSunday);
});

resetDates.addEventListener("click", function() {
    startDate.value = "";
    endDate.value = "";
});

updateResults.addEventListener("click", function() {
    if ((!startDate.value && endDate.value) || (startDate.value && !endDate.value)) {
        alert("ERROR: You must enter both a start date and end date or leave them both blank");
    } else if (endDate.value < startDate.value) {
        alert("ERROR: Your end date is before your start date! Please review that the dates are valid");
    } else {
        // update settings
        chrome.storage.sync.set({"startDate": startDate.value}, function() {
            console.debug("Setting start date to " + startDate.value);
        });
        chrome.storage.sync.set({"endDate": endDate.value}, function() {
            console.debug("Setting end date to " + endDate.value);
        });

        // request content-script update
        let queryOptions = { active: true, lastFocusedWindow: true };
        chrome.tabs.query(queryOptions, function(tabs) {
            if (tabs && tabs[0].url.startsWith("https://hockey.fantasysports.yahoo.com")) {
                chrome.tabs.reload();
            }
        });
    }
});

function dateToString(date) {
    return date.getFullYear() + "-" + String((date.getMonth() + 1)).padStart(2, '0') + "-" + String(date.getDate()).padStart(2, '0');;
}