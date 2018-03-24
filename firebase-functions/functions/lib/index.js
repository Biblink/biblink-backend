"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const gcs = require('@google-cloud/storage')({ keyFilename: 'admin_key.json' });
const spawn = require('child-process-promise').spawn;
const Fuzzy = require("fuzzyset.js");
//admin account creation so the function can modify the database
const adminAccount = require('../admin_key.json');
admin.initializeApp({
    credential: admin.credential.cert(adminAccount),
    databaseURL: 'https://biblya-ed2ec.firebaseio.com/'
});
//opens the database with the admin account
const db = admin.firestore();
//this function updates the name of study leaders
exports.updateLeaderName = functions.firestore.document('users/{userId}').onUpdate((event) => {
    //grabs updated name value
    const updatedValue = event.data.data();
    const name = updatedValue.name;
    const userId = event.params.userId;
    //finds which studies the user is a leader in
    const userStudies = db.collection('users')
        .doc(userId)
        .collection('studies')
        .where('role', '==', 'leader')
        .get()
        .then(snapshot => {
        const studyIds = [];
        snapshot.forEach(doc => {
            studyIds.push(doc.id);
        });
        return studyIds; //returns the Ids for those studies
    })
        .catch(err => {
        console.log(err);
        return undefined;
    });
    //if the person is not a leader in any studies, it returns an informative message in the block below
    return userStudies.then(studyIds => {
        if (studyIds === undefined)
            return 'person is not a leader in any studies';
        else {
            const studiesRef = db.collection('studies'); //this block iterates through every study where the user is a leader, and changes the leader property to the new name
            studyIds.forEach(ID => {
                const metadata = studiesRef.doc(ID).get().then(snapshot => {
                    const studyMeta = snapshot.data()['metadata'];
                    studyMeta['leader'] = name;
                    const updataMetaData = studiesRef.doc(ID).update({ metadata: studyMeta });
                });
            });
            return `updated studies with leader: ${name}`;
        }
    });
});
/**
 * The code below was copied from : https://github.com/firebase/functions-samples/blob/master/generate-thumbnail/functions/index.js
 * And edited slightly to match our project
 */
// const THUMB_MAX_HEIGHT = 200;
// const THUMB_MAX_WIDTH = 200;
// const THUMB_PREFIX = 'thumb_';
// exports.generateThumbnail = functions.storage.object().onChange((event) => {
//     const filePath = event.data.name;
//     const contentType = event.data.contentType;
//     const fileDir = path.dirname(filePath);
//     const fileName = path.basename(filePath);
//     const info = fileName.split('-')[ 1 ].split('_');
//     const id = info[ 0 ];
//     const isGroup = info[ 1 ] === 'true';
//     const imageType = info[ 2 ];
//     const thumbFilePath = path.normalize(path.join(fileDir, `${ THUMB_PREFIX }${ fileName }`));
//     const tempLocalFile = path.join(os.tmpdir(), filePath);
//     const tempLocalDir = path.dirname(tempLocalFile);
//     const tempLocalThumbFile = path.join(os.tmpdir(), thumbFilePath);
//     if (isGroup && imageType === 'banner') {
//         return null;
//     }
//     if (!contentType.startsWith('image/')) {
//         console.log('This is not an image.');
//         return null;
//     }
//     if (fileName.startsWith(THUMB_PREFIX)) {
//         console.log('Already a Thumbnail.');
//         return null;
//     }
//     if (event.data.resourceState === 'not_exists') {
//         console.log('This is a deletion event.');
//         return null;
//     }
//     const bucket = gcs.bucket(event.data.bucket);
//     const file = bucket.file(filePath);
//     const thumbFile = bucket.file(thumbFilePath);
//     const metadata = { contentType: contentType };
//     return mkdirp(tempLocalDir).then(() => {
//         return file.download({ destination: tempLocalFile });
//     }).then(() => {
//         console.log('The file has been downloaded to', tempLocalFile);
//         return spawn('convert', [ tempLocalFile, '-thumbnail', `${ THUMB_MAX_WIDTH }x${ THUMB_MAX_HEIGHT }>`, tempLocalThumbFile ], { capture: [ 'stdout', 'stderr' ] });
//     }).then(() => {
//         console.log('Thumbnail created at', tempLocalThumbFile);
//         return bucket.upload(tempLocalThumbFile, { destination: thumbFilePath, metadata: metadata });
//     }).then(() => {
//         console.log('Thumbnail uploaded to Storage at', thumbFilePath);
//         fs.unlinkSync(tempLocalFile);
//         fs.unlinkSync(tempLocalThumbFile);
//         const config = {
//             action: 'read',
//             expires: '03-01-2500',
//         };
//         return Promise.all([
//             thumbFile.getSignedUrl(config),
//             file.getSignedUrl(config),
//         ]);
//     }).then((results) => {
//         console.log('Got Signed URLs.');
//         const thumbResult = results[ 0 ];
//         const originalResult = results[ 1 ];
//         const thumbFileUrl = thumbResult[ 0 ];
//         const fileUrl = originalResult[ 0 ];
//         if (isGroup) {
//             return db.collection('studies').doc(id).get().then((res) => {
//                 const data = res.data()[ 'metadata' ]
//                 data[ 'profileImage' ] = thumbFileUrl;
//                 return db.collection('studies').doc(id).update({ 'metadata': data });
//             });
//         } else {
//             console.log(id);
//             return db.collection('users').doc(id).get().then(res => {
//                 const data = res.data()[ 'data' ]
//                 data[ 'profileImage' ] = thumbFileUrl;
//                 return db.collection('users').doc(id).update({ 'data': data });
//             });
//         }
//     }).then(() => console.log('Thumbnail URLs saved to database.'));
// });
// (www.|https:)?([\S]+)([.]{1})([\w]{1,4})
// (Song)?\s?(of)?\s(Solomon)?(\d\s)?([\w.]+)\s+([\d:,-\s;]+)
const httpRGX = /(https:|http:)+(\/\/)+/g;
function anchorify(match) {
    const httpTest = httpRGX.test(match);
    if (match.indexOf('</a>') !== -1) {
        return match;
    }
    if (httpTest === true) {
        const anchor = `<a class="more-link" href="${match}">${match}</a>`;
        return anchor;
    }
    else {
        const updateMatch = 'https://'.concat(match);
        const anchor = `<a class="more-link" target="_blank" href="${updateMatch}">${match}</a>`;
        return anchor;
    }
}
const bookList = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
    '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
    'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians',
    '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', ' Revelation'];
function spanify(match) {
    const fuzzySet = Fuzzy(bookList, true, 4, 4);
    const fuzzyMatchs = fuzzySet.get(match, .30);
    const topMatch = fuzzyMatchs[0];
    const reference = match.trim().split(' ')[1].trim();
    console.log(reference);
    const bookName = topMatch[1];
    const span = `<span (mouseenter)="getVerse(${bookName.trim()} ${reference})">${bookName.trim()} ${reference}</span>`;
    return span;
}
exports.postRegex = functions.firestore.document('studies/{studyId}/posts/{postId}').onWrite((event) => {
    if (!event.data.exists) {
        return null;
    }
    const data = event.data.data();
    let postText = data['text'];
    const now = new Date().getTime();
    if (data.lastUpdated !== undefined && data.lastUpdated > now - (2000)) {
        return null;
    }
    postText = postText.replace(/(www.|https:|http:)?([\S]+)([.]{1})([\w]{1,4})/g, anchorify);
    postText = postText.replace(/(Song)?\s?(of)?\s(Solomon)?(\d\s)?([\w.]+)\s+([\d:,-\s;]+)/g, spanify);
    return event.data.ref.update({ htmlText: postText, lastUpdated: now });
});
exports.replyRegex = functions.firestore.document('studies/{studyId}/posts/{postId}/replies/{replyId}').onWrite((event) => {
    if (!event.data.exists) {
        return null;
    }
    const data = event.data.data();
    let replyText = data['text'];
    const now = new Date().getTime();
    if (data.lastUpdated !== undefined && data.lastUpdated > now - (2000)) {
        return;
    }
    replyText = replyText.replace(/(www.|https:|http:)?([\S]+)([.]{1})([\w]{1,4})/g, anchorify);
    replyText = replyText.replace(/(Song)?\s?(of)?\s(Solomon)?(\d\s)?([\w.]+)\s+([\d:,-\s;]+)/g, spanify);
    return event.data.ref.update({ htmlText: replyText, lastUpdated: now });
});
exports.subreplyRegex = functions.firestore.document('studies/{studyId}/posts/{postId}/replies/{replyId}/subreplies/{subreplyId}').onWrite((event) => {
    if (!event.data.exists) {
        return null;
    }
    const data = event.data.data();
    let subreplyText = data['text'];
    const now = new Date().getTime();
    if (data.lastUpdated !== undefined && data.lastUpdated > now - (2000)) {
        return;
    }
    subreplyText = subreplyText.replace(/(www.|https:|http:)?([\S]+)([.]{1})([\w]{1,4})/g, anchorify);
    subreplyText = subreplyText.replace(/(Song)?\s?(of)?\s(Solomon)?(\d\s)?([\w.]+)\s+([\d:,-\s;]+)/g, spanify);
    return event.data.ref.update({ htmlText: subreplyText, lastUpdated: now });
});
//# sourceMappingURL=index.js.map