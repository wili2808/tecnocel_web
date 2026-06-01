import { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

const Sparkline = ({
  data,
  width = 120,
  height = 32,
  strokeWidth = 2,
  color = 'currentColor',
  className = '',
}: SparklineProps) => {
  const path = useMemo(() => {
    if (!data || data.length < 2) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 2;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;

    return data
      .map((val, i) => {
        const x = padding + (i / (data.length - 1)) * innerW;
        const y = padding + innerH - ((val - min) / range) * innerH;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join('');
  }, [data, width, height]);

  if (!path) return null;

  const gradientId = `spark-fill-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={`${path}L${width - 2},${height}L2,${height}Z`} fill={`url(#${gradientId})`} />
      <path d={path} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
};

export default Sparkline;
