import Svg, { Circle, Path, G } from 'react-native-svg';

const PlayCircleIcon = (props: { color: string; size: number }) => {
  return (
    <Svg
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
    >
      <G
        fill="none"
        stroke={props.color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
      >
        <Circle cx="12" cy="12" r="10" />
        <Path d="m10 8l6 4l-6 4z" />
      </G>
    </Svg>
  );
};

export default PlayCircleIcon;