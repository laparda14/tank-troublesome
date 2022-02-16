let WIDTH, HEIGHT;

let game;

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
	game.players.push(
		new Player({x:250,y:650}, 0, color(255,0,0), createPlayerArrowKeysInput("M"))
	);
	game.players.push(
		new Player({x:550, y:150}, 0, color(0,255,0), createPlayerKeyboardInput("SFEDQ"))
	);

	canvas.style("border", floor(game.maze.wall_width/2*width/WIDTH) + "px solid black");
}


function draw_rot_rect(r){
	translate(r.center_x, r.center_y);
	rotate(r.angle);
	stroke(0);
	strokeWeight(1);
	fill(255,0,0);
	rect(-r.length/2, -r.width/2, r.length, r.width);
	resetMatrix();
}

function draw(){
	//scale(width/WIDTH);
	background(230);
	
	angle = 1;
	dir = {x:cos(angle), y:sin(angle)};

	// moving rect
	shape1 = {center_x:mouseX, center_y:mouseY, length:200, width:100, angle:angle};

	// circle
	shape2 = {x:200, y:200, r:20};

	stroke(0);
	strokeWeight(2);
	line(shape1.center_x, shape1.center_y, shape1.center_x+dir.x*150, shape1.center_y+dir.y*150);

	noStroke();
	fill(255,0,0);
	draw_rot_rect(shape1);

	fill(0,0,255)
	ellipse(shape2.x, shape2.y, shape2.r*2, shape2.r*2);

	
	collision = rot_rectangle_circle_collision(shape1, shape2, dir);
	if (frameCount % 60 == 0){
		console.log(collision);
	}
	if (collision.collision){
		fill(0,205,0);
		shape1.center_x += collision.dist*dir.x;
		shape1.center_y += collision.dist*dir.y;
		draw_rot_rect(shape1);

	}
	

	/*if (!debug){
		game.update();
	}
	game.draw();*/
	

}

// can't be held
function keyPressed(){
	if (key == "c"){
		game.bullets = [];
	}
}