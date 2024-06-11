import {
    Count,
    DataObject,
    DefaultTransactionalRepository,
    Entity,
    Filter,
    Options,
    Where,
    juggler
} from '@loopback/repository';
import {SoftDeleteEntity} from '../models';


export abstract class SoftCrudRepository<
    T extends SoftDeleteEntity,
    ID,
    Relations extends object = {},
> extends DefaultTransactionalRepository<T, ID, Relations> {
    constructor(
        entityClass: typeof Entity & {
            prototype: T;
        },
        dataSource: juggler.DataSource,
    ) {
        super(entityClass, dataSource);
    }

    find(filter?: Filter<T>, options?: Options): Promise<(T & Relations)[]> {
        // Filter out soft isDeleted entries
        filter = filter || {};
        filter.where = filter.where || {};
        (filter.where as any).isDeleted = false

        // Now call super
        return super.find(filter, options);
    }

    findOne(filter?: Filter<T>, options?: Options): Promise<(T & Relations) | null> {
        // Filter out soft isDeleted entries
        filter = filter || {};
        filter.where = filter.where || {};
        (filter.where as any).isDeleted = false;

        // Now call super
        return super.findOne(filter, options);
    }

    findById(
        id: ID,
        filter?: Filter<T>,
        options?: Options,
    ): Promise<T & Relations> {
        // Filter out soft isDeleted entries
        filter = filter || {};
        filter.where = filter.where || {};
        (filter.where as any).isDeleted = false;

        // Now call super
        return super.findById(id, filter, options);
    }

    findHard(filter?: Filter<T>, options?: Options): Promise<(T & Relations)[]> {
        return super.find(filter, options);
    }

    findOneHard(filter?: Filter<T>, options?: Options): Promise<(T & Relations) | null> {
        return super.findOne(filter, options);
    }

    findByIdHard(
        id: ID,
        filter?: Filter<T>,
        options?: Options,
    ): Promise<T & Relations> {
        return super.findById(id, filter, options);
    }

    updateAll(
        data: DataObject<T>,
        where?: Where<T>,
        options?: Options,
    ): Promise<Count> {
        // Filter out soft isDeleted entries
        where = where || {};
        (where as any).isDeleted = false;

        // Now call super
        return super.updateAll(data, where, options);
    }

    count(where?: Where<T>, options?: Options): Promise<Count> {
        // Filter out soft isDeleted entries
        where = where || {};
        (where as any).isDeleted = false;

        // Now call super
        return super.count(where, options);
    }

    delete(entity: T, options?: Options): Promise<void> {
        // Do soft delete, no hard delete allowed
        (entity as any).isDeleted = true;
        return super.update(entity, options);
    }

    deleteAll(where?: Where<T>, options?: Options): Promise<Count> {
        // Do soft delete, no hard delete allowed
        return this.updateAll(
            {
                isDeleted: true,
            } as any,
            where,
            options,
        );
    }

    deleteById(id: ID, options?: Options): Promise<void> {
        // Do soft delete, no hard delete allowed
        return super.updateById(
            id,
            {
                isDeleted: true,
            } as any,
            options,
        );
    }

    findByIdOrDefault = async (id: ID | undefined, filter?: Filter<T>): Promise<T | undefined> => {
        try {
            if (!id)
                return undefined;

            const model = await this.findById(id, filter);
            return model;
        } catch (error) {
            return undefined;
        }
    }
}
