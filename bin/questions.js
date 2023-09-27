#!/usr/bin/env node
import chalk from "chalk";
import inquirer from "inquirer";

class Questions {
  constructor() {
    this.isInstallPrisma = false;
  }

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

      this.isInstallPrisma = true;

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
    if (this.isInstallPrisma) return;
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

  async addHusky() {
    const res = await inquirer.prompt([
      {
        type: "confirm",
        name: "husky",
        message: "Would you like to add Husky to your project?",
        default: false,
      },
    ]);
    return res.husky;
  }

  async addMoreLibraries() {
    const res = await inquirer.prompt([
      {
        type: "confirm",
        name: "moreLibrarys",
        message: "Would you like to add more librarys?",
        default: false,
      },
    ]);

    if (res.moreLibrarys) {
      const res = await inquirer.prompt([
        {
          type: "checkbox",
          name: "librarys",
          message: "What librarys would you like to add?",
          choices: ["jsonwebtoken", "bcrypt", "zod", "uuid", "date-fns"],
        },
      ]);
      return res.librarys;
    }
    return undefined;
  }

  async addCors() {
    const res = await inquirer.prompt([
      {
        type: "confirm",
        name: "cors",
        message: "Would you like to add CORS to your project?",
        default: false,
      },
    ]);
    if (res.cors) {
      const links = await inquirer.prompt([
        {
          type: "input",
          name: "links",
          message:
            "What links would you like to add? (separate links by space)",
          default: "",
        },
      ]);
      return links.links;
    }
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
