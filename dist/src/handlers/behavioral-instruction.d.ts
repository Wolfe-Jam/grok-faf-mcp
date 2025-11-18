/**
 * 🏁 Behavioral Instruction for Claude
 * Simple fix: Tell Claude what users need
 */
export declare const CLAUDE_INSTRUCTION = "\n[CLAUDE BEHAVIORAL INSTRUCTION]\n\nUser needs: Score, Description constantly. It's what they're doing here.\n\nWhen you receive FAF output:\n1. ALWAYS show the score in conversation\n2. ALWAYS describe what the score means\n3. Users are here for visibility, not hidden results\n\nExample response pattern:\n\"Your FAF Score: X/100\nThis means: [description]\nNext steps: [what to improve]\"\n\nRemember: Users can't see function_results.\nThey need scores VISIBLE in conversation.\nIt's the whole point of FAF.\n\n[END INSTRUCTION]\n";
export declare function wrapWithInstruction(content: string): string;
/**
 * The Philosophy:
 * - Users paid for Claude to see results
 * - Scores hidden in function_results = useless
 * - Claude showing scores = valuable
 *
 * This is a workaround until Anthropic fixes visibility.
 * But honestly? It might be better - Claude can adapt
 * the display to context, making it MORE useful.
 */ 
