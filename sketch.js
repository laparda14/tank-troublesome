let WIDTH, HEIGHT;

let game;
let player;

let x = 100;
let y = 100;
let angle = 0;
let debug = false;

function mouseCoords(){
	return {x:mouseX*WIDTH/width-game.maze.wall_width/2, y:mouseY*HEIGHT/height-game.maze.wall_width/2}
}

function setup(){
	const canvas = createCanvas(windowHeight*0.9,windowHeight*0.9);
	canvas.parent("sketch");

	WIDTH = 900;
	HEIGHT = 900;

	frameRate(60);

	game = new Game();
	player = new Player({x:250,y:650}, 0, color(255,0,0));
	canvas.style("border", floor(game.maze.wall_width/2*width/WIDTH) + "px solid black");
}

function draw(){
	scale(width/WIDTH);
	background(230);

	// moving controls, can be held
	if (keyIsDown(LEFT_ARROW)){
		player.turn(left=true);
	} else if (keyIsDown(RIGHT_ARROW)){
		player.turn(left=false);
	}
	if (keyIsDown(UP_ARROW)){
		player.move(forward=true);
	} else if (keyIsDown(DOWN_ARROW)){
		player.move(forward=false);
	}

	player.draw();
	
	game.update();
	game.draw();
	

}

// can't be held
function keyPressed(){
	if (key == "m"){
		game.bullets.push(new Bullet({x:player.pos.x + cos(player.angle)*25, y:player.pos.y + sin(player.angle)*25}, player.angle, 4));
		
	} if (key == "c"){
		game.bullets = [];
	}
}