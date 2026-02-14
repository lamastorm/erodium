// Camera system for following the player
export class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.target = null;
        this.smoothing = 0.1; // Camera smoothing (0-1)
    }

    setTarget(entity) {
        this.target = entity;
    }

    update() {
        if (!this.target) return;

        // Center camera on target
        const targetX = this.target.x - this.width / 2 + this.target.width / 2;
        const targetY = this.target.y - this.height / 2 + this.target.height / 2;

        // Smooth camera movement
        this.x += (targetX - this.x) * this.smoothing;
        this.y += (targetY - this.y) * this.smoothing;
    }

    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }
}
