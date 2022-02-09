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
	player = new Player({x:250,y:650}, 0, color(255,0,0), createPlayerArrowKeysInput("M"));
	player2 = new Player({x:550, y:150}, 0, color(0,255,0), createPlayerKeyboardInput("SFEDQ"))

	canvas.style("border", floor(game.maze.wall_width/2*width/WIDTH) + "px solid black");
}

function draw(){
	scale(width/WIDTH);
	background(230);
	console.log(player.input_getter());
	const shoot = player.handle_input();
	if (shoot){
		for (let i=0; i<10; i++){
			game.bullets.push(new Bullet({x:player.pos.x + cos(player.angle)*25, y:player.pos.y + sin(player.angle)*25}, player.angle + 2*PI/10*i, 4));
		}
	}
	player.draw();

	const shoot2 = player2.handle_input();
	if (shoot2){
		for (let i=0; i<6; i++){
			game.bullets.push(new Bullet({x:player2.pos.x + cos(player2.angle)*25, y:player2.pos.y + sin(player2.angle)*25}, player2.angle - PI/8 + 2*PI/8*i/5, 4));
		}
	}
	player2.draw();
	
	if (!debug){
		game.update();
	}
	game.draw();
	

}

// can't be held
function keyPressed(){
	if (key == "c"){
		game.bullets = [];
	}
}