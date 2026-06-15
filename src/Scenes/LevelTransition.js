class LevelTransition extends Phaser.Scene {
    constructor() {
        super("LevelTransition");
    }

    create(data) {
        this.coinCount = data.coinCount || 0;
        
        let centerX = this.scale.width / 2;
        let centerY = this.scale.height / 2;

        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xffd6e0).setOrigin(0);
        this.add.text(centerX, centerY - 100, "🍩", { fontSize: 72 }).setOrigin(0.5);

        this.add.text(centerX, centerY - 20, "Level 1 Complete!", {
            fontSize: 48,
            color: "#ff69b4",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(centerX, centerY + 50, `Coins collected: ${this.coinCount}`, {
            fontSize: 26,
            color: "#cc3377",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5);

        let prompt = this.add.text(centerX, centerY + 120, "🎀 Press SPACE for Level 2 🎀", {
            fontSize: 24,
            color: "#ffffff",
            stroke: "#cc3377",
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: prompt,
            alpha: { from: 1, to: 0 },
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.ready = false;


        this.time.delayedCall(300, () => {
            this.ready = true;
        });
    }

    update() {
        if (this.ready && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.scene.start("Platformer", { level: 2 });
        }
    }
}