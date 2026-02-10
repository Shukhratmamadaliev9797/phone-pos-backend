import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CustomerBaseService } from './customer-base.service';

export type EnsureCustomerPayload = {
  phoneNumber: string;
  fullName?: string;
  address?: string;
  passportId?: string;
  notes?: string;
};

@Injectable()
export class CustomerEnsureService extends CustomerBaseService {
  async ensureCustomer(
    payload: EnsureCustomerPayload,
    manager?: EntityManager,
  ): Promise<Customer> {
    const repository = manager
      ? manager.getRepository(Customer)
      : this.customersRepository;

    const phoneNumber = payload.phoneNumber?.trim();
    if (!phoneNumber) {
      throw new BadRequestException('customer.phoneNumber is required');
    }

    const fullName = payload.fullName?.trim();
    const address = payload.address?.trim();
    const passportId = payload.passportId?.trim();
    const notes = payload.notes?.trim();

    const existing = await repository.findOne({
      where: { phoneNumber },
      withDeleted: false,
    });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.deletedAt = null;
      }

      if (fullName) {
        existing.fullName = fullName;
      } else if (!existing.fullName?.trim()) {
        existing.fullName = phoneNumber;
      }

      if (address !== undefined && address !== '') {
        existing.address = address;
      }
      if (passportId !== undefined && passportId !== '') {
        existing.passportId = passportId;
      }
      if (notes !== undefined && notes !== '') {
        existing.notes = notes;
      }

      return repository.save(existing);
    }

    const created = repository.create({
      phoneNumber,
      fullName: fullName || phoneNumber,
      address: address || null,
      passportId: passportId || null,
      notes: notes || null,
    });

    return repository.save(created);
  }
}
