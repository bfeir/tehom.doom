import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode ?? "test", process.cwd(), "");
  return {
    test: {
      globals: false,
      environment: "node",
      include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
      env,
      envFile: ".env.test",
      testTimeout: 10000,
      hookTimeout: 30000,
    },
  };
});
