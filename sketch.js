let canvas;

const WIDTH = 900;
const HEIGHT = 900;

let game;

let players_info;
let red_scoring, green_scoring;

function reset_game(){
	for (const id in players_info){
		players_info[id].score_element.html(players_info[id].score);
	}
	game = new Game();
	for (const id in players_info){
		game.create_player(id, players_info[id].color, players_info[id].input_getter);
	}
}

function setup(){
	const canvas_size = floor(min(windowHeight*0.9,windowWidth*0.9 - 300));
	canvas = createCanvas(canvas_size, canvas_size);
	canvas.parent("sketch");

	green_scoring = createDiv("0");
	green_scoring.style("background:#00EE00; position: absolute; top: 60%; width: 100px; height: 100px; display:flex; align-items:center; justify-content:center; font-size: 40px");
	green_scoring.parent("right-scoring");

	red_scoring = createDiv("0");
	red_scoring.style("background:#EE0000; position: absolute; top: 60%; width: 100px; height: 100px; display:flex; align-items:center; justify-content:center; font-size: 40px");
	red_scoring.parent("left-scoring");


	players_info = {
		"Player 1": {
			color: color(0,255,0),
			input_getter: createPlayerArrowKeysInput("M"),
			score: 0,
			score_element: green_scoring
		},
		"Player 2": {
			color: color(255,0,0),
			input_getter: createPlayerKeyboardInput("SFEDQ"),
			score: 0,
			score_element: red_scoring
		}
	}

	reset_game();

	frameRate(60);
	canvas.style("border", floor(game.maze.wall_width/2*width/WIDTH) + "px solid black");
}

function draw(){
	scale(width/WIDTH);
	background(230);

	game.update();
	if (game.finished){
		const winner = game.get_winner();
		if (winner != null){
			players_info[winner].score ++;
		}
		reset_game();
	}
	game.draw();

}

function windowResized(){
	const canvas_size = floor(min(windowHeight*0.9,windowWidth*0.9 - 300));
	resizeCanvas(canvas_size, canvas_size);
	canvas.style("border", floor(game.maze.wall_width/2*width/WIDTH) + "px solid black");
}