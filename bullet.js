function Bullet(pos, angle, speed, r, life){
	this.pos = pos;

	this.dir = {x:cos(angle), y:sin(angle)};

	this.speed = speed;

	this.r = r;
	this.life = life;

	this.working = true;
}

Bullet.prototype.update_pos = function (dt){
	this.pos.x += this.dir.x*this.speed*dt;
	this.pos.y += this.dir.y*this.speed*dt;
};

Bullet.prototype.draw = function (){
	noStroke();
	fill(0);
	if (this.life < 20){
		fill(230 - 230*this.life/20);
	}
	ellipse(this.pos.x, this.pos.y, this.r*2, this.r*2);
};