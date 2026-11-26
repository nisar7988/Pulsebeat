import React from 'react';
import {
  FlexWidget,
  ImageWidget,
  OverlapWidget,
  SvgWidget,
  TextWidget,
  type ImageWidgetSource,
} from 'react-native-android-widget';

export interface PulseBeatWidgetProps {
  title: string;
  artist: string;
  artwork?: ImageWidgetSource;
  isPlaying: boolean;
  hasSong: boolean;
  width?: number;
  height?: number;
}

const DEFAULT_ARTWORK =
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300' as const;

const LIQUID_GLASS_BG_SVG = `
<svg viewBox="0 0 360 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="glassBase" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="#172A13" stop-opacity="0.90" />
      <stop offset="55%" stop-color="#0E1B0B" stop-opacity="0.92" />
      <stop offset="100%" stop-color="#070E05" stop-opacity="0.96" />
    </linearGradient>
    <linearGradient id="topSheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.22" />
      <stop offset="45%" stop-color="#FFFFFF" stop-opacity="0.06" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.00" />
    </linearGradient>
    <radialGradient id="limeGlow" cx="0.82" cy="0.78" r="0.55">
      <stop offset="0%" stop-color="#C8F929" stop-opacity="0.20" />
      <stop offset="55%" stop-color="#22C55E" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#0B1309" stop-opacity="0.00" />
    </radialGradient>
    <radialGradient id="artGlow" cx="0.16" cy="0.35" r="0.45">
      <stop offset="0%" stop-color="#C8F929" stop-opacity="0.14" />
      <stop offset="100%" stop-color="#0B1309" stop-opacity="0.00" />
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="360" height="160" rx="24" fill="url(#glassBase)" />
  <rect x="0" y="0" width="360" height="160" rx="24" fill="url(#limeGlow)" />
  <rect x="0" y="0" width="360" height="160" rx="24" fill="url(#artGlow)" />
  <path d="M24,1 H336 A23,23 0 0 1 359,24 V66 C260,44 110,82 1,56 V24 A23,23 0 0 1 24,1 Z" fill="url(#topSheen)" />
  <rect x="1" y="1" width="358" height="158" rx="23" fill="none" stroke="#C8F929" stroke-opacity="0.28" stroke-width="1.5" />
  <path d="M24,1.5 H336" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="1" stroke-linecap="round" />
</svg>
`;

const PREV_ICON_SVG = `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 20L9 12L19 4V20Z" fill="#F8FAFC" />
  <rect x="5" y="4" width="2.4" height="16" rx="1.2" fill="#F8FAFC" />
</svg>
`;

const NEXT_ICON_SVG = `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 4L15 12L5 20V4Z" fill="#F8FAFC" />
  <rect x="16.6" y="4" width="2.4" height="16" rx="1.2" fill="#F8FAFC" />
</svg>
`;

const PLAY_ICON_SVG = `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7.5 4.8C7.5 4.0 8.38 3.52 9.05 3.96L19.55 10.76C20.16 11.16 20.16 12.04 19.55 12.44L9.05 19.24C8.38 19.68 7.5 19.2 7.5 18.4V4.8Z" fill="#0B1309" />
</svg>
`;

const PAUSE_ICON_SVG = `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="6.5" y="4.5" width="3.8" height="15" rx="1.4" fill="#0B1309" />
  <rect x="13.7" y="4.5" width="3.8" height="15" rx="1.4" fill="#0B1309" />
</svg>
`;

function ControlButton({
  clickAction,
  svg,
  primary = false,
  size = 40,
  iconSize = 18,
}: {
  clickAction: string;
  svg: string;
  primary?: boolean;
  size?: number;
  iconSize?: number;
}) {
  return (
    <FlexWidget
      clickAction={clickAction}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: primary ? '#C8F929' : 'rgba(255, 255, 255, 0.10)',
        borderColor: primary ? '#D6FF50' : 'rgba(255, 255, 255, 0.18)',
        borderWidth: 1,
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
  height = 140,
}: PulseBeatWidgetProps) {
  const isCompact = height < 115;
  const artworkSource: ImageWidgetSource = artwork || DEFAULT_ARTWORK;

  return (
    <OverlapWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        borderRadius: 24,
      }}
    >
      <SvgWidget
        svg={LIQUID_GLASS_BG_SVG}
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
            clickAction="OPEN_APP"
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 10,
            }}
          >
            <FlexWidget
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(200, 249, 41, 0.35)',
                backgroundColor: 'rgba(16, 28, 13, 0.8)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ImageWidget
                image={artworkSource}
                imageWidth={44}
                imageHeight={44}
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
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#F8FAFC',
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
            <ControlButton
              clickAction="PLAY_PAUSE"
              svg={isPlaying ? PAUSE_ICON_SVG : PLAY_ICON_SVG}
              primary
              size={40}
              iconSize={18}
            />
            <FlexWidget style={{ width: 8 }} />
            <ControlButton
              clickAction="NEXT"
              svg={NEXT_ICON_SVG}
              size={36}
              iconSize={16}
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
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          {/* Top Row: Artwork + Song Info (tap opens app) */}
          <FlexWidget
            clickAction="OPEN_APP"
            style={{
              width: 'match_parent',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <FlexWidget
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(200, 249, 41, 0.35)',
                backgroundColor: 'rgba(16, 28, 13, 0.85)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ImageWidget
                image={artworkSource}
                imageWidth={54}
                imageHeight={54}
                radius={13}
                resizeMode="cover"
              />
            </FlexWidget>

            <FlexWidget
              style={{
                flex: 1,
                marginLeft: 12,
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
                <FlexWidget
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: isPlaying ? '#C8F929' : 'rgba(255, 255, 255, 0.35)',
                    marginRight: 6,
                  }}
                />
                <TextWidget
                  text={
                    isPlaying
                      ? 'NOW PLAYING'
                      : hasSong
                      ? 'PAUSED'
                      : 'PULSEBEAT'
                  }
                  style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: isPlaying ? '#C8F929' : 'rgba(255, 255, 255, 0.55)',
                    letterSpacing: 1,
                  }}
                />
              </FlexWidget>

              <TextWidget
                text={title}
                maxLines={1}
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#F8FAFC',
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

          {/* Bottom Row: Liquid Glass Playback Controls */}
          <FlexWidget
            style={{
              width: 'match_parent',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 26,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderColor: 'rgba(255, 255, 255, 0.14)',
              borderWidth: 1,
            }}
          >
            <ControlButton
              clickAction="PREVIOUS"
              svg={PREV_ICON_SVG}
              size={38}
              iconSize={18}
            />
            <ControlButton
              clickAction="PLAY_PAUSE"
              svg={isPlaying ? PAUSE_ICON_SVG : PLAY_ICON_SVG}
              primary
              size={44}
              iconSize={20}
            />
            <ControlButton
              clickAction="NEXT"
              svg={NEXT_ICON_SVG}
              size={38}
              iconSize={18}
            />
          </FlexWidget>
        </FlexWidget>
      )}
    </OverlapWidget>
  );
}
