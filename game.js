function Game(){
	this.maze = new Maze();
	this.bullets = [];
}

Game.prototype.update = function(dt){
	// decrement life on all bullets
	this.bullets.map(b=>b.life--);

	// remove expired bullets
	this.bullets = this.bullets.filter(b=>b.life>0);

	// move bullets
	this.bullets.map(b=>b.update_pos(dt));

	// handle bullet collisions with maze
	this.bullets.map(b=>this._handle_maze_bullet_collisions(b));


};

Game.prototype.draw = function(){
	// draw the maze
	this.maze.draw();

	// show bullet paths
	/*
	for (let j=0; j<this.bullets.length; j++){
		const special = this.bullets[j];
		const copy = new Bullet(Object.assign({}, special.pos), special.r, special.life);
		copy.dir = Object.assign({}, special.dir);
		for (let i=0; i<copy.life+10; i++){
			copy.update_pos(1);
			this._maze_bullet_collision(copy);
			if (i%10==0){
				fill(255,0,0,50*(copy.life+10 - i)/(copy.life+10));
				noStroke();
				ellipse(copy.pos.x, copy.pos.y, copy.r*10, copy.r*10);
			}
		}
	}
	*/

	// draw the bullets
	this.bullets.map(b=>b.draw());
};


function Bullet(pos, angle, speed, r=6, life=1800){
	this.pos = pos;

	this.dir = {x:cos(angle), y:sin(angle)};

	this.speed = speed;

	this.r = r;
	this.life = life;
}

Bullet.prototype.update_pos = function (dt){
	this.pos.x += this.dir.x*this.speed*dt;
	this.pos.y += this.dir.y*this.speed*dt;
};

Bullet.prototype.draw = function (){
	noStroke();
	fill(0);
	if (this.life < 10){
		fill(230 - 230*this.life/10)
	}
	ellipse(this.pos.x, this.pos.y, this.r*2, this.r*2);
};

/*
Generic collision checks
*/

Game.prototype._line_circle_intersect = function (x_0, y_0, dir, circle){
	const d_x = x_0 - circle.x;
	const d_y = y_0 - circle.y;
	
	const b = dir.x*d_x + dir.y*d_y;
	const c = d_x*d_x + d_y*d_y - circle.r*circle.r;
	
	const disc = b*b - c;
	if (disc < 0){
		return [];
	}
	
	const sqrt_disc = sqrt(disc);
	return [-b - sqrt_disc, -b + sqrt_disc];
}

// collision information with a moving circle and (non-rotated) rectangle
Game.prototype._circle_rectangle_collision = function (c, r, dir){
	let col = {};
	col.type = "moving circle - rectangle";
	const center = {x:r.x+r.width/2, y:r.y+r.height/2};
	const x_center_dist = abs(c.x - center.x);
	const y_center_dist = abs(c.y - center.y);
	if (x_center_dist > c.r + r.width/2 || y_center_dist > c.r + r.height/2){
		col.collision = false;
	}  else if (x_center_dist <= r.width/2 || y_center_dist <= r.height/2) {
		col.collision = true;
	} else {
		col.collision = (x_center_dist-r.width/2)*(x_center_dist-r.width/2) + (y_center_dist-r.height/2)*(y_center_dist-r.height/2) <= c.r*c.r;
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

	// TODO

	// find how far vertical_checkpoint_x is away from vertical_x (abs?)
	const vertical_checkpoint_x_dist = vertical_checkpoint_x - vertical_x;
	
	// calculate y value for lines starting at (vertical_x, horizontal_y) and (vertical_x, other_y)
	const y_shared_line = dir.y*vertical_checkpoint_x_dist/dir.x + horizontal_y;
	const y_vertical_check_line = dir.y*vertical_checkpoint_x_dist/dir.x + other_y;
	
	// see if vertical_checkpoint_y is in between the values
	// if it is you can be done pretty easily
	if (abs(y_shared_line - vertical_checkpoint_y) + abs(y_vertical_check_line - vertical_checkpoint_y) <= abs(y_shared_line - y_vertical_check_line) + 0.01){
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
	
	if (abs(x_shared_line - horizontal_checkpoint_x) + abs(x_horizontal_check_line - horizontal_checkpoint_x) <= abs(x_shared_line - x_horizontal_check_line) + 0.01){
		col.side = exit_horizontal_side;
		col.side_orientation = "horizontal";
		col.dist = -horizontal_checkpoint_y_dist/dir.y;
		return col;
	}
	

	// if it still isn't inside, it in the corner
	col.side = "corner";
	
	// you need to know if lines intersect circles
	
	
	// there are three possible corners, try (vertial_x, horizontal_y) first
	
	const corner_shared_intersects = this._line_circle_intersect(vertical_x, horizontal_y, dir, c).filter(x=>x>=0);
	if (corner_shared_intersects.length > 0){
		col.dist = -max(corner_shared_intersects);
		return col;
	}
	
	// then (vertical_x, other_y) and (other_x, horizontal_y)
	const corner_vertical_intersects = this._line_circle_intersect(vertical_x, other_y, dir, c).filter(x=>x>=0);
	if (corner_vertical_intersects.length > 0){
		col.dist = -max(corner_vertical_intersects);
		return col;
	}
	
	// then (vertical_x, other_y) and (other_x, horizontal_y)
	const corner_horizontal_intersects = this._line_circle_intersect(other_x, horizontal_y, dir, c).filter(x=>x>=0);
	if (corner_horizontal_intersects.length > 0){
		col.dist = -max(corner_horizontal_intersects);
		return col;
	}
	
	alert("UH OH");

	// the point of intersection is the last point that will be in the rectangle
	// the distance from the corner to that point is the distance

};

// collision information with moving circle and a circle
Game.prototype._circle_circle_collision = function (c1, c2, dir){
	const sq_dist = (c1.x-c2.x)*(c1.x-c2.x) + (c1.y-c2.y)*(c1.y-c2.y);
	const col = {collision:sq_dist <= (c1.r + c2.r)*(c1.r + c2.r)};
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
	const cells_to_check = this._bullet_possible_intersect_cells(bullet);
	let walls_to_check = [];
	let walls_already_checking = {};

	for (let i=0; i<cells_to_check.length; i++){
		for (let j=0; j<4; j++){

			const wall = {row:cells_to_check[i].row, col:cells_to_check[i].col, dir:DIRS[j].dir};

			if (!walls_already_checking.hasOwnProperty(JSON.stringify(wall))){
				
				if (this.maze.cells[wall.row][wall.col][wall.dir]){
					walls_to_check.push(wall);
				}

				walls_already_checking[JSON.stringify(this.maze.get_same_wall(wall.row, wall.col, wall.dir))] = 0;

			}
		}
	}

	// find the shapes that need to be checked for collisions
	const shapes_to_check = walls_to_check.map(w=>this.maze.get_wall_shapes(w.row, w.col, w.dir));

	let collisions = [];

	let circles_already_checked = {};

	// check collision on each of the shapes
	// if there is a collision, handle it
	// after one collision is found, keep going just in case, but I might change that later
	for (let i=0; i<shapes_to_check.length; i++){
		const shapes = shapes_to_check[i];
		const rectangle = shapes.rectangle;
		const circle1 = shapes.circle1;
		const circle2 = shapes.circle2;


		const bullet_shape = {x:bullet.pos.x, y:bullet.pos.y, r:bullet.r};

		// add rect collision to list if needed
		const rect_col = this._circle_rectangle_collision(bullet_shape, rectangle, bullet.dir);
		if (rect_col.collision){
			collisions.push(rect_col);
		}

		// add circles to list if needed
		const circle1_json = floor(circle1.x) + " " + floor(circle1.y) + " " + floor(circle1.r);
		const circle2_json = floor(circle2.x) + " " + floor(circle2.y) + " " + floor(circle2.r);
		if (!circles_already_checked.hasOwnProperty(circle1_json)){
			circles_already_checked[circle1_json] = 0;

			const circle_col = this._circle_circle_collision(bullet_shape, circle1, bullet.dir);
			if (circle_col.collision){
				collisions.push(circle_col);
			}
		}
		if (!circles_already_checked.hasOwnProperty(circle2_json)){
			circles_already_checked[circle2_json] = 0;

			const circle_col = this._circle_circle_collision(bullet_shape, circle2, bullet.dir);
			if (circle_col.collision){
				collisions.push(circle_col);
			}
		}


	}

	collisions.sort((x,y)=>x.dist>y.dist);
	
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

// get an array of all cells a bullet could possibly be touching (using a bounding box)
Game.prototype._bullet_possible_intersect_cells = function (bul){
	// a box is either in 1, 2, or 4 cells
	// we only need to check two opposite corners

	const min_cell = this.maze.get_cell(bul.pos.x - bul.r - this.maze.wall_width/2, bul.pos.y - bul.r - this.maze.wall_width/2);
	const max_cell = this.maze.get_cell(bul.pos.x + bul.r + this.maze.wall_width/2, bul.pos.y + bul.r + this.maze.wall_width/2);

	let possible_cells = [];
	for (let i=max(min_cell.row,0); i<=min(max_cell.row,this.maze.size-1); i++){
		for (let j=max(min_cell.col,0); j<=min(max_cell.col,this.maze.size-1); j++){
			possible_cells.push({row:i, col:j});
		}
	}
	return possible_cells;

};