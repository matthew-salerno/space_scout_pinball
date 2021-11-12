class ship_walls extends entity_2d {
	constructor(parent, position, direction) {
		super(parent, position, direction);
		colorMode(RGB);
		this.color = color(85);
		this.collisions = [];
		this.collisions.push(new collision_2d(this, zip_array_to_vecs([
			120, 20,
			140, 20,
			140, 820,
			120, 820
		]),0));
		this.collisions.push(new collision_2d(this,zip_array_to_vecs([
			520, 20,
			540, 20,
			540, 820,
			520, 820
		]),0));
		this.collisions.push(new collision_2d(this,zip_array_to_vecs([
			140, 100,
			140, 20,
			300, 20,
			300, 40
		]),0));
		this.collisions.push(new collision_2d(this,zip_array_to_vecs([
			360, 20,
			520, 20,
			520, 100,
			360, 40
		]),0));
		this.collisions.push(new collision_2d(this,zip_array_to_vecs([
			440, 280,
			520, 240,
			520, 400
		]),0));
		this.collisions.push(new collision_2d(this,zip_array_to_vecs([
			140, 240,
			220, 280,
			140, 400
		]),0));
		this.collisions.push(new collision_2d(this,zip_array_to_vecs([
			180, 560,
			260, 700,
			260, 720,
			240, 720,
			160, 680,
			160, 560,
		]),2));
		this.collisions.push(new collision_2d(this,zip_array_to_vecs([
			500, 560,
			500, 680,
			440, 720,
			420, 720,
			420, 700,
			480, 560
		]),2));
		this.collisions.push(new collision_2d(this,zip_array_to_vecs([
			160, 720,
			260, 760,
			260, 820,
			160, 820,
		]),0));
		this.collisions.push(new collision_2d(this,zip_array_to_vecs([
			500, 820,
			400, 820,
			400, 760,
			500, 720
		]),0));
	}
	__draw() {
		for (let coll of this.collisions) {
			fill(this.color);
			noStroke();
			coll.shape.draw();
		}
	}
}

class level_1_world extends world {
	constructor() {
		super();
		this.drawAbove = new Set();
		this.layer0 = loadImage("assets/Spaceship_background.png");
		this.layer1 = loadImage("assets/Spaceship_mid_background.png");
		this.layer2 = loadImage("assets/Spaceship_mid_foreground.png");
		this.layer3 = loadImage("assets/Spaceship_foreground.png");
		this.walls = new ship_walls(this, createVector(0,0), 0);
	}
	draw() {
		fill("black");
		rect(0,0, 100, 50);
		image(this.layer1, 0, 0);
		for (let i of this.drawCalls) {
			i.__draw();
		}
		rect(0,0, 100, 100);
		fill("white");
	}
	setup() {
		image(this.layer0, 0, 0);
		image(this.layer2, 0, 0);
		image(this.layer3, 0, 0);
	}
	process(){
		super.process();
		MOUSE_WAS_PRESSED = false;
	}
}