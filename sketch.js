let WIDTH, HEIGHT;

let game;

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
	canvas.style("border", floor(game.maze.wall_width/2*width/WIDTH) + "px solid black");
}

function draw(){
	scale(width/WIDTH);
	background(230);

	// moving controls, can be held
	if (keyIsDown(LEFT_ARROW)){
		angle -= 0.08;
	} else if (keyIsDown(RIGHT_ARROW)){
		angle += 0.08;
	}
	if (keyIsDown(UP_ARROW)){
		x += 3*cos(angle);
		y += 3*sin(angle);
	} else if (keyIsDown(DOWN_ARROW)){
		x -= 2*cos(angle);
		y -= 2*sin(angle);
	}
	
	if (!debug){
		game.update();
	}
	game.draw();

	fill(0,0,255);
	noStroke();
	ellipse(x,y,50);
	
	strokeWeight(5);
	stroke(0);
	line(x,y,x+30*cos(angle),y+30*sin(angle));

}

// can't be held
function keyPressed(){
	if (key == "m"){
		for (let i=0; i<10; i++){
			game.bullets.push(new Bullet({x:x + cos(angle + i/10)*25, y:y + sin(angle + i/10)*25}, angle + i/10, 4));
		}
		
	} if (key == "c"){
		game.bullets = [];
	}
}