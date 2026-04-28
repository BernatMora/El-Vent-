import { CheckCircle2 } from "lucide-react"

interface Props {
  confidence?: number
  isCalibrated?: boolean
  originalWindSpeed?: number
  compact?: boolean
}

export function ConfidenceBadge({ confidence, isCalibrated, originalWindSpeed, compact }: Props) {
  if (confidence == null && !isCalibrated) return null

  const pct = confidence != null ? Math.round(confidence * 100) : null
  let level: "high" | "med" | "low" = "med"
  let color = "bg-amber-100 text-amber-800 border-amber-200"
  let label = "Mitjana"
  if (pct !== null) {
    if (pct >= 80) {
      level = "high"
      color = "bg-green-100 text-green-800 border-green-200"
      label = "Alta"
    } else if (pct < 60) {
      level = "low"
      color = "bg-red-100 text-red-800 border-red-200"
      label = "Baixa"
    }
  }

  const tooltip = [
    pct !== null ? `Concordança entre models: ${pct}%` : null,
    isCalibrated && originalWindSpeed != null
      ? `Calibrat: original ${Math.round(originalWindSpeed)} kn → ajustat`
      : isCalibrated ? "Ajustat amb dades reals locals" : null,
  ].filter(Boolean).join(" · ")

  if (compact) {
    return (
      <span title={tooltip} className="inline-flex items-center gap-0.5">
        {pct !== null && (
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${
            level === "high" ? "bg-green-500" : level === "low" ? "bg-red-500" : "bg-amber-500"
          }`} />
        )}
        {isCalibrated && <CheckCircle2 className="h-3 w-3 text-purple-600" />}
      </span>
    )
  }

  return (
    <span title={tooltip} className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${color}`}>
      {pct !== null && <>{label} {pct}%</>}
      {isCalibrated && <CheckCircle2 className="h-3 w-3 text-purple-600" />}
    </span>
  )
}
