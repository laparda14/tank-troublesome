function Player(pos, angle, color, input_getter){
	this.pos = pos; // center
	this.angle = angle;

	this.length = 56;
	this.width = 42;

	this.turn_speed = 0.07;
	this.forward_speed = 3;
	this.back_speed = 2;

	this.color = color;

	this.input_getter = input_getter;

	this._already_shot = false;
}

Player.prototype.draw = function (){
	translate(this.pos.x, this.pos.y);
	rotate(this.angle);
	stroke(0);
	strokeWeight(1);
	fill(this.color);
	rect(-this.length/2, -this.width/2, this.length, this.width);
	ellipse(0,0,this.width*3/4,this.width*3/4);
	rect(0, -this.width/6, this.length/2+this.length*0.1, this.width/3);

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

Player.prototype.create_bullet = function (speed=5, r=6, life=1800){
	const dist = this.length/2 + r;
	const pos = {x:this.pos.x + cos(this.angle)*dist, y:this.pos.y + sin(this.angle)*dist};

	return new Bullet(pos, this.angle, speed, r, life);
}

// input should be something like {left:false, right:false, forward:false, back:false, shoot:false}
// return false for no bullet or true for a bullet
Player.prototype.handle_input = function() {
	const input = this.input_getter();
	if (input.left && !input.right){
		this.turn(left=true);
	} else if (!input.left && input.right){
		this.turn(left=false);
	}

	if (input.forward && !input.back){
		this.move(forward=true);
	} else if (!input.forward && input.back){
		this.move(forward=false);
	}

	if (input.shoot){
		if (!this._already_shot){
			this._already_shot = true;
			return true;
		}
	} else {
		this._already_shot = false;
	}
	return false;
};

// input is "<left><right><forward><back><shoot>"
// make sure to use capital letters
function createPlayerKeyboardInput(s){
	const f = function (){
		const input = {};
		input.left = keyIsDown(s.charCodeAt(0));
		input.right = keyIsDown(s.charCodeAt(1));
		input.forward = keyIsDown(s.charCodeAt(2));
		input.back = keyIsDown(s.charCodeAt(3));
		input.shoot = keyIsDown(s.charCodeAt(4));
		return input;
	};
	return f;
}

function createPlayerArrowKeysInput(shoot){
	const f = function (){
		const input = {};
		input.left = keyIsDown(LEFT_ARROW);
		input.right = keyIsDown(RIGHT_ARROW);
		input.forward = keyIsDown(UP_ARROW);
		input.back = keyIsDown(DOWN_ARROW);
		input.shoot = keyIsDown(shoot.charCodeAt(0));
		return input;
	};
	return f;
}