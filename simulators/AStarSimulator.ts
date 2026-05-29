import { ISimulator } from "./ISimulator";

// グリッドの各セル（ノード）の状態を表す型
interface Node {
    x: number;
    y: number;
    isWall: boolean;
    g: number; // スタートからの実コスト
    h: number; // ゴールまでの推定コスト（ヒューリスティック）
    f: number; // 総コスト (g + h)
    parent: Node | null;
}

export class AStarSimulator implements ISimulator {
    private rows = 30;
    private cols = 40;
    private grid: Node[][] = [];
    
    // 探索用のリスト
    private openSet: Node[] = [];
    private closedSet: Node[] = [];
    private path: Node[] = [];

    private startNode!: Node;
    private endNode!: Node;
    private isFinished = false;

    constructor(private width: number, private height: number) {}

    init(): void {
        this.grid = [];
        this.openSet = [];
        this.closedSet = [];
        this.path = [];
        this.isFinished = false;

        const cellWidth = this.width / this.cols;
        const cellHeight = this.height / this.rows;

        // 1. グリッドの初期化
        for (let i = 0; i < this.cols; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.rows; j++) {
                // 約30%の確率でランダムに壁を配置
                const isWall = Math.random() < 0.3 && !(i === 0 && j === 0) && !(i === this.cols - 1 && j === this.rows - 1);
                this.grid[i][j] = {
                    x: i,
                    y: j,
                    isWall: isWall,
                    g: 0,
                    h: 0,
                    f: 0,
                    parent: null
                };
            }
        }

        // スタートとゴールの固定
        this.startNode = this.grid[0][0];
        this.endNode = this.grid[this.cols - 1][this.rows - 1];
        this.startNode.isWall = false;
        this.endNode.isWall = false;

        // スタートノードを探索候補に追加
        this.openSet.push(this.startNode);
    }

    // マンハッタン距離によるヒューリスティック計算
    private heuristic(a: Node, b: Node): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    // 隣接するノード（上下左右）を取得
    private getNeighbors(node: Node): Node[] {
        const neighbors: Node[] = [];
        const { x, y } = node;

        if (x > 0) neighbors.push(this.grid[x - 1][y]);
        if (x < this.cols - 1) neighbors.push(this.grid[x + 1][y]);
        if (y > 0) neighbors.push(this.grid[x][y - 1]);
        if (y < this.rows - 1) neighbors.push(this.grid[x][y + 1]);

        return neighbors;
    }

    update(): void {
        if (this.isFinished) return;

        // まだ探索候補があればステップを進める（リアルタイム視覚化のため1フレーム1ステップ）
        if (this.openSet.length > 0) {
            // fスコアが最も低いノードを探す
            let lowestIndex = 0;
            for (let i = 0; i < this.openSet.length; i++) {
                if (this.openSet[i].f < this.openSet[lowestIndex].f) {
                    lowestIndex = i;
                }
            }

            const current = this.openSet[lowestIndex];

            // ゴールに到達した場合
            if (current === this.endNode) {
                this.isFinished = true;
                this.reconstructPath(current);
                return;
            }

            // 現在のノードを openSet から closedSet に移動
            this.openSet.splice(lowestIndex, 1);
            this.closedSet.push(current);

            // 隣接ノードの評価
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (this.closedSet.includes(neighbor) || neighbor.isWall) continue;

                // スタートからの暫定実コスト（一歩進むので +1）
                const tentativeG = current.g + 1;

                let newPath = false;
                if (this.openSet.includes(neighbor)) {
                    if (tentativeG < neighbor.g) {
                        neighbor.g = tentativeG;
                        newPath = true;
                    }
                } else {
                    neighbor.g = tentativeG;
                    newPath = true;
                    this.openSet.push(neighbor);
                }

                // スコアの更新と親ノードの記録
                if (newPath) {
                    neighbor.h = this.heuristic(neighbor, this.endNode);
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = current;
                }
            }

            // 現在の暫定最短ルートを構築して描画に備える
            this.reconstructPath(current);
        } else {
            // openSetが空＝経路が見つからなかった
            this.isFinished = true;
        }
    }

    // 親ノードを遡ってルートを復元
    private reconstructPath(current: Node): void {
        this.path = [];
        let temp: Node | null = current;
        while (temp) {
            this.path.push(temp);
            temp = temp.parent;
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.clearRect(0, 0, this.width, this.height);

        const cellWidth = this.width / this.cols;
        const cellHeight = this.height / this.rows;

        // グリッド全体の描画
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                const node = this.grid[i][j];
                
                if (node.isWall) {
                    ctx.fillStyle = "#333333"; // 壁
                } else if (this.path.includes(node)) {
                    ctx.fillStyle = "#ff007f"; // 確定・暫定ルート（ピンク）
                } else if (this.closedSet.includes(node)) {
                    ctx.fillStyle = "rgba(255, 0, 0, 0.2)"; // 探索済み（薄赤）
                } else if (this.openSet.includes(node)) {
                    ctx.fillStyle = "rgba(0, 255, 0, 0.2)"; // 探索候補（薄緑）
                } else {
                    ctx.fillStyle = "#111111"; // 未探索の床
                }

                ctx.fillRect(i * cellWidth, j * cellHeight, cellWidth - 1, cellHeight - 1);
            }
        }

        // スタートとゴールの強調表示
        ctx.fillStyle = "#00ffcc"; // スタート
        ctx.fillRect(this.startNode.x * cellWidth, this.startNode.y * cellHeight, cellWidth - 1, cellHeight - 1);

        ctx.fillStyle = "#ffcc00"; // ゴール
        ctx.fillRect(this.endNode.x * cellWidth, this.endNode.y * cellHeight, cellWidth - 1, cellHeight - 1);
    }

    handleInteraction(x: number, y: number, type: string): void {
        if (type === "click") {
            // クリックでリセットして新しいランダムマップで再計算
            this.init();
        }
    }
}