"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FafDNAManager = void 0;
exports.displayScoreWithBirthDNA = displayScoreWithBirthDNA;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const colors_1 = require("../fix-once/colors");
// ==================== DNA MANAGER ====================
class FafDNAManager {
    dnaPath;
    projectPath;
    dna = null;
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.dnaPath = path.join(projectPath, '.faf-dna');
    }
    /**
     * Initialize DNA (Birth)
     */
    async birth(birthDNA, fromClaudeMD = true) {
        // Generate birth certificate
        const birthCertificate = {
            born: new Date(),
            birthDNA,
            birthDNASource: fromClaudeMD ? 'CLAUDE.md' : 'legacy',
            projectDNA: await this.generateProjectDNA(),
            authenticated: false,
            certificate: this.generateCertificate()
        };
        // Create initial version
        const initialVersion = {
            version: 'v1.0.0',
            timestamp: new Date(),
            score: birthDNA,
            changes: ['Initial context from CLAUDE.md'],
            approved: false,
            growth: 0,
            growthRate: 0
        };
        // Initialize DNA structure
        this.dna = {
            birthCertificate,
            versions: [initialVersion],
            current: {
                version: 'v1.0.0',
                score: birthDNA,
                approved: false,
                lastSync: new Date()
            },
            recovery: {
                claudeMD: path.join(this.projectPath, 'CLAUDE.md'),
                lastBackup: new Date(),
                syncStatus: 'active',
                autoRecover: true
            },
            growth: {
                totalGrowth: 0,
                daysActive: 0,
                averageDailyGrowth: 0,
                bestDay: { date: new Date(), growth: 0 },
                bestWeek: { start: new Date(), growth: 0 },
                milestones: [
                    {
                        type: 'birth',
                        score: birthDNA,
                        date: new Date(),
                        version: 'v1.0.0',
                        label: 'Birth',
                        emoji: '🐣'
                    }
                ]
            },
            lastModified: new Date(),
            format: 'faf-dna-v1'
        };
        await this.save();
        return this.dna;
    }
    /**
     * Authenticate the DNA (Birth Certificate)
     */
    async authenticate() {
        if (!this.dna)
            throw new Error('DNA not initialized');
        this.dna.birthCertificate.authenticated = true;
        this.dna.birthCertificate.authDate = new Date();
        await this.save();
        return this.dna.birthCertificate.certificate;
    }
    /**
     * Record growth (Auto Evolution)
     */
    async recordGrowth(newScore, changes) {
        if (!this.dna)
            throw new Error('DNA not initialized');
        // Calculate growth metrics
        const growth = newScore - this.dna.birthCertificate.birthDNA;
        const daysSinceBirth = this.getDaysSince(this.dna.birthCertificate.born);
        const growthRate = daysSinceBirth > 0 ? growth / daysSinceBirth : growth;
        // Generate new version number
        const lastVersion = this.dna.versions[this.dna.versions.length - 1];
        const newVersion = this.incrementVersion(lastVersion.version, 'patch');
        // Create version entry
        const versionEntry = {
            version: newVersion,
            timestamp: new Date(),
            score: newScore,
            changes,
            approved: false,
            growth,
            growthRate
        };
        // Add to versions
        this.dna.versions.push(versionEntry);
        // Update current state
        this.dna.current = {
            version: newVersion,
            score: newScore,
            approved: false,
            lastApproved: this.dna.current.lastApproved,
            lastSync: new Date()
        };
        // Update milestones
        this.updateMilestones(newScore, newVersion);
        // Update analytics
        this.updateAnalytics(newScore);
        await this.save();
        return versionEntry;
    }
    /**
     * Approve current version (User satisfaction)
     */
    async approve() {
        if (!this.dna)
            throw new Error('DNA not initialized');
        const currentVersion = this.dna.versions.find(v => v.version === this.dna.current.version);
        if (currentVersion) {
            currentVersion.approved = true;
            // Increment minor version for approval
            const newVersion = this.incrementVersion(this.dna.current.version, 'minor');
            // Create approval version
            const approvalEntry = {
                version: newVersion,
                timestamp: new Date(),
                score: this.dna.current.score,
                changes: ['User approved'],
                approved: true,
                growth: this.dna.current.score - this.dna.birthCertificate.birthDNA,
                growthRate: this.calculateGrowthRate()
            };
            this.dna.versions.push(approvalEntry);
            this.dna.current.version = newVersion;
            this.dna.current.approved = true;
            this.dna.current.lastApproved = newVersion;
            // Mark as first save if it's the first approval
            if (!this.dna.growth.milestones.find(m => m.type === 'first_save')) {
                this.dna.growth.milestones.push({
                    type: 'first_save',
                    score: this.dna.current.score,
                    date: new Date(),
                    version: newVersion,
                    label: 'First Save',
                    emoji: '💾'
                });
            }
        }
        await this.save();
    }
    /**
     * Get journey display (for UI)
     */
    getJourney(format = 'compact') {
        if (!this.dna)
            return format === 'compact' ? '' : [];
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
            }
            else if (current !== (firstSave?.score || birth?.score)) {
                journey += ` → ${current}%`;
            }
            return journey;
        }
        return milestones;
    }
    /**
     * Get Birth DNA display (always show origin)
     */
    getBirthDNADisplay() {
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
    getLog() {
        if (!this.dna)
            return [];
        return this.dna.versions.map(v => {
            const growth = v.growth || 0;
            const emoji = v.approved ? '✅' : growth > 50 ? '🚀' : growth > 20 ? '📈' : '📊';
            return `${v.version} - ${v.score}% ${emoji} (${this.formatDate(v.timestamp)}) ${v.changes.join(', ')}`;
        });
    }
    /**
     * Load existing DNA
     */
    async load() {
        try {
            const content = await fs_1.promises.readFile(this.dnaPath, 'utf-8');
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
        }
        catch (err) {
            return null;
        }
    }
    /**
     * Save DNA to disk
     */
    async save() {
        if (!this.dna)
            return;
        this.dna.lastModified = new Date();
        await fs_1.promises.writeFile(this.dnaPath, JSON.stringify(this.dna, null, 2), 'utf-8');
    }
    /**
     * Generate unique project DNA hash
     */
    async generateProjectDNA() {
        const projectInfo = [
            this.projectPath,
            Date.now().toString(),
            Math.random().toString(36)
        ].join(':');
        return crypto
            .createHash('sha256')
            .update(projectInfo)
            .digest('hex')
            .substring(0, 16);
    }
    /**
     * Generate certificate number
     */
    generateCertificate() {
        const year = new Date().getFullYear();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const projectName = path.basename(this.projectPath)
            .replace(/[^A-Z0-9]/gi, '') // Remove special characters
            .toUpperCase()
            .substring(0, 8)
            .padEnd(4, 'X'); // Ensure minimum length
        return `FAF-${year}-${projectName}-${random}`;
    }
    /**
     * Increment version number
     */
    incrementVersion(version, type) {
        const parts = version.replace('v', '').split('.').map(Number);
        switch (type) {
            case 'major':
                return `v${parts[0] + 1}.0.0`;
            case 'minor':
                return `v${parts[0]}.${parts[1] + 1}.0`;
            case 'patch':
                return `v${parts[0]}.${parts[1]}.${parts[2] + 1}`;
        }
    }
    /**
     * Update milestones based on score
     */
    updateMilestones(score, version) {
        if (!this.dna)
            return;
        const milestones = this.dna.growth.milestones;
        const birthDNA = this.dna.birthCertificate.birthDNA;
        // Check for doubled score
        if (score >= birthDNA * 2 && !milestones.find(m => m.type === 'doubled')) {
            milestones.push({
                type: 'doubled',
                score,
                date: new Date(),
                version,
                label: 'Doubled',
                emoji: '2️⃣'
            });
        }
        // Check for championship (70%)
        if (score >= 70 && !milestones.find(m => m.type === 'championship')) {
            milestones.push({
                type: 'championship',
                score,
                date: new Date(),
                version,
                label: 'Championship',
                emoji: '🏆'
            });
        }
        // Check for elite (85%)
        if (score >= 85 && !milestones.find(m => m.type === 'elite')) {
            milestones.push({
                type: 'elite',
                score,
                date: new Date(),
                version,
                label: 'Elite',
                emoji: '⭐'
            });
        }
        // Check for perfect (100%)
        if (score >= 100 && !milestones.find(m => m.type === 'perfect')) {
            milestones.push({
                type: 'perfect',
                score,
                date: new Date(),
                version,
                label: 'Perfect',
                emoji: '💎'
            });
        }
        // Update peak if necessary
        const peakMilestone = milestones.find(m => m.type === 'peak');
        if (!peakMilestone || score > peakMilestone.score) {
            // Remove old peak
            if (peakMilestone) {
                const index = milestones.indexOf(peakMilestone);
                milestones.splice(index, 1);
            }
            // Add new peak
            milestones.push({
                type: 'peak',
                score,
                date: new Date(),
                version,
                label: 'Peak',
                emoji: '🏔️'
            });
        }
        // Always update current
        const currentIndex = milestones.findIndex(m => m.type === 'current');
        if (currentIndex >= 0) {
            milestones.splice(currentIndex, 1);
        }
        milestones.push({
            type: 'current',
            score,
            date: new Date(),
            version,
            label: 'Current',
            emoji: '📍'
        });
    }
    /**
     * Update growth analytics
     */
    updateAnalytics(score) {
        if (!this.dna)
            return;
        const growth = score - this.dna.birthCertificate.birthDNA;
        const daysSinceBirth = this.getDaysSince(this.dna.birthCertificate.born);
        this.dna.growth.totalGrowth = growth;
        this.dna.growth.daysActive = daysSinceBirth;
        this.dna.growth.averageDailyGrowth = daysSinceBirth > 0 ? growth / daysSinceBirth : growth;
        // Check for best day
        const todayGrowth = score - (this.dna.versions[this.dna.versions.length - 2]?.score || this.dna.birthCertificate.birthDNA);
        if (todayGrowth > this.dna.growth.bestDay.growth) {
            this.dna.growth.bestDay = {
                date: new Date(),
                growth: todayGrowth
            };
        }
        // TODO: Calculate best week
    }
    /**
     * Calculate days since date
     */
    getDaysSince(date) {
        const diff = Date.now() - date.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
    /**
     * Calculate growth rate
     */
    calculateGrowthRate() {
        if (!this.dna)
            return 0;
        const growth = this.dna.current.score - this.dna.birthCertificate.birthDNA;
        const days = this.getDaysSince(this.dna.birthCertificate.born);
        return days > 0 ? growth / days : growth;
    }
    /**
     * Format date for display
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
}
exports.FafDNAManager = FafDNAManager;
/**
 * Display helper for Birth DNA in all score outputs
 */
function displayScoreWithBirthDNA(current, birthDNA, birthDate, options = {}) {
    // Import championship medal system
    const { getScoreMedal, getTierInfo } = require('../utils/championship-core');
    // Get medal for current score
    const { medal, status } = getScoreMedal(current);
    const tierInfo = getTierInfo(current);
    const growth = current - birthDNA;
    // OPTIMIZED FIRST TWO LINES - Match MCP's championship scorecard format
    // Line 1: Score with medal (STRONG WHITE BOLD - default)
    console.log(colors_1.colors.bold(`${medal} Score: ${current}/100`));
    // Line 2: Progress bar (STRONG WHITE - default)
    const barWidth = 24;
    const filled = Math.floor((current / 100) * barWidth);
    const empty = barWidth - filled;
    const progressBar = '█'.repeat(filled) + '░'.repeat(empty);
    console.log(colors_1.colors.bold(`${progressBar} ${current}%`));
    // Line 3: Status (STRONG WHITE - default)
    console.log(colors_1.colors.bold(`Status: ${status}`));
    // Line 4: Next milestone (STRONG WHITE - default)
    if (tierInfo.next && tierInfo.nextTarget && tierInfo.nextMedal) {
        const pointsToGo = tierInfo.nextTarget - current;
        console.log('');
        console.log(colors_1.colors.bold(`Next milestone: ${tierInfo.nextTarget}% ${tierInfo.nextMedal} ${tierInfo.next} (${pointsToGo} points to go!)`));
    }
    // Detailed breakdown (collapsed in Claude Code, visible in terminal)
    console.log('');
    console.log(colors_1.colors.bold('🏎️  FAF Championship Status'));
    console.log('━'.repeat(40));
    console.log(`Birth DNA: ${birthDNA}% (born ${birthDate.toISOString().split('T')[0]})`);
    const timeMs = Date.now() - new Date(birthDate).getTime();
    const daysOld = Math.floor(timeMs / (1000 * 60 * 60 * 24));
    const hoursOld = Math.floor(timeMs / (1000 * 60 * 60));
    let timeDisplay = '';
    if (daysOld > 0) {
        timeDisplay = `${daysOld} day${daysOld === 1 ? '' : 's'}`;
    }
    else if (hoursOld > 0) {
        timeDisplay = `${hoursOld} hour${hoursOld === 1 ? '' : 's'}`;
    }
    else {
        const minutesOld = Math.floor(timeMs / (1000 * 60));
        timeDisplay = `${minutesOld} minute${minutesOld === 1 ? '' : 's'}`;
    }
    console.log(`Growth: +${growth}% over ${timeDisplay}`);
    if (tierInfo.next && tierInfo.nextTarget && tierInfo.nextMedal) {
        const pointsToGo = tierInfo.nextTarget - current;
        console.log(colors_1.colors.bold(`Next Milestone: ${tierInfo.nextTarget}% ${tierInfo.nextMedal} ${tierInfo.next} (${pointsToGo}% to go!)`));
    }
    console.log('');
}
/**
 * Get emoji for score
 */
function getScoreEmoji(score) {
    if (score >= 100)
        return '💎';
    if (score >= 90)
        return '🏆';
    if (score >= 85)
        return '⭐';
    if (score >= 70)
        return '🎯';
    if (score >= 50)
        return '📈';
    return '🌱';
}
//# sourceMappingURL=faf-dna.js.map