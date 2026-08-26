import React from "react";
import { BurnoutMetrics } from "@/shared/types/roadmap";
import { ShieldCheck, AlertTriangle, ShieldAlert, HeartPulse } from "lucide-react";
import { Card } from "@/client/components/common/Card";

interface BurnoutRiskMeterProps {
  metrics: BurnoutMetrics;
}

export function BurnoutRiskMeter({ metrics }: BurnoutRiskMeterProps) {
  const getRiskDetails = () => {
    switch (metrics.riskLevel) {
      case "low":
        return {
          label: "Low Burnout Risk",
          color: "text-emerald-700",
          bg: "bg-emerald-50 border-emerald-200",
          meterColor: "bg-emerald-500",
          Icon: ShieldCheck,
          description: "Pacing is sustainable with reasonable cognitive load distribution.",
        };
      case "moderate":
        return {
          label: "Moderate Burnout Risk",
          color: "text-amber-700",
          bg: "bg-amber-50 border-amber-200",
          meterColor: "bg-amber-500",
          Icon: AlertTriangle,
          description: "Study load has dense stretches. Keep sessions capped at 90 minutes.",
        };
      case "high":
        return {
          label: "High Burnout Risk",
          color: "text-red-700",
          bg: "bg-red-50 border-red-200",
          meterColor: "bg-red-500",
          Icon: ShieldAlert,
          description: "High probability of academic exhaustion. Insert rest days or shift dates.",
        };
    }
  };

  const risk = getRiskDetails();
  const IconComponent = risk.Icon;

  return (
    <Card className={`border ${risk.bg}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg bg-white/80 ${risk.color}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h4 className={`text-sm font-bold ${risk.color}`}>{risk.label}</h4>
            <p className="text-xs text-slate-600 mt-0.5">{risk.description}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-slate-800">{metrics.riskScore}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
          <div
            className={`h-full rounded-full transition-all duration-500 ${risk.meterColor}`}
            style={{ width: `${metrics.riskScore}%` }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-slate-200/50 pt-2.5">
        <div>
          <span className="text-slate-500">Weekly Target: </span>
          <span className="font-semibold text-slate-800">{metrics.weeklyPeakHours} hrs</span>
        </div>
        <div className="text-right">
          <span className="text-slate-500">Scheduled Recovery: </span>
          <span className="font-semibold text-slate-800">{metrics.recommendedRestDays} days</span>
        </div>
      </div>

      {metrics.burnoutFactors && metrics.burnoutFactors.length > 0 && (
        <ul className="mt-2.5 space-y-1 text-[11px] text-slate-600">
          {metrics.burnoutFactors.map((factor, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-slate-400 shrink-0" />
              <span>{factor}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
