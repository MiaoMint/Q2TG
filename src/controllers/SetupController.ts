import { Telegram } from '../client/Telegram';
import SetupService from '../services/SetupService';
import { Api } from 'telegram';
import { getLogger } from 'log4js';

export default class SetupController {
  private readonly setupService: SetupService;
  private log = getLogger('SetupController');
  private isInProgress = false;
  // 创建的 UserBot
  private tgUser: Telegram;

  constructor(tgBot: Telegram) {
    this.setupService = new SetupService(tgBot);
    tgBot.addNewMessageEventHandler(this.handleMessage);
  }

  private handleMessage = async (message: Api.Message) => {
    if (this.isInProgress) {
      return true;
    }

    if (message.text === '/setup') {
      this.isInProgress = true;
      try {
        const result = await this.setupService.claimOwner(message.sender.id);
        if (!result) return true;
      }
      catch (e) {
        this.log.error('Claim Owner 失败', e);
      }
      await this.setupService.informOwner('创建 Telegram UserBot，请输入你的手机号码（需要带国家区号，例如：+86）');
      try {
        const phoneNumber = await this.setupService.waitForOwnerInput();
        await this.setupService.informOwner('正在登录，请稍候…');
        this.tgUser = await this.setupService.createUserBot(phoneNumber);
        await this.setupService.informOwner(`登录成功`);
      }
      catch (e) {
        this.log.error('创建 UserBot 失败', e);
      }
      this.isInProgress = false;
      return true;
    }

    return false;
  };
}
