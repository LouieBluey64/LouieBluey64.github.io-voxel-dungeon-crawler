const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let keys = {};
let dungeon = generateDungeon(50, 50);
let player = new Player(5, 5);

window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update
    player.update(keys, dungeon);

    // Draw dungeon
    drawDungeon(ctx, dungeon, player);

    // Draw player
    player.draw(ctx);

    // Draw UI
    drawUI(ctx, player);

    requestAnimationFrame(gameLoop);
}

gameLoop();
