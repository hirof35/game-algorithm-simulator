import { ISimulator } from "./simulators/ISimulator";
import { BoidsSimulator } from "./simulators/BoidsSimulator";
import { AStarSimulator } from "./simulators/AStarSimulator";
import { MazeSimulator } from "./simulators/MazeSimulator";
import { GridCollisionSimulator } from "./simulators/GridCollisionSimulator";

class SimulationApp {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private currentSimulator!: ISimulator;
    
    // シミュレーターのリスト
    private simulators: { [key: string]: ISimulator };
    private activeKey: string = "boids";

    constructor() {
        this.canvas = document.getElementById("simCanvas") as HTMLCanvasElement;
        this.ctx = this.canvas.getContext("2d")!;
        
        this.canvas.width = 800;
        this.canvas.height = 600;

        // 全てのシミュレーターを初期化
        this.simulators = {
            boids: new BoidsSimulator(this.canvas.width, this.canvas.height),
            astar: new AStarSimulator(this.canvas.width, this.canvas.height),
            maze: new MazeSimulator(this.canvas.width, this.canvas.height),
            collision: new GridCollisionSimulator(this.canvas.width, this.canvas.height)
        };

        // 初期シミュレーターの設定
        this.switchSimulator(this.activeKey);

        this.initUI();
        this.initEvents();
        this.loop();
    }

    // シミュレーターを切り替えるメソッド
    private switchSimulator(key: string) {
        if (this.simulators[key]) {
            this.activeKey = key;
            this.currentSimulator = this.simulators[key];
            this.currentSimulator.init(); // 切り替え時に初期化
            this.updateButtonStates();
        }
    }

    // 動的にUIボタンを生成・制御
    private initUI() {
        const btnContainer = document.getElementById("btnContainer");
        if (!btnContainer) return;

        const menuItems = [
            { key: "boids", label: "Boids (群れ制御)" },
            { key: "astar", label: "A* (経路探索)" },
            { key: "maze", label: "穴掘り法 (迷路生成)" },
            { key: "collision", label: "空間分割 (衝突判定)" }
        ];

        menuItems.forEach(item => {
            const btn = document.createElement("button");
            btn.innerText = item.label;
            btn.id = `btn-${item.key}`;
            btn.addEventListener("click", () => this.switchSimulator(item.key));
            btnContainer.appendChild(btn);
        });
    }

    // アクティブなボタンのスタイルを変更するためのクラス制御
    private updateButtonStates() {
        const buttons = document.querySelectorAll("#btnContainer button");
        buttons.forEach(btn => btn.classList.remove("active"));
        
        const activeBtn = document.getElementById(`btn-${this.activeKey}`);
        if (activeBtn) activeBtn.classList.add("active");
    }

    private initEvents() {
        // キャンバス内のクリックイベントを現在のシミュレーターに委譲
        this.canvas.addEventListener("click", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.currentSimulator.handleInteraction(x, y, "click");
        });
    }

    // 共通ゲームループ
    private loop = () => {
        // 描画バッファのクリアは各アルゴリズムの挙動（残像エフェクト等）に任せるため
        // updateとrenderをただ呼び出す抽象的なループを維持
        this.currentSimulator.update();
        this.currentSimulator.render(this.ctx);
        requestAnimationFrame(this.loop);
    };
}

window.addEventListener("DOMContentLoaded", () => {
    new SimulationApp();
});