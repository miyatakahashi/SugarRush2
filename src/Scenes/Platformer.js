
class Platformer extends Phaser.Scene {
    constructor() {
        super("Platformer");
    }
    
    create(data) {
        this.level = (data && data.level) ? data.level : 1;

        const { map, foodTileset, tilemapTileset } = this.loadTilemap();
        this.map = map;
        const groundLayer = map.createLayer("Ground-n-Platforms", [foodTileset, tilemapTileset]);
        groundLayer.setCollisionByProperty({ collides: true });

       
        this.physics.world.gravity.y = 1500;
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels * 2);
        
        const coins = this.createCoins(map);

       
        const player = this.createPlayer();
        this.physics.add.collider(player, groundLayer);

        
        this.setupCoinOverlap(player, coins.regular, coins.endCoin);

        cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            up: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });
        this.rKey = this.input.keyboard.addKey("R");
        this.dKey = this.input.keyboard.addKey("D");

        this.setupVFX(player);

        this.setupCamera(player, map);

        this.createHUD(coins.totalRegular);

        this.coinsCollected = 0;
        this.totalCoins = coins.totalRegular;
        this.wasAirborne = false;
        this.vfxActive = false;  
        this.gameWon = false;  }    

    update() {
        if (this.gameWon) return;

        const player = my.sprite.player;

        this.handleMovement(player);

        this.handleJump(player);

        this.handleLanding(player);

        this.handleWalkingDust(player);

        this.handleAnimation(player);

        if (Phaser.Input.Keyboard.JustDown(this.dKey)) {
            this.physics.world.debug = !this.physics.world.debug;
        }
        if (my.sprite.player.y > this.map.heightInPixels + 100) {
            this.gameWon = true; 
            this.scene.start("GameOver", { won: false, coinCount: this.coinsCollected, level: this.level });
        }
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.start("Platformer", { level: this.level });
        }
    }

    // ─────────────────────────────────────────────────
    //  TILEMAP
    // ─────────────────────────────────────────────────

    
    loadTilemap() {
        const levelKey = this.level === 2 ? "platformer-level-2" : "platformer-level-1";
        console.log("Loading:", levelKey);
        
        const map = this.add.tilemap(levelKey);
        console.log("Map created:", map);
        
        const foodTileset = map.addTilesetImage("kenny_food_packed", "food_tilemap_tiles");
        console.log("foodTileset:", foodTileset);
        
        const tilemapTileset = map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
        console.log("tilemapTileset:", tilemapTileset);

        return { map, foodTileset, tilemapTileset };
    }

    // ─────────────────────────────────────────────────
    //  COINS
    // ─────────────────────────────────────────────────

   
    createCoins(map) {
        const objectLayer = map.getObjectLayer("Objects");
        const coinGroup = this.physics.add.staticGroup();
        let endCoinSprite = null;
        let regularCount = 0;

        for (const obj of objectLayer.objects) {
            if (obj.name === "coin") {
                const sprite = coinGroup.create(obj.x, obj.y - obj.height, "tilemap_sheet", 151);
                sprite.anims.play("coin-spin");
                regularCount++;
            } else if (obj.name === "endcoin") {
                endCoinSprite = this.physics.add.staticSprite(obj.x, obj.y - obj.height, "tilemap_sheet", 151);
                endCoinSprite.anims.play("coin-spin");
                endCoinSprite.endCoin = true;
            }
        }

        return { regular: coinGroup, endCoin: endCoinSprite, totalRegular: regularCount };
    }

   
    setupCoinOverlap(player, coinGroup, endCoin) {
        this.physics.add.overlap(player, coinGroup, (playerSprite, coinSprite) => {
            this.collectCoin(playerSprite, coinSprite);
        });

        this.physics.add.overlap(player, endCoin, (playerSprite, coinSprite) => {
            this.collectEndCoin(playerSprite, coinSprite);
        });
    }

   
    collectCoin(playerSprite, coinSprite) {
        coinSprite.destroy();
        this.sound.play("coin");
        this.coinsCollected++;
        this.emitCoinBurst(coinSprite.x, coinSprite.y);
        this.updateCoinText();

        if (this.coinsCollected >= this.totalCoins) {
            this.gameWon = true;
            this.time.delayedCall(500, () => {
                this.scene.start("GameOver", { won: true, coinCount: this.coinsCollected, level: this.level });
            });
        }
    }

    collectEndCoin(playerSprite, coinSprite) {
        coinSprite.destroy();
        this.sound.play("coin");

        this.gameWon = true;

        this.time.delayedCall(300, () => {
            if (this.level === 2) {
                this.scene.start("GameOver", {
                    won: true,
                    coinCount: this.coinsCollected
                });
            } else {
                this.scene.start("LevelTransition", {
                    coinCount: this.coinsCollected
                });
            }
        });
    }

    // ─────────────────────────────────────────────────
    //  PLAYER
    // ─────────────────────────────────────────────────

    
    createPlayer() {
        const player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        player.setFlip(true, false);
        my.sprite.player = player;
        return player;
}

    // ─────────────────────────────────────────────────
    //  MOVEMENT
    // ─────────────────────────────────────────────────

    
    handleMovement(player) {
        const ACCELERATION = 400;
        const DRAG = 500;
        if (cursors.left.isDown || this.wasd.left.isDown) {
            player.setAccelerationX(-ACCELERATION);
            player.setFlip(false, false);
        } else if (cursors.right.isDown || this.wasd.right.isDown) {
            player.setAccelerationX(ACCELERATION);
            player.setFlip(true, false);
        } else {
            player.setAccelerationX(0);
            player.setDragX(DRAG);
        }
    }

    handleJump(player) {
        const JUMP_VELOCITY = -600;

        if ((Phaser.Input.Keyboard.JustDown(cursors.up) ||
             Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
             Phaser.Input.Keyboard.JustDown(this.wasd.space)) && player.body.blocked.down) {
            player.setVelocityY(JUMP_VELOCITY);
            this.sound.play("jump");
            this.emitJumpBurst(player);
        }
    }

    // ─────────────────────────────────────────────────
    //  LANDING
    // ─────────────────────────────────────────────────

   
    handleLanding(player) {
        const isAirborne = !player.body.blocked.down;

        if (this.wasAirborne && !isAirborne) {
            this.sound.play("land");
            this.emitLandingBurst(player);
        }

        this.wasAirborne = isAirborne;
    }

    // ─────────────────────────────────────────────────
    //  ANIMATION
    // ─────────────────────────────────────────────────

   
    handleAnimation(player) {
        if (!player.body.blocked.down) {
            player.anims.play("jump", true);
        } else if (player.body.speed > 0) {
            player.anims.play("walk", true);
        } else {
            player.anims.play("idle", true);
        }
    }

    // ─────────────────────────────────────────────────
    //  WALKING DUST VFX
    // ─────────────────────────────────────────────────

    
    handleWalkingDust(player) {
        const isMoving = player.body.speed > 0;
        const isGrounded = player.body.blocked.down;
        const shouldEmit = isGrounded && isMoving;

        if (shouldEmit && !this.vfxActive) {
            my.vfx.walkingDust.start();            
            this.vfxActive = true;
        } else if (!shouldEmit && this.vfxActive) {
            my.vfx.walkingDust.stop();
            this.vfxActive = false;
        }
    }

    // ─────────────────────────────────────────────────
    //  VFX SETUP & EMITTERS
    // ─────────────────────────────────────────────────

    
    setupVFX(player) {
      
        my.vfx.walkingDust = this.add.particles(0, 0, "star", {
            follow: player,
            followOffset: {
                x: player.displayWidth / 2 - 10,
                y: player.displayHeight / 2 - 5
            },
            scale: { start: 0.04, end: 0.01 },
            maxAliveParticles: 5,
            lifespan: 250,
            alpha: { start: 0.8, end: 0 },
            speedY: { min: -20, max: -60 },
            speedX: 50,
            emitting: false  
        });
      
        my.vfx.jumpBurst = this.add.particles(0, 0, "star", {
            follow: player,
            followOffset: {
                x: 0,
                y: player.displayHeight / 2 - 2 
            },
            scale: { start: 0.06, end: 0.02 },
            maxAliveParticles: 6,
            lifespan: 300,
            alpha: { start: 0.6, end: 0 },
            speedX: { min: -60, max: 60 },
            speedY: { min: -40, max: 0 },
            emitting: false 
        });
    }

    emitJumpBurst(player) {
        my.vfx.jumpBurst.explode(5);
    }

    emitLandingBurst(player) {
        my.vfx.jumpBurst.explode(6);
    }

   
    emitCoinBurst(x, y) {
        this.add.particles(x, y, "star", {
            scale: { start: 0.08, end: 0.02 },
            lifespan: 400,
            alpha: { start: 1.0, end: 0 },
            speed: { min: 50, max: 120 },
            emitting: false
        }).explode(10);
    }

    // ─────────────────────────────────────────────────
    //  CAMERA
    // ─────────────────────────────────────────────────

   
    setupCamera(player, map) {
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(player, true, 0.25, 0.25);
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(2.0);
        this.cameras.main.setBackgroundColor("#FFD6E0");
    }

    // ─────────────────────────────────────────────────
    //  HUD
    // ─────────────────────────────────────────────────

  
    createHUD(totalCoins) {
        my.text.coinText = this.add.text(16, 16, "Coins: 0 / " + totalCoins, {
            fontSize: "18px",
            fill: "#FFD700",
            stroke: "#000000",
            strokeThickness: 4
        });
        my.text.coinText.setScrollFactor(0);
        my.text.coinText.setDepth(10);
    }

    updateCoinText() {
        my.text.coinText.setText("Coins: " + this.coinsCollected + " / " + this.totalCoins);
    }
}
