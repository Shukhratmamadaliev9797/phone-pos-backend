import {
  SalaryPaymentViewDto,
  WorkerDetailsViewDto,
  WorkerViewDto,
} from './dto/worker-result.dto';
import { WorkerSalaryPayment } from './entities/worker-salary-payment.entity';
import { Worker } from './entities/worker.entity';

export function toWorkerView(worker: Worker): WorkerViewDto {
  return {
    createdAt: worker.createdAt,
    id: worker.id,
    fullName: worker.fullName,
    phoneNumber: worker.phoneNumber,
    address: worker.address,
    monthlySalary: worker.monthlySalary,
    salaryType: worker.salaryType,
    salaryPercent: worker.salaryPercent,
    workerRole: worker.workerRole,
    hasDashboardAccess: worker.hasDashboardAccess,
    userId: worker.userId,
    loginEmail: worker.user?.email ?? null,
    notes: worker.notes,
    soldPhonesCount: Number(worker.soldPhonesCount ?? 0),
    totalSoldAmount: worker.totalSoldAmount,
    totalProfitAmount: worker.totalProfitAmount,
    percentSalaryAccrued: worker.percentSalaryAccrued,
  };
}

export function toSalaryPaymentView(
  payment: WorkerSalaryPayment,
): SalaryPaymentViewDto {
  return {
    id: payment.id,
    workerId: payment.workerId,
    month: payment.month,
    amountPaid: payment.amountPaid,
    paidAt: payment.paidAt,
    notes: payment.notes,
  };
}

export function toWorkerDetailsView(worker: Worker): WorkerDetailsViewDto {
  const payments = (worker.salaryPayments ?? []).map(toSalaryPaymentView);
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const totalPaidThisMonth = payments
    .filter((payment) => payment.month === month)
    .reduce((sum, payment) => sum + Number(payment.amountPaid ?? 0), 0)
    .toFixed(2);

  return {
    ...toWorkerView(worker),
    payments,
    totalPaidThisMonth,
    lastPaymentAt:
      payments.length > 0
        ? [...payments].sort(
            (a, b) =>
              new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
          )[0].paidAt
        : null,
  };
}
