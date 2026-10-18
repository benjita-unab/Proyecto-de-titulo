export class WhatsAppWebhookDto {
  object?: string;
  entry?: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: 'text' | 'interactive' | 'button' | 'location';
          text?: { body: string };
          interactive?: {
            type: 'button_reply' | 'list_reply';
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string; description?: string };
          };
          button?: { text: string; payload: string };
          location?: {
            latitude: number;
            longitude: number;
            name?: string;
            address?: string;
          };
        }>;
      };
      field: string;
    }>;
  }>;
}

export class WhatsAppInteractiveMessageDto {
  messaging_product = 'whatsapp';
  recipient_type = 'individual';
  to: string;
  type = 'interactive';
  interactive: {
    type: 'button';
    header?: { type: 'text'; text: string };
    body: { text: string };
    footer?: { text: string };
    action: {
      buttons: Array<{
        type: 'reply';
        reply: { id: string; title: string };
      }>;
    };
  };
}
