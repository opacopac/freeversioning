import {PflegeStatus} from '../domain/pflege-status';
import {IEntity} from '../domain/i-entity';
import {TimelineSlice} from '../domain/timeline-slice';


export class VersionMerger {
    private static MS_PER_DAY = 24 * 3600 * 1000;


    public static getEntityTimeline(entity: IEntity, pflegeStatus: PflegeStatus): TimelineSlice[] {
        const timeline = entity
            .getAllVersions() // get all versions of entity
            .filter(version => version.getPflegestatus() === pflegeStatus) // filter version by pflegestatus
            .map(version => new TimelineSlice(version.getGueltigVon(), version.getGueltigBis(), version)) // map to timeline slices
            .sort((a, b) => a.getVon().getTime() - b.getVon().getTime()); // sort slices ascending by date

        // recursively merge timeline into timelines of higher pflegestatus until PRODUKTIV is reached
        if (pflegeStatus > PflegeStatus.PRODUKTIV) {
            return VersionMerger.mergeTwoTimelines(timeline, VersionMerger.getEntityTimeline(entity, pflegeStatus - 1));
        } else {
            return timeline;
        }
    }


    public static mergeTwoTimelines(domTimeline: TimelineSlice[], subTimeline: TimelineSlice[]): TimelineSlice[] {
        return domTimeline // get all slices in domTimeline
            // merge each domSlice into newTimeline (initially subTimeline)
            .reduce((newTimeline, domSlice) => {
                return VersionMerger.mergeOneSliceIntoTimeline(domSlice, newTimeline);
            }, subTimeline);
    }


    public static mergeOneSliceIntoTimeline(domSlice: TimelineSlice, subTimeline: TimelineSlice[]): TimelineSlice[] {
        if (subTimeline.length === 0) {
            return [domSlice];
        }

        return subTimeline // get all slices in subTimeline
            .map(subSlice => VersionMerger.mergeTwoSlices(domSlice, subSlice)) // merge domSlice & subSlice to new timeline
            .reduce((allSlices, timeline) => { return allSlices.concat(timeline) }, []) // flatten array of timelines to one timeline
            .filter((slice, idx, list) => list.indexOf(slice) === idx) // remove duplicate slices
            .sort((a, b) => a.getVon().getTime() - b.getVon().getTime()); // sort slices ascending by date
    }


    public static mergeTwoSlices(domSlice: TimelineSlice, subSlice: TimelineSlice): TimelineSlice[] {
        if (domSlice.getVon() <= subSlice.getVon() && domSlice.getBis() >= subSlice.getBis()) {
            // case A: dom overlaps sub fully
            return [domSlice];
        } else if (domSlice.getVon() <= subSlice.getVon() && domSlice.getBis() < subSlice.getBis() && domSlice.getBis() >= subSlice.getVon()) {
            // case B: dom overlaps sub at beginning
            return [
                domSlice,
                new TimelineSlice(new Date(domSlice.getBis().getTime() + VersionMerger.MS_PER_DAY), subSlice.getBis(), subSlice.getVersion())
            ]
        } else if (domSlice.getVon() > subSlice.getVon() && domSlice.getBis() >= subSlice.getBis() && domSlice.getVon() <= subSlice.getBis()) {
            // case C: dom overlaps sub at end
            return [
                new TimelineSlice(subSlice.getVon(), new Date(domSlice.getVon().getTime() - VersionMerger.MS_PER_DAY), subSlice.getVersion()),
                domSlice
            ]
        } else if (domSlice.getVon() > subSlice.getVon() && domSlice.getBis() < subSlice.getBis()) {
            // case D: dom overlaps sub in the middle
            return [
                new TimelineSlice(subSlice.getVon(), new Date(domSlice.getVon().getTime() - VersionMerger.MS_PER_DAY), subSlice.getVersion()),
                domSlice,
                new TimelineSlice(new Date(domSlice.getBis().getTime() + VersionMerger.MS_PER_DAY), subSlice.getBis(), subSlice.getVersion())
            ]
        } else {
            // else: slices don't overlap
            if (domSlice.getVon() < subSlice.getVon()) {
                return [domSlice, subSlice];
            } else {
                return [subSlice, domSlice];
            }
        }
    }
}
