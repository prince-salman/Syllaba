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
Instructor: Dr. Miller

Week 1: Asymptotic Analysis and Recurrence Relations
- Big-O, Omega, and Theta notations
- Master Theorem and recursion trees
- Reading: CLRS Chapters 1-4
- Problem Set 1: Recurrence bounding

Week 2: Divide and Conquer Algorithms
- Merge sort and Quick sort optimizations
- Strassen's matrix multiplication
- Finding the median in linear time
- Problem Set 2: Custom divide-and-conquer strategy

Week 3: Dynamic Programming
- Optimal substructure and overlapping subproblems
- 0/1 Knapsack, Longest Common Subsequence
- Matrix chain multiplication
- Reading: CLRS Chapter 15
- Midterm Project: Implement dynamic programming memoization cache

Week 4: Greedy Algorithms & Graph Fundamentals
- Huffman coding and activity selection
- Minimum Spanning Trees (Kruskal and Prim)
- Dijkstra and Bellman-Ford shortest paths
- Final Assessment & Practice Benchmark`,
  },
  {
    id: "chem230",
    title: "Organic Chemistry II",
    code: "CHEM 230",
    category: "Chemistry",
    icon: FlaskConical,
    text: `Course: CHEM 230 - Organic Chemistry & Reaction Mechanisms
Department: Chemistry & Chemical Biology

Unit 1: Conjugated Systems and Pericyclic Reactions
- Molecular orbital theory and 1,3-butadiene
- Diels-Alder [4+2] cycloadditions and stereochemical selectivity
- Ultraviolet-visible spectroscopy of conjugated dienes
- Assigned Lab: Synthesis of bicyclic adduct

Unit 2: Aromaticity and Electrophilic Aromatic Substitution
- Huckel's rule (4n+2) criteria
- Halogenation, nitration, sulfonation, and Friedel-Crafts alkylation/acylation
- Directing effects of activating and deactivating substituents
- Synthesis problem set: Multi-step benzene derivatives

Unit 3: Carbonyl Chemistry & Enolates
- Nucleophilic addition to aldehydes and ketones
- Carboxylic acid derivatives and Fischer esterification
- Aldol, Claisen, and Michael additions
- Comprehensive Exam Review and Mechanism Drill`,
  },
  {
    id: "econ202",
    title: "Microeconomic Theory & Research",
    code: "ECON 202",
    category: "Economics",
    icon: TrendingUp,
    text: `Course: ECON 202 - Intermediate Microeconomic Analysis
Instructor: Prof. Anderson

Module 1: Consumer Choice and Utility Maximization
- Indifference curves and budget constraints
- Income and substitution effects (Slutsky equation)
- Compensated and uncompensated demand curves
- Assignment 1: Utility optimization mathematical derivations

Module 2: Production Theory and Market Structures
- Isoquants, marginal rate of technical substitution
- Cost minimization in short vs long run
- Perfect competition vs Monopoly equilibrium
- Deadweight loss and price discrimination

Module 3: Game Theory & Market Strategy
- Simultaneous games, Nash equilibrium, and prisoner's dilemma
- Sequential games and backward induction
- Oligopoly models: Cournot, Bertrand, and Stackelberg
- Final Term Paper: Empirical analysis of digital platform monopolies`,
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
