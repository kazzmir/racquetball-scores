let player1 = {};
let player2 = {};

function init(){
    console.log("init");

    let plotDiv = document.getElementById('plot');

    /*
    Plotly.newPlot(plot, [{
        x: [1, 2, 3, 4, 5],
        y: [1, 2, 4, 8, 16] }], {
            margin: { t: 0 }
        }
    );
    */

    /*
    player1 = {x: [1, 2, 3], y: [0, 1, 2]};
    player2 = {x: [1, 2, 3], y: [1, 3, 8]};
    */
    player1 = {x: [0], y: [0]}
    player2 = {x: [0], y: [0]}

    layout = {
        title: 'Racquetball game',
        xaxis: {
            title: 'Rally'
        },
        yaxis: {
            title: 'Score'
        }
    }

    let plot = Plotly.newPlot(plotDiv, [player1, player2], layout);

    window.onresize = function(){
        Plotly.Plots.resize(plotDiv);
    }
}

function addScore(playerAdd, playerSame){
    // increment the y value to add a point
    playerAdd.x.push(playerAdd.x[playerAdd.x.length - 1] + 1);
    playerAdd.y.push(playerAdd.y[playerAdd.y.length - 1] + 1);
    
    // keep the y value the same since they have the same score as before
    playerSame.x.push(playerSame.x[playerSame.x.length - 1] + 1);
    playerSame.y.push(playerSame.y[playerSame.y.length - 1]);
}

function player1AddScore(){
    addScore(player1, player2);
    Plotly.redraw('plot');
} 

function player2AddScore(){
    addScore(player2, player1);
    Plotly.redraw('plot');
}

function newGame(){
    player1.x = [0]
    player1.y = [0]
    player2.x = [0]
    player2.y = [0]
    Plotly.redraw('plot');
}
