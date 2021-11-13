class ball extends entity_2d {
	constructor(parent, position, direction) {
		super(parent, position, direction);
		this.spawn = position.copy();
		this.velocity = createVector(0,0);
		this.friction = 0.98;
		this.bounce = 0.90;
	}
	__process() {
		this.position.add(this.velocity);
		for (let wall of this.world.walls.collisions) {
			if (wall.intersect_circle(this.position, 10)) {
				let pln = wall.get_closest_plane(this.position.copy().sub(this.velocity),10);
				if (pln === null) {
					continue;
				}
				this.position.add(pln.normal.copy().mult(abs(pln.dist(this.position)-10)));
				this.velocity.reflect(pln.normal);
				this.velocity.mult(this.bounce);
			}
		}
		for (let paddle of this.world.paddles) {
			if (paddle.shape.intersect_circle(this.position, 10)) {
				let pln = paddle.shape.get_closest_plane(this.position.copy().sub(this.velocity),10);
				if (pln === null) {
					continue;
				}
				this.position.add(pln.normal.copy().mult(abs(pln.dist(this.position)-10)));
				this.velocity.reflect(pln.normal);
				this.velocity.mult(this.bounce);
			}
		}
		for (let bumper of this.world.bumpers) {
			if (bumper.shape.intersect_circle(this.position, 10)) {
				let pln = bumper.shape.get_closest_plane(this.position.copy().sub(this.velocity),10);
				if (pln === null) {
					continue;
				}
				this.position.add(pln.normal.copy().mult(abs(pln.dist(this.position)-10)));
				this.velocity.reflect(pln.normal);
				this.velocity.add(this.velocity.copy().normalize().mult(5));
				this.world.score+=5;
			}
		}
		if (this.position.y > 1020) {
			this.position = this.spawn.copy();
			this.world.lives--;
		}
		this.velocity.mult(this.friction);
	}
	__draw() {
		translate(this.position.x, this.position.y);
		noStroke();
		fill(90);
		circle(0,0,20);
		image(BALL_IMG, -7, -7, 14, 14);
		translate(-this.position.x, -this.position.y);
	}
}