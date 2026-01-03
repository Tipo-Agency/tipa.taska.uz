import React, { useMemo, useState } from 'react';
import { Department, Warehouse, InventoryItem, StockBalance, StockMovement } from '../types';
import { Layers, PackageSearch, Plus } from 'lucide-react';

interface InventoryViewProps {
  departments: Department[];
  warehouses: Warehouse[];
  items: InventoryItem[];
  balances: StockBalance[];
  movements: StockMovement[];
  currentUserId: string;
  onSaveWarehouse: (w: Warehouse) => void;
  onDeleteWarehouse: (id: string) => void;
  onSaveItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onCreateMovement: (payload: {
    type: 'receipt' | 'transfer' | 'writeoff' | 'adjustment';
    fromWarehouseId?: string;
    toWarehouseId?: string;
    items: { itemId: string; quantity: number; price?: number }[];
    reason?: string;
    createdByUserId: string;
  }) => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({
  departments,
  warehouses,
  items,
  balances,
  movements,
  currentUserId,
  onSaveWarehouse,
  onDeleteWarehouse,
  onSaveItem,
  onDeleteItem,
  onCreateMovement,
}) => {
  const [activeTab, setActiveTab] = useState<'balances' | 'items' | 'movements'>('balances');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

  // Form state: new warehouse
  const [newWarehouseName, setNewWarehouseName] = useState('');

  // Form state: new item
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');

  // Form state: movement
  const [movementType, setMovementType] = useState<'receipt' | 'transfer' | 'writeoff'>('receipt');
  const [fromWarehouseId, setFromWarehouseId] = useState<string>('');
  const [toWarehouseId, setToWarehouseId] = useState<string>('');
  const [movementItemId, setMovementItemId] = useState<string>('');
  const [movementQty, setMovementQty] = useState<string>('');
  const [movementReason, setMovementReason] = useState<string>('');

  const currentDepartment = departments.find(d => d.id === selectedDepartmentId) || null;

  const filteredWarehouses = useMemo(
    () => warehouses.filter(w => (selectedDepartmentId ? w.departmentId === selectedDepartmentId : true)),
    [warehouses, selectedDepartmentId]
  );

  const balancesForView = useMemo(() => {
    const whId = selectedWarehouseId || filteredWarehouses[0]?.id;
    if (!whId) return [];
    return balances
      .filter(b => b.warehouseId === whId)
      .map(b => {
        const item = items.find(i => i.id === b.itemId);
        return {
          ...b,
          itemName: item?.name || 'Без названия',
          itemSku: item?.sku || '',
          itemUnit: item?.unit || '',
        };
      })
      .sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [balances, items, filteredWarehouses, selectedWarehouseId]);

  const handleCreateWarehouse = () => {
    if (!newWarehouseName.trim()) {
      alert('Введите название склада');
      return;
    }
    if (!onSaveWarehouse) {
      console.error('onSaveWarehouse не определена');
      return;
    }
    const wh: Warehouse = {
      id: `wh-${Date.now()}`,
      name: newWarehouseName.trim(),
      departmentId: selectedDepartmentId || undefined,
    };
    onSaveWarehouse(wh);
    setNewWarehouseName('');
  };

  const handleCreateItem = () => {
    if (!newItemName.trim()) {
      alert('Введите название номенклатуры');
      return;
    }
    if (!onSaveItem) {
      console.error('onSaveItem не определена');
      return;
    }
    const item: InventoryItem = {
      id: `it-${Date.now()}`,
      sku: newItemSku.trim(),
      name: newItemName.trim(),
      unit: newItemUnit.trim() || 'шт',
      category: newItemCategory.trim() || undefined,
      notes: newItemNotes.trim() || undefined,
    };
    onSaveItem(item);
    setNewItemSku('');
    setNewItemName('');
    setNewItemUnit('');
    setNewItemCategory('');
    setNewItemNotes('');
  };

  const handleCreateMovement = () => {
    const qty = Number(movementQty.replace(',', '.'));
    if (!movementItemId || !qty || qty <= 0) {
      alert('Заполните номенклатуру и количество');
      return;
    }
    if (movementType !== 'receipt' && !fromWarehouseId) {
      alert('Выберите склад-источник');
      return;
    }
    if (movementType !== 'writeoff' && !toWarehouseId) {
      alert('Выберите склад назначения');
      return;
    }
    if (!onCreateMovement) {
      console.error('onCreateMovement не определена');
      return;
    }
    if (!currentUserId) {
      alert('Пользователь не определен');
      return;
    }

    onCreateMovement({
      type: movementType,
      fromWarehouseId: movementType !== 'receipt' ? fromWarehouseId || undefined : undefined,
      toWarehouseId: movementType !== 'writeoff' ? toWarehouseId || undefined : undefined,
      items: [{ itemId: movementItemId, quantity: qty }],
      reason: movementReason || undefined,
      createdByUserId: currentUserId,
    });
    setMovementQty('');
    setMovementReason('');
    setMovementItemId('');
    setFromWarehouseId('');
    setToWarehouseId('');
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="max-w-7xl mx-auto w-full pt-8 px-6 flex-shrink-0">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-amber-600 dark:text-amber-400">
                <Layers size={24} />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white truncate">Склад</h1>
                <p className="hidden md:block text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Управление складами, номенклатурой и движениями запасов
                </p>
              </div>
            </div>
            {activeTab === 'items' && (
              <button
                onClick={handleCreateItem}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 flex items-center gap-2 shadow-sm"
              >
                <Plus size={18} /> Создать
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="max-w-7xl mx-auto w-full px-6 pb-20">

          {/* TABS */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#252525] rounded-full p-1 text-xs mb-4">
            <button
              onClick={() => setActiveTab('balances')}
              className={`px-3 py-1.5 rounded-full flex items-center gap-1 ${
                activeTab === 'balances'
                  ? 'bg-white dark:bg-[#191919] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Остатки
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1.5 rounded-full flex items-center gap-1 ${
                activeTab === 'items'
                  ? 'bg-white dark:bg-[#191919] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Номенклатура
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1.5 rounded-full flex items-center gap-1 ${
                activeTab === 'movements'
                  ? 'bg-white dark:bg-[#191919] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Журнал
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Подразделение
              </span>
              <select
                value={selectedDepartmentId}
                onChange={e => setSelectedDepartmentId(e.target.value)}
                className="border border-gray-200 dark:border-[#333] rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-100 min-w-[220px]"
              >
                <option value="">Все подразделения</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
        {activeTab === 'balances' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="border-b border-gray-100 dark:border-[#333] px-4 py-3 flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Склад</span>
              <select
                value={selectedWarehouseId}
                onChange={e => setSelectedWarehouseId(e.target.value)}
                className="border border-gray-200 dark:border-[#333] rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-100 min-w-[220px]"
              >
                <option value="">Выберите склад</option>
                {filteredWarehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              <div className="ml-auto flex items-center gap-2">
                <input
                  value={newWarehouseName}
                  onChange={e => setNewWarehouseName(e.target.value)}
                  placeholder={currentDepartment ? `Новый склад (${currentDepartment.name})` : 'Новый склад'}
                  className="border border-gray-200 dark:border-[#333] rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-100"
                />
                <button
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700"
                  onClick={handleCreateWarehouse}
                >
                  Добавить склад
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar min-h-0">
              {balancesForView.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  Нет данных по остаткам. Создайте склад и добавьте операции поступления.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#333]">
                    <tr className="text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-2 font-medium w-40">Код</th>
                      <th className="px-4 py-2 font-medium">Номенклатура</th>
                      <th className="px-4 py-2 font-medium w-20">Ед.</th>
                      <th className="px-4 py-2 font-medium w-28 text-right">Остаток</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balancesForView.map(b => (
                      <tr key={`${b.warehouseId}_${b.itemId}`} className="border-b border-gray-100 dark:border-[#333] last:border-0">
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{b.itemSku}</td>
                        <td className="px-4 py-2 text-gray-800 dark:text-gray-100">{b.itemName}</td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{b.itemUnit}</td>
                        <td className="px-4 py-2 text-right text-gray-800 dark:text-gray-100">{b.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="border-b border-gray-100 dark:border-[#333] px-4 py-3 flex items-center gap-3 flex-wrap shrink-0">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Новая номенклатура</span>
              <input
                value={newItemSku}
                onChange={e => setNewItemSku(e.target.value)}
                placeholder="Код"
                className="border border-gray-200 dark:border-[#333] rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-100 w-24"
              />
              <input
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                placeholder="Название"
                className="border border-gray-200 dark:border-[#333] rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-100 flex-1"
              />
              <input
                value={newItemUnit}
                onChange={e => setNewItemUnit(e.target.value)}
                placeholder="Ед. изм."
                className="border border-gray-200 dark:border-[#333] rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-100 w-24"
              />
              <input
                value={newItemCategory}
                onChange={e => setNewItemCategory(e.target.value)}
                placeholder="Категория"
                className="border border-gray-200 dark:border-[#333] rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-100 w-32"
              />
              <input
                value={newItemNotes}
                onChange={e => setNewItemNotes(e.target.value)}
                placeholder="Комментарий"
                className="border border-gray-200 dark:border-[#333] rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-100 flex-1"
              />
              <button
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700"
                onClick={handleCreateItem}
              >
                Добавить
              </button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar min-h-0">
              {items.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  Номенклатура не создана. Добавьте позиции выше.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#333]">
                    <tr className="text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-2 font-medium w-32">Код</th>
                      <th className="px-4 py-2 font-medium">Название</th>
                      <th className="px-4 py-2 font-medium w-24">Ед. изм.</th>
                      <th className="px-4 py-2 font-medium w-32">Категория</th>
                      <th className="px-4 py-2 font-medium">Комментарий</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} className="border-b border-gray-100 dark:border-[#333] last:border-0">
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{item.sku}</td>
                        <td className="px-4 py-2 text-gray-800 dark:text-gray-100">{item.name}</td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{item.unit}</td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{item.category}</td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{item.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="border-b border-gray-100 dark:border-[#333] px-4 py-3 flex flex-wrap items-center gap-3 shrink-0">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Новая операция</span>
              <select
                value={movementType}
                onChange={e => setMovementType(e.target.value as any)}
                className="border border-gray-200 dark:border-[#333] rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-100"
              >
                <option value="receipt">Поступление</option>
                <option value="transfer">Перемещение</option>
                <option value="writeoff">Списание</option>
              </select>
              {movementType !== 'receipt' && (
                <select
                  value={fromWarehouseId}
                  onChange={e => setFromWarehouseId(e.target.value)}
                  className="border border-gray-200 dark:border-[#333] rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-100 min-w-[160px]"
                >
                  <option value="">Со склада</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              )}
              {movementType !== 'writeoff' && (
                <select
                  value={toWarehouseId}
                  onChange={e => setToWarehouseId(e.target.value)}
                  className="border border-gray-200 dark:border-[#333] rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-100 min-w-[160px]"
                >
                  <option value="">На склад</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={movementItemId}
                onChange={e => setMovementItemId(e.target.value)}
                className="border border-gray-200 dark:border-[#333] rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-100 min-w-[200px]"
              >
                <option value="">Номенклатура</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <input
                value={movementQty}
                onChange={e => setMovementQty(e.target.value)}
                placeholder="Кол-во"
                className="border border-gray-200 dark:border-[#333] rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-100 w-24"
              />
              <input
                value={movementReason}
                onChange={e => setMovementReason(e.target.value)}
                placeholder="Комментарий"
                className="border border-gray-200 dark:border-[#333] rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-[#252525] text-gray-800 dark:text-gray-100 flex-1"
              />
              <button
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700"
                onClick={handleCreateMovement}
              >
                Провести
              </button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar min-h-0">
              {movements.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  Журнал пуст. Создайте первую операцию.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#333]">
                    <tr className="text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-2 font-medium w-24">Дата</th>
                      <th className="px-4 py-2 font-medium w-24">Тип</th>
                      <th className="px-4 py-2 font-medium w-40">Со склада</th>
                      <th className="px-4 py-2 font-medium w-40">На склад</th>
                      <th className="px-4 py-2 font-medium">Описание</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements
                      .slice()
                      .reverse()
                      .map(m => {
                        const fromWh = m.fromWarehouseId ? warehouses.find(w => w.id === m.fromWarehouseId)?.name : '';
                        const toWh = m.toWarehouseId ? warehouses.find(w => w.id === m.toWarehouseId)?.name : '';
                        return (
                          <tr key={m.id} className="border-b border-gray-100 dark:border-[#333] last:border-0">
                            <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                              {new Date(m.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-gray-800 dark:text-gray-100">
                              {m.type === 'receipt' && 'Поступление'}
                              {m.type === 'transfer' && 'Перемещение'}
                              {m.type === 'writeoff' && 'Списание'}
                              {m.type === 'adjustment' && 'Корректировка'}
                            </td>
                            <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{fromWh}</td>
                            <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{toWh}</td>
                            <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{m.reason}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryView;


