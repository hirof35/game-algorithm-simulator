import { ISimulator } from "./ISimulator";
import { Vector2D } from "../core/Vector2D";

class Boid {
    position: Vector2D;
    velocity: Vector2D;
    acceleration: Vector2D;
    maxSpeed = 3;
    maxForce = 0.05;

    constructor(x: number, y: number) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(Math.random() * 2 - 1, Math.random() * 2 - 1);
        this.acceleration = new Vector2D();
    }

    update(width: number, height: number) {
        this.velocity = this.velocity.add(this.acceleration).limit(this.maxSpeed);
        this.position = this.position.add(this.velocity);
        this.acceleration = this.acceleration.mult(0); // リセット

        // 画面端のループ処理
        if (this.position.x < 0) this.position.x = width;
        if (this.position.x > width) this.position.x = 0;
        if (this.position.y < 0) this.position.y = height;
        if (this.position.y > height) this.position.y = 0;
    }

    applyForce(force: Vector2D) {
        this.acceleration = this.acceleration.add(force);
    }

    // 群れのロジック（簡略化のため合算。本来は分離・整列・結合を計算）
    flock(boids: Boid[]) {
        let perceiveRadius = 50;
        let steering = new Vector2D();
        let total = 0;

        for (let other of boids) {
            let d = Vector2D.dist(this.position, other.position);
            if (other !== this && d < perceiveRadius) {
                steering = steering.add(other.position.sub(this.position));
                total++;
            }
        }
        if (total > 0) {
            steering = steering.div(total);
            steering = steering.sub(this.velocity).limit(this.maxForce);
            this.applyForce(steering);
        }
    }
}

export class BoidsSimulator implements ISimulator {
    private boids: Boid[] = [];

    constructor(private width: number, private height: number) {}

    init() {
        for (let i = 0; i < 100; i++) {
            this.boids.push(new Boid(Math.random() * this.width, Math.random() * this.height));
        }
    }

    update() {
        for (let boid of this.boids) {
            boid.flock(this.boids);
            boid.update(this.width, this.height);
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)"; // 残像エフェクト
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = "#00ffcc";
        for (let boid of this.boids) {
            ctx.beginPath();
            ctx.arc(boid.position.x, boid.position.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    handleInteraction(x: number, y: number, type: string) {
        if (type === "click") {
            // クリックした場所に新しい個体を追加
            this.boids.push(new Boid(x, y));
        }
    }
}