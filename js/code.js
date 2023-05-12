/* FIXME:
 * add doubles
 * rally scoring
 */

let player1 = {name: "player1", x: [1], y: [0], score: 0, serving: true, hovertemplate: "Score %{y}, Rally %{x}"};
let player2 = {name: "player2", x: [1], y: [0], score: 0, serving: false, hovertemplate: "Score %{y}, Rally %{x}"}

function elem(id){
    return document.getElementById(id);
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
    return kind === 'skip' || kind === 'unforced error' || kind == 'avoidable'
}

function isPoint(event_){
    return event_.server == event_.winningPlayer
}

function isPointFor(event_, player){
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
        title: 'Racquetball game',
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

function init(){
    console.log("init");

    let plotDiv = document.getElementById('plot');

    /*
    player1 = {name: "player1", x: [0], y: [0]}
    player2 = {name: "player2", x: [0], y: [0]}
    */

    // set the name of each trace to the name of the player
    let layout = initialLayout()

    // FIXME: overlay should show score and name of player, and maybe some other stats
    let plot = Plotly.newPlot(plotDiv, [{...player1}, {...player2}], layout);

    let timelineLayout = {
        type: "scatter",
        showlegend: false,
        mode: "none",
        yaxis: {
            range: [0, 1],
        }
    }

    /*
    let timelineDiv = document.getElementById('timeline');
    let timelinePlot = Plotly.newPlot(timelineDiv, [], timelineLayout);
    */

    window.onresize = function(){
        Plotly.Plots.resize(plotDiv);
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

function animate(){
    let plotDiv = elem('plot');

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

    Plotly.animate('plot', {data: [trace1, trace2], traces: [0, 1], layout: {xaxis: {range: [1, rangeX]}}}, transition).then(function(){
        // console.log("finished animating");
        // Plotly.redraw('plot');
    }) 
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

        if (isPoint(use)){
            events.innerHTML += `<br /><span class="text-light fs-6">Rally ${rallyNumber}, Server: ${use.server}. ${use.winningPlayer} wins rally with ${use.kind}. Point for ${use.server}. ${use.score1} - ${use.score2}</span>`;
        } else {
            events.innerHTML += `<br /><span class="text-light fs-6">Rally ${rallyNumber}, Server: ${use.server}. ${use.winningPlayer} wins rally with ${use.kind}. Sideout. ${use.score1} - ${use.score2}</span>`;
        }

        rallyNumber += 1
    }
}

/* iterate through the timeline and compute statistics based on the events that occured */
function computeStats(player){
    let out = {
        aces: 0,
        errors: 0,
        runs: 0,
        serves: 0,
    }

    var currentRun = 0;

    for (let i = 0; i < timeline.length; i++){
        let use = timeline[i];

        if (use.type == "timeout"){
            continue
        }

        /* a replay counts as the player having served */
        if (use.server === player.name){
            out.serves += 1
        }

        if (use.type == "replay"){
            continue
        }

        if (use.lastHitPlayer == player.name){
            if (use.kind == 'ace'){
                out.aces += 1
            } else if (!isError(use)){
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

function updateStats(){
    let player1Stats = computeStats(player1);
    let player2Stats = computeStats(player2);

    elem("statsAcePlayer1").innerHTML = player1Stats.aces
    elem("statsServesPlayer1").innerHTML = player1Stats.serves
    elem("statsErrorsPlayer1").innerHTML = player1Stats.errors
    elem("statsLongestRunPlayer1").innerHTML = player1Stats.runs

    elem("statsAcePlayer2").innerHTML = player2Stats.aces
    elem("statsServesPlayer2").innerHTML = player2Stats.serves
    elem("statsErrorsPlayer2").innerHTML = player2Stats.errors
    elem("statsLongestRunPlayer2").innerHTML = player2Stats.runs
}

function updateState(){
    let player1State = elem('player1State');
    let player1Score = elem('player1ScoreMain');
    let player2Score = elem('player2ScoreMain');
    let player2State = elem('player2State');

    let player1StateTop = elem('player1StateTop');
    let player2StateTop = elem('player2StateTop');

    elem('tablePlayer1').innerHTML = player1.name
    elem('tablePlayer2').innerHTML = player2.name

    if (player1.serving) {
        player1State.innerHTML = `${player1.name} (serving)`;
        player2State.innerHTML = `${player2.name} (receiving)`
        player1StateTop.innerHTML = 'Serving';
        player2StateTop.innerHTML = 'Receiving';
    } else {
        player2State.innerHTML = `${player2.name} (serving)`;
        player1State.innerHTML = `${player1.name} (receiving)`
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
        elem('player1Ace').classList.add('disabled')
    }

    updateTimeline();
    updateStats();
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
            sideout(kind)
        }

        timeline.push(makeRallyEvent(player1.name, player.name, player.name, kind, player1.score, player2.score))
    } else {
        if (player == player2){
            // serverWins(kind)
            addScore(player2, player1)
        } else {
            sideout(kind)
        }

        timeline.push(makeRallyEvent(player2.name, player.name, player.name, kind, player1.score, player2.score))
    }
}

/* the rally ended because of a losing action of 'player' */
function loseRally(player, kind){
    if (player1.serving){
        var winner = player1.name
        if (player == player1){
            sideout(kind)
            winner = player2.name
        } else {
            // serverWins(kind)
            addScore(player1, player2)
        }

        timeline.push(makeRallyEvent(player1.name, winner, player.name, kind, player1.score, player2.score))
    } else {
        var winner = player2.name
        if (player == player2){
            sideout(kind)
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

function sideout(kind){
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
    player2.x = [1]
    player2.y = [0]
    player2.score = 0
    player2.serving = false
    timeline = []
    let plotDiv = document.getElementById('plot');
    let layout = initialLayout()
    Plotly.react(plotDiv, {data: [{...player1}, {...player2}], traces: [0, 1], layout: layout});
    Plotly.redraw('plot');
    updateState()
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
