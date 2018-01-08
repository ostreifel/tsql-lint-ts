import commander = require("commander");
import { ICliOptions, ILogger, run } from "./runner";
import { dedent } from "./utils";

const VERSION: string = "0.0.1";

interface IOption {
    short?: string;
    // Commander will camelCase option names.
    name: keyof ICliOptions;
    type: "string" | "boolean" | "array";
    describe: string; // Short, used for usage message
    description: string; // Long, used for `--help`
}

const options: IOption[] = [
    {
        short: "i",
        name: "init",
        type: "boolean",
        describe: "generate a .tsqllintrc config file in the current working directory",
        description: "Generates a .tsqllintrc config file in the current working directory.",
    },
    {
        short: "p",
        name: "project",
        type: "string",
        describe: ".tsqllintrc file",
        description: dedent`
            The path or directory containing a .tsqllintrc file that will be
            used to determine which files will be linted. This flag also enables
            rules that require the type checker.`,
    },
];

// Setup Commands
(() => {
    commander.version(VERSION, "-v, --version");
    for (const option of options) {
        const commanderStr = optionUsageTag(option) + optionParam(option);
        if (option.type === "array") {
            commander.option(commanderStr, option.describe, collect, []);
        } else {
            commander.option(commanderStr, option.describe);
        }
    }
    commander.on("--help", () => {
        // TODO help text beyond options here;
    });

    function optionUsageTag({short, name}: IOption) {
        return short !== undefined ? `-${short}, --${name}` : `--${name}`;
    }

    function optionParam(option: IOption) {
        switch (option.type) {
            case "string":
                return ` [${option.name}]`;
            case "array":
                return ` <${option.name}>`;
            case "boolean":
                return "";
        }
    }
    function collect(val: string, memo: string[]) {
        memo.push(val);
        return memo;
    }
})();

// Handle input
const parsed = commander.parseOptions(process.argv.slice(2));
commander.args = parsed.args;
if (parsed.unknown.length !== 0) {
    (commander.parseArgs as (args: string[], unknown: string[]) => void)([], parsed.unknown);
}

const argv = commander.opts() as any as ICliOptions;

const logger: ILogger = {
    log: console.log,
    error: console.error,
};
const status = run(argv, logger);
process.exit(status);
