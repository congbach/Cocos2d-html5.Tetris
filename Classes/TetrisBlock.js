//  Created by Ken<congbach@congbach.com> on 22/6/12.

var BLOCK_UNITS			= 4;
var BLOCK_UNIT_WIDTH	= 32.0;
var BLOCK_UNIT_HEIGHT	= 32.0;
var COLOR_COLS_COUNT	= 2;

var TetrisBlock = cc.Layer.extend({
	shape			: UNINITIALIZED,
	orientation		: UNINITIALIZED,
	units			: [],
	unitsPosistions	: null, // optimized for calculcation like rotating
	unitsRect		: new cc.Rect(0, 0, 0, 0),
	x				: 0,
	y				: 0,
	
	ctor:function(shape) {
		this._super();
		
		this.shape = shape;
		this.orientation = TetrisBlock.Orientation.Default;
		var randomColor = Math.floor(Math.random() * TetrisBlock.Color.Size);
		for (var i = 0; i < BLOCK_UNITS; i++)
			this.units[i] = TetrisBlock.unitWithColor(randomColor);
		switch (shape) {
			case TetrisBlock.Shape.L:
				this.unitsPositions = [	[ 0, 1, 0 ],
										[ 0, 1, 0 ],
										[ 0, 1, 1 ] ];
				break;
			
			case TetrisBlock.Shape.ReverseL:
				this.unitsPositions = [	[ 0, 1, 0 ],
										[ 0, 1, 0 ],
										[ 1, 1, 0 ] ];
				break;
			
			case TetrisBlock.Shape.T:
				this.unitsPositions = [	[ 0, 0, 0 ],
										[ 1, 1, 1 ],
										[ 0, 1, 0 ] ];
				break;
			
			case TetrisBlock.Shape.Z:
				this.unitsPositions = [	[ 0, 0, 0 ],
										[ 1, 1, 0 ],
										[ 0, 1, 1 ] ];
				break;
			
			case TetrisBlock.Shape.ReverseZ:
				this.unitsPositions = [	[ 0, 0, 0 ],
										[ 0, 1, 1 ],
										[ 1, 1, 0 ] ];
				break;
			
			case TetrisBlock.Shape.Stick:
				this.unitsPositions = [	[ 0, 1, 0, 0 ],
										[ 0, 1, 0, 0 ],
										[ 0, 1, 0, 0 ],
										[ 0, 1, 0, 0 ] ];
				break;
			
			case TetrisBlock.Shape.Square:
				this.unitsPositions = [	[ 1, 1 ],
										[ 1, 1 ] ];
				break;
		}
		
		this.updateUnitsRect();
	},
	
	updatePosition:function() {
		var idx = 0;
	    var offsetX = this.unitsRect.origin.x, offsetY = this.unitsRect.origin.y;
		//console.log("offset:" + offsetX + " " + offsetY);
		//console.log("pos:" + this.x + " " + this.y);
	    for (var i = 0; i < this.unitsPositions.length; i++)
	    {
	        var row = this.unitsPositions[i];
	        for (var j = 0; j < row.length; j++)
	            if (row[j])
				{
					//console.log((this.x + j - offsetX + 0.5) * BLOCK_UNIT_WIDTH + " " + (this.y + this.unitsPositions.length  - 1 - i - offsetY + 0.5) * BLOCK_UNIT_HEIGHT);
					this.units[idx++].setPosition(new cc.Point((this.x + j - offsetX + 0.5) * BLOCK_UNIT_WIDTH,
															   (this.y + this.unitsPositions.length  - 1 - i - offsetY + 0.5) * BLOCK_UNIT_HEIGHT));
					//console.log(this.units[idx - 1].getPosition().x + " " + this.units[idx - 1].getPosition().y);
				}
					
	    }
	},
	
	updateUnitsRect:function() {
		var minX = INT_MAX, maxX = 0, minY = INT_MAX, maxY = 0;
		for (var i = 0; i < this.unitsPositions.length; i++) {
	        var row = this.unitsPositions[i];
	        for (var j = 0; j < row.length; j++)
	            if (row[j])
	            {
	                minX = Math.min(minX, j);
	                maxX = Math.max(maxX, j);
	                minY = Math.min(minY, i);
	                maxY = Math.max(maxY, i);
	            }
	    }
	    this.unitsRect = new cc.Rect(minX, this.unitsPositions.length - 1 - maxY, maxX - minX + 1, maxY - minY + 1);
	},
	
	rotate:function() {
		if (this.shape == TetrisBlock.Shape.Square)
			return;
		else if ((this.shape == TetrisBlock.Shape.Z && this.orientation == TetrisBlock.Orientation.Default) ||
				 (this.shape == TetrisBlock.Shape.Stick && this.orientation == TetrisBlock.Orientation.Left) ||
				 (this.shape == TetrisBlock.Shape.ReverseZ && this.orientation == TetrisBlock.Orientation.Left))
			this.rotateRight();
		else
			this.rotateLeft();
	},
	
	undoRotate:function() {
		if (this.shape == TetrisBlock.Shape.Square)
			return;
		else if ((this.shape == TetrisBlock.Shape.Z && this.orientation == TetrisBlock.Orientation.Right) ||
				 (this.shape == TetrisBlock.Shape.Stick && this.orientation == TetrisBlock.Orientation.Default) ||
				 (this.shape == TetrisBlock.Shape.ReverseZ && this.orientation == TetrisBlock.Orientation.Default))
			this.rotateLeft();
		else
			this.rotateRight();
	},
	
	rotateLeft:function() {
		if (this.shape == TetrisBlock.Shape.Square)
			return;
		
		// Special cases
		else if (this.orientation == TetrisBlock.Orientation.Default &&
				 this.shape == TetrisBlock.Shape.Z)
			return;
		
		else if (this.orientation == TetrisBlock.Orientation.Left &&
				 this.shape == TetrisBlock.Shape.ReverseZ)
			return;
		
		var orientationsOrder = [ 	TetrisBlock.Orientation.Default, TetrisBlock.Orientation.Left,
									TetrisBlock.Orientation.Reverse, TetrisBlock.Orientation.Right ];
		for (var i = 0; i < orientationsOrder.length; i++)
			if (this.orientation == orientationsOrder[i])
			{
				this.orientation = orientationsOrder[(i + 1) % orientationsOrder.length];
				break;
			}
		
		var rotatedUnitsPositions = [];
		var width = this.unitsPositions[0].length;
		var height = this.unitsPositions.length;
		
		for (var i = 0; i < width; i++) {
			rotatedUnitsPositions[i] = [];
			for (var j = 0; j < height; j++)
				rotatedUnitsPositions[i][j] = this.unitsPositions[j][width - 1 - i];
		}
		
		this.unitsPositions = rotatedUnitsPositions;
		
		this.x -= this.unitsRect.origin.x;
		this.y -= this.unitsRect.origin.y;
		this.updateUnitsRect();
		this.x += this.unitsRect.origin.x;
		this.y += this.unitsRect.origin.y;
	},
	
	rotateRight:function() {
		
		if (this.shape == TetrisBlock.Shape.Square)
			return;
		
		// Special cases
		else if (this.orientation == TetrisBlock.Orientation.Default &&
				 this.shape == TetrisBlock.Shape.ReverseZ)
			return;
		
		else if (this.orientation == TetrisBlock.Orientation.Left &&
				 this.shape == TetrisBlock.Shape.Z)
			return;
		
		var orientationsOrder = [ 	TetrisBlock.Orientation.Default, TetrisBlock.Orientation.Right,
									TetrisBlock.Orientation.Reverse, TetrisBlock.Orientation.Left ];
		for (var i = 0; i < orientationsOrder.length; i++)
			if (this.orientation == orientationsOrder[i])
			{
				this.orientation = orientationsOrder[(i + 1) % orientationsOrder.length];
				break;
			}
		
		var rotatedUnitsPositions = [];
		var width = this.unitsPositions[0].length;
		var height = this.unitsPositions.length;
		
		for (var i = 0; i < width; i++) {
			rotatedUnitsPositions[i] = [];
			for (var j = 0; j < height; j++)
				rotatedUnitsPositions[i][j] = this.unitsPositions[height - 1 - j][i];
		}
		
		this.unitsPositions = rotatedUnitsPositions;
		
		this.x -= this.unitsRect.origin.x;
		this.y -= this.unitsRect.origin.y;
		this.updateUnitsRect();
		this.x += this.unitsRect.origin.x;
		this.y += this.unitsRect.origin.y;
	},
	
	widthInUnits:function() {
		return Math.floor(this.unitsRect.size.width);
	},
	
	heightInUnits:function() {
		return Math.floor(this.unitsRect.size.height);
	},
	
	unitsWorldCoordinates:function() {
		var unitsWorldCoordinates = [];
		var offsetX = this.unitsRect.origin.x;
		var offsetY = this.unitsRect.origin.y;
		for (var i = 0; i < this.unitsPositions.length; i++)
			for (var j = 0; j < this.unitsPositions[i].length; j++)
				if (this.unitsPositions[i][j])
				unitsWorldCoordinates.push(new cc.Point(this.x + j - offsetX,
														this.y + this.unitsPositions.length - 1 - i - offsetY));
		return unitsWorldCoordinates;
	}
});

// need to look for a way for private static variable
TetrisBlock._blocksBatchNode = null;

TetrisBlock.blocksBatchNode = function() {
	if (! TetrisBlock._blocksBatchNode)
		TetrisBlock._blocksBatchNode = new cc.SpriteBatchNode("Resources/blocks.png");
	return TetrisBlock._blocksBatchNode;
};


TetrisBlock.unitWithColor = function(color) {
	var idx = color % COLOR_COLS_COUNT;
	var idy = Math.floor(color / COLOR_COLS_COUNT);
	return cc.Sprite.createWithTexture(TetrisBlock.blocksBatchNode().getTexture(),
									   new cc.Rect(idx * BLOCK_UNIT_WIDTH,
												   idy * BLOCK_UNIT_HEIGHT,
												   BLOCK_UNIT_WIDTH,
												   BLOCK_UNIT_HEIGHT));
};

TetrisBlock.randomBlock = function() {
	return new TetrisBlock(Math.floor(Math.random() * TetrisBlock.Shape.Size));
};

// Enumerations
TetrisBlock.Shape = { 	L			: 0,
					  	ReverseL	: 1,
					  	T			: 2,
						Stick		: 3,
						Square		: 4,
						Z			: 5,
						ReverseZ	: 6,
						Size		: 7 };
TetrisBlock.Color = {	Orange	: 0,
						Green	: 1,
						Yellow	: 2,
						Purple	: 3,
						Size	: 4 };
TetrisBlock.Orientation =  {	Default	: 0,
								Left	: 1,
								Right	: 2,
								Reverse	: 3,
								Size	: 4 };
Object.freeze(TetrisBlock.Shape);
Object.freeze(TetrisBlock.Color);
Object.freeze(TetrisBlock.Orientation);