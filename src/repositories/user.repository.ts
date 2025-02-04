import {BindingScope, Getter, inject, injectable} from '@loopback/core';
import {BelongsToAccessor, HasOneRepositoryFactory, repository, HasManyThroughRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources/db.datasource';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {Branch, Organization, Role, User, UserCredentials, UserData, UserRelations, Quotation, QuotationProjectManager, QuotationDesigner} from '../models';
import {OperationHook} from '../operation-hooks';
import {BranchRepository} from './branch.repository';
import {OrganizationRepository} from './organization.repository';
import {RoleRepository} from './role.repository';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';
import {UserCredentialsRepository} from './user-credentials.repository';
import {UserDataRepository} from './user-data.repository';
import {QuotationProjectManagerRepository} from './quotation-project-manager.repository';
import {QuotationRepository} from './quotation.repository';
import {QuotationDesignerRepository} from './quotation-designer.repository';

@injectable({scope: BindingScope.TRANSIENT})
export class UserRepository extends SoftCrudRepository<

  User,
  typeof User.prototype.id,
  UserRelations
> {

  public readonly userCredentials: HasOneRepositoryFactory<UserCredentials, typeof User.prototype.id>;

  public readonly role: BelongsToAccessor<Role, typeof User.prototype.id>;

  public readonly organization: BelongsToAccessor<Organization, typeof User.prototype.id>;

  public readonly userData: BelongsToAccessor<UserData, typeof User.prototype.id>;

  public readonly immediateBoss: BelongsToAccessor<User, typeof User.prototype.id>;

  public readonly branch: BelongsToAccessor<Branch, typeof User.prototype.id>;

  public readonly quotationProjectManager: HasManyThroughRepositoryFactory<Quotation, typeof Quotation.prototype.id,
          QuotationProjectManager,
          typeof User.prototype.id
        >;

  public readonly quotationDesigner: HasManyThroughRepositoryFactory<Quotation, typeof Quotation.prototype.id,
          QuotationDesigner,
          typeof User.prototype.id
        >;

  public readonly quotationPM: HasOneRepositoryFactory<QuotationProjectManager, typeof User.prototype.id>;

  public readonly quotationDe: HasOneRepositoryFactory<QuotationDesigner, typeof User.prototype.id>;

  constructor(
    //@inject('models.User') model: User,
    @inject('datasources.db') dataSource: DbDataSource,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>,
    @repository.getter('UserCredentialsRepository') protected userCredentialsRepositoryGetter: Getter<UserCredentialsRepository>, @repository.getter('RoleRepository') protected roleRepositoryGetter: Getter<RoleRepository>, @repository.getter('OrganizationRepository') protected organizationRepositoryGetter: Getter<OrganizationRepository>, @repository.getter('UserDataRepository') protected userDataRepositoryGetter: Getter<UserDataRepository>, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('BranchRepository') protected branchRepositoryGetter: Getter<BranchRepository>, @repository.getter('QuotationProjectManagerRepository') protected quotationProjectManagerRepositoryGetter: Getter<QuotationProjectManagerRepository>, @repository.getter('QuotationRepository') protected quotationRepositoryGetter: Getter<QuotationRepository>, @repository.getter('QuotationDesignerRepository') protected quotationDesignerRepositoryGetter: Getter<QuotationDesignerRepository>,
  ) {
    super(
      User,
      dataSource
    );
    this.quotationDe = this.createHasOneRepositoryFactoryFor('quotationDe', quotationDesignerRepositoryGetter);
    this.registerInclusionResolver('quotationDe', this.quotationDe.inclusionResolver);
    this.quotationPM = this.createHasOneRepositoryFactoryFor('quotationPM', quotationProjectManagerRepositoryGetter);
    this.registerInclusionResolver('quotationPM', this.quotationPM.inclusionResolver);
    this.quotationDesigner = this.createHasManyThroughRepositoryFactoryFor('quotationDesigner', quotationRepositoryGetter, quotationDesignerRepositoryGetter,);
    this.registerInclusionResolver('quotationDesigner', this.quotationDesigner.inclusionResolver);
    this.quotationProjectManager = this.createHasManyThroughRepositoryFactoryFor('quotationProjectManager', quotationRepositoryGetter, quotationProjectManagerRepositoryGetter,);
    this.registerInclusionResolver('quotationProjectManager', this.quotationProjectManager.inclusionResolver);
    this.branch = this.createBelongsToAccessorFor('branch', branchRepositoryGetter,);
    this.registerInclusionResolver('branch', this.branch.inclusionResolver);
    this.immediateBoss = this.createBelongsToAccessorFor('immediateBoss', userRepositoryGetter,);
    this.registerInclusionResolver('immediateBoss', this.immediateBoss.inclusionResolver);

    this.definePersistedModel(User)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.USER);
    });

    this.userData = this.createBelongsToAccessorFor('userData', userDataRepositoryGetter,);
    this.registerInclusionResolver('userData', this.userData.inclusionResolver);
    this.organization = this.createBelongsToAccessorFor('organization', organizationRepositoryGetter,);
    this.registerInclusionResolver('organization', this.organization.inclusionResolver);
    this.role = this.createBelongsToAccessorFor('role', roleRepositoryGetter,);
    this.registerInclusionResolver('role', this.role.inclusionResolver);
    this.userCredentials = this.createHasOneRepositoryFactoryFor('userCredentials', userCredentialsRepositoryGetter);
    this.registerInclusionResolver('userCredentials', this.userCredentials.inclusionResolver);

  }
  async findCredentials(userId: typeof User.prototype.id): Promise<UserCredentials | undefined> {
    try {
      return await this.userCredentials(userId).get();
    } catch (err) {
      if (err.code === 'ENTITY_NOT_FOUND') {
        return undefined;
      }
      throw err;
    }
  }
}
