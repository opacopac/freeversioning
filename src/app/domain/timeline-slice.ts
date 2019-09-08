import {IVersion} from './i-version';


export class TimelineSlice {
    constructor(private von: Date, private bis: Date, private version: IVersion) {}

    getVon(): Date { return this.von; }

    getBis(): Date { return this.bis; }

    getVersion(): IVersion { return this.version; };
}
