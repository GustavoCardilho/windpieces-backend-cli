#!/usr/bin/env node

import Questions from "./questions.js";
import Install from "./install.js";
import Actions from "./actions.js";

class Setup {

  async start() {
    console.clear();
    const QuestionsInstance = new Questions();
    const repoName = await QuestionsInstance.DefineRepoName();
    const isPrisma = await QuestionsInstance.addPrisma();
    const isMongoDB = await QuestionsInstance.addMongoDB();
    const isDocker = await QuestionsInstance.addDocker();
    const packageManager = await QuestionsInstance.DefinePackageManager();
    const isOpenVSCode = await QuestionsInstance.OpenVSCodeQuestion();
    const ActionsInstance = new Actions(repoName, packageManager, isOpenVSCode);
    const InstallInstance = new Install(
      repoName,
      packageManager,
      isMongoDB,
      isDocker,
      isPrisma.isPrisma,
      isPrisma.database,
      ActionsInstance
    );
    InstallInstance.StartInstallProject();
  }
}

const setup = new Setup();

setup.start();
