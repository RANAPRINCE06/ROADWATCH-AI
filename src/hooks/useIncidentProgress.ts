/**
 * useIncidentProgress – Automated progress engine for active repairs.
 *
 * Every 60 seconds this hook:
 *   1. Reads all active reports from localStorage.
 *   2. For each report with status "In Progress" or "Delayed" and a valid startedAt:
 *      - Calculates autoProgress = (elapsed / originalETA) * 100
 *      - Detects delay when elapsed > originalETA AND status is not "Completed"
 *      - Clamps progress at 95 when delayed (never auto-completes)
 *      - Clamps progress at 100 when on-time
 *   3. Applies only if autoProgress > currently stored progress (protects manual overrides
 *      that set a value *higher* than auto calc, but advances it when behind).
 *   4. Writes updates via updateReportStatus so all downstream listeners fire.
 *
 * The hook returns a helper `getAutoProgress(report)` so the UI can always render
 * the live computed value without waiting for the next tick.
 */

import { useEffect, useCallback } from 'react';
import { getReports, updateReportStatus, addLog, Report } from '../utils/storage';

// ─── Pure calculation helpers (exported for UI use) ──────────────────────────

export function computeAutoProgress(report: Report, nowMs: number): number {
  if (!report.startedAt || !report.etaMinutes || report.etaMinutes <= 0) {
    return report.progress ?? 0;
  }
  const elapsedMs = nowMs - report.startedAt;
  const elapsedMins = elapsedMs / 60000;
  const raw = (elapsedMins / report.etaMinutes) * 100;

  if (report.status === 'Delayed') {
    // Delayed: clamp at 95 so supervisor must manually complete
    return Math.min(95, Math.round(raw));
  }
  return Math.min(100, Math.round(raw));
}

export function isDelayed(report: Report, nowMs: number): boolean {
  if (!report.startedAt || !report.etaMinutes) return false;
  const elapsedMins = (nowMs - report.startedAt) / 60000;
  return (
    elapsedMins > report.etaMinutes &&
    report.status !== 'Resolved' &&
    report.status !== 'Completed' &&
    report.status !== 'Awaiting Resolution'
  );
}

/**
 * Returns the progress value the UI should display for a given report.
 * Picks the higher of the stored `r.progress` and the auto-calculated value,
 * so manual supervisor overrides are never lost.
 */
export function getDisplayProgress(report: Report, nowMs: number): number {
  const auto = computeAutoProgress(report, nowMs);
  const manual = report.progress ?? 0;
  return Math.max(auto, manual);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Call once at the top of the Dashboard component.
 * Runs an auto-sync every TICK_MS milliseconds.
 */
export function useIncidentProgress(TICK_MS = 60_000): void {
  const runTick = useCallback(() => {
    const nowMs = Date.now();
    const reports = getReports();

    const activeRepairs = reports.filter(
      (r) =>
        !r.resolved &&
        r.status !== 'Resolved' &&
        r.status !== 'Completed' &&
        r.status !== 'Detected' &&
        r.status !== 'Verified' &&
        r.status !== 'Queued' &&
        r.status !== 'Assigned' &&
        r.startedAt &&
        r.etaMinutes
    );

    activeRepairs.forEach((report) => {
      const auto = computeAutoProgress(report, nowMs);
      const storedProgress = report.progress ?? 0;
      const shouldBeDelayed = isDelayed(report, nowMs);

      // Build update payload — only push when something actually changed
      const updates: Partial<Report> = {};
      let changed = false;

      // ── 1. Auto-advance progress (never go backwards from a manual set) ──
      if (auto > storedProgress) {
        updates.progress = auto;
        changed = true;
      }

      // ── 2. Delay detection ────────────────────────────────────────────────
      if (shouldBeDelayed && report.status === 'In Progress') {
        updates.status = 'Delayed';
        updates.delayReason =
          report.delayReason || 'Elapsed time exceeded original ETA';
        updates.lastCrewUpdate = `Repair delayed – elapsed time exceeded ETA of ${report.etaMinutes}m.`;
        updates.lastCrewUpdateAt = nowMs;
        changed = true;

        addLog(
          'Auto Progress Engine',
          `Delay detected: "${report.title}" exceeded ETA of ${report.etaMinutes}m`,
          'WARN'
        );
      }

      // ── 3. SLA breach notification (but do NOT auto-complete) ─────────────
      if (report.slaMinutes && report.startedAt) {
        const elapsedMins = (nowMs - report.startedAt) / 60000;
        const slaBreached =
          elapsedMins >= report.slaMinutes &&
          report.status !== 'Resolved' &&
          report.status !== 'Completed';

        if (slaBreached && !report.delayReason) {
          addLog(
            'SLA Monitor',
            `SLA breach: "${report.title}" at ${report.location} exceeded ${report.slaMinutes}m SLA`,
            'WARN'
          );
        }
      }

      if (changed) {
        // Use a shallow update; updateReportStatus will merge & persist
        updateReportStatus(report.id, updates);
      }
    });
  }, []);

  useEffect(() => {
    // Run immediately on mount so the first render is accurate
    runTick();

    const interval = setInterval(runTick, TICK_MS);
    return () => clearInterval(interval);
  }, [runTick, TICK_MS]);
}
