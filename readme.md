# Aikuma-NG #

A web-app (and Chrome packaged app) for recording and annotating speech. Aikuma-*NG* is intended is intended to help
people record and translate speech, by means of making additional audio recordings and/or producing written annotations.

Aikuma-*NG* is an evolution from the Aikuma native Android app. At present the two are not broadly comparable since
the Aikuma-*NG* beta requires a desktop Chrome browser, e.g. Windows, Mac, Linux, and will not yet work on Android.
The *-NG* suffix can be interpreted as 'next-generation' or Angular.

The app provides the ability to record and import audio files, allows the user to respeak or translate by
making additional recordings by alternating play and record. Annotation can be performed by referring to the source and
respeaking and translation audio if available. Annotations may be typed or dictated by speech recognition. The user may
export the annotations as an SRT or WebVTT file, e.g. supported by YouTube.

Aikuma-*NG* design goals are:

1. Intuitively easy-to-use by anyone without specialist linguistic training
2. Use of web technologies; cross-platform, sustainable
3. Installable as a local 'app' via the Chrome Packaged App scheme, and eventually mobile platforms via Apache Cordova
4. Based on Material Design to accommodate touch-screen devices, tablets and eventually mobile phones
5. Focus on sharing content to social platforms, e.g. exporting captions for YouTube

### Features ###

Aikuma-*NG* allows users to import audio files or record new audio files. Work is organised into sessions, each of which
represents a primary recording and a set of descriptive metadata and audio or textual annotations.

![Aikuma-ng status screenshot](https://github.com/aikuma/Annoweb/blob/master/markdown/status-screenshot.png)

Users may either annotate source files directly or they may first 'respeak' and/or translate. In this way, a native
speaker (perhaps an elder) would be able to make a source recording more suitable for transcription, or may translate,
while someone else (perhaps a younger person)could use the annotation editor to produce a set of annotations.

![Aikuma-ng respeak screenshot](https://github.com/aikuma/Annoweb/blob/master/markdown/respeak-screenshot.png)

The respeak and translate interface are very easy-to-use, operated by toggling between playback and record with the
left and right shift keys. Seeking or fast-forwarding into a lengthy recording is also supported. Work is
automatically saved so that users may continue working on a long source recording when time permits.

Note: Screen shots are need of updating!

### The Aikuma Project ###

Aikuma-*NG* is part of the [Aikuma project](http://www.aikuma.org), an international research and development effort
to design and build tools for collaborative language documentation. Our tools may be of use to linguists undertaking
language documentation, particularly those wishing to scale up their efforts to incorporate collaboration or crowdsourcing.
However a major goal of the Aikuma project is to develop a new class of socially-connected tool language activities
interested in documenting, preserving and/or revitalising their own language.

### Project Dependencies ###

> Aikuma-*NG* would not be possible without the wealth of high quality open source projects upon which it depends:

- [AngularJS](https://angularjs.org/)
- [Angular Material](https://material.angularjs.org/latest/)
- [UnderscoreJS](http://underscorejs.org/)
- [ZipJS](http://gildas-lormeau.github.io/zip.js/)
- [RecorderJS](https://github.com/mattdiamond/Recorderjs)
- [WavesurferJS](http://wavesurfer-js.org/) (copyright: [CC3.0 BY](https://creativecommons.org/licenses/by/3.0/deed.en_US))
- PapaParse, Angular-indexedDB, Angular-resizable, Angular-route, Angular-translate, Ng-prettyjson, Keypress, Any-resize-event
