/**
 * FAF DNA - The Lifecycle of AI Context
 *
 * Revolutionary Context Authentication & Versioning System
 * Every .faf has:
 * - Birth Certificate (Authentication)
 * - Birth DNA (Initial score from CLAUDE.md)
 * - Growth Record (Version history)
 * - Life Events (Log of all changes)
 * - Immortality (Disaster recovery through bi-sync)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { colors } from '../fix-once/colors';

// ==================== TYPE DEFINITIONS ====================

export interface BirthCertificate {
  born: Date;
  birthDNA: number;  // Initial score from CLAUDE.md only
  birthDNASource: 'CLAUDE.md' | 'legacy';
  projectDNA: string;   // Hash of initial state
  authenticated: boolean;
  certificate: string;  // FAF-YYYY-PROJECT-XXXX
  authDate?: Date;
}

export interface VersionEntry {
  version: string;      // v1.0.0, v1.0.1, etc
  timestamp: Date;
  score: number;
  changes: string[];
  approved?: boolean;
  growth?: number;      // Points from birth weight
  growthRate?: number;  // Points per day
}

export interface Milestone {
  type: 'birth' | 'first_save' | 'doubled' | 'championship' | 'elite' | 'peak' | 'perfect' | 'current';
  score: number;
  date: Date;
  version: string;
  label?: string;
  emoji?: string;
}

export interface CurrentState {
  version: string;
  score: number;
  approved: boolean;
  lastApproved?: string;  // Version number of last approval
  lastSync: Date;
}

export interface RecoveryInfo {
  claudeMD: string;      // Path to CLAUDE.md
  lastBackup: Date;
  syncStatus: 'active' | 'pending' | 'failed';
  autoRecover: boolean;
}

export interface GrowthAnalytics {
  totalGrowth: number;        // Total points gained
  daysActive: number;         // Days since birth
  averageDailyGrowth: number; // Points per day
  bestDay: { date: Date; growth: number };
  bestWeek: { start: Date; growth: number };
  milestones: Milestone[];
}

export interface FafDNA {
  // Birth Certificate - Immutable origin
  birthCertificate: BirthCertificate;
  
  // Version History - Complete evolution
  versions: VersionEntry[];
  
  // Current State
  current: CurrentState;
  
  // Immortality - Recovery capability
  recovery: RecoveryInfo;
  
  // Analytics
  growth: GrowthAnalytics;
  
  // Metadata
  lastModified: Date;
  format: 'faf-dna-v1';
}

// ==================== DNA MANAGER ====================

export class FafDNAManager {
  private dnaPath: string;
  private projectPath: string;
  private dna: FafDNA | null = null;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.dnaPath = path.join(projectPath, '.faf-dna');
  }

  // Read-only. The `.faf-dna` birth certificate is written once per project
  // and never changed, lost or reissued, so this package has no code path that
  // creates or rewrites it: no birth, authenticate, recordGrowth, approve or
  // save. This manager only reads a record with load().

  /**
   * Get journey display (for UI)
   */
  getJourney(format: 'compact' | 'detailed' = 'compact'): string | Milestone[] {
    if (!this.dna) return format === 'compact' ? '' : [];

    const milestones = this.dna.growth.milestones;

    if (format === 'compact') {
      // Build compact journey: 22% → 85% → 99% ← 92%
      const birth = milestones.find(m => m.type === 'birth');
      const firstSave = milestones.find(m => m.type === 'first_save');
      const peak = milestones.find(m => m.type === 'peak');
      const current = this.dna.current.score;

      let journey = `${birth?.score || 0}%`;
      
      if (firstSave && firstSave.score !== birth?.score) {
        journey += ` → ${firstSave.score}%`;
      }
      
      if (peak) {
        journey += ` → ${peak.score}%`;
        
        // Add back arrow if current is less than peak
        if (current < peak.score) {
          journey += ` ← ${current}%`;
        }
      } else if (current !== (firstSave?.score || birth?.score)) {
        journey += ` → ${current}%`;
      }

      return journey;
    }

    return milestones;
  }

  /**
   * Get Birth DNA display (always show origin)
   */
  getBirthDNADisplay(): { current: number; birthDNA: number; growth: number; birthDate: Date } {
    if (!this.dna) {
      return { current: 0, birthDNA: 0, growth: 0, birthDate: new Date() };
    }

    return {
      current: this.dna.current.score,
      birthDNA: this.dna.birthCertificate.birthDNA,
      growth: this.dna.current.score - this.dna.birthCertificate.birthDNA,
      birthDate: this.dna.birthCertificate.born
    };
  }

  /**
   * Get version log (Complete history)
   */
  getLog(): string[] {
    if (!this.dna) return [];

    return this.dna.versions.map(v => {
      const growth = v.growth || 0;
      const emoji = v.approved ? '✅' : growth > 50 ? '🚀' : growth > 20 ? '📈' : '📊';
      return `${v.version} - ${v.score}% ${emoji} (${this.formatDate(v.timestamp)}) ${v.changes.join(', ')}`;
    });
  }

  /**
   * Load existing DNA
   */
  async load(): Promise<FafDNA | null> {
    try {
      const content = await fs.readFile(this.dnaPath, 'utf-8');
      this.dna = JSON.parse(content);
      
      // Convert date strings back to Date objects
      if (this.dna) {
        this.dna.birthCertificate.born = new Date(this.dna.birthCertificate.born);
        if (this.dna.birthCertificate.authDate) {
          this.dna.birthCertificate.authDate = new Date(this.dna.birthCertificate.authDate);
        }
        
        this.dna.versions = this.dna.versions.map(v => ({
          ...v,
          timestamp: new Date(v.timestamp)
        }));
        
        this.dna.current.lastSync = new Date(this.dna.current.lastSync);
        this.dna.recovery.lastBackup = new Date(this.dna.recovery.lastBackup);
        
        this.dna.growth.bestDay.date = new Date(this.dna.growth.bestDay.date);
        this.dna.growth.bestWeek.start = new Date(this.dna.growth.bestWeek.start);
        
        this.dna.growth.milestones = this.dna.growth.milestones.map(m => ({
          ...m,
          date: new Date(m.date)
        }));
        
        this.dna.lastModified = new Date(this.dna.lastModified);
      }
      
      return this.dna;
    } catch (err) {
      return null;
    }
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

/**
 * Display helper for Birth DNA in all score outputs
 */
export function displayScoreWithBirthDNA(
  current: number,
  birthDNA: number,
  birthDate: Date,
  _options: { showGrowth?: boolean; showJourney?: boolean } = {}
): void {
  // Import championship medal system
  const { getScoreMedal, getTierInfo } = require('../utils/championship-core'); // eslint-disable-line @typescript-eslint/no-var-requires

  // Get medal for current score
  const { medal, status} = getScoreMedal(current);
  const tierInfo = getTierInfo(current);
  const growth = current - birthDNA;

  // OPTIMIZED FIRST TWO LINES - Match MCP's championship scorecard format
  // Line 1: Score with medal (STRONG WHITE BOLD - default)
  console.log(colors.bold(`${medal} Score: ${current}/100`));

  // Line 2: Progress bar (STRONG WHITE - default)
  const barWidth = 24;
  const filled = Math.floor((current / 100) * barWidth);
  const empty = barWidth - filled;
  const progressBar = '█'.repeat(filled) + '░'.repeat(empty);
  console.log(colors.bold(`${progressBar} ${current}%`));

  // Line 3: Status (STRONG WHITE - default)
  console.log(colors.bold(`Status: ${status}`));

  // Line 4: Next milestone (STRONG WHITE - default)
  if (tierInfo.next && tierInfo.nextTarget && tierInfo.nextMedal) {
    const pointsToGo = tierInfo.nextTarget - current;
    console.log('');
    console.log(colors.bold(`Next milestone: ${tierInfo.nextTarget}% ${tierInfo.nextMedal} ${tierInfo.next} (${pointsToGo} points to go!)`));
  }

  // Detailed breakdown (collapsed in Claude Code, visible in terminal)
  console.log('');
  console.log(colors.bold('🏎️  FAF Championship Status'));
  console.log('━'.repeat(40));
  console.log(`Birth DNA: ${birthDNA}% (born ${birthDate.toISOString().split('T')[0]})`);

  const timeMs = Date.now() - new Date(birthDate).getTime();
  const daysOld = Math.floor(timeMs / (1000 * 60 * 60 * 24));
  const hoursOld = Math.floor(timeMs / (1000 * 60 * 60));

  let timeDisplay = '';
  if (daysOld > 0) {
    timeDisplay = `${daysOld} day${daysOld === 1 ? '' : 's'}`;
  } else if (hoursOld > 0) {
    timeDisplay = `${hoursOld} hour${hoursOld === 1 ? '' : 's'}`;
  } else {
    const minutesOld = Math.floor(timeMs / (1000 * 60));
    timeDisplay = `${minutesOld} minute${minutesOld === 1 ? '' : 's'}`;
  }

  console.log(`Growth: +${growth}% over ${timeDisplay}`);

  if (tierInfo.next && tierInfo.nextTarget && tierInfo.nextMedal) {
    const pointsToGo = tierInfo.nextTarget - current;
    console.log(colors.bold(`Next Milestone: ${tierInfo.nextTarget}% ${tierInfo.nextMedal} ${tierInfo.next} (${pointsToGo}% to go!)`));
  }
  console.log('');
}

/**
 * Get emoji for score
 */