function drawUI(ctx, player) {
    ctx.fillStyle = "white";
    ctx.font = "20px monospace";
    ctx.fillText(`❤️ Hearts: ${player.hearts}`, 20, 30);
    ctx.fillText(`🍗 Hunger: ${player.hunger}`, 20, 60);
    ctx.fillText(`⚡ Energy: ${player.energy}`, 20, 90);
}
