function Player(pos, angle, color){
	this.pos = pos; // center
	this.angle = angle;

	this.width = 42;
	this.height = 56;

	this.turn_speed = 0.07;
	this.forward_speed = 3;
	this.back_speed = 2;

	this.color = color;
}

Player.prototype.draw = function (){
	translate(this.pos.x, this.pos.y);
	rotate(this.angle);
	stroke(0);
	strokeWeight(1);
	fill(this.color);
	rect(-this.height/2, -this.width/2, this.height, this.width);
	ellipse(0,0,this.width*3/4,this.width*3/4);
	rect(0, -this.width/6, this.height/2+this.height*0.1, this.width/3);

	resetMatrix();
	scale(width/WIDTH);
};

Player.prototype.turn = function (left){
	if (left){
		this.angle -= this.turn_speed;
	} else {
		this.angle += this.turn_speed;
	}
};

Player.prototype.move = function (forward){
	if (forward){
		this.pos.x += this.forward_speed*cos(this.angle);
		this.pos.y += this.forward_speed*sin(this.angle);
	} else {
		this.pos.x -= this.back_speed*cos(this.angle);
		this.pos.y -= this.back_speed*sin(this.angle);
	}
};