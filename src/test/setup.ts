import '@testing-library/jest-dom/vitest';

// Pas de son en test (jsdom n'a ni Web Audio ni lecture HTML5).
vi.mock('@/app/audio', () => ({
  playSound: vi.fn(),
  setSoundEnabled: vi.fn(),
  isSoundEnabled: () => true,
}));
