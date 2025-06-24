#!/usr/bin/env node

import program from "caporal";
import { create } from "./create-symlinks.js";
import { remove } from "./remove-symlinks.js";

program.name("spica-symlink").version("1.0.3").description("Symlink tool to replace folder IDs with readable titles in Spica.");

program
  .command("create", "Generate symlinks for folders to display readable titles")
  .argument("<path>", "Relative path to the folder where symlinks will be created")
  .action(function (args, options, logger) {
    logger.info(`Starting symlink creation in path: ${args.path}`);
    create(args.path);
  });

program
  .command("remove", "Delete previously generated symlinks")
  .argument("<path>", "Relative path to the folder where symlinks will be removed")
  .action(function (args, options, logger) {
    logger.info(`Starting symlink removal in path: ${args.path}`);
    remove(args.path);
  });

program.parse(process.argv);
