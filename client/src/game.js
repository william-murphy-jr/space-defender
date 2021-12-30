// space_defender.js

// TODO: Break into Modules
// TODO Fix Audio Play Error
// See https://developers.google.com/web/updates/2017/06/play-request-was-interrupted

console.warn("Defender Running ...");

    const Game = function(gameName, canvasId) {
        const  canvas = document.getElementById(canvasId);
        console.log("gameName: ", gameName);

        const  width = $(window).width();
        const  height = $(window).height();

        console.log("width: ", width);
        console.log("height: ", height);

        canvas.width = width;
        canvas.height = height;

        this.screen = canvas.getContext('2d');
        this.gameSize = { x: canvas.width, y: canvas.height };
        const  self = this;

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
        this.playerLivesLeft = 3;
        this.playerStatus = 'ALIVE';  // ALIVE | DEAD
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

        // Todo --- Put this into an obj to use as sound => url mapping
        // Load our sounds here
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
                    console.log("***** gameOver: *****");
                 return;
                }

                if (self.paused){
                    setTimeout(function() {
                        requestAnimationFrame(self.animate);
                    }, this.PAUSED_TIMEOUT);
                } else { 
                    self.update(time);
                    self.draw(self.screen, self.gameSize);
                    self.drawScoreBox();
                    self.drawLivesLeftBox();
                    requestAnimationFrame(self.animate);
                }
        };

        return this;
}; // end of Game constructor

Game.prototype = {

    start: function() {
        const  self = this;
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
        const bodies = this.bodies;
        const tempBodies = [...bodies];

       const isCollidingWithSomething = function(b1) {
            return tempBodies.filter(function(b2) { return colliding(b1, b2); }).length > 0; 
        };

        const filteredBodies = tempBodies.filter(isCollidingWithSomething);
        const invaderFilteredBodies = [];
        const playerFilteredBodies = [];

        // Filter for both using 'for loop'
        // This is much faster than the slower array filter method
        for (let i = 0; i < filteredBodies.length; i++) {
            const unknownFilteredBody = filteredBodies[i];

            if (unknownFilteredBody instanceof Invader) {
                invaderFilteredBodies.push(unknownFilteredBody)
            }

            if (unknownFilteredBody instanceof Player) {
                playerFilteredBodies.push(unknownFilteredBody)
            }
        }

        for (let i = 0; i < invaderFilteredBodies.length; i++) {
            if (invaderFilteredBodies[i].name === "invader") {
                this.score += 100 * (this.getLevel() + 1);

                invaderFilteredBodies[i].painter = new ExplosionSpritePainter(game.explosionImages, 'Invader');
                invaderFilteredBodies[i].name = "explosion";
                
                try {
                    this.explosionSound.load();
                    this.explosionSound.play();
                } catch (error) {
                    console.error('Error with loading & playing sound: ', error); // pass exception object to error handler
                }
                
                invaderFilteredBodies[i].size.x = invaderFilteredBodies[i].size.x * 2.5;
                invaderFilteredBodies[i].size.y = invaderFilteredBodies[i].size.y * 2.5;
            }
        }

        for (let i = 0; i < playerFilteredBodies.length; i++) {
            if (playerFilteredBodies[i].name === "player") {
                // If player is still alive set him to dead he just got killed LOL
                if (this.playerStatus === 'ALIVE') {
                    this.playerStatus = 'DEAD';
                    this.playerLivesLeft--;
                }
                playerFilteredBodies[i].name = "explosion";
                playerFilteredBodies[i].painter = new ExplosionSpritePainter(game.explosionImages, 'Player');

                try {
                    this.explosionSound.load();
                    this.explosionSound.play();
                } catch (error) {
                    console.log('Error with loading & playing sound: ', error); // pass exception object to error handler
                }

                const imagesSizeMultiplier = this.playerLivesLeft ? 2.5 : 6.0;

                playerFilteredBodies[i].size.x = playerFilteredBodies[i].size.x * imagesSizeMultiplier;
                playerFilteredBodies[i].size.y = playerFilteredBodies[i].size.y * imagesSizeMultiplier;
            }
        }

        const notCollidingWithAnything = function(b1) {
            return bodies.filter(function(b2) { return colliding(b1, b2); }).length === 0; 
        };

        this.bodies = this.bodies.filter(notCollidingWithAnything);

        // Are all Invaders are destroyed 
        const invadersLeftAlive = this.bodies.filter(function(unknownBody) {
            return unknownBody instanceof Invader;
        });

        if (invadersLeftAlive.length < 5 && invadersLeftAlive.length >= 3){
            this.invaderFireRate = 0.98;
            // Radar is on and stays on from here on this level
            this.radar = true;
        } else  if (invadersLeftAlive.length < 3 && invadersLeftAlive.length >= 2){
            this.invaderFireRate = 0.96;
        } else if (invadersLeftAlive.length < 2) {
            this.invaderFireRate = 0.92;
        }

        const allFilteredBodies = [...invaderFilteredBodies, ...playerFilteredBodies];
        // Add bodies back with explosion
        if (allFilteredBodies.length > 0) {     
            for (let j = 0; j < allFilteredBodies.length; j++) {
                this.bodies.push(allFilteredBodies[j]);
            }
        }

        // Remove all bodies that are not visible on the screen 
        this.bodies = this.bodies.filter(function(theBody) {
            return theBody.visible;
        }); 

        this.bodies = this.bodies.filter(function(theBody) {
             return theBody.remove === false;
        }); 

        if (this.playerLivesLeft < 1) {
            //delay game over to let animation finish
            setTimeout(function() {
                this.gameOver = true;
            }, 750);
        }

        if (invadersLeftAlive.length <= 0 && this.playerLivesLeft > 0) {
            this.paused = true;     
            this.playerLivesLeft < 8 ? this.playerLivesLeft++ : this.playerLivesLeft;
            this.incrementLevel();
            setTimeout(function() {
                this.game.loadLevel();
            }, 1250);
        }

        // Update Position
        for (let idx = 0; idx < this.bodies.length; idx++) {
            this.bodies[idx].update(time);
        }
    },  // update

    draw: function(screen, gameSize) {
        screen.clearRect(0, 0, gameSize.x, gameSize.y);
        screen.drawImage(this.backgroundImg, 0, 0, gameSize.x, gameSize.y);
        
        for (let i = 0; i < this.bodies.length; i++) {
            this.bodies[i].draw(this.screen, this.bodies[i]);
        }
    },

    loadLevel: function() {
        console.log(" \n *** Loading level Number " + this.level + " ***");
        const  level = this.getLevel();
        const  level_data = this.levelData[level];
        const  row = level_data.row;
        const  col = level_data.col;
        const  behavior = level_data.behavior;
        const  invaderImage = level_data.invaderImage;

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
        let listener;

        game.keyListeners.forEach(function(keyAndListener) {
            const  currentKey = keyAndListener.key;
            if (currentKey === key) {
                listener = keyAndListener.listener;
            }
        });
        return listener;
    },

    keyPressed: function(e) {
        let listener;
        key = undefined;

        switch (e.keyCode) {
            case 80: key = 'p';         break;
            case 67: key = 'c';         break;
        }

        listener = game.findKeyListener(key);
        if (listener) {
            listener();
        }
    },

    keyUp: function(e) {
        let listener;
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
        let key = game.gameName + game.HIGH_SCORES_SUFFIX,
        highScoresString = localStorage[key];
        if (highScoresString === undefined) {
            localStorage[key] = JSON.stringify([]);
        }
        return JSON.parse(localStorage[key]);
    },

    setHighScore: function() {
        let key = gameName + game.HIGH_SCORES_SUFFIX,
        highScoresString = localStorage;

        highScores.unshift(highScore);
        localStorage[key] = JSON.stringify(highScores);
    },

    clearHighScores: function() {
        localStorage[game.gameName + this.HIGH_SCORES_SUFFIX] = JSON.stringify([]);
    },

    over: function() {
        console.log('inside over function');


        let highScore = 0,
        // highScores = this.getHighScores();
        highScores = [{score: 100}, {score: 75} , {score: 50}];

        let lastOnList = $('#highScoreList li').last().text(); 
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
        let el,
            highScores = game.getHighScores(),
            length = highScores.length,
            highScore,
            listParent = highScoreList.parentNode;  

    },
    drawScoreBox: function() {
        let text = 'SCORE: ' + this.score;
        this.screen.fillText(text, this.gameSize.x * 0.075, this.gameSize.y * 0.050);
        this.screen.fillStyle = 'white';
        let fontHeight = this.gameSize.y * 0.0375;
        this.screen.font = fontHeight + "px Helvetica";
        this.screen.textAlign = 'left';
        this.screen.textBaseline = 'top';
    },
    drawLivesLeftBox: function() {
        let text = 'Lives: ' + this.playerLivesLeft;
        this.screen.fillText(text, this.gameSize.x * 0.850, this.gameSize.y * 0.050);
        this.screen.fillStyle = 'white';
        let fontHeight = this.gameSize.y * 0.0375;
        this.screen.font = fontHeight + "px Helvetica";
        this.screen.textAlign = 'left';
        this.screen.textBaseline = 'top';
    }

}; // end Game.prototype


const imageLoadedCallback =  function(e) {
        this.imagesLoaded++;
    };

const imageLoadErrorCallback = function(e){
        this.imagesFailedToLoad++;
    };

const loadImage = function(imageUrl) {
        let image = new Image();
        const self = this;

        image.src = imageUrl;

        image.addEventListener('load', function(e) {
            self.imageLoadedCallback(e);
        });
        
        image.addEventListener('error', function(e) {
            self.imageLoadErrorCallback(e);
        });

        this.images[imageUrl] = image;      
    };

const loadImages = function() {
        if (this.imagesIndex < this.imageUrls.length){
            this.loadImage(this.imageUrls[this.imagesIndex]);
            this.imagesIndex++;
        }

        return ((this.imagesLoaded + this.imagesFailedToLoad) / 
            this.imageUrls.length) * 100;
    };

    // Call to add image to queue
const queueImage = function(imageUrl) {
        this.imageUrls.push(imageUrl);
    };

const getImage = function(imageUrl) {
        return  this.images[imageUrl];
    };
    
const Player = function(game, behavior, painter, gameSize) {
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
        for (let i = 0; i < this.behavior.length; i++) {
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

            let missle = new Missle({ x: this.center.x, y: this.center.y - 
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

const Invader = function(game, center, behavior, painter, gameSize) {
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

        let targetLocation = {};

        for (let i = 0; i < this.behavior.length; i++) {
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

            let bullet = new Bullet({ x: this.center.x, y: this.center.y + 
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

const createInvaders = function(game, gameSize, behavior, invaderImage, row, col) {
    this.game = game;
    let invaders = [],
        fleetWidth = 0,
        size = {};

    size = getSpriteSize('invader', gameSize);
    fleetWidth = 2 * col * size.x;

    this.game.fleetPatrol_X = ((gameSize.x - fleetWidth) / 2);

    // console.log("this.game.fleetPatrol_X: ",this.game.fleetPatrol_X);

    for (let i = 0; i < (row * col); i++) {

        let x = (this.game.fleetPatrol_X) + (i % col) * (gameSize.x * 0.075);
        let y = (gameSize.y * 0.075) + (i % row) * (gameSize.y * 0.075);

        invaders.push(new Invader(game, { x: x, y: y }, [behavior, 
            new CycleImages(16, 32)], new SpritePainter([invaderImage]), gameSize));
    }

    return invaders;
};

const getSpriteSize = function(spriteName, gameSize){
    let size = {};  // not const

    // TODO: Clean this up and figure out what kind oa screen the user has open
    // 4:3 16:9 : 21:9 etc. and scale the images from there.
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
const rightToLeft = {

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
const sineWave = {

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

const halfCircle = {

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

const dropDiagonal = {

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

const Bullet = function(center, velocity, gameSize) {
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

const Missle = function(center, velocity, gameSize) {
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

const Keyboarder = function(game) {
        let keyState = {}; // not const

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
const colliding = function(b1, b2) {
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

const togglePaused = function() {
    console.log('togglePaused: ', game.pausedToast);
    if (!this.paused) {
        game.pausedToast.insertAfter('canvas');
        game.pausedToast.show();        
    } else {
        $('#pausedToast').detach();
    }
        this.paused = !this.paused;
    };

const loadSound = function(url, callback) {
    const loaded = function() {
        callback(sound);
        sound.removeEventListener('canplaythrough', loaded);
    };

const sound = new Audio(url);
    sound.addEventListener('canplaythrough', loaded);
    sound.load();
};

const SpritePainter = function(images) {
    this.images = images;
    this.imagesIndex = 0;
};

const radarGuidance = function(shooter, target, velocity) {
    let rev = -1,
        dx = shooter.center.x - target.center.x,
        dy = shooter.center.y - target.center.y,
        theta = Math.atan(dy / dx);

    if (target.center.x < shooter.center.x && target.center.y > shooter.center.y) 
        rev = 1;
    else if (target.center.x < shooter.center.x && target.center.y < 
        shooter.center.y) rev = 1;

    let velocity_Dx = rev * velocity * Math.cos(theta),
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
        let spriteImage = this.images[this.imagesIndex];

        screen.drawImage(spriteImage, body.center.x - body.size.x / 2,
        body.center.y - body.size.y / 2, body.size.x, body.size.y);
    }
};

const ExplosionSpritePainter = function(images, kindOfBody) {
    this.images = images;
    this.imagesIndex = 0;
    this.kindOfBody = kindOfBody ? kindOfBody : null;
};

ExplosionSpritePainter.prototype = {
    advance: function(body) {
        // Last image so reset everything here
        if (this.imagesIndex === this.images.length - 1) {
            if  (this.kindOfBody === 'Invader') {
                body.remove = true;
                body.visible = false;
                body.animating = false;

            } else if (this.kindOfBody === 'Player') {
                body.remove = false;
                body.visible = true;
                body.animating = false;
                body.name = 'player';
                body.size.x /= game.playerLivesLeft ? 2.5 : 6.0;
                body.size.y /= game.playerLivesLeft ? 2.5 : 6.0;

                // Player still alive then put them back on the canvas
                if (game.playerLivesLeft > 0 && game.playerStatus === 'DEAD') {
                    body.painter = new SpritePainter([game.playerImg]);
                    game.playerStatus = 'ALIVE';
                }
            } else {
                body.remove = true;
                body.visible = false;
                body.animating = false;
            }
        } else {
            this.imagesIndex++;
        }
    },
    draw: function(screen, body) {
       let spriteImage = this.images[this.imagesIndex];
        body.animating = true;

        try {
            screen.drawImage(spriteImage, body.center.x - body.size.x / 2,
            body.center.y - body.size.y / 2, body.size.x, body.size.y);
        }
        catch (error) {
           // statements to handle any exceptions
           console.warn('Error writing spite to screen ', error); // pass exception object to error handler
        }

    }
};

const CycleImages = function(frameCnt, PAGE_FLIP_INTERVAL) {
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
const levelData = [
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
        behavior: dropDiagonal,
        invaderImage: {}, 
        row: 5,
        col: 7,
        backgroundImg: {},
        invaderFireRate: 0.994,
        invaderHits: 1
    },
];

// We create a new game here
const game = new Game("Defender", "screen");

// Pause the game
game.addKeyListener({ key: 'p', listener: function() {
        game.togglePaused();
}});

// Position the Player back at the start
game.addKeyListener({key: 'c', listener: function() {
    game.player.center = { x: game.gameSize.x / 2, y: game.gameSize.y - 1.0 * game.player.size.y };
}});

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

}});

// Reset these when the arrow keys come UP
game.addKeyListener({ key: 'left arrow',  listener: function() {
            game.player.step_X = 4;
}});

game.addKeyListener({ key: 'right arrow',  listener: function() {
            game.player.step_X = 4;
}});
game.addKeyListener({ key: 'up arrow',  listener: function() {
            game.player.step_Y = 4;
}});

game.addKeyListener({ key: 'down arrow',  listener: function() {
            game.player.step_Y = 4;
}});

$('#pausedToast').on('click', function(e){
    console.log('pausedToast')
    game.togglePaused();
});

$('.newGameButton, .closeHighScoreToast').on('click', function (e) {
    // console.log('game.start();');
    // Get the reset() working later
    // game.reset();
    // game.start();
    // window.location.reload(); // inconsistent
    console.log('Button Pressed!!!')
    window.location.href = window.location.origin;
});

$('#newGameFromHighScore.newGame').on('click', function (e) {
    console.log('newGameFromHighScore.newGame clicked!!!')
    window.location.href = window.location.origin;
});

$(window).on('blur', function() {
    if (!game.gameOver && !game.paused) {
        game.togglePaused();
}});

$(window).on('focus', function() {
    if (game.paused) {
        game.togglePaused();
}});
    
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

        let loadingPercentComplete = game.loadImages();
        // console.log('loading Percentage Completed: ', loadingPercentComplete);

        if (loadingPercentComplete === 100) {
            console.log("loading ... 100% Complete: OK!!!");
            clearInterval(interval);
        }

            // We MUST Load ALL these Images here
            game.backgroundImg = game.getImage("/images/Space_1_slice.jpg");
            game.playerImg = game.getImage("/images/Starships/starships_0007_Ex-ving.png");
            game.missleImg = game.getImage("/images/missle.png");
            game.enemy_bulletImg = game.getImage("/images/enemy-bullet.png");

            // Load Alien ships into level obj's
            // TODO: Load all but first later
            game.levelData[0].invaderImage = game.getImage("/images/Starships/starships_0006_Bow-fighter_Rev.png");
            game.levelData[1].invaderImage = game.getImage("/images/Starships/starships_0004_Ice-Speedster_Rev.png");
            game.levelData[2].invaderImage = game.getImage("/images/Starships/starships_0005_Centenial-Hawk_Rev.png");
            game.levelData[3].invaderImage = game.getImage("/images/Starships/starships_0001_Sun-killer_Rev.png");

            // TODO: Load all but first later
            game.levelData[0].backgroundImg = game.getImage("/images/Space_1_slice.jpg");
            game.levelData[1].backgroundImg = game.getImage("/images/Milky_Way.jpg");
            game.levelData[2].backgroundImg = game.getImage("/images/Galaxy.jpg");
            game.levelData[3].backgroundImg = game.getImage("/images/Space_1.jpg");

            // Load Explosion Images
            // These are inline/unrolled for faster loading
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
// const loadToastTitle = document.getElementById("loadToastTitle");

// Hide Canvas
$('#screen').hide();


// click to start game
$('#loadButton').on('click', function (e) {

/* Hide HTML using CSS
 * Classes are used for speed
 * to reduce page flicker 
 * jQuery for convenience */ 
$('#pausedToast').removeClass('hide');
$('#scoreToast').removeClass('hide');
$('#progressbar').removeClass('hide');
$('#gameOverToast').removeClass('hide');
$('#highScoreToast').removeClass('hide');

// detach and cache HTML snippet
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
    // Delay start of game to make sure all assets have loaded
    // TODO change to a promise/callback
    setTimeout(function(){
        game.start();
    }, 250)
});

const gScore = game.score;
