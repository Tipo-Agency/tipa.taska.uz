
import React from 'react';
import { FinanceCategory, FinancePlan, PurchaseRequest, Department, User, FinancialPlanDocument, FinancialPlanning } from '../../types';
import FinanceView from '../FinanceView';

interface FinanceModuleProps {
  categories: FinanceCategory[];
  plan: FinancePlan | null;
  requests: PurchaseRequest[];
  departments: Department[];
  users: User[];
  currentUser: User;
  financialPlanDocuments?: FinancialPlanDocument[];
  financialPlannings?: FinancialPlanning[];
  actions: any;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({ categories, plan, requests, departments, users, currentUser, financialPlanDocuments = [], financialPlannings = [], actions }) => {
    return (
        <FinanceView 
            categories={categories} 
            plan={plan || {id:'p1', period:'month', salesPlan:0, currentIncome:0}} 
            requests={requests} 
            departments={departments} 
            users={users} 
            currentUser={currentUser}
            financialPlanDocuments={financialPlanDocuments}
            financialPlannings={financialPlannings}
            onSaveRequest={actions.savePurchaseRequest} 
            onDeleteRequest={actions.deletePurchaseRequest}
            onSaveFinancialPlanDocument={actions.saveFinancialPlanDocument}
            onDeleteFinancialPlanDocument={actions.deleteFinancialPlanDocument}
            onSaveFinancialPlanning={actions.saveFinancialPlanning}
            onDeleteFinancialPlanning={actions.deleteFinancialPlanning}
        />
    );
};
