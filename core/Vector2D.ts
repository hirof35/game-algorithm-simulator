export class Vector2D {
    constructor(public x: number = 0, public y: number = 0) {}

    add(v: Vector2D): Vector2D {
        return new Vector2D(this.x + v.x, this.y + v.y);
    }

    sub(v: Vector2D): Vector2D {
        return new Vector2D(this.x - v.x, this.y - v.y);
    }

    mult(n: number): Vector2D {
        return new Vector2D(this.x * n, this.y * n);
    }

    div(n: number): Vector2D {
        return n !== 0 ? new Vector2D(this.x / n, this.y / n) : new Vector2D();
    }

    magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize(): Vector2D {
        const mag = this.magnitude();
        return mag > 0 ? this.div(mag) : new Vector2D();
    }

    limit(max: number): Vector2D {
        if (this.magnitude() > max) {
            return this.normalize().mult(max);
        }
        return new Vector2D(this.x, this.y);
    }

    static dist(v1: Vector2D, v2: Vector2D): number {
        return Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2);
    }
}