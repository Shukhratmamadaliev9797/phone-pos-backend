import {
  RepairDetailViewDto,
  RepairEntryViewDto,
  RepairViewDto,
} from './dto/repair-result.dto';
import { RepairEntry } from './entities/repair-entry.entity';
import { Repair } from './entities/repair.entity';

export function toRepairView(repair: Repair): RepairViewDto {
  return {
    id: repair.id,
    createdAt: repair.createdAt,
    itemId: repair.itemId,
    repairedAt: repair.repairedAt,
    description: repair.description,
    status: repair.status,
    costTotal: repair.costTotal,
    partsCost: repair.partsCost,
    laborCost: repair.laborCost,
    technicianId: repair.technicianId,
    notes: repair.notes,
    item: repair.item
      ? {
          id: repair.item.id,
          imei: repair.item.imei,
          brand: repair.item.brand,
          model: repair.item.model,
          status: repair.item.status,
          condition: repair.item.condition,
        }
      : null,
    technician: repair.technician
      ? {
          id: repair.technician.id,
          username: repair.technician.username,
          fullName: repair.technician.fullName,
        }
      : null,
  };
}

export function toRepairEntryView(entry: RepairEntry): RepairEntryViewDto {
  return {
    id: entry.id,
    entryAt: entry.entryAt,
    description: entry.description,
    costTotal: entry.costTotal,
    partsCost: entry.partsCost,
    laborCost: entry.laborCost,
    notes: entry.notes,
  };
}

export function toRepairDetailView(repair: Repair): RepairDetailViewDto {
  const entries = (repair.entries ?? []).map(toRepairEntryView);
  const entriesTotal = entries.reduce(
    (sum, entry) => sum + Number(entry.costTotal ?? 0),
    0,
  );

  return {
    ...toRepairView(repair),
    entries,
    totalRepairSpent: entriesTotal.toFixed(2),
    totalCost: repair.costTotal,
  };
}
