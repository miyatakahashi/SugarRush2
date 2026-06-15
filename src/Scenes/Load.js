// Load Scene — Preloads all game assets and defines character animations.
// Once everything is ready, immediately transitions to the Platformer scene.
class Load extends Phaser.Scene {
    constructor() {
        super("Load");
    }

    preload() {
        // ── Tileset Images (used as static images for the tilemap) ──
        this.load.image("food_tilemap_tiles", "assets/food_tilemap_packed.png");
        this.load.image("tilemap_tiles", "assets/tilemap_packed.png");

        // ── Spritesheets (same PNG files, loaded with frame dimensions for per-tile sprite use) ──
        // The food tileset: 288×126 px, 18×18 frame size, yields 112 frames
        this.load.spritesheet("food_tilemap_sheet", "assets/food_tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        // The general tileset: 360×162 px, 18×18 frame size, yields 180 frames
        // Frame 151 (local index) is used for both regular and end coin sprites
        this.load.spritesheet("tilemap_sheet", "assets/tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        // ── Character Atlas (TexturePacker format with trimmed frames) ──
        this.load.atlas("platformer_characters", "assets/tilemap-characters-packed.png", "assets/tilemap-characters-packed.json");

        // ── Particle Texture ──
        // All VFX emitters (dust, jump/landing burst, coin burst) use this star image
        this.load.image("star", "assets/star_01.png");

        // ── Tilemap Data ──
        this.load.tilemapTiledJSON("platformer-level-1", "assets/platformer-level-1.tmj");
        this.load.tilemapTiledJSON("platformer-level-2", "assets/platformer-level-2.tmj");
        
        // ── Audio ──
        this.load.audio("jump", "assets/jump.ogg");
        this.load.audio("coin", "assets/coin.ogg");
        this.load.audio("land", "assets/land.ogg");
    }

    create() {
        // Define the three character animations used throughout gameplay.
        // All animations reference the "platformer_characters" atlas.
        this.defineAnimations();

        this.anims.create({
            key: "coin-spin",
            frames: this.anims.generateFrameNumbers("tilemap_sheet", {
                start: 151,
                end: 152
            }),
            frameRate: 6,
            repeat: -1
        });

        // All assets are loaded — immediately start the main gameplay scene.
        this.scene.start("Title");    }

    // Defines walk, idle, and jump animations for the player character.
    // The atlas frames are named "tile_NNNN.png" (zero-padded to 4 digits).
    defineAnimations() {
        this.anims.create({
            key: "walk",
            frames: this.anims.generateFrameNames("platformer_characters", {
                prefix: "tile_",
                start: 0,
                end: 1,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: "idle",
            frames: [
                { key: "platformer_characters", frame: "tile_0000.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: "jump",
            frames: [
                { key: "platformer_characters", frame: "tile_0001.png" }
            ],
            repeat: 0
        });
    }
}
