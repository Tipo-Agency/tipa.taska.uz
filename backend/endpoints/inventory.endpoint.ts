import { storageService } from "../../services/storageService";
import { Warehouse, InventoryItem, StockMovement } from "../../types";

export const inventoryEndpoint = {
  getWarehouses: () => storageService.getWarehouses(),
  updateWarehouses: (warehouses: Array<Warehouse>) => storageService.setWarehouses(warehouses),

  getItems: () => storageService.getInventoryItems(),
  updateItems: (items: InventoryItem[]) => storageService.setInventoryItems(items),

  getMovements: () => storageService.getStockMovements(),
  updateMovements: (movements: StockMovement[]) => storageService.setStockMovements(movements),
};


