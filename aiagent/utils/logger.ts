import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

interface LogMessage {
  consoleLog: string;
  fileLog: string;
}

class Logger {
  private logFile: string;

  constructor() {
    this.logFile = path.join(__dirname, '..', 'logs', 'chat.log');
    // Ensure logs directory exists
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLogMessage(data: {
    chatId: string;
    sender: string;
    message: string;
    mode?: string;
    userMessage?: string;
    status?: string;
  }): LogMessage {
    const timestamp = chalk.gray(`[${this.getTimestamp()}]`);
    const chatId = chalk.blue(`[ChatID: ${data.chatId}]`);
    const sender = chalk.yellow(`[${data.sender}]`);
    const mode = data.mode ? chalk.magenta(`[Mode: ${data.mode}]`) : '';
    const status = data.status ? chalk.green(`[Status: ${data.status}]`) : '';
    const message = chalk.white(data.message);

    return {
      consoleLog: `${timestamp} ${chatId} ${sender} ${mode} ${status}\n${message}\n`,
      fileLog: `[${this.getTimestamp()}] [ChatID: ${data.chatId}] [${data.sender}] ${data.mode ? `[Mode: ${data.mode}]` : ''} ${data.status ? `[Status: ${data.status}]` : ''}\n${data.message}\n`
    };
  }

  public log(data: {
    chatId: string;
    sender: string;
    message: string;
    mode?: string;
    userMessage?: string;
    status?: string;
  }): void {
    const formatted = this.formatLogMessage(data);

    // Log to console
    console.log(formatted.consoleLog);

    // Append to file
    fs.appendFileSync(this.logFile, formatted.fileLog + '\n');
  }
}

export const logger = new Logger();
