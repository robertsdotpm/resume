// Snake config.
var SNAKE_INTERVAL = {
	"easy": 250,
	"medium": 150,
	"hard": 100
}

/////////////////////////////////////////////////////////////////////

// Utils.
function do_nothing()
{
	return false;
}

function rand_range(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function tile_to_str(tile)
{
	return "x" + tile[0].toString() + "y" + tile[1].toString();
}

function is_same_tile(tile_a, tile_b)
{
	var x_con = tile_a[0] == tile_b[0];
	var y_con = tile_a[1] == tile_b[1];
	return (x_con && y_con);
}

function find_tile(tile, tiles)
{
	for(var i = 0; i < tiles.length; i++)
	{
		if(is_same_tile(tiles[i], tile))
		{
			return i;
		}
	}
	
	return -1;
}

///////////////////////////////////////////////////////////////

// Direction snake can move.
var SNAKE_UP = 0;
var SNAKE_DOWN = 1;
var SNAKE_LEFT = 2;
var SNAKE_RIGHT = 3;

// Hold state of snake game.
var snake = {}
var snake_high_score = {
	"easy": 0,
	"medium": 0,
	"hard": 0
};

// Color a given square for the game.
function snake_color_tile(tile, color)
{
	// Color game tile.
	var btn_id = tile_to_str(tile);
	var btn = this.getField(btn_id);
	btn.fillColor = color;
	return btn;
}

function snake_clear_scores()
{
	this.getField("snake_score").value = "0";
	this.getField("snake_high_score").value = "0";
}

function snake_update_scores()
{
	// Score field value.
	this.getField("snake_score").value = snake["score"].toString();
	
	// Use score for the high score if we exceed it.
	if(snake["score"] > snake_high_score[snake["difficulty"]])
	{
		this.getField("snake_high_score").value = snake["score"].toString();
	}
	else
	{
		this.getField("snake_high_score").value = snake_high_score[snake["difficulty"]].toString();
	}
}

function snake_game_over()
{
	// Stop the game loop.
	app.clearInterval(snake["game_loop"]);
	
	// Show their score if they have one.
	snake_update_scores();
	if(snake["score"])
	{
		// Update high score.
		if(snake["score"] > snake_high_score[snake["difficulty"]])
		{
			snake_high_score[snake["difficulty"]] = snake["score"];
		}
		
		// Show score and high score.
		var ys = snake["score"].toString();
		var hs = snake_high_score[snake["difficulty"]].toString();
		var msg = 'Ouch! Game over! Your score = ' + ys + '; high score = ' + hs;
		app.alert(msg);
		snake["playing"] = false;
	}
}

// Stop the game from running and do cleanup.
function snake_reset()
{
	// Disable field highlighting if it's on.
	if(app.runtimeHighlight)
	{
		app.runtimeHighlight = false;
		//app.runtimeHighlightColor = color.red;
	}
	
	// Stop game loop running.
	if(snake["game_loop"] != null)
	{
		// Don't show an alert if there was already one.
		if(snake["playing"])
		{
			snake_game_over();
		}
		
		snake["game_loop"] = null;
	}
	
	// Game loop update speed.
	var difficulty = this.getField("snake_difficulty").value;
	
	// Reset snake state.
	snake = {
		"score": 0,
		"difficulty": difficulty,
		"playing": true,
		"move": null,
		"input": false,
		"game_loop": null,
		"x": 0,
		"y": 0,
		"x_limit": 16,
		"y_limit": 6,
		"snake_tiles": [],
		"empty_tiles": [],
		"food_tiles": [],
	}
	
	// Reset game tile coloring.
	for(var x = 0; x <= snake["x_limit"]; x++)
	{
		for(var y = 0; y <= snake["y_limit"]; y++)
		{
			var tile = [x, y];
			
			// Reset the tile color to white.
			var btn = snake_color_tile(tile, color.white);
			
			// Make sure it has a border.
			// This fixes a bug on firefox.
			btn.lineWidth = 1;
			btn.strokeColor = color.black;
		}
	}
	
	// Initial starting square.
	snake_color_tile([0, 0], color.black);
	
	// Score field value.
	snake_update_scores();
}

// Start accepting input for the snake game.
function snake_start()
{
	// Ensure state is clean.
	snake_reset();
	
	// Navigate to hidden input form.
	var snake_input = this.getField("snake_input");
	snake_input.setFocus(); 
}

// Add a new item of food to the game.
function snake_add_food()
{
	// Check list of empty tiles.
	var tile_len = snake["empty_tiles"].length;
	if(tile_len == 0)
	{
		throw new Error("No empty tiles remaining.");
	}
	
	// Select a random empty tile.
	var rand_index = rand_range(0, tile_len - 1);
	var tile = snake["empty_tiles"][rand_index];
	
	// Remove it from list of empty tiles.
	snake["empty_tiles"].splice(rand_index, 1);
	
	// Record food_tile.
	snake["food_tiles"].push(tile);
	
	// Color game pixel red.
	snake_color_tile(tile, color.red);
}

// Called once, prior to starting game loop running.
// Used to initialize snake state.
function snake_init()
{
	// Initialize the list of empty tiles.
	snake["snake_tiles"] = [[0, 0]];
	for(var x = 0; x <= snake["x_limit"]; x++)
	{
		for(var y = 0; y <= snake["y_limit"]; y++)
		{
			var tile = [x, y];
			snake["empty_tiles"].push(tile);
		}
	}
	snake["empty_tiles"].shift();
	
	// Add initial food item.
	snake_add_food();
}

function snake_next_tile(move)
{
	// Calculate next coordinates of snake.
	var x = snake["x"];
	var y = snake["y"];
	if(move == SNAKE_UP)
	{
		y = (snake["y"] + 1) % (snake["y_limit"] + 1);
	}
	if(move == SNAKE_DOWN)
	{
		y = (snake["y"] - 1) % (snake["y_limit"] + 1);
	}
	if(move == SNAKE_RIGHT)
	{
		x = (snake["x"] + 1) % (snake["x_limit"] + 1);
	}
	if(move == SNAKE_LEFT)
	{
		x = (snake["x"] - 1) % (snake["x_limit"] + 1);
	}
	
	// Wrap around X and Y.
	x = x < 0 ? snake["x_limit"] : x;
	y = y < 0 ? snake["y_limit"] : y;
	return [x, y];
}

// The main game loop of the snake game.
function snake_game_loop()
{
	// Calculate next coordinates of snake.
	var snake_head_tile = snake_next_tile(snake["move"]);
	
	// If the next head is in an empty tile then consume it.
	var empty_index = find_tile(snake_head_tile, snake["empty_tiles"]);
	if(empty_index != -1)
	{
		snake["empty_tiles"].splice(empty_index, 1);
	}
	
	// If new tile is filled with snake = game over.
	if(find_tile(snake_head_tile, snake["snake_tiles"]) != -1)
	{
		snake_game_over();
		return;
	}
	
	// If new tile is not filled with food = prune snake.
	var food_index = find_tile(snake_head_tile, snake["food_tiles"]);
	if(food_index == -1)
	{
		// Reset the trailing snake tile position.
		var snake_end_tile = snake["snake_tiles"][0];
		snake_color_tile(snake_end_tile, color.white);
		snake["snake_tiles"].splice(0, 1);
		snake["empty_tiles"].push(snake_end_tile);
	}
	
	// New position of the head snake tile.
	snake["snake_tiles"].push(snake_head_tile);
	snake_color_tile(snake_head_tile, color.black);
	
	// Add more food if needed.
	if(food_index != -1)
	{
		// Remove old entry for food index.
		snake["food_tiles"].splice(food_index, 1);
		
		// Add new food to collect.
		snake_add_food();
		
		// Increase score.
		snake["score"] += 100;
		snake_update_scores();
	}
	
	// Update snakes x and y position.
	snake["x"] = snake_head_tile[0];
	snake["y"] = snake_head_tile[1];
}

// Ignore input if it's opposite of direction and previous is snake.
function snake_ignore_input(move)
{
	// Not relevant.
	if(move == null)
	{
		return true;
	}
	
	// Ignore input if game is over.
	if(snake["playing"] == false)
	{
		return true;
	}
	
	// Block going back in opposite direction if snake > 1 long.
	var snake_len = snake["snake_tiles"].length;
	if(snake_len > 1)
	{
		var tile_a = snake_next_tile(move);
		var tile_b = snake["snake_tiles"][snake_len - 2];
		
		console.println(tile_a);
		console.println(tile_b);
		console.println("\r\n");
		if(is_same_tile(tile_a, tile_b))
		{
			return true;
		}
	}
	
	return false;
}

// Move the snake using a, s, d, w.
function handle_snake_input()
{
	var key = event.change;
	
	// Don't write anything to input.
	event.change = "";
	
	// Snake is moving left.
	var move = null;
	if(key == "a" || key == "A")
	{
		move = SNAKE_LEFT;
	}
	
	// Snake is moving right.
	if(key == "d" || key == "D")
	{
		move = SNAKE_RIGHT;
	}
	
	// Snake is moving up.
	if(key == "w" || key == "W")
	{
		move = SNAKE_UP;
	}
	
	// Snake is moving down.
	if(key == "s" || key == "S")
	{
		move = SNAKE_DOWN;
	}
	
	// Ignore input or not?
	// To prevent going back same direction (if full.)
	if(snake_ignore_input(move))
	{
		return;
	}

	// Update snake direction.
	snake["move"] = move;
	
	// Run game loop if it's not started.
	if(snake["game_loop"] == null)
	{
		console.println("starting game loop");
		snake_init();
		
		// Start game loop -- update speed based on difficulty.
		var interval_speed = SNAKE_INTERVAL[snake["difficulty"]];
		snake["game_loop"] = app.setInterval("snake_game_loop()", interval_speed);
	}
}

snake_clear_scores();
snake_reset();