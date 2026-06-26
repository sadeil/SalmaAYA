export function ExerciseDemonstration({ motionType, phase, playing, speed = 1 }) {
  return (
    <div
      className={`exercise-demo exercise-demo-${motionType} phase-${phase} ${playing ? "is-playing" : ""}`}
      style={{
        "--demo-speed": `${5 / speed}s`,
        "--phase-speed": `${1650 / speed}ms`,
        "--micro-speed": `${3200 / speed}ms`,
      }}
      aria-label="Animated exercise demonstration"
    >
      <svg viewBox="0 0 440 360" role="img">
        <defs>
          <linearGradient id="skinTone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe0c2" />
            <stop offset="100%" stopColor="#d99b72" />
          </linearGradient>
          <linearGradient id="shirtTone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#35c6a4" />
            <stop offset="100%" stopColor="#127568" />
          </linearGradient>
          <linearGradient id="pantsTone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#385969" />
            <stop offset="100%" stopColor="#172f3a" />
          </linearGradient>
        </defs>
        <ellipse className="demo-shadow" cx="220" cy="325" rx="125" ry="15" />
        <g className="demo-focus-rings">
          <circle className="demo-focus demo-focus-neck" cx="220" cy="102" r="42" />
          <circle className="demo-focus demo-focus-shoulders" cx="220" cy="130" r="62" />
          <circle className="demo-focus demo-focus-spine" cx="220" cy="170" r="67" />
          <circle className="demo-focus demo-focus-lowerback" cx="220" cy="205" r="55" />
          <circle className="demo-focus demo-focus-posture" cx="220" cy="165" r="82" />
        </g>
        <g className="demo-person">
          <g className="demo-head-group">
            <ellipse className="demo-neck" cx="220" cy="104" rx="14" ry="20" />
            <path className="demo-ear demo-ear-left" d="M190 67c-10-3-11 18 1 20Z" />
            <path className="demo-ear demo-ear-right" d="M250 67c10-3 11 18-1 20Z" />
            <ellipse className="demo-head" cx="220" cy="68" rx="31" ry="36" />
            <path className="demo-hair" d="M190 66c-1-41 62-47 65-3-15-10-28-14-45-10-8 2-14 7-20 13Z" />
            <path className="demo-brow" d="M202 67q7-4 13 0M226 67q7-4 13 0" />
            <circle className="demo-eye" cx="209" cy="73" r="2.5" />
            <circle className="demo-eye" cx="232" cy="73" r="2.5" />
            <path className="demo-nose" d="M220 74l-2 10 5 1" />
            <path className="demo-smile" d="M211 91q9 7 18 0" />
            <circle className="demo-cheek" cx="202" cy="86" r="4" />
            <circle className="demo-cheek" cx="238" cy="86" r="4" />
          </g>
          <path className="demo-torso" d="M190 112Q220 98 250 112L263 196Q244 214 220 214Q196 214 177 196Z" />
          <path className="demo-shirt-highlight" d="M200 113Q215 106 226 108L218 199Q202 202 190 194Z" />
          <path className="demo-collar" d="M202 108Q220 125 238 108" />
          <path className="demo-shirt-seam" d="M220 126v68" />
          <path className="demo-waist" d="M184 194Q220 210 256 194L254 218Q220 230 186 218Z" />
          <g className="demo-arm demo-arm-left">
            <path className="demo-upper-arm" d="M188 121Q164 139 157 166" />
            <circle className="demo-elbow" cx="157" cy="166" r="10" />
            <g className="demo-lower-arm">
              <path className="demo-forearm" d="M157 166Q151 187 153 205" />
              <path className="demo-hand" d="M145 201q8-7 17 0l2 16q-10 9-20 0Z" />
            </g>
          </g>
          <g className="demo-arm demo-arm-right">
            <path className="demo-upper-arm" d="M252 121Q276 139 283 166" />
            <circle className="demo-elbow" cx="283" cy="166" r="10" />
            <g className="demo-lower-arm">
              <path className="demo-forearm" d="M283 166Q289 187 287 205" />
              <path className="demo-hand" d="M278 201q8-7 17 0l1 16q-10 9-20 0Z" />
            </g>
          </g>
          <g className="demo-leg demo-leg-left">
            <path className="demo-thigh" d="M204 216Q190 248 184 266" />
            <circle className="demo-knee" cx="184" cy="266" r="11" />
            <g className="demo-lower-leg">
              <path className="demo-shin" d="M184 266Q180 291 178 312" />
              <path className="demo-shoe" d="M164 308q16-7 29 2l-2 12h-31Z" />
            </g>
          </g>
          <g className="demo-leg demo-leg-right">
            <path className="demo-thigh" d="M236 216Q250 248 256 266" />
            <circle className="demo-knee" cx="256" cy="266" r="11" />
            <g className="demo-lower-leg">
              <path className="demo-shin" d="M256 266Q260 291 262 312" />
              <path className="demo-shoe" d="M247 310q13-9 29-2l4 14h-31Z" />
            </g>
          </g>
        </g>
        <path className="demo-guide demo-guide-left" d="M135 105 C85 140 85 210 135 240" />
        <path className="demo-guide demo-guide-right" d="M305 105 C355 140 355 210 305 240" />
      </svg>
      <span className="demo-breathe">Breathe</span>
    </div>
  );
}
