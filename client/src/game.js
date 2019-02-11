console.warn("Defender Running ...");

    var Game = function(gameName, canvasId) {
        var canvas = document.getElementById(canvasId);
        console.log("gameName: ", gameName);

        var width = $(window).width();
        var height = $(window).height();

        console.log("width: ", width);
        console.log("height: ", height);

        canvas.width = width;
        canvas.height = height;

        this.screen = canvas.getContext('2d');
        this.gameSize = { x: canvas.width, y: canvas.height };
        var self = this;

        this. keyListeners = [];

        this.bulletCntr = 2;  
        this.score = 0;
        this.gun_Locked = false; 
        this.gameOver = false;
        this.paused = false;
        this.PAUSED_TIMEOUT = 100;
        this.HIGH_SCORES_SUFFIX = '_highScores';

        this.invaderFireRate = 0.995;
        this.level = 0;
        this.fleetPatrol_X = 0;
        this.levelData  = levelData;

        this.player = {};
        this.radar = false;

        this.imageLoadingProgressCallback = {};
        this.images = {};
        this.imageUrls = [];
        this.imagesLoaded = 0;
        this.imagesFailedToLoad = 0;
        this.imagesIndex = 0;
        
        // Image Methods
        this.getImage = getImage;
        this.imageLoadedCallback = imageLoadedCallback;
        this.imageLoadErrorCallback = imageLoadErrorCallback;
        this.loadImage = loadImage;
        this.loadImages = loadImages;
        this.queueImage = queueImage;

        // Load and Call images
        this.backgroundImg = {};
        this.explosionImages = [];
        this.togglePaused = togglePaused; // function
        this.keyboarder = new Keyboarder(this);

        // methods

        // loadSound("/sounds/click.wav", function(shootSound) {
        //     self.shootSound = shootSound;
        //     });

         // methods

         // Load our sounds here
         // Todo --- Put this into an obj to use as sound => url mapping
         loadSound("/sounds/rocket-ver-1.wav", function (shootSound) {
             self.shootSound = shootSound;
         });

         loadSound("/sounds/explosion-ver-3.wav", function (explosionSound) {
             self.explosionSound = explosionSound;
         });

         loadSound("/sounds/Alien_Gun-ver-1.wav", function (alienShootSound) {
             self.alienShootSound = alienShootSound;

         });

        self.animate = function(time) {

            // console.log("delta: ", time - self.lastTime);
            self.lastTime = time;

                if (this.gameOver){
                    // show Game Over Dialog Box Here!!
                    this.gameOver = false;
                    game.over();
                    console.log("gameOver: ************");
                 return;
                }

                if (self.paused){
                    setTimeout(function() {
                        requestAnimationFrame(self.animate);
                    }, this.PAUSED_TIMEOUT);
                } else { 
                    self.update(time);
                    self.draw(self.screen, self.gameSize);
                    self.drawScore();
                    requestAnimationFrame(self.animate);
                }
        };

        return this;
}; // end of Game constructor

Game.prototype = {

    start: function() {
        var self = this;
        this.loadLevel(this.level);
        this.animate();
    },
    reset: function() {
        this.bulletCntr = 2;  
        this.score = 0;
        this.gun_Locked = false; 
        this.gameOver = false;
        this.paused = false;
        this.invaderFireRate = 0.995;
        this.level = 0;
        this.radar = false;
        this.bulletCntr = 20;  
        this.gun_Locked = false; 
        this.gameOver = false;
        this.paused = false;
    },

    update: function(time) {
        var bodies = this.bodies;
        var tempBodies = bodies.slice(0);

        var invadersLeftAlive = [];

        var isCollingWithSomething = function(b1) {
            return tempBodies.filter(function(b2) { return colliding(b1, b2); }).length > 0; 
        };

        tempBodies = tempBodies.filter(isCollingWithSomething);

        tempBodies = tempBodies.filter(function(unknownBody) {
            return (unknownBody instanceof Invader) || (unknownBody instanceof Player);
        });

        for (var i = 0; i < tempBodies.length; i++) {
            if (tempBodies[i].name === "invader" || tempBodies[i].name === "player") {
                if (tempBodies[i].name === "invader" ) {
                    this.score += 100 * (this.getLevel() + 1);
                }
                // console.log("score: ", this.score);
                tempBodies[i].painter = new ExplosionSpritePainter(game.explosionImages);
                tempBodies[i].name = "explosion";

                try {
                    this.explosionSound.load();
                    this.explosionSound.play();
                } catch (error) {
                    console.log('Error with loading & playing sound: ', error); // pass exception object to error handler
                }

                tempBodies[i].size.x = tempBodies[i].size.x * 2.5;
                tempBodies[i].size.y = tempBodies[i].size.y * 2.5;
            }
        }

        var notCollingWithAnything = function(b1) {
            return bodies.filter(function(b2) { return colliding(b1, b2); }).length === 0; 
        };

        this.bodies = this.bodies.filter(notCollingWithAnything);

        // Are all Invaders are destroyed 
        invadersLeftAlive = this.bodies.filter(function(unknownBody) {
            return unknownBody instanceof Invader;
        });

        if (invadersLeftAlive.length < 5 && invadersLeftAlive.length >= 3){
            this.invaderFireRate = 0.98;
            this.radar = true;
        } else  if (invadersLeftAlive.length < 3 && invadersLeftAlive.length >= 2){
            this.invaderFireRate = 0.96;
            // this.radar = true;
        } else if (invadersLeftAlive.length < 2) {
            this.invaderFireRate = 0.92;
            // this.radar = true;
        }

        // Add bodies back with explosion
       if (tempBodies.length > 0) {     
            for (var j = 0; j < tempBodies.length; j++) {
                this.bodies.push(tempBodies[j]);
            }
        }

        // Remove all bodies that are not visible on the screen 
        this.bodies = this.bodies.filter(function(theBody) {
            return theBody.visible;
        }); 

        this.bodies = this.bodies.filter(function(theBody) {
             return theBody.remove === false;
        }); 

        var isPlayerAlive = this.bodies.filter(function(unknownBody) {
            return unknownBody instanceof Player;
        });

        // this.drawScore();

        if (isPlayerAlive.length < 1) {
            //delay game over to let animation finish
            setTimeout(function() {
                this.gameOver = true;
            }, 750);
        }

        if (invadersLeftAlive.length <= 0 && isPlayerAlive.length === 1) {
            this.paused = true;     
            this.incrementLevel();
            setTimeout(function() {
                this.game.loadLevel();
            }, 1250);
        }

        // Update Position
        for (var idx = 0; idx < this.bodies.length; idx++) {
            this.bodies[idx].update(time);
        }
    },

    draw: function(screen, gameSize) {
        screen.clearRect(0, 0, gameSize.x, gameSize.y);
        screen.drawImage(this.backgroundImg, 0, 0, gameSize.x, gameSize.y);
        
        for (var i = 0; i < this.bodies.length; i++) {
            this.bodies[i].draw(this.screen, this.bodies[i]);
        }
    },

    loadLevel: function() {
        console.log(" \n *** Loading level Number " + this.level + " ***");
        var level = this.getLevel();
        var level_data = this.levelData[level];
        var row = level_data.row;
        var col = level_data.col;
        var behavior = level_data.behavior;
        var invaderImage = level_data.invaderImage;

        this.radar = false;

        this.player  = new Player(this, [ new CycleImages(16, 32) ], 
            new SpritePainter([game.playerImg]), this.gameSize);

        this.speedX_Val = level_data.speedX;
        this.invaderFireRate = level_data.invaderFireRate;
        this.backgroundImg = level_data.backgroundImg;

        this.bodies = createInvaders(this, this.gameSize, behavior, invaderImage, 
        row, col).concat(this.player);
        
        this.paused = false;
    },

    getLevel: function() {
        return this.level;
    },

    incrementLevel: function() {        
        this.level++;
        if (this.level > this.levelData.length - 1){
            this.level = 0;
        }
        return this.level;
    },

    addKeyListener: function(keyAndListener) {
        game.keyListeners.push(keyAndListener);
    },

    findKeyListener: function(key) {
        var listener;

        game.keyListeners.forEach(function(keyAndListener) {
            var currentKey = keyAndListener.key;
            if (currentKey === key) {
                listener = keyAndListener.listener;
            }
        });
        return listener;
    },

    keyPressed: function(e) {
        var listener;
        key = undefined;

        switch (e.keyCode) {
            case 80: key = 'p';         break;
        }

        listener = game.findKeyListener(key);
        if (listener) {
            listener();
        }
    },

    keyUp: function(e) {
        var listener;
        key = undefined;

        switch (e.keyCode) {
            case 32: key = 'spacebar';      break;
            case 37: key = 'left arrow';    break;
            case 39: key = 'right arrow';   break;
            case 38: key = 'up arrow';      break;
            case 40: key = 'down arrow';    break;
        }

        listener = game.findKeyListener(key);
        if (listener) {
            listener();
        }
    },

    addBody: function(body) {
        this.bodies.push(body);
    },

    invadersBelow: function(invader) {
        return this.bodies.filter(function(b) {
            return b instanceof Invader &&
                b.center.y > invader.center.y &&
                b.center.x - invader.center.x < invader.size.x;
        }).length > 0;
    },

    getHighScores: function() {
        var key = game.gameName + game.HIGH_SCORES_SUFFIX,
        highScoresString = localStorage[key];
        if (highScoresString === undefined) {
            localStorage[key] = JSON.stringify([]);
        }
        return JSON.parse(localStorage[key]);
    },

    setHighScore: function() {
        var key = gameName + game.HIGH_SCORES_SUFFIX,
        highScoresString = localStorage;

        highScores.unshift(highScore);
        localStorage[key] = JSON.stringify(highScores);
    },

    clearHighScores: function() {
        localStorage[game.gameName + this.HIGH_SCORES_SUFFIX] = JSON.stringify([]);
    },

    over: function() {
        console.log('inside over function');


        var highScore = 0,
        // highScores = this.getHighScores();
        highScores = [{score: 100}, {score: 75} , {score: 50}];

        var lastOnList = $('#highScoreList li').last().text(); 
        console.log('lastOnList: ', lastOnList);

        if (highScores.length === 0 || game.score > highScores[0].score) {
            // this.showHighScores();
            console.log('Insert highScoreToast');
            game.highScoreToast.insertAfter('canvas');
            game.highScoreToast.show(); 
            $('#highScoreParagraph').html(game.score);

        } else {
            // $('#gameOverToast').show();
            console.log('Insert gameOverToast');
            game.gameOverToast.insertAfter('canvas');
            game.gameOverToast.show();
            $('#highScoreParagraph').html(game.score);
        }

        $('#inputScore').val(game.score);

        // this.gameOver = true;
        // this.lastScore = this.score;
        // this.score = 0;
    },
    // High Scores ............................................................
    showHighScores: function() {
        $("#highScoreParagraph").show();
        $("#highScoreParagraph").text(this.score);
        $("#highScoreToast").text(this.score);
        this.updateHighScoreList();
    },
    updateHighScoreList: function() {
        var el,
            highScores = game.getHighScores(),
            length = highScores.length,
            highScore,
            listParent = highScoreList.parentNode;  

    },
    drawScore: function() {
        var text = 'SCORE: ' + this.score;
        this.screen.fillText(text, this.gameSize.x * 0.075, this.gameSize.y * 0.050);
        this.screen.fillStyle = 'white';
        var fontHeight = this.gameSize.y * 0.0375;
        // var fontHeight = 24;
        this.screen.font = fontHeight + "px Helvetica";
        this.screen.textAlign = 'left';
        this.screen.textBaseline = 'top';
    }

}; // end Game.prototype


var imageLoadedCallback =  function(e) {
        this.imagesLoaded++;
    };

var imageLoadErrorCallback = function(e){
        this.imagesFailedToLoad++;
    };

var loadImage = function(imageUrl) {
        var image = new Image();
        var self = this;

        image.src = imageUrl;

        image.addEventListener('load', function(e) {
            self.imageLoadedCallback(e);
        });
        
        image.addEventListener('error', function(e) {
            self.imageLoadErrorCallback(e);
        });

        this.images[imageUrl] = image;      
    };

var loadImages = function() {
        if (this.imagesIndex < this.imageUrls.length){
            this.loadImage(this.imageUrls[this.imagesIndex]);
            this.imagesIndex++;
        }

        return ((this.imagesLoaded + this.imagesFailedToLoad) / 
            this.imageUrls.length) * 100;
    };

    // Call to add image to queue
var queueImage = function(imageUrl) {
        this.imageUrls.push(imageUrl);
    };

var getImage = function(imageUrl) {
        return  this.images[imageUrl];
    };
    
var Player = function(game, behavior, painter, gameSize) {
    this.name = "player";
    this.gameSize = gameSize;
    this.behavior = behavior;
    this.painter = painter;
    this.game = game;
    this.step_X = 4;
    this.step_Y = 4;
    this.dx = this.dy = 1.015;
    this.animating = false;
    this.remove = false; 
    this.visible = true;
    this.radar = false;
    this.size = getSpriteSize('player', this.gameSize);
    this.center = { x: gameSize.x / 2, y: gameSize.y - 1.0 * this.size.y };

};

Player.prototype = {
    update: function(time) {

        //Loop through all behaviors
        for (var i = 0; i < this.behavior.length; i++) {
            this.behavior[i].execute(this, this.gameSize, time);
        }

        if (this.game.keyboarder.isDown(this.game.keyboarder.KEYS.LEFT)) {
            this.step_X *= this.dx;
            this.step_X = this.step_X > 8 ? 8 : this.step_X;
            this.center.x = this.center.x < (0 - this.size.x / 2) ? this.game.gameSize.x : this.center.x;
            this.center.x -= this.step_X;
        }
        if (this.game.keyboarder.isDown(this.game.keyboarder.KEYS.RIGHT)) {
            this.step_X *= this.dx;
            this.step_X = this.step_X > 8 ? 8 : this.step_X;
            this.center.x = this.center.x > (this.game.gameSize.x + this.size.x / 2) ? 0 : this.center.x;
            this.center.x += this.step_X;
        }
        if (this.game.keyboarder.isDown(this.game.keyboarder.KEYS.UP)) {
            this.step_Y *= this.dy;
            this.step_Y = this.step_Y > 8 ? 8 : this.step_Y;
            this.center.y = this.center.y > (this.game.gameSize.y + this.size.y / 2) ? 0 : this.center.y;
            this.center.y += this.step_Y;
        }
        if (this.game.keyboarder.isDown(this.game.keyboarder.KEYS.DOWN)) {
            this.step_Y *= this.dy; 
            this.step_Y = this.step_Y > 8 ? 8 : this.step_Y;
            this.center.y = this.center.y < (0 - this.size.y / 2) ? this.game.gameSize.y : this.center.y;
            this.center.y -= this.step_Y;
        } 
        if (this.game.keyboarder.isDown(this.game.keyboarder.KEYS.SPACE) && 
            !this.game.gun_Locked) {
            this.game.bulletCntr--;
            this.game.gun_Locked = this.game.bulletCntr <= 0 ? true : false;

            var missle = new Missle({ x: this.center.x, y: this.center.y - 
                this.size.y / 2}, { x: 0, y: -this.gameSize.y * 0.0150 }, 
                this.gameSize);
            this.game.score -= 5;
            this.game.addBody(missle);


            try {
                this.game.shootSound.load();
                this.game.shootSound.play();
            } 
            catch(error) {
                console.log('Error loading sound: ', error);
            }
        }
    },
    draw: function(screen, body) {
        this.painter.draw(screen, body);
        }   
};

var Invader = function(game, center, behavior, painter, gameSize) {
    this.name = "invader";
    this.game = game;
    this.gameSize = gameSize;
    this.behavior = behavior;
    this.painter = painter;

    this.visible = true;
    this.animating = false;
    this.remove = false;
    // this.game.radar = false;
    
    this.size = getSpriteSize('invader', this.gameSize);

    this.center = center;
    this.radians = 0.025;
    this.totalRadians = 0;
    this.scaleHeight = 1.5;
    this.patrolX = 0;

    this.speedX = gameSize.x * this.game.speedX_Val; 
};

Invader.prototype = {
    update: function(time) {

        var targetLocation = {};

        for (var i = 0; i < this.behavior.length; i++) {
            this.behavior[i].execute(this, this.gameSize, time);
        }

        this.visible = this.center.y > this.gameSize.y * 1.10 ? false : true;

        if (Math.random() > this.game.invaderFireRate && 
            !this.game.invadersBelow(this)) {


            if (this.game.radar === true) {
                targetLocation = radarGuidance(this.game.player, 
                    this, this.gameSize.y * 0.0075);
            } else {
                targetLocation = { x: 0, y: this.gameSize.y * 0.0075 };
            }

            var bullet = new Bullet({ x: this.center.x, y: this.center.y + 
                this.size.x / 2}, targetLocation, 
                this.gameSize);
            this.game.addBody(bullet);

            try {
                this.game.alienShootSound.load();
                this.game.alienShootSound.play();
            } catch (error) {
                console.log('Error adding alienShootSound: ', error);
            }
        }
    },
    draw: function(screen, body) {
        this.painter.draw(screen, body);
    }   
};

var createInvaders = function(game, gameSize, behavior, invaderImage, row, col) {
    this.game = game;
    var invaders = [],
        fleetWidth = 0,
        size = {};

    size = getSpriteSize('invader', gameSize);
    fleetWidth = 2 * col * size.x;

    this.game.fleetPatrol_X = ((gameSize.x - fleetWidth) / 2);

    // console.log("this.game.fleetPatrol_X: ",this.game.fleetPatrol_X);

    for (var i = 0; i < (row * col); i++) {

        var x = (this.game.fleetPatrol_X) + (i % col) * (gameSize.x * 0.075);
        var y = (gameSize.y * 0.075) + (i % row) * (gameSize.y * 0.075);

        invaders.push(new Invader(game, { x: x, y: y }, [behavior, 
            new CycleImages(16, 32)], new SpritePainter([invaderImage]), gameSize));
    }

    return invaders;
};

var getSpriteSize = function(spriteName, gameSize){
    var size = {};

    if (spriteName === 'player') {
        if (gameSize.x > 1400) {
            size = { x: gameSize.x * 0.050, y: gameSize.x * 0.0750 }; 
        } else if (gameSize.x > 1024) {
            size = { x: gameSize.x * 0.060, y: gameSize.x * 0.090 }; 
        } else if (gameSize.x > 768){
            size = { x: gameSize.x * 0.075, y: gameSize.x * 0.1125 }; 
        } else if (gameSize.x > 401) {
            size = { x: gameSize.x * 0.100, y: gameSize.x * 0.150 };
        }
        else {
            size = { x: 20, y: 20 }; // x: 15, y: 15
        }
    } else if (spriteName === 'invader') {
        if (gameSize.x > 1400) {
            size = { x: gameSize.x * 0.0325, y: gameSize.x * 0.0325 }; 
        } else if (gameSize.x > 1024) {
            size = { x: gameSize.x * 0.0375, y: gameSize.x * 0.0375 }; 
        } else if (gameSize.x > 768){
            size = { x: gameSize.x * 0.0425, y: gameSize.x * 0.0425 }; 
        } else if (gameSize.x > 401) {
            size = { x: gameSize.x * 0.0525, y: gameSize.x * 0.0525 };
        }
        else {
            size = { x: 20, y: 20 }; // x: 15, y: 15
        }
    } else if (spriteName === 'missle') {

        if (gameSize.x > 1024) {
            size = { x: 15, y: 25 }; 
        } else if (gameSize.x > 768){
            size = { x: 10, y: 16 }; 
        } else if (gameSize.x > 401) {
            size = { x: 6, y: 10 };
        }
        else {
            size = { x: 4, y: 7 }; // x: 15, y: 15
        }
    }else if (spriteName === 'bullet') {

        if (gameSize.x > 1024) {
            size = { x: 15, y: 15 }; 
        } else if (gameSize.x > 768){
            size = { x: 12, y: 12 }; 
        } else if (gameSize.x > 401) {
            size = { x: 8, y: 8 };
        }
        else {
            size = { x: 4, y: 4 }; // x: 15, y: 15
        }
    }
    return size;
};

// Movements the aliens take
var rightToLeft = {

    execute: function(body, gameSize) {

        if (body.patrolX < -body.game.fleetPatrol_X || body.patrolX > (body.game.fleetPatrol_X)) {
            body.speedX = -body.speedX;
            // Drops down after every patrol
            body.center.y += body.size.y * 2.5;
            // body.speedX += body.speedX;
        }
        body.center.x += body.speedX;
        body.patrolX += body.speedX;

    }
};

// Aliens will follow a  sinewave or snake patternp  
var sineWave = {

    execute: function(body, gameSize) {
        // console.log("In sineWave execute's this: %j", body)

        if (body.patrolX < -body.game.fleetPatrol_X || body.patrolX > (body.game.fleetPatrol_X)) {
            body.speedX = -body.speedX;
            body.radians = -body.radians;

            // Drops down after every patrol
            body.center.y += body.size.y;
            // body.speedX += body.speedX;
        }

        body.totalRadians += body.radians;
        body.center.x += body.speedX;
        body.patrolX += body.speedX;
        body.center.y += body.scaleHeight * Math.sin(body.totalRadians);

    }
};

var halfCircle = {

    execute: function(body, gameSize) {

        if (body.patrolX < -body.game.fleetPatrol_X || body.patrolX > (body.game.fleetPatrol_X)) {
            body.speedX = -body.speedX;
            // body.radians = -body.radians;

            // Drops down after every patrol
            body.center.y += body.size.y;
        }

        body.totalRadians += body.radians * 0.5;
        body.center.x += body.speedX;
        body.patrolX += body.speedX;
        body.center.y += body.scaleHeight * Math.sin(body.totalRadians);

    }
};

var dropDiagnal = {

    execute: function(body, gameSize) {

        if (body.patrolX < -body.game.fleetPatrol_X || body.patrolX > (body.game.fleetPatrol_X)) {
            body.speedX = -body.speedX;
            // body.radians = -body.radians;

            // Drops down after every patrol
            body.center.y += body.size.y;
        }
        
        body.center.x += (body.speedX );
        body.patrolX += (body.speedX);
        body.center.y += (body.speedX * 0.5);
        
    }
};

var Bullet = function(center, velocity, gameSize) {
    this.gameSize = gameSize;
    this.center = center;
    this.velocity = velocity;
    this.visible = true;
    this.remove = false;
    this.size = getSpriteSize('bullet', gameSize);
};

Bullet.prototype = {
    update: function() {
        this.center.x += this.velocity.x;
        this.center.y += this.velocity.y; 

        // If the bullet moves off the board
        // set to visible = false
        if (this.center.y <  0 - (this.gameSize.y * 0.10)   || 
            this.center.y > this.gameSize.y * 1.10          ||
            this.center.x < 0 - (this.gameSize.x * 0.10)    ||
            this.center.x > this.gameSize.x * 1.10) {

            this.visible = false;
        }
    }, 
    draw: function(screen, body) {
        screen.drawImage(game.enemy_bulletImg, body.center.x - body.size.x / 2, 
            body.center.y - body.size.y / 2 , body.size.x, body.size.y);
    }
};

var Missle = function(center, velocity, gameSize) {
    this.gameSize = gameSize;
    // this.size = { x: 15, y: 25 };
    this.size = getSpriteSize('missle', gameSize);
    this.center = center;
    this.velocity = velocity;
    this.visible = true;
    this.remove = false;
};

Missle.prototype = {
    update: function() {
        this.center.x += this.velocity.x;
        this.center.y += this.velocity.y; 

        // If the Missle moves off the board
        // set visible to fasle
        if (this.center.y <  0 - (this.gameSize.y * 0.10)   || 
            this.center.y > this.gameSize.y * 1.10          ||
            this.center.x < 0 - (this.gameSize.x * 0.10)    ||
            this.center.x > this.gameSize.x * 1.10) {

            this.visible = false;
        }
    }, 
    draw: function(screen, body) {
        screen.drawImage(game.missleImg, body.center.x - body.size.x / 2, 
            body.center.y - body.size.y / 2 , body.size.x, body.size.y);
    }
};

var Keyboarder = function(game) {
        var keyState = {};

        window.onkeydown = function(e){
            keyState[e.keyCode] = true;

            game.keyPressed(e);
        };

        window.onkeyup = function(e){
            keyState[e.keyCode] = false;
            game.keyUp(e);
        };


        this.isDown = function(keyCode) {
            return keyState[keyCode] === true;
        };

        this.KEYS = { LEFT: 37, RIGHT: 39, UP: 40, DOWN: 38, SPACE: 32, P: 80 };
};

// Detect collisions
var colliding = function(b1, b2) {
    return !(b1 === b2 ||
        (b1 instanceof Player && b2 instanceof Missle)  ||
        (b1 instanceof Missle && b2 instanceof Player)  ||
        (b1 instanceof Bullet && b2 instanceof Bullet)  ||
        (b1 instanceof Missle && b2 instanceof Missle)  ||
        (b1 instanceof Invader && b2 instanceof Invader)||
        (b1 instanceof Bullet && b2 instanceof Missle)  ||
        (b1 instanceof Missle && b2 instanceof Bullet)  ||
        (b1 instanceof Invader && b2 instanceof Bullet) ||
        (b1 instanceof Bullet && b2 instanceof Invader) ||
        b1.center.x + b1.size.x / 2 < b2.center.x - b2.size.x / 2 ||
        b1.center.y + b1.size.y / 2 < b2.center.y - b2.size.y / 2 ||
        b1.center.x - b1.size.x / 2 > b2.center.x + b2.size.x / 2 ||
        b1.center.y - b1.size.y / 2 > b2.center.y + b2.size.y / 2);
};

var togglePaused = function() {
    console.log('togglePaused: ', game.pausedToast);
    if (!this.paused) {
        game.pausedToast.insertAfter('canvas');
        game.pausedToast.show();        
    } else {
        $('#pausedToast').detach();
    }
        this.paused = !this.paused;
    };

var loadSound = function(url, callback) {
    var loaded = function() {
        callback(sound);
        sound.removeEventListener('canplaythrough', loaded);
    };

var sound = new Audio(url);
    sound.addEventListener('canplaythrough', loaded);
    sound.load();
};

var SpritePainter = function(images) {
    this.images = images;
    this.imagesIndex = 0;
};

var radarGuidance = function(shooter, target, velocity) {
    var rev = -1,
        dx = shooter.center.x - target.center.x,
        dy = shooter.center.y - target.center.y,
        theta = Math.atan(dy / dx);

    if (target.center.x < shooter.center.x && target.center.y > shooter.center.y) 
        rev = 1;
    else if (target.center.x < shooter.center.x && target.center.y < 
        shooter.center.y) rev = 1;

    var velocity_Dx = rev * velocity * Math.cos(theta),
        velocity_Dy = rev * velocity * Math.sin(theta);

    return {x: velocity_Dx, y: velocity_Dy};
};

SpritePainter.prototype = {
    advance: function(body) {
        if (this.imagesIndex === this.images.length - 1) {
            this.imagesIndex = 0;
        } else {
            this.imagesIndex++;
        }
    },
    draw: function(screen, body) {
        var spriteImage = this.images[this.imagesIndex];

        screen.drawImage(spriteImage, body.center.x - body.size.x / 2,
        body.center.y - body.size.y / 2, body.size.x, body.size.y);
    }
};

var ExplosionSpritePainter = function(images) {
    this.images = images;
    this.imagesIndex = 0;
};

ExplosionSpritePainter.prototype = {
    advance: function(body) {
        if (this.imagesIndex === this.images.length -1) {
            // this.imagesIndex = 0;
            body.remove = true;
            body.visible = false;
            body.animating = false;
        } else {
            this.imagesIndex++;
        }
    },
    draw: function(screen, body) {
        var spriteImage = this.images[this.imagesIndex];
        body.animating = true;

        try {
            screen.drawImage(spriteImage, body.center.x - body.size.x / 2,
            body.center.y - body.size.y / 2, body.size.x, body.size.y);
        }
        catch (e) {
           // statements to handle any exceptions
           // console.log(e); // pass exception object to error handler
        }

    }
};

var CycleImages = function(frameCnt, PAGE_FLIP_INTERVAL) {
    this.frameCounter = 0;
    this.frameCnt = frameCnt;
    this.lastAdvance = 0;
    this.PAGE_FLIP_INTERVAL = PAGE_FLIP_INTERVAL;
};

CycleImages.prototype = {

    execute: function(body, gameSize, time) {
        if (time - this.lastAdvance > this.PAGE_FLIP_INTERVAL) {
            body.painter.advance(body);
            this.lastAdvance = time;
        }
    }
};


// We store level data here in an object
var levelData = [
    {   speedX: 0.0020,
        behavior: sineWave,
        invaderImage: {}, 
        row: 2,
        col: 7,
        backgroundImg: {},
        invaderFireRate: 0.995,
        invaderHits: 1
    },
    {   speedX: 0.0020,
        behavior: halfCircle,
        invaderImage: {}, 
        row: 3,
        col: 7,
        backgroundImg: {},
        invaderFireRate: 0.995,
        invaderHits: 1
    },
    {   speedX: 0.0022,
        behavior: rightToLeft,
        invaderImage: {}, 
        row: 4,
        col: 7,
        backgroundImg: {},
        invaderFireRate: 0.994,
        invaderHits: 1
    },
    {   speedX: 0.00225,
        behavior: dropDiagnal,
        invaderImage: {}, 
        row: 5,
        col: 7,
        backgroundImg: {},
        invaderFireRate: 0.994,
        invaderHits: 1
    },
];

// We create a new game here
var game = new Game("Defender", "screen");

game.addKeyListener({ key: 'p', listener: function() {
        game.togglePaused();
        }
    });

game.addKeyListener({ key: 'spacebar',  listener: function() {
            // reset counter for bullets
            // When spacebar comes up
            // keyUp() uses this function
            setTimeout(function() {
                game.gun_Locked = false;
            }, 200);

            if (self.gameOver) {
                window.location.reload();
            }
            if (game.paused && !self.gameOver) {
                console.log('togglePaused: ', game.paused)
                game.togglePaused();
            }

        }
    });

// Reset these when the arrow keys come UP
game.addKeyListener({ key: 'left arrow',  listener: function() {
            game.player.step_X = 4;
        }
    });

game.addKeyListener({ key: 'right arrow',  listener: function() {
            game.player.step_X = 4;
        }
    });
game.addKeyListener({ key: 'up arrow',  listener: function() {
            game.player.step_Y = 4;
        }
    });

game.addKeyListener({ key: 'down arrow',  listener: function() {
            game.player.step_Y = 4;
        }
    });

$('#pausedToast').on('click', function(e){
    console.log('pausedToast')
    game.togglePaused();
});


$('.newGameButton').on('click', function(e){
    // console.log('game.start();');
    // Get the reset() working later
    // game.reset();
    // game.start();
    // window.location.reload();
    window.location.href = window.location.origin;
});

$(window).on('blur', function() {
    if (!game.gameOver && !game.paused) {
        game.togglePaused();
    }
});

$(window).on('focus', function() {
    if (game.paused) {
        game.togglePaused();
    }
});

$('.closeHighScoreToast').on('click', function () {
    window.location.reload();
});
    
    // Queue Images here

    // Level Background Images
    game.queueImage("/images/Space_1_slice.jpg");
    game.queueImage("/images/Milky_Way.jpg");
    game.queueImage("/images/Galaxy.jpg");
    game.queueImage("/images/Space_1.jpg");
    // game.queueImage("/images/");

    game.queueImage("/images/Starships/starships_0007_Ex-ving.png");
    game.queueImage("/images/missle.png");
    //  Queue Alien ships
    game.queueImage("/images/Starships/starships_0006_Bow-fighter_Rev.png");
    game.queueImage("/images/Starships/starships_0004_Ice-Speedster_Rev.png");
    game.queueImage("/images/Starships/starships_0005_Centenial-Hawk_Rev.png");
    game.queueImage("/images/Starships/starships_0001_Sun-killer_Rev.png");
    game.queueImage("/images/enemy-bullet.png");

    // Explosion Images
    game.queueImage("/images/img/explode_1.png");
    game.queueImage("/images/img/explode_2.png");
    game.queueImage("/images/img/explode_3.png");
    game.queueImage("/images/img/explode_4.png");
    game.queueImage("/images/img/explode_5.png");
    game.queueImage("/images/img/explode_6.png");
    game.queueImage("/images/img/explode_7.png");
    game.queueImage("/images/img/explode_8.png");
    game.queueImage("/images/img/explode_9.png");
    game.queueImage("/images/img/explode_10.png");
    game.queueImage("/images/img/explode_11.png");
    game.queueImage("/images/img/explode_12.png");
    game.queueImage("/images/img/explode_13.png");
    game.queueImage("/images/img/explode_14.png");
    game.queueImage("/images/img/explode_15.png");
    game.queueImage("/images/img/explode_16.png");
    

    /////////////////////////////////////////////
    interval = setInterval(function() {

        var loadingPercentComplete = game.loadImages();
        // console.log('loading Percentage Completed: ', loadingPercentComplete);

        if (loadingPercentComplete === 100) {
            console.log("loading ... 100% Complete: OK!!!");
            clearInterval(interval);
        }


            // We MUST Load Images here 
            game.backgroundImg = game.getImage("/images/Space_1_slice.jpg");
            game.playerImg = game.getImage("/images/Starships/starships_0007_Ex-ving.png");
            game.missleImg = game.getImage("/images/missle.png");
            game.enemy_bulletImg = game.getImage("/images/enemy-bullet.png");

            // Load Alien ships into level obj's
            game.levelData[0].invaderImage = game.getImage("/images/Starships/starships_0006_Bow-fighter_Rev.png");
            game.levelData[1].invaderImage = game.getImage("/images/Starships/starships_0004_Ice-Speedster_Rev.png");
            game.levelData[2].invaderImage = game.getImage("/images/Starships/starships_0005_Centenial-Hawk_Rev.png");
            game.levelData[3].invaderImage = game.getImage("/images/Starships/starships_0001_Sun-killer_Rev.png");


            game.levelData[0].backgroundImg = game.getImage("/images/Space_1_slice.jpg");
            game.levelData[1].backgroundImg = game.getImage("/images/Milky_Way.jpg");
            game.levelData[2].backgroundImg = game.getImage("/images/Galaxy.jpg");
            game.levelData[3].backgroundImg = game.getImage("/images/Space_1.jpg");

            //Load Explosion Images
            game.tmp1 = game.getImage("/images/img/explode_1.png");
            game.tmp2 = game.getImage("/images/img/explode_2.png");
            game.tmp3 = game.getImage("/images/img/explode_3.png");
            game.tmp4 = game.getImage("/images/img/explode_4.png");
            game.tmp5 = game.getImage("/images/img/explode_5.png");
            game.tmp6 = game.getImage("/images/img/explode_6.png");
            game.tmp7 = game.getImage("/images/img/explode_7.png");
            game.tmp8 = game.getImage("/images/img/explode_8.png");
            game.tmp9 = game.getImage("/images/img/explode_9.png");
            game.tmp10 = game.getImage("/images/img/explode_10.png");
            game.tmp11 = game.getImage("/images/img/explode_11.png");
            game.tmp12 = game.getImage("/images/img/explode_12.png");
            game.tmp13 = game.getImage("/images/img/explode_13.png");
            game.tmp14 = game.getImage("/images/img/explode_14.png");
            game.tmp15 = game.getImage("/images/img/explode_15.png");
            game.tmp16 = game.getImage("/images/img/explode_16.png");

    }, 16);
    /////////////////////////////////////////////////
// var loadToastTitle = document.getElementById("loadToastTitle");

// Hide Canvas
$('#screen').hide();


// click to start game
$('#loadButton').on('click', function(e){

/* Hide HTML using CSS
 * Classes are used for speed
 * to reduce page flicker 
 * jQuery for convenience */ 
$('#pausedToast').removeClass('hide');
$('#scoreToast').removeClass('hide');
$('#progressbar').removeClass('hide');
$('#gameOverToast').removeClass('hide');
$('#highScoreToast').removeClass('hide');

// detach but save HTML snippet
game.loadingToast = $('#loadingToast').detach();
game.pausedToast = $('#pausedToast').detach();
game.progressbar = $('#progressbar').detach();
game.gameOverToast = $('#gameOverToast').detach();
game.highScoreToast = $('#highScoreToast').detach();


$('#screen').show();
// loadToastTitle.style.display = "none";
// $('loadToastTitle').hide()

    // $('#loadToastTitle').css("display", "none");


    game.explosionImages.push( game.tmp1, game.tmp2, game.tmp3, game.tmp4,

    game.tmp5, game.tmp6, game.tmp7, game.tmp8, game.tmp9, game.tmp10,
    game.tmp11, game.tmp12,game.tmp13, game.tmp14, game.tmp15, game.tmp16 );
            
    // game.loadLevel(0);
    e.preventDefault();
    // Delay game to make sure all assets have loaded
    setTimeout(function(){
        game.start();
    }, 250)
});

var gScore = game.score;









