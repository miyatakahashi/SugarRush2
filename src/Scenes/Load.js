class Load extends Phaser.Scene {
    constructor() {
        super("Load");
    }

    preload() {
        this.load.image("food_tilemap_tiles", "assets/food_tilemap_packed.png");
        this.load.image("tilemap_tiles", "assets/tilemap_packed.png");

        this.load.spritesheet("food_tilemap_sheet", "assets/food_tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });
        this.load.spritesheet("tilemap_sheet", "assets/tilemap_packed.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        this.load.atlas("platformer_characters", "assets/tilemap-characters-packed.png", "assets/tilemap-characters-packed.json");

        this.load.image("star", "assets/star_01.png");

        this.load.tilemapTiledJSON("platformer-level-1", "assets/platformer-level-1.tmj");
        this.load.tilemapTiledJSON("platformer-level-2", "assets/platformer-level-2.tmj");
        
        this.load.audio("jump", "assets/jump.ogg");
        this.load.audio("coin", "assets/coin.ogg");
        this.load.audio("land", "assets/land.ogg");
    }

    create() {
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

        this.scene.start("Title");    }

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
