function Game(){
	this.maze = new Maze();
	this.bullets = [];
	this.players = [];

	this._finishing = false;
	this._updates_to_finish = 60;
	this.finished = false;
}

Game.prototype.update = function(){
	// player bullet collisions
	this._generate_cell_bullets_map();
	for (const p of this.players){
		if (p.alive){
			this._handle_player_bullets_collisions(p);
		} else if (p._frames_to_hidden > 0){
			p._frames_to_hidden --;
		}
	}

	// start ending game if only one player is still alive


	// move players, shoot bullets
	for (const p of this.players){
		if (p.alive){
			const shoot = p.handle_input();
			if (shoot){
				this.bullets.push(p.create_bullet());
			}
		}
	}

	// player wall collisions
	for (const p of this.players){
		if (p.alive){
			this._handle_player_maze_collisions(p);
		}
	}

	// move bullets
	// bullet maze collisions
	this.bullets = this.bullets.filter(b=>{
		const alive = (--b.life)>0;
		if (alive){
			b.update_pos(1);
			this._handle_bullet_maze_collisions(b);
		}
		return alive;
	});

};

Game.prototype.draw = function(){

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
Collision between bullet and maze
*/


Game.prototype._handle_bullet_maze_collisions = function (bullet){
	// repeat a max of five times
	// if resolving a collision creates another collision, just hope it doesn't do
	// it more than five time
	for (let i=0; i<5; i++){
		
		let collisions = this._find_bullet_maze_collisions(bullet);
		
		// if there are no collisions, we are done
		if (collisions.length == 0){
			return;
		}
		
		const furthest_collision = collisions.reduce((a,b)=>a.dist<b.dist?a:b);

		// rewind reality to the point before the collision
		const time = furthest_collision.dist / bullet.speed;
		bullet.update_pos(time);

		if (furthest_collision.type == "moving circle - circle"){
			this._handle_bullet_collision_circle(bullet, furthest_collision);
		} else {
			this._handle_bullet_collision_rect(bullet, furthest_collision);
		}

		// move time back forward
		bullet.update_pos(-time);
		
	}
	
};

Game.prototype._find_bullet_maze_collisions = function (bullet){
	// find the walls that need to be checked for collisions
	const bounding_box = {x:bullet.pos.x-bullet.r, y:bullet.pos.y-bullet.r, width:bullet.r*2, height:bullet.r*2};

	// find the shapes that need to be checked for collisions
	const shapes_to_check = this.maze.rect_possible_intersect_shapes(bounding_box);

	const bullet_shape = {x:bullet.pos.x, y:bullet.pos.y, r:bullet.r};

	// check collision on each of the shapes
	let collisions = shapes_to_check.map(s=>s.type=="rectangle"?circle_rectangle_collision(bullet_shape, s, bullet.dir):circle_circle_collision(bullet_shape, s, bullet.dir));
	collisions = collisions.filter(c=>c.collision);
	
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
Collision between player and maze
*/
Game.prototype._handle_player_maze_collisions = function (player){
	// repeat a max of five times
	// if resolving a collision creates another collision, just hope it doesn't do
	// it more than five time

	for (let i=0; i<5; i++){
		let collisions = this._find_player_maze_collisions(player);
		if (collisions.length == 0){
			return;
		}

		let best_collision = {dist:Infinity}
		for (const c of collisions){
			// prioritize rectangle collisions over circle collisions
			if (c.type == "rotated rectangle - circle"){
				c.dist += 1;
			}

			if (c.dist<best_collision.dist){
				best_collision = c;
			}
		}

		// for rectangle collisions, only move in the direction normal to the wall
		if (best_collision.type == "rotated rectangle - rectangle"){
			best_collision.displacement.x = best_collision.r2_orientation == "horizontal" ? 0 : best_collision.displacement.x;
			best_collision.displacement.y = best_collision.r2_orientation == "horizontal" ? best_collision.displacement.y : 0;
		}

		player.pos.x += best_collision.displacement.x;
		player.pos.y += best_collision.displacement.y;
	}
	
	
};


Game.prototype._find_player_maze_collisions = function (player){

	// find the walls that need to be checked for collisions
	const player_points = [
		{x: player.pos.x + cos(player.angle)*player.length/2 - sin(player.angle)*player.width/2, y: player.pos.y + sin(player.angle)*player.length/2 + cos(player.angle)*player.width/2},
		{x: player.pos.x + cos(player.angle)*player.length/2 + sin(player.angle)*player.width/2, y: player.pos.y + sin(player.angle)*player.length/2 - cos(player.angle)*player.width/2},
		{x: player.pos.x - cos(player.angle)*player.length/2 - sin(player.angle)*player.width/2, y: player.pos.y - sin(player.angle)*player.length/2 + cos(player.angle)*player.width/2},
		{x: player.pos.x - cos(player.angle)*player.length/2 + sin(player.angle)*player.width/2, y: player.pos.y - sin(player.angle)*player.length/2 - cos(player.angle)*player.width/2}
	];
	const x_interval = _project_to_interval(player_points, {x:1,y:0});
	const y_interval = _project_to_interval(player_points, {x:0,y:1});
	const bounding_box = {x:x_interval.start, y:y_interval.start, width:x_interval.end-x_interval.start, height:y_interval.end-y_interval.start};

	// find the shapes that need to be checked for collisions
	const shapes_to_check = this.maze.rect_possible_intersect_shapes(bounding_box);

	const player_shape = {center_x: player.pos.x, center_y: player.pos.y, length: player.length, width: player.width, angle: player.angle};
	
	// check collision on each of the shapes
	let collisions = shapes_to_check.map(s=>s.type=="rectangle"?rot_rectangle_rectangle_collision(player_shape, s):rot_rectangle_circle_collision(player_shape, s));
	collisions = collisions.filter(c=>c.collision);
	
	return collisions;

};

/*
Collision between player and bullets
*/


Game.prototype._handle_player_bullets_collisions = function (player){

	const player_shape = {center_x: player.pos.x, center_y: player.pos.y, length: player.length, width: player.width, angle: player.angle};

	const bullet_shapes = this._get_possible_bullet_shapes(player);

	// loop through bullets, if one is colliding with the player, return true 
	for (const shape of bullet_shapes){
		if (check_rot_rectangle_circle_collision(player_shape, shape).collision){
			player.alive = false;
			this.bullets[shape.bullet_index].life = player._max_frames_to_hidden;
			this.bullets[shape.bullet_index].speed = 0;
			return;
		}
	}
	
};

Game.prototype._generate_cell_bullets_map = function () {
	this._cell_bullets_map = new Array(this.maze.size).fill(new Array(this.maze.size).fill([]));
	for (let k=0; k<this.bullets.length; k++){
		const bullet = this.bullets[k];
		const bullet_shape = {bullet_index: k, x: bullet.pos.x, y: bullet.pos.y, r: bullet.r, type: "circle"};
		bullet_shape.id = this.maze._get_shape_id(bullet_shape);

		const min_cell = this.maze.get_cell(bullet_shape.x - bullet_shape.r, bullet_shape.y - bullet_shape.r);
		const max_cell = this.maze.get_cell(bullet_shape.x + bullet_shape.r, bullet_shape.y + bullet_shape.r);

		for (let i=max(min_cell.row,0); i<=min(max_cell.row,this.maze.size-1); i++){
			for (let j=max(min_cell.col,0); j<=min(max_cell.col,this.maze.size-1); j++){
				this._cell_bullets_map[i][j].push(bullet_shape);
			}
		}
	}
}

// get all bullets that the player could intersect
// assumes bullets have already been placed into this._cell_bullets_map
Game.prototype._get_possible_bullet_shapes = function (player){

	// create bounding box for player
	const player_points = [
		{x: player.pos.x + cos(player.angle)*player.length/2 - sin(player.angle)*player.width/2, y: player.pos.y + sin(player.angle)*player.length/2 + cos(player.angle)*player.width/2},
		{x: player.pos.x + cos(player.angle)*player.length/2 + sin(player.angle)*player.width/2, y: player.pos.y + sin(player.angle)*player.length/2 - cos(player.angle)*player.width/2},
		{x: player.pos.x - cos(player.angle)*player.length/2 - sin(player.angle)*player.width/2, y: player.pos.y - sin(player.angle)*player.length/2 + cos(player.angle)*player.width/2},
		{x: player.pos.x - cos(player.angle)*player.length/2 + sin(player.angle)*player.width/2, y: player.pos.y - sin(player.angle)*player.length/2 - cos(player.angle)*player.width/2}
	];
	const x_interval = _project_to_interval(player_points, {x:1,y:0});
	const y_interval = _project_to_interval(player_points, {x:0,y:1});
	const bounding_box = {x:x_interval.start, y:y_interval.start, width:x_interval.end-x_interval.start, height:y_interval.end-y_interval.start};

	// find the shapes that need to be checked for collisions
	let shapes_to_check = [];
	let prev_shapes = {};

	const min_cell = this.maze.get_cell(bounding_box.x, bounding_box.y);
	const max_cell = this.maze.get_cell(bounding_box.x + bounding_box.width, bounding_box.y + bounding_box.height);
	for (let i=max(min_cell.row,0); i<=min(max_cell.row,this.maze.size-1); i++){
		for (let j=max(min_cell.col,0); j<=min(max_cell.col,this.maze.size-1); j++){
			for (let shape of this._cell_bullets_map[i][j]){
				if (!prev_shapes.hasOwnProperty(shape.id)){
					prev_shapes[shape.id] = 0;
					shapes_to_check.push(shape);
				}
			}
		}
	}

	return shapes_to_check;
}