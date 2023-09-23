#!/usr/bin/env node

const { execSync } = require("child_process");

const runCommand = (command) => {
    try {
        execSync(command, { stdio: "inherit" });
    } catch (err) {
        console.error("Error: ", err);
        return false;
    }
    return true;
};

const repoName = process.argv.slice(2);
const gitCheckoutCommand = `git clone --depth 1 https://github.com/Kyoudan/windpieces-backend-starter.git ${repoName}`;
const installDeps = `cd ${repoName} && npm install`;

console.log("Creating new project...");
const checkedOut = runCommand(gitCheckoutCommand);
if (!checkedOut) process.exit(1);

console.log("Installing dependencies...");
const depsInstalled = runCommand(installDeps);
if (!depsInstalled) process.exit(1);

console.log("Done!");
console.log(`
    cd ${repoName} && npm run dev
`);
