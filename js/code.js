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
    let plotDiv = document.getElementById('plot');

    // Plotly.extendTraces('plot', {x: [[player1.x[player1.x.length - 1] + 1]], y: [[player1.y[player1.y.length - 1] + 1]]}, [0]);
    // Plotly.extendTraces('plot', {x: [[player2.x[player2.x.length - 1] + 1]], y: [[player2.y[player2.y.length - 1]]]}, [1]);
    // Plotly.redraw('plot');
    addScore(player1, player2);
    Plotly.redraw('plot');
    /*
    var p1 = {x: [...player1.x] + [player1.x[player1.x.length-1]], y: [...player1.y] + [player1.y[player1.y.length-1]]}
    p1 = {x: [...player1.x].concat([player1.x[player1.x.length-1]+1]), y: [...player1.y].concat([player1.y[player1.y.length-1]])}
    Plotly.animate('plot', {data: [p1], traces: [0], layout: {}},
        {
        transition: {
            duration: 500,
            easing: 'cubic-in-out'
        },
        frame: {
            duration: 500
        }
    })
    */

    /*
    let transition = {
            transition: {
                duration: 500,
                easing: 'cubic-in-out'
            },
            frame: {
                duration: 500
            }
    }

    Plotly.animate('plot', {data: [{x: [0, 1, 2, 3], y: [0, 1, 3, 5, 7]}], traces: [0], layout: {}}, transition).then(function(){
    }) 
    Plotly.redraw('plot');
    */
    
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
