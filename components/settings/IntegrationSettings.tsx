
import React, { useState, useEffect } from 'react';
import { Bot, Link, Server, Copy, Check } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { User, Deal } from '../../types';

interface IntegrationSettingsProps {
  activeTab: string;
  currentUser?: User;
  onSaveDeal?: (deal: Deal) => void;
}

export const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({ activeTab, currentUser, onSaveDeal }) => {
  const [employeeBotToken, setEmployeeBotToken] = useState('');
  const [clientBotToken, setClientBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [enableTelegramImport, setEnableTelegramImport] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
      setEmployeeBotToken(storageService.getEmployeeBotToken());
      setClientBotToken(storageService.getClientBotToken());
      setChatId(storageService.getTelegramChatId());
      setEnableTelegramImport(storageService.getEnableTelegramImport());
  }, []);

  const handleSaveEmployeeBot = () => { storageService.setEmployeeBotToken(employeeBotToken); alert('Токен сотрудников сохранен'); };
  const handleSaveClientBot = () => { storageService.setClientBotToken(clientBotToken); alert('Токен клиентов сохранен'); };
  const handleSaveChatId = () => { storageService.setTelegramChatId(chatId); alert('Chat ID сохранен'); };
  const handleToggleTelegramImport = () => { 
      const newVal = !enableTelegramImport; 
      setEnableTelegramImport(newVal); 
      storageService.setEnableTelegramImport(newVal); 
  };

  const handleSimulateLead = (source: 'instagram' | 'site' | 'telegram') => {
      if (!onSaveDeal || !currentUser) return;
      onSaveDeal({
          id: `lead-${Date.now()}`,
          title: source === 'instagram' ? '@username: Цена?' : 'Заявка с сайта',
          amount: 0, currency: 'UZS', stage: 'new', source: source, assigneeId: currentUser.id, createdAt: new Date().toISOString()
      });
      alert('Тестовый лид создан в Воронке продаж!');
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const websiteScriptCode = `
<script>
async function sendToCFO(data) {
  const DB_URL = "${storageService.getDbUrl().replace(/\/$/, '')}/deals.json";
  const payload = {
    id: "lead-" + Date.now(),
    title: "Заявка: " + (data.name || "С сайта"),
    contactName: data.name,
    amount: 0,
    currency: "UZS",
    stage: "new",
    source: "site",
    createdAt: new Date().toISOString()
  };
  
  await fetch(DB_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  alert("Заявка отправлена!");
}
</script>
`;

  const nodeServerCode = `
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
app.use(bodyParser.json());

const DB_URL = "${storageService.getDbUrl().replace(/\/$/, '')}/deals.json";
const VERIFY_TOKEN = "my_secure_token"; 

// 1. Verify Webhook (Required by Meta)
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

// 2. Receive Messages
app.post('/webhook', async (req, res) => {
  const body = req.body;
  if (body.object === 'instagram') {
    // Process entry...
    // Send to Firebase DB_URL...
  }
  res.sendStatus(200);
});

`;

  if (activeTab === 'integrations') {
      return (
          <div className="space-y-6 max-w-3xl">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 flex gap-4">
                  <Bot className="text-blue-600 dark:text-blue-400 shrink-0" size={24}/>
                  <div>
                      <h3 className="font-bold text-blue-900 dark:text-blue-100">Telegram Боты</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Разделяйте потоки: один бот для сотрудников (уведомления), другой для клиентов (заявки).</p>
                  </div>
              </div>

              <div className="p-5 border border-gray-200 dark:border-[#333] rounded-xl bg-white dark:bg-[#252525]">
                  <h4 className="font-bold text-gray-800 dark:text-white mb-2">1. Бот для сотрудников</h4>
                  <div className="flex gap-3">
                      <input value={employeeBotToken} onChange={e => setEmployeeBotToken(e.target.value)} type="password" placeholder="Токен (123:ABC...)" className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100" />
                      <button onClick={handleSaveEmployeeBot} className="bg-gray-100 hover:bg-gray-200 dark:bg-[#333] px-4 rounded-lg text-sm font-medium dark:text-gray-200">Сохранить</button>
                  </div>
                  
                  <h4 className="font-bold text-gray-800 dark:text-white mt-4 mb-2">ID Группы уведомлений</h4>
                  <div className="flex gap-3">
                      <input value={chatId} onChange={e => setChatId(e.target.value)} placeholder="-100..." className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100" />
                      <button onClick={handleSaveChatId} className="bg-gray-100 hover:bg-gray-200 dark:bg-[#333] px-4 rounded-lg text-sm font-medium dark:text-gray-200">Сохранить</button>
                  </div>
              </div>

              <div className="p-5 border border-gray-200 dark:border-[#333] rounded-xl bg-white dark:bg-[#252525]">
                  <h4 className="font-bold text-gray-800 dark:text-white mb-2">2. Бот для клиентов (Лиды)</h4>
                  <div className="flex gap-3 mb-4">
                      <input value={clientBotToken} onChange={e => setClientBotToken(e.target.value)} type="password" placeholder="Токен (123:ABC...)" className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100" />
                      <button onClick={handleSaveClientBot} className="bg-gray-100 hover:bg-gray-200 dark:bg-[#333] px-4 rounded-lg text-sm font-medium dark:text-gray-200">Сохранить</button>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={enableTelegramImport} onChange={handleToggleTelegramImport} className="w-5 h-5 rounded text-blue-600 focus:ring-0"/>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Включить автоматический импорт сообщений в Воронку</span>
                  </label>
              </div>
          </div>
      );
  }

  if (activeTab === 'leads') {
      return (
          <div className="space-y-6 max-w-3xl">
              <div className="flex gap-3 mb-6">
                  <button onClick={() => handleSimulateLead('site')} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100 hover:bg-blue-100">Тест: Заявка с сайта</button>
                  <button onClick={() => handleSimulateLead('instagram')} className="px-4 py-2 bg-pink-50 text-pink-700 rounded-lg text-sm font-bold border border-pink-100 hover:bg-pink-100">Тест: Instagram</button>
              </div>

              <div className="bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl p-6">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2 flex items-center gap-2"><Link size={20}/> Скрипт для сайта</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Вставьте этот код на ваш сайт (Tilda, WordPress), чтобы заявки автоматически попадали в систему.</p>
                  
                  <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                          {websiteScriptCode.trim()}
                      </pre>
                      <button onClick={() => copyToClipboard(websiteScriptCode)} className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white transition-colors">
                          {copied ? <Check size={14}/> : <Copy size={14}/>}
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  if (activeTab === 'meta') {
      return (
          <div className="space-y-6 max-w-3xl">
              <div className="bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl p-6">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2 flex items-center gap-2"><Server size={20}/> Сервер для Instagram (Node.js)</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Meta требует наличия HTTPS сервера для получения сообщений (Webhook). Вот готовый код для запуска.</p>
                  
                  <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                          {nodeServerCode.trim()}
                      </pre>
                      <button onClick={() => copyToClipboard(nodeServerCode)} className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white transition-colors">
                          {copied ? <Check size={14}/> : <Copy size={14}/>}
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  return null;
};
