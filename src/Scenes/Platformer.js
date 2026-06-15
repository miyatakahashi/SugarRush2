// Platformer Scene — Main gameplay: player movement, coin collection, VFX, camera.
// Win condition: collect all 29 coins OR touch the end coin.
class Platformer extends Phaser.Scene {
    constructor() {
        super("Platformer");
    }

    create() {
        // ── Level & Physics ──
        const { map, foodTileset, tilemapTileset } = this.loadTilemap();
        this.map = map;
        const groundLayer = map.createLayer("Ground-n-Platforms", [foodTileset, tilemapTileset]);
        groundLayer.setCollisionByProperty({ collides: true });

        // Gravity is 0 in the global config; set it per-scene as specified in DESIGN.md
        this.physics.world.gravity.y = 1500;
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels * 2);
        // ── Coins ──
        const coins = this.createCoins(map);

        // ── Player ──
        const player = this.createPlayer();
        this.physics.add.collider(player, groundLayer);

        // ── Coin Overlaps ──
        this.setupCoinOverlap(player, coins.regular, coins.endCoin);

        // ── Input ──
        cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            up: Phaser.Input.Keyboard.KeyCodes.W,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });
        this.rKey = this.input.keyboard.addKey("R");
        this.dKey = this.input.keyboard.addKey("D");

        // ── VFX Emitters ──
        this.setupVFX(player);

        // ── Camera ──
        this.setupCamera(player, map);

        // ── HUD ──
        this.createHUD(coins.totalRegular);

        // ── Scene-level State ──
        this.coinsCollected = 0;
        this.totalCoins = coins.totalRegular;
        this.wasAirborne = false;
        this.vfxActive = false;   // tracks whether the walking dust emitter is currently flowing
        this.gameWon = false;      // prevents double-triggering the win transition
    }

    update() {
        if (this.gameWon) return;

        const player = my.sprite.player;

        // ── Player Movement ──
        this.handleMovement(player);

        // ── Jump ──
        this.handleJump(player);

        // ── Landing Detection ──
        this.handleLanding(player);

        // ── Walking Dust VFX ──
        this.handleWalkingDust(player);

        // ── Animation State ──
        this.handleAnimation(player);

        // ── Debug Toggle ──
        if (Phaser.Input.Keyboard.JustDown(this.dKey)) {
            this.physics.world.debug = !this.physics.world.debug;
        }
        // ── Fall Death ──
        // ── Fall Death ──
        if (my.sprite.player.y > this.map.heightInPixels + 100) {
            this.gameWon = true; // prevent other triggers
            this.scene.start("GameOver", { won: false, coinCount: this.coinsCollected });
        }
        // ── Restart ──
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.start("Platformer");
        }
    }

    // ─────────────────────────────────────────────────
    //  TILEMAP
    // ─────────────────────────────────────────────────

    // Loads the Tiled JSON tilemap and associates each tileset name with
    // the corresponding Phaser image key. Returns the map AND the Tileset
    // objects — createLayer needs Tileset objects (not string keys) when
    // a layer uses multiple tilesets.
    loadTilemap() {
        const levelKey = this.scene.settings.data?.level === 2 ? "platformer-level-2" : "platformer-level-1";
        const map = this.add.tilemap(levelKey);
        const foodTileset = map.addTilesetImage("kenny_food_packed", "food_tilemap_tiles");
        const tilemapTileset = map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
        return { map, foodTileset, tilemapTileset };
    }

    // ─────────────────────────────────────────────────
    //  COINS
    // ─────────────────────────────────────────────────

    // Reads the "Objects" object layer from the Tiled map and creates
    // Arcade Physics static sprites for each coin and the end coin.
    // The end coin is created as a standalone static sprite (not in the group)
    // to avoid the regular coin overlap callback triggering on it.
    // Both regular coins and the end coin use frame 151 from tilemap_sheet,
    // making them visually identical (per DESIGN.md).
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

    // Sets up overlap detection between the player and all coins.
    // Regular coins increment the counter and update the HUD; the end coin
    // triggers an immediate win (shorter delay, no counter increment).
    setupCoinOverlap(player, coinGroup, endCoin) {
        // Regular coin overlap
        this.physics.add.overlap(player, coinGroup, (playerSprite, coinSprite) => {
            this.collectCoin(playerSprite, coinSprite);
        });

        // End coin overlap — separate handler for the distinct win behavior
        this.physics.add.overlap(player, endCoin, (playerSprite, coinSprite) => {
            this.collectEndCoin(playerSprite, coinSprite);
        });
    }

    // Called when the player overlaps a regular coin:
    // destroys the sprite, plays sound, increments counter, emits particles, updates HUD.
    // If all coins are collected, starts a 500ms delay before transitioning to Game Over.
    collectCoin(playerSprite, coinSprite) {
        coinSprite.destroy();
        this.sound.play("coin");
        this.coinsCollected++;
        this.emitCoinBurst(coinSprite.x, coinSprite.y);
        this.updateCoinText();

        // Win condition: all regular coins collected
        if (this.coinsCollected >= this.totalCoins) {
            this.gameWon = true;
            this.time.delayedCall(500, () => {
                this.scene.start("GameOver", { won: true, coinCount: this.coinsCollected });
            });
        }
    }

    // Called when the player overlaps the end coin:
    // destroys it, plays sound, starts a 300ms delay, then transitions to Game Over with won=true.
    // The end coin does NOT increment the coin counter or update the HUD.
    collectEndCoin(playerSprite, coinSprite) {
        coinSprite.destroy();
        this.sound.play("coin");
        this.gameWon = true;
        this.time.delayedCall(300, () => {
            this.scene.start("GameOver", { won: true, coinCount: this.coinsCollected });
        });
    }

    // ─────────────────────────────────────────────────
    //  PLAYER
    // ─────────────────────────────────────────────────

    // Creates the player sprite at the spawn position, sets physics body
    // properties, and stores it in my.sprite.
    createPlayer() {
        const player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        player.setFlip(true, false);
        my.sprite.player = player;
        return player;
}

    // ─────────────────────────────────────────────────
    //  MOVEMENT
    // ─────────────────────────────────────────────────

    // Direct velocity model: set horizontal velocity when keys are held,
    // zero it when released. WASD and arrow keys both work.
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

    // Jump on up arrow, W key, or spacebar — only when just pressed AND grounded.
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

    // Tracks the airborne-to-grounded transition. When the player was airborne
    // in the previous frame and is now grounded, plays the landing sound and
    // emits a landing particle burst from the player's feet.
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

    // Selects the appropriate character animation based on the player's state:
    // - Moving on ground → walk animation
    // - Airborne → jump animation (single frame, no repeat)
    // - Stationary on ground → idle animation
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

    // Starts/stops the walking dust emitter based on whether the player
    // is on the ground AND moving. The emitter is managed as a flowing
    // emitter (continuous) that is started/stopped rather than destroyed/created.
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

    // Creates all particle emitters used in the scene:
    // - Walking dust: continuous flow while grounded and moving
    // - Jump/landing burst: shared emitter for both jump and landing events
    // - Coin burst: created dynamically per coin collection via emitCoinBurst()
    setupVFX(player) {
        // ── Walking Dust ──
        // Continuous emitter that follows the player's feet while moving on ground.
        // Uses a follow offset to position particles near the bottom-center of the sprite.
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
            emitting: false  // starts stopped; handleWalkingDust() controls flow
        });

        // ── Jump / Landing Burst ──
        // A shared emitter for both the jump and landing particle effects.
        // Both events emit a burst at the player's feet. The emitter is positioned
        // to follow the player so the burst always appears at the correct location.
        my.vfx.jumpBurst = this.add.particles(0, 0, "star", {
            follow: player,
            followOffset: {
                x: 0,
                y: player.displayHeight / 2 - 2  // near the bottom (feet)
            },
            scale: { start: 0.06, end: 0.02 },
            maxAliveParticles: 6,
            lifespan: 300,
            alpha: { start: 0.6, end: 0 },
            speedX: { min: -60, max: 60 },
            speedY: { min: -40, max: 0 },
            emitting: false  // only emits via burst calls, not continuous
        });
    }

    // Emits a burst of 5 particles at the player's feet when jumping.
    emitJumpBurst(player) {
        my.vfx.jumpBurst.explode(5);
    }

    // Emits a burst of 6 particles at the player's feet when landing.
    emitLandingBurst(player) {
        my.vfx.jumpBurst.explode(6);
    }

    // Creates a temporary particle emitter at the coin's position for the
    // collection burst effect. The emitter auto-destroys after its lifespan
    // expires since all particles will have died.
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

    // Configures the camera to follow the player with smooth lerp,
    // a small deadzone, and 2× zoom for the pixel-art display scale.
    // The background color is pink (#FFD6E0), overriding Tiled's light blue.
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

    // Creates the coin counter text fixed to the top-left of the screen.
    // Scroll factor 0 keeps it in place regardless of camera movement.
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

    // Updates the HUD text to reflect the current coin count.
    updateCoinText() {
        my.text.coinText.setText("Coins: " + this.coinsCollected + " / " + this.totalCoins);
    }
}
