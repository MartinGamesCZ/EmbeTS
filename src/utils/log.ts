import chalk from "chalk";

export type LogColor =
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white"
  | "gray"
  | "black"
  | "bgRed"
  | "bgGreen"
  | "bgYellow"
  | "bgBlue"
  | "bgMagenta"
  | "bgCyan"
  | "bgWhite"
  | "bgGray"
  | "bgBlack";

export class Logger {
  private style: string;

  constructor(style: string) {
    this.style = style;
  }

  static s = {
    default: (category: string, color: LogColor, message: string) =>
      `${chalk.gray("●")} ${chalk[color](
        chalk.black(chalk.bold(` ${category} `))
      ).padEnd(40, " ")} ${message}`,
  };

  log(message: string) {
    console.log(this.style.replace("$message", message));
  }
}
