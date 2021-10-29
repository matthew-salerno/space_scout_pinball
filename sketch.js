/*
Matthew Salerno
ECE 4525
Project 6
Untitled Fish Game

This is the first game where I've finally split off my engine into seperate files.
I spent too much time working on the engine and now this is super late D:
The subdivision happens in shapes.js.

As a Hokie, I will conduct myself with honor and integrity at all times.
I will not lie, cheat, or steal, nor will I accept the actions of those who do.
- Matthew Salerno
*/



// a reference to the currently running world
var WORLD;
var LOGO;
// worlds that we want to keep as globals for switching
var W_LOGO;
var W_MENU;
var W_SETTINGS;
var W_INSTRUCTIONS;

// movement constants
const LEFT_RIGHT = 0;
const UP_DOWN    = 1;
const KEY_W      = 87;
const KEY_A      = 65;
const KEY_S      = 83;
const KEY_D      = 68;
const KEY_H      = 72;
const KEY_M      = 77;
const KEY_SPACE  = 32;

// collision constants
const MAX_COLLISION_LOOPS = 16;

// game state
const SPRITES = 0;
const MENU    = 1;
const RUNNING = 2;
const LOST    = 3;
const WON     = 4;

const IN_AIR    = 0;
const ON_GROUND = 1;

// debug
var VISUALIZE_COLLISIONS  = false;
const PAUSE_FOR_SPRITESHEET = false;
var DRAW_HITBOX           = false;

// globals to handle input and macro-game-state
// outside of game world because keyPresses are
// global and may happen when game world doesn't exist
var DIR_INPUT = [0,0]; // Directional keys being pressed. Opposite keys add to zero
var PREFERRED_AXIS = 0 // In case of no diagonal movement in game, we favor the most recent key press
var MOUSE_WAS_PRESSED = false; // we don't want if the mouse is pressed, just if it was since the last time this var was cleared.
var SPACE_WAS_PRESSED = false; // same as above
function mousePressed() {
	MOUSE_WAS_PRESSED = true;
}



function keyPressed() {
	switch(keyCode) {
		case UP_ARROW:
		case KEY_W:
		PREFERRED_AXIS = UP_DOWN;
		DIR_INPUT[1] += 1;
		break;
		case DOWN_ARROW:
		case KEY_S:
		PREFERRED_AXIS = UP_DOWN;
		DIR_INPUT[1] -= 1;
		break;
		case LEFT_ARROW:
		case KEY_A:
		PREFERRED_AXIS = LEFT_RIGHT;
		DIR_INPUT[0] -= 1;
		break;
		case RIGHT_ARROW:
		case KEY_D:
		PREFERRED_AXIS = LEFT_RIGHT;
		DIR_INPUT[0] += 1;
		break;
		case KEY_SPACE:
		SPACE_WAS_PRESSED = true;
		break;
		case KEY_H:
		DRAW_HITBOX = !DRAW_HITBOX;
		break;
		case KEY_M:
		VISUALIZE_COLLISIONS = !VISUALIZE_COLLISIONS;
		break;
	}
}
function keyReleased() {
	switch(keyCode) {
		case UP_ARROW:
		case KEY_W:
		DIR_INPUT[1] -= 1;
		break;
		case DOWN_ARROW:
		case KEY_S:
		DIR_INPUT[1] += 1;
		break;
		case LEFT_ARROW:
		case KEY_A:
		DIR_INPUT[0] += 1;
		break;
		case RIGHT_ARROW:
		case KEY_D:
		DIR_INPUT[0] -= 1;
		break;
	}
}

class fish_physics extends node {
	constructor(parent) {
		super(parent);
		this.pos_hash = this.parent.hasInstance(pos_hash_2d);
		this.collision = this.parent.hasInstance(collision_2d);
		//print(this.pos_hash);
		console.assert(parent instanceof entity_2d, "Parent of fish_physics must be entity_2d");
		console.assert(this.pos_hash, "Parent of fish_physics needs a pos_hash_2d!");
		console.assert(this.collision, "Parent of fish_physics needs a collision_2d!");
		this.accel = createVector(0,0);
		this.velocity = createVector(0,0);
		this.friction = 0.9;
	}
	__process() {
		// Process movement
		this.velocity.add(this.accel);
		this.accel.mult(0);
		this.velocity.mult(this.friction);
		this.parent.position.add(this.velocity);
	
		
		/*
		Loops is to ensure processing stops when no collisions exist. The issue without the loop is that
		some collision corrections could push you into other collisions. The 1.1 multipliers are too
		give a little bit of overshoot to ensure that a collision correction isn't actually enough to
		correct the collision. MAX_COLLISION_LOOPS is an extra safety measure for a rare case where
		we get stuck regardless.
		*/
		let collided = true;
		for (let count = 0; collided && count < MAX_COLLISION_LOOPS; count++)
		{
			collided = false;
			
			// do collisions
			this.collision.for_collisions(function(_, coll){
				if (coll.shape==this.collision.shape) {
					collided = true;
					this.parent.position.add(coll.plane.normal.copy().mult(1.1).mult(coll.plane.dist(coll.point)));
				}
				else {
					collided = true;
					this.parent.position.sub(coll.plane.normal.copy().mult(1.1).mult(coll.plane.dist(coll.point)));
				}
				this.velocity.mult(-this.friction);
			},15,[fish], this);
			
			// Force within bounds of level
			if (this.collision.keep_within_level()) {
				this.velocity.mult(-this.friction);
				this.collided = true;
			}
			this.collision.__process();
		}
	}
}

class fish_controller extends node {
	constructor(parent) {
		super(parent);
		console.assert(this.parent instanceof fish, "Attached physics controller wrong node");
		this.physics = this.parent.hasInstance(fish_physics);
		console.assert(this.physics, "Attached physics controller to non-physics node");
		this.destination = this.parent.position.copy();
		this.cooldown = 0;
		this.jitter = {direction: random(-PI, PI), radius: 0};
	}
	__process() {
		// Avoid nearby fish
		this.world.for_radius(this.parent.position, function(ent) {
			if (ent !== this.parent) {
				let ent_pos = ent.position.copy();
				let this_pos = this.parent.position.copy();
				this.physics.accel.add(p5.Vector.lerp(p5.Vector.sub(this_pos, ent_pos).normalize().mult(0.1),
					createVector(0,0),
					p5.Vector.sub(ent_pos, this_pos).magSq()/sq(100)))
			}
		}, 100, [fish], this);

		// Move towards destination
		if (this.cooldown <= 0) {
			let vecToDest = this.destination.copy().sub(this.parent.position);
			if (vecToDest.magSq() < sq(50)) {
				this.cooldown = random(30, 600);
				this.destination = createVector(random(50, this.world.level_width - 50), random(50, this.world.level_height - 50));
			}
			else {
				this.physics.accel.add(vecToDest.normalize().mult(0.2));
			}
		}
		else {
			this.cooldown--;
		}

		// add jitter (to make look natural)
		this.jitter.direction  = (this.jitter.direction+(random(-PI, PI)/20))%TWO_PI;
		this.jitter.radius     = clamp(0, this.jitter.radius+random(-0.1,0.1),0.1);
		this.physics.accel.add(p5.Vector.fromAngle(this.jitter.direction, this.jitter.radius));
	}
		
}

class wall extends entity_2d { 
	constructor(parent, posistion, direction, neighbors) {
		super(parent, posistion, direction, neighbors);
		let points =  []
		this.pos_hash = new static_pos_hash_2d(this, this.position);
		this.sprite = [];
		let masks = [
			(1<<2)*!!(neighbors & 0b0000000010)+(1<<1)*!!(neighbors & 0b0000000001)+!!(neighbors & 0b0000001000),
			(1<<2)*!!(neighbors & 0b0000000010)+(1<<1)*!!(neighbors & 0b0000000100)+!!(neighbors & 0b0000100000), 
			(1<<2)*!!(neighbors & 0b0010000000)+(1<<1)*!!(neighbors & 0b0001000000)+!!(neighbors & 0b0000001000), 
			(1<<2)*!!(neighbors & 0b0010000000)+(1<<1)*!!(neighbors & 0b0100000000)+!!(neighbors & 0b0000100000), 
		];
		for (let i = 0; i < 4; i++) {
			switch(masks[i]) {
				case 0b0111:
				this.sprite.push(EMPTY);
				break;
				case 0b0110:
				this.sprite.push(WALL_SIDE_VERTICAL);
				break;
				case 0b0101:
				this.sprite.push(WALL_CORNER_CONCAVE);
				break;
				case 0b0100:
				this.sprite.push(WALL_SIDE_VERTICAL);
				break;
				case 0b0011:
				this.sprite.push(WALL_SIDE_HORIZONTAL);
				break;
				case 0b0010:
				this.sprite.push(WALL_CORNER_CONVEX);
				break;
				case 0b0001:
				this.sprite.push(WALL_SIDE_HORIZONTAL);
				break;
				case 0b0000:
				this.sprite.push(WALL_CORNER_CONVEX);
				break; 
			}
		}
		// same as above but the order needs to change to construct the hitbox properly (z-order to clockwise)
		for (let i of [0,1,3,2]) {
			let offsetx = !!(i&0b01)*2 - 1;
			let offsety = !!(i&0b10)*2 - 1;
			switch(masks[i]) {
				case 0b0111:
				points.push(offsetx*10);
				points.push(offsety*10);
				break;
				case 0b0110:
				points.push(offsetx*8);
				points.push(offsety*10);
				break;
				case 0b0101:
				points.push(offsetx*10);
				points.push(offsety*10);
				break;
				case 0b0100:
				points.push(offsetx*8);
				points.push(offsety*10);
				break;
				case 0b0011:
				points.push(offsetx*10);
				points.push(offsety*8);
				break;
				case 0b0010:
				points.push(offsetx*10);
				points.push(offsety*10);
				break;
				case 0b0001:
				points.push(offsetx*10);
				points.push(offsety*8);
				break;
				case 0b0000:
				switch(i){
					case 0:
					points.push(-8);
					points.push(-7);
					points.push(-7);
					points.push(-8);
					break;
					case 1:
					points.push( 7);
					points.push(-8);
					points.push( 8);
					points.push(-7);
					break;
					case 3:
					points.push(8);
					points.push(7);
					points.push(7);
					points.push(8);
					break;
					case 2:
					points.push(-7);
					points.push( 8);
					points.push(-8);
					points.push( 7);
					break;
				}
				break; 
			}
		}
		this.collision = new collision_2d(this, zip_array_to_vecs(points));
		
		
	}
	__draw() {
		for (let i = 0; i < 4; i++) {
			this.world.sprites.draw_tile_quad(this.sprite[i], i, this.position, 0);
			//this.world.sprites.draw_tile_quad([2,1], i, this.position, 0);
		}
		
	}
}

class fish extends entity_2d {

}

class normal_fish extends fish {
	constructor(parent, posistion, direction) {
		super(parent, posistion, direction);
		this.collision = new collision_2d(this, zip_array_to_vecs([-10,-10, 10,-10, 10,10, -10,10]));
		this.pos_hash = new pos_hash_2d(this);
		this.physics = new fish_physics(this);
		this.controller = new fish_controller(this);
		colorMode(HSB);
		this.color = color(random(0, 255), random(0, 255),255);
		colorMode(RGB);
		this.body = new convex_shape(zip_array_to_vecs([-10,-5, 10, -5, 10, 5, -10, 5]), this.position, this.direction, 2)
		this.tail = new convex_shape(zip_array_to_vecs([-10,-10, -9,-9, 0, 0, -9,9, -10, 10, -10,9, -10,-9]), this.position, this.direction, 2)
	}
	__draw() {
		let flip = abs(this.physics.velocity.heading()) > HALF_PI;
		let rot = 0;
		if (flip) {
			rot = clamp(-QUARTER_PI/2, this.physics.velocity.copy().mult(-1).heading(), QUARTER_PI/2);
		}
		else {
			rot = clamp(-QUARTER_PI/2, this.physics.velocity.heading(), QUARTER_PI/2);
		}
		this.body.position = this.position.copy();
		this.tail.position = this.position.copy();
		rot+= PI*flip;
		this.body.rotation = rot;
		this.tail.rotation = rot;
		strokeWeight(1);
		stroke('black');
		fill(this.color);
		this.body.draw();
		this.tail.draw();
		let eye = p5.Vector.fromAngle(rot, this.collision.shape._points[2].x/2);
		fill('black')
		circle(this.position.x+eye.x, this.position.y+eye.y, 3);
	}
}

class big_fish extends normal_fish {
	constructor(parent, posistion, direction) {
		super(parent, posistion, direction);
		this.collision = new collision_2d(this, zip_array_to_vecs([-20,-20, 20,-20, 20,20, -20,20]));
		this.body = new convex_shape(zip_array_to_vecs([-20,-10, 20, -10, 20, 10, -20, 10]), this.position, this.direction, 2)
		this.tail = new convex_shape(zip_array_to_vecs([-20,-20, -18,-18, 0, 0, -18,18, -20, 20, -20,18, -20,-18]), this.position, this.direction, 2)
	}
}

class jelly_fish extends fish {
	constructor(parent, posistion, direction) {
		super(parent, posistion, direction);
		this.collision = new collision_2d(this, zip_array_to_vecs([-10,-10, -9,-10 , 5,-10, 10,0, 5,10, -9,10, -10,10, -10,9, -10,-9]), 1);
		this.pos_hash = new pos_hash_2d(this);
		this.physics = new fish_physics(this);
		this.controller = new fish_controller(this);
	}
	__draw() {
		strokeWeight(2);
		stroke('pink');
		fill(255,196,196,196);
		this.collision.shape.draw();
		circle(this.position.x, this.position.y, 5);
		let anchors = [];
		strokeWeight(2);
		stroke(255, 128, 192, 192);
		noFill();
		translate(this.position.x,this.position.y);
		rotate(HALF_PI+this.direction);
		bezier(4,    20,  4+5*sin(frameCount/45),  25,   4-5*sin(frameCount/45), 25,   4, 30);
		bezier(4,    10,  4+5*sin(frameCount/45),  15,   4-5*sin(frameCount/45), 15,   4, 20);
		bezier(-4,   20, -4+5*sin(frameCount/45),  25,  -4-5*sin(frameCount/45), 25,  -4, 30);
		bezier(-4,   10, -4+5*sin(frameCount/45),  15,  -4-5*sin(frameCount/45), 15,  -4, 20);
		//bezier(4, 10, 10*sin(frameCount/120), 0,  10*sin(frameCount/120), 0, -4, 10);
		rotate(-HALF_PI-this.direction);
		translate(-this.position.x,-this.position.y);
	}
}

class shrimp extends fish {
	constructor(parent, posistion, direction) {
		super(parent, posistion, direction);
		this.collision = new collision_2d(this, zip_array_to_vecs([-10,-5, 10, -5, 10, 5, -10, 5]));
		this.pos_hash = new pos_hash_2d(this);
		this.physics = new fish_physics(this);
		this.controller = new fish_controller(this);
		this.body = new convex_shape(zip_array_to_vecs([-10,-5, 10, -5, 10, 5, -10, 5]), this.position, this.direction, 2);
	}
	__draw() {
		this.direction = this.physics.velocity.heading();
		this.body.position = this.position.copy();
		this.body.rotation = this.direction;
		
		strokeWeight(1);
		stroke('black');
		fill(224, 128, 192, 224);
		for (let i of this.body.points) {
			let endpoint = p5.Vector.sub(i, this.position);
			if (i.copy().sub(this.position).magSq() > 50) {
				continue;
			}
			endpoint.div(1.5)
			endpoint.rotate(-frameCount/5*(2*(endpoint.dot(p5.Vector.fromAngle(this.direction+HALF_PI)) < 0)-1)+endpoint.dot(p5.Vector.fromAngle(this.direction)))
			let opp_point = endpoint.copy().rotate(PI);
			endpoint.add(i);
			opp_point.add(i);
			line(i.x, i.y, endpoint.x, endpoint.y);
			line(i.x, i.y, opp_point.x, opp_point.y);
		}
		this.body.draw();
		let eye = p5.Vector.fromAngle(this.direction, this.collision.shape._points[2].x/2);
		fill('black')
		circle(this.position.x+eye.x, this.position.y+eye.y, 3);
	}
}

class seaweed extends entity_2d {
	__draw() {
		let anchors = [];
		strokeWeight(3);
		stroke('green');
		noFill();
		bezier(this.position.x, this.position.y-10, this.position.x+10*sin(frameCount/120), this.position.y, this.position.x-10*sin(frameCount/120), this.position.y, this.position.x, this.position.y+10);
	}
}

class rock extends entity_2d {
	constructor(parent, posistion, direction) {
		super(parent, posistion, direction);
		this.collision = new collision_2d(this, zip_array_to_vecs([-10,-10, -9,-10 , 5,-10, 10,0, 5,5, -9,10, -10,5, -10,4, -10,-9]), 1);
		this.cooldown = 0;
		this.emmiter = new emitter(this, bubble, createVector(0,0), 2, 210, 60, 2, 1, 10);
		this.emmiter.enabled = false;
	}
	__process() {
		this.collision.for_collisions(function(ent) {
			if (this.cooldown == 0) {
				this.emmiter.enabled = true;
				this.cooldown = -60;
			}
		},20,[fish], this);
		if (this.cooldown < 0) {
			this.cooldown++;
			if (this.cooldown == 0) {
				this.emmiter.enabled=false;
				this.cooldown = 60;
			}
		}
		else if (this.cooldown > 0) {
			this.cooldown--;
		}
	}
	__draw() {
		let anchors = [];
		strokeWeight(2);
		stroke('black');
		fill('grey');
		this.collision.shape.draw();
	}
}

class bubble extends particle_2d {
	__process() {
		this.velocity.mult(0.8);
		this.velocity.y = -this.position.y/200-random(0,2);
		super.__process();
	}
	__draw() {
		fill(255,255,255,64);
		stroke(128,192,255,192);
		circle(this.position.x, this.position.y, 6);
	}
}

/*
Parts for drawing game screens
*/

class logoPart extends particle_2d {
	__draw() {
		translate(this.position);
		ellipse(0,0,6,3);
		ellipse(0,0,3,6);
		translate(p5.Vector.mult(this.position, -1));
	}
}

class logo extends entity_2d {
	constructor(parent, posistion, direction, animate = false) {
		super(parent, posistion, direction);
		this.size = 500;
		this.anitime = 360;
		this.emitter = new emitter(this, logoPart, createVector(0), 5, 15, 5, 2,1,1, false);
		if (animate) {
			this.startFrame=frameCount;
		}
		else {
			this.startFrame = frameCount-this.anitime;
			this.emitter.disable();
		}
	}
	__draw() {
		translate(this.position);
		rotate(this.direction);
		//fill('red');
		strokeWeight(5)
		colorMode(HSB, this.anitime);
		for (let i = 0; i < frameCount - this.startFrame && i < this.anitime; i++){
			stroke(i, this.anitime, this.anitime);
			let dpos   = this.draw_pos_from_time(i);
			let dpos_n = this.draw_pos_from_time(i);
			this.emitter.offset=dpos;
			line(dpos.x, dpos.y, dpos_n.x, dpos_n.y);
			noStroke();
			if (i == frameCount - this.startFrame - 1) {
				fill("white");
				circle(dpos_n.x, dpos_n.y, 10);
			}
			fill(i, this.anitime, this.anitime)
		}
		if (frameCount > this.startFrame+this.anitime)
		{
			this.emitter.disable();
		}
		//let dpos = this.draw_pos_from_time(frameCount-this.startFrame);
		//circle(dpos.x, dpos.y, 5);
		rotate(-this.direction);
		translate(p5.Vector.mult(this.position, -1));
	}
	draw_pos_from_time(frames) {
		let f2r = PI/(this.anitime>>2);
		if (frames < this.anitime/4){
			return (createVector(-3*(this.size>>3)-(this.size>>3)*cos(frames*f2r), -(this.size>>3)*sin(frames*f2r)));
		}
		else if (frames < this.anitime/2){
			return (createVector(-1*(this.size>>3)+(this.size>>3)*cos(frames*f2r), +(this.size>>3)*sin(frames*f2r)));
		}
		else if (frames < 3*this.anitime/4){
			return (createVector( 1*(this.size>>3)-(this.size>>3)*cos(frames*f2r), +(this.size>>3)*sin(frames*f2r)));
		}
		else if (frames < this.anitime) {
			return (createVector( 3*(this.size>>3)+(this.size>>3)*cos(frames*f2r), +(this.size>>3)*sin(frames*f2r)));
		}
		else {
			return (createVector( 3*(this.size>>3)+(this.size>>3)*cos(this.anitime*f2r), (this.size>>3)*sin(this.anitime*f2r)));
		}
	}
}

class logo_world extends world {
	constructor() {
		super();
		this.logo_pos = createVector(0,0);
		this.canvas = createCanvas(1000, 1000);
	}
	setup() {
		this.logo = new logo(this, createVector(500,500), 0, true);
		translate((this.logo.size>>1)+40, (this.logo.size>>3)+5)
		strokeWeight(10)
		colorMode(HSB, this.logo.anitime);
		for (let i = 0; i < this.logo.anitime; i++){
			stroke(i, this.logo.anitime, this.logo.anitime);
			let dpos   = this.logo.draw_pos_from_time(i);
			let dpos_n = this.logo.draw_pos_from_time(i);
			line(dpos.x, dpos.y, dpos_n.x, dpos_n.y);
		}
		translate(-this.logo.size>>1, -this.logo.size>>3)
		let subpixel_scale = pixelDensity();
		LOGO = createImage((this.logo.size)*subpixel_scale+80,((this.logo.size>>2)+10)*subpixel_scale);
		LOGO.copy(this.canvas,
			 	0,
				0,
				(this.logo.size)+80,
				(this.logo.size>>1)+10,
				0,
				0,
				((this.logo.size)+80)*subpixel_scale,
				((this.logo.size>>1)+10)*subpixel_scale);
	}
	process() {
		if (MOUSE_WAS_PRESSED) {
			MOUSE_WAS_PRESSED=false;
			WORLD=W_MENU
		}
		if (frameCount > 520) {
			this.logo.remove();
		}
		super.process();
	}
	draw() {
		let subpixel_scale = pixelDensity();
		background(0);
		super.draw();
		if (frameCount > 520 && frameCount < 580) {
			image(LOGO, lerp(210, 800, (frameCount-520)/60),
			lerp(430, 940, (frameCount-520)/60),
			lerp(580, 200,(frameCount-520)/60),
			lerp(120, 50, (frameCount-520)/60));
		}
		else if (frameCount > 580 && frameCount < 600)
		{
			image(LOGO, 800, 940, 200,50);
		}
		else if (frameCount > 600) {
			WORLD=W_MENU;
		}
	}
}


class starfield_part extends particle_2d {
	constructor(parent, position, velocity, life){
		super(parent, position, velocity, life);
		this.position.add(p5.Vector.fromAngle(random(0,TWO_PI), 30));
	}
	__process() {
		super.__process();
		this.velocity=(this.position.copy().sub(createVector(500,500)).mult(0.02));
	}
	__draw() {
		noStroke();
		fill('white');
		circle(this.position.x, this.position.y, 5);
	}
}

class menu_item extends entity_2d {
	constructor(parent, posistion, direction, width, height, msg, pressedAction) {
		super(parent, posistion, direction);
		this.width = width;
		this.height = height;
		this.func=pressedAction;
		this.shape = new convex_shape(zip_array_to_vecs([-this.width/2, -this.height/2, this.width/2, -this.height/2,  this.width/2,  this.height/2, -this.width/2,  this.height/2]));
		this.shape.position=this.position;
		colorMode(HSB, 100);
		this.highlight = color(random(0,100),100,100);
		colorMode(RGB);
		this.text = msg;
	}
	__process() {
		if (MOUSE_WAS_PRESSED) {
			if (this.shape.intersect_vector(createVector(mouseX,mouseY))) {
				colorMode(HSB, 100);
				this.highlight = color(random(0,100),100,100);
				colorMode(RGB);
				MOUSE_WAS_PRESSED = false;
				this.func.call();
			}
		} 
	}
	__draw() {
		strokeWeight(5);
		stroke('white');
		if (this.shape.intersect_vector(createVector(mouseX,mouseY))) {
			stroke(this.highlight);
		}
		fill('grey');
		textSize(24);
		textAlign(CENTER);
		textStyle(BOLD);
		this.shape.draw();
		fill('white');
		stroke('black');
		text(this.text, this.position.x, this.position.y);
	}
}

class menu_world extends world {
	constructor() {
		super();
		this.drawAbove = new Set();
	}
	draw() {
		let subpixel_scale = pixelDensity();
		background(0);
		super.draw();
		image(LOGO, 800, 940, 200,50)
		for (let i of this.drawAbove) {
			i.__draw();
		}
		textAlign(CENTER);
		textSize(50);
		textStyle(BOLD);
		stroke('white');
		fill('purple');
		text("SPACE SCOUT PINBALL", 500, 100);
		noStroke();
		translate(550,-225);
		rotate(QUARTER_PI);
		textSize(70);
		text("2D", 500, 100)
		rotate(-QUARTER_PI);
		translate(-550,225);
		textSize(20);
		textStyle(NORMAL);
		textAlign(LEFT);
		noStroke();
		fill('white');
		text("A game by Matthew Salerno", 20, 980);
	}
	setup() {
		new emitter(this, starfield_part, createVector(0), 0, 300, 300, 2,1,10, false, createVector(500,500));
		let men1 = new menu_item(this, createVector(500,300), 0, 300, 100, "PLAY", function() {});
		let men2 = new menu_item(this, createVector(500,500), 0, 300, 100, "INSTRUCTIONS", function() {WORLD=W_INSTRUCTIONS});
		let men3 = new menu_item(this, createVector(500,700), 0, 300, 100, "SETTINGS", function() {WORLD=W_SETTINGS;});
		this.drawAbove.add(men1);
		this.drawAbove.add(men2);
		this.drawAbove.add(men3);
		this.drawCalls.delete(men1);
		this.drawCalls.delete(men2);
		this.drawCalls.delete(men3);
	}
	process(){
		super.process();
		MOUSE_WAS_PRESSED = false;
	}
}

class instructions_world extends world {
	constructor() {
		super();
		this.drawAbove = new Set();
	}
	draw() {
		let subpixel_scale = pixelDensity();
		background(96,96,96);
		super.draw();
		image(LOGO, 800, 940, 200,50)
		for (let i of this.drawAbove) {
			i.__draw();
		}
		textAlign(CENTER);
		textSize(50);
		textStyle(BOLD);
		stroke('white');
		fill('purple');
		text("SPACE SCOUT PINBALL", 500, 100);
		noStroke();
		translate(550,-225);
		rotate(QUARTER_PI);
		textSize(50);
		text("INSTRUCTIONS", 540, 210);
		rotate(-QUARTER_PI);
		translate(-550,225);
		textStyle(NORMAL);
		textAlign(LEFT);
		textSize(20);
		noStroke();
		fill('black');
		text("\
		Welcome Space Scout Pinball, now in 2D!!\n\
		Use the <NA> and <NA> keys to flip the paddles.\n\
		You will have three balls for each game. \n\
		Use the <NA> key to send them into the machine.\n\
		Hit as many targets as possible to increase your score.\n\
		If the a ball falls off the screen, or into a black hole, it's game over!\n\
		Watch out for some strange physics you'll only see in space.\
		\n\n\
		NOTE:\n\
		Sprites are a work in progress\n\
		More and better characters will be added in with levels\n\
		which will be drawn with backgrounds\
		\n\n\
		DEBUG:\n\
		Press H to view hitboxes\n\
		Press M to view the position hash array\
		\n\n\
		Have fun,\n\
		-Matthew J. Salerno\
		", 20,200);	
		text("A game by Matthew Salerno", 20, 980);
		fill('darkGrey');

		// draw ball
		translate(800, 500);
		stroke('black');
		strokeWeight(2);
		circle(0,0, 30);
		fill('white');
		noStroke();
		circle(-3,-3, 5);
		// draw paddle
		translate(-50, 350);
		rotate(-QUARTER_PI/2);
		stroke('purple');
		fill('darkBlue');
		strokeWeight(5);
		circle(-75, 0, 30);
		circle(75,0, 50);
		noStroke();
		quad(-75, 15, -75, -15, 75,-25, 75,25);
		stroke('purple');
		line(-75,  15, 75, 25);
		line(-75, -15, 75,-25);
		rotate(QUARTER_PI/2);
		translate(-500, 0);
		rotate(QUARTER_PI/2-PI);
		circle(-75, 0, 30);
		circle(75,0, 50);
		noStroke();
		quad(-75, 15, -75, -15, 75,-25, 75,25);
		stroke('purple');
		line(-75,  15, 75, 25);
		line(-75, -15, 75,-25);
		resetMatrix();
		
	}
	setup() {
		let men = new menu_item(this, createVector(500,800), 0, 300, 100, "BACK", function() {WORLD=W_MENU;});
		this.drawAbove.add(men);
		this.drawCalls.delete(men);
	}
	process(){
		super.process();
		MOUSE_WAS_PRESSED = false;
	}
}

class settings_world extends world {
	constructor() {
		super();
		this.drawAbove = new Set();
	}
	draw() {
		let subpixel_scale = pixelDensity();
		background(96,96,96);
		super.draw();
		image(LOGO, 800, 940, 200,50)
		for (let i of this.drawAbove) {
			i.__draw();
		}
		textAlign(CENTER);
		textSize(50);
		textStyle(BOLD);
		stroke('white');
		fill('purple');
		text("SPACE SCOUT PINBALL", 500, 100);
		noStroke();
		translate(550,-225);
		rotate(QUARTER_PI);
		textSize(70);
		text("SETTINGS", 550, 200)
		rotate(-QUARTER_PI);
		translate(-550,225);
	}
	setup() {
		let men1 = new menu_item(this, createVector(400,300), 0, 300, 100, "VOLUME", function() {});
		let men2 = new menu_item(this, createVector(620,300), 0, 100, 100, "+", function() {});
		let men3 = new menu_item(this, createVector(180,300), 0, 100, 100, "-", function() {});
		let men4 = new menu_item(this, createVector(340,450), 0, 420, 100, "LEFT PADDLE", function() {});
		let men5 = new menu_item(this, createVector(620,450), 0, 100, 100, "NA", function() {});
		let men6 = new menu_item(this, createVector(340,600), 0, 420, 100, "RIGHT PADDLE", function() {});
		let men7 = new menu_item(this, createVector(620,600), 0, 100, 100, "NA", function() {});
		let men8 = new menu_item(this, createVector(400,750), 0, 540, 100, "BACK", function() {WORLD=W_MENU;});
		this.drawAbove.add(men1);
		this.drawAbove.add(men2);
		this.drawAbove.add(men3);
		this.drawAbove.add(men4);
		this.drawAbove.add(men5);
		this.drawAbove.add(men6);
		this.drawAbove.add(men7);
		this.drawAbove.add(men8);
		this.drawCalls.delete(men1);
		this.drawCalls.delete(men2);
		this.drawCalls.delete(men3);
		this.drawCalls.delete(men4);
		this.drawCalls.delete(men5);
		this.drawCalls.delete(men6);
		this.drawCalls.delete(men7);
		this.drawCalls.delete(men8);
	}
	process(){
		super.process();
		MOUSE_WAS_PRESSED = false;
	}
}

/*
This is the part that loads the world and starts the game.
*/

function setup() {
	W_LOGO = new logo_world();
	W_MENU = new menu_world();
	W_SETTINGS = new settings_world();
	W_INSTRUCTIONS = new instructions_world();
	WORLD=W_LOGO;
	WORLD.setup();
	W_MENU.setup();
	W_SETTINGS.setup();
	W_INSTRUCTIONS.setup();
}

function draw() {
	WORLD.process();
	WORLD.draw();
}