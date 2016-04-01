# Aikuma-ng #

A web-app (and Chrome packaged app) for recording and annotating speech. Aikuma-*ng* is intended is intended to help people record and translate speech, by means of making additional audio recordings and/or producing written annotations.

Aikuma-*ng* differs from the Aikuma native Android mobile app in that Aikuma-*ng* is based on web technologies. The *-ng* suffix can be interpreted as 'next-generation' or Angular. Aikuma-*ng* is intended to be the successor
to the Aikuma Android app with a responsive UI to target platforms from desktop to tablet and mobile.

Current status: Alpha. Several components are functional but it cannot currently be used to do meaningful work. A mobile-capable version is further away than a working desktop version, so those looking for a mobile
solution should continue to use Aikuma.

Aikuma-*ng* design goals are:

1. Intuitively easy-to-use by anyone without specialist linguistic training
2. Use of web technologies; cross-platform, sustainable
3. Installable as a local 'app' via Chrome Packaged App
4. Based on Material Design to accomodate touch-screen devices, tablets and eventually mobile phones
5. Focus on sharing content to social platforms, e.g. exporting captions for YouTube

### Features ###

Aikuma-*ng* allows users to import audio files or record new audio files. Work is organised into sessions, each of which represents
a primary recording and a set of descriptive metadata.

![Aikuma-ng status screenshot](https://github.com/aikuma/Annoweb/blob/master/markdown/status-screenshot.png)

Users may either annotate source files directly or they may first 'respeak' and/or translate. In this way, a native speaker (perhaps an elder) would be
able to make a source recording more suitable for transcription, or may translate, while someone else (perhaps a younger person)could use the
annotation editor to produce a set of annotations.

![Aikuma-ng respeak screenshot](https://github.com/aikuma/Annoweb/blob/master/markdown/respeak-screenshot.png)

The respeak and translate interface are very easy-to-use, operated by toggling between playback and record with the left and right
shift keys. Seeking or fast-forwarding into a lengthy recording is also supported. Work is automatically saved so that users may continue working
on a long source recording when time permits.

### The Aikuma Project ###

Aikuma-*ng* is part of the [Aikuma project](http://www.aikuma.org), an international research and development effort to design and build tools for collaborative language documentation.
Our tools may be of use to linguists undertaking language documentation, particularly those wishing to scale up their efforts to incorporate collaboration or crowdsourcing.
However a major goal of the Aikuma project is to develop a new class of socially-connected tool language activities interested in documenting, preserving and/or revitalising
their own language.



### Project Dependencies ###

> Aikuma-*ng* would not be possible without the wealth of high quality open source projects upon which it depends:

- [AngularJS](https://angularjs.org/)
- [Angular Material](https://material.angularjs.org/latest/)
- [UnderscoreJS](http://underscorejs.org/)
- [ZipJS](http://gildas-lormeau.github.io/zip.js/)
- [RecorderJS](https://github.com/mattdiamond/Recorderjs)
- [WavesurferJS](http://wavesurfer-js.org/) (copyright: [CC3.0 BY](https://creativecommons.org/licenses/by/3.0/deed.en_US))
- PapaParse, Angular-indexedDB, Angular-resizable, Angular-route, Angular-translate, Ng-prettyjson, Keypress, Any-resize-event
