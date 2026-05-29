export interface ISimulator {
    init(): void;
    update(): void;
    render(ctx: CanvasRenderingContext2D): void;
    handleInteraction(x: number, y: number, type: string): void;
}