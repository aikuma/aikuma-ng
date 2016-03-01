/**
 * Created by Mat on 20/02/2016.
 */

// This is a description of the state of a project.
// Returns handles to files which need to be opened by wavesurfer
// Also returns metadataID which is used to query a Metadata service

// We might get it like this: ProjectDesc = annowebDataservice(projectId)

ProjectDesc = {
    sourceFileHandle: souceFileHandle,
    sourceMetadata: 'metadataId',
    childsources:
        [
            {
                'fileId': 'some sort of id',
                'file': secondaryFileHandle, // or you could just expose getting a file handle using the id?
                'metadata': 'metadataId'
            }
        ],
    'AnnoDesc': AnnoDesc,
    'SegMap': SegMap,
    'Annotations': Annotations
};

var projectData = dataService.getProject(id);

vm.SegMap = projectData.segmap;
vm.Annotations = projectData.annotations;


// AnnoDesc is a description of the annotations. An annotation optionally specifies a SegMap Id mapping to a segmentation
// in the SegmMap object (below). SegId is optional, in which case the annotation can only contain one segment which is assumed
// to represent the entire file. tagObj is specified later, intended to represent entire span of an annotation.
AnnoDesc = [
    {
        'type': 'annotation',
        'langStr': 'English',
        'langISO': 'en',
        'SegId': 'seg1'
    },
    {
        'type': 'translation',
        'langStr': 'Chinese Mandarin',
        'langISO': 'cmn',
        'SegId': 'seg2'
    }
];

// The Segmap is an object that holds segmentation map arrays, keyed by a SegId (above). A segmentation map array must specify the source (in milliseconds), but the 'end' value
// is optional. End values must be specified for all segments or no segments. Representing either span or point-aligned annotations.
// A segmentation map array may optionally specify a map object. The map object (included after for clarity) is keyed on child fileIds (e.g. ids for respeaking) and specifies a point.
// If a map file is specified, the source must be of span type (e.g. both start and end points specified).
// This example shows a respeaking file mapped to the source, but the translation has it's own segmentation.
SegMap = {
    'seg1': [
        {
            'source': [0, 2000],
            'map': mapObj
        },
        {
            'source': [2000, 4000],
            'map': mapObj
        }
    ],
    'seg2': [
        {
            'source': [0, 1500],
            'map': null
        },
        {
            'source': [1500, 4000],
            'map': null
        }
    ]
};

// This is an object keyed by fileIds for any of the derived files such as a respeaking. We may have more than one.
mapObj = {
    'file1': [1200,3500]
};

// The annotations is an object keyed by annotation Ids specified in AnnoDesc.
// The keys map to arrays of annotations. The length of an annotation array should match the length of the segmentation map array indicated by the SegId.
// text must be set but can be zero length.
//
// The tagObj are intended to represent per-segment tags such as for speakers.

Annotations = {
    0: [
        {
            'text': 'This is a test',
            'tags': tagObj
        },
        {
            'text': 'of respeaking',
            'tags': tagObj
        }
    ],
    1: [
        {
            'text': '(chinese translation)',
            'tags': tagObj
        },
        {
            'text': '(chinese translation)',
            'tags': tagObj
        }
    ]
};

// suggestion for tags by annotation segment. Array of tags organised keyed by types of tags. Allows grouping by type.
tagObj = {
    'speaker': ['mat'],
    'quality': ['clear']
};


