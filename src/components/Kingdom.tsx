const towers = [
  { x: 960, w: 58, top: 372, roof: 60 },
  { x: 1034, w: 74, top: 300, roof: 86 },
  { x: 1122, w: 96, top: 214, roof: 112 },
  { x: 1232, w: 70, top: 276, roof: 92 },
  { x: 1318, w: 56, top: 356, roof: 66 },
  { x: 1388, w: 44, top: 402, roof: 52 },
]

export default function Kingdom() {
  return (
    <svg className="kingdom" viewBox="0 0 1600 900" aria-hidden="true" focusable="false">
      <g className="layer layer-far">
        <circle cx="1170" cy="520" r="210" fill="#ffc46b" opacity="0.28" />
        <circle cx="1170" cy="520" r="140" fill="#ffe3a1" />
      </g>

      <g className="drift-slow" fill="#f7a58a" opacity="0.65">
        <ellipse cx="420" cy="785" rx="240" ry="28" />
        <ellipse cx="1500" cy="300" rx="170" ry="22" />
      </g>

      <g className="layer layer-mid">
        <path
          d="M900 500 H1450 l-30 70 -74 44 -34 74 -66 18 -44 66 -46 -60 -74 -26 -40 -78 -78 -44z"
          fill="#3a2360"
        />
        <path d="M900 500 H1450 l-12 26 H914z" fill="#7a4a6e" />
        <rect x="1408" y="524" width="10" height="170" fill="#ffd9a0" opacity="0.8" />

        <path d="M930 500 v-52 h20 v16 h20 v-16 h20 v16 h20 v-16 h20 v52z" fill="#2b1a4e" />
        <path d="M1260 500 v-44 h20 v14 h20 v-14 h20 v14 h20 v-14 h20 v44z" fill="#2b1a4e" />

        {towers.map(({ x, w, top, roof }) => (
          <g key={x}>
            <rect x={x} y={top} width={w} height={500 - top} fill="#2b1a4e" />
            <path d={`M${x - 8} ${top} L${x + w / 2} ${top - roof} L${x + w + 8} ${top}z`} fill="#d9534f" />
            <rect x={x + w / 2 - 5} y={top + 34} width="10" height="22" rx="5" fill="#ffd27a" />
            <rect x={x + w / 2 - 5} y={top + 84} width="10" height="22" rx="5" fill="#ffd27a" />
          </g>
        ))}
        <path d="M1170 102 v-40 l40 12 -40 12" fill="#f5b942" />
      </g>

      <g className="drift-fast" fill="#ffd9bf">
        <g className="layer layer-near">
          <ellipse cx="240" cy="850" rx="340" ry="74" />
          <ellipse cx="760" cy="880" rx="400" ry="74" />
          <ellipse cx="1180" cy="856" rx="330" ry="82" />
          <ellipse cx="1560" cy="870" rx="300" ry="80" />
        </g>
      </g>
    </svg>
  )
}
