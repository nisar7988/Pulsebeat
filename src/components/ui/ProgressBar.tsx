import React, { useMemo, useCallback } from 'react';
import {
  View,
  Dimensions,
  StyleProp,
  ViewStyle,
  PanResponder,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ProgressBarProps {
  /**
   * Progress value from 0 to 1
   */
  progress: number;
  /**
   * Width of the component (defaults to screen width)
   */
  width?: number;
  /**
   * Distance of the arc from the dome's outer boundary (default ~24px)
   */
  margin?: number;
  /**
   * Half-sweep angle in degrees (default 57)
   */
  sweepAngleDeg?: number;
  /**
   * Background track stroke color
   */
  trackColor?: string;
  /**
   * Active progress stroke color
   */
  progressColor?: string;
  /**
   * Stroke width of the arc
   */
  strokeWidth?: number;
  /**
   * Thumb/dot fill color
   */
  dotColor?: string;
  /**
   * Thumb/dot radius
   */
  dotRadius?: number;
  /**
   * Whether to show the position dot
   */
  showDot?: boolean;
  /**
   * Callback when seeking completes (touch release)
   */
  onSeek?: (progress: number) => void;
  /**
   * Callback while actively scrubbing
   */
  onScrub?: (progress: number) => void;
  /**
   * Custom style for wrapper view
   */
  style?: StyleProp<ViewStyle>;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  width = SCREEN_WIDTH,
  margin = Math.round(width * 0.062), // ~24px on 390w
  sweepAngleDeg = 57,
  trackColor = 'rgba(15, 8, 50, 0.75)',
  progressColor = '#ffffff',
  strokeWidth = 2.5,
  dotColor = '#ffffff',
  dotRadius = 6,
  showDot = true,
  onSeek,
  onScrub,
  style,
}) => {
  // Concentric arc geometry:
  // The dome panel has radius R_DOME = width / 2 centered at (width / 2, width / 2).
  // An arc with R = R_DOME - margin is strictly concentric with the dome at EVERY point.
  const R_DOME = width / 2;
  const R = Math.max(R_DOME - margin, 10);
  const CX = width / 2;
  const CY = width / 2;
  const PHI = (sweepAngleDeg * Math.PI) / 180;
  const ARC_LEN = R * 2 * PHI;

  const pointAt = (p: number) => {
    const phi = -PHI + p * 2 * PHI;
    return {
      x: CX + R * Math.sin(phi),
      y: CY - R * Math.cos(phi),
    };
  };

  const START = pointAt(0);
  const END = pointAt(1);
  const ARC_PATH = `M ${START.x} ${START.y} A ${R} ${R} 0 0 1 ${END.x} ${END.y}`;

  const clampedProgress = Math.min(Math.max(isNaN(progress) ? 0 : progress, 0), 1);
  const dot = pointAt(clampedProgress);
  const svgHeight = Math.ceil(START.y + dotRadius + 14);

  const getProgressFromCoords = useCallback(
    (touchX: number, touchY: number) => {
      const dx = touchX - CX;
      const dy = CY - touchY;
      const angle = Math.atan2(dx, dy);
      const p = (angle + PHI) / (2 * PHI);
      return Math.min(Math.max(p, 0), 1);
    },
    [CX, CY, PHI]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (evt) => {
          if (!onSeek && !onScrub) return false;
          const { locationX, locationY } = evt.nativeEvent;
          const dx = locationX - CX;
          const dy = CY - locationY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          // Only capture touches close to the arc (within 28px) so other controls work freely
          return Math.abs(dist - R) <= 28;
        },
        onMoveShouldSetPanResponder: (evt) => {
          if (!onSeek && !onScrub) return false;
          const { locationX, locationY } = evt.nativeEvent;
          const dx = locationX - CX;
          const dy = CY - locationY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return Math.abs(dist - R) <= 35;
        },
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const p = getProgressFromCoords(locationX, locationY);
          onScrub?.(p);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const p = getProgressFromCoords(locationX, locationY);
          onScrub?.(p);
        },
        onPanResponderRelease: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const p = getProgressFromCoords(locationX, locationY);
          onSeek?.(p);
        },
      }),
    [onSeek, onScrub, R, CX, CY, getProgressFromCoords]
  );

  return (
    <View
      className="absolute top-0 left-0 right-0 items-center"
      style={style}
      pointerEvents="box-none"
      {...panResponder.panHandlers}
    >
      <Svg width={width} height={svgHeight}>
        {/* Background track arc with rounded pill ends */}
        <Path
          d={ARC_PATH}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />

        {/* Active progress arc with rounded pill ends */}
        <Path
          d={ARC_PATH}
          stroke={progressColor}
          strokeWidth={strokeWidth + 0.5}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${clampedProgress * ARC_LEN} ${ARC_LEN}`}
        />

        {/* Thumb indicator with soft glow halo */}
        {showDot && (
          <>
            <Circle
              cx={dot.x}
              cy={dot.y}
              r={dotRadius + 4}
              fill="rgba(255, 255, 255, 0.22)"
            />
            <Circle
              cx={dot.x}
              cy={dot.y}
              r={dotRadius}
              fill={dotColor}
            />
          </>
        )}
      </Svg>
    </View>
  );
};

export default ProgressBar;
