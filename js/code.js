let player1 = {};
let player2 = {};

function init(){
    console.log("init");

    let plotDiv = document.getElementById('plot');

    player1 = {x: [0], y: [0]}
    player2 = {x: [0], y: [0]}

    layout = {
        title: 'Racquetball game',
        xaxis: {
            title: 'Rally',
            range: [0, 20]
        },
        yaxis: {
            title: 'Score',
            range: [0, 20]
        }
    }

    let plot = Plotly.newPlot(plotDiv, [{...player1}, {...player2}], layout);

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

    Plotly.animate('plot', {data: [trace1, trace2], traces: [0, 1], layout: {xaxis: {range: [0, rangeX]}}}, transition).then(function(){
        // console.log("finished animating");
        // Plotly.redraw('plot');
    }) 
}

function player1AddScore(){
    addScore(player1, player2)
    animate();
} 

function player2AddScore(){
    addScore(player2, player1);
    animate();
    // Plotly.redraw('plot');
}

function newGame(){
    player1.x = [0]
    player1.y = [0]
    player2.x = [0]
    player2.y = [0]
    Plotly.redraw('plot');
}
