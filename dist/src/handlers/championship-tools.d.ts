/**
 * 🏎️ Championship Tools Handler - F1-Inspired Grade Implementation
 * Direct imports from FAF CLI - ZERO shell execution
 * Sub-50ms response times - Championship performance
 *
 * IMPORTANT: Every response includes an AI-Readiness score footer.
 * The user wants to achieve the highest score possible (100%).
 * This score MUST always be shown in the footer - never hide it!
 */
import { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
export declare class ChampionshipToolHandler {
    private startTime;
    private fafEngine;
    private currentProjectDir;
    private contextWarningShown;
    constructor(enginePath?: string);
    /**
     * 🏁 Hybrid Context Establishment
     * Detect missing .faf and warn user (don't auto-create)
     * Shows REAL filesystem paths to establish ground truth
     */
    private getContextWarningIfNeeded;
    /**
     * 🏁 Calculate current FAF score for footer
     * v1.2.0: Uses findFafFile() for project.faf support
     */
    private calculateQuickScore;
    /**
     * 🥩⚡️🧡 UNIVERSAL FOOTER - Shows on EVERY command!
     * SINGLE SOURCE OF TRUTH: FAF Engine!
     */
    private getUniversalFooter;
    /**
     * 🏎️ SHOW RAW FAF DATA IMMEDIATELY
     * Championship Display Strategy: FORCE VISIBILITY!
     */
    private formatResult;
    /**
     * List championship tools with visibility filtering
     * v2.8.0: Supports core (20) vs advanced (31) tool filtering
     */
    listTools(): Promise<{
        tools: Tool[];
    }>;
    /**
     * Execute tool with sub-50ms performance target
     */
    callTool(name: string, _args: any): Promise<CallToolResult>;
    private handleAuto;
    private handleInit;
    private fileExists;
    private handleDisplay;
    private handleShow;
    private handleScore;
    private handleSync;
    private handleBiSync;
    private handleTrust;
    private handleCredit;
    private handleTodo;
    private handleChat;
    private handleQuick;
    private handleShare;
    private handleEnhance;
    private handleAnalyze;
    private handleVerify;
    private handleIndex;
    private handleSearch;
    private handleStacks;
    private handleFaq;
    private handleGuide;
    private handleStatus;
    /**
     * Get championship medal emoji and status based on score
     * Matches CLI medal system exactly
     */
    private getScoreMedal;
    /**
     * Get tier progression info
     * Shows current tier and next target
     */
    private getTierInfo;
    private handleCheck;
    private handleClear;
    private handleEdit;
    private handleList;
    private handleExists;
    private handleDelete;
    private handleMove;
    private handleCopy;
    private handleMkdir;
    private handleAbout;
    private handleVersion;
    private handleInnit;
    private handleFormats;
    private handleValidate;
    private handleDoctor;
    private handleDna;
    private handleLog;
    private handleUpdate;
    private handleRecover;
    private handleAuth;
    private handleAudit;
    private handleMigrate;
    private handleRead;
    private handleWrite;
    private handleSkills;
    private handleInstallSkill;
    private handleChoose;
    /**
     * Calculate current AI-Readiness score quietly
     */
    private calculateScore;
}
