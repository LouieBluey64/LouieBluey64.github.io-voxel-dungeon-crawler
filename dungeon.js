function generateDungeon(width, height) {
    let dungeon = [];
    for (let y = 0; y < height; y++) {
        let row = [];
        for (let x = 0; x < width; x++) {
            row.push(Math.random() > 0.2 ? 0 : 1); // 0 = floor, 1 = wall
        }
        dungeon.push(row);
    }
    return dungeon;
}

function drawDungeon(ctx, dungeon, player) {
    const tileSize = 32;
    const offsetX = canvas.width / 2 - player.x * tileSize;
    const offsetY = canvas.height / 2 - player.y * tileSize;

    for (let y = 0; y < dungeon.length; y++) {
        for (let x = 0; x < dungeon[y].length; x++) {
            ctx.fillStyle = dungeon[y][x] === 0 ? "#333" : "#555";
            ctx.fillRect(
                x * tileSize + offsetX,
                y * tileSize + offsetY,
                tileSize,
                tileSize
            );
        }
    }
}
