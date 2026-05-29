import { ISimulator } from "./ISimulator";

interface Cell {
    x: number;
    y: number;
    isWall: boolean;
}

export class MazeSimulator implements ISimulator {
    // 穴掘り法は「奇数」のグリッドサイズである必要があります（道と壁の境界を維持するため）
    private rows = 31;
    private cols = 41;
    private grid: Cell[][] = [];
    
    // 穴掘りトラッキング用のスタック（経路の履歴）
    private stack: Cell[] = [];
    private currentCell!: Cell;
    private isFinished = false;

    constructor(private width: number, private height: number) {}

    init(): void {
        this.grid = [];
        this.stack = [];
        this.isFinished = false;

        // 1. 最初はすべてのマスを「壁」で埋める
        for (let i = 0; i < this.cols; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.rows; j++) {
                this.grid[i][j] = {
                    x: i,
                    y: j,
                    isWall: true
                };
            }
        }

        // 2. 開始地点を決定（奇数座標からスタート）
        this.currentCell = this.grid[1][1];
        this.currentCell.isWall = false;
        this.stack.push(this.currentCell);
    }

    // 現在のセルから2マス先にある「まだ掘られていない（壁である）隣接セル」を探す
    private getUnvisitedNeighbors(cell: Cell): Cell[] {
        const neighbors: Cell[] = [];
        const { x, y } = cell;

        // 上下左右に2マス先をチェック
        if (y > 1 && this.grid[x][y - 2].isWall) neighbors.push(this.grid[x][y - 2]);
        if (x < this.cols - 2 && this.grid[x + 2][y].isWall) neighbors.push(this.grid[x + 2][y]);
        if (y < this.rows - 2 && this.grid[x][y + 2].isWall) neighbors.push(this.grid[x][y + 2]);
        if (x > 1 && this.grid[x - 2][y].isWall) neighbors.push(this.grid[x - 2][y]);

        return neighbors;
    }

    update(): void {
        if (this.isFinished) return;

        // 1フレームにつき1ステップ掘り進める
        if (this.stack.length > 0) {
            const neighbors = this.getUnvisitedNeighbors(this.currentCell);

            if (neighbors.length > 0) {
                // ランダムに進む方向を選ぶ
                const nextCell = neighbors[Math.floor(Math.random() * neighbors.length)];

                // 現在のセルと次のセルの「中間のマス」も道にする（壁を壊す）
                const midX = (this.currentCell.x + nextCell.x) / 2;
                const midY = (this.currentCell.y + nextCell.y) / 2;
                this.grid[midX][midY].isWall = false;

                // 次のセルを道にして、スタックに積む
                nextCell.isWall = false;
                this.stack.push(nextCell);
                
                // 現在地を更新
                this.currentCell = nextCell;
            } else {
                // 行き止まりになったらスタックをポップして前のセルに戻る（バックトラック）
                this.currentCell = this.stack.pop()!;
            }
        } else {
            // スタックが空になったら迷路完成
            this.isFinished = true;
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.clearRect(0, 0, this.width, this.height);

        const cellWidth = this.width / this.cols;
        const cellHeight = this.height / this.rows;

        // グリッド全体の描画
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                const cell = this.grid[i][j];
                
                if (cell.isWall) {
                    ctx.fillStyle = "#22223b"; // 壁（ダークネイビー）
                } else {
                    ctx.fillStyle = "#f7f7f9"; // 通路（白系）
                }

                ctx.fillRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
            }
        }

        // 現在掘り進めている先頭（ドリルヘッド）を赤く光らせる
        if (!this.isFinished && this.currentCell) {
            ctx.fillStyle = "#ff0055";
            ctx.fillRect(this.currentCell.x * cellWidth, this.currentCell.y * cellHeight, cellWidth, cellHeight);
        }
    }

    handleInteraction(x: number, y: number, type: string): void {
        if (type === "click") {
            // クリックでリセットして新しい迷路を生成
            this.init();
        }
    }
}