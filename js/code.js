/* FIXME:
 * add doubles
 * rally scoring
 */

let player1 = {name: "player1", x: [1], y: [0], score: 0, serving: true, hovertemplate: "Score %{y}, Rally %{x}"};
let player2 = {name: "player2", x: [1], y: [0], score: 0, serving: false, hovertemplate: "Score %{y}, Rally %{x}"}

function eventServerWins(server, score1, score2){
    return {
        type: "server-wins",
        server: server,
        score1: score1,
        score2: score2,
    }
}

function eventSideout(server, score1, score2){
    return {
        type: "sideout",
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
    layout = initialLayout()

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
    let plotDiv = document.getElementById('plot');

    let x1 = [...player1.x]
    let y1 = [...player1.y]

    // extend x axis to always be some multiple of 5
    let rangeX = Math.floor((Math.max(...x1, 15) + 5) / 5) * 5

    let trace1 = {x: [...player1.x], y: [...player1.y]}
    let trace2 = {x: [...player2.x], y: [...player2.y]}

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

function updateState(){
    let player1State = document.getElementById('player1State');
    let player2State = document.getElementById('player2State');

    let state = document.getElementById('state');
    if (player1.serving) {
        state.innerHTML = `${player1.name} (serving) ${player1.score} - ${player2.score} ${player2.name}`;
        player1State.innerHTML = "Serving"
        player2State.innerHTML = "Receiving"
    } else {
        state.innerHTML = `${player1.name} ${player1.score} - ${player2.score} ${player2.name} (serving)`;
        player2State.innerHTML = "Serving"
        player1State.innerHTML = "Receiving"
    }

    let player1Score = document.getElementById('player1Score');
    player1Score.innerHTML = `Score: ${player1.score}`;
    let player2Score = document.getElementById('player2Score');
    player2Score.innerHTML = `Score: ${player2.score}`;

    let events = document.getElementById('events');
    events.innerHTML = "<span class='text'>Timeline</span>";
    for (let i = 0; i < timeline.length; i++){
        let use = timeline[i];
        if (use.type == "server-wins"){
            events.innerHTML += `<br /><span class='text2'>Rally ${i+1}, Serving: ${use.server}, ${use.server} wins rally. ${use.score1} - ${use.score2}</span>`;
        } else if (use.type == "sideout"){
            events.innerHTML += `<br /><span class='text2'>Rally ${i+1}, Serving: ${use.server}, sideout. ${use.score1} - ${use.score2}</span>`;
        }
    }
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
    Plotly.animate('plot', {data: [{...player1}], traces: [0]}, {transition: {duration: 0}});
}

function setPlayer2Name(name){
    player2.name = name
    updateState();
    Plotly.animate('plot', {data: [{...player2}], traces: [1]}, {transition: {duration: 0}});
}

function serverWins(){
    if (player1.serving){
        timeline.push(eventServerWins(player1.name, player1.score+1, player2.score))
        player1AddScore()
    } else {
        timeline.push(eventServerWins(player2.name, player1.score, player2.score+1))
        player2AddScore()
    }
}

function sideout(){
    nextRally(player1);
    nextRally(player2);
    var server = player1.name
    if (player2.serving){
        server = player2.name
    }
    timeline.push(eventSideout(server, player1.score, player2.score))
    player1.serving = !player1.serving;
    player2.serving = !player2.serving;
    animate();
    updateState();
}

function undo(){
    if (timeline.length > 0){
        let last = timeline.pop()
        if (last.type == "server-wins"){
            removeRally(player1)
            removeRally(player2)
            if (player1.serving){
                player1.score -= 1;
            } else {
                player2.score -= 1;
            }
        } else if (last.type == "sideout"){
            removeRally(player1)
            removeRally(player2)
            player1.serving = !player1.serving;
            player2.serving = !player2.serving;
        }
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
    layout = initialLayout()
    Plotly.react(plotDiv, {data: [{...player1}, {...player2}], traces: [0, 1], layout: layout});
    Plotly.redraw('plot');
    updateState()
}
