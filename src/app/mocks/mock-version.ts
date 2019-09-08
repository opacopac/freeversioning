import {IVersion} from '../domain/i-version';
import {IEntity} from '../domain/i-entity';
import {PflegeStatus} from '../domain/pflege-status';


export class MockVersion implements IVersion {
    constructor(private gueltigVon: Date, private gueltigBis: Date, private status: PflegeStatus, private children: IEntity[]) {}

    getGueltigVon(): Date { return this.gueltigVon; }

    getGueltigBis(): Date { return this.gueltigBis; }

    getChildEntities(): IEntity[] { return this.children; }

    getPflegestatus(): PflegeStatus { return this.status; }
}
