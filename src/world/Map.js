// Simple tile-based map
export class Map {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tileSize = 32;
        this.tiles = this.generateMap();
    }

    generateMap() {
        const tiles = [];

        for (let y = 0; y < this.height; y++) {
            tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Simple grass/dirt pattern
                if (Math.random() < 0.1) {
                    tiles[y][x] = { type: 'dirt', color: '#654321' };
                } else {
                    tiles[y][x] = { type: 'grass', color: '#228822' };
                }
            }
        }

        return tiles;
    }

    render(ctx, camera) {
        const startX = Math.floor(camera.x / this.tileSize);
        const startY = Math.floor(camera.y / this.tileSize);
        const endX = Math.min(startX + Math.ceil(camera.width / this.tileSize) + 1, this.width);
        const endY = Math.min(startY + Math.ceil(camera.height / this.tileSize) + 1, this.height);

        for (let y = Math.max(0, startY); y < endY; y++) {
            for (let x = Math.max(0, startX); x < endX; x++) {
                const tile = this.tiles[y][x];
                const screenX = x * this.tileSize - camera.x;
                const screenY = y * this.tileSize - camera.y;

                ctx.fillStyle = tile.color;
                ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);

                // Draw grid lines
                ctx.strokeStyle = '#00000020';
                ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
            }
        }
    }

    isWalkable(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);

        if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
            return false;
        }

        return true; // All tiles walkable for now
    }
}
