import React from "react";
import { Terminal, FlaskConical, TrendingUp } from "lucide-react";

export interface PresetCourse {
  id: string;
  title: string;
  code: string;
  category: string;
  icon: React.ElementType;
  text: string;
}

export const PRESET_COURSES: PresetCourse[] = [
  {
    id: "cs161",
    title: "Algorithms & Data Structures",
    code: "CS 161",
    category: "Computer Science",
    icon: Terminal,
    text: `Course: CS 161 - Design & Analysis of Algorithms
Slide 1: Asymptotic Complexity & Recurrence Bounds
- Big-O $O(g(n))$, $\\Omega(g(n))$, and tight bound $\\Theta(g(n))$ formal definitions
- Master Theorem recurrence $T(n) = aT(n/b) + f(n)$ across cases $f(n) = O(n^{\\log_b a - \\epsilon})$
- Recursion tree summation $\\sum_{i=0}^{\\log_b n} a^i f(n / b^i)$ and Akra-Bazzi method

Slide 2: Divide and Conquer & Matrix Multiplication
- Merge Sort $T(n) = 2T(n/2) + \\Theta(n) \\Rightarrow \\Theta(n \\log n)$ and Quicksort randomized pivot
- Strassen Matrix Multiplication reducing $8$ multiplications to $7$ ($O(n^{\\log_2 7}) \\approx O(n^{2.807})$)
- Deterministic Median-of-Medians selection in worst-case $O(n)$ linear time

Slide 3: Dynamic Programming & Memoization State Transitions
- Bellman optimality & 0/1 Knapsack recurrence $DP[i][w] = \\max(DP[i-1][w], v_i + DP[i-1][w - w_i])$
- Longest Common Subsequence (LCS) table in $O(m \\cdot n)$ and sequence reconstruction
- Matrix Chain Multiplication $m[i,j] = \\min_{i \\le k < j} \\{m[i,k] + m[k+1,j] + p_{i-1}p_k p_j\\}$

Slide 4: Greedy Choice & Shortest-Path Graph Algorithms
- Huffman prefix-free tree construction with priority queue $O(n \\log n)$
- Kruskal and Prim Minimum Spanning Tree (MST) cut property in $O(E \\log V)$
- Dijkstra non-negative weights vs Bellman-Ford relaxation $\\text{dist}[v] \\le \\text{dist}[u] + w(u,v)$`,
  },
  {
    id: "chem230",
    title: "Organic Chemistry II",
    code: "CHEM 230",
    category: "Chemistry",
    icon: FlaskConical,
    text: `Course: CHEM 230 - Organic Chemistry & Reaction Mechanisms
Slide 1: Conjugated Pi Systems & Pericyclic Diels-Alder
- HOMO-LUMO frontier molecular orbital (FMO) overlap in 1,3-butadiene ($\\psi_1.. \\psi_4$)
- Suprafacial $[4+2]$ Diels-Alder cycloaddition endo/exo stereoselectivity and s-cis conformation
- Woodward-Fieser rules for UV-Vis $\\lambda_{\\max}$ and molar absorptivity $\\varepsilon = \\frac{A}{c \\cdot l}$

Slide 2: Aromaticity & Electrophilic Aromatic Substitution (EAS)
- Huckel planar conjugation rule $(4n + 2)\\ \\pi$ electrons ($n = 0, 1, 2, \\dots$) vs $4n$ antiaromaticity
- Sigma-complex (arenium ion) rate-determining step $\\Delta G^{\\ddagger}$ in nitration ($\\text{NO}_2^+$) and sulfonation
- Ortho/para activating ($-\\text{OH}, -\\text{OCH}_3$) vs meta deactivating ($-\\text{NO}_2, -\\text{CF}_3$) directing effects

Slide 3: Carbonyl Nucleophilic Addition & Enolate Condensations
- Bürgi-Dunitz trajectory ($\\approx 107^{\\circ}$) nucleophilic attack on aldehydes/ketones
- Keto-enol tautomerism equilibrium $K_{\\text{eq}} = \\frac{[\\text{Enol}]}{[\\text{Keto}]}$ and kinetic ($\\text{LDA}, -78^{\\circ}\\text{C}$) vs thermodynamic enolates
- Aldol condensation $\\beta$-hydroxy carbonyl dehydration and Claisen ester condensation`,
  },
  {
    id: "econ202",
    title: "Microeconomic Theory & Research",
    code: "ECON 202",
    category: "Economics",
    icon: TrendingUp,
    text: `Course: ECON 202 - Intermediate Microeconomic Analysis
Slide 1: Consumer Utility Maximization & Lagrangian Dual
- Constrained optimization $\\mathcal{L}(x_1, x_2, \\lambda) = U(x_1, x_2) + \\lambda(I - P_1 x_1 - P_2 x_2)$
- Tangency condition $MRS_{12} = \\frac{\\partial U / \\partial x_1}{\\partial U / \\partial x_2} = \\frac{P_1}{P_2}$ under Cobb-Douglas $U = x_1^{\\alpha} x_2^{1-\\alpha}$
- Slutsky decomposition $\\frac{\\partial x_1}{\\partial P_1} = \\frac{\\partial h_1}{\\partial P_1} - x_1 \\frac{\\partial x_1}{\\partial I}$ (substitution vs income effect)

Slide 2: Production Isoquants, Cost Functions & Monopoly Pricing
- Marginal Rate of Technical Substitution $MRTS_{LK} = \\frac{MP_L}{MP_K} = \\frac{w}{r}$ and returns to scale
- Monopoly Lerner Index $L = \\frac{P - MC}{P} = -\\frac{1}{\\varepsilon_d}$ and Deadweight Loss (DWL) integral
- First-, second-, and third-degree price discrimination $MR_1(q_1) = MR_2(q_2) = MC(Q)$

Slide 3: Strategic Game Theory & Oligopoly Equilibria
- Nash Equilibrium best-response correspondence $s_i^* \\in BR_i(s_{-i}^*)$ and mixed-strategy indifference
- Cournot quantity competition $q_i^* = \\frac{a - c}{3b}$ vs Bertrand price competition ($P = MC$)
- Stackelberg sequential leader-follower backward induction via Subgame Perfect Nash Equilibrium (SPNE)`,
  },
];

interface CoursePresetsProps {
  onSelectPreset: (preset: PresetCourse) => void;
  selectedId?: string;
}

export function CoursePresets({ onSelectPreset, selectedId }: CoursePresetsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {PRESET_COURSES.map((preset) => {
        const Icon = preset.icon;
        const isSelected = selectedId === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelectPreset(preset)}
            className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all cursor-pointer ${
              isSelected
                ? "border-brand-600 bg-brand-50/70 ring-1 ring-brand-500"
                : "border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex w-full items-center justify-between mb-2">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                {preset.code}
              </span>
              <Icon className="w-4 h-4 text-brand-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">{preset.title}</h4>
            <p className="mt-1 text-xs text-slate-500">{preset.category}</p>
          </button>
        );
      })}
    </div>
  );
}
