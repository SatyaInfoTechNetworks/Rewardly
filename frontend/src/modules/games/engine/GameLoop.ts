export class GameLoop {
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly step: number = 1 / 60;
  private isRunning: boolean = false;
  private animationId: number | null = null;

  constructor(
    private update: (dt: number) => void,
    private render: (interpolation: number) => void
  ) {}

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    const frameTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Cap frame time to prevent "spiral of death"
    const dt = Math.min(frameTime, 0.25);
    this.accumulator += dt;

    while (this.accumulator >= this.step) {
      this.update(this.step);
      this.accumulator -= this.step;
    }

    this.render(this.accumulator / this.step);
    this.animationId = requestAnimationFrame(this.loop);
  };
}
