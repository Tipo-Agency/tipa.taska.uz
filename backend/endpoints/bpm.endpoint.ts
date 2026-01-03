
import { storageService } from "../../services/storageService";
import { OrgPosition, BusinessProcess } from "../../types";

export const bpmEndpoint = {
  getPositions: () => storageService.getOrgPositions(),
  updatePositions: (ops: OrgPosition[]) => storageService.setOrgPositions(ops),
  
  getProcesses: () => storageService.getBusinessProcesses(),
  updateProcesses: (bps: BusinessProcess[]) => storageService.setBusinessProcesses(bps),
};
