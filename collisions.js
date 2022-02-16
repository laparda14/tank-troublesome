/*
Generic collision checks
*/

// collision information with moving circle and a circle

// c1 = {x:<center x>, y:<center y>, r:<radius>};
// c2 = {x:<center x>, y:<center y>, r:<radius>};
// dir = {x:<x component>, y:<y component>}; <-- normalized
function circle_circle_collision (c1, c2, dir){
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
}


// x0 = <origin of line x>
// y0 = <origin of line y>
// dir = {x:<x component>, y:<y component>}; <-- direction of line, normalized
// circle = {x:<center x>, y:<center y>, r:<radius>};
function _line_circle_intersect (x0, y0, dir, circle){
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
}



// collision information with a moving circle and (non-rotated) rectangle
// WARNING: only works if rectangle is larger than circle

// c = {x:<center x>, y:<center y>, r:<radius>};
// r = {x:<top-left x>, y:<top-left y>, width:<width>, height:<height>};
// dir = {x:<x component>, y:<y component>}; <-- normalized
function circle_rectangle_collision(c, r, dir){
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
	const corner_shared_intersects = _line_circle_intersect(vertical_x, horizontal_y, dir, c);
	if (corner_shared_intersects[0] >= 0 || corner_shared_intersects[1] >= 0){
    	col.dist = corner_shared_intersects[0]>corner_shared_intersects[1]?-corner_shared_intersects[0]:-corner_shared_intersects[1];

    	col.corner_vertical_side = exit_vertical_side;
    	col.corner_horizontal_side = exit_horizontal_side;

    	return col;
	}
	
	// then (vertical_x, other_y) and (other_x, horizontal_y)
	const corner_vertical_intersects = _line_circle_intersect(vertical_x, other_y, dir, c);
	if (corner_vertical_intersects[0] >= 0 || corner_vertical_intersects[1] >= 0){
    	col.dist = corner_vertical_intersects[0]>corner_vertical_intersects[1]?-corner_vertical_intersects[0]:-corner_vertical_intersects[1];

    	col.corner_vertical_side = exit_vertical_side;
    	col.corner_horizontal_side = exit_horizontal_side=="top" ? "bottom" : "top";

    	return col;
	}
	
	// then (vertical_x, other_y) and (other_x, horizontal_y)
	const corner_horizontal_intersects = _line_circle_intersect(other_x, horizontal_y, dir, c);
	if (corner_horizontal_intersects[0] >= 0 || corner_horizontal_intersects[1] >= 0){
    	col.dist = corner_horizontal_intersects[0]>corner_horizontal_intersects[1]?-corner_horizontal_intersects[0]:-corner_horizontal_intersects[1];
    	
    	col.corner_vertical_side = exit_vertical_side=="left" ? "right" : "left";
    	col.corner_horizontal_side = exit_horizontal_side;

    	return col;
	}
	
	alert("UH OH");

	// the point of intersection is the last point that will be in the rectangle
	// the distance from the corner to that point is the distance

}

// collision information with a moving rotated rectangle and a circle
// transform to a regular rectangle and a moving circle
// WARNING: only works if rectangle is larger than circle

// r = {center_x:<center x>, center_y:<center y>, length:<length>, width:<width>, angle: <angle of rotation>};
// c = {x:<center x>, y:<center y>, r:<radius>};
// dir = {x:<x component>, y:<y component>}; <-- normalized
function rot_rectangle_circle_collision(r, c, dir){
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

	const transformed_col = circle_rectangle_collision(transformed_circle, transformed_rect, transformed_dir);

	const col = {};
	col.type = "moving rotated rectangle - circle";
	col.collision = transformed_col.collision;
	if (col.collision){
		col.dist = transformed_col.dist;
		if (transformed_col.side_orientation == "vertical"){
			col.side = transformed_col.side == "right" ? "front" : "back";
		} else if (transformed_col.side_orientation == "horizontal"){
			col.side = transformed_col.side;
		} else if (transformed_col.side == "corner"){
			col.side = "corner";
			col.corner_front_back = transformed_col.corner_vertical_side == "right" ? "front" : "back";
			col.corner_top_bottom = transformed_col.corner_horizontal_side;
		} else {
			alert("UH OH");
		}
	}

	return col;
}



// collision information with 1d interval and a 1d interval
// for use in SAT

// i1 = {start:<min of interval>, end:<max of interval>}; <-- this will be moved to resolve collision
// i1 = {start:<min of interval>, end:<max of interval>};
function interval_interval_collision(i1, i2){
	const col = {};
	col.type = "moving interval - interval";

	const first = i1.start<i2.start ? i1 : i2;
	const second = first===i1 ? i2 : i1;

	col.collision = first.end > second.start + EPSILON;

	if (col.collision){
		const pos_dist = i2.end - i1.start;
		const neg_dist = i1.end - i2.start;
		if (pos_dist < neg_dist){
			
		}
	}

	return col;
}

// project a set of points to an interval (the points are the vertices of a convex polygon)

// points = [{x:<x pos>, y:<y:pos>}, {x:<x pos>, y:<y:pos>}, ...];
// vector = {x:<x component>, y:<y component>}; <-- normalized
function _project_to_interval(points, vector){
	const interval_pos = points.map(p=>p.x*vector.x + p.y*vector.y);
	return {start:min(interval_pos), end:max(interval_pos)};
}

// collision information with a moving rotated rectangle and a rectangle
// uses SAT

// r1 = {center_x:<center x>, center_y:<center y>, length:<length>, width:<width>, angle:<angle of rotation>};
// r2 = {x:<top-left x>, y:<top-left y>, width:<width>, height:<height>};
// dir = {x:<x component>, y:<y component>}; <-- normalized
function rot_rectangle_rectangle_collision(r1, r2, dir){
	const col = {};
	col.type = "moving rotated rectangle - rectangle";

	const r1_points = [
		{x: r1.center_x + cos(r1.angle)*r1.length/2 - sin(r1.angle)*r1.width/2, y: r1.center_y + sin(r1.angle)*r1.length/2 + cos(r1.angle)*r1.width/2},
		{x: r1.center_x + cos(r1.angle)*r1.length/2 + sin(r1.angle)*r1.width/2, y: r1.center_y + sin(r1.angle)*r1.length/2 - cos(r1.angle)*r1.width/2},
		{x: r1.center_x - cos(r1.angle)*r1.length/2 - sin(r1.angle)*r1.width/2, y: r1.center_y - sin(r1.angle)*r1.length/2 + cos(r1.angle)*r1.width/2},
		{x: r1.center_x - cos(r1.angle)*r1.length/2 + sin(r1.angle)*r1.width/2, y: r1.center_y - sin(r1.angle)*r1.length/2 - cos(r1.angle)*r1.width/2}
	];

	const r2_points = [
		{x: r2.x, y:r2.y},
		{x: r2.x + r2.width, y:r2.y},
		{x: r2.x, y:r2.y + r2.height},
		{x: r2.x + r2.width, y:r2.y + r2.height}
	];

	// each axis the shapes need to be projected onto
	const vectors = [
		{x: 1, y: 0},
		{x: 0, y: 1},
		{x: cos(r1.angle), y: sin(r1.angle)},
		{x: -sin(r1.angle), y: cos(r1.angle)}
	];

	const intervals = vectors.map(v=>({r1_interval:_project_to_interval(r1_points, v), r2_interval:_project_to_interval(r2_points, v), interval1_dir:dir.x*v.x + dir.y*v.y}));
	const collisions = intervals.map(ivs=>interval_interval_collision(ivs.r1_interval, ivs.r2_interval, ivs.interval1_dir));

	let best_dist = -Infinity;
	for (const c of collisions){
		if (c.collision){
			if (c.dist > best_dist){
				best_dist = c.dist;
			}
		} else {
			col.collision = false;
			return col;
		}
	}
	col.collision = true;
	col.dist = best_dist;

	return col;
}