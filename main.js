const canvas = document.querySelector("canvas"),
    ctx = canvas.getContext("2d"),
    mini_score_el = document.getElementById("score"),
    button = document.querySelector("button"),
    scoreboard = document.querySelector(".scoreboard"),
    tipEl = document.getElementById("tip"),
    tips = [
        "Enemy projectiles do 15 damage to your health, your bullets do 50 damage to enemy health.",		
        "Score from 20 to 50 points per enemy hit, depending on accuracy.",
        "You will get a health power up at the start of every level.",		
        "Once you start, you can't pause or shrink your browser window.",
    ];

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Mobile detection
function detectMob() {
    const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i,
    ];

    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
}

tipEl.textContent =
    "Use arrow keys to move left and right, space to shoot.";
if (detectMob()) {
    tipEl.textContent = "To keep firing, tap your player.";
    tips.push("To keep firing, tap your player.");
}

let keys = {},
    bullets = [],
    projectiles = [],
    enemies = [],
    sparks = [],
    texts = [],
    score = 0,
    player,
    gravity = 1,
    high_score,
    fire_per_second = 1 / 10;

if (!localStorage.getItem("Hi_Score")) {
    localStorage.setItem("Hi_Score", 0);
    high_score = 0;
} else {
    high_score = parseInt(localStorage.getItem("Hi_Score"));
}

document.addEventListener("keydown", (e) => {
    keys[e.code] = true; // Fire rate of player

    if (keys["Space"]) {
        fireBullet();
    }
});

document.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});

document.addEventListener("touchmove", (e) => {
    keys["TouchX"] = e.touches[0].clientX;
    fireBullet();
});

// Bullets fired by player only
function fireBullet() { 
    // Get current date and slow down fire rate
    let cTime = Date.now(); 
    if ((cTime - player.pTime) / 1000 > fire_per_second) {
        player.pTime = cTime;
        let x = player.x + player.width / 2,
            y = player.y - 20,
            color = player.color,
            velocity = 20;
        bullets.push(new Bullet(x, y, color, velocity));
    }
}

class Player {
    constructor(x, y, color, velocity) {
        this.x = x;
        this.y = y;
        this.width = 100;
        this.height = 10;
        this.color = color;
        this.velocity = velocity || 10;
        this.life = 85;
        this.finalY = canvas.height - 120;
        this.pTime = Date.now();
        this.weight = 0;
    }
    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.font = "25px Arial";
        ctx.fillStyle = this.color;
        ctx.textAlign = "center";
        ctx.fillText(this.life, this.x + this.width / 2, canvas.height - 60);
        ctx.closePath();
        ctx.restore();
    }
    update() {
        // Gravity
        this.y + this.weight <= this.finalY
            ? (this.weight += gravity)
            : (this.weight = 0);

        this.y += this.weight;
        if (keys["ArrowLeft"]) {
            this.x -= this.velocity;
        } else if (keys["ArrowRight"]) {
            this.x += this.velocity;
        } else if (keys["TouchX"]) {
            this.x = keys["TouchX"];
        }

        // collision between wall and player
        if (this.x < 0) {
            this.x = 0;
        } else if (this.x + this.width > canvas.width) {
            this.x = canvas.width - this.width;
        }

        this.draw();
    }
}

player = new Player(canvas.width / 2 - 50, 0, "gold", 15);

class Bullet {
    constructor(x, y, color, velocity) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 50;
        this.color = color;
        this.velocity = velocity || 20;
        this.hitPoint = 50;
    }
    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.closePath();
    }
    update() {
        this.y -= this.velocity;
        this.draw();
    }
}

// Projectiles fired by enemies only
class Projectile {
    constructor(x, y, color, velocity) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 50;
        this.color = color;
        this.velocity = velocity || 10;
        this.hitPoint = 15;
    }
    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.closePath();
    }
    update() {
        this.y += this.velocity;
        this.draw();
    }
}

class Enemy {
    constructor(x, y, color, velocity) {
        this.x = x;
        this.y = y;
        this.width = 100;
        this.height = 10;
        this.color = color;
        this.velocity = velocity || 10;
        this.life = 100; // Enemy life
        this.pTime = Date.now(); // Shooting trigger
        this.finalY = Math.random() * 100 + 50; // Where enemy will fall
    }
    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.font = "25px Arial";
        ctx.fillStyle = this.color;
        ctx.textAlign = "center";
        ctx.fillText(this.life, this.x + this.width / 2, this.y - 20);
        ctx.closePath();
        ctx.restore();
    }
    update() {
        // Gravity
        this.y + this.weight <= this.finalY
            ? (this.weight += gravity)
            : (this.weight = 0);

        this.y += this.weight;
        // Collision between wall and player
        if (this.x < 0) {
            this.velocity = -this.velocity;
        } else if (this.x + this.width > canvas.width) {
            this.velocity = -this.velocity;
        }

        this.x += this.velocity;
        this.draw();
    }
}

class Spark {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius || Math.random() * 2.5 + 0.5;
        this.color = color;
        this.velocity = velocity || {
            x: (Math.random() - 0.5) * (Math.random() * 15),
            y: Math.random() * (Math.random() * 7.5),
        };
        this.alpha = 1;
    }
    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.globalAlpha = this.alpha;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
        this.draw();
    }
}

class DrawText {
    constructor(x, y, text, size, color, velocity) {
        this.x = x;
        this.y = y;
        this.text = text || "Health";
        this.size = size || 30;
        this.color = color || "White";
        this.velocity = velocity || 0;

        this.alpha = 1;
    }
    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.font = `${this.size}px Arial`;
        ctx.fillText(this.text, this.x, this.y);
        ctx.closePath();
    }
    drawAndFade() {
        ctx.save();
        ctx.beginPath();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(this.text, this.x, this.y + this.size / 4);
        ctx.closePath();
        ctx.restore();
    }
    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
        this.drawAndFade();
    }
    updateSize() {
        this.size += this.velocity;
        this.alpha -= 0.01;
        if (this.alpha <= 0) {
            this.alpha = 0;
        }
        this.drawAndFade();
    }
}

function spawnEnemies(x, y, color, velocity) {
    x = x || Math.random() * (canvas.width - 200) + 100;
    y = 0;
    color = color || `hsl(${Math.round(Math.random() * 360)}, 50%, 50%)`;
    velocity =
        velocity || Math.random() < 0.5
            ? Math.random() * 5 + 5
            : -(Math.random() * 5 + 5);

    enemies.push(new Enemy(x, y, color, velocity));
}

// Collision Detection
function collision(o1, o2) {
    if (
        o1.x > o2.x + o2.width ||
        o1.x + o1.width < o2.x ||
        o1.y > o2.y + o2.height ||
        o1.y + o1.height < o2.y
    ) {
        return false;
    } else {
        return true;
    }
}

function generateMultipleEnemies(maxNum) {
    for (let i = 0; i < maxNum; i++) {
        spawnEnemies();
    }
}

let spawnCount = 240,
    enemyCount = 5,
    animateId,
    level = 1,
    levelEl = new DrawText(
        canvas.width / 2,
        canvas.height / 2,
        `Level: ${level}`,
        60,
        "#666",
        7
    ),
    scoreEl = new DrawText(0, 18, `Score: ${score}`, 18, player.color),
    highScoreEl = new DrawText(
        0,
        40,
        `High Score: ${high_score}`,
        18,
        player.color
    );

function animate() {
    animateId = requestAnimationFrame(animate);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // mini-score board configuration
    scoreEl.draw();
    scoreEl.text = `Score: ${score}`;
    highScoreEl.draw();
    highScoreEl.text = `High Score: ${localStorage.getItem(
        "Hi_Score"
    )}`;
    // Generating enemies
    if (enemies.length <= 0) {
        if (spawnCount % 16 == 0) {
            player.life += 1;
            texts.push(
                new DrawText(
                    player.x + player.width * (5 / 6),
                    canvas.height - 65,
                    `+1`,
                    25,
                    player.color,
                    { x: 0, y: 1 }
                )
            );
        }
        spawnCount--;
        levelEl.updateSize();
        levelEl.text = `Level: ${level}`;
        if (spawnCount <= 0) {
            generateMultipleEnemies(enemyCount);
            levelEl.size = 60;
            levelEl.alpha = 1;
            level += 1;
            enemyCount += 2;
            spawnCount = 240;
        }
    }

    // Projectiles
    projectiles.forEach((projectile, index) => {
        projectile.update();
        if (projectile.y > canvas.height) {
            projectiles.splice(index, 1);
        }

        // Collision detection between enemy projectile and player
        if (collision(projectile, player)) {
            projectiles.splice(index, 1);
            player.life -= projectile.hitPoint;
            texts.push(
                new DrawText(
                    player.x + player.width * (5 / 6),
                    canvas.height - 65,
                    `-${projectile.hitPoint}`,
                    25,
                    player.color,
                    { x: 0, y: 1 }
                )
            );

            for (let i = 0; i < 10; i++) {
                sparks.push(
                    new Spark(
                        projectile.x + projectile.width / 2,
                        player.y,
                        Math.random() * 2.5 + 0.5,
                        player.color,
                        {
                            x: (Math.random() - 0.5) * (Math.random() * 15),
                            y: Math.random() * (Math.random() * 7.5) * -1,
                        }
                    )
                );
            }

            if (player.life <= 0) {
                player.life = 0;
                if (score > high_score) {
                    high_score = score;
                    localStorage.setItem("Hi_Score", score);
                }
                cancelAnimationFrame(animateId);
                scoreboard.classList.add("shown");
                mini_score_el.textContent = score;
                tipEl.textContent =
                    tips[Math.round(Math.random() * tips.length)];
            }
        }
    });

    // Enemies
    enemies.forEach((enemy, index) => {
        enemy.update();

        // Projectiles
        let shoot;
        Math.random() < 0.015 ? (shoot = true) : (shoot = false);
        if (shoot) {
            let cTime = Date.now(); // Get the current date
            if ((cTime - enemy.pTime) / 1000 > fire_per_second) {
                enemy.pTime = cTime;
                let x = enemy.x + enemy.width / 2,
                    y = enemy.y,
                    color = enemy.color,
                    velocity = 10;
                projectiles.push(new Projectile(x, y, color, velocity));
            }
        }

        bullets.forEach((bullet, bulletIndex) => {
            // Collision between bullet and enemy
            if (collision(bullet, enemy)) {
                // Enemy kill
                enemy.life -= bullet.hitPoint;
                bullets.splice(bulletIndex, 1);

                // Scoring
                let enemyCollidePoint = enemy.x + enemy.width / 2,
                    bulletCollidePoint = bullet.x + bullet.width / 2,
                    diff = enemyCollidePoint - bulletCollidePoint,
                    oneToZero = diff / (enemy.width / 2);
                oneToZero = Math.abs(oneToZero);
                score += Math.round(50 - 30 * oneToZero); // Score is between 20 to 50

                // Spark generation
                for (let i = 0; i < 10; i++) {
                    sparks.push(
                        new Spark(
                            bulletCollidePoint,
                            enemy.y + enemy.height,
                            Math.random() * 2.5 + 0.5,
                            enemy.color
                        )
                    );
                }

                texts.push(
                    new DrawText(
                        enemy.x + enemy.width * (5 / 6),
                        enemy.y - 20,
                        `-${bullet.hitPoint}`,
                        25,
                        enemy.color,
                        { x: 0, y: -1 }
                    )
                );
            }
        });
        // Enemy death
        if (enemy.life <= 0) {
            enemy.life = 0;
            enemy.width -= 10;
            if (enemy.width <= 0) {
                enemies.splice(index, 1);
            }
        }
    });

    // Sparks
    sparks.forEach((spark, index) => {
        if (spark.alpha <= 0) {
            sparks.splice(index, 1);
        } else {
            spark.update();
        }
    });

    // Player
    player.update();

    // Bullet
    bullets.forEach((Bullet, index) => {
        Bullet.update();
        if (Bullet.y < 0) {
            bullets.splice(index, 1);
        }
    });

    // Texts when health lost
    texts.forEach((text, index) => {
        text.alpha <= 0 ? texts.splice(index, 1) : text.update();
    });

    if (window.innerWidth < 411) {
        player.width = 50;
        enemies.forEach((enemy) => {
            if (enemy.life > 0) {
                enemy.width = 75;
            }
        });
    }

    ctx.fillStyle = player.color;
    ctx.fillRect(0, canvas.height - 100, canvas.width, 10);
}

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

button.addEventListener("click", () => {
    keys = {};
    bullets = [];
    projectiles = [];
    enemies = [];
    sparks = [];
    texts = [];
    score = 0;
    level = 1;
    enemyCount = 5;
    player = new Player(canvas.width / 2 - 50, 0, "gold", 15);
    levelEl.x = canvas.width / 2;
    button.blur();
    animate();
    scoreboard.classList.remove("shown");
    document.querySelector("p").textContent = "You did great!";
});
