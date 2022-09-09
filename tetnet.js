var grid = [
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
];

var shapes = {
	I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
	J: [[2,0,0], [2,2,2], [0,0,0]],
	L: [[0,0,3], [3,3,3], [0,0,0]],
	O: [[4,4], [4,4]],
	S: [[0,5,5], [5,5,0], [0,0,0]],
	T: [[0,6,0], [6,6,6], [0,0,0]],
	Z: [[7,7,0], [0,7,7], [0,0,0]]
};

var colors = ["00F4EB", "0000EF", "EFA007", "F0F005", "00F101", "A100F0", "ED0200"];

var currentShape = {x: 0, y: 0, shape: undefined};
var upcomingShape;
var score = 0;
var rndSeed = 1;
var bag = [];
var bagIndex = 0;
var saveState;
var speed = 500;
var changeSpeed = false;
var populationSize = 50;
var genomes = [];
var currentGenome = -1;
var generation = 0;
var roundState;
var ai = true;
var draw = true;
var archive = {
	populationSize: 0,
	currentGeneration: 0,
	elites: [],
	genomes: []
};
var mutationRate = 0.05;
var mutationStep = 0.2;
var speeds = [500,100,1,0];
var speedIndex = 0;
var inspectMoveSelection = false;
var moveAlgorithm = {};
var movesTaken = 0;
var moveLimit = 500;

function initialize() {
	archive.populationSize = populationSize;
	nextShape();
	applyShape();
	saveState = getState();
	roundState = getState();
	createInitialPopulation();
	var loop = function(){
		if (changeSpeed) {
			clearInterval(interval);
			interval = setInterval(loop, speed);
			changeInterval = false;
		}
		if (speed === 0) {
			draw = false;
			update();
			update();
			update();
		} else {
			draw = true;
		}
		update();
		if (speed === 0) {
			draw = true;
			updateScore();
		}
	};
	var interval = setInterval(loop, speed);
}
document.onLoad = initialize();

window.onkeydown = function () {
	var characterPressed = String.fromCharCode(event.keyCode);
	if (event.keyCode == 38) {
		rotateShape();
	} else if (event.keyCode == 40) {
		moveDown();
	} else if (event.keyCode == 37) {
		moveLeft();
	} else if (event.keyCode == 39) {
		moveRight();
	} else if (shapes[characterPressed.toUpperCase()] !== undefined) {
		removeShape();
		currentShape.shape = shapes[characterPressed.toUpperCase()];
		applyShape();
	} else if (characterPressed.toUpperCase() == "Q") {
		saveState = getState();
	} else if (characterPressed.toUpperCase() == "W") {
		loadState(saveState);
	} else if (characterPressed.toUpperCase() == "D") {
		speedIndex--;
		if (speedIndex < 0) {
			speedIndex = speeds.length - 1;
		}
		speed = speeds[speedIndex];
		changeSpeed = true;
	} else if (characterPressed.toUpperCase() == "E") {
		speedIndex++;
		if (speedIndex >= speeds.length) {
			speedIndex = 0;
		}
		speed = speeds[speedIndex];
		changeSpeed = true;
	} else if (characterPressed.toUpperCase() == "A") {
		ai = !ai;
	} else if (characterPressed.toUpperCase() == "R") {
		loadArchive(prompt("Insert archive:"));
	} else if (characterPressed.toUpperCase() == "G") {
		if (localStorage.getItem("archive") === null) {
			alert("No archive saved. Archives are saved after a generation has passed, and remain across sessions. Try again once a generation has passed");
		} else {
			prompt("Archive from last generation (including from last session):", localStorage.getItem("archive"));
		}
	} else if (characterPressed.toUpperCase() == "F") {
		inspectMoveSelection = !inspectMoveSelection;
	} else {
		return true;
	}
	output();
	return false;
};

/**
 * Creates the initial population of genomes, each with random genes.
 */
 function createInitialPopulation() {
 	genomes = [];
 	for (var i = 0; i < populationSize; i++) {
 		var genome = {
 			id: Math.random(),
 			rowsCleared: Math.random() - 0.5,
 			weightedHeight: Math.random() - 0.5,
 			cumulativeHeight: Math.random() - 0.5,
 			relativeHeight: Math.random() - 0.5,
 			holes: Math.random() * 0.5,
 			roughness: Math.random() - 0.5,
 		};
 		genomes.push(genome);
 	}
 	evaluateNextGenome();
 }

/**
 * Evaluates the next genome in the population. If there is none, evolves the population.
 */
 function evaluateNextGenome() {
 	currentGenome++;
 	if (currentGenome == genomes.length) {
 		evolve();
 	}
 	loadState(roundState);
 	movesTaken = 0;
 	makeNextMove();
 }

/**
 * Evolves the entire population and goes to the next generation.
 */
 function evolve() {
 	console.log("Generation " + generation + " evaluated.");
 	currentGenome = 0;
 	generation++;
 	reset();
 	roundState = getState();
 	genomes.sort(function(a, b) {
 		return b.fitness - a.fitness;
 	});
 	archive.elites.push(clone(genomes[0]));
 	console.log("Elite's fitness: " + genomes[0].fitness);
 	while(genomes.length > populationSize / 2) {
 		genomes.pop();
 	}
 	var totalFitness = 0;
 	for (var i = 0; i < genomes.length; i++) {
 		totalFitness += genomes[i].fitness;
 	}
/*	var weights = [];
	var accumulated = 0;
	for (var j = 0; j < genomes.length; j++) {
		weights[j] = accumulated + (genomes[j].fitness / totalFitness);
		accumulated += genomes[j].fitness / totalFitness;
	}*/
	function getRandomGenome() {
/*		var random = Math.random() * 1;
		for (var k = 0; k < weights.length; k++) {
			if (weights[k] >= random) {
				return genomes[k];
			}
		}*/
		return genomes[randomWeightedNumBetween(0, genomes.length - 1)];
	}
	var children = [];
	children.push(clone(genomes[0]));
	while (children.length < populationSize) {
		children.push(makeChild(getRandomGenome(), getRandomGenome()));
	}
	genomes = [];
	genomes = genomes.concat(children);
	archive.genomes = clone(genomes);
	archive.currentGeneration = clone(generation);
	console.log(JSON.stringify(archive));
	localStorage.setItem("archive", JSON.stringify(archive));
}

/**
 * Creates a child genome from the given parent genomes, and then attempts to mutate the child genome.
 * @param  {Genome} mum The first parent genome.
 * @param  {Genome} dad The second parent genome.
 * @return {Genome}     The child genome.
 */
 function makeChild(mum, dad) {
 	var child = {
 		id : Math.random(),
 		rowsCleared: randomChoice(mum.rowsCleared, dad.rowsCleared),
 		weightedHeight: randomChoice(mum.weightedHeight, dad.weightedHeight),
 		cumulativeHeight: randomChoice(mum.cumulativeHeight, dad.cumulativeHeight),
 		relativeHeight: randomChoice(mum.relativeHeight, dad.relativeHeight),
 		holes: randomChoice(mum.holes, dad.holes),
 		roughness: randomChoice(mum.roughness, dad.roughness),
 		fitness: -1
 	};
 	if (Math.random() < mutationRate) {
 		child.rowsCleared = child.rowsCleared + Math.random() * mutationStep * 2 - mutationStep;
 	}
 	if (Math.random() < mutationRate) {
 		child.weightedHeight = child.weightedHeight + Math.random() * mutationStep * 2 - mutationStep;
 	}
 	if (Math.random() < mutationRate) {
 		child.cumulativeHeight = child.cumulativeHeight + Math.random() * mutationStep * 2 - mutationStep;
 	}
 	if (Math.random() < mutationRate) {
 		child.relativeHeight = child.relativeHeight + Math.random() * mutationStep * 2 - mutationStep;
 	}
 	if (Math.random() < mutationRate) {
 		child.holes = child.holes + Math.random() * mutationStep * 2 - mutationStep;
 	}
 	if (Math.random() < mutationRate) {
 		child.roughness = child.roughness + Math.random() * mutationStep * 2 - mutationStep;
 	}
 	return child;
 }

/**
 * Returns an array of all the possible moves that could occur in the current state, rated by the parameters of the current genome.
 * @return {Array} An array of all the possible moves that could occur.
 */
 function getAllPossibleMoves() {
 	var lastState = getState();
 	var possibleMoves = [];
 	var possibleMoveRatings = [];
 	var iterations = 0;
 	for (var rots = 0; rots < 4; rots++) {
 		var oldX = [];
 		for (var t = -5; t <= 5; t++) {
 			iterations++;
 			loadState(lastState);
 			for (var j = 0; j < rots; j++) {
 				rotateShape();
 			}
 			if (t < 0) {
 				for (var l = 0; l < Math.abs(t); l++) {
 					moveLeft();
 				}
 			} else if (t > 0) {
 				for (var r = 0; r < t; r++) {
 					moveRight();
 				}
 			}
 			if (!contains(oldX, currentShape.x)) {
 				var moveDownResults = moveDown();
 				while (moveDownResults.moved) {
 					moveDownResults = moveDown();
 				}
 				var algorithm = {
 					rowsCleared: moveDownResults.rowsCleared,
 					weightedHeight: Math.pow(getHeight(), 1.5),
 					cumulativeHeight: getCumulativeHeight(),
 					relativeHeight: getRelativeHeight(),
 					holes: getHoles(),
 					roughness: getRoughness()
 				};
 				var rating = 0;
 				rating += algorithm.rowsCleared * genomes[currentGenome].rowsCleared;
 				rating += algorithm.weightedHeight * genomes[currentGenome].weightedHeight;
 				rating += algorithm.cumulativeHeight * genomes[currentGenome].cumulativeHeight;
 				rating += algorithm.relativeHeight * genomes[currentGenome].relativeHeight;
 				rating += algorithm.holes * genomes[currentGenome].holes;
 				rating += algorithm.roughness * genomes[currentGenome].roughness;

 				if (moveDownResults.lose) {
 					rating -= 500;
 				}
 				possibleMoves.push({rotations: rots, translation: t, rating: rating, algorithm: algorithm});
 				oldX.push(currentShape.x);
 			}
 		}
 	}
 	loadState(lastState);
 	return possibleMoves;
 }

/**
 * Returns the highest rated move in the given array of moves.
 * @param  {Array} moves An array of possible moves to choose from.
 * @return {Move}       The highest rated move from the moveset.
 */
 function getHighestRatedMove(moves) {
 	var maxRating = -10000000000000;
 	var maxMove = -1;
 	var ties = [];
 	for (var index = 0; index < moves.length; index++) {
 		if (moves[index].rating > maxRating) {
 			maxRating = moves[index].rating;
 			maxMove = index;
 			ties = [index];
 		} else if (moves[index].rating == maxRating) {
 			ties.push(index);
 		}
 	}
	//var move = possibleMoves[ties[randomNumBetween(0, ties.length - 1)]];
	var move = moves[ties[0]];
	move.algorithm.ties = ties.length;
	return move;
}

/**
 * Makes a move, which is decided upon using the parameters in the current genome.
 */
 function makeNextMove() {
 	movesTaken++;
 	if (movesTaken > moveLimit) {
 		genomes[currentGenome].fitness = clone(score);
 		evaluateNextGenome();
 	} else {
 		var oldDraw = clone(draw);
 		draw = false;
 		var possibleMoves = getAllPossibleMoves();
 		var lastState = getState();
 		nextShape();
 		for (var i = 0; i < possibleMoves.length; i++) {
 			var nextMove = getHighestRatedMove(getAllPossibleMoves());
 			possibleMoves[i].rating += nextMove.rating;
 		}
 		loadState(lastState);
 		var move = getHighestRatedMove(possibleMoves);
 		for (var rotations = 0; rotations < move.rotations; rotations++) {
 			rotateShape();
 		}
 		if (move.translation < 0) {
 			for (var lefts = 0; lefts < Math.abs(move.translation); lefts++) {
 				moveLeft();
 			}
 		} else if (move.translation > 0) {
 			for (var rights = 0; rights < move.translation; rights++) {
 				moveRight();
 			}
 		}
 		if (inspectMoveSelection) {
 			moveAlgorithm = move.algorithm;
 		}
 		draw = oldDraw;
 		output();
 		updateScore();
 	}
 }

/**
 * Updates the game.
 */
 function update() {
 	if (ai && currentGenome != -1) {
 		var results = moveDown();
 		if (!results.moved) {
 			if (results.lose) {
 				genomes[currentGenome].fitness = clone(score);
 				evaluateNextGenome();
 			} else {
 				makeNextMove();
 			}
 		}
 	} else {
 		moveDown();
 	}
 	output();
 	updateScore();
 }

/**
 * Moves the current shape down if possible.
 * @return {Object} The results of the movement of the piece.
 */
 function moveDown() {
 	var result = {lose: false, moved: true, rowsCleared: 0};
 	removeShape();
 	currentShape.y++;
 	if (collides(grid, currentShape)) {
 		currentShape.y--;
 		applyShape();
 		nextShape();
 		result.rowsCleared = clearRows();
 		if (collides(grid, currentShape)) {
 			result.lose = true;
 			if (ai) {
 			} else {
 				reset();
 			}
 		}
 		result.moved = false;
 	}
 	applyShape();
 	score++;
 	updateScore();
 	output();
 	return result;
 }

/**
 * Moves the current shape to the left if possible.
 */
 function moveLeft() {
 	removeShape();
 	currentShape.x--;
 	if (collides(grid, currentShape)) {
 		currentShape.x++;
 	}
 	applyShape();
 }

/**
 * Moves the current shape to the right if possible.
 */
 function moveRight() {
 	removeShape();
 	currentShape.x++;
 	if (collides(grid, currentShape)) {
 		currentShape.x--;
 	}
 	applyShape();
 }

/**
 * Rotates the current shape clockwise if possible.
 */
 function rotateShape() {
 	removeShape();
 	currentShape.shape = rotate(currentShape.shape, 1);
 	if (collides(grid, currentShape)) {
 		currentShape.shape = rotate(currentShape.shape, 3);
 	}
 	applyShape();
 }

/**
 * Clears any rows that are completely filled.
 */
 function clearRows() {
 	var rowsToClear = [];
 	for (var row = 0; row < grid.length; row++) {
 		var containsEmptySpace = false;
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] === 0) {
 				containsEmptySpace = true;
 			}
 		}
 		if (!containsEmptySpace) {
 			rowsToClear.push(row);
 		}
 	}
 	if (rowsToClear.length == 1) {
 		score += 400;
 	} else if (rowsToClear.length == 2) {
 		score += 1000;
 	} else if (rowsToClear.length == 3) {
 		score += 3000;
 	} else if (rowsToClear.length >= 4) {
 		score += 12000;
 	}
 	var rowsCleared = clone(rowsToClear.length);
 	for (var toClear = rowsToClear.length - 1; toClear >= 0; toClear--) {
 		grid.splice(rowsToClear[toClear], 1);
 	}
 	while (grid.length < 20) {
 		grid.unshift([0,0,0,0,0,0,0,0,0,0]);
 	}
 	return rowsCleared;
 }

/**
 * Applies the current shape to the grid.
 */
 function applyShape() {
 	for (var row = 0; row < currentShape.shape.length; row++) {
 		for (var col = 0; col < currentShape.shape[row].length; col++) {
 			if (currentShape.shape[row][col] !== 0) {
 				grid[currentShape.y + row][currentShape.x + col] = currentShape.shape[row][col];
 			}
 		}
 	}
 }

/**
 * Removes the current shape from the grid.
 */
 function removeShape() {
 	for (var row = 0; row < currentShape.shape.length; row++) {
 		for (var col = 0; col < currentShape.shape[row].length; col++) {
 			if (currentShape.shape[row][col] !== 0) {
 				grid[currentShape.y + row][currentShape.x + col] = 0;
 			}
 		}
 	}
 }

/**
 * Cycles to the next shape in the bag.
 */
 function nextShape() {
 	bagIndex += 1;
 	if (bag.length === 0 || bagIndex == bag.length) {
 		generateBag();
 	}
 	if (bagIndex == bag.length - 1) {
 		var prevSeed = rndSeed;
 		upcomingShape = randomProperty(shapes);
 		rndSeed = prevSeed;
 	} else {
 		upcomingShape = shapes[bag[bagIndex + 1]];
 	}
 	currentShape.shape = shapes[bag[bagIndex]];
 	currentShape.x = Math.floor(grid[0].length / 2) - Math.ceil(currentShape.shape[0].length / 2);
 	currentShape.y = 0;
 }

/**
 * Generates the bag of shapes.
 */
 function generateBag() {
 	bag = [];
 	var contents = "";
 	for (var i = 0; i < 7; i++) {
 		var shape = randomKey(shapes);
 		while(contents.indexOf(shape) != -1) {
 			shape = randomKey(shapes);
 		}
 		bag[i] = shape;
 		contents += shape;
 	}
 	bagIndex = 0;
 }

/**
 * Resets the game.
 */
 function reset() {
 	score = 0;
 	grid = [[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	];
 	moves = 0;
 	generateBag();
 	nextShape();
 }

/**
 * Determines if the given grid and shape collide with one another.
 * @param  {Grid} scene  The grid to check.
 * @param  {Shape} object The shape to check.
 * @return {Boolean} Whether the shape and grid collide.
 */
 function collides(scene, object) {
 	for (var row = 0; row < object.shape.length; row++) {
 		for (var col = 0; col < object.shape[row].length; col++) {
 			if (object.shape[row][col] !== 0) {
 				if (scene[object.y + row] === undefined || scene[object.y + row][object.x + col] === undefined || scene[object.y + row][object.x + col] !== 0) {
 					return true;
 				}
 			}
 		}
 	}
 	return false;
 }

 function rotate(matrix, times) {
 	for (var t = 0; t < times; t++) {
 		matrix = transpose(matrix);
 		for (var i = 0; i < matrix.length; i++) {
 			matrix[i].reverse();
 		}
 	}
 	return matrix;
 }

 function transpose(array) {
 	return array[0].map(function(col, i) {
 		return array.map(function(row) {
 			return row[i];
 		});
 	});
 }

/**
 * Outputs the state to the screen.
 */
 function output() {
 	if (draw) {
 		var output = document.getElementById("output");
 		var html = "<h1>TetNet</h1><h5>Evolutionary approach to Tetris AI</h5>var grid = [";
 		var space = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
 		for (var i = 0; i < grid.length; i++) {
 			if (i === 0) {
 				html += "[" + grid[i] + "]";
 			} else {
 				html += "<br />" + space + "[" + grid[i] + "]";
 			}
 		}
 		html += "];";
 		for (var c = 0; c < colors.length; c++) {
 			html = replaceAll(html, "," + (c + 1), ",<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>");
 			html = replaceAll(html, (c + 1) + ",", "<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>,");
 		}
 		output.innerHTML = html;
 	}
 }

/**
 * Updates the side information.
 */
 function updateScore() {
 	if (draw) {
 		var scoreDetails = document.getElementById("score");
 		var html = "<br /><br /><h2>&nbsp;</h2><h2>Score: " + score + "</h2>";
 		html += "<br /><b>--Upcoming--</b>";
 		for (var i = 0; i < upcomingShape.length; i++) {
 			var next =replaceAll((upcomingShape[i] + ""), "0", "&nbsp;");
 			html += "<br />&nbsp;&nbsp;&nbsp;&nbsp;" + next;
 		}
 		for (var l = 0; l < 4 - upcomingShape.length; l++) {
 			html += "<br />";
 		}
 		for (var c = 0; c < colors.length; c++) {
 			html = replaceAll(html, "," + (c + 1), ",<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>");
 			html = replaceAll(html, (c + 1) + ",", "<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>,");
 		}
 		html += "<br />Speed: " + speed;
 		if (ai) {
 			html += "<br />Moves: " + movesTaken + "/" + moveLimit;
 			html += "<br />Generation: " + generation;
 			html += "<br />Individual: " + (currentGenome + 1)  + "/" + populationSize;
 			html += "<br /><pre style=\"font-size:12px\">" + JSON.stringify(genomes[currentGenome], null, 2) + "</pre>";
 			if (inspectMoveSelection) {
 				html += "<br /><pre style=\"font-size:12px\">" + JSON.stringify(moveAlgorithm, null, 2) + "</pre>";
 			}
 		}
 		html = replaceAll(replaceAll(replaceAll(html, "&nbsp;,", "&nbsp;&nbsp;"), ",&nbsp;", "&nbsp;&nbsp;"), ",", "&nbsp;");
 		scoreDetails.innerHTML = html;
 	}
 }

/**
 * Returns the current game state in an object.
 * @return {State} The current game state.
 */
 function getState() {
 	var state = {
 		grid: clone(grid),
 		currentShape: clone(currentShape),
 		upcomingShape: clone(upcomingShape),
 		bag: clone(bag),
 		bagIndex: clone(bagIndex),
 		rndSeed: clone(rndSeed),
 		score: clone(score)
 	};
 	return state;
 }

/**
 * Loads the game state from the given state object.
 * @param  {State} state The state to load.
 */
 function loadState(state) {
 	grid = clone(state.grid);
 	currentShape = clone(state.currentShape);
 	upcomingShape = clone(state.upcomingShape);
 	bag = clone(state.bag);
 	bagIndex = clone(state.bagIndex);
 	rndSeed = clone(state.rndSeed);
 	score = clone(state.score);
 	output();
 	updateScore();
 }

/**
 * Returns the cumulative height of all the columns.
 * @return {Number} The cumulative height.
 */
 function getCumulativeHeight() {
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	var totalHeight = 0;
 	for (var i = 0; i < peaks.length; i++) {
 		totalHeight += 20 - peaks[i];
 	}
 	applyShape();
 	return totalHeight;
 }

/**
 * Returns the number of holes in the grid.
 * @return {Number} The number of holes.
 */
 function getHoles() {
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	var holes = 0;
 	for (var x = 0; x < peaks.length; x++) {
 		for (var y = peaks[x]; y < grid.length; y++) {
 			if (grid[y][x] === 0) {
 				holes++;
 			}
 		}
 	}
 	applyShape();
 	return holes;
 }

/**
 * Returns an array that replaces all the holes in the grid with -1.
 * @return {Array} The modified grid array.
 */
 function getHolesArray() {
 	var array = clone(grid);
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	for (var x = 0; x < peaks.length; x++) {
 		for (var y = peaks[x]; y < grid.length; y++) {
 			if (grid[y][x] === 0) {
 				array[y][x] = -1;
 			}
 		}
 	}
 	applyShape();
 	return array;
 }

/**
 * Returns the roughness of the grid.
 * @return {Number} The roughness of the grid.
 */
 function getRoughness() {
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	var roughness = 0;
 	var differences = [];
 	for (var i = 0; i < peaks.length - 1; i++) {
 		roughness += Math.abs(peaks[i] - peaks[i + 1]);
 		differences[i] = Math.abs(peaks[i] - peaks[i + 1]);
 	}
 	applyShape();
 	return roughness;
 }

/**
 * Returns the range of heights of the columns on the grid.
 * @return {Number} The relative height.
 */
 function getRelativeHeight() {
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	applyShape();
 	return Math.max.apply(Math, peaks) - Math.min.apply(Math, peaks);
 }

/**
 * Returns the height of the biggest column on the grid.
 * @return {Number} The absolute height.
 */
 function getHeight() {
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	applyShape();
 	return 20 - Math.min.apply(Math, peaks);
 }

/**
 * Loads the archive given.
 * @param  {String} archiveString The stringified archive.
 */
 function loadArchive(archiveString) {
 	archive = JSON.parse(archiveString);
 	genomes = clone(archive.genomes);
 	populationSize = archive.populationSize;
 	generation = archive.currentGeneration;
 	currentGenome = 0;
 	reset();
 	roundState = getState();
 	console.log("Archive loaded!");
 }

/**
 * Clones an object.
 * @param  {Object} obj The object to clone.
 * @return {Object}     The cloned object.
 */
 function clone(obj) {
 	return JSON.parse(JSON.stringify(obj));
 }

/**
 * Returns a random property from the given object.
 * @param  {Object} obj The object to select a property from.
 * @return {Property}     A random property.
 */
 function randomProperty(obj) {
 	return(obj[randomKey(obj)]);
 }

/**
 * Returns a random property key from the given object.
 * @param  {Object} obj The object to select a property key from.
 * @return {Property}     A random property key.
 */
 function randomKey(obj) {
 	var keys = Object.keys(obj);
 	var i = seededRandom(0, keys.length);
 	return keys[i];
 }

 function replaceAll(target, search, replacement) {
 	return target.replace(new RegExp(search, 'g'), replacement);
 }

/**
 * Returns a random number that is determined from a seeded random number generator.
 * @param  {Number} min The minimum number, inclusive.
 * @param  {Number} max The maximum number, exclusive.
 * @return {Number}     The generated random number.
 */
 function seededRandom(min, max) {
 	max = max || 1;
 	min = min || 0;

 	rndSeed = (rndSeed * 9301 + 49297) % 233280;
 	var rnd = rndSeed / 233280;

 	return Math.floor(min + rnd * (max - min));
 }

 function randomNumBetween(min, max) {
 	return Math.floor(Math.random() * (max - min + 1) + min);
 }

 function randomWeightedNumBetween(min, max) {
 	return Math.floor(Math.pow(Math.random(), 2) * (max - min + 1) + min);
 }

 function randomChoice(propOne, propTwo) {
 	if (Math.round(Math.random()) === 0) {
 		return clone(propOne);
 	} else {
 		return clone(propTwo);
 	}
 }

 function contains(a, obj) {
 	var i = a.length;
 	while (i--) {
 		if (a[i] === obj) {
 			return true;
 		}
 	}
 	return false;
 }
