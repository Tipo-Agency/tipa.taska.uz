import { firestoreService } from "../../services/firestoreService";
import { Department, FinanceCategory, FinancePlan, PurchaseRequest, FinancialPlanDocument, FinancialPlanning } from "../../types";
import { DEFAULT_FINANCE_CATEGORIES } from "../../constants";

const DEPARTMENTS_COLLECTION = 'departments';
const FINANCE_CATEGORIES_COLLECTION = 'financeCategories';
const FINANCE_PLAN_COLLECTION = 'financePlan';
const PURCHASE_REQUESTS_COLLECTION = 'purchaseRequests';
const FINANCIAL_PLAN_DOCUMENTS_COLLECTION = 'financialPlanDocuments';
const FINANCIAL_PLANNINGS_COLLECTION = 'financialPlannings';

export const departmentsEndpoint = {
    getAll: async (): Promise<Department[]> => {
        return await firestoreService.getAll(DEPARTMENTS_COLLECTION) as Department[];
    },
    updateAll: async (departments: Department[]) => {
        await Promise.all(departments.map(dept => firestoreService.save(DEPARTMENTS_COLLECTION, dept)));
    },
};

export const financeEndpoint = {
    getCategories: async (): Promise<FinanceCategory[]> => {
        const items = await firestoreService.getAll(FINANCE_CATEGORIES_COLLECTION);
        return items.length > 0 ? (items as FinanceCategory[]) : DEFAULT_FINANCE_CATEGORIES;
    },
    updateCategories: async (categories: FinanceCategory[]) => {
        await Promise.all(categories.map(cat => firestoreService.save(FINANCE_CATEGORIES_COLLECTION, cat)));
    },
    
    getPlan: async (): Promise<FinancePlan | null> => {
        const items = await firestoreService.getAll(FINANCE_PLAN_COLLECTION);
        return items.length > 0 ? (items[0] as FinancePlan) : null;
    },
    updatePlan: async (plan: FinancePlan) => {
        const existing = await firestoreService.getAll(FINANCE_PLAN_COLLECTION);
        if (existing.length > 0) {
            await firestoreService.save(FINANCE_PLAN_COLLECTION, { ...plan, id: existing[0].id });
        } else {
            await firestoreService.save(FINANCE_PLAN_COLLECTION, { ...plan, id: 'default' });
        }
    },
    
    getRequests: async (): Promise<PurchaseRequest[]> => {
        return await firestoreService.getAll(PURCHASE_REQUESTS_COLLECTION) as PurchaseRequest[];
    },
    updateRequests: async (requests: PurchaseRequest[]) => {
        await Promise.all(requests.map(req => firestoreService.save(PURCHASE_REQUESTS_COLLECTION, req)));
    },
    
    getFinancialPlanDocuments: async (): Promise<FinancialPlanDocument[]> => {
        return await firestoreService.getAll(FINANCIAL_PLAN_DOCUMENTS_COLLECTION) as FinancialPlanDocument[];
    },
    updateFinancialPlanDocuments: async (docs: FinancialPlanDocument[]) => {
        await Promise.all(docs.map(doc => firestoreService.save(FINANCIAL_PLAN_DOCUMENTS_COLLECTION, doc)));
    },
    
    getFinancialPlannings: async (): Promise<FinancialPlanning[]> => {
        return await firestoreService.getAll(FINANCIAL_PLANNINGS_COLLECTION) as FinancialPlanning[];
    },
    updateFinancialPlannings: async (plannings: FinancialPlanning[]) => {
        await Promise.all(plannings.map(plan => firestoreService.save(FINANCIAL_PLANNINGS_COLLECTION, plan)));
    },
};
