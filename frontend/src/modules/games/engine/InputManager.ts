export class InputManager {
  private keys: Set<string> = new Set();
  private touches: Set<number> = new Set();
  private lastInputTime: number = 0;

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('touchstart', this.handleTouchStart);
    window.addEventListener('touchend', this.handleTouchEnd);
    window.addEventListener('mousedown', this.handleMouseDown);
  }

  public dispose() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('mousedown', this.handleMouseDown);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
    this.lastInputTime = performance.now();
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private handleTouchStart = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      this.touches.add(e.changedTouches[i].identifier);
    }
    this.lastInputTime = performance.now();
  };

  private handleTouchEnd = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      this.touches.delete(e.changedTouches[i].identifier);
    }
  };

  private handleMouseDown = () => {
    this.lastInputTime = performance.now();
  };

  public isPressed(code: string): boolean {
    return this.keys.has(code);
  }

  public isAnyInputActive(): boolean {
    return this.keys.size > 0 || this.touches.size > 0;
  }

  public getLastInputTime(): number {
    return this.lastInputTime;
  }
}
