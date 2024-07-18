var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 700,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 30 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
let socket;
let asteroids = [];
let serverShip1Position = { x: 400, y: 630 };
let serverShip2Position = { x: 700, y: 630 };
let lastUpdatedTime = 0;

function preload() {
    this.load.image('space', 'static/images/background1.jpeg');
    this.load.image('big-asteroid', 'static/images/asteroids-sprite.png');
    this.load.image('ship', 'static/images/ship1.png');
    this.load.image('ship-two', 'static/images/space-ship2-1.png');
}

function create() {
    // Initialize socket connection
    socket = io();

    // Create background 
    this.tileSprite = this.add.tileSprite(0, 0, innerWidth, innerHeight, 'space');
    this.tileSprite.setOrigin(0);
    this.tileSprite.setScrollFactor(0, 1);

    // Create asteroid group
    this.asteroidsGroup = this.physics.add.group();

    // Main ship logic
    this.main_ship = this.physics.add.sprite(400, 630, 'ship').setScale(.2).setDepth(1).setCollideWorldBounds(true);

    // Second ship logic
    this.second_ship = this.physics.add.sprite(700, 630, 'ship-two').setScale(.15).setDepth(1).setCollideWorldBounds(true);

    // Listener to update game state
    socket.on('game_state', (state) => {
        asteroids = state.asteroids;
        serverShip1Position = state.ships.main;
        serverShip2Position = state.ships.second;
        lastUpdatedTime = performance.now();
        renderGameState(this);
    });

    socket.on('update_position', (data) => {
        if (data.player === 'main') {
            serverShip1Position = data;
        } else if (data.player === 'second') {
            serverShip2Position = data;
        }
        lastUpdatedTime = performance.now();
    });

    // Arrow cursors
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
}

function update() {
    // moving background logic
    this.tileSprite.tilePositionY -= 5;

    // ship movement
    playerMovement.call(this);
    linearInterpolation.call(this);
}

function playerMovement() {
    const speed = 8;

    if (this.cursors.left.isDown) {
        this.main_ship.x -= speed;
        socket.emit('player_move', { player: 'main', x: this.main_ship.x, y: this.main_ship.y });
    } else if (this.cursors.right.isDown) {
        this.main_ship.x += speed;
        socket.emit('player_move', { player: 'main', x: this.main_ship.x, y: this.main_ship.y });
    } else if (this.cursors.up.isDown) {
        this.main_ship.y -= speed;
        socket.emit('player_move', { player: 'main', x: this.main_ship.x, y: this.main_ship.y });
    } else if (this.cursors.down.isDown) {
        this.main_ship.y += speed;
        socket.emit('player_move', { player: 'main', x: this.main_ship.x, y: this.main_ship.y });
    }

    if (this.keyA.isDown) {
        this.second_ship.x -= speed;
        socket.emit('player_move', { player: 'second', x: this.second_ship.x, y: this.second_ship.y });
    } else if (this.keyD.isDown) {
        this.second_ship.x += speed;
        socket.emit('player_move', { player: 'second', x: this.second_ship.x, y: this.second_ship.y });
    } else if (this.keyW.isDown) {
        this.second_ship.y -= speed;
        socket.emit('player_move', { player: 'second', x: this.second_ship.x, y: this.second_ship.y });
    } else if (this.keyS.isDown) {
        this.second_ship.y += speed;
        socket.emit('player_move', { player: 'second', x: this.second_ship.x, y: this.second_ship.y });
    }
}

function linearInterpolation() {
    let now = performance.now();
    let delta = now - lastUpdatedTime;
    let interpolationFactor = Math.min(delta / 5000, 1);

    this.main_ship.x += (serverShip1Position.x - this.main_ship.x) * interpolationFactor;
    this.main_ship.y += (serverShip1Position.y - this.main_ship.y) * interpolationFactor;

    this.second_ship.x += (serverShip2Position.x - this.second_ship.x) * interpolationFactor;
    this.second_ship.y += (serverShip2Position.y - this.second_ship.y) * interpolationFactor;
}

function renderGameState(scene) {
    // Clear the existing asteroids from the group
    scene.asteroidsGroup.clear(true, true);

    // Add new asteroids based on current game state
    for (let asteroid of asteroids) {
        if (asteroid.active) {
            let a = scene.asteroidsGroup.create(asteroid.x, asteroid.y, 'big-asteroid');
            a.setScale(asteroid.scale);
        }
    }
}
