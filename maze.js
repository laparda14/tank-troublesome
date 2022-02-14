// information about directions
const PAIRS = {N:"S", S:"N", W:"E", E:"W"};
const DIR_LOOKUP = {N:{dr:-1, dc:0}, S:{dr:1, dc:0}, E:{dr:0, dc:1}, W:{dr:0, dc:-1}};

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
		const dir = Object.keys(DIR_LOOKUP)[floor(random()*4)];
		const d = DIR_LOOKUP[dir];
		this.cells[row][col][dir] = false;
		this.cells[row + d.dr][col + d.dc][PAIRS[dir]] = false;
	}

	
	// create 2d array of empty 1d arrays
	this.shapes = new Array(this.size);
	for (let i=0; i<this.size; i++){
		this.shapes[i] = new Array(this.size);
		for (let j=0; j<this.size; j++){
			this.shapes[i][j] = new Array;
		}
	}

	// populate 2d array with shapes
	let prev_shapes = {};
	for (let i=0; i<this.size; i++){
		for (let j=0; j<this.size; j++){
			for (const dir in DIR_LOOKUP){
				if (!this.cells[i][j][dir]){
					continue;
				}
				let shapes_in_wall = this._get_wall_shapes(i, j, dir);
				for (const shape of shapes_in_wall){
					// if two shapes are the same, use the same one everywhere
					// should allow === checks between shapes
					if (!prev_shapes.hasOwnProperty(shape.id)){
						prev_shapes[shape.id] = shape;
					}
					const current_shape = prev_shapes[shape.id];
					this.shapes[i][j].push(current_shape);
				}
			}
		}
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

	for (const dir in DIR_LOOKUP){
		const d = DIR_LOOKUP[dir];
		if (row+d.dr>=0 && row+d.dr<this.size && col+d.dc>=0 && col+d.dc<this.size){
			if (!this.cells[row+d.dr][col+d.dc].visited){
				neighbors.push({dir:dir, row:row+d.dr, col:col+d.dc});
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


Maze.prototype._get_shapes_in_block = function (min_row, min_col, max_row, max_col){
	let shapes = [];
	let prev_shapes = {};
	for (let i=max(min_row,0); i<=min(max_row,this.size-1); i++){
		for (let j=max(min_col,0); j<=min(max_col,this.size-1); j++){
			for (let shape of this.shapes[i][j]){
				if (!prev_shapes.hasOwnProperty(shape.id)){
					prev_shapes[shape.id] = 0;
					shapes.push(shape);
				}
			}
		}
	}
	return shapes;
};

// get an array of all shapes in the maze a rectangle could possibly be touching
// also works for a circle (using a bounding box)
Maze.prototype.rect_possible_intersect_shapes = function (rectangle){
	const min_cell = this.get_cell(rectangle.x - this.wall_width/2, rectangle.y - this.wall_width/2);
	const max_cell = this.get_cell(rectangle.x + rectangle.width + this.wall_width/2, rectangle.y + rectangle.height + this.wall_width/2);

	return this._get_shapes_in_block(min_cell.row, min_cell.col, max_cell.row, max_cell.col);
};

// a wall is made up of a rectangle with two circles on the ends
Maze.prototype._get_wall_shapes = function (row, col, dir){
	const cell_center = {x: this.section_size*col + this.section_size/2, y: this.section_size*row + this.section_size/2};
	
	const shape_center = {x: cell_center.x + DIR_LOOKUP[dir].dc*this.section_size/2, y: cell_center.y + DIR_LOOKUP[dir].dr*this.section_size/2};

	const orientation = (dir == "N" || dir == "S")?"horizontal":"vertical";
	const is_horizontal = orientation == "horizontal";

	let shapes = [
		{
			type: "rectangle",
			x: shape_center.x - (is_horizontal?this.section_size/2:this.wall_width/2),
			y: shape_center.y - (is_horizontal?this.wall_width/2:this.section_size/2),
			width: (is_horizontal?this.section_size:this.wall_width),
			height: (is_horizontal?this.wall_width:this.section_size),
			orientation: orientation
		},
		{
			type: "circle",
			x: shape_center.x - (is_horizontal?this.section_size/2:0),
			y: shape_center.y - (is_horizontal?0:this.section_size/2),
			r: this.wall_width/2
		},
		{
			type: "circle",
			x: shape_center.x + (is_horizontal?this.section_size/2:0) ,
			y: shape_center.y + (is_horizontal?0:this.section_size/2) ,
			r: this.wall_width/2
		}
	];

	shapes.map(x=>{x.id = this._get_shape_id(x)});

	return shapes;
};

Maze.prototype._get_shape_id = function (shape){
	if (shape.type=="rectangle"){
		return "rectangle " + floor(shape.x) + " " + floor(shape.y) + " " + floor(shape.width) + " " + floor(shape.height);
	} else if (shape.type=="circle"){
		return "circle " + floor(shape.x) + " " + floor(shape.y) + " " + floor(shape.r);
	}
	console.log("Uh Oh");
};

