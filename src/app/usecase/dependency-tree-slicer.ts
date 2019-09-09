import {PflegeStatus} from '../domain/pflege-status';
import {IEntity} from '../domain/i-entity';
import {VersionMerger} from './version-merger';
import {Timespan} from '../domain/timespan';


export class DependencyTreeSlicer {
    private static MS_PER_DAY = 24 * 3600 * 1000;

    public static calcTreeTimeSlices(treeParent: IEntity, minDate: Date, maxDate: Date, minPflegeStatus: PflegeStatus): Timespan[] {
        return VersionMerger
            .getEntityTimeline(treeParent, minPflegeStatus) // calculate timeline of parent (merging versions of same or higher pflegestatus)
            .filter(timelineItem => timelineItem.getVon() <= maxDate && timelineItem.getBis() >= minDate) // filter by min/max date
            .reduce((totalSlices, timelineItem) => { // merge own or child slices into one list
                // limit min/max dates
                const sliceMin = timelineItem.getVon() > minDate ? timelineItem.getVon() : minDate;
                const sliceMax = timelineItem.getBis() < maxDate ? timelineItem.getBis() : maxDate;

                if (timelineItem.getVersion().getChildEntities().length === 0) {
                    // if no children: add parent slice
                    return DependencyTreeSlicer.intersectTwoTimeSliceLists(totalSlices, [new Timespan(sliceMin, sliceMax)]);
                } else {
                    // else: add child slices recursively
                    return DependencyTreeSlicer.intersectTwoTimeSliceLists(
                        totalSlices,
                        timelineItem
                            .getVersion()
                            .getChildEntities()
                            .map(childEntity => DependencyTreeSlicer.calcTreeTimeSlices(childEntity, sliceMin, sliceMax, minPflegeStatus))
                            .reduce((totalChildSlices, currentChildSlice) => {
                                return DependencyTreeSlicer.intersectTwoTimeSliceLists(totalChildSlices, currentChildSlice);
                            }, [])
                    );
                }
            }, []);
    }


    public static intersectTwoTimeSliceLists(slices1: Timespan[], slices2: Timespan[]): Timespan[] {
        // create sorted & unique von/bis timestamp lists
        const allSlices = slices1.concat(slices2);
        const vonList = allSlices
            .map(slice => slice.getVon().getTime()) // convert to timestamp
            .filter((vonTs, idx, list) => list.indexOf(vonTs) === idx) // filter unique values
            .sort((a, b) => a - b); // sort ascending
        const bisList = allSlices
            .map(slice => slice.getBis().getTime()) // convert to timestamp
            .filter((bisTs, idx, list) => list.indexOf(bisTs) === idx) // filter unique values
            .sort((a, b) => a - b); // sort ascending

        // for each entry in von-list (except first), add von-1 day to bis-list
        const bisList2 = bisList.concat(vonList
            .filter((vonTs, idx) => idx > 0) // skip first entry
            .map(vonTs => vonTs - DependencyTreeSlicer.MS_PER_DAY) // von -1 day
        )
            .filter((vonTs, idx, list) => list.indexOf(vonTs) === idx) // filter unique values
            .sort((a, b) => a - b); // sort ascending

        // for each entry in bis-list (except last), add bis+1 day to von-list
        const vonList2 = vonList.concat(bisList
            .filter((bisTs, idx, list) => idx < list.length - 1) // skip last entry
            .map(bisTs => bisTs + DependencyTreeSlicer.MS_PER_DAY) // bis +1 day
        )
            .filter((von, idx, list) => list.indexOf(von) === idx) // filter unique values
            .sort((a, b) => a - b); // sort ascending

        // combine von/bis pairs & filter holes
        return vonList2
            .map((vonTs, idx) => new Timespan(new Date(vonTs), new Date(bisList2[idx]))) // build pairs
            .filter(slice => { // skip holes
                return vonList.indexOf(slice.getVon().getTime()) >= 0 || bisList.indexOf(slice.getBis().getTime()) >= 0
            });
    }
}
