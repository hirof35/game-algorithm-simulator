import { ISimulator } from "./ISimulator";

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    isColliding: boolean;
}

export class GridCollisionSimulator implements ISimulator {
    private particles: Particle[] = [];
    private particleCount = 2000; // 総当たりではフリーズするレベルの数

    // グリッド空間分割用の設定
    private cellSize = 40; // 1マスのサイズ（粒子の直径より大きく設定）
    private cols: number;
    private rows: number;
    private grid: Map<string, Particle[]> = new Map();

    constructor(private width: number, private height: number) {
        this.cols = Math.ceil(this.width / this.cellSize);
        this.rows = Math.ceil(this.height / this.cellSize);
    }

    init(): void {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                id: i,
                x: Math.random() * (this.width - 20) + 10,
                y: Math.random() * (this.height - 20) + 10,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                radius: 3,
                isColliding: false
            });
        }
    }

    update(): void {
        // 1. 粒子の移動と壁判定
        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.isColliding = false; // フラグリセット

            // 壁バウンド
            if (p.x - p.radius < 0 || p.x + p.radius > this.width)  p.vx *= -1;
            if (p.y - p.radius < 0 || p.y + p.radius > this.height) p.vy *= -1;
        }

        // 2. 空間分割（グリッドへの登録）
        this.grid.clear();
        for (const p of this.particles) {
            const cellX = Math.floor(p.x / this.cellSize);
            const cellY = Math.floor(p.y / this.cellSize);
            const key = `${cellX},${cellY}`;

            if (!this.grid.has(key)) {
                this.grid.set(key, []);
            }
            this.grid.get(key)!.push(p);
        }

        // 3. 衝突判定（隣接9マスだけをチェック）
        for (const p1 of this.particles) {
            const cellX = Math.floor(p1.x / this.cellSize);
            const cellY = Math.floor(p1.y / this.cellSize);

            // 周囲9マスを探索
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const targetKey = `${cellX + dx},${cellY + dy}`;
                    const neighbors = this.grid.get(targetKey);

                    if (!neighbors) continue;

                    for (const p2 of neighbors) {
                        if (p1.id >= p2.id) continue; // 重複判定を回避

                        // 距離の二乗で円の衝突判定（Math.sqrtを避けて高速化）
                        const distSq = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
                        const minDist = p1.radius + p2.radius;

                        if (distSq < minDist ** 2) {
                            p1.isColliding = true;
                            p2.isColliding = true;

                            // 簡易的な弾性衝突（ベクトル反転）
                            const tempVx = p1.vx;
                            const tempVy = p1.vy;
                            p1.vx = p2.vx;
                            p1.vy = p2.vy;
                            p2.vx = tempVx;
                            p2.vy = tempVy;
                        }
                    }
                }
            }
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = "#111116";
        ctx.fillRect(0, 0, this.width, this.height);

        // ガイド用のグリッド線の描画（空間分割の可視化）
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= this.cols; i++) {
            ctx.beginPath();
            ctx.moveTo(i * this.cellSize, 0);
            ctx.lineTo(i * this.cellSize, this.height);
            ctx.stroke();
        }
        for (let j = 0; j <= this.rows; j++) {
            ctx.beginPath();
            ctx.moveTo(0, j * this.cellSize);
            ctx.lineTo(this.width, j * this.cellSize);
            ctx.stroke();
        }

        // 粒子の描画（衝突しているものは赤、それ以外は緑）
        for (const p of this.particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.isColliding ? "#ff3366" : "#00ffaa";
            ctx.fill();
        }

        // デバッグ情報の描画
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px monospace";
        ctx.fillText(`Particles: ${this.particleCount}`, 20, 30);
        ctx.fillText(`Grid Cell Size: ${this.cellSize}px`, 20, 50);
    }

    handleInteraction(x: number, y: number, type: string): void {
        if (type === "click") {
            this.init(); // 粒子を再配置
        }
    }
}