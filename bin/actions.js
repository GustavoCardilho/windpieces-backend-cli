#!/usr/bin/env node

import chalk from "chalk";
import fs from "fs";
import { rimraf } from "rimraf";
import figlet from "figlet";
import { execSync } from "child_process";

class Actions {
  constructor(repoName, packageManager, isOpenVSCode) {
    this.repoName = repoName;
    this.packageManager = packageManager;
    this.isOpenVSCode = isOpenVSCode;
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

  OpenVSCode() {
    if (!this.isOpenVSCode) return;
    this.runCommand(`cd ${this.repoName} && code .`);
  }

  removeGitFolder() {
    try {
      fs.readdir(this.repoName, (err, files) => {
        if (err) throw err;

        for (const file of files) {
          if (file === ".git") {
            rimraf.moveRemove.sync(`./${this.repoName}/.git`);
          }
        }
      });
    } catch (err) {
      console.error(
        chalk.red("Error ao apagar a pasta .git... Esse processo é opcional")
      );
    }
  }

  applyPrettier() {
    switch (this.packageManager) {
      case "yarn":
        this.runCommand(`cd ${this.repoName} && yarn prettier:fix`);
        break;
      case "pnpm":
        this.runCommand(`cd ${this.repoName} && pnpm prettier:fix`);
        break;
      default:
        this.runCommand(`cd ${this.repoName} && npm run prettier:fix`);
        break;
    }
  }

  async finalMessage() {
    let initCommand;

    if (this.packageManager == "yarn" || this.packageManager == "pnpm") {
      initCommand = `cd ${chalk.green(this.repoName)} && ${
        this.packageManager
      } dev`;
    } else {
      initCommand = `cd ${this.repoName} && npm run dev`;
    }

    figlet("READY!!", function (err, data) {
      if (err) {
        console.log("Something went wrong...");
        return;
      }
      console.log("-".repeat(50) + "\n");
      console.log(chalk.green(data));
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
      this.OpenVSCode();
    });
  }
}

export default Actions;
