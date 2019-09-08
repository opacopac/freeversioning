import {PflegeStatus} from '../domain/pflege-status';
import {MockEntitiy} from '../mocks/mock-entity';
import {MockVersion} from '../mocks/mock-version';
import {VersionMerger} from './version-merger';
import {TimelineSlice} from '../domain/timeline-slice';


describe('VersionMerger', () => {
    // region mergeTwoSlices

    //        0                   1                   2
    //      9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 ... H
    // sub:   [----------------------------------------]
    // dom: [-------------------------------------------------]
    // exp: [-------------------------------------------------]
    it('merges two slices: dom fully overlapping sub', () => {
        const verSub = new MockVersion(new Date('2000-01-01'), new Date('2020-12-31'), PflegeStatus.PRODUKTIV, []);
        const verDom = new MockVersion(new Date('1999-01-01'), new Date('9999-12-31'), PflegeStatus.TEST, []);
        const sliceSub = new TimelineSlice(verSub.getGueltigVon(), verSub.getGueltigBis(), verSub);
        const sliceDom = new TimelineSlice(verDom.getGueltigVon(), verDom.getGueltigBis(), verDom);

        const slices = VersionMerger.mergeTwoSlices(sliceDom, sliceSub);

        expect(slices.length).toEqual(1);
        expect(slices[0].getVon()).toEqual(new Date('1999-01-01'));
        expect(slices[0].getBis()).toEqual(new Date('9999-12-31'));
        expect(slices[0].getVersion()).toEqual(verDom);
    });


    //        0                   1                   2
    //      9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 ... H
    // sub:   [----------------------------------------]
    // dom: [------------]
    // exp: [------------][----------------------------]
    it('merges two slices: dom overlapping sub at the beginning', () => {
        const verSub = new MockVersion(new Date('2000-01-01'), new Date('2020-12-31'), PflegeStatus.PRODUKTIV, []);
        const verDom = new MockVersion(new Date('1999-01-01'), new Date('2005-05-05'), PflegeStatus.TEST, []);
        const sliceSub = new TimelineSlice(verSub.getGueltigVon(), verSub.getGueltigBis(), verSub);
        const sliceDom = new TimelineSlice(verDom.getGueltigVon(), verDom.getGueltigBis(), verDom);

        const slices = VersionMerger.mergeTwoSlices(sliceDom, sliceSub);

        expect(slices.length).toEqual(2);
        expect(slices[0].getVon()).toEqual(new Date('1999-01-01'));
        expect(slices[0].getBis()).toEqual(new Date('2005-05-05'));
        expect(slices[0].getVersion()).toEqual(verDom);

        expect(slices[1].getVon()).toEqual(new Date('2005-05-06'));
        expect(slices[1].getBis()).toEqual(new Date('2020-12-31'));
        expect(slices[1].getVersion()).toEqual(verSub);
    });


    //        0                   1                   2
    //      9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 ... H
    // sub:   [----------------------------------------]
    // dom:                       [---------------------------]
    // exp:   [------------------][---------------------------]
    it('merges two slices: dom overlapping sub at the end', () => {
        const verSub = new MockVersion(new Date('2000-01-01'), new Date('2020-12-31'), PflegeStatus.PRODUKTIV, []);
        const verDom = new MockVersion(new Date('2010-01-01'), new Date('9999-12-31'), PflegeStatus.TEST, []);
        const sliceSub = new TimelineSlice(verSub.getGueltigVon(), verSub.getGueltigBis(), verSub);
        const sliceDom = new TimelineSlice(verDom.getGueltigVon(), verDom.getGueltigBis(), verDom);

        const slices = VersionMerger.mergeTwoSlices(sliceDom, sliceSub);

        expect(slices.length).toEqual(2);
        expect(slices[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(slices[0].getBis()).toEqual(new Date('2009-12-31'));
        expect(slices[0].getVersion()).toEqual(verSub);

        expect(slices[1].getVon()).toEqual(new Date('2010-01-01'));
        expect(slices[1].getBis()).toEqual(new Date('9999-12-31'));
        expect(slices[1].getVersion()).toEqual(verDom);
    });


    //        0                   1                   2
    //      9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 ... H
    // sub:   [-----------------------------------------------]
    // dom:                       [--------------------]
    // exp:   [------------------][--------------------][-----]
    it('merges two slices: dom overlapping sub in the middle', () => {
        const verSub = new MockVersion(new Date('2000-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, []);
        const verDom = new MockVersion(new Date('2010-01-01'), new Date('2020-12-31'), PflegeStatus.TEST, []);
        const sliceSub = new TimelineSlice(verSub.getGueltigVon(), verSub.getGueltigBis(), verSub);
        const sliceDom = new TimelineSlice(verDom.getGueltigVon(), verDom.getGueltigBis(), verDom);

        const slices = VersionMerger.mergeTwoSlices(sliceDom, sliceSub);

        expect(slices.length).toEqual(3);
        expect(slices[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(slices[0].getBis()).toEqual(new Date('2009-12-31'));
        expect(slices[0].getVersion()).toEqual(verSub);

        expect(slices[1].getVon()).toEqual(new Date('2010-01-01'));
        expect(slices[1].getBis()).toEqual(new Date('2020-12-31'));
        expect(slices[1].getVersion()).toEqual(verDom);

        expect(slices[2].getVon()).toEqual(new Date('2021-01-01'));
        expect(slices[2].getBis()).toEqual(new Date('9999-12-31'));
        expect(slices[2].getVersion()).toEqual(verSub);
    });


    //        0                   1                   2
    //      9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 ... H
    // sub: [------------]
    // dom:                       [--------------------]
    // exp: [------------]        [--------------------]
    it('merges two slices: dom and sub dont overlap', () => {
        const verSub = new MockVersion(new Date('2010-01-01'), new Date('2020-12-31'), PflegeStatus.PRODUKTIV, []);
        const verDom = new MockVersion(new Date('1999-01-01'), new Date('2005-05-05'), PflegeStatus.TEST, []);
        const sliceSub = new TimelineSlice(verSub.getGueltigVon(), verSub.getGueltigBis(), verSub);
        const sliceDom = new TimelineSlice(verDom.getGueltigVon(), verDom.getGueltigBis(), verDom);

        const slices = VersionMerger.mergeTwoSlices(sliceDom, sliceSub);

        expect(slices.length).toEqual(2);
        expect(slices[0].getVon()).toEqual(new Date('1999-01-01'));
        expect(slices[0].getBis()).toEqual(new Date('2005-05-05'));
        expect(slices[0].getVersion()).toEqual(verDom);

        expect(slices[1].getVon()).toEqual(new Date('2010-01-01'));
        expect(slices[1].getBis()).toEqual(new Date('2020-12-31'));
        expect(slices[1].getVersion()).toEqual(verSub);
    });

    // endregion


    // region mergeOneSliceIntoTimeline

    //        0                   1                   2
    //      9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
    // sub: [][------------------][----][--------------]
    // dom:             [--------------------]
    // exp: [][--------][--------------------][--------]
    it('merges one slice into timeline', () => {
        const vSub0 = new MockVersion(new Date('1999-01-01'), new Date('1999-12-31'), PflegeStatus.PRODUKTIV, []);
        const vSub1 = new MockVersion(new Date('2000-01-01'), new Date('2009-12-31'), PflegeStatus.PRODUKTIV, []);
        const vSub2 = new MockVersion(new Date('2010-01-01'), new Date('2012-12-31'), PflegeStatus.PRODUKTIV, []);
        const vSub3 = new MockVersion(new Date('2013-01-01'), new Date('2020-12-31'), PflegeStatus.PRODUKTIV, []);
        const vDom1 = new MockVersion(new Date('2005-01-01'), new Date('2015-12-31'), PflegeStatus.TEST, []);

        const slices = VersionMerger.mergeOneSliceIntoTimeline(
            new TimelineSlice(vDom1.getGueltigVon(), vDom1.getGueltigBis(), vDom1),
            [
                new TimelineSlice(vSub0.getGueltigVon(), vSub0.getGueltigBis(), vSub0),
                new TimelineSlice(vSub1.getGueltigVon(), vSub1.getGueltigBis(), vSub1),
                new TimelineSlice(vSub2.getGueltigVon(), vSub2.getGueltigBis(), vSub2),
                new TimelineSlice(vSub3.getGueltigVon(), vSub3.getGueltigBis(), vSub3)
            ]
        );

        expect(slices.length).toEqual(4);
        expect(slices[0].getVon()).toEqual(new Date('1999-01-01'));
        expect(slices[0].getBis()).toEqual(new Date('1999-12-31'));
        expect(slices[0].getVersion()).toEqual(vSub0);

        expect(slices[1].getVon()).toEqual(new Date('2000-01-01'));
        expect(slices[1].getBis()).toEqual(new Date('2004-12-31'));
        expect(slices[1].getVersion()).toEqual(vSub1);

        expect(slices[2].getVon()).toEqual(new Date('2005-01-01'));
        expect(slices[2].getBis()).toEqual(new Date('2015-12-31'));
        expect(slices[2].getVersion()).toEqual(vDom1);

        expect(slices[3].getVon()).toEqual(new Date('2016-01-01'));
        expect(slices[3].getBis()).toEqual(new Date('2020-12-31'));
        expect(slices[3].getVersion()).toEqual(vSub3);
    });


    it('merges one slices into empty timeline', () => {
        const vDom1 = new MockVersion(new Date('2005-01-01'), new Date('2015-12-31'), PflegeStatus.TEST, []);

        const slices = VersionMerger.mergeOneSliceIntoTimeline(
            new TimelineSlice(vDom1.getGueltigVon(), vDom1.getGueltigBis(), vDom1), []
        );

        expect(slices.length).toEqual(1);
        expect(slices[0].getVon()).toEqual(new Date('2005-01-01'));
        expect(slices[0].getBis()).toEqual(new Date('2015-12-31'));
        expect(slices[0].getVersion()).toEqual(vDom1);
    });

    // endregion


    // region mergeTwoTimelines

    //      0                   1
    //      0 1 2 3 4 5 6 7 8 9 0 1
    // sub: [------]    [------]
    // dom:     [----]      [----]
    // exp: [--][----]  [--][----]
    it('merges two timelines', () => {
        const vSub1 = new MockVersion(new Date('2000-01-01'), new Date('2003-12-31'), PflegeStatus.PRODUKTIV, []);
        const vSub2 = new MockVersion(new Date('2006-01-01'), new Date('2009-12-31'), PflegeStatus.PRODUKTIV, []);
        const vDom1 = new MockVersion(new Date('2002-01-01'), new Date('2004-12-31'), PflegeStatus.TEST, []);
        const vDom2 = new MockVersion(new Date('2008-01-01'), new Date('2010-12-31'), PflegeStatus.TEST, []);

        const slices = VersionMerger.mergeTwoTimelines(
            [
                new TimelineSlice(vDom1.getGueltigVon(), vDom1.getGueltigBis(), vDom1),
                new TimelineSlice(vDom2.getGueltigVon(), vDom2.getGueltigBis(), vDom2)
            ],
            [
                new TimelineSlice(vSub1.getGueltigVon(), vSub1.getGueltigBis(), vSub1),
                new TimelineSlice(vSub2.getGueltigVon(), vSub2.getGueltigBis(), vSub2)
            ]
        );

        expect(slices.length).toEqual(4);
        expect(slices[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(slices[0].getBis()).toEqual(new Date('2001-12-31'));
        expect(slices[0].getVersion()).toEqual(vSub1);

        expect(slices[1].getVon()).toEqual(new Date('2002-01-01'));
        expect(slices[1].getBis()).toEqual(new Date('2004-12-31'));
        expect(slices[1].getVersion()).toEqual(vDom1);

        expect(slices[2].getVon()).toEqual(new Date('2006-01-01'));
        expect(slices[2].getBis()).toEqual(new Date('2007-12-31'));
        expect(slices[2].getVersion()).toEqual(vSub2);

        expect(slices[3].getVon()).toEqual(new Date('2008-01-01'));
        expect(slices[3].getBis()).toEqual(new Date('2010-12-31'));
        expect(slices[3].getVersion()).toEqual(vDom2);
    });


    it('merge empty domTimeline', () => {
        const vSub1 = new MockVersion(new Date('2000-01-01'), new Date('2003-12-31'), PflegeStatus.PRODUKTIV, []);

        const slices = VersionMerger.mergeTwoTimelines(
            [],
            [new TimelineSlice(vSub1.getGueltigVon(), vSub1.getGueltigBis(), vSub1)]
        );

        expect(slices.length).toEqual(1);
        expect(slices[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(slices[0].getBis()).toEqual(new Date('2003-12-31'));
        expect(slices[0].getVersion()).toEqual(vSub1);
    });


    it('merge empty subTimeline', () => {
        const vDom1 = new MockVersion(new Date('2000-01-01'), new Date('2003-12-31'), PflegeStatus.PRODUKTIV, []);

        const slices = VersionMerger.mergeTwoTimelines(
            [new TimelineSlice(vDom1.getGueltigVon(), vDom1.getGueltigBis(), vDom1)],
            []
        );

        expect(slices.length).toEqual(1);
        expect(slices[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(slices[0].getBis()).toEqual(new Date('2003-12-31'));
        expect(slices[0].getVersion()).toEqual(vDom1);
    });


    it('merge two empty timelines', () => {
        const slices = VersionMerger.mergeTwoTimelines([], []);

        expect(slices.length).toEqual(0);
    });


    // endregion


    // region getEntityTimeline

    //                0                   1
    //                0 1 2 3 4 5 6 7 8 9 0 1 ... H
    // TEST:          [---------------------------]
    // exp PROD:
    // exp ABNAHME:
    // exp TEST:      [---------------------------]
    // exp IN_ARBEIT: [---------------------------]
    it('calculates the timelines of an entity with one version', () => {
        const v1 = new MockVersion(new Date('2000-01-01'), new Date('9999-12-31'), PflegeStatus.TEST, []);
        const entity1 = new MockEntitiy([v1]);

        const prodTimeline = VersionMerger.getEntityTimeline(entity1, PflegeStatus.PRODUKTIV);
        const abnahmeTimeline = VersionMerger.getEntityTimeline(entity1, PflegeStatus.ABNAHME);
        const testTimeline = VersionMerger.getEntityTimeline(entity1, PflegeStatus.TEST);
        const inArbeitTimeline = VersionMerger.getEntityTimeline(entity1, PflegeStatus.IN_ARBEIT);

        expect(prodTimeline.length).toEqual(0);

        expect(abnahmeTimeline.length).toEqual(0);

        expect(testTimeline.length).toEqual(1);
        expect(testTimeline[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(testTimeline[0].getBis()).toEqual(new Date('9999-12-31'));
        expect(testTimeline[0].getVersion()).toEqual(v1);

        expect(inArbeitTimeline.length).toEqual(1);
        expect(inArbeitTimeline[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(inArbeitTimeline[0].getBis()).toEqual(new Date('9999-12-31'));
        expect(inArbeitTimeline[0].getVersion()).toEqual(v1);
    });



    //                0                   1
    //                0 1 2 3 4 5 6 7 8 9 0 1 ... H
    // PROD:          [---------------------------]
    // ABNAHME:           [-----------------------]
    // TEST:                  [-------------------]
    // IN_ARBEIT:                 [---------------]
    // exp PROD:      [---------------------------]
    // exp ABNAHME:   [--][-----------------------]
    // exp TEST:      [--][--][-------------------]
    // exp IN_ARBEIT: [--][--][--][---------------]
    it('calculates the timelines of an entity with different version for each status', () => {
        const v1 = new MockVersion(new Date('2000-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, []);
        const v2 = new MockVersion(new Date('2002-01-01'), new Date('9999-12-31'), PflegeStatus.ABNAHME, []);
        const v3 = new MockVersion(new Date('2004-01-01'), new Date('9999-12-31'), PflegeStatus.TEST, []);
        const v4 = new MockVersion(new Date('2006-01-01'), new Date('9999-12-31'), PflegeStatus.IN_ARBEIT, []);
        const entity1 = new MockEntitiy([v1, v2, v3, v4]);

        const prodTimeline = VersionMerger.getEntityTimeline(entity1, PflegeStatus.PRODUKTIV);
        const abnahmeTimeline = VersionMerger.getEntityTimeline(entity1, PflegeStatus.ABNAHME);
        const testTimeline = VersionMerger.getEntityTimeline(entity1, PflegeStatus.TEST);
        const inArbeitTimeline = VersionMerger.getEntityTimeline(entity1, PflegeStatus.IN_ARBEIT);

        expect(prodTimeline.length).toEqual(1);
        expect(prodTimeline[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(prodTimeline[0].getBis()).toEqual(new Date('9999-12-31'));
        expect(prodTimeline[0].getVersion()).toEqual(v1);

        expect(abnahmeTimeline.length).toEqual(2);
        expect(abnahmeTimeline[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(abnahmeTimeline[0].getBis()).toEqual(new Date('2001-12-31'));
        expect(abnahmeTimeline[0].getVersion()).toEqual(v1);
        expect(abnahmeTimeline[1].getVon()).toEqual(new Date('2002-01-01'));
        expect(abnahmeTimeline[1].getBis()).toEqual(new Date('9999-12-31'));
        expect(abnahmeTimeline[1].getVersion()).toEqual(v2);

        expect(testTimeline.length).toEqual(3);
        expect(testTimeline[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(testTimeline[0].getBis()).toEqual(new Date('2001-12-31'));
        expect(testTimeline[0].getVersion()).toEqual(v1);
        expect(testTimeline[1].getVon()).toEqual(new Date('2002-01-01'));
        expect(testTimeline[1].getBis()).toEqual(new Date('2003-12-31'));
        expect(testTimeline[1].getVersion()).toEqual(v2);
        expect(testTimeline[2].getVon()).toEqual(new Date('2004-01-01'));
        expect(testTimeline[2].getBis()).toEqual(new Date('9999-12-31'));
        expect(testTimeline[2].getVersion()).toEqual(v3);

        expect(inArbeitTimeline.length).toEqual(4);
        expect(inArbeitTimeline[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(inArbeitTimeline[0].getBis()).toEqual(new Date('2001-12-31'));
        expect(inArbeitTimeline[0].getVersion()).toEqual(v1);
        expect(inArbeitTimeline[1].getVon()).toEqual(new Date('2002-01-01'));
        expect(inArbeitTimeline[1].getBis()).toEqual(new Date('2003-12-31'));
        expect(inArbeitTimeline[1].getVersion()).toEqual(v2);
        expect(inArbeitTimeline[2].getVon()).toEqual(new Date('2004-01-01'));
        expect(inArbeitTimeline[2].getBis()).toEqual(new Date('2005-12-31'));
        expect(inArbeitTimeline[2].getVersion()).toEqual(v3);
        expect(inArbeitTimeline[3].getVon()).toEqual(new Date('2006-01-01'));
        expect(inArbeitTimeline[3].getBis()).toEqual(new Date('9999-12-31'));
        expect(inArbeitTimeline[3].getVersion()).toEqual(v4);
    });

    // endregion
});
