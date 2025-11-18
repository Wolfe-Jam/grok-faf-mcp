"use strict";
/**
 * 🎯 AI|HUMAN Balance Visualizer
 * Visual-only gamification that drives +144% human context completion
 * The 50/50 eternal truth: AI detects tech (50%), humans provide meaning (50%)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceVisualizer = void 0;
const colors_1 = require("../fix-once/colors");
class BalanceVisualizer {
    static BAR_WIDTH = 40;
    static CYAN = '#00FFFF';
    static ORANGE = '#FFA500';
    static GREEN = '#00FF00';
    /**
     * Calculate balance from FAF data
     * Matches fafdev.tools calculation - INDEPENDENT percentages
     * AI: How complete is technical context (0-100%)
     * HUMAN: How complete is human context (0-100%)
     * Perfect balance when both are high and similar
     */
    static calculateBalance(fafData) {
        // AI fields (technical detection) - what AI can detect
        const aiFields = [
            'stack.frontend',
            'stack.backend',
            'stack.database',
            'stack.runtime',
            'stack.build',
            'stack.package_manager',
            'project.main_language',
            'project.generated',
            'ai_instructions',
            'preferences.quality_bar',
            'state.version',
            'state.phase'
        ];
        // HUMAN fields (context meaning) - what humans provide
        const humanFields = [
            'human_context.who',
            'human_context.what',
            'human_context.why',
            'human_context.where',
            'human_context.when',
            'human_context.how',
            'project.goal',
            'project.mission',
            'state.focus',
            'state.next_milestone',
            'state.blockers',
            'preferences.communication'
        ];
        let aiFilledCount = 0;
        let humanFilledCount = 0;
        // Count AI fields
        aiFields.forEach(field => {
            const value = field.split('.').reduce((obj, key) => obj?.[key], fafData);
            if (value && value !== 'None' && value !== 'Not specified' && value !== '') {
                aiFilledCount++;
            }
        });
        // Count HUMAN fields
        humanFields.forEach(field => {
            const value = field.split('.').reduce((obj, key) => obj?.[key], fafData);
            if (value && value !== 'Not specified' && value !== '') {
                humanFilledCount++;
            }
        });
        // Calculate INDEPENDENT percentages (like fafdev.tools)
        const aiPercentage = Math.round((aiFilledCount / aiFields.length) * 100);
        const humanPercentage = Math.round((humanFilledCount / humanFields.length) * 100);
        // Perfect balance when both are high and within 10% of each other
        const isBalanced = Math.abs(aiPercentage - humanPercentage) <= 10 &&
            aiPercentage >= 50 &&
            humanPercentage >= 50;
        return {
            aiPercentage,
            humanPercentage,
            isBalanced
        };
    }
    /**
     * Generate the visual balance bar
     * Matches fafdev.tools - single bar showing AI|HUMAN proportion
     */
    static generateBalanceBar(balance) {
        const { aiPercentage, humanPercentage, isBalanced } = balance;
        // Calculate proportional split (matching fafdev.tools logic)
        const totalContext = aiPercentage + humanPercentage;
        let aiProportion;
        let humanProportion;
        if (totalContext === 0) {
            aiProportion = 50;
            humanProportion = 50;
        }
        else {
            aiProportion = Math.round((aiPercentage / totalContext) * 100);
            humanProportion = 100 - aiProportion;
        }
        // Build the visual bar
        const lines = [];
        // Header matching fafdev.tools style
        lines.push('');
        if (isBalanced) {
            lines.push(colors_1.colors.success(colors_1.colors.bold('   PRD Balance')));
        }
        else {
            lines.push(colors_1.colors.bright(colors_1.colors.bold('   AI|HUMAN CONTEXT BALANCE')));
        }
        lines.push('');
        // Build the single unified bar
        const aiBarWidth = Math.round((aiProportion / 100) * this.BAR_WIDTH);
        const humanBarWidth = this.BAR_WIDTH - aiBarWidth;
        let barLine = '   ';
        // GREEN celebration when perfectly balanced!
        if (isBalanced) {
            // Entire bar turns GREEN for perfect balance
            barLine += colors_1.bars.green(this.BAR_WIDTH);
        }
        else {
            // Normal cyan/orange split when not balanced
            if (aiBarWidth > 0 && humanBarWidth > 0) {
                barLine += colors_1.bars.cyan(aiBarWidth);
                barLine += colors_1.bars.orange(humanBarWidth);
            }
            else if (aiBarWidth > 0) {
                barLine += colors_1.bars.cyan(this.BAR_WIDTH);
            }
            else {
                barLine += colors_1.bars.orange(this.BAR_WIDTH);
            }
        }
        lines.push(barLine);
        // Guidance text
        lines.push('');
        if (isBalanced) {
            lines.push(colors_1.colors.muted('   ⚖️ PERFECT BALANCE!'));
        }
        else {
            lines.push(colors_1.colors.muted('   DROP FILES OR ADD CONTEXT TO SEE AI/HUMAN BALANCE'));
        }
        // Status message
        lines.push('');
        if (isBalanced) {
            lines.push(colors_1.colors.success('   ✅ Your context is perfectly balanced!'));
            lines.push(colors_1.colors.success('   🏆 AI understands your tech, you provide the meaning'));
        }
        else if (aiPercentage > humanPercentage + 20) {
            lines.push(colors_1.colors.warning('   📝 Add more human context (who, what, why, etc.)'));
            lines.push(colors_1.colors.muted('   💡 AI detected your tech, now tell your story'));
        }
        else if (humanPercentage > aiPercentage + 20) {
            lines.push(colors_1.colors.warning('   🔧 Add more technical details (stack, dependencies)'));
            lines.push(colors_1.colors.muted('   💡 Great story, now specify the implementation'));
        }
        else if (aiPercentage < 30 && humanPercentage < 30) {
            lines.push(colors_1.colors.error('   ⚠️  Both AI and HUMAN context are low'));
            lines.push(colors_1.colors.muted('   💡 Start by filling in basic project info'));
        }
        else {
            lines.push(colors_1.colors.primary('   🎯 Getting closer to balance!'));
            lines.push(colors_1.colors.muted(`   📊 AI: ${aiPercentage}% | HUMAN: ${humanPercentage}%`));
        }
        return lines.join('\n');
    }
    /**
     * Generate a compact balance indicator for inline display
     */
    static generateCompactBalance(balance) {
        const { aiPercentage, isBalanced } = balance;
        const humanPercentage = 100 - aiPercentage; // Force balance to 100%
        if (isBalanced) {
            return colors_1.colors.success('⚖️ BALANCED');
        }
        const aiColor = colors_1.colors.primary;
        const humanColor = colors_1.colors.secondary;
        return `${aiColor(`AI:${aiPercentage}%`)} | ${humanColor(`HUMAN:${humanPercentage}%`)}`;
    }
    /**
     * Get balance achievement message for gamification
     */
    static getAchievementMessage(balance) {
        const { isBalanced, aiPercentage, humanPercentage } = balance;
        if (isBalanced && aiPercentage >= 80 && humanPercentage >= 80) {
            return colors_1.colors.success(colors_1.colors.bold('🏆 CHAMPION BALANCE - Both AI and HUMAN above 80%!'));
        }
        else if (isBalanced) {
            return colors_1.colors.success('✨ Balance achieved! Keep adding context to reach Champion status');
        }
        else if (Math.abs(aiPercentage - humanPercentage) <= 5) {
            return colors_1.colors.warning('🔥 So close to perfect balance! Just a few more fields...');
        }
        return null;
    }
}
exports.BalanceVisualizer = BalanceVisualizer;
//# sourceMappingURL=balance-visualizer.js.map