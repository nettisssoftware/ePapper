import type { Scene, SceneNode } from "@/editorial/schema";

function NodeView({ node }: { node: SceneNode }) {
  switch (node.type) {
    case "rect":
      return (
        <rect
          x={node.x}
          y={node.y}
          width={node.w}
          height={node.h}
          fill={node.fill}
        />
      );
    case "line":
      return (
        <line
          x1={node.x1}
          y1={node.y1}
          x2={node.x2}
          y2={node.y2}
          stroke={node.stroke}
          strokeWidth={node.strokeWidth}
          strokeLinecap="butt"
        />
      );
    case "text":
      return (
        <text
          x={node.x}
          y={node.y}
          fill={node.fill}
          fontFamily={node.fontFamily}
          fontWeight={node.fontWeight}
          fontSize={node.fontSize}
          fontStyle={node.fontStyle ?? "normal"}
          letterSpacing={node.letterSpacing}
          textAnchor={
            node.align === "center" ? "middle" : node.align === "right" ? "end" : "start"
          }
        >
          {node.text}
        </text>
      );
    case "textline":
      return (
        <text
          fill={node.fill}
          fontFamily={node.fontFamily}
          fontWeight={node.fontWeight}
          fontSize={node.fontSize}
          fontStyle={node.fontStyle ?? "normal"}
          letterSpacing={node.letterSpacing}
        >
          {node.words.map((w, i) => (
            <tspan key={`${node.id}-w-${i}`} x={w.x} y={node.y}>
              {w.text}
            </tspan>
          ))}
        </text>
      );
    case "image":
      return (
        <svg
          x={node.x}
          y={node.y}
          width={node.w}
          height={node.h}
          viewBox={`${node.crop.sx} ${node.crop.sy} ${node.crop.sw} ${node.crop.sh}`}
          preserveAspectRatio="none"
        >
          <image
            href={node.src}
            width={node.naturalWidth}
            height={node.naturalHeight}
            preserveAspectRatio="none"
            crossOrigin="anonymous"
          />
        </svg>
      );
    case "guide":
      return (
        <rect
          x={node.x}
          y={node.y}
          width={node.w}
          height={node.h}
          fill="none"
          stroke={node.color}
          strokeWidth={0.75}
          strokeDasharray="4 3"
        />
      );
    default:
      return null;
  }
}

export function SceneView({ scene, title }: { scene: Scene; title?: string }) {
  return (
    <svg
      viewBox={`0 0 ${scene.width} ${scene.height}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={title ?? "Previsualización de la portada"}
      style={{ background: scene.background, display: "block" }}
    >
      {scene.nodes.map((node) => (
        <NodeView key={node.id} node={node} />
      ))}
    </svg>
  );
}
