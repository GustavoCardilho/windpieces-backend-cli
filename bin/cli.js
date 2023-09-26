#!/usr/bin/env node

import chalk from "chalk";
import inquirer from "inquirer";
import { execSync } from "child_process";
import fs from "fs";
import { rimraf } from "rimraf";
import figlet from "figlet";

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
let isInstallDocker = false;
let isInstallMongo = false;
let isOpenVSCode = false;

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

async function OpenVSCodeQuestion() {
  const res = await inquirer.prompt([
    {
      type: "confirm",
      name: "vscode",
      message: "Would you like to open VSCode?",
      default: false,
    },
  ]);
  if (res.vscode) {
    isOpenVSCode = true;
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

async function addDocker() {
  const res = await inquirer.prompt([
    {
      type: "confirm",
      name: "docker",
      message: "Would you like to add Docker to your project?",
      default: false,
    },
  ]);
  isInstallDocker = res.docker;
}

async function addMongoDB() {
  if (isInstallPrisma) return;
  const res = await inquirer.prompt([
    {
      type: "confirm",
      name: "mongo",
      message: "Would you like to add MongoDB to your project (Mongoose) ?",
      default: false,
    },
  ]);
  isInstallMongo = res.mongo;
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

function installDockerInProject() {
  if (!isInstallDocker) return;
  fs.writeFileSync(
    `./${repoName}/dockerfile`,
    `
FROM node:alpine\n
WORKDIR /usr/botwindpieces\n
COPY package*.json ./\n
COPY . .\n
CMD ["npm", "start"]
        `
  );
  fs.writeFileSync(
    `./${repoName}/.dockerignore`,
    `
node_modules
.eslint.json
.gitignore
.prettierrc.json
        `
  );
  fs.writeFileSync(
    `./${repoName}/docker-compose.yml`,
    `
version: "3.1"\n

services:
    app:
        build: .
        command: "npm start"
        restart: always
        networks:
            - app-network

networks:
    app-network:
        driver: bridge

        `
  );
}

function installMongoInProject() {
  if (!isInstallMongo) return;

  let installMongoose;

  switch (packageManager) {
    case "yarn":
      installMongoose = `cd ${repoName} && yarn add mongoose`;
      break;
    case "pnpm":
      installMongoose = `cd ${repoName} && pnpm install mongoose`;
      break;
    default:
      installMongoose = `cd ${repoName} && npm install mongoose`;
      break;
  }

  const mongooseDependencies = runCommand(installMongoose);
  if (!mongooseDependencies) process.exit(1);

  fs.mkdirSync(`./${repoName}/src/database`);
  fs.mkdirSync(`./${repoName}/src/models`);

  fs.writeFileSync(
    `./${repoName}/src/database/connection_mongodb.ts`,
    `
import mongoose from 'mongoose'

const main = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL as string)
        console.log('MongoDB is connected')
    } catch (error) {
        console.log(error)
    }
}

export default main

`
  );
}

function installEnvorimentInProject() {
  fs.writeFileSync(
    `./${repoName}/.env`,
    `
DATABASE_URL= ""
PORT= 3000
        `
  );
}

function installServerFileInProject() {
  if (isInstallMongo) {
    fs.writeFileSync(
      `./${repoName}/src/server.ts`,
      `
import "dotenv/config";
import { app } from "@/app";
import { magenta } from "colorette";
import ConnectionMongoDB from "@/database/connection_mongodb";

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await ConnectionMongoDB();
  console.log("-".repeat(80) + "\\n");
  console.log(magenta("Server is running on http://localhost:" + PORT + "\\n"));
  console.log("-".repeat(80) + "\\n");
});`
    );

    return;
  }

  fs.writeFileSync(
    `./${repoName}/src/server.ts`,
    `
import "dotenv/config";
import { app } from "@/app";
import { magenta } from "colorette";

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
console.log("-".repeat(80) + "\\n");
console.log(magenta("Server is running on http://localhost:" + PORT + "\\n"));
console.log("-".repeat(80) + "\\n");
});`
  );
}

function OpenVSCode() {
  if (!isOpenVSCode) return;
  runCommand(`cd ${repoName} && code .`);
}

function removeGitFolder() {
  try {
    fs.readdir(repoName, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        if (file === ".git") {
          rimraf.moveRemove.sync(`./${repoName}/.git`);
        }
      }
    });
  } catch (err) {
    console.error(
      chalk.red("Error ao apagar a pasta .git... Esse processo é opcional")
    );
  }
}

function applyPrettier() {
  switch (packageManager) {
    case "yarn":
      runCommand(`cd ${repoName} && yarn prettier:fix`);
      break;
    case "pnpm":
      runCommand(`cd ${repoName} && pnpm prettier:fix`);
      break;
    default:
      runCommand(`cd ${repoName} && npm run prettier:fix`);
      break;
  }
}

function installProject() {
  const gitCheckoutCommand = `git clone --depth 1 https://github.com/Kyoudan/windpieces-backend-starter.git ${repoName}`;
  let installDeps;

  switch (packageManager) {
    case "yarn":
      installDeps = `cd ${repoName} && yarn`;
      break;
    case "pnpm":
      installDeps = `cd ${repoName} && pnpm install`;
      break;
    default:
      installDeps = `cd ${repoName} && npm install`;
      break;
  }

  console.log(chalk.green("Creating new project..."));

  console.clear();
  const checkedOut = runCommand(gitCheckoutCommand);
  if (!checkedOut) process.exit(1);

  console.log(chalk.green("Installing dependencies..."));
  removeGitFolder();
  installDockerInProject();
  installMongoInProject();
  installEnvorimentInProject();
  installServerFileInProject();
  if (isInstallPrisma) {
    let installPrisma;

    if (packageManager == "yarn" || packageManager == "pnpm") {
      installPrisma = `cd ${repoName} && ${packageManager} add prisma @prisma/client -D`;
    } else {
      installPrisma = `cd ${repoName} && npm install prisma @prisma/client --save-dev`;
    }

    const prismaDependencies = runCommand(installPrisma);
    if (!prismaDependencies) process.exit(1);

    const prismaInstalled = runCommand(
      `cd ${repoName} && npx prisma init --datasource-provider ${databaseWithPrisma}`
    );
    if (!prismaInstalled) process.exit(1);
  }

  console.clear();
  console.log(chalk.green("Organizing files..."));
  applyPrettier();
  console.clear();
  console.log("Done!");

  finalMessage();
}

async function finalMessage() {
  let initCommand;

  if (packageManager == "yarn" || packageManager == "pnpm") {
    initCommand = `cd ${chalk.green(repoName)} && ${packageManager} dev`;
  } else {
    initCommand = `cd ${repoName} && npm run dev`;
  }

  figlet("READY!!");
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
  OpenVSCode();
}

async function setup() {
  console.clear();
  await DefineRepoName();
  await addPrisma();
  await addMongoDB();
  await addDocker();
  await DefinePackageManager();
  await OpenVSCodeQuestion();
  installProject();
}

setup();
