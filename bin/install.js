#!/usr/bin/env node

import chalk from "chalk";
import fs from "fs";
import { execSync } from "child_process";

class Install {
  constructor(
    repoName,
    packageManager,
    isInstallMongo,
    isInstallDocker,
    isInstallPrisma,
    databaseWithPrisma,
    actionClass
  ) {
    this.repoName = repoName;
    this.packageManager = packageManager;
    this.isInstallDocker = isInstallDocker;
    this.isInstallMongo = isInstallMongo;
    this.isInstallPrisma = isInstallPrisma;
    this.databaseWithPrisma = databaseWithPrisma;
    this.actionsClass = actionClass;
    this.runCommand = (command) => {
      try {
        execSync(command, { stdio: "inherit" });
      } catch (err) {
        console.error("Error: ", err);
        return false;
      }
      return true;
    };

  }

  installDockerInProject() {
    if (!this.isInstallDocker) return;
    fs.writeFileSync(
      `./${this.repoName}/dockerfile`,
      `
      FROM node:alpine\n
      WORKDIR /usr/botwindpieces\n
      COPY package*.json ./\n
      COPY . .\n
      CMD ["npm", "start"]
              `
    );
    fs.writeFileSync(
      `./${this.repoName}/.dockerignore`,
      `
      node_modules
      .eslint.json
      .gitignore
      .prettierrc.json
              `
    );
    fs.writeFileSync(
      `./${this.repoName}/docker-compose.yml`,
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

  installMongoInProject() {
    if (!this.isInstallMongo) return;

    let installMongoose;

    switch (this.packageManager) {
      case "yarn":
        installMongoose = `cd ${this.repoName} && yarn add mongoose`;
        break;
      case "pnpm":
        installMongoose = `cd ${this.repoName} && pnpm install mongoose`;
        break;
      default:
        installMongoose = `cd ${this.repoName} && npm install mongoose`;
        break;
    }

    const mongooseDependencies = this.runCommand(installMongoose);
    if (!mongooseDependencies) process.exit(1);

    fs.mkdirSync(`./${this.repoName}/src/database`);
    fs.mkdirSync(`./${this.repoName}/src/models`);

    fs.writeFileSync(
      `./${this.repoName}/src/database/connection_mongodb.ts`,
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

  installEnvorimentInProject() {
    fs.writeFileSync(
      `./${this.repoName}/.env`,
      `
      DATABASE_URL= ""
      PORT= 3000
              `
    );
  }

  installPrismaInProject() {
    if (!this.isInstallPrisma) return;
    let installPrisma;

    if (this.packageManager == "yarn" || this.packageManager == "pnpm") {
      installPrisma = `cd ${this.repoName} && ${this.packageManager} add prisma @prisma/client -D`;
    } else {
      installPrisma = `cd ${this.repoName} && npm install prisma @prisma/client --save-dev`;
    }

    const prismaDependencies = this.runCommand(installPrisma);
    if (!prismaDependencies) process.exit(1);

    const prismaInstalled = this.runCommand(
      `cd ${this.repoName} && npx prisma init --datasource-provider ${this.databaseWithPrisma}`
    );
    if (!prismaInstalled) process.exit(1);

    fs.mkdirSync(`./${this.repoName}/src/database`);
    fs.writeFileSync(
      `./${this.repoName}/src/database/prismaClient.ts`,
      `
      import { Prisma, PrismaClient } from "@prisma/client";
      const prismaClient: PrismaClient = new PrismaClient();
      export default prismaClient;
      `
    );
  }

  installServerFileInProject() {
    if (this.isInstallMongo) {
      fs.writeFileSync(
        `./${this.repoName}/src/server.ts`,
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
      `./${this.repoName}/src/server.ts`,
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

  StartInstallProject() {
    const gitCheckoutCommand = `git clone --depth 1 https://github.com/Kyoudan/windpieces-backend-starter.git ${this.repoName}`;
    let installDeps;

    switch (this.packageManager) {
      case "yarn":
        installDeps = `cd ${this.repoName} && yarn`;
        break;
      case "pnpm":
        installDeps = `cd ${this.repoName} && pnpm install`;
        break;
      default:
        installDeps = `cd ${this.repoName} && npm install`;
        break;
    }

    console.log(chalk.green("Creating new project..."));

    console.clear();
    const checkedOut = this.runCommand(gitCheckoutCommand);
    if (!checkedOut) process.exit(1);

    console.log(chalk.green("Installing dependencies..."));
    this.actionsClass.removeGitFolder();
    this.installDockerInProject();
    this.installMongoInProject();
    this.installEnvorimentInProject();
    this.installServerFileInProject();
    this.installPrismaInProject();

    console.clear();
    console.log(chalk.green("Organizing files..."));
    applyPrettier();
    console.clear();
    console.log("Done!");

    finalMessage();
  }
}

export default Install;
