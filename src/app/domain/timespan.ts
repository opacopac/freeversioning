export class Timespan {
    constructor(private von: Date, private bis: Date) {}

    getVon(): Date { return this.von; }

    getBis(): Date { return this.bis; }
}
