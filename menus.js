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
		LOGO.copy(CANVAS,
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
			image(LOGO, lerp(210, 790, (frameCount-520)/60),
			lerp(430, 940, (frameCount-520)/60),
			lerp(580, 200,(frameCount-520)/60),
			lerp(120, 50, (frameCount-520)/60));
		}
		else if (frameCount > 580 && frameCount < 600)
		{
			image(LOGO, 790, 940, 200,50);
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
		image(LOGO, 790, 940, 200,50)
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
		new emitter(this, starfield_part, createVector(0), 0, 300, 300, 5,1,10, false, createVector(500,500));
		let men1 = new menu_item(this, createVector(500,300), 0, 300, 100, "PLAY", function() {W_LEVEL_1.setup(); WORLD=W_LEVEL_1;});
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
		//this.ballimg = loadImage("assets/ball.png");
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
		image(this.ballimg, -10,-10, 20,20);
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