// TODO clean up comments

const EPSILON = 0.01;

function Game(){
	this.maze = new Maze();
	this.bullets = [];
	this.players = [];
}

Game.prototype.update = function(){
	// move players, shoot bullets
	for (const p of this.players){
		const shoot = p.handle_input();
		if (shoot){
			this.bullets.push(p.create_bullet());
		}
	}

	// player wall collisions
	// TODO TODO

	// move bullets
	// bullet maze collisions
	this.bullets = this.bullets.filter(b=>{
		const alive = (--b.life)>0;
		if (alive){
			b.update_pos(1);
			this._handle_maze_bullet_collisions(b);
		}
		return alive;
	});

	// player bullet collisions
		// go through bullets and put into grids
		// TODO TODO

};

Game.prototype.draw = function(){

	/*
	// show bullet paths	
	for (let j=0; j<this.bullets.length; j++){
		const special = this.bullets[j];
		const copy = new Bullet;
		copy.pos = Object.assign({}, special.pos);
		copy.dir = Object.assign({}, special.dir);
		copy.speed = special.speed;
		copy.r = special.r;
		copy.life = special.life;
		for (let i=0; i<10 + special.life; i++){
			copy.update_pos(1);
			copy.life -= 1;
			this._handle_maze_bullet_collisions(copy);
			if (i%20==0){
				fill(255,0,0,255*(copy.life + 10 - i)/(copy.life + 10));
				noStroke();
				ellipse(copy.pos.x, copy.pos.y, copy.r*10, copy.r*10);
			}
		}
	}
	*/

	// draw the maze
	this.maze.draw();
	
	// draw the players
	for (const p of this.players){
		p.draw();
	}

	// draw the bullets
	for (const b of this.bullets){
		b.draw();
	}
};


/*
Collision between maze and bullets
*/

Game.prototype._handle_maze_bullet_collisions = function (bullet){
	// repeat a max of five times
	// if resolving a collision creates another collision, just hope it doesn't do
	// it more than five time
	for (let i=0; i<5; i++){
		
		let collisions = this._find_maze_bullet_collisions(bullet);
		
		// if there are no collisions, we are done
		if (collisions.length == 0){
			return;
		}
		
		// rewind reality to the point before the collision
		const time = collisions[0].dist / bullet.speed;
		bullet.update_pos(time);

		if (collisions[0].type == "moving circle - circle"){
			this._handle_bullet_collision_circle(bullet, collisions[0]);
		} else {
			this._handle_bullet_collision_rect(bullet, collisions[0]);
		}

		// move time back forward
		bullet.update_pos(-time);
		
	}
	
};

Game.prototype._find_maze_bullet_collisions = function (bullet){
	// find the walls that need to be checked for collisions
	const bounding_box = {x:bullet.pos.x-bullet.r, y:bullet.pos.y-bullet.r, width:bullet.r*2, height:bullet.r*2};

	// find the shapes that need to be checked for collisions
	const shapes_to_check = this.maze.rect_possible_intersect_shapes(bounding_box);

	const bullet_shape = {x:bullet.pos.x, y:bullet.pos.y, r:bullet.r};

	// check collision on each of the shapes
	let collisions = shapes_to_check.map(s=>s.type=="rectangle"?circle_rectangle_collision(bullet_shape, s, bullet.dir):circle_circle_collision(bullet_shape, s, bullet.dir));
	collisions = collisions.filter(c=>c.collision);


	collisions.sort((x,y)=>x.dist-y.dist);
	
	return collisions;

};



Game.prototype._handle_bullet_collision_rect = function (bullet, col){
	if (col.side == "corner"){
		col.side_orientation = col.rect_orientation;
	}

	if (col.side_orientation == "horizontal"){
		bullet.dir.y *= -1;
	} else {
		bullet.dir.x *= -1;
	}

};

Game.prototype._handle_bullet_collision_circle = function (bullet, col){

	const normal_dot_dir = bullet.dir.x*col.normal.x + bullet.dir.y*col.normal.y;
	bullet.dir.x = bullet.dir.x - 2*col.normal.x*normal_dot_dir;
	bullet.dir.y = bullet.dir.y - 2*col.normal.y*normal_dot_dir;

};



/*
Collision between maze and player
*/
Game.prototype._handle_maze_player_collisions = function (player){
	// repeat a max of five times
	// if resolving a collision creates another collision, just hope it doesn't do
	// it more than five time

	// this is how it worked for bullets
	/*
	for (let i=0; i<5; i++){
		
		let collisions = this._find_maze_bullet_collisions(bullet);
		
		// if there are no collisions, we are done
		if (collisions.length == 0){
			return;
		}
		
		// rewind reality to the point before the collision
		const time = collisions[0].dist / bullet.speed;
		bullet.update_pos(time);

		if (collisions[0].type == "moving circle - circle"){
			this._handle_bullet_collision_circle(bullet, collisions[0]);
		} else {
			this._handle_bullet_collision_rect(bullet, collisions[0]);
		}

		// move time back forward
		bullet.update_pos(-time);
		
	}
	*/
	
};