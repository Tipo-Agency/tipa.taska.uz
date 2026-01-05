import { firestoreService } from "../../services/firestoreService";
import { Warehouse, InventoryItem, StockMovement } from "../../types";

const WAREHOUSES_COLLECTION = 'warehouses';
const INVENTORY_ITEMS_COLLECTION = 'inventoryItems';
const STOCK_MOVEMENTS_COLLECTION = 'stockMovements';

export const inventoryEndpoint = {
    getWarehouses: async (): Promise<Warehouse[]> => {
        return await firestoreService.getAll(WAREHOUSES_COLLECTION) as Warehouse[];
    },
    updateWarehouses: async (warehouses: Warehouse[]) => {
        await Promise.all(warehouses.map(wh => firestoreService.save(WAREHOUSES_COLLECTION, wh)));
    },

    getItems: async (): Promise<InventoryItem[]> => {
        return await firestoreService.getAll(INVENTORY_ITEMS_COLLECTION) as InventoryItem[];
    },
    updateItems: async (items: InventoryItem[]) => {
        await Promise.all(items.map(item => firestoreService.save(INVENTORY_ITEMS_COLLECTION, item)));
    },

    getMovements: async (): Promise<StockMovement[]> => {
        return await firestoreService.getAll(STOCK_MOVEMENTS_COLLECTION) as StockMovement[];
    },
    updateMovements: async (movements: StockMovement[]) => {
        await Promise.all(movements.map(mov => firestoreService.save(STOCK_MOVEMENTS_COLLECTION, mov)));
    },
};
