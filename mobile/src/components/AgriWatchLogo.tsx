import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function AgriWatchLogo({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Shield */}
      <Path
        d="M32 4L8 14v18c0 14.4 10.24 27.84 24 32 13.76-4.16 24-17.6 24-32V14L32 4z"
        fill="url(#sg)" opacity={0.15}
      />
      <Path
        d="M32 4L8 14v18c0 14.4 10.24 27.84 24 32 13.76-4.16 24-17.6 24-32V14L32 4z"
        stroke="url(#ss)" strokeWidth={2} fill="none"
      />
      {/* Tige */}
      <Path d="M32 48V28" stroke="url(#stem)" strokeWidth={2.5} strokeLinecap="round"/>
      {/* Feuilles */}
      <Path d="M32 28c-6-8-16-8-16-8s2 10 10 14" fill="url(#ll)" opacity={0.9}/>
      <Path d="M32 28c6-8 16-8 16-8s-2 10-10 14" fill="url(#lr)" opacity={0.9}/>
      {/* Œil */}
      <Circle cx={32} cy={22} r={5} fill="url(#eye)"/>
      <Circle cx={32} cy={22} r={2} fill="white" opacity={0.9}/>
      {/* Ondes */}
      <Path d="M22 16a14 14 0 0 1 20 0" stroke="url(#wv)" strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.6}/>
      <Path d="M25 13a10 10 0 0 1 14 0" stroke="url(#wv)" strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.4}/>

      <Defs>
        <LinearGradient id="sg" x1={8} y1={4} x2={56} y2={64}>
          <Stop offset="0%" stopColor="#f59e0b"/><Stop offset="100%" stopColor="#ea580c"/>
        </LinearGradient>
        <LinearGradient id="ss" x1={8} y1={4} x2={56} y2={64}>
          <Stop offset="0%" stopColor="#f59e0b"/><Stop offset="100%" stopColor="#ea580c"/>
        </LinearGradient>
        <LinearGradient id="stem" x1={32} y1={28} x2={32} y2={48}>
          <Stop offset="0%" stopColor="#f59e0b"/><Stop offset="100%" stopColor="#92400e"/>
        </LinearGradient>
        <LinearGradient id="ll" x1={16} y1={20} x2={32} y2={34}>
          <Stop offset="0%" stopColor="#fbbf24"/><Stop offset="100%" stopColor="#f59e0b"/>
        </LinearGradient>
        <LinearGradient id="lr" x1={48} y1={20} x2={32} y2={34}>
          <Stop offset="0%" stopColor="#fb923c"/><Stop offset="100%" stopColor="#ea580c"/>
        </LinearGradient>
        <LinearGradient id="eye" x1={27} y1={17} x2={37} y2={27}>
          <Stop offset="0%" stopColor="#fbbf24"/><Stop offset="100%" stopColor="#ea580c"/>
        </LinearGradient>
        <LinearGradient id="wv" x1={22} y1={13} x2={42} y2={16}>
          <Stop offset="0%" stopColor="#fbbf24"/><Stop offset="100%" stopColor="#f59e0b"/>
        </LinearGradient>
      </Defs>
    </Svg>
  );
}
