
import React, { useState, useMemo, useCallback } from 'react';
import { Client, Contract } from '../types';
import { Briefcase, Plus, Search, Trash2, Edit2, Phone, Calendar, DollarSign, FileText, X, Save, FileCheck, CreditCard, TrendingUp, Building } from 'lucide-react';
import { TaskSelect } from './TaskSelect';
import { Tabs, Button, Card } from './ui';
import { FiltersPanel, FilterConfig } from './FiltersPanel';

interface ClientsViewProps {
  clients: Client[];
  contracts: Contract[];
  onSaveClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onSaveContract: (contract: Contract) => void;
  onDeleteContract: (id: string) => void;
}

const ClientsView: React.FC<ClientsViewProps> = ({ clients, contracts, onSaveClient, onDeleteClient, onSaveContract, onDeleteContract }) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'contracts' | 'finance'>('clients');
  const [searchQuery, setSearchQuery] = useState('');
  const [contractStatusFilter, setContractStatusFilter] = useState<string>('active'); // По умолчанию только активные
  const [showFilters, setShowFilters] = useState(false);
  
  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [targetClientId, setTargetClientId] = useState<string>('');

  // Client Form State
  const [clientName, setClientName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientTelegram, setClientTelegram] = useState('');
  const [clientInstagram, setClientInstagram] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyInfo, setCompanyInfo] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [clientModalTab, setClientModalTab] = useState<'company' | 'notes'>('company');

  // Contract Form State
  const [contractNumber, setContractNumber] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractPaymentDay, setContractPaymentDay] = useState('5');
  const [contractStatus, setContractStatus] = useState<'active' | 'pending' | 'completed'>('active');
  const [contractServices, setContractServices] = useState('');

  // Helpers - оптимизированная фильтрация
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(query));
  }, [clients, searchQuery]);

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      // Поиск по номеру договора или имени клиента
      const matchesSearch = !searchQuery || 
        c.number.includes(searchQuery) || 
        clients.some(cl => cl.id === c.clientId && cl.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Фильтр по статусу
      const matchesStatus = contractStatusFilter === 'all' || c.status === contractStatusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [contracts, clients, searchQuery, contractStatusFilter]);

  // Фильтры для реестра договоров
  const contractFilters: FilterConfig[] = useMemo(() => [
    {
      label: 'Статус',
      value: contractStatusFilter,
      onChange: setContractStatusFilter,
      options: [
        { value: 'all', label: 'Все статусы' },
        { value: 'active', label: 'Активен' },
        { value: 'pending', label: 'Ожидание' },
        { value: 'completed', label: 'Закрыт' }
      ]
    }
  ], [contractStatusFilter]);

  const hasActiveContractFilters = useMemo(() => 
    contractStatusFilter !== 'active',
    [contractStatusFilter]
  );
  
  const clearContractFilters = useCallback(() => {
    setContractStatusFilter('active');
  }, []);

  // Client Handlers
  const handleOpenClientCreate = () => {
      setEditingClient(null);
      setClientName(''); setContactPerson(''); setClientPhone(''); setClientEmail(''); 
      setClientTelegram(''); setClientInstagram(''); setCompanyName(''); setCompanyInfo(''); 
      setClientNotes('');
      setIsClientModalOpen(true);
  };

  const handleOpenClientEdit = (client: Client) => {
      setEditingClient(client);
      setClientName(client.name); setContactPerson(client.contactPerson || ''); setClientPhone(client.phone || ''); 
      setClientEmail(client.email || ''); setClientTelegram(client.telegram || ''); 
      setClientInstagram(client.instagram || ''); setCompanyName(client.companyName || ''); 
      setCompanyInfo(client.companyInfo || ''); setClientNotes(client.notes || '');
      setIsClientModalOpen(true);
  };

  const handleClientSubmit = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      onSaveClient({
          id: editingClient ? editingClient.id : `cl-${Date.now()}`,
          name: clientName,
          contactPerson: contactPerson || undefined,
          phone: clientPhone || undefined,
          email: clientEmail || undefined,
          telegram: clientTelegram || undefined,
          instagram: clientInstagram || undefined,
          companyName: companyName || undefined,
          companyInfo: companyInfo || undefined,
          notes: clientNotes || undefined
      });
      setIsClientModalOpen(false);
  };

  // Contract Handlers
  const handleOpenContractCreate = (clientId: string) => {
      setEditingContract(null);
      setTargetClientId(clientId);
      setContractNumber(''); setContractAmount(''); setContractStartDate(new Date().toISOString().split('T')[0]);
      setContractPaymentDay('5'); setContractStatus('active'); setContractServices('');
      setIsContractModalOpen(true);
  };
  
  const handleOpenContractEdit = (contract: Contract) => {
      setEditingContract(contract);
      setTargetClientId(contract.clientId);
      setContractNumber(contract.number); setContractAmount(contract.amount.toString());
      setContractStartDate(contract.startDate); setContractPaymentDay(contract.paymentDay.toString()); 
      setContractStatus(contract.status); setContractServices(contract.services);
      setIsContractModalOpen(true);
  };

  const handleContractSubmit = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      onSaveContract({
          id: editingContract ? editingContract.id : `ctr-${Date.now()}`,
          clientId: targetClientId,
          number: contractNumber,
          amount: parseFloat(contractAmount) || 0,
          currency: 'UZS', // Force UZS
          startDate: contractStartDate,
          paymentDay: parseInt(contractPaymentDay) || 1,
          status: contractStatus,
          services: contractServices
      });
      setIsContractModalOpen(false);
  };

  // Modals Backdrops
  const handleClientBackdrop = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
          if (window.confirm("Сохранить изменения?")) handleClientSubmit();
          else setIsClientModalOpen(false);
      }
  };

  const handleContractBackdrop = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
          if (window.confirm("Сохранить изменения?")) handleContractSubmit();
          else setIsContractModalOpen(false);
      }
  };

  // Views
  const renderClientsTab = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredClients.map(client => {
               const clientContracts = contracts.filter(c => c.clientId === client.id);
               return (
                   <Card key={client.id} padding="lg" hover onClick={() => handleOpenClientEdit(client)} className="relative flex flex-col h-full">
                       <div className="flex justify-between items-start mb-4">
                           <div className="pr-8">
                               <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 leading-tight mb-1">{client.name}</h3>
                               {client.contactPerson && <div className="text-sm text-gray-500 dark:text-gray-400">{client.contactPerson}</div>}
                           </div>
                           <button onClick={() => handleOpenClientEdit(client)} className="text-gray-300 hover:text-blue-600 p-1"><Edit2 size={16}/></button>
                       </div>
                       
                       <div className="space-y-2 mb-4 flex-1">
                           {client.phone && <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"><Phone size={12}/> {client.phone}</div>}
                           {clientContracts.length > 0 ? (
                               <div className="mt-3 bg-gray-50 dark:bg-[#303030] rounded p-2">
                                   <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Договоры ({clientContracts.length})</div>
                                   {clientContracts.map(c => (
                                       <div key={c.id} className="flex justify-between items-center text-xs py-0.5 border-b border-gray-100 dark:border-gray-700 last:border-0 text-gray-700 dark:text-gray-300">
                                           <span className="truncate max-w-[120px]">{c.services}</span>
                                           <span className="font-medium text-green-700 dark:text-green-400">{c.amount.toLocaleString()} UZS</span>
                                       </div>
                                   ))}
                               </div>
                           ) : (
                               <div className="mt-3 text-xs text-gray-400 italic">Нет активных договоров</div>
                           )}
                       </div>
                       
                       <button onClick={() => handleOpenContractCreate(client.id)} className="w-full py-2 border border-dashed border-gray-200 dark:border-gray-600 rounded text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-1">
                           <Plus size={14}/> Добавить договор
                       </button>
                   </Card>
               );
           })}
      </div>
  );

  const renderContractsTab = () => (
      <div className="bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-[#202020] border-b border-gray-200 dark:border-[#333]">
                  <tr>
                      <th className="px-4 py-3 text-gray-600 dark:text-gray-400">№</th>
                      <th className="px-4 py-3 text-gray-600 dark:text-gray-400">Клиент</th>
                      <th className="px-4 py-3 text-gray-600 dark:text-gray-400">Услуги</th>
                      <th className="px-4 py-3 text-gray-600 dark:text-gray-400">Сумма (UZS)</th>
                      <th className="px-4 py-3 text-gray-600 dark:text-gray-400">Оплата</th>
                      <th className="px-4 py-3 text-gray-600 dark:text-gray-400">Статус</th>
                      <th className="px-4 py-3"></th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#333]">
                  {filteredContracts.map(c => {
                      const client = clients.find(cl => cl.id === c.clientId);
                      return (
                          <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-[#303030]">
                              <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-200">{c.number}</td>
                              <td className="px-4 py-3 text-gray-800 dark:text-gray-300">{client?.name || '—'}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">{c.services}</td>
                              <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200">{c.amount.toLocaleString()}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">до {c.paymentDay}-го числа</td>
                              <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${c.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : c.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                      {c.status === 'active' ? 'Активен' : c.status === 'pending' ? 'Ожидание' : 'Закрыт'}
                                  </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                  <button onClick={() => handleOpenContractEdit(c)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"><Edit2 size={14}/></button>
                              </td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>
      </div>
  );

  const renderFinanceTab = () => {
      const activeContracts = contracts.filter(c => c.status === 'active');
      const totalMRR_UZS = activeContracts.reduce((sum, c) => sum + c.amount, 0);

      const sortedByDate = [...activeContracts].sort((a, b) => a.paymentDay - b.paymentDay);

      return (
          <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-[#252525] p-5 rounded-xl border border-gray-200 dark:border-[#333] shadow-sm flex items-center gap-4">
                      <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"><TrendingUp size={24}/></div>
                      <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Ожидаемая выручка (UZS)</div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalMRR_UZS.toLocaleString()}</div>
                      </div>
                  </div>
                  <div className="bg-white dark:bg-[#252525] p-5 rounded-xl border border-gray-200 dark:border-[#333] shadow-sm flex items-center gap-4">
                      <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"><FileCheck size={24}/></div>
                      <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Активные договоры</div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeContracts.length}</div>
                      </div>
                  </div>
              </div>

              {/* Payment Calendar List */}
              <div className="bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm p-6">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Calendar size={18}/> График оплат (по дням месяца)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sortedByDate.map(c => {
                          const client = clients.find(cl => cl.id === c.clientId);
                          return (
                              <div key={c.id} className="border border-gray-100 dark:border-[#333] rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-[#303030] flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex flex-col items-center justify-center border border-blue-100 dark:border-blue-900/30">
                                          <span className="text-sm font-bold">{c.paymentDay}</span>
                                          <span className="text-[8px] uppercase">Число</span>
                                      </div>
                                      <div>
                                          <div className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{client?.name}</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{c.services}</div>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">{c.amount.toLocaleString()}</div>
                                      <div className="text-[10px] text-gray-400">UZS</div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="max-w-7xl mx-auto w-full pt-8 px-6 flex-shrink-0">
       {/* HEADER */}
       <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white truncate">Клиенты и договора</h1>
                    <p className="hidden md:block text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Управление клиентами и контрактами
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {activeTab === 'contracts' && (
                        <>
                            <FiltersPanel
                                filters={contractFilters}
                                showFilters={showFilters}
                                onToggleFilters={() => setShowFilters(!showFilters)}
                                hasActiveFilters={hasActiveContractFilters}
                                onClearFilters={clearContractFilters}
                                columns={3}
                            />
                            <Button
                                onClick={() => handleOpenContractCreate('')}
                                icon={Plus}
                                iconPosition="left"
                                size="md"
                                className="shrink-0"
                            >
                                <span className="hidden sm:inline">Создать</span>
                                <span className="sm:hidden">+</span>
                            </Button>
                        </>
                    )}
                    {activeTab === 'clients' && (
                        <Button
                          onClick={handleOpenClientCreate}
                          icon={Plus}
                          iconPosition="left"
                          size="md"
                          className="shrink-0"
                        >
                          <span className="hidden sm:inline">Создать</span>
                          <span className="sm:hidden">+</span>
                        </Button>
                    )}
                </div>
            </div>
            
            {/* TABS */}
            <div className="mb-4">
                <Tabs
                    tabs={[
                        { id: 'clients', label: 'База клиентов' },
                        { id: 'contracts', label: 'Реестр договоров' },
                        { id: 'finance', label: 'Финансы / Оплаты' }
                    ]}
                    activeTab={activeTab}
                    onChange={(tabId) => setActiveTab(tabId as 'clients' | 'contracts' | 'finance')}
                />
            </div>
       </div>
       </div>
       <div className="flex-1 min-h-0 overflow-hidden">
         <div className="max-w-7xl mx-auto w-full px-6 pb-20 h-full overflow-y-auto custom-scrollbar">
       <div className="mb-6">
           <div className="relative flex-1 max-w-sm">
               <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
               <input 
                 type="text" 
                 placeholder={activeTab === 'clients' ? "Поиск клиентов..." : "Поиск договоров..."} 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg text-sm bg-white dark:bg-[#252525] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
               />
           </div>
       </div>

       {activeTab === 'clients' && renderClientsTab()}
       {activeTab === 'contracts' && renderContractsTab()}
       {activeTab === 'finance' && renderFinanceTab()}
         </div>
       </div>

       {/* Client Modal */}
       {isClientModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-[80] animate-in fade-in duration-200" onClick={handleClientBackdrop}>
            <div className="bg-white dark:bg-[#252525] rounded-t-2xl md:rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-[#333] flex flex-col max-h-[95vh] md:max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 dark:border-[#333] bg-white dark:bg-[#252525] shrink-0">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-gray-800 dark:text-white">{editingClient ? 'Редактировать клиента' : 'Новый клиент'}</h3>
                        <button onClick={() => setIsClientModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#333]"><X size={18} /></button>
                    </div>
                    {/* Вкладки */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#333] rounded-full p-1 text-xs">
                        <button 
                            type="button"
                            onClick={() => setClientModalTab('company')} 
                            className={`px-3 py-1.5 rounded-full flex items-center gap-1 ${
                                clientModalTab === 'company'
                                    ? 'bg-white dark:bg-[#191919] text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300'
                            }`}
                        >
                            Компания
                        </button>
                        <button 
                            type="button"
                            onClick={() => setClientModalTab('notes')} 
                            className={`px-3 py-1.5 rounded-full flex items-center gap-1 ${
                                clientModalTab === 'notes'
                                    ? 'bg-white dark:bg-[#191919] text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300'
                            }`}
                        >
                            Заметки
                        </button>
                    </div>
                </div>
                <form onSubmit={handleClientSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {clientModalTab === 'company' ? (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Название компании</label>
                                    <input required value={clientName} onChange={e => setClientName(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100" placeholder="OOO Company"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Контактное лицо</label>
                                    <input value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100"/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                         <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Телефон</label>
                                         <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100"/>
                                    </div>
                                    <div>
                                         <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Email</label>
                                         <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                         <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Telegram</label>
                                         <input value={clientTelegram} onChange={e => setClientTelegram(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100" placeholder="@username"/>
                                    </div>
                                    <div>
                                         <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Instagram</label>
                                         <input value={clientInstagram} onChange={e => setClientInstagram(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100" placeholder="@username"/>
                                    </div>
                                </div>
                                <div>
                                     <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">О компании</label>
                                     <textarea value={companyInfo} onChange={e => setCompanyInfo(e.target.value)} className="w-full h-32 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100 resize-none" placeholder="Чем занимается компания..."/>
                                </div>
                            </>
                        ) : (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Заметки</label>
                                <textarea value={clientNotes} onChange={e => setClientNotes(e.target.value)} className="w-full h-64 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100 resize-none" placeholder="Дополнительные заметки о клиенте..."/>
                            </div>
                        )}
                    </div>
                    <div className="p-6 border-t border-gray-100 dark:border-[#333] flex justify-between items-center shrink-0">
                        {editingClient && <button type="button" onClick={() => { if(confirm('Удалить?')) onDeleteClient(editingClient.id); setIsClientModalOpen(false); }} className="text-red-500 text-sm hover:underline">Удалить</button>}
                        <div className="flex gap-2 ml-auto">
                            <button type="button" onClick={() => setIsClientModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#303030] rounded-lg">Отмена</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm">Сохранить</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
       )}

       {/* Contract Modal */}
       {isContractModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-[90] animate-in fade-in duration-200" onClick={handleContractBackdrop}>
            <div className="bg-white dark:bg-[#252525] rounded-t-2xl md:rounded-xl shadow-2xl w-full max-w-md max-h-[95vh] md:max-h-[90vh] overflow-hidden border border-gray-200 dark:border-[#333]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 dark:border-[#333] flex justify-between items-center bg-white dark:bg-[#252525]">
                    <h3 className="font-bold text-gray-800 dark:text-white">{editingContract ? 'Редактировать договор' : 'Новый договор'}</h3>
                    <button onClick={() => setIsContractModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#333]"><X size={18} /></button>
                </div>
                <form onSubmit={handleContractSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Номер договора</label>
                            <input required value={contractNumber} onChange={e => setContractNumber(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100" placeholder="№ 123-A"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Дата подписания</label>
                            <input type="date" value={contractStartDate} onChange={e => setContractStartDate(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100"/>
                        </div>
                    </div>
                    
                    <div>
                         <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Услуги / Предмет</label>
                         <input required value={contractServices} onChange={e => setContractServices(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100" placeholder="SMM Продвижение"/>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Сумма (в месяц)</label>
                            <input type="number" value={contractAmount} onChange={e => setContractAmount(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Валюта</label>
                            <input disabled value="UZS" className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-gray-100 dark:bg-[#333] text-gray-500 cursor-not-allowed"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">День оплаты</label>
                            <input type="number" min="1" max="31" value={contractPaymentDay} onChange={e => setContractPaymentDay(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-[#333] text-gray-900 dark:text-gray-100" placeholder="5"/>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Статус</label>
                            <TaskSelect
                                value={contractStatus}
                                onChange={(val) => setContractStatus(val as any)}
                                options={[
                                    { value: 'active', label: 'Активен' },
                                    { value: 'pending', label: 'Ожидание' },
                                    { value: 'completed', label: 'Закрыт' }
                                ]}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        {editingContract && <button type="button" onClick={() => { if(confirm('Удалить договор?')) onDeleteContract(editingContract.id); setIsContractModalOpen(false); }} className="text-red-500 text-sm hover:underline">Удалить</button>}
                        <div className="flex gap-2 ml-auto">
                            <button type="button" onClick={() => setIsContractModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#303030] rounded-lg">Отмена</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm">Сохранить</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
       )}
    </div>
  );
};

export default ClientsView;
