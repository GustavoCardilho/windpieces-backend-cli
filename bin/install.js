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
        isApplyHusky,
        moreLibraries,
        corsLink,
        actionClass
    ) {
        this.repoName = repoName;
        this.packageManager = packageManager;
        this.isInstallDocker = isInstallDocker;
        this.isInstallMongo = isInstallMongo;
        this.isInstallPrisma = isInstallPrisma;
        this.isHusky = isApplyHusky;
        this.moreLibraries = moreLibraries;
        this.corsLink = corsLink;
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
        this.envContent;
        this.appContent;
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

        fs.writeFileSync(
            `./${this.repoName}/src/models/example.ts`,
            `
import mongoose from "mongoose";

// this is a example of model

const ExampleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  tag: {
    type: String,
    unique: true,
    required: true,
  },
  office: {
    type: String,
    enum: ["owner", "tenant", "union"],
    required: true,
  },
  vehicle: [
    {
      type: {
        type: String,
        enum: ["car", "motorcycle"],
      },
      plate: String,
      brand: String,
    },
  ],
  hasAnimal: {
    type: Boolean,
    default: false,
  },
  visitors: [
    {
      type: Object,
      required: true,
      name: String,
      cpf: String,
      cep: String,
    },
  ],
});

export default mongoose.model<typeof ExampleSchema>(
  "example",
  ExampleSchema,
);

      `
        );
    }

    installEnvorimentInProject() {
        this.envContent = `
  DATABASE_URL= ""
  PORT= 3000
  #CORS_CONFIG\n
    `;
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

    installAppFileInProject() {
        this.appContent = `
import express from "express";
import morgan from "morgan";
import routes from "./routes";

const app = express();

app.use(express.json(), express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(routes);
/*CORSCONFIG*/

export { app };
`;
    }

    installMoreLibrariesInProject() {
        if (!this.moreLibraries) return;
        let installMoreLibraries;
        switch (this.packageManager) {
            case "yarn":
                installMoreLibraries = `cd ${
                    this.repoName
                } && yarn add ${this.moreLibraries.join(" ")}`;
                break;
            case "pnpm":
                installMoreLibraries = `cd ${
                    this.repoName
                } && pnpm install ${this.moreLibraries.join(" ")}`;
                break;
            default:
                installMoreLibraries = `cd ${
                    this.repoName
                } && npm install ${this.moreLibraries.join(" ")}`;
                break;
        }

        const moreLibrariesDependencies = this.runCommand(installMoreLibraries);
        if (!moreLibrariesDependencies) process.exit(1);
    }

    installCorsInProject() {
        if (!this.corsLink) return;
        let installCors;

        switch (this.packageManager) {
            case "yarn":
                installCors = `cd ${this.repoName} && yarn add cors`;
                break;
            case "pnpm":
                installCors = `cd ${this.repoName} && pnpm install cors`;
                break;
            default:
                installCors = `cd ${this.repoName} && npm install cors`;
                break;
        }
        this.appContent = this.appContent.replace(
            "/*CORSCONFIG*/",
            `const corsOptions = process.env.CORS_ORIGIN.split(",") || "*";
  
      app.use(
        cors({
          origin: corsOptions,
          optionsSuccessStatus: 200,
        })
      );`
        );

        this.envContent = this.envContent.replace(
            "#CORS_CONFIG",
            `CORS_ORIGIN=${this.corsLink.split(" ").join(",")}`
        );

        const corsDependencies = this.runCommand(installCors);
        if (!corsDependencies) process.exit(1);
    }

    createFiles() {
        fs.writeFileSync(`./${this.repoName}/.env`, this.envContent);
        fs.writeFileSync(`./${this.repoName}/src/app.ts`, this.appContent);
    }

    StartInstallProject() {
        const gitCheckoutCommand = `git clone --depth 1 https://github.com/Kyoudan/windpieces-backend-starter.git ${this.repoName}`;

        console.log(chalk.green("Creating new project..."));

        console.clear();
        const checkedOut = this.runCommand(gitCheckoutCommand);
        if (!checkedOut) process.exit(1);
        this.actionsClass.removeGitFolder();
        console.log(chalk.green("Installing dependencies..."));
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

        const installCheck = this.runCommand(installDeps);
        if (!installCheck) process.exit(1);
        this.installAppFileInProject();
        this.installDockerInProject();
        this.installMongoInProject();
        this.installEnvorimentInProject();
        this.installServerFileInProject();
        this.installPrismaInProject();
        this.installMoreLibrariesInProject();
        this.installCorsInProject();
        this.createFiles();

        console.clear();
        console.log(chalk.green("Organizing files..."));
        this.actionsClass.applyPrettier();
        console.clear();
        console.log("Done!");

        this.actionsClass.finalMessage();
    }
}

export default Install;
