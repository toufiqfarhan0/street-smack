// Sound Engine for Street Smack (Audio, Voice & Music Entirely Removed)
class SoundEngine {
  private enabled: boolean = false;

  public play(_id?: string, _volume?: number): void {
    // Voice and music entirely disabled
  }

  public playHit(): void {
    // Audio entirely disabled
  }

  public playCritical(): void {
    // Audio entirely disabled
  }

  public playKO(): void {
    // Audio entirely disabled
  }

  public toggle(_enabled?: boolean): boolean {
    this.enabled = false;
    return false;
  }
}

export const soundEngine = new SoundEngine();
