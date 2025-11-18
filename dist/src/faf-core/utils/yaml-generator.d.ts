/**
 * AI-Optimized YAML Generator v2.5.0
 * Generates .faf files with instant AI onboarding structure
 */
export declare function unescapeFromYaml(value: string): string;
export declare function escapeForYaml(value: string | undefined): string;
export declare function generateFafContent(projectData: {
    projectName: string;
    projectGoal?: string | undefined;
    mainLanguage: string;
    framework: string;
    cssFramework?: string;
    uiLibrary?: string;
    stateManagement?: string;
    backend: string;
    apiType: string;
    server: string;
    database: string;
    connection: string;
    hosting: string;
    buildTool: string;
    packageManager?: string;
    cicd: string;
    fafScore: number;
    slotBasedPercentage: number;
    projectType?: string;
    targetUser?: string;
    coreProblem?: string;
    missionPurpose?: string;
    deploymentMarket?: string;
    timeline?: string;
    approach?: string;
    additionalWho?: string[];
    additionalWhat?: string[];
    additionalWhy?: string[];
    additionalWhere?: string[];
    additionalWhen?: string[];
    additionalHow?: string[];
    projectDetailsScore?: number;
    projectSuccessRate?: number;
}): string;
