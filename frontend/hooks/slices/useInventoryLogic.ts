import { useState, useEffect } from 'react';
import { Warehouse, InventoryItem, StockMovement, StockMovementType, StockBalance } from '../../../types';
import { api } from '../../../backend/api';

export const useInventoryLogic = (showNotification: (msg: string) => void) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(api.inventory.getWarehouses());
  const [items, setItems] = useState<InventoryItem[]>(api.inventory.getItems());
  const [movements, setMovements] = useState<StockMovement[]>(api.inventory.getMovements());

  const recalcBalances = (movs: StockMovement[]): StockBalance[] => {
      const balancesMap = new Map<string, number>(); // key: `${warehouseId}_${itemId}`

      for (const m of movs) {
          for (const row of m.items) {
              const qty = row.quantity;
              if (m.type === 'receipt') {
                  if (!m.toWarehouseId) continue;
                  const key = `${m.toWarehouseId}_${row.itemId}`;
                  balancesMap.set(key, (balancesMap.get(key) || 0) + qty);
              } else if (m.type === 'writeoff') {
                  if (!m.fromWarehouseId) continue;
                  const key = `${m.fromWarehouseId}_${row.itemId}`;
                  balancesMap.set(key, (balancesMap.get(key) || 0) - qty);
              } else if (m.type === 'transfer') {
                  if (!m.fromWarehouseId || !m.toWarehouseId) continue;
                  const fromKey = `${m.fromWarehouseId}_${row.itemId}`;
                  const toKey = `${m.toWarehouseId}_${row.itemId}`;
                  balancesMap.set(fromKey, (balancesMap.get(fromKey) || 0) - qty);
                  balancesMap.set(toKey, (balancesMap.get(toKey) || 0) + qty);
              } else if (m.type === 'adjustment') {
                  if (!m.toWarehouseId) continue;
                  const key = `${m.toWarehouseId}_${row.itemId}`;
                  balancesMap.set(key, (balancesMap.get(key) || 0) + qty);
              }
          }
      }

      const balances: StockBalance[] = [];
      balancesMap.forEach((quantity, key) => {
          const [warehouseId, itemId] = key.split('_');
          balances.push({ warehouseId, itemId, quantity });
      });
      return balances;
  };

  const [balances, setBalances] = useState<StockBalance[]>(recalcBalances(api.inventory.getMovements()));

  // Пересчитываем балансы при изменении движений
  useEffect(() => {
      setBalances(recalcBalances(movements));
  }, [movements]);

  const saveWarehouses = (next: Warehouse[]) => {
      setWarehouses(next);
      api.inventory.updateWarehouses(next);
  };

  const saveItems = (next: InventoryItem[]) => {
      setItems(next);
      api.inventory.updateItems(next);
  };

  const saveMovements = (next: StockMovement[]) => {
      setMovements(next);
      api.inventory.updateMovements(next);
  };

  // CRUD
  const saveWarehouse = (wh: Warehouse) => {
      const updated = warehouses.find(w => w.id === wh.id)
          ? warehouses.map(w => w.id === wh.id ? wh : w)
          : [...warehouses, wh];
      saveWarehouses(updated);
      showNotification('Склад сохранён');
  };

  const deleteWarehouse = (id: string) => {
      const updated = warehouses.filter(w => w.id !== id);
      saveWarehouses(updated);
      showNotification('Склад удалён');
  };

  const saveItem = (item: InventoryItem) => {
      const updated = items.find(i => i.id === item.id)
          ? items.map(i => i.id === item.id ? item : i)
          : [...items, item];
      saveItems(updated);
      showNotification('Номенклатура сохранена');
  };

  const deleteItem = (id: string) => {
      const updated = items.filter(i => i.id !== id);
      saveItems(updated);
      showNotification('Номенклатура удалена');
  };

  const createMovement = (payload: {
      type: StockMovementType;
      fromWarehouseId?: string;
      toWarehouseId?: string;
      items: { itemId: string; quantity: number; price?: number }[];
      reason?: string;
      createdByUserId: string;
  }) => {
      const movement: StockMovement = {
          id: `mv-${Date.now()}`,
          type: payload.type,
          date: new Date().toISOString(),
          fromWarehouseId: payload.fromWarehouseId,
          toWarehouseId: payload.toWarehouseId,
          items: payload.items,
          reason: payload.reason,
          createdByUserId: payload.createdByUserId,
      };
      const updated = [...movements, movement];
      saveMovements(updated);
      showNotification('Операция по складу создана');
  };

  return {
      state: {
          warehouses,
          items,
          movements,
          balances,
      },
      actions: {
          saveWarehouse,
          deleteWarehouse,
          saveItem,
          deleteItem,
          createMovement,
      },
      setters: {
          setWarehouses,
          setItems,
          setMovements,
          setBalances,
      },
  };
};


