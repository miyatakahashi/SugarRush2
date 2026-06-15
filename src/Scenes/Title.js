class Title extends Phaser.Scene {
    constructor() {
        super("Title");
    }

    create() {
        let centerX = this.scale.width / 2;
        let centerY = this.scale.height / 2;

        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xffd6e0).setOrigin(0);

        this.add.text(centerX, centerY - 80, "🍩 SUGAR RUSH 🍩", {
            fontSize: 64,
            color: "#ff69b4",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(centerX, centerY, "Donut Die", {
            fontSize: 32,
            color: "#FFD700",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5);

        let prompt = this.add.text(centerX, centerY + 80, "Press SPACE to start", {
            fontSize: 24,
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: prompt,
            alpha: { from: 1, to: 0 },
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        this.input.keyboard.once("keydown-SPACE", () => {
            this.scene.start("Platformer");
        });
    }
}