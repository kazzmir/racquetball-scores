/* FIXME:
 * add doubles
 * rally scoring
 */

function makePlayer(name, serving){
    return {
        name: name,
        x: [1], y: [0],
        score: 0,
        opportunities: 0,
        ceiling: 0,
        serving: serving,
        appeals: 0,
        hovertemplate: "Score %{y}, Rally %{x}"
    };
}

let player1 = makePlayer("player1", true);
let player2 = makePlayer("player2", false);
let gameSetup = {totalPoints: 11, scoring: 'normal'}

function elem(id){
    return document.getElementById(id);
}

function isRallyScoring(){
    return gameSetup.scoring === 'rally'
}

function toggleGraph(n){
    elem(`plot${n}`).classList.toggle('hide')
    elem(`graphButtonHide${n}`).classList.toggle('hide')
    elem(`graphButtonShow${n}`).classList.toggle('hide')
}

function setTotalPoints(total){
    gameSetup.totalPoints = total
    var selectedPoints
    var unselectedPoints

    if (total == 11){
        selectedPoints = elem('points11')
        unselectedPoints = elem('points15')
    } else {
        selectedPoints = elem('points15')
        unselectedPoints = elem('points11')
    }

    unselectedPoints.classList.remove('btn-primary')
    unselectedPoints.classList.add('btn-secondary')
    selectedPoints.classList.remove('btn-secondary')
    selectedPoints.classList.add('btn-primary')
}

function setScoringStyle(kind){
    gameSetup.scoring = kind

    var selectedPoints
    var unselectedPoints

    if (gameSetup.scoring === 'normal'){
        selectedPoints = elem('scoringNormal')
        unselectedPoints = elem('scoringRally')
    } else {
        selectedPoints = elem('scoringRally')
        unselectedPoints = elem('scoringNormal')
    }

    unselectedPoints.classList.remove('btn-primary')
    unselectedPoints.classList.add('btn-secondary')
    selectedPoints.classList.remove('btn-secondary')
    selectedPoints.classList.add('btn-primary')
}

function setNormalScoring(){
    setScoringStyle('normal')
}

function setRallyScoring(){
    setScoringStyle('rally')
}

/* a rally ends when a player hits a shot.
 * the shot could be a winning shot (kill, pinch, etc) or a losing shot (skip)
 *   server: the player who served the ball
 *   lastHitPlayer: the player that last touched the ball
 *   kind: what kind of shot the last player hit
 *   score1: score of player 1
 *   score2: score of player 2
 */
function makeRallyEvent(server, winningPlayer, lastHitPlayer, kind, score1, score2){
    return {
        type: "rally",
        server: server,
        winningPlayer: winningPlayer,
        lastHitPlayer: lastHitPlayer,
        kind: kind,
        score1: score1,
        score2: score2
    }
}

function makeScoreEvent(server, kind, score1, score2){
    return {
        type: "score",
        server: server,
        kind: kind,
        score1: score1,
        score2: score2,
    }
}

function makeFaultEvent(server, score1, score2){
    return {
        type: "fault",
        server: server,
        score1: score1,
        score2: score2
    }
}

function makeDoubleFaultEvent(server, score1, score2){
    return {
        type: "fault",
        server: server,
        score1: score1,
        score2: score2
    }
}

function makeTimeoutEvent(server, timeoutPlayer, score1, score2){
    return {
        type: "timeout",
        server: server,
        timeoutPlayer: timeoutPlayer,
        score1: score1,
        score2: score2
    }
}

function makeReplayEvent(server, score1, score2){
    return {
        type: "replay",
        server: server,
        score1: score1,
        score2: score2
    }
}

function isError(kind){
    return kind === 'skip' || kind === 'unforced error' || kind == 'avoidable' || kind == 'error'
}

function isWinner(kind){
    return kind == 'pinch' || kind == 'down the line' || kind == 'cross court' || kind == 'splat' || kind == 'winner' || kind == 'ace' || kind == 'kill'
}

function isPoint(event_){
    return event_.server == event_.winningPlayer
}

function isPointFor(event_, player){
    if (isRallyScoring()){
        return event_.winningPlayer == player
    }
    return isPoint(event_) && event_.server == player
}

/* its a sideout if the player that received won the rally */
function isSideout(event_){
    /* either the player just served and made an error */
    if (event_.lastHitPlayer == event_.server && isError(event_.kind)){
        return true
    }
    /* or the player didn't receive and didn't make an error */
    if (event_.lastHitPlayer != event_.server && !isError(event_.kind)){
        return true
    }
    return false
}

function eventServerWins(server, kind, score1, score2){
    return {
        type: "server-wins",
        kind: kind,
        server: server,
        score1: score1,
        score2: score2,
    }
}

function eventSideout(server, player, kind, score1, score2){
    return {
        type: "loser-wins",
        player: player,
        kind: kind,
        server: server,
        score1: score1,
        score2: score2,
    }
}

// timeline of events
let timeline = [];

function initialLayout(){
    return {
        title: 'Rally flow',
        paper_bgcolor: '#eee',
        plot_bgcolor: '#eee',
        xaxis: {
            title: 'Rally',
            range: [1, 20]
        },
        yaxis: {
            title: 'Score',
            range: [0, 20]
        },
        /*
        grid: {
            // columns: 10,
            rows: 15,
        }
        */
    }
}

function runsLayout(){
    return {
        title: 'Runs',
        paper_bgcolor: '#eee',
        plot_bgcolor: '#eee',
        xaxis: {
            title: 'Run',
            range: [0, 20],
        },
        yaxis: {
            title: 'Score',
            range: [0, 20],
        },
    }
}

function init(){
    console.log("init");

    setTotalPoints(15)
    setNormalScoring()

    let plotDiv = elem('plot2');

    /*
    player1 = {name: "player1", x: [0], y: [0]}
    player2 = {name: "player2", x: [0], y: [0]}
    */

    // set the name of each trace to the name of the player
    let layout = initialLayout()

    // FIXME: overlay should show score and name of player, and maybe some other stats
    let plot = Plotly.newPlot(plotDiv, [{...player1}, {...player2}], layout);

    /*
    let timelineLayout = {
        type: "scatter",
        showlegend: false,
        mode: "none",
        yaxis: {
            range: [0, 1],
        }
    }
    */

    /*
    let timelineDiv = document.getElementById('timeline');
    let timelinePlot = Plotly.newPlot(timelineDiv, [], timelineLayout);
    */

    let plotDivRuns = elem('plot1')
    let plotRuns = Plotly.newPlot(plotDivRuns, [{x: [], y: []}, {x:[], y:[]}], runsLayout())

    window.onresize = function(){
        Plotly.Plots.resize(plotDiv);
        Plotly.Plots.resize(plotDivRuns);
        // Plotly.Plots.resize(timelinePlot);
    }

    updateState();
}

function addScore(playerAdd, playerSame){
    // increment the y value to add a point
    playerAdd.x.push(playerAdd.x[playerAdd.x.length - 1] + 1);
    playerAdd.y.push(playerAdd.y[playerAdd.y.length - 1] + 1);
    playerAdd.score += 1;
    
    // keep the y value the same since they have the same score as before
    // playerSame.x.push(playerSame.x[playerSame.x.length - 1] + 1);
    // playerSame.y.push(playerSame.y[playerSame.y.length - 1]);
    nextRally(playerSame)
}

/* add a new rally for the player but keep the old score */
function nextRally(player){
    player.x.push(player.x[player.x.length - 1] + 1);
    player.y.push(player.y[player.y.length - 1]);
}

function removeRally(player){
    player.x.pop();
    player.y.pop();
}

function animateRuns(){
    let runs = computeRuns()

    var trace1 = {
        x: [],
        y: [],
        text: [],
        score: [],
        name: player1.name,
        mode: 'markers+text',
        type: 'scatter',
        hovertemplate: "Run: %{y}",
        marker: { size: 12 },
    }

    var trace2 = {
        x: [],
        y: [],
        score: [],
        text: [],
        name: player2.name,
        mode: 'markers+text',
        type: 'scatter',
        hovertemplate: "Run: %{y}",
        marker: { size: 12 },
    }

    let player1Score = 0
    let player2Score = 0
    for (let i = 0; i < runs.length; i++){
        let score1 = runs[i][0]
        let score2 = runs[i][1]

        player1Score += score1
        player2Score += score2

        if (score1 !== 0){
            trace1.x.push(i+1)
            trace1.y.push(score1)
            trace1.score.push(player1Score)
            trace1.text.push(score1)
        }

        if (score2 !== 0){
            trace2.x.push(i+1)
            trace2.y.push(score2)
            trace2.score.push(player2Score)
            trace2.text.push(score2)
        }
    }

    Plotly.animate('plot1', {data: [trace1, trace2], traces: [0, 1]})
}

function animate(){
    let x1 = [...player1.x]
    let y1 = [...player1.y]

    // extend x axis to always be some multiple of 5
    let rangeX = Math.floor((Math.max(...x1, 15) + 5) / 5) * 5

    let trace1 = {x: [...player1.x], y: [...player1.y], name: player1.name}
    let trace2 = {x: [...player2.x], y: [...player2.y], name: player2.name}

    let transition = {
        transition: {
            duration: 300,
            easing: 'cubic-in-out'
        },
        frame: {
            duration: 300
        }
    }

    Plotly.animate('plot2', {data: [trace1, trace2], traces: [0, 1], layout: {xaxis: {range: [1, rangeX]}}}, transition).then(function(){
        // console.log("finished animating");
        // Plotly.redraw('plot');
    }) 

    animateRuns()
}

function isDoubleFault(event_){
    return event_.type == "rally" && event_.kind == "double fault"
}

function updateTimeline(){
    let events = elem('events');
    events.innerHTML = "<span class='text-light fs-3'>Timeline</span>";
    var rallyNumber = 1;
    for (let i = 0; i < timeline.length; i++){
        let use = timeline[i];

        if (use.type == "replay"){
            events.innerHTML += `<br /><span class="text-light fs-6">Rally ${rallyNumber}, Server: ${use.server}. Replay. ${use.score1} - ${use.score2}</span>`;
            rallyNumber += 1
            continue
        }

        if (use.type == "timeout"){
            events.innerHTML += `<br /><span class="text-light fs-6">Rally ${rallyNumber}, Server: ${use.server}. Timeout by ${use.timeoutPlayer}. ${use.score1} - ${use.score2}</span>`;
            // no rally for a timeout
            continue
        }

        if (isDoubleFault(use)){
            events.innerHTML += `<br /><span class="text-light fs-6">Rally ${rallyNumber}, Server: ${use.server}. Double fault serve. Sideout. ${use.score1} - ${use.score2}</span>`;
            rallyNumber += 1
            continue
        }

        if (use.type == "score"){
            events.innerHTML += `<br /><span class="text-light fs-6">Rally ${rallyNumber}, Server: ${use.server}. Score ${use.kind}. ${use.score1} - ${use.score2}</span>`;
            continue
        }

        if (use.type == "fault"){
            events.innerHTML += `<br /><span class="text-light fs-6">Rally ${rallyNumber}, Server: ${use.server}. Fault serve. ${use.score1} - ${use.score2}</span>`;
            rallyNumber += 1
            continue
        }

        if (isPoint(use)){
            events.innerHTML += `<br /><span class="text-light fs-6">Rally ${rallyNumber}, Server: ${use.server}. ${use.winningPlayer} wins rally with ${use.kind}. Point for ${use.server}. ${use.score1} - ${use.score2}</span>`;
        } else {
            events.innerHTML += `<br /><span class="text-light fs-6">Rally ${rallyNumber}, Server: ${use.server}. ${use.winningPlayer} wins rally with ${use.kind}. Sideout. ${use.score1} - ${use.score2}</span>`;
        }

        rallyNumber += 1
    }
}

function updateRuns(){
    let runs = computeRuns()
    let div = elem('runs');
    div.innerHTML = "<span class='text-light fs-3'>Runs</span>";
    let p1score = 0
    let p2score = 0
    let p1name = player1.name
    let p2name = player2.name
    for (let i = 0; i < runs.length; i++){
        let p1run = runs[i][0];
        let p2run = runs[i][1];
        p1score += p1run
        p2score += p2run
        if (p1run > 0){
            div.innerHTML += `<br /><span class='text-light fs-6'>${p1name} run of ${p1run}. Score ${p1score} - ${p2score}</span>`;
        } else if (p2run > 0){
            div.innerHTML += `<br /><span class='text-light fs-6'>${p2name} run of ${p2run}. Score ${p1score} - ${p2score}</span>`;
        }
    }
}

/* remove all timeout events */
function normalizeTimeline(timeline){
    let out = []
    for (let i = 0; i < timeline.length; i++){
        if (timeline[i].type !== "timeout"){
            out.push(timeline[i]);
        }
    }
    return out
}

/* remove all double fault events */
function removeDoubleFaults(timeline){
    let out = []
    for (let i = 0; i < timeline.length; i++){
        if (timeline[i].type !== "double fault"){
            out.push(timeline[i]);
        }
    }
    return out
}

// returns an array of (player, score) pairs that are runs for that player
function computeRuns(){

    /*
    let normalized = normalizeTimeline(timeline)

    let noDoubleFaults = removeDoubleFaults(normalized)

    for (let i = 0; i < noDoubleFaults.length; i++){
        if (noDoubleFaults[i].server == player.name){
            out.firstServeTries += 1
        }
    }

    [(0, 0), (0, 1), (0, 1), (1, 1), (2, 1), (3, 1)]
    */

    let score1 = 0
    let run1 = 0
    let score2 = 0
    let run2 = 0

    let runs = []

    for (let i = 0; i < timeline.length; i++){
        let use = timeline[i];

        // player 2 got a point, player 1's run ended
        if (use.score1 === score1 && use.score2 !== score2){
            if (run1 > 0){
                runs.push([run1, run2])
                run1 = 0
                run2 = 0
            }

            score2 = use.score2
            run2 += 1
        } else if (use.score2 === score2 && use.score1 !== score1){
            // player 1 got a point, player 2's run ended
            if (run2 > 0){
                runs.push([run1, run2])
                run1 = 0
                run2 = 0
            }

            score1 = use.score1
            run1 += 1
        }
    }

    if (run1 > 0 || run2 > 0){
        runs.push([run1, run2])
    }

    return runs
}

/* iterate through the timeline and compute statistics based on the events that occured */
function computeStats(player){
    let out = {
        aces: 0,
        kills: 0,
        errors: 0,
        runs: 0,
        serves: 0,
        faults: 0,
        firstServe: 0,
        firstServeTries: 0,
        skips: 0,
        pinches: 0,
        crossCourts: 0,
        downTheLines: 0,
        splats: 0,
        avoidables: 0,
        opportunities: player.opportunities,
        ceiling: player.ceiling,
        winners: 0,
        appeals: player.appeals,
    }

    var currentRun = 0;

    let normalized = normalizeTimeline(timeline)

    let noDoubleFaults = removeDoubleFaults(normalized)

    for (let i = 0; i < noDoubleFaults.length; i++){
        if (noDoubleFaults[i].server == player.name){
            out.firstServeTries += 1
        }
    }

    for (let i = 0; i < normalized.length; i++){
        let use = normalized[i];

        if (use.type == "timeout"){
            continue
        }

        if (use.type == "score"){
            continue
        }

        /* a replay counts as the player having served */
        if (use.server === player.name){
            out.serves += 1
        }

        if (use.server == player.name && (use.type === "fault" || isDoubleFault(use))){
            out.faults += 1
            continue
        }

        /* its a first serve if this is the first rally that this player is serving.
         */
        // if (use.server == player.name && (i == 0 || (i > 0 && (normalized[i-1].server !== player.name || normalized[i-1].type !== "fault")))){
        if (use.server == player.name){
            out.firstServe += 1
        }

        if (use.type == "replay"){
            continue
        }

        if (use.lastHitPlayer == player.name){
            if (use.kind == 'ace'){
                out.aces += 1
            }

            if (use.kind == 'skip'){
                out.skips += 1
            }

            if (use.kind == 'pinch'){
                out.pinches += 1
            }

            if (use.kind == 'down the line'){
                out.downTheLines += 1
            }

            if (use.kind == 'splat'){
                out.splats += 1
            }

            if (use.kind == 'cross court'){
                out.crossCourts += 1
            }

            if (use.kind == 'avoidable'){
                out.avoidables += 1
            }

            if (use.kind == 'kill'){
                out.kills += 1;
            }

            if (isWinner(use.kind)){
                out.winners += 1
            }

            if (isError(use.kind)){
                out.errors += 1
            }
        }

        /* its a run of points if its a point for the player */
        if (isPointFor(use, player.name)){
            currentRun += 1;
        } else {
            /* otherwise the run is over */
            out.runs = Math.max(out.runs, currentRun)
            currentRun = 0;
        }
    }

    /* compute the last run */
    out.runs = Math.max(out.runs, currentRun)

    return out

}

function firstServeStats(stats){
    let percentage = stats.firstServeTries > 0 ? (stats.firstServe / stats.firstServeTries * 100.0) : 0
    return `${stats.firstServe} ${Math.round(percentage)}%`
}

function updateStats(){

    function setStats(stats, player){
        elem(`statsAcePlayer${player}`).innerHTML = stats.aces
        elem(`statsServesPlayer${player}`).innerHTML = stats.serves
        elem(`statsFirstServesPlayer${player}`).innerHTML = firstServeStats(stats)
        elem(`statsFaultsPlayer${player}`).innerHTML = stats.faults
        elem(`statsErrorsPlayer${player}`).innerHTML = stats.errors
        elem(`statsLongestRunPlayer${player}`).innerHTML = stats.runs
        elem(`statsSkipsPlayer${player}`).innerHTML = stats.skips
        elem(`statsPinchesPlayer${player}`).innerHTML = stats.pinches
        elem(`statsCrossCourtPlayer${player}`).innerHTML = stats.crossCourts
        elem(`statsDownTheLinePlayer${player}`).innerHTML = stats.downTheLines
        elem(`statsSplatLinePlayer${player}`).innerHTML = stats.splats
        elem(`statsAvoidablesPlayer${player}`).innerHTML = stats.avoidables
        elem(`statsOpportunitiesPlayer${player}`).innerHTML = stats.opportunities
        elem(`statsCeilingBallPlayer${player}`).innerHTML = stats.ceiling
        elem(`statsWinnersPlayer${player}`).innerHTML = stats.winners
        elem(`statsAppealsPlayer${player}`).innerHTML = stats.appeals
        elem(`statsKillPlayer${player}`).innerHTML = stats.kills
    }

    let player1Stats = computeStats(player1);
    let player2Stats = computeStats(player2);

    setStats(player1Stats, 1)
    setStats(player2Stats, 2)
}

function updateState(){
    let player1Score = elem('player1ScoreMain');
    let player2Score = elem('player2ScoreMain');

    let player1StateTop = elem('player1StateTop');
    let player2StateTop = elem('player2StateTop');

    elem('tablePlayer1').innerHTML = player1.name
    elem('tablePlayer2').innerHTML = player2.name

    if (player1.serving) {
        player1StateTop.innerHTML = 'Serving';
        player2StateTop.innerHTML = 'Receiving';
    } else {
        player2StateTop.innerHTML = 'Serving';
        player1StateTop.innerHTML = 'Receiving';
    }

    player1Score.innerHTML = `${player1.score}`;
    player2Score.innerHTML = `${player2.score}`;

    if (player1.serving){
        elem('player1Ace').classList.remove('disabled')
        elem('player1Fault').classList.remove('disabled')
        elem('player2Ace').classList.add('disabled')
        elem('player2Fault').classList.add('disabled')
    } else {
        elem('player2Ace').classList.remove('disabled')
        elem('player2Fault').classList.remove('disabled')
        elem('player1Ace').classList.add('disabled')
        elem('player1Fault').classList.add('disabled')
    }

    updateTimeline();
    updateRuns();
    updateStats();
}

function missedOpportunity(player, value){
    player.opportunities += value
    if (player.opportunities < 0){
        player.opportunities = 0
    }
    updateStats();
}

function ceilingBall(player, value){
    player.ceiling += value
    if (player.ceiling < 0){
        player.ceiling = 0
    }
    updateStats();
}

function appeal(player){
    player.appeals += 1
    updateState();
}

function player1AddScore(){
    addScore(player1, player2)
    updateState()
    animate();
} 

function player2AddScore(){
    addScore(player2, player1);
    updateState()
    animate();
    // Plotly.redraw('plot');
}

function setPlayer1Serving(){
    player1.serving = true
    player2.serving = false
    updateState();
}

function setPlayer2Serving(){
    player1.serving = false
    player2.serving = true
    updateState();
}

function setPlayer1Name(name){
    player1.name = name
    updateState();
    animate();
    // Plotly.animate('plot', {data: [{...player1}], traces: [0]}, {transition: {duration: 0}});
}

function setPlayer2Name(name){
    player2.name = name
    updateState();
    animate();
    // Plotly.animate('plot', {data: [{...player2}], traces: [1]}, {transition: {duration: 0}});
}

/* the rally ended because of the winning action of 'player' */
function winRally(player, kind){
    if (player1.serving){
        if (player == player1){
            addScore(player1, player2)
        } else {
            if (isRallyScoring()){
                rallysideout(player2, player1)
            } else {
                sideout()
            }
        }

        timeline.push(makeRallyEvent(player1.name, player.name, player.name, kind, player1.score, player2.score))
    } else {
        if (player == player2){
            // serverWins(kind)
            addScore(player2, player1)
        } else {
            if (isRallyScoring()){
                rallysideout(player1, player2)
            } else {
                sideout()
            }
        }

        timeline.push(makeRallyEvent(player2.name, player.name, player.name, kind, player1.score, player2.score))
    }
}

/* the rally ended because of a losing action of 'player' */
function loseRally(player, kind){
    if (player1.serving){
        var winner = player1.name
        if (player == player1){
            if (isRallyScoring()){
                rallysideout(player2, player1)
            } else {
                sideout()
            }
            winner = player2.name
        } else {
            // serverWins(kind)
            addScore(player1, player2)
        }

        timeline.push(makeRallyEvent(player1.name, winner, player.name, kind, player1.score, player2.score))
    } else {
        var winner = player2.name
        if (player == player2){
            if (isRallyScoring()){
                rallysideout(player1, player2)
            } else {
                sideout()
            }
            winner = player1.name
        } else {
            // serverWins(kind)
            addScore(player2, player1)
        }

        timeline.push(makeRallyEvent(player2.name, winner, player.name, kind, player1.score, player2.score))
    }
}

function ace(player){
    winRally(player, 'ace')
    animate();
    updateState();
}

function pinchWinner(player){
    winRally(player, 'pinch')
    animate();
    updateState();
}

function downTheLineWinner(player){
    winRally(player, 'down the line')
    animate();
    updateState();
}

function crossCourt(player){
    winRally(player, 'cross court')
    animate();
    updateState();
}

function killshot(player){
    winRally(player, 'kill')
    animate();
    updateState();
}

function splatWinner(player){
    winRally(player, 'splat')
    animate();
    updateState();
}

function unforcedError(player){
    loseRally(player, 'unforced error')
    animate();
    updateState();
}

function getLastRally(){
    for (var i = timeline.length - 1; i >= 0; i--){
        if (timeline[i].type === "timeout"){
            continue
        }
        return timeline[i]
    }

    return null
}

function fault(player){
    if (timeline.length > 0){
        let lastRally = getLastRally()
        if (lastRally !== null && lastRally.server == player.name && lastRally.type === 'fault'){
            loseRally(player, 'double fault')
            animate();
        } else {
            timeline.push(makeFaultEvent(player.name, player1.score, player2.score))
        }
    } else {
        timeline.push(makeFaultEvent(player.name, player1.score, player2.score))
    }
    updateState();
}

function skip(player){
    loseRally(player, 'skip')
    animate();
    updateState();
}

function getServer(){
    if (player1.serving){
        return player1.name
    }

    return player2.name
}

function timeout(player){
    timeline.push(makeTimeoutEvent(getServer(), player.name, player1.score, player2.score))
    updateState();
}

function replay(){
    console.log('replay')
    nextRally(player1);
    nextRally(player2);
    timeline.push(makeReplayEvent(getServer(), player1.score, player2.score))
    animate();
    updateState();
}

function genericError(player){
    loseRally(player, 'error')
    animate();
    updateState();
}

function genericWinner(player){
    winRally(player, 'winner')
    animate()
    updateState()
}

function avoidable(player){
    loseRally(player, 'avoidable')
    animate();
    updateState();
}

function serverWins(kind){
    if (player1.serving){
        addScore(player1, player2)
        // timeline.push(eventServerWins(player1.name, kind, player1.score, player2.score))
    } else {
        addScore(player2, player1)
        // timeline.push(eventServerWins(player2.name, kind, player1.score, player2.score))
    }
}

function rallysideout(addPoint, samePoint){
    addScore(addPoint, samePoint)
    player1.serving = !player1.serving;
    player2.serving = !player2.serving;
}

function sideout(){
    nextRally(player1);
    nextRally(player2);
    /*
    var server = player1.name
    var receiver = player2.name
    if (player2.serving){
        server = player2.name
        receiver = player1.name
    }
    */
    // timeline.push(eventSideout(server, receiver, kind, player1.score, player2.score))
    player1.serving = !player1.serving;
    player2.serving = !player2.serving;
}

function undo(){
    if (timeline.length > 0){
        let last = timeline.pop()

        removeRally(player1)
        removeRally(player2)

        if (timeline.length > 0){
            let xlast = timeline[timeline.length-1]
            player1.score = xlast.score1
            player2.score = xlast.score2

            if (last.server === player1.name){
                player1.serving = true
                player2.serving = false
            } else {
                player1.serving = false
                player2.serving = true
            }
        } else {
            player1.score = 0
            player2.score = 0
            player1.serving = true
            player2.serving = false
        }

        /*
        if (last.type == "server-wins"){
            removeRally(player1)
            removeRally(player2)
            if (player1.serving){
                player1.score -= 1;
            } else {
                player2.score -= 1;
            }
        } else if (last.type == "loser-wins"){
            removeRally(player1)
            removeRally(player2)
            player1.serving = !player1.serving;
            player2.serving = !player2.serving;
        }
        */
    }

    animate();
    updateState();
}

function newGame(){
    player1.x = [1]
    player1.y = [0]
    player1.score = 0
    player1.serving = true
    player1.opportunities = 0
    player1.ceiling = 0
    player1.appeals = 0
    player2.x = [1]
    player2.y = [0]
    player2.score = 0
    player2.serving = false
    player2.opportunities = 0
    player2.ceiling = 0
    player2.appeals = 0
    timeline = []
    let plotDiv = elem('plot2');
    let layout = initialLayout()
    Plotly.react(plotDiv, {data: [{...player1}, {...player2}], traces: [0, 1], layout: layout});
    Plotly.redraw('plot2');
    updateState()
    animateRuns()
}

function normalStyle(){
    let list = document.body.classList
    list.remove('lprt')
    list.add('normal')
}

function lprtStyle(){
    let list = document.body.classList
    list.add('lprt')
    list.remove('normal')
}

function scoreUp(player){
    player.score += 1
    timeline.push(makeScoreEvent(getServer(), `${player.name} +1`, player1.score, player2.score))
    updateState()
}

function scoreDown(player){
    player.score -= 1
    timeline.push(makeScoreEvent(getServer(), `${player.name} -1`, player1.score, player2.score))
    updateState()
}
