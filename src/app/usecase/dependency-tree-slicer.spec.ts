import {PflegeStatus} from '../domain/pflege-status';
import {DependencyTreeSlicer} from './dependency-tree-slicer';
import {MockEntitiy} from '../mocks/mock-entity';
import {MockVersion} from '../mocks/mock-version';
import {Timespan} from '../domain/timespan';


describe('DependencyTreeSlicer', () => {
    // region intersectTimeSlices

    //       0                   1
    //       0 1 2 3 4 5 6 7 8 9 0 1 ... H
    // e1:   [------------][-------------]
    // e2:           [----------][-------]
    // exp:  [------][----][----][-------]
    it('calculates the intersections of two timelines', () => {
        const e1v1 = new Timespan(new Date('2000-01-01'), new Date('2006-12-31'));
        const e1v2 = new Timespan(new Date('2007-01-01'), new Date('9999-12-31'));

        const e2v1 = new Timespan(new Date('2004-01-01'), new Date('2009-12-31'));
        const e2v2 = new Timespan(new Date('2010-01-01'), new Date('9999-12-31'));

        const slices = DependencyTreeSlicer.intersectTimeSlices([e1v1, e1v2], [e2v1, e2v2]);

        expect(slices.length).toEqual(4);
        expect(slices[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(slices[0].getBis()).toEqual(new Date('2003-12-31'));
        expect(slices[1].getVon()).toEqual(new Date('2004-01-01'));
        expect(slices[1].getBis()).toEqual(new Date('2006-12-31'));
        expect(slices[2].getVon()).toEqual(new Date('2007-01-01'));
        expect(slices[2].getBis()).toEqual(new Date('2009-12-31'));
        expect(slices[3].getVon()).toEqual(new Date('2010-01-01'));
        expect(slices[3].getBis()).toEqual(new Date('9999-12-31'));
    });


    //       0                   1
    //       0 1 2 3 4 5 6 7 8 9 0 1 ... H
    // e1:   [------]        [------]
    // e2:   [--]        [------]
    // exp:  [--][--]    [--][--][--]
    it('calculates the intersections of two timelines with holes', () => {
        const e1v1 = new Timespan(new Date('2000-01-01'), new Date('2003-12-31'));
        const e1v2 = new Timespan(new Date('2008-01-01'), new Date('2011-12-31'));

        const e2v1 = new Timespan(new Date('2000-01-01'), new Date('2001-12-31'));
        const e2v2 = new Timespan(new Date('2006-01-01'), new Date('2009-12-31'));

        const slices = DependencyTreeSlicer.intersectTimeSlices([e1v1, e1v2], [e2v1, e2v2]);

        expect(slices.length).toEqual(5);
        expect(slices[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(slices[0].getBis()).toEqual(new Date('2001-12-31'));
        expect(slices[1].getVon()).toEqual(new Date('2002-01-01'));
        expect(slices[1].getBis()).toEqual(new Date('2003-12-31'));
        expect(slices[2].getVon()).toEqual(new Date('2006-01-01'));
        expect(slices[2].getBis()).toEqual(new Date('2007-12-31'));
        expect(slices[3].getVon()).toEqual(new Date('2008-01-01'));
        expect(slices[3].getBis()).toEqual(new Date('2009-12-31'));
        expect(slices[4].getVon()).toEqual(new Date('2010-01-01'));
        expect(slices[4].getBis()).toEqual(new Date('2011-12-31'));
    });


    //       0                   1
    //       0 1 2 3 4 5 6 7 8 9 0 1 ... H
    // e1:   [------------][-------------]
    // e2:
    // exp:  [------------][-------------]
    it('calculates the intersection of a normal with an empty timeline', () => {
        const e1v1 = new Timespan(new Date('2000-01-01'), new Date('2006-12-31'));
        const e1v2 = new Timespan(new Date('2007-01-01'), new Date('9999-12-31'));

        const slices1 = DependencyTreeSlicer.intersectTimeSlices([e1v1, e1v2], []);
        const slices2 = DependencyTreeSlicer.intersectTimeSlices([], [e1v1, e1v2]);

        expect(slices1.length).toEqual(2);
        expect(slices1[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(slices1[0].getBis()).toEqual(new Date('2006-12-31'));
        expect(slices1[1].getVon()).toEqual(new Date('2007-01-01'));
        expect(slices1[1].getBis()).toEqual(new Date('9999-12-31'));

        expect(slices2.length).toEqual(2);
        expect(slices2[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(slices2[0].getBis()).toEqual(new Date('2006-12-31'));
        expect(slices2[1].getVon()).toEqual(new Date('2007-01-01'));
        expect(slices2[1].getBis()).toEqual(new Date('9999-12-31'));
    });


    it('calculates the intersections of two empty timeline', () => {
        const slices = DependencyTreeSlicer.intersectTimeSlices([], []);

        expect(slices.length).toEqual(0);
    });

    // endregion


    // region calcTimeSlices

    //       0                   1
    //       0 1 2 3 4 5 6 7 8 9 0 1 ... H
    // awb1: [------------][-------------]
    //            ->rg1         ->rg2
    // rg1:  [---------------------------]
    // rg2:  [------][----------][-------]
    // exp:  [------------][----][-------]
    it('calculates dependency tree slices for 2 levels with single children', () => {
        const rg1v1 = new MockVersion(new Date('2000-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, []);
        const rg1 = new MockEntitiy([rg1v1]);

        const rg2v1 = new MockVersion(new Date('2000-01-01'), new Date('2003-12-31'), PflegeStatus.PRODUKTIV, []);
        const rg2v2 = new MockVersion(new Date('2004-01-01'), new Date('2009-12-31'), PflegeStatus.PRODUKTIV, []);
        const rg2v3 = new MockVersion(new Date('2010-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, []);
        const rg2 = new MockEntitiy([rg2v1, rg2v2, rg2v3]);

        const awb1v1 = new MockVersion(new Date('2000-01-01'), new Date('2006-12-31'), PflegeStatus.PRODUKTIV, [rg1]);
        const awb1v2 = new MockVersion(new Date('2007-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, [rg2]);
        const awb1 = new MockEntitiy([awb1v1, awb1v2]);

        const slices = DependencyTreeSlicer.calcTimeSlices(awb1, new Date('2000-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV);

        expect(slices.length).toEqual(3);
        expect(slices[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(slices[0].getBis()).toEqual(new Date('2006-12-31'));
        expect(slices[1].getVon()).toEqual(new Date('2007-01-01'));
        expect(slices[1].getBis()).toEqual(new Date('2009-12-31'));
        expect(slices[2].getVon()).toEqual(new Date('2010-01-01'));
        expect(slices[2].getBis()).toEqual(new Date('9999-12-31'));
    });


    //       0                   1
    //       0 1 2 3 4 5 6 7 8 9 0 1 ... H
    // awb1: [---------------------------]
    //               ->rg1,rg2,rg3
    // rg1:  [--------------------][-----]
    // rg2:  [------][----------][-------]
    // rg3:  [------------][-------------]
    // exp:  [------][----][----][][-----]
    it('calculates dependency tree slices for 2 levels with multiple children', () => {
        const rg1v1 = new MockVersion(new Date('2000-01-01'), new Date('2010-12-31'), PflegeStatus.PRODUKTIV, []);
        const rg1v2 = new MockVersion(new Date('2011-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, []);
        const rg1 = new MockEntitiy([rg1v1, rg1v2]);

        const rg2v1 = new MockVersion(new Date('2000-01-01'), new Date('2003-12-31'), PflegeStatus.PRODUKTIV, []);
        const rg2v2 = new MockVersion(new Date('2004-01-01'), new Date('2009-12-31'), PflegeStatus.PRODUKTIV, []);
        const rg2v3 = new MockVersion(new Date('2010-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, []);
        const rg2 = new MockEntitiy([rg2v1, rg2v2, rg2v3]);

        const rg3v1 = new MockVersion(new Date('2000-01-01'), new Date('2006-12-31'), PflegeStatus.PRODUKTIV, []);
        const rg3v2 = new MockVersion(new Date('2007-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, []);
        const rg3 = new MockEntitiy([rg3v1, rg3v2]);

        const awb1v1 = new MockVersion(new Date('2000-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, [rg1, rg2, rg3]);
        const awb1 = new MockEntitiy([awb1v1]);

        const slices = DependencyTreeSlicer.calcTimeSlices(awb1, new Date('2000-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV);

        expect(slices.length).toEqual(5);
        expect(slices[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(slices[0].getBis()).toEqual(new Date('2003-12-31'));
        expect(slices[1].getVon()).toEqual(new Date('2004-01-01'));
        expect(slices[1].getBis()).toEqual(new Date('2006-12-31'));
        expect(slices[2].getVon()).toEqual(new Date('2007-01-01'));
        expect(slices[2].getBis()).toEqual(new Date('2009-12-31'));
        expect(slices[3].getVon()).toEqual(new Date('2010-01-01'));
        expect(slices[3].getBis()).toEqual(new Date('2010-12-31'));
        expect(slices[4].getVon()).toEqual(new Date('2011-01-01'));
        expect(slices[4].getBis()).toEqual(new Date('9999-12-31'));
    });


    //         0                   1
    //         0 1 2 3 4 5 6 7 8 9 0 1 ... H
    // awb1 P: [---------------------------]
    //                    ->rg1
    // awb1 T:               [-------------]
    //                            ->rg2
    // rg1: P  [---------------------------]
    // rg2  P:         [-------------------]
    // rg2  T:                     [-------]
    // exp: P: [---------------------------]
    // exp: T: [------------][----][-------]
    it('calculates dependency tree slices for 2 levels with mixed pflegestatus', () => {
        const rg1v1 = new MockVersion(new Date('2000-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, []);
        const rg1 = new MockEntitiy([rg1v1]);

        const rg2v1 = new MockVersion(new Date('2004-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, []);
        const rg2v2 = new MockVersion(new Date('2010-01-01'), new Date('9999-12-31'), PflegeStatus.TEST, []);
        const rg2 = new MockEntitiy([rg2v1, rg2v2]);

        const awb1v1 = new MockVersion(new Date('2000-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, [rg1]);
        const awb1v2 = new MockVersion(new Date('2007-01-01'), new Date('9999-12-31'), PflegeStatus.TEST, [rg2]);
        const awb1 = new MockEntitiy([awb1v1, awb1v2]);

        const slicesP = DependencyTreeSlicer.calcTimeSlices(awb1, new Date('2000-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV);
        const slicesT = DependencyTreeSlicer.calcTimeSlices(awb1, new Date('2000-01-01'), new Date('9999-12-31'), PflegeStatus.TEST);

        expect(slicesP.length).toEqual(1);
        expect(slicesP[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(slicesP[0].getBis()).toEqual(new Date('9999-12-31'));

        expect(slicesT.length).toEqual(3);
        expect(slicesT[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(slicesT[0].getBis()).toEqual(new Date('2006-12-31'));
        expect(slicesT[1].getVon()).toEqual(new Date('2007-01-01'));
        expect(slicesT[1].getBis()).toEqual(new Date('2009-12-31'));
        expect(slicesT[2].getVon()).toEqual(new Date('2010-01-01'));
        expect(slicesT[2].getBis()).toEqual(new Date('9999-12-31'));
    });


    //         0                   1
    //         0 1 2 3 4 5 6 7 8 9 0 1 ... H
    // awb1 P: [----------]    [-----------]
    //            ->rg1            ->rg2
    // rg1: P  [------------]
    // rg2  P: [---------------------------]
    // exp: P: [----------]    [-----------]
    it('calculates dependency tree slices for parent versions with (good) gaps', () => {
        const rg1v1 = new MockVersion(new Date('2000-01-01'), new Date('2006-12-31'), PflegeStatus.PRODUKTIV, []);
        const rg1 = new MockEntitiy([rg1v1]);

        const rg2v1 = new MockVersion(new Date('2000-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, []);
        const rg2 = new MockEntitiy([rg2v1]);

        const awb1v1 = new MockVersion(new Date('2000-01-01'), new Date('2005-12-31'), PflegeStatus.PRODUKTIV, [rg1]);
        const awb1v2 = new MockVersion(new Date('2008-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, [rg2]);
        const awb1 = new MockEntitiy([awb1v1, awb1v2]);

        const slices = DependencyTreeSlicer.calcTimeSlices(awb1, new Date('2000-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV);

        expect(slices.length).toEqual(2);
        expect(slices[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(slices[0].getBis()).toEqual(new Date('2005-12-31'));
        expect(slices[1].getVon()).toEqual(new Date('2008-01-01'));
        expect(slices[1].getBis()).toEqual(new Date('9999-12-31'));
    });


    //         0                   1
    //         0 1 2 3 4 5 6 7 8 9 0 1 2 ... H
    // awb1 P: [------------][---------------]
    //             ->zp1          ->zp2
    // zp1  P: [-----------------------------]
    //                   ->z1, z2
    // zp2  P: [------][----------][---------]
    //           ->z1      ->z2      ->z3
    // z1   P: [--------------][-------------]
    // z2   P: [----------------][-----------]
    // z3   P: [----------------------][-----]
    // exp: P: [------------][--][][--][-----]

    it('calculates dependency tree slices 3 levels', () => {
        const z1v1 = new MockVersion(new Date('2000-01-01'), new Date('2007-12-31'), PflegeStatus.PRODUKTIV, []);
        const z1v2 = new MockVersion(new Date('2008-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, []);
        const z1 = new MockEntitiy([z1v1, z1v2]);

        const z2v1 = new MockVersion(new Date('2000-01-01'), new Date('2008-12-31'), PflegeStatus.PRODUKTIV, []);
        const z2v2 = new MockVersion(new Date('2009-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, []);
        const z2 = new MockEntitiy([z2v1, z2v2]);

        const z3v1 = new MockVersion(new Date('2000-01-01'), new Date('2011-12-31'), PflegeStatus.PRODUKTIV, []);
        const z3v2 = new MockVersion(new Date('2012-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, []);
        const z3 = new MockEntitiy([z3v1, z3v2]);

        const zp1v1 = new MockVersion(new Date('2000-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, [z1, z2]);
        const zp1 = new MockEntitiy([zp1v1]);

        const zp2v1 = new MockVersion(new Date('2000-01-01'), new Date('2003-12-31'), PflegeStatus.PRODUKTIV, [z1]);
        const zp2v2 = new MockVersion(new Date('2004-01-01'), new Date('2009-12-31'), PflegeStatus.PRODUKTIV, [z2]);
        const zp2v3 = new MockVersion(new Date('2010-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, [z3]);
        const zp2 = new MockEntitiy([zp2v1, zp2v2, zp2v3]);

        const awb1v1 = new MockVersion(new Date('2000-01-01'), new Date('2006-12-31'), PflegeStatus.PRODUKTIV, [zp1]);
        const awb1v2 = new MockVersion(new Date('2007-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV, [zp2]);
        const awb1 = new MockEntitiy([awb1v1, awb1v2]);

        const slices = DependencyTreeSlicer.calcTimeSlices(awb1, new Date('2000-01-01'), new Date('9999-12-31'), PflegeStatus.PRODUKTIV);

        expect(slices.length).toEqual(5);
        expect(slices[0].getVon()).toEqual(new Date('2000-01-01'));
        expect(slices[0].getBis()).toEqual(new Date('2006-12-31'));
        expect(slices[1].getVon()).toEqual(new Date('2007-01-01'));
        expect(slices[1].getBis()).toEqual(new Date('2008-12-31'));
        expect(slices[2].getVon()).toEqual(new Date('2009-01-01'));
        expect(slices[2].getBis()).toEqual(new Date('2009-12-31'));
        expect(slices[3].getVon()).toEqual(new Date('2010-01-01'));
        expect(slices[3].getBis()).toEqual(new Date('2011-12-31'));
        expect(slices[4].getVon()).toEqual(new Date('2012-01-01'));
        expect(slices[4].getBis()).toEqual(new Date('9999-12-31'));
    });


    // endregion
});
