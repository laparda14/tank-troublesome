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
Generic collision checks
*/

// collision information with moving circle and a circle

// c1 = {x:<center x>, y:<center y>, r:<radius>};
// c2 = {x:<center x>, y:<center y>, r:<radius>};
// dir = {x:<x component>, y:<y component>}; <-- normalized
Game.prototype._circle_circle_collision = function (c1, c2, dir){
	const sq_dist = (c1.x-c2.x)*(c1.x-c2.x) + (c1.y-c2.y)*(c1.y-c2.y);
	const col = {collision:sq_dist < (c1.r + c2.r)*(c1.r + c2.r) - EPSILON};
	col.type = "moving circle - circle";
	if (col.collision){
		const dist_center_x = c1.x - c2.x;
		const dist_center_y = c1.y - c2.y;

		// find dist
		const b = dist_center_x*dir.x + dist_center_y*dir.y;
		const c = sq_dist - (c1.r + c2.r)*(c1.r + c2.r);

		const disc = sqrt(b*b - c);

		const sol1 = -b + disc;
		const sol2 = -b - disc;

		if (sol1 > 0){
			col.dist = sol2;
		} else if (sol2 > 0){
			col.dist = sol1;
		} else {
			col.dist = max(sol1, sol2);
		}

		// find unit normal
		col.normal = {x: dist_center_x + col.dist*dir.x, y:dist_center_y + col.dist*dir.y};
		const mag_mult = 1/sqrt(col.normal.x*col.normal.x + col.normal.y*col.normal.y);
		col.normal.x *= mag_mult;
		col.normal.y *= mag_mult;

	}


	return col;
};


// x0 = <origin of line x>
// y0 = <origin of line y>
// dir = {x:<x component>, y:<y component>}; <-- direction of line, normalized
// circle = {x:<center x>, y:<center y>, r:<radius>};
Game.prototype._line_circle_intersect = function (x0, y0, dir, circle){
	const d_x = x0 - circle.x;
	const d_y = y0 - circle.y;
	
	const b = dir.x*d_x + dir.y*d_y;
	const c = d_x*d_x + d_y*d_y - circle.r*circle.r;
	
	const disc = b*b - c;
	if (disc < 0){
		return [];
	}
	
	const sqrt_disc = sqrt(disc);
	return [-b - sqrt_disc, -b + sqrt_disc];
};



// collision information with a moving circle and (non-rotated) rectangle
// WARNING: only works if rectangle is larger than circle

// c = {x:<center x>, y:<center y>, r:<radius>};
// r = {x:<top-left x>, y:<top-left y>, width:<width>, height:<height>};
// dir = {x:<x component>, y:<y component>}; <-- normalized
Game.prototype._circle_rectangle_collision = function (c, r, dir){
	let col = {};
	col.type = "moving circle - rectangle";
	const center = {x:r.x+r.width/2, y:r.y+r.height/2};
	const x_center_dist = abs(c.x - center.x);
	const y_center_dist = abs(c.y - center.y);
	if (x_center_dist + EPSILON >= c.r + r.width/2 || y_center_dist + EPSILON >= c.r + r.height/2){
		col.collision = false;
	}  else if (x_center_dist + EPSILON < r.width/2 || y_center_dist + EPSILON < r.height/2) {
		col.collision = true;
	} else {
		col.collision = (x_center_dist-r.width/2)*(x_center_dist-r.width/2) + (y_center_dist-r.height/2)*(y_center_dist-r.height/2) + EPSILON < c.r*c.r;
	}

	if (!col.collision){
		return col;
	}
	col.rect_orientation = r.orientation;
	
	
	const exit_vertical_side = dir.x > 0 ? "left" : "right";
	const exit_horizontal_side = dir.y > 0 ? "top" : "bottom";

	const vertical_x = exit_vertical_side=="left" ? r.x : r.x+r.width;
	const other_x = exit_vertical_side!="left" ? r.x : r.x+r.width;

	const horizontal_y = exit_horizontal_side=="top" ? r.y : r.y+r.height;
	const other_y = exit_horizontal_side!="top" ? r.y : r.y+r.height;

	// check if it exits the vertical side
	const vertical_checkpoint_x = exit_vertical_side=="left" ? c.x + c.r : c.x - c.r;
	const vertical_checkpoint_y = c.y;

	// find how far vertical_checkpoint_x is away from vertical_x (abs?)
	const vertical_checkpoint_x_dist = vertical_checkpoint_x - vertical_x;
	
	// calculate y value for lines starting at (vertical_x, horizontal_y) and (vertical_x, other_y)
	const y_shared_line = dir.y*vertical_checkpoint_x_dist/dir.x + horizontal_y;
	const y_vertical_check_line = dir.y*vertical_checkpoint_x_dist/dir.x + other_y;
	
	// see if vertical_checkpoint_y is in between the values
	// if it is you can be done pretty easily
	if (abs(y_shared_line - vertical_checkpoint_y) + abs(y_vertical_check_line - vertical_checkpoint_y) <= abs(y_shared_line - y_vertical_check_line) + EPSILON){
		col.side = exit_vertical_side;
		col.side_orientation = "vertical";
		col.dist = -vertical_checkpoint_x_dist/dir.x;
		return col;
	}

	// if not, do the same for horizontal
	// but flip x and y
	
	const horizontal_checkpoint_x = c.x;
	const horizontal_checkpoint_y = exit_horizontal_side=="top" ? c.y + c.r : c.y - c.r;
	
	const horizontal_checkpoint_y_dist = horizontal_checkpoint_y - horizontal_y;
	const x_shared_line = dir.x*horizontal_checkpoint_y_dist/dir.y + vertical_x;
	const x_horizontal_check_line = dir.x*horizontal_checkpoint_y_dist/dir.y + other_x;
	
	if (abs(x_shared_line - horizontal_checkpoint_x) + abs(x_horizontal_check_line - horizontal_checkpoint_x) <= abs(x_shared_line - x_horizontal_check_line) + EPSILON){
		col.side = exit_horizontal_side;
		col.side_orientation = "horizontal";
		col.dist = -horizontal_checkpoint_y_dist/dir.y;
		return col;
	}
	

	// if it still isn't inside, it in the corner
	col.side = "corner";
	
	// you need to know if lines intersect circles
	
	
	// there are three possible corners, try (vertial_x, horizontal_y) first
	const corner_shared_intersects = this._line_circle_intersect(vertical_x, horizontal_y, dir, c);
	if (corner_shared_intersects[0] >= 0 || corner_shared_intersects[1] >= 0){
    	col.dist = corner_shared_intersects[0]>corner_shared_intersects[1]?-corner_shared_intersects[0]:-corner_shared_intersects[1];
    	return col;
	}
	
	// then (vertical_x, other_y) and (other_x, horizontal_y)
	const corner_vertical_intersects = this._line_circle_intersect(vertical_x, other_y, dir, c);
	if (corner_vertical_intersects[0] >= 0 || corner_vertical_intersects[1] >= 0){
    	col.dist = corner_vertical_intersects[0]>corner_vertical_intersects[1]?-corner_vertical_intersects[0]:-corner_vertical_intersects[1];
    	return col;
	}
	
	// then (vertical_x, other_y) and (other_x, horizontal_y)
	const corner_horizontal_intersects = this._line_circle_intersect(other_x, horizontal_y, dir, c);
	if (corner_horizontal_intersects[0] >= 0 || corner_horizontal_intersects[1] >= 0){
    	col.dist = corner_horizontal_intersects[0]>corner_horizontal_intersects[1]?-corner_horizontal_intersects[0]:-corner_horizontal_intersects[1];
    	return col;
	}
	
	alert("UH OH");

	// the point of intersection is the last point that will be in the rectangle
	// the distance from the corner to that point is the distance

};

// collision information with a moving rotated rectangle and a circle
// transform to a regular rectangle and a moving circle
// WARNING: only works if rectangle is larger than circle

// r = {center_x:<center x>, center_y:<center y>, length:<length>, width:<width>, angle: <angle of rotation>};
// c = {x:<center x>, y:<center y>, r:<radius>};
// dir = {x:<x component>, y:<y component>}; <-- normalized
Game.prototype._rot_rectangle_circle_collision = function (r, c, dir){
	// TODO
	const rel_c_x = c.x - r.center_x;
	const rel_c_y = c.y - r.center_y;

	const transformed_c_x = cos(r.angle)*rel_c_x + sin(r.angle)*rel_c_y;
	const transformed_c_y = -sin(r.angle)*rel_c_x + cos(r.angle)*rel_c_y;
	const transformed_dir = {
		x: -(cos(r.angle)*dir.x + sin(r.angle)*dir.y),
		y: -(-sin(r.angle)*dir.x + cos(r.angle)*dir.y)
	};

	const transformed_rect = {x:-r.length/2, y:-r.width/2, width:r.length, height:r.width};
	const transformed_circle = {x:transformed_c_x, y:transformed_c_y, r:c.r};

	const transformed_col = this._circle_rectangle_collision(transformed_circle, transformed_rect, transformed_dir);

	const col = {};
	col.type = "moving rotated rectangle - circle";
	col.collision = transformed_col.collision;
	if (col.collision){
		col.dist = transformed_col.dist;
	}
	console.log(transformed_col);
	// TODO here
	// TODO
	// TODO
	// don't need to return what side it contacts
	// need to find what point on the circle it contacts (and more importantly the tangent line)
	// this tangent line will be used to figure out movement of the rectangle after collision
	// this might only need to be done if a corner contacts????? so maybe do return if it is "right" or "corner"
	// reverse engineer the quadratic in the other method to find the point of corner contact
		// if you really need to just look at which point is closest to the center of the circle...top right or bottom right
	// the amount the rectangle moves after the collision should be projection of direction onto tangent vector
		// move a small step this amount (1/2 of time left???) (taking off time of the frame)
		// move more in direction
		// repeat


	return col;
};




// collision information with moving 1d interval and a 1d interval
// for use in SAT

// i1 = {start:<min of interval>, end:<max of interval>};
// i1 = {start:<min of interval>, end:<max of interval>};
// dir = <component of direction projected onto interval>;
Game.prototype._interval_interval_collision = function (i1, i2, dir){
	let col = {};
	col.type = "moving interval - interval";

	const first = i1.start<i2.start ? i1 : i2;
	const second = first===i1 ? i2 : i1;

	col.collision = first.end > second.start + EPSILON;

	if (col.collision){
		if (abs(dir)<EPSILON){
			col.dist = Infinity;
		} else if (dir > 0){
			col.dist = (i1.end - i2.start)/(-dir);
		} else {
			col.dist = (i2.end - i1.start)/dir;
		}
	}

	return col;
};


// collision information with a moving rotated rectangle and a rectangle
// uses SAT

// r1 = {center_x:<center x>, center_y:<center y>, length:<length>, width:<width>, angle:<angle of rotation>};
// r2 = {x:<top-left x>, y:<top-left y>, width:<width>, height:<height>};
// dir = {x:<x component>, y:<y component>}; <-- normalized
Game.prototype._rot_rectangle_rectangle_collision = function (r1, r2, dir){
	// TODO
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
	let collisions = shapes_to_check.map(s=>s.type=="rectangle"?this._circle_rectangle_collision(bullet_shape, s, bullet.dir):this._circle_circle_collision(bullet_shape, s, bullet.dir));
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