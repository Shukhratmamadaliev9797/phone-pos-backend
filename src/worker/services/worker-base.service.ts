import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hashPassword } from 'src/auth/helper';
import { User, UserRole } from 'src/user/user/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { WorkerSalaryPayment } from '../entities/worker-salary-payment.entity';
import { Worker, WorkerRole } from '../entities/worker.entity';

@Injectable()
export class WorkerBaseService {
  constructor(
    @InjectRepository(Worker)
    protected readonly workersRepository: Repository<Worker>,
    @InjectRepository(WorkerSalaryPayment)
    protected readonly workerSalaryPaymentsRepository: Repository<WorkerSalaryPayment>,
    @InjectRepository(User)
    protected readonly usersRepository: Repository<User>,
  ) {}

  protected toMoney(value: number): string {
    return value.toFixed(2);
  }

  protected parseNumeric(value: string | number): number {
    const numeric = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(numeric)) {
      throw new BadRequestException('Numeric value is invalid');
    }
    return numeric;
  }

  protected normalizeMonth(month: string): string {
    const trimmed = month.trim();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(trimmed)) {
      throw new BadRequestException('month must be in YYYY-MM format');
    }
    return trimmed;
  }

  protected parseDateOrNow(value?: string): Date {
    if (!value) {
      return new Date();
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    return parsed;
  }

  protected async getActiveWorkerOrThrow(
    id: number,
    manager?: EntityManager,
  ): Promise<Worker> {
    const repository = manager
      ? manager.getRepository(Worker)
      : this.workersRepository;

    const worker = await repository.findOne({
      where: { id, isActive: true },
      relations: ['user'],
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    return worker;
  }

  protected async getActiveWorkerWithPaymentsOrThrow(
    id: number,
    manager?: EntityManager,
  ): Promise<Worker> {
    const repository = manager
      ? manager.getRepository(Worker)
      : this.workersRepository;

    const worker = await repository
      .createQueryBuilder('worker')
      .leftJoinAndSelect(
        'worker.salaryPayments',
        'salaryPayment',
        'salaryPayment.isActive = :paymentIsActive',
        {
          paymentIsActive: true,
        },
      )
      .leftJoinAndSelect('worker.user', 'user')
      .where('worker.id = :id', { id })
      .andWhere('worker.isActive = :isActive', { isActive: true })
      .orderBy('salaryPayment.paidAt', 'DESC')
      .addOrderBy('salaryPayment.id', 'DESC')
      .getOne();

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    return worker;
  }

  protected mapWorkerRoleToUserRole(
    workerRole: WorkerRole,
    overrideRole?: UserRole,
  ): UserRole {
    if (overrideRole) {
      if (
        overrideRole !== UserRole.OWNER_ADMIN &&
        overrideRole !== UserRole.MANAGER &&
        overrideRole !== UserRole.CASHIER &&
        overrideRole !== UserRole.TECHNICIAN
      ) {
        throw new BadRequestException(
          'login.role must be OWNER_ADMIN/MANAGER/CASHIER/TECHNICIAN',
        );
      }
      return overrideRole;
    }

    if (workerRole === WorkerRole.MANAGER) return UserRole.MANAGER;
    if (workerRole === WorkerRole.CASHIER) return UserRole.CASHIER;
    if (workerRole === WorkerRole.TECHNICIAN) return UserRole.TECHNICIAN;

    throw new BadRequestException(
      'login.role is required when workerRole is OTHER',
    );
  }

  protected normalizeWorkerUsername(source: string): string {
    const normalized = source.trim().toLowerCase();
    const digits = normalized.replace(/\D+/g, '');
    if (digits) {
      return `wrk_${digits}`;
    }
    const safe = normalized.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return `wrk_${safe || 'user'}`;
  }

  protected normalizeOptionalPhone(phoneNumber?: string | null): string | null {
    if (phoneNumber === undefined || phoneNumber === null) {
      return null;
    }
    const trimmed = phoneNumber.trim();
    if (!trimmed) {
      return null;
    }
    const digits = trimmed.replace(/\D+/g, '');
    if (!digits || digits === '998') {
      return null;
    }
    if (digits.startsWith('998')) {
      return `+${digits}`;
    }
    return trimmed;
  }

  protected async ensureActiveWorkerPhoneUnique(
    phoneNumber: string | null,
    ignoreWorkerId?: number,
    manager?: EntityManager,
  ): Promise<void> {
    if (!phoneNumber) {
      return;
    }
    const repository = manager
      ? manager.getRepository(Worker)
      : this.workersRepository;

    const existing = await repository.findOne({
      where: { phoneNumber, isActive: true },
    });

    if (existing && existing.id !== ignoreWorkerId) {
      throw new ConflictException('Worker phoneNumber already exists');
    }
  }

  protected async ensureActiveEmailUnique(
    email: string,
    ignoreUserId?: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager ? manager.getRepository(User) : this.usersRepository;
    const existing = await repository.findOne({ where: { email, isActive: true } });

    if (existing && existing.id !== ignoreUserId) {
      throw new ConflictException('Email already exists');
    }
  }

  protected async createLoginUser(
    params: {
      email: string;
      password: string;
      role: UserRole;
      fullName: string;
      phoneNumber?: string | null;
      address?: string | null;
    },
    manager?: EntityManager,
  ): Promise<User> {
    const repository = manager ? manager.getRepository(User) : this.usersRepository;

    await this.ensureActiveEmailUnique(params.email, undefined, manager);

    const baseUsername = this.normalizeWorkerUsername(
      params.phoneNumber || params.email,
    );
    let username = baseUsername;
    let suffix = 1;

    // Keep username unique even when multiple workers have similar phones in legacy data.
    while (await repository.findOne({ where: { username } })) {
      username = `${baseUsername}_${suffix}`;
      suffix += 1;
    }

    const user = repository.create({
      email: params.email,
      username,
      fullName: params.fullName,
      passwordHash: await hashPassword(params.password),
      phoneNumber: params.phoneNumber ?? null,
      address: params.address ?? null,
      role: params.role,
      isActive: true,
      deletedAt: null,
    });

    return repository.save(user);
  }

  protected async deactivateLinkedUser(
    userId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager ? manager.getRepository(User) : this.usersRepository;

    const user = await repository.findOne({ where: { id: userId } });
    if (!user) {
      return;
    }

    user.isActive = false;
    user.deletedAt = new Date();
    user.refreshTokenVersion += 1;
    await repository.save(user);
  }
}
