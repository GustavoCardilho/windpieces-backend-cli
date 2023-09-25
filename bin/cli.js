#!/usr/bin/env node

import chalk from "chalk";
import inquirer from "inquirer";
import { execSync } from "child_process";

const runCommand = (command) => {
    try {
        execSync(command, { stdio: "inherit" });
    } catch (err) {
        console.error("Error: ", err);
        return false;
    }
    return true;
};

let repoName;
let isInstallPrisma = false;
let databaseWithPrisma = "";
let packageManager = "";

async function DefineRepoName() {
    const res = await inquirer.prompt([
        {
            type: "input",
            name: "repoName",
            message: "What is the name of your project?",
            default: "my-app",
        },
    ]);
    repoName = res.repoName;

    if (!res.repoName) {
        console.error(chalk.red("Please specify the project directory:"));
        process.exit(1);
    }
}

async function addPrisma() {
    const res = await inquirer.prompt([
        {
            type: "confirm",
            name: "prisma",
            message: "Would you like to add Prisma to your project?",
            default: false,
        },
    ]);
    isInstallPrisma = res.prisma;

    if (res.prisma) {
        const res = await inquirer.prompt([
            {
                type: "list",
                name: "database",
                message: "What database would you like to use?",
                choices: ["PostgreSQL", "MySQL", "MongoDB", "SQLite"],
                default: "PostgreSQL",
            },
        ]);
        databaseWithPrisma = res.database.toLowerCase();
    }
}

async function DefinePackageManager() {
    const res = await inquirer.prompt([
        {
            type: "list",
            name: "packageManager",
            message: "What package manager do you use?",
            choices: ["npm", "yarn", "pnpm"],
            default: "npm",
        },
    ]);
    packageManager = res.packageManager;
}

function installProject() {
    const gitCheckoutCommand = `git clone --depth 1 https://github.com/Kyoudan/windpieces-backend-starter.git ${repoName}`;
    let installDeps;

    /*     switch (packageManager) {
        case "yarn":
            installDeps = `cd ${repoName} && yarn`;
            break;
        case "pnpm":
            installDeps = `cd ${repoName} && pnpm install`;
            break;
        default:
            installDeps = `cd ${repoName} && npm install`;
            break;
    } */

    console.log(chalk.green("Creating new project..."));
    console.clear();
    const checkedOut = runCommand(gitCheckoutCommand);
    if (!checkedOut) process.exit(1);

    console.log(chalk.green("Installing dependencies..."));

    if (isInstallPrisma) {
        let installPrisma;

        if (packageManager == "yarn" || packageManager == "pnpm") {
            installPrisma = `cd ${repoName} && ${packageManager} add prisma @prisma/client -D --ignore-workspace-root-check`;
        } else {
            installPrisma = `cd ${repoName} && npm install prisma @prisma/client --save-dev --ignore-workspace-root-check`;
        }

        const prismaDependencies = runCommand(installPrisma);
        if (!prismaDependencies) process.exit(1);

        const prismaInstalled = runCommand(
            `cd ${repoName} && npx prisma init --datasource-provider ${databaseWithPrisma}`
        );
        if (!prismaInstalled) process.exit(1);
    }
    console.clear();
    console.log("Done!");

    let initCommand;

    if (packageManager == "yarn" || packageManager == "pnpm") {
        initCommand = `cd ${chalk.green(repoName)} && ${packageManager} dev`;
    } else {
        initCommand = `cd ${repoName} && npm run dev`;
    }
    console.log("-".repeat(50) + "\n");
    console.log("Your project is ready!");
    console.log(`use ${initCommand}`);
    console.log(
        `consult the ${chalk.green(
            "package.json"
        )} file to check all available scripts \n`
    );

    console.log(
        `supoort me on github: ${chalk.green(
            "https://github.com/Kyoudan/windpieces-backend-cli"
        )}\n\n`
    );

    console.log("Happy coding! 💖\n");

    console.log("-".repeat(50));
}

async function setup() {
    console.clear();
    await DefineRepoName();
    await addPrisma();
    await DefinePackageManager();
    installProject();
}

setup();
