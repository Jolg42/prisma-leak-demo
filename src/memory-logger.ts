const MIN_LOGGING_INTERVAL_MS = 30 * 1000;

export class MemoryLogger {
  lastLoggedTime = 0;
  initialLoggedTime = 0;

  maybeLog(): void {
    const now = Date.now();
    if (now - this.lastLoggedTime < MIN_LOGGING_INTERVAL_MS) {
      return;
    }

    if (this.initialLoggedTime === 0) {
      this.initialLoggedTime = now;
      this.logHeaders();
    }

    const ellapsedSeconds = (now - this.initialLoggedTime) / 1000;

    const usage = process.memoryUsage();
    console.log(
      `${ellapsedSeconds.toFixed(3)},${toMib(usage.rss)},${toMib(
        usage.heapTotal,
      )},${toMib(usage.heapUsed)},${toMib(usage.external)},${toMib(
        usage.arrayBuffers,
      )},`,
    );
    this.lastLoggedTime = now;
  }

  private logHeaders(): void {
    console.log(
      'time,rss (MiB),heapTotal (MiB),heapUsed (MiB),external (MiB),arrayBuffers (MiB)',
    );
  }
}

function toMib(b: number): string {
  return (b / 1024 / 1024).toPrecision(4);
}
