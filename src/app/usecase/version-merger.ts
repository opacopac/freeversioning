import {PflegeStatus} from '../domain/pflege-status';
import {IEntity} from '../domain/i-entity';
import {TimelineItem} from '../domain/timeline-item';


export class VersionMerger {
    private static MS_PER_DAY = 24 * 3600 * 1000;


    public static getEntityTimeline(entity: IEntity, pflegeStatus: PflegeStatus): TimelineItem[] {
        const timeline = entity
            .getAllVersions() // get all versions of entity
            .filter(version => version.getPflegestatus() === pflegeStatus) // filter version by pflegestatus
            .map(version => new TimelineItem(version.getGueltigVon(), version.getGueltigBis(), version)) // map to timeline slices
            .sort((a, b) => a.getVon().getTime() - b.getVon().getTime()); // sort slices ascending by date

        // recursively merge timeline into timelines of higher pflegestatus until PRODUKTIV is reached
        if (pflegeStatus > PflegeStatus.PRODUKTIV) {
            return VersionMerger.mergeTwoTimelines(timeline, VersionMerger.getEntityTimeline(entity, pflegeStatus - 1));
        } else {
            return timeline;
        }
    }


    public static mergeTwoTimelines(domTimeline: TimelineItem[], subTimeline: TimelineItem[]): TimelineItem[] {
        return domTimeline // get all slices in domTimeline
            // merge each domSlice into newTimeline (initially subTimeline)
            .reduce((newTimeline, domSlice) => {
                return VersionMerger.mergeItemIntoTimeline(domSlice, newTimeline);
            }, subTimeline);
    }


    public static mergeItemIntoTimeline(domSlice: TimelineItem, subTimeline: TimelineItem[]): TimelineItem[] {
        if (subTimeline.length === 0) {
            return [domSlice];
        }

        return subTimeline // get all slices in subTimeline
            .map(subSlice => VersionMerger.mergeTwoTimelineItems(domSlice, subSlice)) // merge domSlice & subSlice to new timeline
            .reduce((allSlices, timeline) => { return allSlices.concat(timeline) }, []) // flatten array of timelines to one timeline
            .filter((slice, idx, list) => list.indexOf(slice) === idx) // remove duplicate slices
            .sort((a, b) => a.getVon().getTime() - b.getVon().getTime()); // sort slices ascending by date
    }


    public static mergeTwoTimelineItems(domSlice: TimelineItem, subSlice: TimelineItem): TimelineItem[] {
        if (domSlice.getVon() <= subSlice.getVon() && domSlice.getBis() >= subSlice.getBis()) {
            // case A: dom overlaps sub fully
            return [domSlice];
        } else if (domSlice.getVon() <= subSlice.getVon() && domSlice.getBis() < subSlice.getBis() && domSlice.getBis() >= subSlice.getVon()) {
            // case B: dom overlaps sub at beginning
            return [
                domSlice,
                new TimelineItem(new Date(domSlice.getBis().getTime() + VersionMerger.MS_PER_DAY), subSlice.getBis(), subSlice.getVersion())
            ]
        } else if (domSlice.getVon() > subSlice.getVon() && domSlice.getBis() >= subSlice.getBis() && domSlice.getVon() <= subSlice.getBis()) {
            // case C: dom overlaps sub at end
            return [
                new TimelineItem(subSlice.getVon(), new Date(domSlice.getVon().getTime() - VersionMerger.MS_PER_DAY), subSlice.getVersion()),
                domSlice
            ]
        } else if (domSlice.getVon() > subSlice.getVon() && domSlice.getBis() < subSlice.getBis()) {
            // case D: dom overlaps sub in the middle
            return [
                new TimelineItem(subSlice.getVon(), new Date(domSlice.getVon().getTime() - VersionMerger.MS_PER_DAY), subSlice.getVersion()),
                domSlice,
                new TimelineItem(new Date(domSlice.getBis().getTime() + VersionMerger.MS_PER_DAY), subSlice.getBis(), subSlice.getVersion())
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
