import { registerSettings } from "./settings.js";

Hooks.on("init", function()
{
  registerSettings();
  console.log("harvester | Init() - Registered settings.");
});

Hooks.on("ready", function()
{
  console.log("harvester | ready()");
});