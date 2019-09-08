import {IVersion} from './i-version';


export interface IEntity {
    getAllVersions(): IVersion[];
}
