import { describe, expect, it, vi } from 'vitest';
import { createShakaEngine, type ShakaPlayerLike } from './shaka-engine';

describe('Shaka stream information', () => {
  it.each([
    ['ec-3', true, true],
    [' EC-3 ', true, true],
    ['ec-3', false, false],
    ['ec-3', undefined, false],
    ['ac-4', true, false],
    ['mp4a.40.2', true, false],
  ] as const)('maps codec %s and spatialAudio %s to Atmos %s', (audioCodec, spatialAudio, expected) => {
    const track = {
      active: true, audioCodec, spatialAudio, channelsCount: 6,
      videoCodec: 'dvh1.05.06', hdr: 'PQ', frameRate: 59.94,
    };
    const player: ShakaPlayerLike = {
      getAudioTracks: () => [],
      getTextTracks: () => [],
      getVariantTracks: () => [track],
      selectAudioTrack: vi.fn(),
      selectTextTrack: vi.fn(),
      isLive: () => false,
      seekRange: () => ({ start: 0, end: 0 }),
      destroy: vi.fn(),
    };
    const engine = createShakaEngine(player);
    expect(engine.streamInfo()).toEqual({
      videoCodec: 'dvh1.05.06', audioCodec, videoRange: 'PQ',
      frameRate: 59.94, audioChannels: '6', audioAtmos: expected,
    });
    track.active = false;
    expect(engine.streamInfo()).toBeNull();
  });
});

describe('Shaka live window', () => {
  const player = (live: boolean, start: number, end: number): ShakaPlayerLike => ({
    getAudioTracks: () => [],
    getTextTracks: () => [],
    getVariantTracks: () => [],
    selectAudioTrack: vi.fn(),
    selectTextTrack: vi.fn(),
    isLive: () => live,
    seekRange: () => ({ start, end }),
    destroy: vi.fn(),
  });

  it('is Shaka\'s seek range for a live stream, whatever the element\'s duration', () => {
    expect(createShakaEngine(player(true, 1000, 3200)).liveWindow()).toEqual({ start: 1000, end: 3200 });
  });

  it('is null for VOD and for a range that is not finite', () => {
    expect(createShakaEngine(player(false, 0, 5400)).liveWindow()).toBeNull();
    expect(createShakaEngine(player(true, 0, Infinity)).liveWindow()).toBeNull();
  });
});
