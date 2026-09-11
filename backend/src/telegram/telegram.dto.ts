export class TelegramUserDto {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export class TelegramChatDto {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export class TelegramMessageDto {
  message_id: number;
  from?: TelegramUserDto;
  chat: TelegramChatDto;
  date: number;
  text?: string;
  caption?: string;
}

export class TelegramUpdateDto {
  update_id: number;
  message?: TelegramMessageDto;
  edited_message?: TelegramMessageDto;
  channel_post?: TelegramMessageDto;
  edited_channel_post?: TelegramMessageDto;
}

export interface ParsedTelegramMessage {
  chatId: number;
  text: string;
  messageId: number;
  senderName: string;
  username?: string;
  date: number;
}

export class TelegramWebhookResponseDto {
  status: 'ok';
}

export type TelegramUpdate = TelegramUpdateDto;
export type TelegramWebhookResponse = TelegramWebhookResponseDto;
