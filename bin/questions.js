#!/usr/bin/env node
import chalk from "chalk";
import inquirer from "inquirer";

class Questions {
  async DefineRepoName() {
    const res = await inquirer.prompt([
      {
        type: "input",
        name: "repoName",
        message: "What is the name of your project?",
        default: "my-app",
      },
    ]);

    if (!res.repoName) {
      console.error(chalk.red("Please specify the project directory:"));
      process.exit(1);
    }

    return res.repoName;
  }

  async OpenVSCodeQuestion() {
    const res = await inquirer.prompt([
      {
        type: "confirm",
        name: "vscode",
        message: "Would you like to open VSCode?",
        default: false,
      },
    ]);
    if (res.vscode) {
      return true;
    }
    return false;
  }

  async addPrisma() {
    const res = await inquirer.prompt([
      {
        type: "confirm",
        name: "prisma",
        message: "Would you like to add Prisma to your project?",
        default: false,
      },
    ]);

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

      return {
        isPrisma: res.prisma ? true : false,
        database: res.database.toLowerCase(),
      };
    }

    return {
      isPrisma: res.prisma ? true : false,
      database: false,
    };
  }

  async addDocker() {
    const res = await inquirer.prompt([
      {
        type: "confirm",
        name: "docker",
        message: "Would you like to add Docker to your project?",
        default: false,
      },
    ]);
    return res.docker;
  }

  async addMongoDB() {
    if (isInstallPrisma) return;
    const res = await inquirer.prompt([
      {
        type: "confirm",
        name: "mongo",
        message: "Would you like to add MongoDB to your project (Mongoose) ?",
        default: false,
      },
    ]);
    return res.mongo;
  }

  async DefinePackageManager() {
    const res = await inquirer.prompt([
      {
        type: "list",
        name: "packageManager",
        message: "What package manager do you use?",
        choices: ["npm", "yarn", "pnpm"],
        default: "npm",
      },
    ]);
    return res.packageManager;
  }
}

export default Questions;
