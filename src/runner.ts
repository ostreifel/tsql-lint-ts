import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import { executeForFile } from "./rulesManager";

export interface ICliOptions {
    init?: boolean;
    project?: string;
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
    return runProject(project, logger);
}

function runProject(project: string, logger: ILogger): Status {
    let errorCount: number = 0;
    const files = getFiles();
    for (const file of files) {
        const startMs = new Date().getTime();
        const fileContents = fs.readFileSync(file, "utf8");
        const fileErrors = executeForFile(fileContents, file);
        for (const error of fileErrors) {
            const {startPos} = error;
            console.error(`ERROR: ${file}[${startPos.line + 1}, ${startPos.column + 1}] ${error.message}`);
        }
        if (fileErrors.length > 0) {
            console.error(`${fileErrors.length} errors detected in ${file}`);
        }
        const endMs = new Date().getTime();
        console.log(`Parse time ${endMs - startMs}, ${(fileContents.match(/\n/g) || []).length}, ${file}`);
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
        return glob.sync(filesGlob);
    }
}
