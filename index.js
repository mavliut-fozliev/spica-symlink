#!/usr/bin/env node

import program from "caporal";
import { create } from "./create-symlinks.js";
import { remove } from "./remove-symlinks.js";

program.name("spica-symlink").version("1.0.0").description("Symlink tool to replace folder IDs with readable titles in Spica.");

program.command("create", "Generate symlinks for folders to display readable titles").action(function (args, options, logger) {
  logger.info("Starting symlink creation...");
  create();
});

program.command("remove", "Delete previously generated symlinks").action(function (args, options, logger) {
  logger.info("Starting symlink removal...");
  remove();
});

program.parse(process.argv);
