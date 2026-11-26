import React from 'react';
import {
  FlexWidget,
  ImageWidget,
  OverlapWidget,
  SvgWidget,
  TextWidget,
  type ColorProp,
  type ImageWidgetSource,
} from 'react-native-android-widget';
import {
  DEFAULT_WIDGET_THEME,
  hexToRgba,
  type WidgetThemeColors,
} from '../theme/songPalette';

export interface PulseBeatWidgetProps {
  title: string;
  artist: string;
  artwork?: ImageWidgetSource;
  isPlaying: boolean;
  hasSong: boolean;
  position: number;
  duration: number;
  isShuffle: boolean;
  isRepeat: boolean;
  theme?: WidgetThemeColors;
  width?: number;
  height?: number;
}

const DEFAULT_ARTWORK =
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300' as const;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const totalSec = Math.floor(seconds);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function buildLiquidGlassBgSvg(
  w: number,
  h: number,
  theme: WidgetThemeColors,
): string {
  const safeW = Math.max(Math.round(w), 240);
  const safeH = Math.max(Math.round(h), 120);
  const r = 26;

  return `
<svg width="${safeW}" height="${safeH}" viewBox="0 0 ${safeW} ${safeH}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="glassBase" x1="0" y1="0" x2="0.85" y2="1">
      <stop offset="0%" stop-color="${theme.glassTop}" stop-opacity="0.90" />
      <stop offset="48%" stop-color="${theme.glassMid}" stop-opacity="0.92" />
      <stop offset="100%" stop-color="${theme.glassBottom}" stop-opacity="0.95" />
    </linearGradient>

    <radialGradient id="topLeftGlow" cx="0.14" cy="0.22" r="0.54">
      <stop offset="0%" stop-color="${theme.glowPrimary}" stop-opacity="0.34" />
      <stop offset="50%" stop-color="${theme.glowSecondary}" stop-opacity="0.14" />
      <stop offset="100%" stop-color="${theme.glassBottom}" stop-opacity="0.00" />
    </radialGradient>

    <radialGradient id="bottomCenterGlow" cx="0.50" cy="0.86" r="0.46">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.26" />
      <stop offset="55%" stop-color="${theme.glowSecondary}" stop-opacity="0.10" />
      <stop offset="100%" stop-color="${theme.glassBottom}" stop-opacity="0.00" />
    </radialGradient>

    <radialGradient id="bottomRightGlow" cx="0.88" cy="0.88" r="0.40">
      <stop offset="0%" stop-color="${theme.glowSecondary}" stop-opacity="0.22" />
      <stop offset="100%" stop-color="${theme.glassBottom}" stop-opacity="0.00" />
    </radialGradient>

    <linearGradient id="topSpecular" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.22" />
      <stop offset="45%" stop-color="${theme.accentLight}" stop-opacity="0.07" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.00" />
    </linearGradient>

    <linearGradient id="liquidWave" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.10" />
      <stop offset="50%" stop-color="${theme.accentLight}" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.02" />
    </linearGradient>

    <linearGradient id="rimStroke" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.rimStart}" stop-opacity="0.72" />
      <stop offset="30%" stop-color="#FFFFFF" stop-opacity="0.34" />
      <stop offset="68%" stop-color="${theme.accentLight}" stop-opacity="0.24" />
      <stop offset="100%" stop-color="${theme.rimEnd}" stop-opacity="0.68" />
    </linearGradient>

    <clipPath id="cardClip">
      <rect x="0" y="0" width="${safeW}" height="${safeH}" rx="${r}" ry="${r}" />
    </clipPath>
  </defs>

  <g clip-path="url(#cardClip)">
    <rect x="0" y="0" width="${safeW}" height="${safeH}" fill="url(#glassBase)" />
    <rect x="0" y="0" width="${safeW}" height="${safeH}" fill="url(#topLeftGlow)" />
    <rect x="0" y="0" width="${safeW}" height="${safeH}" fill="url(#bottomCenterGlow)" />
    <rect x="0" y="0" width="${safeW}" height="${safeH}" fill="url(#bottomRightGlow)" />

    <!-- Soft Top Glass Highlight -->
    <path d="M0,0 H${safeW} V${Math.round(safeH * 0.36)} C${Math.round(safeW * 0.68)},${Math.round(safeH * 0.18)} ${Math.round(safeW * 0.28)},${Math.round(safeH * 0.44)} 0,${Math.round(safeH * 0.28)} Z" fill="url(#topSpecular)" />

    <!-- Flowing Liquid Glass Wave -->
    <path d="M0,${Math.round(safeH * 0.62)} C${Math.round(safeW * 0.24)},${Math.round(safeH * 0.48)} ${Math.round(safeW * 0.56)},${Math.round(safeH * 0.78)} ${safeW},${Math.round(safeH * 0.58)} V${safeH} H0 Z" fill="url(#liquidWave)" />
    <path d="M0,${Math.round(safeH * 0.78)} C${Math.round(safeW * 0.34)},${Math.round(safeH * 0.68)} ${Math.round(safeW * 0.66)},${Math.round(safeH * 0.94)} ${safeW},${Math.round(safeH * 0.72)} V${safeH} H0 Z" fill="#FFFFFF" fill-opacity="0.04" />
  </g>

  <!-- Luminous Liquid Glass Rim Border -->
  <rect x="1" y="1" width="${safeW - 2}" height="${safeH - 2}" rx="${r - 1}" ry="${r - 1}" fill="none" stroke="url(#rimStroke)" stroke-width="1.6" />
</svg>
`;
}

function buildProgressBarSvg(
  width: number,
  ratio: number,
  theme: WidgetThemeColors,
): string {
  const safeW = Math.max(Math.round(width), 160);
  const h = 14;
  const cy = 7;
  const pad = 6;
  const trackW = safeW - pad * 2;
  const clamped = Math.min(Math.max(ratio, 0), 1);
  const thumbX = pad + trackW * clamped;

  return `
<svg width="${safeW}" height="${h}" viewBox="0 0 ${safeW} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="progGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${theme.accent}" />
      <stop offset="100%" stop-color="${theme.accentLight}" />
    </linearGradient>
  </defs>
  <line x1="${pad}" y1="${cy}" x2="${safeW - pad}" y2="${cy}" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="4" stroke-linecap="round" />
  ${
    clamped > 0.005
      ? `<line x1="${pad}" y1="${cy}" x2="${thumbX.toFixed(1)}" y2="${cy}" stroke="url(#progGrad)" stroke-width="4" stroke-linecap="round" />`
      : ''
  }
  <circle cx="${thumbX.toFixed(1)}" cy="${cy}" r="7" fill="${theme.accent}" fill-opacity="0.30" />
  <circle cx="${thumbX.toFixed(1)}" cy="${cy}" r="5" fill="${theme.accentLight}" />
</svg>
`;
}

function buildEqualizerSvg(theme: WidgetThemeColors): string {
  return `
<svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="5" width="2" height="5" rx="1" fill="${theme.labelAccent}" />
  <rect x="5" y="2" width="2" height="10" rx="1" fill="${theme.accentLight}" />
  <rect x="9" y="4" width="2" height="6" rx="1" fill="${theme.labelAccent}" />
  <rect x="13" y="1" width="2" height="12" rx="1" fill="${theme.accentLight}" />
</svg>
`;
}

function buildBrandWavesSvg(theme: WidgetThemeColors): string {
  return `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10.5" fill="#FFFFFF" fill-opacity="0.86" />
  <path d="M6.8 9.6C10.1 8.5 14.3 8.8 17.3 10.6" stroke="${theme.glassBottom}" stroke-width="1.8" stroke-linecap="round" />
  <path d="M7.6 12.6C10.4 11.7 13.8 12.0 16.3 13.5" stroke="${theme.glassBottom}" stroke-width="1.6" stroke-linecap="round" />
  <path d="M8.5 15.4C10.8 14.7 13.3 14.9 15.3 16.1" stroke="${theme.glassBottom}" stroke-width="1.4" stroke-linecap="round" />
</svg>
`;
}

function buildShuffleSvg(active: boolean, activeColor: string): string {
  const color = active ? activeColor : '#F8FAFC';
  return `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 3H21V8" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M4 20L21 3" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M21 16V21H16" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M15 15L21 21" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M4 4L9 9" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`;
}

function buildRepeatSvg(active: boolean, activeColor: string): string {
  const color = active ? activeColor : '#F8FAFC';
  return `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 1L21 5L17 9" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M3 11V9C3 7.93913 3.42143 6.92172 4.17157 6.17157C4.92172 5.42143 5.93913 5 7 5H21" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M7 23L3 19L7 15" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M21 13V15C21 16.0609 20.5786 17.0783 19.8284 17.8284C19.0783 18.5786 18.0609 19 17 19H3" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`;
}

const PREV_ICON_SVG = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="5" width="2.5" height="14" rx="1.25" fill="#F8FAFC" />
  <path d="M18.5 5.6V18.4C18.5 19.2 17.6 19.7 16.9 19.2L8.9 12.8C8.4 12.4 8.4 11.6 8.9 11.2L16.9 4.8C17.6 4.3 18.5 4.8 18.5 5.6Z" fill="#F8FAFC" />
</svg>
`;

const NEXT_ICON_SVG = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5.5 5.6V18.4C5.5 19.2 6.4 19.7 7.1 19.2L15.1 12.8C15.6 12.4 15.6 11.6 15.1 11.2L7.1 4.8C6.4 4.3 5.5 4.8 5.5 5.6Z" fill="#F8FAFC" />
  <rect x="16.5" y="5" width="2.5" height="14" rx="1.25" fill="#F8FAFC" />
</svg>
`;

function buildPlaySvg(iconColor: string): string {
  return `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 5.2C8 4.4 8.9 3.9 9.6 4.4L19.4 11.2C20.0 11.6 20.0 12.4 19.4 12.8L9.6 19.6C8.9 20.1 8 19.6 8 18.8V5.2Z" fill="${iconColor}" />
</svg>
`;
}

function buildPauseSvg(iconColor: string): string {
  return `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="6.5" y="5" width="3.8" height="14" rx="1.5" fill="${iconColor}" />
  <rect x="13.7" y="5" width="3.8" height="14" rx="1.5" fill="${iconColor}" />
</svg>
`;
}

const SEEK_SEGMENTS = [0, 0.12, 0.23, 0.34, 0.45, 0.56, 0.67, 0.78, 0.89, 0.96];

function GlassControlButton({
  clickAction,
  svg,
  size,
  iconSize,
  theme,
  primary = false,
  active = false,
}: {
  clickAction: string;
  svg: string;
  size: number;
  iconSize: number;
  theme: WidgetThemeColors;
  primary?: boolean;
  active?: boolean;
}) {
  return (
    <FlexWidget
      clickAction={clickAction}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: (primary
          ? theme.accent
          : active
          ? hexToRgba(theme.accent, 0.18)
          : 'rgba(255, 255, 255, 0.12)') as ColorProp,
        borderColor: (primary
          ? theme.accentLight
          : active
          ? hexToRgba(theme.accent, 0.5)
          : 'rgba(255, 255, 255, 0.16)') as ColorProp,
        borderWidth: primary ? 1.5 : 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <SvgWidget
        svg={svg}
        style={{
          width: iconSize,
          height: iconSize,
        }}
      />
    </FlexWidget>
  );
}

export function PulseBeatWidget({
  title,
  artist,
  artwork,
  isPlaying,
  hasSong,
  position,
  duration,
  isShuffle,
  isRepeat,
  theme = DEFAULT_WIDGET_THEME,
  width = 330,
  height = 195,
}: PulseBeatWidgetProps) {
  const isCompact = height < 130;
  const artworkSource: ImageWidgetSource = artwork || DEFAULT_ARTWORK;
  const glassSvg = buildLiquidGlassBgSvg(width, height, theme);
  const ratio = duration > 0 ? position / duration : 0;
  const barWidth = Math.max(width - 36, 160);
  const progressSvg = buildProgressBarSvg(barWidth, ratio, theme);
  const playPauseSvg = isPlaying
    ? buildPauseSvg(theme.onAccent)
    : buildPlaySvg(theme.onAccent);

  return (
    <OverlapWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        borderRadius: 26,
      }}
    >
      <SvgWidget
        svg={glassSvg}
        style={{
          height: 'match_parent',
          width: 'match_parent',
        }}
      />

      {isCompact ? (
        <FlexWidget
          style={{
            height: 'match_parent',
            width: 'match_parent',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <FlexWidget
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 10,
            }}
          >
            <FlexWidget
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: hexToRgba(theme.artBorder, 0.6) as ColorProp,
                backgroundColor: 'rgba(16, 28, 13, 0.8)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ImageWidget
                image={artworkSource}
                imageWidth={45}
                imageHeight={45}
                radius={11}
                resizeMode="cover"
              />
            </FlexWidget>

            <FlexWidget
              style={{
                flex: 1,
                marginLeft: 10,
                justifyContent: 'center',
              }}
            >
              <TextWidget
                text={title}
                maxLines={1}
                style={{
                  fontSize: 15,
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                }}
              />
              <TextWidget
                text={artist}
                maxLines={1}
                style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.72)',
                  marginTop: 2,
                }}
              />
            </FlexWidget>
          </FlexWidget>

          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <GlassControlButton
              clickAction="PLAY_PAUSE"
              svg={playPauseSvg}
              theme={theme}
              primary
              size={42}
              iconSize={20}
            />
            <FlexWidget style={{ width: 8 }} />
            <GlassControlButton
              clickAction="NEXT"
              svg={NEXT_ICON_SVG}
              theme={theme}
              size={38}
              iconSize={18}
            />
          </FlexWidget>
        </FlexWidget>
      ) : (
        <FlexWidget
          style={{
            height: 'match_parent',
            width: 'match_parent',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingHorizontal: 18,
            paddingVertical: 15,
          }}
        >
          {/* Top Row: Artwork + Song Info + Brand Icon */}
          <FlexWidget
            style={{
              width: 'match_parent',
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            <FlexWidget
              style={{
                width: 60,
                height: 60,
                borderRadius: 15,
                borderWidth: 1.5,
                borderColor: hexToRgba(theme.artBorder, 0.6) as ColorProp,
                backgroundColor: 'rgba(16, 28, 13, 0.85)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ImageWidget
                image={artworkSource}
                imageWidth={57}
                imageHeight={57}
                radius={14}
                resizeMode="cover"
              />
            </FlexWidget>

            <FlexWidget
              style={{
                flex: 1,
                marginLeft: 13,
                justifyContent: 'center',
              }}
            >
              <FlexWidget
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 3,
                }}
              >
                <SvgWidget
                  svg={buildEqualizerSvg(theme)}
                  style={{
                    width: 14,
                    height: 12,
                    marginRight: 6,
                  }}
                />
                <TextWidget
                  text={
                    isPlaying
                      ? 'Now Playing'
                      : hasSong
                      ? 'Paused'
                      : 'PulseBeat'
                  }
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: (isPlaying
                      ? theme.labelAccent
                      : 'rgba(255, 255, 255, 0.65)') as ColorProp,
                  }}
                />
              </FlexWidget>

              <TextWidget
                text={title}
                maxLines={1}
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                }}
              />
              <TextWidget
                text={artist}
                maxLines={1}
                style={{
                  fontSize: 13,
                  color: 'rgba(255, 255, 255, 0.72)',
                  marginTop: 2,
                }}
              />
            </FlexWidget>

            <SvgWidget
              svg={buildBrandWavesSvg(theme)}
              style={{
                width: 24,
                height: 24,
                marginLeft: 8,
              }}
            />
          </FlexWidget>

          {/* Middle Row: Tappable Seek Progress Bar + Timestamps */}
          <FlexWidget
            style={{
              width: 'match_parent',
              flexDirection: 'column',
            }}
          >
            <OverlapWidget
              style={{
                width: 'match_parent',
                height: 22,
              }}
            >
              <FlexWidget
                style={{
                  width: 'match_parent',
                  height: 22,
                  justifyContent: 'center',
                }}
              >
                <SvgWidget
                  svg={progressSvg}
                  style={{
                    width: 'match_parent',
                    height: 14,
                  }}
                />
              </FlexWidget>
              <FlexWidget
                style={{
                  width: 'match_parent',
                  height: 22,
                  flexDirection: 'row',
                }}
              >
                {SEEK_SEGMENTS.map((segRatio) => (
                  <FlexWidget
                    key={segRatio}
                    clickAction="SEEK_PERCENT"
                    clickActionData={{ ratio: segRatio }}
                    style={{
                      flex: 1,
                      height: 22,
                    }}
                  />
                ))}
              </FlexWidget>
            </OverlapWidget>
            <FlexWidget
              style={{
                width: 'match_parent',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 1,
              }}
            >
              <TextWidget
                text={formatTime(position)}
                style={{
                  fontSize: 11,
                  color: 'rgba(255, 255, 255, 0.65)',
                }}
              />
              <TextWidget
                text={formatTime(duration)}
                style={{
                  fontSize: 11,
                  color: 'rgba(255, 255, 255, 0.65)',
                }}
              />
            </FlexWidget>
          </FlexWidget>

          {/* Bottom Row: 5-Button Symmetrical Control Bar */}
          <FlexWidget
            style={{
              width: 'match_parent',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <GlassControlButton
              clickAction="SHUFFLE"
              svg={buildShuffleSvg(isShuffle, theme.labelAccent)}
              theme={theme}
              active={isShuffle}
              size={38}
              iconSize={17}
            />
            <GlassControlButton
              clickAction="PREVIOUS"
              svg={PREV_ICON_SVG}
              theme={theme}
              size={46}
              iconSize={20}
            />
            <GlassControlButton
              clickAction="PLAY_PAUSE"
              svg={playPauseSvg}
              theme={theme}
              primary
              size={58}
              iconSize={24}
            />
            <GlassControlButton
              clickAction="NEXT"
              svg={NEXT_ICON_SVG}
              theme={theme}
              size={46}
              iconSize={20}
            />
            <GlassControlButton
              clickAction="REPEAT"
              svg={buildRepeatSvg(isRepeat, theme.labelAccent)}
              theme={theme}
              active={isRepeat}
              size={38}
              iconSize={17}
            />
          </FlexWidget>
        </FlexWidget>
      )}
    </OverlapWidget>
  );
}
