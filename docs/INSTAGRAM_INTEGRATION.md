# Интеграция Instagram для автоматического получения лидов

## Обзор

Интеграция Instagram позволяет автоматически получать новые лиды из Instagram Direct Messages и комментариев в воронку продаж. Используется Meta Graph API для доступа к данным Instagram Business Account.

## Требования

1. **Instagram Business Account** - аккаунт должен быть профессиональным (Business или Creator)
2. **Meta Business Account** - аккаунт должен быть привязан к Meta Business Manager
3. **Facebook Page** - Instagram должен быть привязан к Facebook странице
4. **Meta App** - нужно создать приложение в Meta for Developers
5. **Access Token** - долгосрочный токен доступа (Long-lived Access Token)

## Процесс настройки

### Шаг 1: Создание Meta App

1. Перейти на [Meta for Developers](https://developers.facebook.com/)
2. Создать новое приложение типа "Business"
3. Добавить продукт "Instagram Basic Display" или "Instagram Graph API"
4. Настроить базовые настройки приложения

### Шаг 2: Получение доступа к Instagram

1. В настройках приложения перейти в раздел "Basic Display" или "Graph API"
2. Добавить тестовых пользователей (в режиме разработки)
3. Запросить разрешения:
   - `instagram_basic` - базовый доступ к Instagram
   - `instagram_manage_messages` - доступ к сообщениям
   - `instagram_manage_comments` - доступ к комментариям
   - `pages_show_list` - список страниц Facebook
   - `pages_read_engagement` - чтение активности страниц

### Шаг 3: Связь Instagram с Facebook Page

1. Убедиться, что Instagram аккаунт связан с Facebook страницей:
   - Настройки Instagram → Account Center → Connected Accounts
   - Добавить Facebook страницу
2. В Meta Business Manager убедиться, что страница добавлена

### Шаг 4: Получение Access Token

1. **Краткосрочный токен (Short-lived)**:
   - Использовать Graph API Explorer
   - Выбрать приложение и страницу
   - Получить токен с правами `instagram_basic`, `instagram_manage_messages`
   - Токен действителен 1-2 часа

2. **Долгосрочный токен (Long-lived)**:
   ```
   GET https://graph.facebook.com/v18.0/oauth/access_token?
     grant_type=fb_exchange_token&
     client_id={app-id}&
     client_secret={app-secret}&
     fb_exchange_token={short-lived-token}
   ```
   - Токен действителен 60 дней
   - Можно обновлять автоматически

### Шаг 5: Получение Instagram Account ID

1. Найти ID Facebook страницы (можно через Graph API Explorer)
2. Получить Instagram Business Account ID:
   ```
   GET https://graph.facebook.com/v18.0/{page-id}?
     fields=instagram_business_account
   ```
   - Ответ: `{ "instagram_business_account": { "id": "17841405309211844" } }`

### Шаг 6: Настройка в приложении

1. В настройках воронки выбрать источник "Instagram"
2. Ввести:
   - Instagram Account ID (из шага 5)
   - Access Token (долгосрочный токен из шага 4)
   - Page ID (ID Facebook страницы)

## API Endpoints для работы с Instagram

### Получение сообщений

```
GET https://graph.facebook.com/v18.0/{instagram-account-id}/conversations?
  fields=id,participants,updated_time&
  access_token={access-token}
```

### Получение сообщений из конкретного чата

```
GET https://graph.facebook.com/v18.0/{conversation-id}/messages?
  fields=id,from,to,message,created_time&
  access_token={access-token}
```

### Отправка сообщения

```
POST https://graph.facebook.com/v18.0/{instagram-account-id}/messages
  recipient={user-id}
  message={text}
  access_token={access-token}
```

### Получение комментариев

```
GET https://graph.facebook.com/v18.0/{media-id}/comments?
  fields=id,text,from,created_time&
  access_token={access-token}
```

## Структура данных

### Instagram Conversation → Deal

- `conversation.id` → используется как `telegramChatId` в Deal
- `conversation.participants` → информация о пользователе
- Первое сообщение → создание Deal
- Последующие сообщения → комментарии в Deal

### Поля Deal для Instagram

```typescript
{
  id: string;
  title: string; // "Лид из Instagram: @username"
  source: 'instagram';
  funnelId: string; // ID воронки
  stage: string; // Первый этап воронки
  telegramChatId?: string; // ID conversation (для обратной связи)
  telegramUsername?: string; // @username из Instagram
  contactName?: string; // Имя пользователя
  amount: 0;
  currency: 'UZS';
  assigneeId: string;
  createdAt: string; // Время первого сообщения
  comments?: Comment[]; // Все сообщения из conversation
}
```

## Периодическая синхронизация

1. **Webhook (рекомендуется)**:
   - Настроить Webhook в Meta App
   - События: `messages`, `messaging_postbacks`
   - URL: `https://your-domain.com/api/instagram/webhook`

2. **Polling (резервный вариант)**:
   - Каждые 5-10 минут запрашивать новые conversation
   - Фильтровать по `updated_time > lastSyncAt`

## Обновление токена

Long-lived токены нужно обновлять до истечения срока:

```
GET https://graph.facebook.com/v18.0/oauth/access_token?
  grant_type=fb_exchange_token&
  client_id={app-id}&
  client_secret={app-secret}&
  fb_exchange_token={current-long-lived-token}
```

Рекомендуется обновлять за 7 дней до истечения.

## Ограничения и лимиты

1. **Rate Limits**:
   - 200 запросов в час на пользователя
   - 4800 запросов в день на приложение

2. **Разрешения**:
   - Только для Business/Creator аккаунтов
   - Требуется подтверждение Meta для production

3. **Webhook**:
   - HTTPS обязателен
   - Сертификат SSL должен быть валидным
   - Endpoint должен отвечать на GET запросы (verification)

## Реализация в коде

### Сервис для работы с Instagram API

```typescript
// services/instagramService.ts
export const instagramService = {
  async getConversations(accountId: string, accessToken: string, since?: string) {
    // Получить список conversations
  },
  
  async getMessages(conversationId: string, accessToken: string) {
    // Получить сообщения из conversation
  },
  
  async sendMessage(accountId: string, userId: string, message: string, accessToken: string) {
    // Отправить сообщение
  },
  
  async refreshAccessToken(currentToken: string) {
    // Обновить токен
  }
};
```

### Синхронизация лидов

```typescript
// services/leadSyncService.ts
export const leadSyncService = {
  async syncInstagramLeads(funnelId: string) {
    const funnel = api.funnels.getAll().find(f => f.id === funnelId);
    if (!funnel?.sources?.instagram?.enabled) return;
    
    const config = funnel.sources.instagram;
    const conversations = await instagramService.getConversations(
      config.instagramAccountId!,
      config.accessToken!,
      config.lastSyncAt
    );
    
    // Создать/обновить Deal для каждого conversation
    // Обновить lastSyncAt
  }
};
```

## Следующие шаги

1. Создать сервис `instagramService.ts` для работы с Meta Graph API
2. Добавить периодическую синхронизацию (polling или webhook)
3. Интегрировать в систему создания Deal
4. Добавить отправку сообщений через Instagram
5. Добавить обработку комментариев к постам

