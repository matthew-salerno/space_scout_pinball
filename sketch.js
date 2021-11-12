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
var CANVAS;
// worlds that we want to keep as globals for switching
var W_LOGO;
var W_MENU;
var W_SETTINGS;
var W_INSTRUCTIONS;
var W_LEVEL_1;

// debug
var VISUALIZE_COLLISIONS  = false;
const PAUSE_FOR_SPRITESHEET = false;
var DRAW_HITBOX           = false;



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

/*
This is the part that loads the world and starts the game.
*/

function setup() {
	CANVAS = createCanvas(1000, 1000);
	frameRate(60);
	W_LOGO = new logo_world();
	W_MENU = new menu_world();
	W_SETTINGS = new settings_world();
	W_INSTRUCTIONS = new instructions_world();
	W_LEVEL_1 = new level_1_world();
	WORLD=W_LOGO;
	WORLD.setup();
	W_MENU.setup();
	W_SETTINGS.setup();
	W_INSTRUCTIONS.setup();
}

function draw() {
	WORLD.process();
	WORLD.draw();
	textAlign(LEFT);
	textSize(30);
	text(str(round(frameRate())), 30, 30);
}