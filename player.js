class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 32;
        this.color = "red";
        this.speed = 0.1;
        this.hearts = 10;
        this.hunger = 10;
        this.energy = 10;
    }

    update(keys, dungeon) {
        if (keys["ArrowUp"]) this.y -= this.speed;
        if (keys["ArrowDown"]) this.y += this.speed;
        if (keys["ArrowLeft"]) this.x -= this.speed;
        if (keys["ArrowRight"]) this.x += this.speed;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            canvas.width / 2 - this.size / 2,
            canvas.height / 2 - this.size / 2,
            this.size,
            this.size
        );
    }
}
