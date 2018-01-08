import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import { getLintConfiguration } from "./configuration";
import { SqlRuleFailure } from "./rules/common/SqlRuleFailure";
import { executeForFile } from "./rulesManager";

export interface ICliOptions {
    // config?: string;
    exclude?: string[];
    // fix?: boolean;
    // force?: boolean;
    // help?: boolean;
    init?: boolean;
    project?: string;
    // out?: string;
    // outputAbsolutePaths: boolean;
    // rulesDir?: string;
    // formattersDir: string;
    // format?: string;
    // typeCheck?: boolean;
    // test?: string;
    version?: boolean;
}

export interface ILogger {
    log(message: string): void;
    error(message: string): void;
}

export const enum Status {
    Ok = 0,
    FatalError = 1,
    LintError = 2,
}

export function run(options: ICliOptions, logger: ILogger): Status {
    const project = options.project || ".";
    const exclude = options.exclude || [];
    return runProject(project, exclude, logger);
}

function runProject(project: string, exclude: string[], logger: ILogger): Status {
    const config = getLintConfiguration(project);
    let errorCount: number = 0;
    const files = getFiles();
    for (const file of files) {
        const fileContents = fs.readFileSync(file, "utf8");
        const fileErrors = executeForFile(fileContents, file);
        if (fileErrors.length > 0) {
            console.error(`${fileErrors.length} errors detected in ${file}`);
        }
        errorCount += fileErrors.length;
    }
    if (errorCount > 0) {
        logger.log(`${errorCount} sql lint errors detected in project ${project}`);
        return Status.LintError;
    } else {
        logger.log(`No errors detected for ${project}`);
        return Status.Ok;
    }
    function getFiles(): string[] {
        const filesGlob = path.join(path.resolve(project), "**", "*.sql");
        return glob.sync(filesGlob, {ignore: exclude});
    }
}
