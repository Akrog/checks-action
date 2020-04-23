import * as core from '@actions/core';
import * as github from '@actions/github';
import {parseInputs} from './inputs';
import {createRun, updateRun} from './checks';

const stateID = 'checkID';

async function run(): Promise<void> {
  try {
    core.debug(`Parsing inputs`);
    const inputs = parseInputs(core.getInput);

    core.debug(`Setting up OctoKit`);
    const octokit = new github.GitHub(inputs.token);

    const ownership = {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
    };
    const sha = github.context.sha;

    const completed = inputs.status == 'completed' || inputs.conclusion;
    if (completed) {
      const id = core.getState(stateID);
      if (id) {
        core.debug(`Updating a Run (${id})`);
        updateRun(octokit, parseInt(id), ownership, inputs);
      } else {
        core.debug(`Creating a new Run`);
        createRun(octokit, sha, ownership, inputs);
      }
    } else {
      core.debug(`Creating a new Run`);
      const id = await createRun(octokit, sha, ownership, inputs, {completed: false});
      core.saveState(stateID, id.toString());
    }
    core.debug(`Done`);
  } catch (error) {
    core.debug(`Error: ${error}`);
    core.setFailed(error.message);
  }
}

run();
