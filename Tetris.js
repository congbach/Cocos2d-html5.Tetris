//  Created by Ken<congbach@congbach.com> on 22/6/12.

var MIN_UPDATE_TIME 		= 0.2;
var MAX_UPDATE_TIME 		= 1.0;
var DECREASE_UPDATE_TIME 	= 0.05;
var ROWS_COUNT 				= 13;
var COLS_COUNT 				= 10;
var KEYPAD_UPDATE_TIME		= 0.25;

var KeypadState = {	Released	: 0,	
					JustPressed	: 1,
					Pressed		: 2 };
Object.freeze(KeypadState);

var Direction = {	NoDirection	: 0,
					Up 			: 1,
					Down		: 2,
					Left		: 3,
					Right		: 4 };
Object.freeze(Direction);

var Tetris = cc.Layer.extend({
	score				: 0,
	time				: 0.0,
	keyTime				: 0.0,
	updateTime			: MAX_UPDATE_TIME,
	block				: null,
	nextBlock			: null,
	blocksBatchNode		: null,
	isDraggingBlock		: false,
	map					: [],
	keypadsStates		: [],
	verticalDirection 	: Direction.NoDirection,

    init:function () {
        this._super();
		this.setIsTouchEnabled(true);
		this.setIsKeypadEnabled(true);

		/* To be removed later */
        var size = cc.Director.sharedDirector().getWinSize();

        // add a "close" icon to exit the progress. it's an autorelease object
        var closeItem = cc.MenuItemImage.create(
            "Resources/CloseNormal.png",
            "Resources/CloseSelected.png",
            this,
            function () {
                history.go(-1);
            });
        closeItem.setAnchorPoint(new cc.Point(0.5,0.5));
		
        var menu = cc.Menu.create(closeItem, null);
        menu.setPosition( cc.PointZero() );
        this.addChild(menu, 1);
        closeItem.setPosition(new cc.Point(size.width -20 , 20));
		/* End of later removal */
		
		// Create background layer
		var lazyLayer = new cc.LazyLayer();
        this.addChild(lazyLayer);
        var size = cc.Director.sharedDirector().getWinSize();
        this.sprite = cc.Sprite.create("Resources/background.jpeg");
        this.sprite.setAnchorPoint(cc.ccp(0.5, 0.5));
        this.sprite.setPosition(cc.ccp(size.width / 2, size.height / 2));
        lazyLayer.addChild(this.sprite, 0);

		this.blocksBatchNode = TetrisBlock.blocksBatchNode();
		this.addChild(this.blocksBatchNode);
		for (var i = 0; i < ROWS_COUNT; i++) {
			this.map[i] = [];
			for (var j = 0; j < COLS_COUNT; j++)
				this.map[i][j] = null;
		}
		
		
		
		this.createBlock();
		this.block.updatePosition();
		
		this.scheduleUpdate();
        return true;
    },
	
	update:function(dt) {
		/*
		this.keyTime += dt;
		while (this.keyTime >= KEYPAD_UPDATE_TIME) {
			this.keyTime -= KEYPAD_UPDATE_TIME;
			
			if (this.horizontalDirection == Direction.Left) {
				
			} else if (this.horizontalDirection == Direction.Right) {
				
			}
			
			if (this.keypadsStates[cc.KEY.space] != undefined &&
				this.keypadsStates[cc.KEY.space] != KeypadState.Released)
					this.block.rotateLeft();
			
			if (this.keypadsStates[cc.KEY.down] == KeypadState.JustPressed) {
					
			}
			this.block.updatePosition();
		}
		*/
		
		this.time += dt;
		while (this.time >= this.updateTime) {
			this.time -= this.updateTime;
			var goDown = true;
			var blockUnitsCoordinates = this.block.unitsWorldCoordinates();
			var maxCoordinateY = 0;
			for (var idx in blockUnitsCoordinates) {
				var coordinate = blockUnitsCoordinates[idx];
				if (coordinate.y == 0 ||
					(coordinate.y <= ROWS_COUNT	&& this.map[coordinate.y - 1][coordinate.x]))
						goDown = false;
			}
				
			var gameOver = false;
			if (goDown)
				this.block.y -= 1;
			else {
				var blockUnitIdx = 0;
				for (var idx in blockUnitsCoordinates) {
					var coordinate = blockUnitsCoordinates[idx];
					if (coordinate.y >= ROWS_COUNT) {
						gameOver = true;
						break;
					} else
						this.map[coordinate.y][coordinate.x] = this.block.units[blockUnitIdx++];
				}
				
				if (! gameOver) {
					var removedRowsIndexes = [];
					for (var idx in blockUnitsCoordinates) {
						var coordinate = blockUnitsCoordinates[idx];
						var fullRow = true;
						for (var i = 0; i < COLS_COUNT; i++)
							if (! this.map[coordinate.y][i]) {
								fullRow = false;
								break;
							}

						if (fullRow)
							removedRowsIndexes.push(coordinate.y);
					}

					if (removedRowsIndexes.length) {
						removedRowsIndexes.sort(function(a, b) { return a - b; });
						for (var i = 1; i < removedRowsIndexes.length; )
							if (removedRowsIndexes[i] != removedRowsIndexes[i - 1])
								i++;
							else
								removedRowsIndexes.splice(i, 1);

						while (removedRowsIndexes.length) {
							var removedRowIndex = removedRowsIndexes.pop();
							var row = this.map[removedRowIndex];

							for (var idx in row)
								this.blocksBatchNode.removeChild(row[idx], true);

							this.map.splice(removedRowIndex, 1);
							this.map[ROWS_COUNT - 1] = [];
							for (var i = 0; i < COLS_COUNT; i++)
								this.map[ROWS_COUNT - 1][i] = null;
						}

						// Re-update positions of block units above the line
						for (var i = removedRowIndex; i < ROWS_COUNT; i++)
							for (var j = 0; j < COLS_COUNT; j++)
								if (this.map[i][j])
									this.map[i][j].setPosition(new cc.Point((j + 0.5) * BLOCK_UNIT_WIDTH,
																			(i + 0.5) * BLOCK_UNIT_HEIGHT));
					}
					this.createBlock();
				}
			}
			
			if (! gameOver)
				this.block.updatePosition();
			else
				this.gameOver();
		}
	},
	
	createBlock:function() {
		this.block = this.nextBlock ? this.nextBlock : TetrisBlock.randomBlock();
		this.block.x = Math.floor(COLS_COUNT / 2) - Math.floor(this.block.widthInUnits() / 2);
		this.block.y = ROWS_COUNT;
		
		for (var idx in this.block.units)
			this.blocksBatchNode.addChild(this.block.units[idx]);
		//this.nextBlock = TetrisBlock.randomBlock();
	},
	
	// try moving current block to coordinate
	// moved if successful (no overlap/boundary)
	// retained position otherwise
	tryMoveBlock:function(coordinate) {
		var x = coordinate.x;
		var y = coordinate.y;
		x = Math.max(x, 0);
		x = Math.min(x, COLS_COUNT - this.block.widthInUnits());
		y = Math.max(y, 0);
		y = Math.min(y, this.block.y);
		
		var oldX = this.block.x;
		var oldY = this.block.y;
		
		this.block.x = x;
		this.block.y = y;
		
		if (! this.checkBlockValidCoordinate()) {
			this.block.x = oldX;
			this.block.y = oldY;
		} else
			this.block.updatePosition();
	},
	
	checkBlockValidCoordinate:function() {
		var ok = true;
		var blockUnitsCoordinates = this.block.unitsWorldCoordinates();
		for (var i = 0; i < blockUnitsCoordinates.length; i++) {
			var coordinate = blockUnitsCoordinates[i];
			if (coordinate.x < 0 || coordinate.x >= COLS_COUNT || coordinate.y < 0 ||
				(coordinate.y < ROWS_COUNT && this.map[coordinate.y][coordinate.x])) {
					ok = false;
					break;
			}
		}	
		return ok;
	},
	
	levelUp:function() {
		
	},
	
	gameOver:function() {
		
	},
	
	ccTouchesEnded:function (touches, event) {
		//this.createBlock();
		//this.block.updatePosition();
    },
	
	keyUp:function(e) {
		console.log(e + " " + this.keypadsStates[e]);
		this.keypadsStates[e] = KeypadState.Released;
		
		if (e == cc.KEY.left)
			this.horizonalDirection = this.keypadsStates[cc.KEY.right] ? Direction.Right : Direction.NoDirection;
		else if (e == cc.KEY.right)
			this.horizonalDirection = this.keypadsStates[cc.KEY.left] ? Direction.Left : Direction.NoDirection;
	},
	
	keyDown:function(e) {
		console.log(e + " " + this.keypadsStates[e]);
		if (this.keypadsStates[e] == undefined ||
			this.keypadsStates[e] == KeypadState.Released)
				this.keypadsStates[e] = KeypadState.JustPressed;
		else
			this.keypadsStates[e] = KeypadState.Pressed;
		
		if (this.keypadsStates[e] == KeypadState.JustPressed) {
			if (e == cc.KEY.left)
				this.horizontalDirection = Direction.Left;
			else if (e == cc.KEY.right)
				this.horizontalDirection = Direction.Right;
				
			/* Temporary key event handling */
			if (e == cc.KEY.left)
				this.tryMoveBlock(new cc.Point(this.block.x - 1, this.block.y));
			else if (e == cc.KEY.right)
				this.tryMoveBlock(new cc.Point(this.block.x + 1, this.block.y));
			else if (e == cc.KEY.down)
				this.tryMoveBlock(new cc.Point(this.block.x, this.block.y - 1));
			
			else if (e == cc.KEY.space) {
				this.block.rotate();
				if (this.checkBlockValidCoordinate())
					this.block.updatePosition();
				else
					this.block.undoRotate();
			}
			
			this.block.updatePosition();
			/* End of temporary key event handling */
		}
	}
	
});

Tetris.scene = function () {
    // 'scene' is an autorelease object
    var scene = cc.Scene.create();

    // 'layer' is an autorelease object
    var layer = this.node();
    scene.addChild(layer);
    return scene;
};

Tetris.node = function () {
    var ret = new Tetris();

    // Init the Tetris display layer.
    if (ret && ret.init()) {
        return ret;
    }

    return null;
};

Object.freeze(Tetris.scene);
Object.freeze(Tetris.node);
