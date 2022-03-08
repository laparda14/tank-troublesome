let canvas;

let WIDTH, HEIGHT;

let game;

let debug = false;

function mouseCoords(){
	return {x:mouseX*WIDTH/width-game.maze.wall_width/2, y:mouseY*HEIGHT/height-game.maze.wall_width/2}
}

function setup(){
	canvas = createCanvas(windowHeight*0.9,windowHeight*0.9);
	canvas.parent("sketch");

	red_scoring = createDiv("0");
	
	red_scoring.style("background:red; width: 100px; height: 100px; display:flex; align-items:center; justify-content:center; font-size: 20px");
	red_scoring.parent("left-scoring");

	red_scoring.html("50");

	WIDTH = 900;
	HEIGHT = 900;

	frameRate(60);

	game = new Game();
	game.players.push(
		new Player({x:250,y:650}, 0, color(0,255,0), createPlayerArrowKeysInput("M"))
	);
	game.players.push(
		new Player({x:550, y:150}, 0, color(255,0,0), createPlayerKeyboardInput("SFEDQ"))
	);

	canvas.style("border", floor(game.maze.wall_width/2*width/WIDTH) + "px solid black");
}

function draw(){
	scale(width/WIDTH);
	background(230);

	game.update();
	game.draw();

}

// can't be held
function keyPressed(){
	if (key == "c"){
		game.bullets = [];
	}
}