let timeLeft = 30;
let score = 0;
let isPaused = false;

let currentBurrowKey;

const gameState = {};

class GameScene extends Phaser.Scene {
	constructor() {
		super({ key: 'GameScene' });

		this.burrowLocations = [
			{ key: 'j', x: 100, y: 310 },
			{ key: 'k', x: 240, y: 390 },
			{ key: 'l', x: 380, y: 310 }
		];
	}

	preload() {
		this.load.image('background', 'assets/images/background.png');
		this.load.spritesheet('mole', 'assets/images/mole-sprite.png', { frameWidth: 198, frameHeight: 250 });
	}

	create() {
		const updateTimer = (timeElapsed) => {
			timeLeft -= timeElapsed;
		};

		const onSecondElapsed = (timeElapsed) => {
			if (!isPaused) {
				updateTimer(timeElapsed);
				this.updateTimerText();
			}
		};

		this.initializeBackground();
		this.initializeScoreText();
		this.initializeBurrowKeys();
		this.initializeAnimations();
		this.initializeMole();
		this.initializeTimer(onSecondElapsed);
	}

	update() {
		if (timeLeft <= 0) {
			this.scene.stop('GameScene');
			this.scene.start('EndScene');
		}

		const updateScore = (points) => {
			score += points;
		};

		const applyHitReward = () => {
			this.displayRewardText();
			updateScore(5);
			this.updateScoreText();
		};

		const applyMissPenalty = () => {
			this.displayPenaltyText();
			updateScore(-5);
			this.updateScoreText();
		};

		const onBurrowHit = (key) => {
			if (key === currentBurrowKey) {
				applyHitReward();
				this.relocateMole();
			} else {
				applyMissPenalty();
			}
		};

		if (!isPaused) {
			if (Phaser.Input.Keyboard.JustDown(gameState.jKey)) {
				onBurrowHit('j');
			} else if (Phaser.Input.Keyboard.JustDown(gameState.kKey)) {
				onBurrowHit('k');
			} else if (Phaser.Input.Keyboard.JustDown(gameState.lKey)) {
				onBurrowHit('l');
			}
		}

		const togglePause = () => {
			isPaused = !isPaused;
			isPaused ? this.displayPauseScreen() : this.removePauseScreen();
		};

		if (Phaser.Input.Keyboard.JustDown(gameState.spaceKey)) {
			togglePause();
		}
	}

	initializeBackground() {
		const background = this.add.image(0, 0, 'background');
		background.setScale(0.5);
		background.setOrigin(0, 0);

		const scoreBox = this.add.rectangle(90, 70, 140, 90, 0xFFFFFF);
		scoreBox.alpha = 0.5;
	}

	initializeScoreText() {
		gameState.scoreText = this.add.text(50, 50, `Score: ${score}`).setColor('#000000');
	}

	initializeBurrowKeys() {
		gameState.jKey = this.input.keyboard.addKey('j');
		gameState.kKey = this.input.keyboard.addKey('k');
		gameState.lKey = this.input.keyboard.addKey('l');
		gameState.spaceKey = this.input.keyboard.addKey('space');

		this.burrowLocations.forEach((burrow) => {
			this.add.text(burrow.x - 10, burrow.y + 70, burrow.key.toUpperCase(), { fontSize: 32, color: '#553a1f' });
		});
	}

	initializeMole() {
		gameState.mole = this.physics.add.sprite(0, 0, 'mole');
		gameState.mole.setScale(0.5, 0.5);
		this.updateBurrow();

		gameState.mole.on('animationcomplete-appear', () => {
			gameState.mole.anims.play('idle');
		});

		gameState.mole.on('animationcomplete-disappear', () => {
			this.updateBurrow();
		});
	}

	initializeAnimations() {
		this.anims.create({
			key: 'appear',
			frames: this.anims.generateFrameNumbers('mole', { start: 0, end: 2 }),
			frameRate: 10,
		});

		this.anims.create({
			key: 'idle',
			frames: this.anims.generateFrameNumbers('mole', { frames: [1, 3, 1, 1, 4] }),
			frameRate: 3,
			repeat: -1,
		});

		this.anims.create({
			key: 'disappear',
			frames: this.anims.generateFrameNumbers('mole', { frames: [5, 6, 6, 5, 2, 1, 0] }),
			frameRate: 15,
		});
	}

	initializeTimer(timerCallback) {
		gameState.timerText = this.add.text(50, 75, `Time: ${timeLeft}`).setColor('#000000');

		this.time.addEvent({
			delay: 1000,
			callback: timerCallback,
			args: [1],
			callbackScope: this,
			loop: true,
		});
	}

	getRandomBurrow() {
		return Phaser.Utils.Array.GetRandom(this.burrowLocations);
	}

	updateBurrow() {
		const burrowLocation = this.getRandomBurrow();
		currentBurrowKey = burrowLocation.key;
		gameState.mole.setPosition(burrowLocation.x, burrowLocation.y);
		gameState.mole.anims.play('appear');
	}

	relocateMole() {
		gameState.mole.anims.play('disappear');
	}

	updateTimerText() {
		gameState.timerText.setText(`Time: ${timeLeft}`);
	}

	updateScoreText() {
		gameState.scoreText.setText(`Score: ${score}`);
	}

	displayRewardText() {
		const rewardText = this.add.text(160, 50, '+5').setColor('#228B22');
		this.time.addEvent({
			delay: 500,
			callback: () => { rewardText.destroy(); },
			args: [rewardText],
			repeat: -1,
		});
	}

	displayPenaltyText() {
		const penaltyText = this.add.text(160, 50, '-5').setColor('#991A00');
		this.time.addEvent({
			delay: 300,
			callback: () => { penaltyText.destroy(); },
			args: [penaltyText],
			repeat: -1,
		});
	}

	displayPauseScreen() {
		gameState.pauseOverlay = this.add.rectangle(0, 0, 480, 640, 0xFFFFFF);
		gameState.pauseOverlay.alpha = 0.75;
		gameState.pauseOverlay.setOrigin(0, 0);

		gameState.pauseText = this.add.text(225, 325, 'PAUSED').setColor('#000000');
		gameState.resumeText = this.add.text(125, 375, 'Press space to resume game').setColor('#000000');
	}

	removePauseScreen() {
		gameState.pauseOverlay.destroy();
		gameState.pauseText.destroy();
		gameState.resumeText.destroy();
	}
}
