/**
 * Slot Validator - FAF Compiler Engine MK3
 * Championship-grade slot validation with .faf content analysis
 */
import { ValidationResult } from '../types/slots';
import { ProjectType } from '../types/project-types';
export declare class SlotValidator {
    /**
     * Validate all slots against project type
     */
    validate(fafContent: any, projectType: ProjectType): ValidationResult;
    /**
     * Check if a specific slot is filled in .faf content
     */
    private isSlotFilled;
    /**
     * Get the value of a slot from .faf content
     */
    private getSlotValue;
    /**
     * Helper: Check if fafContent has a specific framework
     */
    private hasFramework;
    /**
     * Determine medal from score
     */
    private getMedal;
    /**
     * Load and parse .faf file from directory
     */
    static loadFafFile(projectPath: string): Promise<any | null>;
}
