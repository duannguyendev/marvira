import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, Mask, Path, Rect } from 'react-native-svg';
import {
  M_LOADING_DRAW_MS,
  dashOffsetAt,
  dotRadiusAt,
  strokeWindows,
  type MLoadingLetter,
} from './mLoadingDraw';

export { M_LOADING_DRAW_MS, strokeWindows } from './mLoadingDraw';

type Letter = MLoadingLetter;

const PATHS: {
  id: string;
  letter: Exclude<Letter, 'dot'>;
  d: string;
  color: string;
  length: number;
}[] = [
  {
    id: 'M',
    letter: 'M',
    d: 'M60 340 L60 60 L200 240 L340 60',
    color: '#E879F9',
    length: 740,
  },
  {
    id: 'A1',
    letter: 'A',
    d: 'M60 340 L60 60',
    color: '#EC4899',
    length: 280,
  },
  {
    id: 'A2',
    letter: 'A',
    d: 'M60 60 L200 240',
    color: '#EC4899',
    length: 230,
  },
  {
    id: 'A3',
    letter: 'A',
    d: 'M60 193 C140 147 250 147 340 193',
    color: '#EC4899',
    length: 305,
  },
  {
    id: 'V',
    letter: 'V',
    d: 'M60 60 L200 240 L340 60',
    color: '#F97316',
    length: 460,
  },
  {
    id: 'r1',
    letter: 'r',
    d: 'M60 340 L60 153',
    color: '#9A3412',
    length: 187,
  },
  {
    id: 'r2',
    letter: 'r',
    d: 'M60 193 C140 147 250 147 340 193',
    color: '#9A3412',
    length: 305,
  },
  {
    id: 'i',
    letter: 'i',
    d: 'M340 63 L340 340',
    color: '#FACC15',
    length: 277,
  },
];

type MLoadingIconProps = {
  size?: number;
  loop?: boolean;
  duration?: number;
  onFinished?: () => void;
};

export const MLoadingIcon: React.FC<MLoadingIconProps> = ({
  size = 48,
  loop = false,
  duration = M_LOADING_DRAW_MS,
  onFinished,
}) => {
  const [progress, setProgress] = useState(0);
  const windows = useMemo(() => strokeWindows(duration), [duration]);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const maskId = `mload-${rawId || 'icon'}`;

  useEffect(() => {
    let raf = 0;
    let start = Date.now();
    let cancelled = false;
    let reported = false;

    const tick = () => {
      if (cancelled) {
        return;
      }
      const next = Math.min(1, (Date.now() - start) / duration);
      setProgress(next);
      if (next < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (loop) {
        start = Date.now();
        setProgress(0);
        raf = requestAnimationFrame(tick);
        return;
      }
      if (!reported) {
        reported = true;
        onFinishedRef.current?.();
      }
    };

    setProgress(0);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [duration, loop]);

  const dotR = dotRadiusAt(
    progress,
    windows.dot.delay,
    windows.dot.dur,
    duration,
    32,
  );

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityLabel="Marvira">
      <Svg width={size} height={size} viewBox="0 0 400 400">
        <Defs>
          <Mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x={-80}
            y={-80}
            width={560}
            height={560}>
            <Rect x={-80} y={-80} width={560} height={560} fill="white" />
            <Circle cx={340} cy={63} r={40} fill="black" />
          </Mask>
        </Defs>
        <G
          fill="none"
          strokeWidth={64}
          strokeLinecap="round"
          strokeLinejoin="round"
          mask={`url(#${maskId})`}>
          {PATHS.map(path => (
            <Path
              key={path.id}
              d={path.d}
              stroke={path.color}
              strokeDasharray={path.length}
              strokeDashoffset={dashOffsetAt(
                progress,
                windows[path.letter].delay,
                windows[path.letter].dur,
                path.length,
                duration,
              )}
            />
          ))}
        </G>
        {dotR > 0.2 ? (
          <Circle cx={340} cy={63} r={dotR} fill="#FACC15" />
        ) : null}
      </Svg>
    </View>
  );
};
