import {IEntity} from '../domain/i-entity';
import {IVersion} from '../domain/i-version';


export class MockEntitiy implements IEntity {
    constructor(private versions: IVersion[]) {}

    getAllVersions(): IVersion[] { return this.versions; }
}
