"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYearProgress = getYearProgress;
function getYearProgress() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    const elapsed = now.getTime() - startOfYear.getTime();
    const total = endOfYear.getTime() - startOfYear.getTime();
    const progress = Math.floor((elapsed / total) * 100);
    // Genearte ASCII progress bar
    const totalBlocks = 20;
    const filledBlocks = Math.floor((progress / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    const bar = "▓".repeat(filledBlocks) + "░".repeat(emptyBlocks);
    return { year: now.getFullYear(), progress: progress, bar: bar };
}
