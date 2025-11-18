/**
 * Universal 21-Slot Architecture
 * Championship-grade slot definitions for FAF Compiler Engine MK3
 */
export interface SlotDefinition {
    number: number;
    name: string;
    description: string;
    category: 'core' | 'stack' | 'architecture';
}
export declare const UNIVERSAL_SLOTS: SlotDefinition[];
export interface SlotStatus {
    slotNumber: number;
    slotName: string;
    required: boolean;
    filled: boolean;
    value?: any;
    points: number;
}
export interface ValidationResult {
    totalSlots: 21;
    relevantSlots: number;
    filledSlots: number;
    slots: SlotStatus[];
    score: number;
    medal: 'trophy' | 'gold' | 'silver' | 'bronze' | 'red' | 'white';
}
/**
 * Get slot name by number
 */
export declare function getSlotName(slotNumber: number): string;
/**
 * Get all slot names
 */
export declare function getAllSlotNames(): string[];
/**
 * Check if a slot is in the core category
 */
export declare function isCoreSlot(slotName: string): boolean;
