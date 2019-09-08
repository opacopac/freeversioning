import {IEntity} from './i-entity';
import {PflegeStatus} from './pflege-status';


export interface IVersion {
    getGueltigVon(): Date;

    getGueltigBis(): Date;

    getPflegestatus(): PflegeStatus;

    getChildEntities(): IEntity[];
}
