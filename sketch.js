let WIDTH, HEIGHT, MOUSE_OFFSET;

let game;
debug = false;
info = {};
angle = 3.14;

function draw_debug(info){
	noStroke();
	background(255);
	fill(50,50,50,90);
	rect(info.rect_shape.x, info.rect_shape.y, info.rect_shape.width, info.rect_shape.height);
	fill(90,90,90,90);
	ellipse(info.circle1_shape.x, info.circle1_shape.y, info.circle1_shape.r*2, info.circle1_shape.r*2);
	ellipse(info.circle2_shape.x, info.circle2_shape.y, info.circle2_shape.r*2, info.circle2_shape.r*2);
	fill(255,0,0,90);
	ellipse(info.bullet.pos.x, info.bullet.pos.y, info.bullet.r*2, info.bullet.r*2);
}


function setup(){
	const canvas = createCanvas(windowHeight*0.9,windowHeight*0.9);
	canvas.parent("sketch");

	WIDTH = width;
	HEIGHT = height;

	frameRate(30);

	game = new Game();
	canvas.style("border", game.maze.wall_width/2 + "px solid black");
	MOUSE_OFFSET = game.maze.wall_width/2;
}

function draw(){
	//scale(width/WIDTH);
	background(230);
	
	c = {x:mouseX-MOUSE_OFFSET, y:mouseY-MOUSE_OFFSET, r:30};
	r = {x:50, y:100, width:300, height:200};
	dir = {x:cos(angle),y:sin(angle)};
	collision = game._circle_rectangle_collision(c,r,dir);
	if (frameCount % 20 == 0){
		console.log(collision);
	}
	noStroke();
	fill(255,0,0,90);
	ellipse(c.x, c.y, c.r*2, c.r*2);
	fill(255,0,0,50);
	ellipse(c.x + dir.x*collision.dist, c.y + dir.y*collision.dist, c.r*2, c.r*2);
	fill(0,255,0,90);
	rect(r.x, r.y, r.width, r.height);
	
	strokeWeight(2);
	stroke(0);
	line(c.x,c.y,c.x+dir.x*100,c.y+dir.y*100);
	

	
/*
		game.draw(); // this is moved here for now so I can debug collisions easier
		//game.update(1);
	//game.draw();*/


}


function keyPressed(){
	console.log(angle);
	angle += 0.1;
	if (key=="u"){
		game.update(1);
	} else if (key=="b"){
		game.bullets.push(new Bullet({x:mouseX-MOUSE_OFFSET, y:mouseY-MOUSE_OFFSET}));
	} else if (key=="c"){
		game.bullets = [];
	}
}