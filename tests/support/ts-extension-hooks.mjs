import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Lets `node --test` import the repository's TypeScript modules directly.
 *
 * The source tree uses bundler-style extensionless relative imports
 * (`from "./company"`), which Node's ESM loader rejects. Rather than restyle
 * production imports for the sake of the test runner, this hook resolves the
 * specifier the same way the bundler does.
 */
registerHooks({
  resolve(specifier, context, nextResolve) {
    const parent = context.parentURL;
    if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier) && parent?.startsWith("file:")) {
      const parentDirectory = path.dirname(fileURLToPath(parent));
      for (const candidate of [`${specifier}.ts`, path.join(specifier, "index.ts")]) {
        const resolved = path.resolve(parentDirectory, candidate);
        if (existsSync(resolved)) {
          return { url: pathToFileURL(resolved).href, shortCircuit: true, format: "module-typescript" };
        }
      }
    }
    return nextResolve(specifier, context);
  },
});
