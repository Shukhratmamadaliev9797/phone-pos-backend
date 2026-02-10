import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class CustomerBaseService {
  constructor(
    @InjectRepository(Customer)
    protected readonly customersRepository: Repository<Customer>,
  ) {}

  protected async getActiveCustomerOrThrow(
    id: number,
    manager?: EntityManager,
  ): Promise<Customer> {
    const repository = manager
      ? manager.getRepository(Customer)
      : this.customersRepository;

    const customer = await repository.findOne({
      where: { id, isActive: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  protected async findByPhoneOrNull(
    phoneNumber: string,
    manager?: EntityManager,
  ): Promise<Customer | null> {
    const repository = manager
      ? manager.getRepository(Customer)
      : this.customersRepository;

    return repository.findOne({
      where: { phoneNumber },
      withDeleted: false,
    });
  }
}
