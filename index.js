const fs = require('fs-extra');
const chalk = require('chalk');
const minimist = require('minimist');

class LbrScriptsCli {
  constructor(args) {
    this._args = args;
    this._options = minimist(args, {
      boolean: ['help', 'parse-json'],
      string: ['out', 'format'],
      default: { 'out': 'src/environments/.env.ts', 'format': 'js' },
    });
  }

  run() {
    if (this._options.help || !this._args.length) {
      return this._help();
    }

    if (this._args[0] === 'env') {
      return this._env(
        this._args.slice(1),
        this._options.out,
        this._options.format,
        this._options['parse-json']
      );
    }

    this._help();
  }

  _env(vars, outputFile, format, parseJson) {
    if (!vars.length) {
      this._exit(`${chalk.red('Variabili di ambiente mancanti')}\n`);
    }

    let env = JSON.stringify(
      vars.reduce((env, v) => {
        env[v] = process.env[v] === undefined ? null : process.env[v];
        if (parseJson) {
          try {
            env[v] = JSON.parse(env[v]);
          } catch {}
        }
        return env;
      }, {}),
      null,
      2
    );

    if (format === 'js') {
      env = env.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, v) => {
        const s = v.replace(/'/g, "\\'").replace(/\\"/g, '"');
        return `'${s}'`;
      });
      env = `export const env = ${env};\n`;
    }

    try {
      fs.writeFileSync(outputFile, env);
      console.log(`${chalk.green('Variabili di ambiente scritte in')} ${chalk.cyan(outputFile)}`);
    } catch (error) {
      this._exit(`${chalk.red(`Errore durante la scrittura del file: ${error.message || error}`)}`);
    }
  }

  _help() {
    console.log(`
      Utilizzo: env <env_var> [<env_var2> ...] [--out <file>] [--format json|js] [--parse-json]
      - Esporta le variabili di ambiente in un file JSON o JavaScript.
      - File di output predefinito: src/environments/.env.ts
      `);
    process.exit(0);
  }

  _exit(error, code = 1) {
    if (error) {
      console.error(error);
    }
    process.exit(code);
  }
}

module.exports = LbrScriptsCli;
