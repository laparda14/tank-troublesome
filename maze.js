// information about directions
const PAIRS = {N:"S", S:"N", W:"E", E:"W"};
const DIRS = [{dr:-1, dc:0, dir:"N"}, {dr:1, dc:0, dir:"S"}, {dr:0, dc:1, dir:"E"}, {dr:0, dc:-1, dir:"W"}]
const DIR_LOOKUP = {};
for (let i=0; i<4; i++){
	DIR_LOOKUP[DIRS[i].dir] = {dr:DIRS[i].dr, dc:DIRS[i].dc};
}

function Maze(){
	// number of subsections of the maze
	this.size = 9;

	// size (in pixels) of each section
	// the game is a square of size width x width
	this.section_size = WIDTH/this.size;

	this.wall_width = 6;

	// set up cells
	this.cells = [];
	for (let i=0; i<this.size; i++){
		let row = [];
		for (let j=0; j<this.size; j++){
			row.push({N:true, E:true, S:true, W:true, visited:false});
		}
		this.cells.push(row);
	}

	// create the maze
	this._traverse(0,0);

	// remove random walls to create possible loops
	for (let i=0; i<10; i++){
		const row = floor(random()*(this.size-2)) + 1;
		const col = floor(random()*(this.size-2)) + 1;
		const dir = DIRS[floor(random()*4)];
		this.cells[row][col][dir.dir] = false;
		this.cells[row + dir.dr][col + dir.dc][PAIRS[dir.dir]] = false;
	}
}

// traverse the cells and knock down walls to create the maze
Maze.prototype._traverse = function (start_row, start_col){
	this.cells[start_row][start_col].visited = true;

	let stack = [{row:start_row, col:start_col}];

	while (stack.length > 0){
		const pos = stack[stack.length - 1];

		const neighbor = this._random_neighbor(pos.row, pos.col);

		if (neighbor===null){
			stack.pop();
		} else {

			this.cells[neighbor.row][neighbor.col].visited = true;

			this.cells[pos.row][pos.col][neighbor.dir] = false;
			this.cells[neighbor.row][neighbor.col][PAIRS[neighbor.dir]] = false;

			stack.push(neighbor);

		}
	}
};

// return a random neighbor that hasn't been visited yet or null if there are none
Maze.prototype._random_neighbor = function (row, col){
	let neighbors = [];

	for (var i=0; i<4; i++){
		d = DIRS[i];
		if (row+d.dr>=0 && row+d.dr<this.size && col+d.dc>=0 && col+d.dc<this.size){
			if (!this.cells[row+d.dr][col+d.dc].visited){
				neighbors.push({dir:d.dir, row:row+d.dr, col:col+d.dc});
			}
		}
	}

	if (neighbors.length == 0){
		return null;
	}

	return neighbors[floor(random()*neighbors.length)];

};

// returns the wall that is the same on the other side
Maze.prototype.get_same_wall = function (row, col, dir){
	const d = DIR_LOOKUP[dir];
	if (row+d.dr>=0 && row+d.dr<this.size && col+d.dc>=0 && col+d.dc<this.size){
		return {row:row+d.dr, col:col+d.dc, dir:PAIRS[dir]};
	} else {
		return null;
	}
}

// draw the maze
Maze.prototype.draw = function (){
	strokeWeight(this.wall_width);
	stroke(80,80,80);

	for (let row=0; row<this.size; row++){
		for (let col=0; col<this.size; col++){

			const cell = this.cells[row][col];
			
			// we only need to draw north and west to avoid repeats
			if (cell.N){
				line(this.section_size*col, this.section_size*row, this.section_size*col + this.section_size, this.section_size*row);
			}
			if (cell.W){
				line(this.section_size*col, this.section_size*row, this.section_size*col, this.section_size*row + this.section_size);
			}
		}
	}

	// draw the outside border
	stroke(0);
	line(0,0,WIDTH,0);
	line(0,0,0,HEIGHT);
	line(WIDTH,0,WIDTH,HEIGHT);
	line(0,HEIGHT,WIDTH,HEIGHT);
};

Maze.prototype.get_cell = function (x, y){
	return {row:floor(y/this.section_size), col:floor(x/this.section_size)};
}


// a wall is made up of a rectangle with two circles on the ends
Maze.prototype.get_wall_shapes = function (row, col, dir){
	let shapes;
	const cell_center = {x: this.section_size*col + this.section_size/2, y: this.section_size*row + this.section_size/2};
	
	const shape_center = {x: cell_center.x + DIR_LOOKUP[dir].dc*this.section_size/2, y: cell_center.y + DIR_LOOKUP[dir].dr*this.section_size/2};

	if (dir == "N" || dir == "S"){
		// horizontal wall

		shapes = {
			rectangle: {
				x: shape_center.x - this.section_size/2,
				y: shape_center.y - this.wall_width/2,
				width: this.section_size,
				height: this.wall_width,
				orientation: "horizontal"
			},
			circle1: {
				x: shape_center.x - this.section_size/2,
				y: shape_center.y,
				r: this.wall_width/2
			},
			circle2: {
				x: shape_center.x + this.section_size/2,
				y: shape_center.y,
				r: this.wall_width/2
			}
		};

	} else if (dir == "E" || dir == "W"){
		// vertical wall

		shapes = {
			rectangle: {
				x: shape_center.x - this.wall_width/2,
				y: shape_center.y - this.section_size/2,
				width: this.wall_width,
				height: this.section_size,
				orientation: "vertical"
			},
			circle1: {
				x: shape_center.x,
				y: shape_center.y - this.section_size/2,
				r: this.wall_width/2
			},
			circle2: {
				x: shape_center.x,
				y: shape_center.y + this.section_size/2,
				r: this.wall_width/2
			}
		};

	}

	/*fill(255,0,0,80);
	noStroke();
	rect(shapes.rectangle.x, shapes.rectangle.y, shapes.rectangle.width, shapes.rectangle.height);

	fill(0,255,0,80);
	ellipse(shapes.circle1.x, shapes.circle1.y, 2*shapes.circle1.r);
	ellipse(shapes.circle2.x, shapes.circle2.y, 2*shapes.circle1.r);*/

	return shapes;
};

