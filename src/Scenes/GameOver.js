
class GameOver extends Phaser.Scene {
    constructor() {
        super("GameOver");
    }

    create(data) {
        // data.won tells us whether the player won (true) or lost (false)
        this.won = data.won || false;
        this.coinCount = data.coinCount || 0;

      this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x1a1a2e, 1).setOrigin(0);
        let centerX = this.scale.width / 2;
        let centerY = this.scale.height / 2;

        if (this.won) {
            this.showWinScreen(centerX, centerY);
        } else {
            this.showLossScreen(centerX, centerY);
        }

        this.restartKey = this.input.keyboard.addKey("R");

        this.tweens.add({
            targets: this.restartText,
            alpha: { from: 1, to: 0 },
            duration: 600,
            yoyo: true,
            repeat: -1
        });
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
            this.scene.start("Platformer", { level: 1 });        }
    }

    
    showWinScreen(centerX, centerY) {
       
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xffd6e0).setOrigin(0);

        this.add.text(centerX, centerY - 160, "🍩", {
            fontSize: 72
        }).setOrigin(0.5);

        // Title
        this.add.text(centerX, centerY - 70, "SUGAR RUSH COMPLETE!", {
            fontSize: 48,
            color: "#ff69b4",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(centerX, centerY + 10, `🍬 You collected ${this.coinCount} coins! 🍬`, {
            fontSize: 28,
            color: "#ff1493",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(centerX, centerY + 55, "- Level Donut Fall -", {
            fontSize: 22,
            color: "#cc3377",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5);

        this.restartText = this.add.text(centerX, centerY + 120, "🎀 Press R to play again 🎀", {
            fontSize: 24,
            color: "#ffffff",
            stroke: "#cc3377",
            strokeThickness: 4
        }).setOrigin(0.5);
    }

    showLossScreen(centerX, centerY) {
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xffd6e0).setOrigin(0);

        this.add.text(centerX, centerY - 120, "💀", {
            fontSize: 72
        }).setOrigin(0.5);

        this.add.text(centerX, centerY - 40, "YOU FELL!", {
            fontSize: 52,
            color: "#ff69b4",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(centerX, centerY + 30, `You had ${this.coinCount} coins...`, {
            fontSize: 26,
            color: "#cc3377",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5);

        this.restartText = this.add.text(centerX, centerY + 100, "🎀 Press R to try again 🎀", {
            fontSize: 24,
            color: "#ffffff",
            stroke: "#cc3377",
            strokeThickness: 4
        }).setOrigin(0.5);
    }
}
